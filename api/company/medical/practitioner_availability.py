from __future__ import annotations
from datetime import (
    date,
    datetime,
    time,
    timedelta,
)
from typing import Any
from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response
from api.permissions import HasAnyCompanyPermission
from medical.models import (
    MedicalPractitionerAssignment,
    MedicalPractitionerScheduleBreak,
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerTimeOff,
    MedicalPractitionerTimeOffStatus,
    MedicalPractitionerWeeklySchedule,
    MedicalWeekday,
)
from .practitioners import (
    company_or_error,
    ensure_permission,
)
from .practitioner_service_assignments import (
    serialize_assignment as serialize_service_assignment,
)
VIEW_SCHEDULE_PERMISSION = (
    "medical."
    "view_medicalpractitionerweeklyschedule"
)
CREATE_SCHEDULE_PERMISSION = (
    "medical."
    "add_medicalpractitionerweeklyschedule"
)
UPDATE_SCHEDULE_PERMISSION = (
    "medical."
    "change_medicalpractitionerweeklyschedule"
)
VIEW_BREAK_PERMISSION = (
    "medical."
    "view_medicalpractitionerschedulebreak"
)
CREATE_BREAK_PERMISSION = (
    "medical."
    "add_medicalpractitionerschedulebreak"
)
UPDATE_BREAK_PERMISSION = (
    "medical."
    "change_medicalpractitionerschedulebreak"
)
VIEW_TIME_OFF_PERMISSION = (
    "medical."
    "view_medicalpractitionertimeoff"
)
CREATE_TIME_OFF_PERMISSION = (
    "medical."
    "add_medicalpractitionertimeoff"
)
UPDATE_TIME_OFF_PERMISSION = (
    "medical."
    "change_medicalpractitionertimeoff"
)
VIEW_AVAILABILITY_PERMISSION = (
    "medical."
    "view_medicalpractitionerserviceassignment"
)
SCHEDULE_PERMISSIONS = [
    VIEW_SCHEDULE_PERMISSION,
    CREATE_SCHEDULE_PERMISSION,
    UPDATE_SCHEDULE_PERMISSION,
]
BREAK_PERMISSIONS = [
    VIEW_BREAK_PERMISSION,
    CREATE_BREAK_PERMISSION,
    UPDATE_BREAK_PERMISSION,
]
TIME_OFF_PERMISSIONS = [
    VIEW_TIME_OFF_PERMISSION,
    CREATE_TIME_OFF_PERMISSION,
    UPDATE_TIME_OFF_PERMISSION,
]
def iso_value(value):
    if value is None:
        return None
    return value.isoformat()
def validation_payload(
    error: ValidationError,
) -> dict[str, list[str]]:
    if hasattr(error, "message_dict"):
        return {
            key: [
                str(message)
                for message in messages
            ]
            for key, messages in (
                error.message_dict.items()
            )
        }
    return {
        "non_field_errors": [
            str(message)
            for message in error.messages
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
def parse_time(
    value,
    field_name: str,
):
    if isinstance(value, time):
        return value
    try:
        return time.fromisoformat(
            str(value).strip()
        )
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: [
                    (
                        "Provide a valid time in "
                        "HH:MM or HH:MM:SS format."
                    )
                ]
            }
        )
def parse_datetime(
    value,
    field_name: str,
):
    if isinstance(value, datetime):
        result = value
    else:
        try:
            result = datetime.fromisoformat(
                str(value).strip()
            )
        except (TypeError, ValueError):
            raise ValidationError(
                {
                    field_name: [
                        (
                            "Provide a valid ISO "
                            "date-time value."
                        )
                    ]
                }
            )
    if timezone.is_naive(result):
        result = timezone.make_aware(
            result,
            timezone.get_current_timezone(),
        )
    return result
def parse_json_object(
    value,
    field_name: str,
):
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
def serialize_practitioner(
    practitioner,
):
    return {
        "id": practitioner.id,
        "practitioner_number": (
            practitioner.practitioner_number
        ),
        "full_name_ar": practitioner.full_name_ar,
        "full_name_en": practitioner.full_name_en,
        "status": practitioner.status,
        "is_accepting_appointments": (
            practitioner.is_accepting_appointments
        ),
    }
def serialize_location_assignment(
    assignment: MedicalPractitionerAssignment,
):
    return {
        "id": assignment.id,
        "practitioner_id": (
            assignment.practitioner_id
        ),
        "branch_id": assignment.branch_id,
        "department_id": assignment.department_id,
        "clinic_id": assignment.clinic_id,
        "is_primary": assignment.is_primary,
        "is_active": assignment.is_active,
        "start_date": iso_value(
            assignment.start_date
        ),
        "end_date": iso_value(
            assignment.end_date
        ),
    }
def serialize_schedule(
    item: MedicalPractitionerWeeklySchedule,
):
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
        "weekday": item.weekday,
        "weekday_label": (
            item.get_weekday_display()
        ),
        "start_time": iso_value(item.start_time),
        "end_time": iso_value(item.end_time),
        "slot_interval_minutes": (
            item.slot_interval_minutes
        ),
        "effective_from": iso_value(
            item.effective_from
        ),
        "effective_until": iso_value(
            item.effective_until
        ),
        "is_active": item.is_active,
        "notes": item.notes,
        "extra_data": item.extra_data or {},
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }
def serialize_break(
    item: MedicalPractitionerScheduleBreak,
):
    return {
        "id": item.id,
        "company_id": item.company_id,
        "weekly_schedule_id": (
            item.weekly_schedule_id
        ),
        "practitioner_assignment_id": (
            item.weekly_schedule
            .practitioner_assignment_id
        ),
        "practitioner_id": item.practitioner_id,
        "start_time": iso_value(item.start_time),
        "end_time": iso_value(item.end_time),
        "is_active": item.is_active,
        "notes": item.notes,
        "extra_data": item.extra_data or {},
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }
def serialize_time_off(
    item: MedicalPractitionerTimeOff,
):
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
        "starts_at": iso_value(item.starts_at),
        "ends_at": iso_value(item.ends_at),
        "status": item.status,
        "reason": item.reason,
        "is_effective": item.is_effective,
        "notes": item.notes,
        "extra_data": item.extra_data or {},
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }
def resolve_practitioner_assignment(
    company,
    value,
):
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
def resolve_schedule(
    company,
    value,
):
    schedule_id = parse_integer(
        value,
        "weekly_schedule_id",
    )
    schedule = (
        MedicalPractitionerWeeklySchedule
        .objects
        .filter(
            company=company,
            id=schedule_id,
        )
        .select_related(
            "practitioner_assignment",
            (
                "practitioner_assignment__"
                "practitioner"
            ),
        )
        .first()
    )
    if schedule is None:
        raise ValidationError(
            {
                "weekly_schedule_id": [
                    (
                        "Weekly schedule was not found "
                        "for the current company."
                    )
                ]
            }
        )
    return schedule
def schedule_queryset(company):
    return (
        MedicalPractitionerWeeklySchedule
        .objects
        .filter(company=company)
        .select_related(
            "practitioner_assignment",
            (
                "practitioner_assignment__"
                "practitioner"
            ),
            "practitioner_assignment__branch",
            "practitioner_assignment__department",
            "practitioner_assignment__clinic",
        )
    )
def break_queryset(company):
    return (
        MedicalPractitionerScheduleBreak
        .objects
        .filter(company=company)
        .select_related(
            "weekly_schedule",
            (
                "weekly_schedule__"
                "practitioner_assignment"
            ),
            (
                "weekly_schedule__"
                "practitioner_assignment__"
                "practitioner"
            ),
        )
    )
def time_off_queryset(company):
    return (
        MedicalPractitionerTimeOff
        .objects
        .filter(company=company)
        .select_related(
            "practitioner_assignment",
            (
                "practitioner_assignment__"
                "practitioner"
            ),
            "practitioner_assignment__branch",
            "practitioner_assignment__department",
            "practitioner_assignment__clinic",
        )
    )
def apply_schedule_payload(
    *,
    item,
    company,
    payload,
    user,
    creating,
):
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
    if creating and "weekday" not in payload:
        raise ValidationError(
            {
                "weekday": [
                    "This field is required."
                ]
            }
        )
    if creating and "start_time" not in payload:
        raise ValidationError(
            {
                "start_time": [
                    "This field is required."
                ]
            }
        )
    if creating and "end_time" not in payload:
        raise ValidationError(
            {
                "end_time": [
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
    if "weekday" in payload:
        try:
            weekday = int(
                payload.get("weekday")
            )
        except (TypeError, ValueError):
            raise ValidationError(
                {
                    "weekday": [
                        "Provide a valid weekday."
                    ]
                }
            )
        if weekday not in MedicalWeekday.values:
            raise ValidationError(
                {
                    "weekday": [
                        "Provide a valid weekday."
                    ]
                }
            )
        item.weekday = weekday
    if "start_time" in payload:
        item.start_time = parse_time(
            payload.get("start_time"),
            "start_time",
        )
    if "end_time" in payload:
        item.end_time = parse_time(
            payload.get("end_time"),
            "end_time",
        )
    if "slot_interval_minutes" in payload:
        item.slot_interval_minutes = (
            parse_integer(
                payload.get(
                    "slot_interval_minutes"
                ),
                "slot_interval_minutes",
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
    if "is_active" in payload:
        item.is_active = parse_bool(
            payload.get("is_active"),
            "is_active",
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
def apply_break_payload(
    *,
    item,
    company,
    payload,
    user,
    creating,
):
    if (
        creating
        and "weekly_schedule_id"
        not in payload
    ):
        raise ValidationError(
            {
                "weekly_schedule_id": [
                    "This field is required."
                ]
            }
        )
    if creating and "start_time" not in payload:
        raise ValidationError(
            {
                "start_time": [
                    "This field is required."
                ]
            }
        )
    if creating and "end_time" not in payload:
        raise ValidationError(
            {
                "end_time": [
                    "This field is required."
                ]
            }
        )
    if "weekly_schedule_id" in payload:
        item.weekly_schedule = resolve_schedule(
            company,
            payload.get("weekly_schedule_id"),
        )
    if "start_time" in payload:
        item.start_time = parse_time(
            payload.get("start_time"),
            "start_time",
        )
    if "end_time" in payload:
        item.end_time = parse_time(
            payload.get("end_time"),
            "end_time",
        )
    if "is_active" in payload:
        item.is_active = parse_bool(
            payload.get("is_active"),
            "is_active",
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
def apply_time_off_payload(
    *,
    item,
    company,
    payload,
    user,
    creating,
):
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
    if creating and "starts_at" not in payload:
        raise ValidationError(
            {
                "starts_at": [
                    "This field is required."
                ]
            }
        )
    if creating and "ends_at" not in payload:
        raise ValidationError(
            {
                "ends_at": [
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
    if "starts_at" in payload:
        item.starts_at = parse_datetime(
            payload.get("starts_at"),
            "starts_at",
        )
    if "ends_at" in payload:
        item.ends_at = parse_datetime(
            payload.get("ends_at"),
            "ends_at",
        )
    if "status" in payload:
        status_value = str(
            payload.get("status") or ""
        ).strip().upper()
        if status_value not in {
            value
            for value, _label in (
                MedicalPractitionerTimeOffStatus
                .choices
            )
        }:
            raise ValidationError(
                {
                    "status": [
                        "Unsupported time-off status."
                    ]
                }
            )
        item.status = status_value
    if "reason" in payload:
        item.reason = str(
            payload.get("reason") or ""
        ).strip()
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
def filter_assignment_scope(
    queryset,
    request,
    prefix="",
):
    practitioner_id = request.query_params.get(
        "practitioner_id"
    )
    assignment_id = request.query_params.get(
        "practitioner_assignment_id"
    )
    if practitioner_id not in {None, ""}:
        queryset = queryset.filter(
            **{
                (
                    prefix
                    + "practitioner_assignment__"
                    "practitioner_id"
                ): parse_integer(
                    practitioner_id,
                    "practitioner_id",
                )
            }
        )
    if assignment_id not in {None, ""}:
        queryset = queryset.filter(
            **{
                (
                    prefix
                    + "practitioner_assignment_id"
                ): parse_integer(
                    assignment_id,
                    "practitioner_assignment_id",
                )
            }
        )
    return queryset
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def weekly_schedule_collection(
    request: Request,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_SCHEDULE_PERMISSION
        if request.method == "GET"
        else CREATE_SCHEDULE_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    if request.method == "GET":
        try:
            queryset = schedule_queryset(company)
            queryset = filter_assignment_scope(
                queryset,
                request,
            )
            weekday = request.query_params.get(
                "weekday"
            )
            if weekday not in {None, ""}:
                weekday_value = int(weekday)
                if (
                    weekday_value
                    not in MedicalWeekday.values
                ):
                    raise ValidationError(
                        {
                            "weekday": [
                                "Provide a valid weekday."
                            ]
                        }
                    )
                queryset = queryset.filter(
                    weekday=weekday_value
                )
            active = request.query_params.get(
                "is_active"
            )
            if active not in {None, ""}:
                queryset = queryset.filter(
                    is_active=parse_bool(
                        active,
                        "is_active",
                    )
                )
            effective_on_value = (
                request.query_params.get(
                    "effective_on"
                )
            )
            if effective_on_value not in {
                None,
                "",
            }:
                effective_on = parse_date(
                    effective_on_value,
                    "effective_on",
                )
                queryset = queryset.filter(
                    (
                        Q(effective_from__isnull=True)
                        | Q(
                            effective_from__lte=(
                                effective_on
                            )
                        )
                    ),
                    (
                        Q(effective_until__isnull=True)
                        | Q(
                            effective_until__gte=(
                                effective_on
                            )
                        )
                    ),
                )
        except (
            TypeError,
            ValueError,
            ValidationError,
        ) as exc:
            error = (
                exc
                if isinstance(exc, ValidationError)
                else ValidationError(
                    {
                        "weekday": [
                            "Provide a valid weekday."
                        ]
                    }
                )
            )
            return Response(
                {
                    "success": False,
                    "message": (
                        "Weekly schedule filters "
                        "are invalid."
                    ),
                    "errors": validation_payload(
                        error
                    ),
                },
                status=400,
            )
        items = [
            serialize_schedule(item)
            for item in queryset[:500]
        ]
        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "weekly_schedules": items,
            }
        )
    try:
        with transaction.atomic():
            item = apply_schedule_payload(
                item=(
                    MedicalPractitionerWeeklySchedule(
                        company=company
                    )
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        item = schedule_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Weekly schedule created "
                    "successfully."
                ),
                "item": serialize_schedule(item),
            },
            status=201,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Weekly schedule data is invalid."
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
                    "A conflicting weekly schedule "
                    "already exists."
                ),
            },
            status=400,
        )
weekly_schedule_collection.required_company_permissions = (
    SCHEDULE_PERMISSIONS
)
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def weekly_schedule_detail(
    request: Request,
    schedule_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_SCHEDULE_PERMISSION
        if request.method == "GET"
        else UPDATE_SCHEDULE_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    item = schedule_queryset(company).filter(
        id=schedule_id
    ).first()
    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Weekly schedule was not found."
                ),
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_schedule(item),
            }
        )
    try:
        with transaction.atomic():
            item = apply_schedule_payload(
                item=item,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        item = schedule_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Weekly schedule updated "
                    "successfully."
                ),
                "item": serialize_schedule(item),
            }
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Weekly schedule data is invalid."
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
                    "A conflicting weekly schedule "
                    "already exists."
                ),
            },
            status=400,
        )
weekly_schedule_detail.required_company_permissions = [
    VIEW_SCHEDULE_PERMISSION,
    UPDATE_SCHEDULE_PERMISSION,
]
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def schedule_break_collection(
    request: Request,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_BREAK_PERMISSION
        if request.method == "GET"
        else CREATE_BREAK_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    if request.method == "GET":
        try:
            queryset = break_queryset(company)
            schedule_id = request.query_params.get(
                "weekly_schedule_id"
            )
            if schedule_id not in {None, ""}:
                queryset = queryset.filter(
                    weekly_schedule_id=(
                        parse_integer(
                            schedule_id,
                            "weekly_schedule_id",
                        )
                    )
                )
            practitioner_id = (
                request.query_params.get(
                    "practitioner_id"
                )
            )
            if practitioner_id not in {
                None,
                "",
            }:
                queryset = queryset.filter(
                    **{
                        (
                            "weekly_schedule__"
                            "practitioner_assignment__"
                            "practitioner_id"
                        ): parse_integer(
                            practitioner_id,
                            "practitioner_id",
                        )
                    }
                )
            active = request.query_params.get(
                "is_active"
            )
            if active not in {None, ""}:
                queryset = queryset.filter(
                    is_active=parse_bool(
                        active,
                        "is_active",
                    )
                )
        except ValidationError as error:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Schedule-break filters "
                        "are invalid."
                    ),
                    "errors": validation_payload(
                        error
                    ),
                },
                status=400,
            )
        items = [
            serialize_break(item)
            for item in queryset[:500]
        ]
        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "schedule_breaks": items,
            }
        )
    try:
        with transaction.atomic():
            item = apply_break_payload(
                item=(
                    MedicalPractitionerScheduleBreak(
                        company=company
                    )
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        item = break_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Schedule break created "
                    "successfully."
                ),
                "item": serialize_break(item),
            },
            status=201,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Schedule-break data is invalid."
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
                    "A conflicting schedule break "
                    "already exists."
                ),
            },
            status=400,
        )
schedule_break_collection.required_company_permissions = (
    BREAK_PERMISSIONS
)
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def schedule_break_detail(
    request: Request,
    break_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_BREAK_PERMISSION
        if request.method == "GET"
        else UPDATE_BREAK_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    item = break_queryset(company).filter(
        id=break_id
    ).first()
    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Schedule break was not found."
                ),
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_break(item),
            }
        )
    try:
        with transaction.atomic():
            item = apply_break_payload(
                item=item,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        item = break_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Schedule break updated "
                    "successfully."
                ),
                "item": serialize_break(item),
            }
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Schedule-break data is invalid."
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
                    "A conflicting schedule break "
                    "already exists."
                ),
            },
            status=400,
        )
schedule_break_detail.required_company_permissions = [
    VIEW_BREAK_PERMISSION,
    UPDATE_BREAK_PERMISSION,
]
@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_time_off_collection(
    request: Request,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_TIME_OFF_PERMISSION
        if request.method == "GET"
        else CREATE_TIME_OFF_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    if request.method == "GET":
        try:
            queryset = time_off_queryset(company)
            queryset = filter_assignment_scope(
                queryset,
                request,
            )
            status_value = str(
                request.query_params.get("status")
                or ""
            ).strip().upper()
            valid_statuses = {
                value
                for value, _label in (
                    MedicalPractitionerTimeOffStatus
                    .choices
                )
            }
            if status_value:
                if status_value not in valid_statuses:
                    raise ValidationError(
                        {
                            "status": [
                                "Invalid time-off status."
                            ]
                        }
                    )
                queryset = queryset.filter(
                    status=status_value
                )
            overlap_start = (
                request.query_params.get(
                    "overlap_start"
                )
            )
            overlap_end = (
                request.query_params.get(
                    "overlap_end"
                )
            )
            if overlap_start not in {None, ""}:
                queryset = queryset.filter(
                    ends_at__gt=parse_datetime(
                        overlap_start,
                        "overlap_start",
                    )
                )
            if overlap_end not in {None, ""}:
                queryset = queryset.filter(
                    starts_at__lt=parse_datetime(
                        overlap_end,
                        "overlap_end",
                    )
                )
        except ValidationError as error:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Time-off filters are invalid."
                    ),
                    "errors": validation_payload(
                        error
                    ),
                },
                status=400,
            )
        items = [
            serialize_time_off(item)
            for item in queryset[:500]
        ]
        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "time_off_periods": items,
            }
        )
    try:
        with transaction.atomic():
            item = apply_time_off_payload(
                item=(
                    MedicalPractitionerTimeOff(
                        company=company
                    )
                ),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        item = time_off_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner time off created "
                    "successfully."
                ),
                "item": serialize_time_off(item),
            },
            status=201,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner time-off data "
                    "is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
practitioner_time_off_collection.required_company_permissions = (
    TIME_OFF_PERMISSIONS
)
@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_time_off_detail(
    request: Request,
    time_off_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = (
        VIEW_TIME_OFF_PERMISSION
        if request.method == "GET"
        else UPDATE_TIME_OFF_PERMISSION
    )
    permission_error = ensure_permission(
        request,
        permission,
    )
    if permission_error:
        return permission_error
    item = time_off_queryset(company).filter(
        id=time_off_id
    ).first()
    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner time off was "
                    "not found."
                ),
            },
            status=404,
        )
    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_time_off(item),
            }
        )
    try:
        with transaction.atomic():
            item = apply_time_off_payload(
                item=item,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        item = time_off_queryset(
            company
        ).get(id=item.id)
        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner time off updated "
                    "successfully."
                ),
                "item": serialize_time_off(item),
            }
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner time-off data "
                    "is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
practitioner_time_off_detail.required_company_permissions = [
    VIEW_TIME_OFF_PERMISSION,
    UPDATE_TIME_OFF_PERMISSION,
]
def aware_datetime(
    target_date,
    target_time,
):
    result = datetime.combine(
        target_date,
        target_time,
    )
    if timezone.is_naive(result):
        result = timezone.make_aware(
            result,
            timezone.get_current_timezone(),
        )
    return result
def intervals_overlap(
    first_start,
    first_end,
    second_start,
    second_end,
):
    return (
        first_start < second_end
        and first_end > second_start
    )
def appointment_intervals(
    *,
    company,
    practitioner_assignment,
    day_start,
    day_end,
):
    try:
        Appointment = apps.get_model(
            "medical",
            "MedicalAppointment",
        )
    except LookupError:
        return []
    fields = {
        field.name
        for field in Appointment._meta.get_fields()
    }
    if not {
        "scheduled_start",
        "scheduled_end",
    }.issubset(fields):
        return []
    queryset = Appointment.objects.filter(
        company=company,
        scheduled_start__lt=day_end,
        scheduled_end__gt=day_start,
    )
    if "practitioner_assignment" in fields:
        queryset = queryset.filter(
            practitioner_assignment=(
                practitioner_assignment
            )
        )
    elif "practitioner" in fields:
        queryset = queryset.filter(
            practitioner_id=(
                practitioner_assignment
                .practitioner_id
            )
        )
    else:
        return []
    if "status" in fields:
        queryset = queryset.exclude(
            status__in=[
                "CANCELLED",
                "CANCELED",
                "NO_SHOW",
            ]
        )
    return [
        (
            item.scheduled_start,
            item.scheduled_end,
        )
        for item in queryset
    ]
@api_view(["GET"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_availability(
    request: Request,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission_error = ensure_permission(
        request,
        VIEW_AVAILABILITY_PERMISSION,
    )
    if permission_error:
        return permission_error
    try:
        service_assignment_id = parse_integer(
            request.query_params.get(
                "practitioner_service_assignment_id"
            ),
            (
                "practitioner_service_assignment_id"
            ),
        )
        target_date = parse_date(
            request.query_params.get("date"),
            "date",
        )
        if target_date is None:
            raise ValidationError(
                {
                    "date": [
                        "This field is required."
                    ]
                }
            )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Availability query is invalid."
                ),
                "errors": validation_payload(error),
            },
            status=400,
        )
    service_assignment = (
        MedicalPractitionerServiceAssignment
        .objects
        .filter(
            company=company,
            id=service_assignment_id,
        )
        .select_related(
            "practitioner_assignment",
            (
                "practitioner_assignment__"
                "practitioner"
            ),
            "service_offering",
            "service_offering__catalog_item",
            "service_offering__branch",
            "service_offering__department",
            "service_offering__specialty",
            "service_offering__clinic",
        )
        .first()
    )
    if service_assignment is None:
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
    if not (
        service_assignment
        .is_active_service_assignment
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner service assignment "
                    "is not currently active."
                ),
            },
            status=400,
        )
    practitioner_assignment = (
        service_assignment.practitioner_assignment
    )
    schedules = list(
        schedule_queryset(company)
        .filter(
            practitioner_assignment=(
                practitioner_assignment
            ),
            weekday=target_date.weekday(),
            is_active=True,
        )
        .prefetch_related(
            "schedule_breaks"
        )
    )
    schedules = [
        schedule
        for schedule in schedules
        if schedule.applies_on(target_date)
    ]
    day_start = aware_datetime(
        target_date,
        time.min,
    )
    day_end = aware_datetime(
        target_date + timedelta(days=1),
        time.min,
    )
    time_off_intervals = [
        (
            item.starts_at,
            item.ends_at,
        )
        for item in (
            time_off_queryset(company)
            .filter(
                practitioner_assignment=(
                    practitioner_assignment
                ),
                status=(
                    MedicalPractitionerTimeOffStatus
                    .APPROVED
                ),
                starts_at__lt=day_end,
                ends_at__gt=day_start,
            )
        )
    ]
    booked_intervals = appointment_intervals(
        company=company,
        practitioner_assignment=(
            practitioner_assignment
        ),
        day_start=day_start,
        day_end=day_end,
    )
    total_slot_minutes = (
        service_assignment.total_slot_minutes
    )
    slots = []
    for schedule in schedules:
        schedule_start = aware_datetime(
            target_date,
            schedule.start_time,
        )
        schedule_end = aware_datetime(
            target_date,
            schedule.end_time,
        )
        recurring_breaks = [
            (
                aware_datetime(
                    target_date,
                    item.start_time,
                ),
                aware_datetime(
                    target_date,
                    item.end_time,
                ),
            )
            for item in (
                schedule.schedule_breaks.all()
            )
            if item.is_active
        ]
        step_minutes = max(
            schedule.slot_interval_minutes,
            total_slot_minutes,
        )
        candidate_start = schedule_start
        while (
            candidate_start
            + timedelta(
                minutes=total_slot_minutes
            )
            <= schedule_end
        ):
            candidate_end = (
                candidate_start
                + timedelta(
                    minutes=total_slot_minutes
                )
            )
            blocked = any(
                intervals_overlap(
                    candidate_start,
                    candidate_end,
                    block_start,
                    block_end,
                )
                for block_start, block_end in (
                    recurring_breaks
                    + time_off_intervals
                    + booked_intervals
                )
            )
            if not blocked:
                slots.append(
                    {
                        "start": iso_value(
                            candidate_start
                        ),
                        "end": iso_value(
                            candidate_end
                        ),
                        "duration_minutes": (
                            service_assignment
                            .effective_duration_minutes
                        ),
                        "total_slot_minutes": (
                            total_slot_minutes
                        ),
                        "buffer_before_minutes": (
                            service_assignment
                            .service_offering
                            .buffer_before_minutes
                        ),
                        "buffer_after_minutes": (
                            service_assignment
                            .service_offering
                            .buffer_after_minutes
                        ),
                        "weekly_schedule_id": (
                            schedule.id
                        ),
                    }
                )
            candidate_start = (
                candidate_start
                + timedelta(
                    minutes=step_minutes
                )
            )
    slots.sort(
        key=lambda item: item["start"]
    )
    return Response(
        {
            "success": True,
            "date": target_date.isoformat(),
            "timezone": str(
                timezone.get_current_timezone()
            ),
            "practitioner_service_assignment_id": (
                service_assignment.id
            ),
            "practitioner_assignment_id": (
                practitioner_assignment.id
            ),
            "practitioner_id": (
                practitioner_assignment
                .practitioner_id
            ),
            "service_assignment": (
                serialize_service_assignment(
                    service_assignment
                )
            ),
            "schedule_count": len(schedules),
            "time_off_count": len(
                time_off_intervals
            ),
            "booked_interval_count": len(
                booked_intervals
            ),
            "count": len(slots),
            "slots": slots,
            "available_slots": slots,
        }
    )
practitioner_availability.required_company_permissions = [
    VIEW_AVAILABILITY_PERMISSION,
]
