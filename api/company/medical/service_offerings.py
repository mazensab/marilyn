from __future__ import annotations
from decimal import Decimal, InvalidOperation
from math import ceil
from typing import Any
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response
from api.permissions import HasAnyCompanyPermission
from catalog.models import CatalogItem
from companies.models import Branch
from medical.models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalServiceOffering,
    MedicalServiceOfferingStatus,
    MedicalSpecialty,
)
from .practitioners import (
    company_or_error,
    ensure_permission,
)
VIEW_PERMISSION = "medical.view_medicalserviceoffering"
CREATE_PERMISSION = "medical.add_medicalserviceoffering"
UPDATE_PERMISSION = "medical.change_medicalserviceoffering"
STATUS_PERMISSION = UPDATE_PERMISSION
ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]
VALID_STATUS_VALUES = {
    value
    for value, _label in (
        MedicalServiceOfferingStatus.choices
    )
}
ORDERING_MAP = {
    "id": "id",
    "-id": "-id",
    "service": "catalog_item__name",
    "-service": "-catalog_item__name",
    "branch": "branch__name",
    "-branch": "-branch__name",
    "clinic": "clinic__name_ar",
    "-clinic": "-clinic__name_ar",
    "duration": "duration_minutes",
    "-duration": "-duration_minutes",
    "created_at": "created_at",
    "-created_at": "-created_at",
    "updated_at": "updated_at",
    "-updated_at": "-updated_at",
}
def iso_value(value):
    if value is None:
        return None
    return value.isoformat()
def object_name(value) -> str:
    for field_name in (
        "name",
        "name_ar",
        "name_en",
        "display_name",
    ):
        result = getattr(
            value,
            field_name,
            "",
        )
        if result:
            return str(result)
    return str(value)
def serialize_related(value) -> dict[str, Any]:
    return {
        "id": value.id,
        "code": getattr(value, "code", ""),
        "name": object_name(value),
        "name_ar": getattr(value, "name_ar", ""),
        "name_en": getattr(value, "name_en", ""),
    }
def serialize_catalog_item(
    item: CatalogItem,
) -> dict[str, Any]:
    return {
        "id": item.id,
        "company_id": item.company_id,
        "category_id": item.category_id,
        "unit_id": item.unit_id,
        "item_type": item.item_type,
        "status": item.status,
        "code": item.code,
        "sku": item.sku,
        "barcode": item.barcode,
        "name": item.name,
        "name_ar": item.name_ar,
        "name_en": item.name_en,
        "description": item.description,
        "sale_price": str(item.sale_price),
        "taxable": item.taxable,
        "tax_rate": str(item.tax_rate),
        "is_sellable": item.is_sellable,
    }
def serialize_offering(
    offering: MedicalServiceOffering,
) -> dict[str, Any]:
    return {
        "id": offering.id,
        "company_id": offering.company_id,
        "catalog_item_id": offering.catalog_item_id,
        "catalog_item": serialize_catalog_item(
            offering.catalog_item
        ),
        "branch_id": offering.branch_id,
        "branch": serialize_related(offering.branch),
        "department_id": offering.department_id,
        "department": serialize_related(
            offering.department
        ),
        "specialty_id": offering.specialty_id,
        "specialty": serialize_related(
            offering.specialty
        ),
        "clinic_id": offering.clinic_id,
        "clinic": serialize_related(offering.clinic),
        "status": offering.status,
        "duration_minutes": offering.duration_minutes,
        "buffer_before_minutes": (
            offering.buffer_before_minutes
        ),
        "buffer_after_minutes": (
            offering.buffer_after_minutes
        ),
        "total_slot_minutes": (
            offering.total_slot_minutes
        ),
        "sale_price_override": (
            str(offering.sale_price_override)
            if offering.sale_price_override
            is not None
            else None
        ),
        "effective_sale_price": str(
            offering.effective_sale_price
        ),
        "taxable": offering.catalog_item.taxable,
        "tax_rate": str(
            offering.catalog_item.tax_rate
        ),
        "default_session_count": (
            offering.default_session_count
        ),
        "online_booking_enabled": (
            offering.online_booking_enabled
        ),
        "requires_approval": offering.requires_approval,
        "requires_preparation": (
            offering.requires_preparation
        ),
        "preparation_instructions": (
            offering.preparation_instructions
        ),
        "is_active_offering": (
            offering.is_active_offering
        ),
        "notes": offering.notes,
        "extra_data": offering.extra_data or {},
        "created_by_id": offering.created_by_id,
        "updated_by_id": offering.updated_by_id,
        "created_at": iso_value(offering.created_at),
        "updated_at": iso_value(offering.updated_at),
    }
def validation_payload(
    error: ValidationError,
) -> dict[str, list[str]]:
    if hasattr(error, "message_dict"):
        return {
            key: [
                str(item)
                for item in values
            ]
            for key, values in (
                error.message_dict.items()
            )
        }
    return {
        "non_field_errors": [
            str(item)
            for item in error.messages
        ]
    }
def parse_integer(
    value,
    field_name: str,
    *,
    minimum: int = 1,
) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: [
                    "Provide a valid integer value."
                ]
            }
        )
    if parsed < minimum:
        raise ValidationError(
            {
                field_name: [
                    (
                        f"Value must be at least "
                        f"{minimum}."
                    )
                ]
            }
        )
    return parsed
def parse_decimal(
    value,
    field_name: str,
    *,
    allow_none: bool = False,
):
    if value in {None, ""}:
        if allow_none:
            return None
        raise ValidationError(
            {
                field_name: [
                    "This value is required."
                ]
            }
        )
    try:
        parsed = Decimal(str(value))
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        raise ValidationError(
            {
                field_name: [
                    "Provide a valid decimal value."
                ]
            }
        )
    if parsed < Decimal("0.00"):
        raise ValidationError(
            {
                field_name: [
                    "Value cannot be negative."
                ]
            }
        )
    return parsed
def parse_bool(
    value,
    field_name: str,
) -> bool:
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {
        "1",
        "true",
        "yes",
        "on",
    }:
        return True
    if normalized in {
        "0",
        "false",
        "no",
        "off",
    }:
        return False
    raise ValidationError(
        {
            field_name: [
                "Provide a valid boolean value."
            ]
        }
    )
def parse_json_object(
    value,
    field_name: str,
) -> dict[str, Any]:
    if value is None or value == "":
        return {}
    if not isinstance(value, dict):
        raise ValidationError(
            {
                field_name: [
                    "Provide a valid JSON object."
                ]
            }
        )
    return value
def offering_queryset(company):
    return (
        MedicalServiceOffering.objects
        .filter(company=company)
        .select_related(
            "company",
            "catalog_item",
            "branch",
            "department",
            "specialty",
            "clinic",
            "created_by",
            "updated_by",
        )
    )
def resolve_catalog_item(
    company,
    value,
) -> CatalogItem:
    item_id = parse_integer(
        value,
        "catalog_item_id",
    )
    item = CatalogItem.objects.filter(
        company=company,
        id=item_id,
        item_type="SERVICE",
    ).first()
    if item is None:
        raise ValidationError(
            {
                "catalog_item_id": [
                    (
                        "Medical service was not found "
                        "for the current company."
                    )
                ]
            }
        )
    return item
def resolve_branch(company, value) -> Branch:
    branch_id = parse_integer(
        value,
        "branch_id",
    )
    branch = Branch.objects.filter(
        company=company,
        id=branch_id,
    ).first()
    if branch is None:
        raise ValidationError(
            {
                "branch_id": [
                    (
                        "Branch was not found for the "
                        "current company."
                    )
                ]
            }
        )
    return branch
def resolve_department(
    company,
    value,
) -> MedicalDepartment:
    department_id = parse_integer(
        value,
        "department_id",
    )
    department = MedicalDepartment.objects.filter(
        company=company,
        id=department_id,
    ).first()
    if department is None:
        raise ValidationError(
            {
                "department_id": [
                    (
                        "Department was not found for "
                        "the current company."
                    )
                ]
            }
        )
    return department
def resolve_specialty(
    company,
    value,
) -> MedicalSpecialty:
    specialty_id = parse_integer(
        value,
        "specialty_id",
    )
    specialty = MedicalSpecialty.objects.filter(
        Q(company=company)
        | Q(company__isnull=True),
        id=specialty_id,
    ).first()
    if specialty is None:
        raise ValidationError(
            {
                "specialty_id": [
                    (
                        "Specialty was not found for "
                        "the current company."
                    )
                ]
            }
        )
    return specialty
def resolve_clinic(
    company,
    value,
) -> MedicalClinic:
    clinic_id = parse_integer(
        value,
        "clinic_id",
    )
    clinic = MedicalClinic.objects.filter(
        company=company,
        id=clinic_id,
    ).first()
    if clinic is None:
        raise ValidationError(
            {
                "clinic_id": [
                    (
                        "Clinic was not found for the "
                        "current company."
                    )
                ]
            }
        )
    return clinic
def apply_payload(
    *,
    offering: MedicalServiceOffering,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalServiceOffering:
    relation_resolvers = {
        "catalog_item_id": (
            "catalog_item",
            resolve_catalog_item,
        ),
        "branch_id": (
            "branch",
            resolve_branch,
        ),
        "department_id": (
            "department",
            resolve_department,
        ),
        "specialty_id": (
            "specialty",
            resolve_specialty,
        ),
        "clinic_id": (
            "clinic",
            resolve_clinic,
        ),
    }
    for payload_name, (
        attribute,
        resolver,
    ) in relation_resolvers.items():
        if payload_name in payload:
            setattr(
                offering,
                attribute,
                resolver(
                    company,
                    payload.get(payload_name),
                ),
            )
    if "status" in payload:
        offering.status = str(
            payload.get("status") or ""
        ).strip().upper()
    if "duration_minutes" in payload:
        offering.duration_minutes = parse_integer(
            payload.get("duration_minutes"),
            "duration_minutes",
        )
    for field_name in (
        "buffer_before_minutes",
        "buffer_after_minutes",
    ):
        if field_name in payload:
            setattr(
                offering,
                field_name,
                parse_integer(
                    payload.get(field_name),
                    field_name,
                    minimum=0,
                ),
            )
    if "sale_price_override" in payload:
        offering.sale_price_override = parse_decimal(
            payload.get("sale_price_override"),
            "sale_price_override",
            allow_none=True,
        )
    if "default_session_count" in payload:
        offering.default_session_count = (
            parse_integer(
                payload.get(
                    "default_session_count"
                ),
                "default_session_count",
            )
        )
    for field_name in (
        "online_booking_enabled",
        "requires_approval",
        "requires_preparation",
    ):
        if field_name in payload:
            setattr(
                offering,
                field_name,
                parse_bool(
                    payload.get(field_name),
                    field_name,
                ),
            )
    for field_name in (
        "preparation_instructions",
        "notes",
    ):
        if field_name in payload:
            setattr(
                offering,
                field_name,
                str(
                    payload.get(field_name)
                    or ""
                ).strip(),
            )
    if "extra_data" in payload:
        offering.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )
    offering.company = company
    if creating:
        offering.created_by = user
    offering.updated_by = user
    offering.save()
    return offering
def filter_queryset(
    queryset,
    request: Request,
):
    search = str(
        request.query_params.get("search") or ""
    ).strip()
    if search:
        queryset = queryset.filter(
            Q(catalog_item__code__icontains=search)
            | Q(catalog_item__name__icontains=search)
            | Q(
                catalog_item__name_ar__icontains=search
            )
            | Q(
                catalog_item__name_en__icontains=search
            )
            | Q(branch__name__icontains=search)
            | Q(
                department__name_ar__icontains=search
            )
            | Q(
                department__name_en__icontains=search
            )
            | Q(
                specialty__name_ar__icontains=search
            )
            | Q(
                specialty__name_en__icontains=search
            )
            | Q(clinic__name_ar__icontains=search)
            | Q(clinic__name_en__icontains=search)
            | Q(notes__icontains=search)
        )
    status_value = str(
        request.query_params.get("status") or ""
    ).strip().upper()
    if status_value:
        if status_value not in VALID_STATUS_VALUES:
            raise ValidationError(
                {
                    "status": [
                        "Invalid offering status."
                    ]
                }
            )
        queryset = queryset.filter(
            status=status_value
        )
    for field_name in (
        "catalog_item_id",
        "branch_id",
        "department_id",
        "specialty_id",
        "clinic_id",
    ):
        value = request.query_params.get(
            field_name
        )
        if value not in {None, ""}:
            queryset = queryset.filter(
                **{
                    field_name: parse_integer(
                        value,
                        field_name,
                    )
                }
            )
    for field_name in (
        "online_booking_enabled",
        "requires_approval",
        "requires_preparation",
    ):
        value = request.query_params.get(
            field_name
        )
        if value not in {None, ""}:
            queryset = queryset.filter(
                **{
                    field_name: parse_bool(
                        value,
                        field_name,
                    )
                }
            )
    ordering = str(
        request.query_params.get("ordering") or ""
    ).strip()
    if ordering:
        mapped = ORDERING_MAP.get(ordering)
        if mapped is None:
            raise ValidationError(
                {
                    "ordering": [
                        "Invalid ordering value."
                    ]
                }
            )
        queryset = queryset.order_by(
            mapped,
            "id",
        )
    return queryset
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def service_offering_collection(
    request: Request,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_PERMISSION
        if request.method == "GET"
        else CREATE_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    if request.method == "GET":
        try:
            queryset = filter_queryset(
                offering_queryset(company),
                request,
            )
            page = parse_integer(
                request.query_params.get(
                    "page",
                    1,
                ),
                "page",
            )
            page_size = min(
                parse_integer(
                    request.query_params.get(
                        "page_size",
                        100,
                    ),
                    "page_size",
                ),
                200,
            )
        except ValidationError as error:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Service offering filters "
                        "are invalid."
                    ),
                    "errors": validation_payload(error),
                    "valid_statuses": sorted(
                        VALID_STATUS_VALUES
                    ),
                    "valid_ordering": sorted(
                        ORDERING_MAP
                    ),
                },
                status=400,
            )
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = [
            serialize_offering(item)
            for item in queryset[start:end]
        ]
        return Response(
            {
                "success": True,
                "count": total,
                "page": page,
                "page_size": page_size,
                "pages": (
                    ceil(total / page_size)
                    if total
                    else 0
                ),
                "items": items,
                "service_offerings": items,
            }
        )
    try:
        with transaction.atomic():
            offering = apply_payload(
                offering=MedicalServiceOffering(
                    company=company
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        offering = offering_queryset(
            company
        ).get(id=offering.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Medical service offering "
                    "created successfully."
                ),
                "item": serialize_offering(
                    offering
                ),
            },
            status=201,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical service offering data "
                    "is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting medical service "
                    "offering already exists."
                ),
            },
            status=400,
        )
service_offering_collection.required_company_permissions = (
    ALL_PERMISSIONS
)
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def service_offering_detail(
    request: Request,
    offering_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_PERMISSION
        if request.method == "GET"
        else UPDATE_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    offering = offering_queryset(company).filter(
        id=offering_id
    ).first()
    if offering is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical service offering "
                    "was not found."
                ),
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_offering(
                    offering
                ),
            }
        )
    try:
        with transaction.atomic():
            offering = apply_payload(
                offering=offering,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        offering = offering_queryset(
            company
        ).get(id=offering.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Medical service offering "
                    "updated successfully."
                ),
                "item": serialize_offering(
                    offering
                ),
            }
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical service offering data "
                    "is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting medical service "
                    "offering already exists."
                ),
            },
            status=400,
        )
service_offering_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]
@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def service_offering_status(
    request: Request,
    offering_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission_error = ensure_permission(
        request,
        STATUS_PERMISSION,
    )
    if permission_error:
        return permission_error
    offering = offering_queryset(company).filter(
        id=offering_id
    ).first()
    if offering is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical service offering "
                    "was not found."
                ),
            },
            status=404,
        )
    action = str(
        request.data.get("action") or ""
    ).strip().lower()
    requested_status = request.data.get("status")
    action_map = {
        "activate": "ACTIVE",
        "active": "ACTIVE",
        "deactivate": "INACTIVE",
        "inactive": "INACTIVE",
        "archive": "ARCHIVED",
        "archived": "ARCHIVED",
    }
    new_status = (
        str(requested_status).strip().upper()
        if requested_status not in {None, ""}
        else action_map.get(action)
    )
    if new_status not in VALID_STATUS_VALUES:
        return Response(
            {
                "success": False,
                "message": (
                    "Provide a valid medical "
                    "service offering status."
                ),
                "valid_statuses": sorted(
                    VALID_STATUS_VALUES
                ),
            },
            status=400,
        )
    offering.status = new_status
    offering.updated_by = request.user
    try:
        offering.save()
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical service offering status "
                    "is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
    offering = offering_queryset(
        company
    ).get(id=offering.id)
    return Response(
        {
            "success": True,
            "message": (
                "Medical service offering status "
                "updated successfully."
            ),
            "item": serialize_offering(offering),
        }
    )
service_offering_status.required_company_permissions = [
    STATUS_PERMISSION,
]
