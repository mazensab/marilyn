from __future__ import annotations
from datetime import date
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
from medical.models import (
    MedicalPractitionerAssignment,
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerServiceAssignmentStatus,
    MedicalServiceOffering,
)
from .practitioners import (
    company_or_error,
    ensure_permission,
)
from .service_offerings import (
    serialize_offering,
)
VIEW_PERMISSION = (
    "medical."
    "view_medicalpractitionerserviceassignment"
)
CREATE_PERMISSION = (
    "medical."
    "add_medicalpractitionerserviceassignment"
)
UPDATE_PERMISSION = (
    "medical."
    "change_medicalpractitionerserviceassignment"
)
STATUS_PERMISSION = UPDATE_PERMISSION
ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]
VALID_STATUS_VALUES = {
    value
    for value, _label in (
        MedicalPractitionerServiceAssignmentStatus
        .choices
    )
}
ORDERING_MAP = {
    "id": "id",
    "-id": "-id",
    "practitioner": (
        "practitioner_assignment__"
        "practitioner__full_name_en"
    ),
    "-practitioner": (
        "-practitioner_assignment__"
        "practitioner__full_name_en"
    ),
    "service": (
        "service_offering__catalog_item__name"
    ),
    "-service": (
        "-service_offering__catalog_item__name"
    ),
    "branch": (
        "practitioner_assignment__branch__name"
    ),
    "-branch": (
        "-practitioner_assignment__branch__name"
    ),
    "duration": "duration_override_minutes",
    "-duration": "-duration_override_minutes",
    "effective_from": "effective_from",
    "-effective_from": "-effective_from",
    "created_at": "created_at",
    "-created_at": "-created_at",
    "updated_at": "updated_at",
    "-updated_at": "-updated_at",
}
def iso_value(value):
    if value is None:
        return None
    return value.isoformat()
def related_name(value) -> str:
    for field_name in (
        "name",
        "name_ar",
        "name_en",
        "full_name_ar",
        "full_name_en",
    ):
        result = getattr(
            value,
            field_name,
            "",
        )
        if result:
            return str(result)
    return str(value)
def serialize_related(
    value,
) -> dict[str, Any] | None:
    if value is None:
        return None
    return {
        "id": value.id,
        "code": getattr(value, "code", ""),
        "name": related_name(value),
        "name_ar": getattr(value, "name_ar", ""),
        "name_en": getattr(value, "name_en", ""),
    }
def serialize_practitioner(
    practitioner,
) -> dict[str, Any]:
    return {
        "id": practitioner.id,
        "company_id": practitioner.company_id,
        "practitioner_number": (
            practitioner.practitioner_number
        ),
        "full_name_ar": practitioner.full_name_ar,
        "full_name_en": practitioner.full_name_en,
        "professional_title": (
            practitioner.professional_title
        ),
        "status": practitioner.status,
        "is_accepting_appointments": (
            practitioner.is_accepting_appointments
        ),
    }
def serialize_location_assignment(
    assignment: MedicalPractitionerAssignment,
) -> dict[str, Any]:
    return {
        "id": assignment.id,
        "company_id": assignment.company_id,
        "practitioner_id": (
            assignment.practitioner_id
        ),
        "branch_id": assignment.branch_id,
        "branch": serialize_related(
            assignment.branch
        ),
        "department_id": assignment.department_id,
        "department": serialize_related(
            assignment.department
        ),
        "clinic_id": assignment.clinic_id,
        "clinic": serialize_related(
            assignment.clinic
        ),
        "is_primary": assignment.is_primary,
        "is_active": assignment.is_active,
        "start_date": iso_value(
            assignment.start_date
        ),
        "end_date": iso_value(
            assignment.end_date
        ),
    }
def serialize_assignment(
    item: MedicalPractitionerServiceAssignment,
) -> dict[str, Any]:
    return {
        "id": item.id,
        "company_id": item.company_id,
        "practitioner_assignment_id": (
            item.practitioner_assignment_id
        ),
        "practitioner_id": item.practitioner_id,
        "practitioner": serialize_practitioner(
            item.practitioner
        ),
        "practitioner_assignment": (
            serialize_location_assignment(
                item.practitioner_assignment
            )
        ),
        "service_offering_id": (
            item.service_offering_id
        ),
        "service_offering": serialize_offering(
            item.service_offering
        ),
        "status": item.status,
        "duration_override_minutes": (
            item.duration_override_minutes
        ),
        "effective_duration_minutes": (
            item.effective_duration_minutes
        ),
        "online_booking_enabled": (
            item.online_booking_enabled
        ),
        "effective_online_booking_enabled": (
            item.effective_online_booking_enabled
        ),
        "total_slot_minutes": (
            item.total_slot_minutes
        ),
        "effective_from": iso_value(
            item.effective_from
        ),
        "effective_until": iso_value(
            item.effective_until
        ),
        "is_active_service_assignment": (
            item.is_active_service_assignment
        ),
        "notes": item.notes,
        "extra_data": item.extra_data or {},
        "created_by_id": item.created_by_id,
        "updated_by_id": item.updated_by_id,
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
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
def parse_optional_integer(
    value,
    field_name: str,
):
    if value is None or value == "":
        return None
    return parse_integer(
        value,
        field_name,
    )
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
def parse_optional_bool(
    value,
    field_name: str,
):
    if value is None or value == "":
        return None
    return parse_bool(
        value,
        field_name,
    )
def parse_date(
    value,
    field_name: str,
):
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(
            str(value).strip()
        )
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: [
                    (
                        "Provide a valid ISO date "
                        "in YYYY-MM-DD format."
                    )
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
def assignment_queryset(company):
    return (
        MedicalPractitionerServiceAssignment
        .objects
        .filter(company=company)
        .select_related(
            "company",
            "practitioner_assignment",
            (
                "practitioner_assignment__"
                "practitioner"
            ),
            "practitioner_assignment__branch",
            "practitioner_assignment__department",
            "practitioner_assignment__clinic",
            "service_offering",
            "service_offering__catalog_item",
            "service_offering__branch",
            "service_offering__department",
            "service_offering__specialty",
            "service_offering__clinic",
            "created_by",
            "updated_by",
        )
    )
def resolve_practitioner_assignment(
    company,
    value,
) -> MedicalPractitionerAssignment:
    assignment_id = parse_integer(
        value,
        "practitioner_assignment_id",
    )
    assignment = (
        MedicalPractitionerAssignment.objects
        .filter(
            company=company,
            id=assignment_id,
        )
        .select_related(
            "practitioner",
            "branch",
            "department",
            "clinic",
        )
        .first()
    )
    if assignment is None:
        raise ValidationError(
            {
                "practitioner_assignment_id": [
                    (
                        "Practitioner assignment was "
                        "not found for the current "
                        "company."
                    )
                ]
            }
        )
    return assignment
def resolve_service_offering(
    company,
    value,
) -> MedicalServiceOffering:
    offering_id = parse_integer(
        value,
        "service_offering_id",
    )
    offering = (
        MedicalServiceOffering.objects
        .filter(
            company=company,
            id=offering_id,
        )
        .select_related(
            "catalog_item",
            "branch",
            "department",
            "specialty",
            "clinic",
        )
        .first()
    )
    if offering is None:
        raise ValidationError(
            {
                "service_offering_id": [
                    (
                        "Medical service offering was "
                        "not found for the current "
                        "company."
                    )
                ]
            }
        )
    return offering
def apply_payload(
    *,
    item: MedicalPractitionerServiceAssignment,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalPractitionerServiceAssignment:
    if (
        creating
        and "practitioner_assignment_id"
        not in payload
    ):
        raise ValidationError(
            {
                "practitioner_assignment_id": [
                    "This field is required."
                ]
            }
        )
    if (
        creating
        and "service_offering_id"
        not in payload
    ):
        raise ValidationError(
            {
                "service_offering_id": [
                    "This field is required."
                ]
            }
        )
    if "practitioner_assignment_id" in payload:
        item.practitioner_assignment = (
            resolve_practitioner_assignment(
                company,
                payload.get(
                    "practitioner_assignment_id"
                ),
            )
        )
    if "service_offering_id" in payload:
        item.service_offering = (
            resolve_service_offering(
                company,
                payload.get(
                    "service_offering_id"
                ),
            )
        )
    if "status" in payload:
        status_value = str(
            payload.get("status") or ""
        ).strip().upper()
        if status_value not in VALID_STATUS_VALUES:
            raise ValidationError(
                {
                    "status": [
                        (
                            "Unsupported practitioner "
                            "service assignment status."
                        )
                    ]
                }
            )
        item.status = status_value
    if "duration_override_minutes" in payload:
        item.duration_override_minutes = (
            parse_optional_integer(
                payload.get(
                    "duration_override_minutes"
                ),
                "duration_override_minutes",
            )
        )
    if "online_booking_enabled" in payload:
        item.online_booking_enabled = (
            parse_optional_bool(
                payload.get(
                    "online_booking_enabled"
                ),
                "online_booking_enabled",
            )
        )
    if "effective_from" in payload:
        item.effective_from = parse_date(
            payload.get("effective_from"),
            "effective_from",
        )
    if "effective_until" in payload:
        item.effective_until = parse_date(
            payload.get("effective_until"),
            "effective_until",
        )
    if "notes" in payload:
        item.notes = str(
            payload.get("notes") or ""
        ).strip()
    if "extra_data" in payload:
        item.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )
    item.company = company
    if creating:
        item.created_by = user
    item.updated_by = user
    item.save()
    return item
def apply_filters(
    queryset,
    request: Request,
):
    search = str(
        request.query_params.get("search") or ""
    ).strip()
    if search:
        search_fields = (
            (
                "practitioner_assignment__"
                "practitioner__"
                "practitioner_number__icontains"
            ),
            (
                "practitioner_assignment__"
                "practitioner__"
                "full_name_ar__icontains"
            ),
            (
                "practitioner_assignment__"
                "practitioner__"
                "full_name_en__icontains"
            ),
            (
                "service_offering__"
                "catalog_item__"
                "code__icontains"
            ),
            (
                "service_offering__"
                "catalog_item__"
                "name__icontains"
            ),
            (
                "service_offering__"
                "catalog_item__"
                "name_ar__icontains"
            ),
            (
                "service_offering__"
                "catalog_item__"
                "name_en__icontains"
            ),
            "notes__icontains",
        )
        search_query = Q()
        for field_name in search_fields:
            search_query |= Q(
                **{
                    field_name: search,
                }
            )
        queryset = queryset.filter(
            search_query
        )
    status_value = str(
        request.query_params.get("status") or ""
    ).strip().upper()
    if status_value:
        if status_value not in VALID_STATUS_VALUES:
            raise ValidationError(
                {
                    "status": [
                        (
                            "Invalid practitioner "
                            "service assignment status."
                        )
                    ]
                }
            )
        queryset = queryset.filter(
            status=status_value
        )
    id_filters = {
        "practitioner_id": (
            "practitioner_assignment__"
            "practitioner_id"
        ),
        "practitioner_assignment_id": (
            "practitioner_assignment_id"
        ),
        "service_offering_id": (
            "service_offering_id"
        ),
        "catalog_item_id": (
            "service_offering__catalog_item_id"
        ),
        "branch_id": (
            "practitioner_assignment__branch_id"
        ),
        "department_id": (
            "practitioner_assignment__department_id"
        ),
        "specialty_id": (
            "service_offering__specialty_id"
        ),
        "clinic_id": (
            "practitioner_assignment__clinic_id"
        ),
    }
    for query_name, model_field in (
        id_filters.items()
    ):
        value = request.query_params.get(
            query_name
        )
        if value not in {None, ""}:
            queryset = queryset.filter(
                **{
                    model_field: parse_integer(
                        value,
                        query_name,
                    )
                }
            )
    effective_on_value = (
        request.query_params.get("effective_on")
    )
    if effective_on_value not in {None, ""}:
        effective_on = parse_date(
            effective_on_value,
            "effective_on",
        )
        queryset = queryset.filter(
            (
                Q(effective_from__isnull=True)
                | Q(
                    effective_from__lte=effective_on
                )
            ),
            (
                Q(effective_until__isnull=True)
                | Q(
                    effective_until__gte=effective_on
                )
            ),
        )
    effective_booking_filter = None
    booking_value = request.query_params.get(
        "online_booking_enabled"
    )
    if booking_value not in {None, ""}:
        effective_booking_filter = parse_bool(
            booking_value,
            "online_booking_enabled",
        )
    active_filter = None
    active_value = request.query_params.get(
        "is_active"
    )
    if active_value not in {None, ""}:
        active_filter = parse_bool(
            active_value,
            "is_active",
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
    return (
        queryset,
        effective_booking_filter,
        active_filter,
    )
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_service_assignment_collection(
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
            (
                queryset,
                effective_booking_filter,
                active_filter,
            ) = apply_filters(
                assignment_queryset(company),
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
                        "Practitioner service "
                        "assignment filters are invalid."
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
        records = list(queryset)
        if effective_booking_filter is not None:
            records = [
                item
                for item in records
                if (
                    item
                    .effective_online_booking_enabled
                    == effective_booking_filter
                )
            ]
        if active_filter is not None:
            records = [
                item
                for item in records
                if (
                    item.is_active_service_assignment
                    == active_filter
                )
            ]
        total = len(records)
        start = (page - 1) * page_size
        end = start + page_size
        items = [
            serialize_assignment(item)
            for item in records[start:end]
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
                "practitioner_service_assignments": (
                    items
                ),
            }
        )
    try:
        with transaction.atomic():
            item = apply_payload(
                item=(
                    MedicalPractitionerServiceAssignment(
                        company=company
                    )
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        item = assignment_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner service assignment "
                    "created successfully."
                ),
                "item": serialize_assignment(item),
            },
            status=201,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "service assignment already exists."
                ),
            },
            status=400,
        )
practitioner_service_assignment_collection.required_company_permissions = (
    ALL_PERMISSIONS
)
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_service_assignment_detail(
    request: Request,
    assignment_id: int,
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
    item = assignment_queryset(company).filter(
        id=assignment_id
    ).first()
    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "was not found."
                ),
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_assignment(item),
            }
        )
    try:
        with transaction.atomic():
            item = apply_payload(
                item=item,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        item = assignment_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner service assignment "
                    "updated successfully."
                ),
                "item": serialize_assignment(item),
            }
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "service assignment already exists."
                ),
            },
            status=400,
        )
practitioner_service_assignment_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]
@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_service_assignment_status(
    request: Request,
    assignment_id: int,
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
    item = assignment_queryset(company).filter(
        id=assignment_id
    ).first()
    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "was not found."
                ),
            },
            status=404,
        )
    action = str(
        request.data.get("action") or ""
    ).strip().lower()
    requested_status = request.data.get(
        "status"
    )
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
                    "Provide a valid practitioner "
                    "service assignment status."
                ),
                "valid_statuses": sorted(
                    VALID_STATUS_VALUES
                ),
            },
            status=400,
        )
    item.status = new_status
    item.updated_by = request.user
    try:
        item.save()
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "status is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
    item = assignment_queryset(
        company
    ).get(id=item.id)
    return Response(
        {
            "success": True,
            "message": (
                "Practitioner service assignment "
                "status updated successfully."
            ),
            "item": serialize_assignment(item),
        }
    )
practitioner_service_assignment_status.required_company_permissions = [
    STATUS_PERMISSION,
]
