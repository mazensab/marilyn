from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.models import CatalogItem, CatalogItemType
from medical.models import (
    MedicalEncounterStatus,
    MedicalPractitioner,
    MedicalProcedure,
    MedicalProcedureStatus,
)

from .encounters import (
    HasAnyCompanyPermission,
    company_or_error,
    encounter_queryset,
    ensure_permission,
    parse_datetime_value,
    parse_json_object,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicalprocedure"
CREATE_PERMISSION = "medical.add_medicalprocedure"
UPDATE_PERMISSION = "medical.change_medicalprocedure"
STATUS_PERMISSION = UPDATE_PERMISSION

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]

VALID_STATUS_VALUES = set(MedicalProcedureStatus.values)


def procedure_queryset(company, encounter):
    return (
        MedicalProcedure.objects
        .filter(
            company=company,
            encounter=encounter,
        )
        .select_related(
            "encounter",
            "patient",
            "practitioner",
            "catalog_item",
            "created_by",
            "updated_by",
        )
        .order_by(
            "created_at",
            "id",
        )
    )


def serialize_procedure(
    procedure: MedicalProcedure,
) -> dict[str, Any]:
    return {
        "id": procedure.id,
        "company_id": procedure.company_id,
        "encounter_id": procedure.encounter_id,
        "encounter_number": (
            procedure.encounter.encounter_number
        ),
        "patient_id": procedure.patient_id,
        "patient_number": procedure.patient.patient_number,
        "patient_name": procedure.patient.full_name,
        "practitioner_id": procedure.practitioner_id,
        "practitioner_name": (
            str(procedure.practitioner)
            if procedure.practitioner_id
            else ""
        ),
        "catalog_item_id": procedure.catalog_item_id,
        "catalog_item_code": (
            procedure.catalog_item.code
            if procedure.catalog_item_id
            else ""
        ),
        "catalog_item_name": (
            procedure.catalog_item.name
            if procedure.catalog_item_id
            else ""
        ),
        "procedure_code_snapshot": (
            procedure.procedure_code_snapshot
        ),
        "procedure_name_snapshot": (
            procedure.procedure_name_snapshot
        ),
        "status": procedure.status,
        "quantity": str(procedure.quantity),
        "unit_price_snapshot": (
            str(procedure.unit_price_snapshot)
            if procedure.unit_price_snapshot is not None
            else None
        ),
        "performed_at": (
            procedure.performed_at.isoformat()
            if procedure.performed_at
            else None
        ),
        "cancellation_reason": (
            procedure.cancellation_reason
        ),
        "notes": procedure.notes,
        "extra_data": procedure.extra_data,
        "created_by_id": procedure.created_by_id,
        "updated_by_id": procedure.updated_by_id,
        "created_at": procedure.created_at.isoformat(),
        "updated_at": procedure.updated_at.isoformat(),
    }


def parse_integer_id(
    value: Any,
    field_name: str,
) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: (
                    f"{field_name.replace('_', ' ').title()} "
                    "must be an integer."
                )
            }
        )

    if parsed <= 0:
        raise ValidationError(
            {
                field_name: (
                    f"{field_name.replace('_', ' ').title()} "
                    "must be a positive integer."
                )
            }
        )

    return parsed


def parse_decimal_value(
    value: Any,
    field_name: str,
    *,
    allow_none: bool = False,
) -> Decimal | None:
    if value is None or value == "":
        if allow_none:
            return None
        raise ValidationError(
            {
                field_name: (
                    "A decimal value is required."
                )
            }
        )

    try:
        parsed = Decimal(str(value).strip())
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(
            {
                field_name: (
                    "Value must be a valid decimal number."
                )
            }
        )

    if not parsed.is_finite():
        raise ValidationError(
            {
                field_name: (
                    "Value must be a finite decimal number."
                )
            }
        )

    return parsed


def resolve_practitioner(
    *,
    company,
    payload: dict[str, Any],
    current: MedicalPractitioner | None,
) -> MedicalPractitioner | None:
    if "practitioner_id" not in payload:
        return current

    raw_value = payload.get("practitioner_id")

    if raw_value is None or raw_value == "":
        return None

    practitioner_id = parse_integer_id(
        raw_value,
        "practitioner_id",
    )

    practitioner = MedicalPractitioner.objects.filter(
        company=company,
        id=practitioner_id,
    ).first()

    if practitioner is None:
        raise ValidationError(
            {
                "practitioner_id": (
                    "Practitioner was not found for this company."
                )
            }
        )

    return practitioner


def resolve_catalog_item(
    *,
    company,
    payload: dict[str, Any],
    current: CatalogItem | None,
) -> tuple[CatalogItem | None, bool]:
    if "catalog_item_id" not in payload:
        return current, False

    raw_value = payload.get("catalog_item_id")

    if raw_value is None or raw_value == "":
        return None, current is not None

    catalog_item_id = parse_integer_id(
        raw_value,
        "catalog_item_id",
    )

    catalog_item = CatalogItem.objects.filter(
        company=company,
        id=catalog_item_id,
    ).first()

    if catalog_item is None:
        raise ValidationError(
            {
                "catalog_item_id": (
                    "Catalog item was not found for this company."
                )
            }
        )

    if catalog_item.item_type != CatalogItemType.SERVICE:
        raise ValidationError(
            {
                "catalog_item_id": (
                    "Catalog item must be a service."
                )
            }
        )

    changed = (
        current is None
        or current.id != catalog_item.id
    )

    return catalog_item, changed


def apply_payload(
    *,
    procedure: MedicalProcedure,
    encounter,
    company,
    payload: dict[str, Any],
    user,
    creating: bool,
) -> MedicalProcedure:
    ignored_fields = {
        "id",
        "company",
        "company_id",
        "encounter",
        "encounter_id",
        "patient",
        "patient_id",
        "status",
        "performed_at",
        "cancellation_reason",
        "created_by",
        "created_by_id",
        "updated_by",
        "updated_by_id",
        "created_at",
        "updated_at",
    }

    for field_name in ignored_fields:
        payload.pop(field_name, None)

    if creating:
        procedure.company = company
        procedure.encounter = encounter
        procedure.patient = encounter.patient
        procedure.practitioner = encounter.practitioner
        procedure.status = MedicalProcedureStatus.PLANNED
        procedure.created_by = user

    procedure.practitioner = resolve_practitioner(
        company=company,
        payload=payload,
        current=procedure.practitioner,
    )

    catalog_item, catalog_changed = resolve_catalog_item(
        company=company,
        payload=payload,
        current=procedure.catalog_item,
    )
    procedure.catalog_item = catalog_item

    if "procedure_code_snapshot" in payload:
        procedure.procedure_code_snapshot = str(
            payload.get("procedure_code_snapshot") or ""
        )
    elif catalog_changed and catalog_item is not None:
        procedure.procedure_code_snapshot = (
            catalog_item.code or ""
        )

    if "procedure_name_snapshot" in payload:
        procedure.procedure_name_snapshot = str(
            payload.get("procedure_name_snapshot") or ""
        )
    elif catalog_changed and catalog_item is not None:
        procedure.procedure_name_snapshot = (
            catalog_item.name or ""
        )
    elif creating and catalog_item is None:
        procedure.procedure_name_snapshot = ""

    if "quantity" in payload:
        procedure.quantity = parse_decimal_value(
            payload.get("quantity"),
            "quantity",
        )

    if "unit_price_snapshot" in payload:
        procedure.unit_price_snapshot = parse_decimal_value(
            payload.get("unit_price_snapshot"),
            "unit_price_snapshot",
            allow_none=True,
        )
    elif catalog_changed and catalog_item is not None:
        procedure.unit_price_snapshot = (
            catalog_item.sale_price
        )

    if "notes" in payload:
        procedure.notes = str(
            payload.get("notes") or ""
        )

    if "extra_data" in payload:
        procedure.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    procedure.updated_by = user
    procedure.save()
    return procedure


def encounter_is_terminal(encounter) -> bool:
    return encounter.status in {
        MedicalEncounterStatus.COMPLETED,
        MedicalEncounterStatus.CANCELLED,
    }


def terminal_encounter_response() -> Response:
    return Response(
        {
            "success": False,
            "message": (
                "Procedures cannot be changed for a completed "
                "or cancelled encounter."
            ),
        },
        status=400,
    )


def terminal_procedure_response() -> Response:
    return Response(
        {
            "success": False,
            "message": (
                "A completed or cancelled procedure "
                "cannot be edited."
            ),
        },
        status=400,
    )


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def procedure_collection(
    request: Request,
    encounter_id: int,
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

    encounter = encounter_queryset(company).filter(
        id=encounter_id,
    ).first()

    if encounter is None:
        return Response(
            {
                "success": False,
                "message": "Encounter not found.",
            },
            status=404,
        )

    if request.method == "GET":
        queryset = procedure_queryset(
            company,
            encounter,
        )

        search = str(
            request.query_params.get("search") or ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(
                    procedure_code_snapshot__icontains=search
                )
                | Q(
                    procedure_name_snapshot__icontains=search
                )
                | Q(notes__icontains=search)
                | Q(catalog_item__code__icontains=search)
                | Q(catalog_item__name__icontains=search)
            )

        status_value = str(
            request.query_params.get("status") or ""
        ).strip().upper()

        if status_value:
            if status_value not in VALID_STATUS_VALUES:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Procedure filters are invalid."
                        ),
                        "errors": {
                            "status": [
                                "Invalid procedure status."
                            ]
                        },
                        "valid_statuses": sorted(
                            VALID_STATUS_VALUES
                        ),
                    },
                    status=400,
                )

            queryset = queryset.filter(
                status=status_value,
            )

        practitioner_value = request.query_params.get(
            "practitioner_id"
        )
        if practitioner_value not in {None, ""}:
            try:
                practitioner_id = parse_integer_id(
                    practitioner_value,
                    "practitioner_id",
                )
            except ValidationError as exc:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Procedure filters are invalid."
                        ),
                        "errors": validation_payload(exc),
                    },
                    status=400,
                )

            queryset = queryset.filter(
                practitioner_id=practitioner_id,
            )

        catalog_value = request.query_params.get(
            "catalog_item_id"
        )
        if catalog_value not in {None, ""}:
            try:
                catalog_item_id = parse_integer_id(
                    catalog_value,
                    "catalog_item_id",
                )
            except ValidationError as exc:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Procedure filters are invalid."
                        ),
                        "errors": validation_payload(exc),
                    },
                    status=400,
                )

            queryset = queryset.filter(
                catalog_item_id=catalog_item_id,
            )

        items = [
            serialize_procedure(item)
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
            }
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    try:
        with transaction.atomic():
            procedure = apply_payload(
                procedure=MedicalProcedure(),
                encounter=encounter,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        procedure = procedure_queryset(
            company,
            encounter,
        ).get(id=procedure.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Procedure created successfully."
                ),
                "item": serialize_procedure(procedure),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Procedure data is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )

    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting procedure record "
                    "already exists."
                ),
            },
            status=400,
        )


procedure_collection.required_company_permissions = (
    ALL_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def procedure_detail(
    request: Request,
    encounter_id: int,
    procedure_id: int,
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

    encounter = encounter_queryset(company).filter(
        id=encounter_id,
    ).first()

    if encounter is None:
        return Response(
            {
                "success": False,
                "message": "Encounter not found.",
            },
            status=404,
        )

    procedure = procedure_queryset(
        company,
        encounter,
    ).filter(id=procedure_id).first()

    if procedure is None:
        return Response(
            {
                "success": False,
                "message": "Procedure not found.",
            },
            status=404,
        )

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_procedure(procedure),
            }
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    if procedure.status in {
        MedicalProcedureStatus.COMPLETED,
        MedicalProcedureStatus.CANCELLED,
    }:
        return terminal_procedure_response()

    try:
        with transaction.atomic():
            procedure = apply_payload(
                procedure=procedure,
                encounter=encounter,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        procedure = procedure_queryset(
            company,
            encounter,
        ).get(id=procedure.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Procedure updated successfully."
                ),
                "item": serialize_procedure(procedure),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Procedure data is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )

    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting procedure record "
                    "already exists."
                ),
            },
            status=400,
        )


procedure_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


STATUS_TRANSITIONS = {
    MedicalProcedureStatus.PLANNED: {
        MedicalProcedureStatus.IN_PROGRESS,
        MedicalProcedureStatus.COMPLETED,
        MedicalProcedureStatus.CANCELLED,
    },
    MedicalProcedureStatus.IN_PROGRESS: {
        MedicalProcedureStatus.COMPLETED,
        MedicalProcedureStatus.CANCELLED,
    },
    MedicalProcedureStatus.COMPLETED: set(),
    MedicalProcedureStatus.CANCELLED: set(),
}


@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def procedure_status(
    request: Request,
    encounter_id: int,
    procedure_id: int,
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

    encounter = encounter_queryset(company).filter(
        id=encounter_id,
    ).first()

    if encounter is None:
        return Response(
            {
                "success": False,
                "message": "Encounter not found.",
            },
            status=404,
        )

    procedure = procedure_queryset(
        company,
        encounter,
    ).filter(id=procedure_id).first()

    if procedure is None:
        return Response(
            {
                "success": False,
                "message": "Procedure not found.",
            },
            status=404,
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    requested_status = str(
        request.data.get("status") or ""
    ).strip().upper()

    if requested_status not in VALID_STATUS_VALUES:
        return Response(
            {
                "success": False,
                "message": "Invalid procedure status.",
                "valid_statuses": sorted(
                    VALID_STATUS_VALUES
                ),
            },
            status=400,
        )

    allowed = STATUS_TRANSITIONS.get(
        procedure.status,
        set(),
    )

    if requested_status not in allowed:
        return Response(
            {
                "success": False,
                "message": (
                    "The requested procedure status "
                    "transition is not allowed."
                ),
                "current_status": procedure.status,
                "allowed_statuses": sorted(allowed),
            },
            status=400,
        )

    try:
        with transaction.atomic():
            procedure.status = requested_status
            procedure.updated_by = request.user

            if requested_status == MedicalProcedureStatus.COMPLETED:
                if "performed_at" in request.data:
                    procedure.performed_at = (
                        parse_datetime_value(
                            request.data.get("performed_at"),
                            "performed_at",
                        )
                    )
                else:
                    procedure.performed_at = timezone.now()

                procedure.cancellation_reason = ""

            elif requested_status == MedicalProcedureStatus.CANCELLED:
                cancellation_reason = str(
                    request.data.get(
                        "cancellation_reason"
                    )
                    or ""
                ).strip()

                if not cancellation_reason:
                    raise ValidationError(
                        {
                            "cancellation_reason": (
                                "Cancellation reason is required."
                            )
                        }
                    )

                procedure.cancellation_reason = (
                    cancellation_reason
                )

            else:
                procedure.cancellation_reason = ""

            procedure.save()

        procedure = procedure_queryset(
            company,
            encounter,
        ).get(id=procedure.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Procedure status updated successfully."
                ),
                "item": serialize_procedure(procedure),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Procedure status update is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )


procedure_status.required_company_permissions = [
    STATUS_PERMISSION,
]
