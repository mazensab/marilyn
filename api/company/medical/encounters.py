from __future__ import annotations

from datetime import datetime
from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission
from companies.models import Branch
from medical.models import (
    MedicalAppointment,
    MedicalClinic,
    MedicalDepartment,
    MedicalEncounter,
    MedicalEncounterStatus,
    MedicalEncounterType,
    MedicalPatient,
    MedicalPractitioner,
)

from .practitioners import (
    company_or_error,
    ensure_permission,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicalencounter"
CREATE_PERMISSION = "medical.add_medicalencounter"
UPDATE_PERMISSION = "medical.change_medicalencounter"
STATUS_PERMISSION = UPDATE_PERMISSION

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]


def encounter_queryset(company):
    return (
        MedicalEncounter.objects
        .filter(company=company)
        .select_related(
            "appointment",
            "patient",
            "practitioner",
            "branch",
            "department",
            "clinic",
            "opened_by",
            "closed_by",
            "created_by",
            "updated_by",
        )
        .order_by("-opened_at", "-id")
    )


def related_object(obj) -> dict[str, Any] | None:
    if obj is None:
        return None

    code = (
        getattr(obj, "encounter_number", "")
        or getattr(obj, "appointment_number", "")
        or getattr(obj, "patient_number", "")
        or getattr(obj, "practitioner_number", "")
        or getattr(obj, "branch_code", "")
        or getattr(obj, "code", "")
    )
    name = (
        getattr(obj, "display_name", "")
        or getattr(obj, "full_name", "")
        or getattr(obj, "full_name_ar", "")
        or getattr(obj, "full_name_en", "")
        or getattr(obj, "name_ar", "")
        or getattr(obj, "name_en", "")
        or getattr(obj, "name", "")
        or str(obj)
    )

    return {
        "id": obj.id,
        "code": code,
        "name": name,
    }


def user_object(user) -> dict[str, Any] | None:
    if user is None:
        return None

    name = (
        user.get_full_name()
        or user.get_username()
        or str(user)
    )
    return {
        "id": user.id,
        "username": user.get_username(),
        "name": name,
    }


def iso_value(value):
    return value.isoformat() if value is not None else None


def serialize_encounter(
    encounter: MedicalEncounter,
) -> dict[str, Any]:
    return {
        "id": encounter.id,
        "company_id": encounter.company_id,
        "encounter_number": encounter.encounter_number,
        "appointment_id": encounter.appointment_id,
        "appointment": related_object(encounter.appointment),
        "patient_id": encounter.patient_id,
        "patient": related_object(encounter.patient),
        "practitioner_id": encounter.practitioner_id,
        "practitioner": related_object(encounter.practitioner),
        "branch_id": encounter.branch_id,
        "branch": related_object(encounter.branch),
        "department_id": encounter.department_id,
        "department": related_object(encounter.department),
        "clinic_id": encounter.clinic_id,
        "clinic": related_object(encounter.clinic),
        "encounter_type": encounter.encounter_type,
        "status": encounter.status,
        "chief_complaint": encounter.chief_complaint,
        "history_of_present_illness": (
            encounter.history_of_present_illness
        ),
        "clinical_notes": encounter.clinical_notes,
        "treatment_plan": encounter.treatment_plan,
        "follow_up_plan": encounter.follow_up_plan,
        "opened_at": iso_value(encounter.opened_at),
        "closed_at": iso_value(encounter.closed_at),
        "opened_by": user_object(encounter.opened_by),
        "closed_by": user_object(encounter.closed_by),
        "notes": encounter.notes,
        "extra_data": encounter.extra_data or {},
        "created_at": iso_value(encounter.created_at),
        "updated_at": iso_value(encounter.updated_at),
    }


def parse_datetime_value(value, field_name: str):
    if value in [None, ""]:
        return None

    parsed = (
        value
        if isinstance(value, datetime)
        else parse_datetime(str(value))
    )

    if parsed is None:
        raise ValidationError(
            {
                field_name: (
                    "Use a valid ISO 8601 date and time."
                )
            }
        )

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(
            parsed,
            timezone.get_current_timezone(),
        )

    return parsed


def parse_json_object(value, field_name: str) -> dict[str, Any]:
    if value in [None, ""]:
        return {}

    if not isinstance(value, dict):
        raise ValidationError(
            {
                field_name: (
                    "Expected a JSON object."
                )
            }
        )

    return value


def company_object(
    *,
    model,
    company,
    object_id,
    field_name: str,
    required: bool = False,
):
    if object_id in [None, ""]:
        if required:
            raise ValidationError(
                {field_name: "This field is required."}
            )
        return None

    obj = model.objects.filter(
        company=company,
        id=object_id,
    ).first()

    if obj is None:
        raise ValidationError(
            {
                field_name: (
                    "The selected record was not found "
                    "for the current company."
                )
            }
        )

    return obj


def next_encounter_number(company) -> str:
    sequence = (
        MedicalEncounter.objects
        .filter(company=company)
        .count()
        + 1
    )

    while True:
        value = f"ENC-{sequence:06d}"
        exists = MedicalEncounter.objects.filter(
            company=company,
            encounter_number=value,
        ).exists()

        if not exists:
            return value

        sequence += 1


RELATED_MODELS = {
    "appointment_id": (MedicalAppointment, False),
    "patient_id": (MedicalPatient, True),
    "practitioner_id": (MedicalPractitioner, False),
    "branch_id": (Branch, False),
    "department_id": (MedicalDepartment, False),
    "clinic_id": (MedicalClinic, False),
}

TEXT_FIELDS = [
    "chief_complaint",
    "history_of_present_illness",
    "clinical_notes",
    "treatment_plan",
    "follow_up_plan",
    "notes",
]

VALID_TYPE_VALUES = set(MedicalEncounterType.values)
VALID_STATUS_VALUES = set(MedicalEncounterStatus.values)


def apply_payload(
    *,
    encounter: MedicalEncounter,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalEncounter:
    payload.pop("company_id", None)
    payload.pop("company", None)

    encounter.company = company

    appointment = encounter.appointment
    if creating or "appointment_id" in payload:
        appointment = company_object(
            model=MedicalAppointment,
            company=company,
            object_id=payload.get("appointment_id"),
            field_name="appointment_id",
            required=False,
        )
        encounter.appointment = appointment

    linked_defaults = {
        "patient_id": (
            appointment.patient_id
            if appointment is not None
            else None
        ),
        "practitioner_id": (
            appointment.practitioner_id
            if appointment is not None
            else None
        ),
        "branch_id": (
            appointment.branch_id
            if appointment is not None
            else None
        ),
        "department_id": (
            appointment.department_id
            if appointment is not None
            else None
        ),
        "clinic_id": (
            appointment.clinic_id
            if appointment is not None
            else None
        ),
    }

    for field_name, (model, required) in RELATED_MODELS.items():
        if field_name == "appointment_id":
            continue

        if creating or field_name in payload:
            object_id = payload.get(field_name)
            if creating and object_id in [None, ""]:
                object_id = linked_defaults.get(field_name)

            setattr(
                encounter,
                field_name.removesuffix("_id"),
                company_object(
                    model=model,
                    company=company,
                    object_id=object_id,
                    field_name=field_name,
                    required=required,
                ),
            )

    if creating:
        requested_number = str(
            payload.get("encounter_number") or ""
        ).strip().upper()
        encounter.encounter_number = (
            requested_number
            or next_encounter_number(company)
        )

        requested_status = str(
            payload.get("status")
            or MedicalEncounterStatus.DRAFT
        ).strip().upper()

        if requested_status not in {
            MedicalEncounterStatus.DRAFT,
            MedicalEncounterStatus.OPEN,
        }:
            raise ValidationError(
                {
                    "status": (
                        "A new encounter may start only "
                        "as DRAFT or OPEN."
                    )
                }
            )

        encounter.status = requested_status
        encounter.opened_at = (
            parse_datetime_value(
                payload.get("opened_at"),
                "opened_at",
            )
            or timezone.now()
        )
        encounter.opened_by = user
        encounter.created_by = user
    else:
        payload.pop("encounter_number", None)
        payload.pop("status", None)
        payload.pop("opened_at", None)
        payload.pop("closed_at", None)

    if "encounter_type" in payload or creating:
        encounter_type = str(
            payload.get("encounter_type")
            or MedicalEncounterType.CONSULTATION
        ).strip().upper()

        if encounter_type not in VALID_TYPE_VALUES:
            raise ValidationError(
                {
                    "encounter_type": (
                        "Invalid encounter type."
                    )
                }
            )

        encounter.encounter_type = encounter_type

    for field_name in TEXT_FIELDS:
        if field_name in payload or creating:
            setattr(
                encounter,
                field_name,
                str(payload.get(field_name) or "").strip(),
            )

    if "extra_data" in payload or creating:
        encounter.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    encounter.updated_by = user
    encounter.save()
    return encounter


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def encounter_collection(request: Request) -> Response:
    company, error = company_or_error(request)
    if error:
        return error

    permission = (
        VIEW_PERMISSION
        if request.method == "GET"
        else CREATE_PERMISSION
    )
    permission_error = ensure_permission(request, permission)
    if permission_error:
        return permission_error

    if request.method == "GET":
        queryset = encounter_queryset(company)

        query = str(
            request.query_params.get("q") or ""
        ).strip()
        if query:
            queryset = queryset.filter(
                Q(encounter_number__icontains=query)
                | Q(patient__patient_number__icontains=query)
                | Q(patient__full_name__icontains=query)
                | Q(patient__full_name_ar__icontains=query)
                | Q(patient__full_name_en__icontains=query)
                | Q(
                    practitioner__practitioner_number__icontains=query
                )
                | Q(practitioner__full_name__icontains=query)
                | Q(chief_complaint__icontains=query)
            )

        exact_filters = {
            "status": "status",
            "encounter_type": "encounter_type",
            "appointment_id": "appointment_id",
            "patient_id": "patient_id",
            "practitioner_id": "practitioner_id",
            "branch_id": "branch_id",
            "department_id": "department_id",
            "clinic_id": "clinic_id",
        }

        for parameter, field_name in exact_filters.items():
            value = request.query_params.get(parameter)
            if value not in [None, ""]:
                if parameter in {
                    "status",
                    "encounter_type",
                }:
                    value = str(value).strip().upper()

                queryset = queryset.filter(
                    **{field_name: value}
                )

        try:
            opened_from = parse_datetime_value(
                request.query_params.get("opened_from"),
                "opened_from",
            )
            opened_to = parse_datetime_value(
                request.query_params.get("opened_to"),
                "opened_to",
            )
        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Encounter filters are invalid."
                    ),
                    "errors": validation_payload(exc),
                },
                status=400,
            )

        if opened_from:
            queryset = queryset.filter(
                opened_at__gte=opened_from
            )
        if opened_to:
            queryset = queryset.filter(
                opened_at__lte=opened_to
            )

        items = [
            serialize_encounter(item)
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "encounters": items,
            }
        )

    try:
        with transaction.atomic():
            encounter = apply_payload(
                encounter=MedicalEncounter(
                    company=company,
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        encounter = encounter_queryset(
            company
        ).get(id=encounter.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Encounter created successfully."
                ),
                "item": serialize_encounter(encounter),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Encounter data is invalid."
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
                    "A conflicting encounter record "
                    "already exists."
                ),
            },
            status=400,
        )


encounter_collection.required_company_permissions = (
    ALL_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def encounter_detail(
    request: Request,
    encounter_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error

    permission = (
        VIEW_PERMISSION
        if request.method == "GET"
        else UPDATE_PERMISSION
    )
    permission_error = ensure_permission(request, permission)
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
        return Response(
            {
                "success": True,
                "item": serialize_encounter(encounter),
            }
        )

    if encounter.status in {
        MedicalEncounterStatus.COMPLETED,
        MedicalEncounterStatus.CANCELLED,
    }:
        return Response(
            {
                "success": False,
                "message": (
                    "A completed or cancelled encounter "
                    "cannot be edited."
                ),
            },
            status=400,
        )

    try:
        with transaction.atomic():
            encounter = apply_payload(
                encounter=encounter,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        encounter = encounter_queryset(
            company
        ).get(id=encounter.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Encounter updated successfully."
                ),
                "item": serialize_encounter(encounter),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Encounter data is invalid."
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
                    "A conflicting encounter record "
                    "already exists."
                ),
            },
            status=400,
        )


encounter_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


STATUS_TRANSITIONS = {
    MedicalEncounterStatus.DRAFT: {
        MedicalEncounterStatus.OPEN,
        MedicalEncounterStatus.CANCELLED,
    },
    MedicalEncounterStatus.OPEN: {
        MedicalEncounterStatus.IN_PROGRESS,
        MedicalEncounterStatus.COMPLETED,
        MedicalEncounterStatus.CANCELLED,
    },
    MedicalEncounterStatus.IN_PROGRESS: {
        MedicalEncounterStatus.COMPLETED,
        MedicalEncounterStatus.CANCELLED,
    },
    MedicalEncounterStatus.COMPLETED: set(),
    MedicalEncounterStatus.CANCELLED: set(),
}


@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def encounter_status(
    request: Request,
    encounter_id: int,
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

    requested_status = str(
        request.data.get("status") or ""
    ).strip().upper()

    if requested_status not in VALID_STATUS_VALUES:
        return Response(
            {
                "success": False,
                "message": "Invalid encounter status.",
                "valid_statuses": sorted(
                    VALID_STATUS_VALUES
                ),
            },
            status=400,
        )

    allowed = STATUS_TRANSITIONS.get(
        encounter.status,
        set(),
    )

    if requested_status not in allowed:
        return Response(
            {
                "success": False,
                "message": (
                    "The requested encounter status "
                    "transition is not allowed."
                ),
                "current_status": encounter.status,
                "allowed_statuses": sorted(allowed),
            },
            status=400,
        )

    now = timezone.now()

    try:
        with transaction.atomic():
            encounter.status = requested_status
            encounter.updated_by = request.user

            if requested_status in {
                MedicalEncounterStatus.OPEN,
                MedicalEncounterStatus.IN_PROGRESS,
            }:
                if not encounter.opened_at:
                    encounter.opened_at = now
                if not encounter.opened_by_id:
                    encounter.opened_by = request.user

            if requested_status in {
                MedicalEncounterStatus.COMPLETED,
                MedicalEncounterStatus.CANCELLED,
            }:
                encounter.closed_at = now
                encounter.closed_by = request.user

            encounter.save()

        encounter = encounter_queryset(
            company
        ).get(id=encounter.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Encounter status updated successfully."
                ),
                "item": serialize_encounter(encounter),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Encounter status update is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )


encounter_status.required_company_permissions = [
    STATUS_PERMISSION,
]
