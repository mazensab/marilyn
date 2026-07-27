from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
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
    MedicalPatient,
    MedicalPractitioner,
)

from .practitioners import (
    company_or_error,
    ensure_permission,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicalappointment"
CREATE_PERMISSION = "medical.add_medicalappointment"
UPDATE_PERMISSION = "medical.change_medicalappointment"
STATUS_PERMISSION = UPDATE_PERMISSION

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]


def appointment_queryset(company):
    return (
        MedicalAppointment.objects
        .filter(company=company)
        .select_related(
            "patient",
            "practitioner",
            "branch",
            "department",
            "clinic",
            "legacy_appointment",
            "created_by",
            "updated_by",
        )
        .order_by("-scheduled_start", "-id")
    )


def related_object(obj) -> dict[str, Any] | None:
    if obj is None:
        return None

    code = (
        getattr(obj, "patient_number", "")
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


def iso_value(value):
    return value.isoformat() if value is not None else None

def serialize_appointment(
    appointment: MedicalAppointment,
) -> dict[str, Any]:
    return {
        "id": appointment.id,
        "company_id": appointment.company_id,
        "appointment_number": appointment.appointment_number,
        "patient_id": appointment.patient_id,
        "patient": related_object(appointment.patient),
        "practitioner_id": appointment.practitioner_id,
        "practitioner": related_object(appointment.practitioner),
        "branch_id": appointment.branch_id,
        "branch": related_object(appointment.branch),
        "department_id": appointment.department_id,
        "department": related_object(appointment.department),
        "clinic_id": appointment.clinic_id,
        "clinic": related_object(appointment.clinic),
        "legacy_appointment_id": appointment.legacy_appointment_id,
        "scheduled_start": iso_value(appointment.scheduled_start),
        "scheduled_end": iso_value(appointment.scheduled_end),
        "status": appointment.status,
        "source": appointment.source,
        "reason": appointment.reason,
        "practitioner_name_snapshot": (
            appointment.practitioner_name_snapshot
        ),
        "service_name_snapshot": appointment.service_name_snapshot,
        "price_snapshot": str(appointment.price_snapshot),
        "notes": appointment.notes,
        "cancellation_reason": appointment.cancellation_reason,
        "extra_data": appointment.extra_data or {},
        "confirmed_at": iso_value(appointment.confirmed_at),
        "checked_in_at": iso_value(appointment.checked_in_at),
        "started_at": iso_value(appointment.started_at),
        "completed_at": iso_value(appointment.completed_at),
        "cancelled_at": iso_value(appointment.cancelled_at),
        "no_show_at": iso_value(appointment.no_show_at),
        "created_at": iso_value(appointment.created_at),
        "updated_at": iso_value(appointment.updated_at),
    }

def parse_datetime_value(value, field_name: str):
    if value in (None, ""):
        return None
    parsed = value if isinstance(value, datetime) else parse_datetime(str(value))
    if parsed is None:
        raise ValidationError({field_name: "Enter a valid date and time."})
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


def decimal_value(value, field_name: str):
    if value in (None, ""):
        return Decimal("0")
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({field_name: "Enter a valid decimal value."})
    if parsed < 0:
        raise ValidationError({field_name: "Value cannot be negative."})
    return parsed


def company_object(model, company, value, field_name: str, required=False):
    if value in (None, ""):
        if required:
            raise ValidationError({field_name: "This field is required."})
        return None
    try:
        object_id = int(value)
    except (TypeError, ValueError):
        raise ValidationError({field_name: "Enter a valid object id."})
    obj = model.objects.filter(company=company, id=object_id).first()
    if obj is None:
        raise ValidationError({field_name: "Object was not found."})
    return obj


def next_appointment_number(company) -> str:
    prefix = f"APT-{timezone.localdate():%Y%m}-"
    latest = (
        MedicalAppointment.objects
        .filter(company=company, appointment_number__startswith=prefix)
        .order_by("-appointment_number")
        .values_list("appointment_number", flat=True)
        .first()
    )
    sequence = 1
    if latest:
        try:
            sequence = int(latest.rsplit("-", 1)[1]) + 1
        except (IndexError, ValueError):
            sequence = 1
    return f"{prefix}{sequence:06d}"


RELATED_MODELS = {
    "patient": MedicalPatient,
    "practitioner": MedicalPractitioner,
    "branch": Branch,
    "department": MedicalDepartment,
    "clinic": MedicalClinic,
}


def apply_payload(
    *,
    appointment: MedicalAppointment | None,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalAppointment:
    if creating:
        appointment = MedicalAppointment(company=company)
    if appointment is None:
        raise ValidationError({"appointment": "Appointment is required."})

    appointment.company = company

    if creating:
        number = str(payload.get("appointment_number", "")).strip()
        appointment.appointment_number = (
            number or next_appointment_number(company)
        )
    elif "appointment_number" in payload:
        appointment.appointment_number = str(
            payload.get("appointment_number") or ""
        ).strip()

    relation_fields = {
        "patient": creating,
        "practitioner": False,
        "branch": False,
        "department": False,
        "clinic": False,
    }
    for field_name, required_on_create in relation_fields.items():
        key = f"{field_name}_id"
        if key in payload or (creating and required_on_create):
            setattr(
                appointment,
                field_name,
                company_object(
                    RELATED_MODELS[field_name],
                    company,
                    payload.get(key),
                    key,
                    required=creating and required_on_create,
                ),
            )

    if creating and "scheduled_start" not in payload:
        raise ValidationError(
            {"scheduled_start": "This field is required."}
        )
    if creating and "scheduled_end" not in payload:
        raise ValidationError(
            {"scheduled_end": "This field is required."}
        )

    for field_name in (
        "scheduled_start",
        "scheduled_end",
        "confirmed_at",
        "checked_in_at",
        "started_at",
        "completed_at",
        "cancelled_at",
        "no_show_at",
    ):
        if field_name in payload:
            setattr(
                appointment,
                field_name,
                parse_datetime_value(payload.get(field_name), field_name),
            )

    for field_name in (
        "status",
        "source",
        "reason",
        "practitioner_name_snapshot",
        "service_name_snapshot",
        "notes",
        "cancellation_reason",
    ):
        if field_name in payload:
            setattr(
                appointment,
                field_name,
                str(payload.get(field_name) or "").strip(),
            )

    if "price_snapshot" in payload:
        appointment.price_snapshot = decimal_value(
            payload.get("price_snapshot"),
            "price_snapshot",
        )

    if "extra_data" in payload:
        extra_data = payload.get("extra_data")
        if extra_data in (None, ""):
            extra_data = {}
        if not isinstance(extra_data, dict):
            raise ValidationError(
                {"extra_data": "Enter a valid object."}
            )
        appointment.extra_data = extra_data

    if creating:
        appointment.created_by = user
    appointment.updated_by = user
    appointment.full_clean()
    appointment.save()
    return appointment


# PHASE 10.6-A2C APPOINTMENT COLLECTION
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def appointment_collection(request: Request) -> Response:
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
        queryset = appointment_queryset(company)
        search = str(request.query_params.get("search", "")).strip()
        if search:
            queryset = queryset.filter(
                Q(appointment_number__icontains=search)
                | Q(reason__icontains=search)
                | Q(practitioner_name_snapshot__icontains=search)
                | Q(service_name_snapshot__icontains=search)
                | Q(notes__icontains=search)
            )

        for field_name in ("status", "source"):
            value = str(
                request.query_params.get(field_name, "")
            ).strip()
            if value:
                queryset = queryset.filter(**{field_name: value})

        relation_filters = {
            "patient_id": "patient_id",
            "practitioner_id": "practitioner_id",
            "branch_id": "branch_id",
            "department_id": "department_id",
            "clinic_id": "clinic_id",
        }
        for parameter, lookup in relation_filters.items():
            value = str(
                request.query_params.get(parameter, "")
            ).strip()
            if value:
                try:
                    value = int(value)
                except (TypeError, ValueError):
                    return Response(
                        {
                            "success": False,
                            "message": f"{parameter} must be an integer.",
                        },
                        status=400,
                    )
                queryset = queryset.filter(**{lookup: value})

        date_filters = {
            "scheduled_from": "scheduled_start__gte",
            "scheduled_to": "scheduled_start__lte",
        }
        for parameter, lookup in date_filters.items():
            value = request.query_params.get(parameter)
            if value not in (None, ""):
                try:
                    parsed = parse_datetime_value(value, parameter)
                except ValidationError as exc:
                    return Response(
                        {
                            "success": False,
                            "message": "Appointment filters are invalid.",
                            "errors": validation_payload(exc),
                        },
                        status=400,
                    )
                queryset = queryset.filter(**{lookup: parsed})

        count = queryset.count()
        items = [
            serialize_appointment(item)
            for item in queryset[:500]
        ]
        return Response(
            {
                "success": True,
                "count": count,
                "items": items,
                "appointments": items,
            }
        )

    try:
        with transaction.atomic():
            appointment = apply_payload(
                appointment=None,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        appointment = appointment_queryset(company).get(
            id=appointment.id
        )
        return Response(
            {
                "success": True,
                "message": "Appointment created successfully.",
                "item": serialize_appointment(appointment),
            },
            status=201,
        )
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Appointment data is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting appointment record already exists."
                ),
            },
            status=400,
        )


appointment_collection.required_company_permissions = ALL_PERMISSIONS# PHASE 10.6-A2D APPOINTMENT DETAIL AND STATUS
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def appointment_detail(
    request: Request,
    appointment_id: int,
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
    appointment = appointment_queryset(company).filter(
        id=appointment_id,
    ).first()
    if appointment is None:
        return Response(
            {
                "success": False,
                "message": "Appointment was not found.",
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_appointment(appointment),
            }
        )
    try:
        with transaction.atomic():
            appointment = apply_payload(
                appointment=appointment,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        appointment = appointment_queryset(company).get(
            id=appointment.id,
        )
        return Response(
            {
                "success": True,
                "message": "Appointment updated successfully.",
                "item": serialize_appointment(appointment),
            }
        )
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Appointment data is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting appointment record already exists."
                ),
            },
            status=400,
        )
appointment_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]
VALID_STATUS_VALUES = {
    value
    for value, _label in (
        MedicalAppointment._meta.get_field("status").choices
    )
}


STATUS_TRANSITIONS = {
    "SCHEDULED": {
        "CONFIRMED",
        "CANCELLED",
        "NO_SHOW",
    },
    "CONFIRMED": {
        "CHECKED_IN",
        "CANCELLED",
        "NO_SHOW",
    },
    "CHECKED_IN": {
        "IN_PROGRESS",
        "CANCELLED",
        "NO_SHOW",
    },
    "IN_PROGRESS": {
        "COMPLETED",
        "CANCELLED",
    },
    "COMPLETED": set(),
    "CANCELLED": set(),
    "NO_SHOW": set(),
}
STATUS_TIMESTAMP_FIELDS = {
    "CONFIRMED": "confirmed_at",
    "CHECKED_IN": "checked_in_at",
    "IN_PROGRESS": "started_at",
    "COMPLETED": "completed_at",
    "CANCELLED": "cancelled_at",
    "NO_SHOW": "no_show_at",
}
@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def appointment_status(
    request: Request,
    appointment_id: int,
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
    appointment = appointment_queryset(company).filter(
        id=appointment_id,
    ).first()
    if appointment is None:
        return Response(
            {
                "success": False,
                "message": "Appointment was not found.",
            },
            status=404,
        )
    requested_status = str(
        request.data.get("status", "")
    ).strip().upper()
    valid_statuses = {
        value
        for value, _label in MedicalAppointment._meta.get_field("status").choices
    }
    if requested_status not in valid_statuses:
        return Response(
            {
                "success": False,
                "message": "Appointment status is invalid.",
                "valid_statuses": sorted(valid_statuses),
            },
            status=400,
        )
    current_status = appointment.status
    allowed_statuses = STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )
    if (
        requested_status != current_status
        and requested_status not in allowed_statuses
    ):
        return Response(
            {
                "success": False,
                "message": "Appointment status transition is invalid.",
                "current_status": current_status,
                "allowed_statuses": sorted(allowed_statuses),
            },
            status=400,
        )
    cancellation_reason = str(
        request.data.get(
            "cancellation_reason",
            appointment.cancellation_reason or "",
        )
    ).strip()
    if (
        requested_status
        == "CANCELLED"
        and not cancellation_reason
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Cancellation reason is required "
                    "when cancelling an appointment."
                ),
            },
            status=400,
        )
    try:
        with transaction.atomic():
            if (
                requested_status
                == "CANCELLED"
            ):
                appointment.cancellation_reason = (
                    cancellation_reason
                )
            if requested_status != current_status:
                timestamp_field = STATUS_TIMESTAMP_FIELDS.get(
                    requested_status
                )
                if timestamp_field:
                    setattr(
                        appointment,
                        timestamp_field,
                        timezone.now(),
                    )
            appointment.status = requested_status
            appointment.updated_by = request.user
            appointment.full_clean()
            appointment.save()
        appointment = appointment_queryset(company).get(
            id=appointment.id,
        )
        return Response(
            {
                "success": True,
                "message": (
                    "Appointment status updated successfully."
                ),
                "item": serialize_appointment(appointment),
            }
        )
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Appointment status is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "Appointment status could not be updated."
                ),
            },
            status=400,
        )
appointment_status.required_company_permissions = [
    STATUS_PERMISSION,
]
