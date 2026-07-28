
from __future__ import annotations
from datetime import datetime, timedelta
from django.utils import timezone
NON_BLOCKING_STATUSES = {
    "CANCELLED",
    "NO_SHOW",
}
def _display_name(value) -> str:
    if value is None:
        return ""
    for field_name in (
        "name_ar",
        "name_en",
        "name",
        "display_name",
        "code",
    ):
        candidate = getattr(
            value,
            field_name,
            "",
        )
        if candidate:
            return str(candidate).strip()
    return str(value).strip()
def apply_appointment_derivations(
    appointment,
) -> None:
    assignment = None
    service_assignment = None
    if (
        appointment
        .practitioner_service_assignment_id
    ):
        service_assignment = (
            appointment
            .practitioner_service_assignment
        )
        assignment = (
            service_assignment
            .practitioner_assignment
        )
        appointment.practitioner_assignment = (
            assignment
        )
    elif appointment.practitioner_assignment_id:
        assignment = (
            appointment.practitioner_assignment
        )
    if assignment is not None:
        appointment.practitioner = (
            assignment.practitioner
        )
        appointment.branch = assignment.branch
        appointment.department = (
            assignment.department
        )
        appointment.clinic = assignment.clinic
    if service_assignment is None:
        return
    if appointment.scheduled_start:
        appointment.scheduled_end = (
            appointment.scheduled_start
            + timedelta(
                minutes=(
                    service_assignment
                    .total_slot_minutes
                )
            )
        )
    practitioner = assignment.practitioner
    if not appointment.practitioner_name_snapshot:
        appointment.practitioner_name_snapshot = (
            practitioner.full_name_ar
            or practitioner.full_name_en
            or str(practitioner)
        )
    offering = service_assignment.service_offering
    if not appointment.service_name_snapshot:
        appointment.service_name_snapshot = (
            _display_name(
                offering.catalog_item
            )
        )
    effective_price = (
        offering.effective_sale_price
    )
    if callable(effective_price):
        effective_price = effective_price()
    if (
        effective_price is not None
        and appointment.price_snapshot in (
            None,
            0,
        )
    ):
        appointment.price_snapshot = (
            effective_price
        )
def _local_value(value):
    if value is None:
        return None
    if timezone.is_aware(value):
        return timezone.localtime(value)
    return value
def validate_appointment_booking(
    appointment,
    errors: dict,
) -> None:
    from medical.models import (
        MedicalPractitionerTimeOff,
        MedicalPractitionerWeeklySchedule,
    )
    if not appointment.practitioner_assignment_id:
        return
    assignment = (
        appointment.practitioner_assignment
    )
    if (
        appointment.company_id
        and assignment.company_id
        != appointment.company_id
    ):
        errors["practitioner_assignment"] = (
            "Practitioner assignment must belong "
            "to the same company."
        )
    if not assignment.is_active:
        errors["practitioner_assignment"] = (
            "Practitioner assignment must be active."
        )
    service_assignment = None
    if (
        appointment
        .practitioner_service_assignment_id
    ):
        service_assignment = (
            appointment
            .practitioner_service_assignment
        )
        if (
            appointment.company_id
            and service_assignment.company_id
            != appointment.company_id
        ):
            errors[
                "practitioner_service_assignment"
            ] = (
                "Practitioner service assignment "
                "must belong to the same company."
            )
        if (
            service_assignment
            .practitioner_assignment_id
            != assignment.id
        ):
            errors[
                "practitioner_service_assignment"
            ] = (
                "Practitioner service assignment "
                "must match the practitioner "
                "assignment."
            )
        if service_assignment.status != "ACTIVE":
            errors[
                "practitioner_service_assignment"
            ] = (
                "Practitioner service assignment "
                "must be active."
            )
        offering = (
            service_assignment.service_offering
        )
        if not offering.is_active_offering:
            errors[
                "practitioner_service_assignment"
            ] = (
                "Medical service offering must "
                "be active."
            )
    if not (
        appointment.scheduled_start
        and appointment.scheduled_end
    ):
        return
    local_start = _local_value(
        appointment.scheduled_start
    )
    local_end = _local_value(
        appointment.scheduled_end
    )
    booking_date = local_start.date()
    if (
        assignment.start_date
        and booking_date < assignment.start_date
    ):
        errors["scheduled_start"] = (
            "Appointment date precedes the "
            "practitioner assignment."
        )
    if (
        assignment.end_date
        and booking_date > assignment.end_date
    ):
        errors["scheduled_start"] = (
            "Appointment date follows the "
            "practitioner assignment."
        )
    if service_assignment is not None:
        if (
            service_assignment.effective_from
            and booking_date
            < service_assignment.effective_from
        ):
            errors[
                "practitioner_service_assignment"
            ] = (
                "Practitioner service assignment "
                "is not effective on the appointment "
                "date."
            )
        if (
            service_assignment.effective_until
            and booking_date
            > service_assignment.effective_until
        ):
            errors[
                "practitioner_service_assignment"
            ] = (
                "Practitioner service assignment "
                "is not effective on the appointment "
                "date."
            )
    if appointment.status in NON_BLOCKING_STATUSES:
        return
    schedules = (
        MedicalPractitionerWeeklySchedule
        .objects
        .filter(
            company_id=appointment.company_id,
            practitioner_assignment_id=(
                assignment.id
            ),
            weekday=booking_date.weekday(),
            is_active=True,
        )
        .filter(
            (
                __import__("django")
                .db.models.Q(
                    effective_from__isnull=True
                )
            )
            | (
                __import__("django")
                .db.models.Q(
                    effective_from__lte=booking_date
                )
            ),
            (
                __import__("django")
                .db.models.Q(
                    effective_until__isnull=True
                )
            )
            | (
                __import__("django")
                .db.models.Q(
                    effective_until__gte=booking_date
                )
            ),
        )
        .prefetch_related(
            "schedule_breaks"
        )
    )
    is_aware = timezone.is_aware(
        appointment.scheduled_start
    )
    def on_booking_day(time_value):
        result = datetime.combine(
            booking_date,
            time_value,
        )
        if is_aware:
            result = timezone.make_aware(
                result,
                local_start.tzinfo,
            )
        return result
    matching_window = False
    clear_window = False
    for schedule in schedules:
        schedule_start = on_booking_day(
            schedule.start_time
        )
        schedule_end = on_booking_day(
            schedule.end_time
        )
        if not (
            local_start >= schedule_start
            and local_end <= schedule_end
        ):
            continue
        matching_window = True
        overlaps_break = False
        for schedule_break in (
            schedule.schedule_breaks.all()
        ):
            if not schedule_break.is_active:
                continue
            break_start = on_booking_day(
                schedule_break.start_time
            )
            break_end = on_booking_day(
                schedule_break.end_time
            )
            if (
                local_start < break_end
                and local_end > break_start
            ):
                overlaps_break = True
                break
        if not overlaps_break:
            clear_window = True
            break
    if not matching_window:
        errors["scheduled_start"] = (
            "Appointment must fit inside an active "
            "weekly practitioner schedule."
        )
    elif not clear_window:
        errors["scheduled_start"] = (
            "Appointment overlaps a practitioner "
            "schedule break."
        )
    time_off_exists = (
        MedicalPractitionerTimeOff
        .objects
        .filter(
            company_id=appointment.company_id,
            practitioner_assignment_id=(
                assignment.id
            ),
            status="APPROVED",
            starts_at__lt=(
                appointment.scheduled_end
            ),
            ends_at__gt=(
                appointment.scheduled_start
            ),
        )
        .exists()
    )
    if time_off_exists:
        errors["scheduled_start"] = (
            "Appointment overlaps approved "
            "practitioner time off."
        )
    conflicts = (
        appointment.__class__
        .objects
        .filter(
            company_id=appointment.company_id,
            practitioner_assignment_id=(
                assignment.id
            ),
            scheduled_start__lt=(
                appointment.scheduled_end
            ),
            scheduled_end__gt=(
                appointment.scheduled_start
            ),
        )
        .exclude(
            status__in=NON_BLOCKING_STATUSES
        )
    )
    if appointment.pk:
        conflicts = conflicts.exclude(
            pk=appointment.pk
        )
    if conflicts.exists():
        errors["scheduled_start"] = (
            "Practitioner already has a "
            "conflicting appointment."
        )
# APPOINTMENT_LIFECYCLE_ENGINE
APPOINTMENT_STATUS_TRANSITIONS = {
    "DRAFT": {
        "SCHEDULED",
        "CANCELLED",
    },
    "SCHEDULED": {
        "CONFIRMED",
        "NO_SHOW",
        "CANCELLED",
    },
    "CONFIRMED": {
        "CHECKED_IN",
        "NO_SHOW",
        "CANCELLED",
    },
    "CHECKED_IN": {
        "IN_PROGRESS",
        "NO_SHOW",
        "CANCELLED",
    },
    "IN_PROGRESS": {
        "COMPLETED",
        "CANCELLED",
    },
    "COMPLETED": set(),
    "CANCELLED": set(),
    "NO_SHOW": set(),
}
APPOINTMENT_STATUS_TIMESTAMP_FIELDS = {
    "CONFIRMED": "confirmed_at",
    "CHECKED_IN": "checked_in_at",
    "IN_PROGRESS": "started_at",
    "COMPLETED": "completed_at",
    "CANCELLED": "cancelled_at",
    "NO_SHOW": "no_show_at",
}
APPOINTMENT_TERMINAL_STATUSES = frozenset(
    {
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
    }
)
APPOINTMENT_RESCHEDULABLE_STATUSES = frozenset(
    {
        "DRAFT",
        "SCHEDULED",
        "CONFIRMED",
    }
)
APPOINTMENT_LIFECYCLE_INPUT_FIELDS = frozenset(
    {
        "status",
        "confirmed_at",
        "checked_in_at",
        "started_at",
        "completed_at",
        "cancelled_at",
        "no_show_at",
        "cancellation_reason",
    }
)
APPOINTMENT_RESCHEDULE_INPUT_FIELDS = frozenset(
    {
        "scheduled_start",
        "scheduled_end",
        "practitioner_assignment_id",
        "practitioner_service_assignment_id",
    }
)
def appointment_allowed_statuses(
    status: str,
) -> list[str]:
    return sorted(
        APPOINTMENT_STATUS_TRANSITIONS.get(
            str(status or "").strip().upper(),
            set(),
        )
    )
def appointment_is_terminal(
    appointment,
) -> bool:
    return (
        appointment.status
        in APPOINTMENT_TERMINAL_STATUSES
    )
def appointment_can_reschedule(
    appointment,
) -> bool:
    return (
        appointment.status
        in APPOINTMENT_RESCHEDULABLE_STATUSES
    )
def validate_appointment_payload_control(
    *,
    appointment,
    payload,
    creating: bool,
) -> None:
    from django.core.exceptions import (
        ValidationError,
    )
    payload_keys = set(payload.keys())
    if creating:
        forbidden = (
            APPOINTMENT_LIFECYCLE_INPUT_FIELDS
            - {"status"}
        )
        provided_forbidden = sorted(
            payload_keys & forbidden
        )
        if provided_forbidden:
            raise ValidationError(
                {
                    field_name: (
                        "Lifecycle audit fields "
                        "are server-controlled."
                    )
                    for field_name
                    in provided_forbidden
                }
            )
        requested_status = str(
            payload.get(
                "status",
                appointment.status,
            )
            or appointment.status
        ).strip().upper()
        if requested_status not in {
            "DRAFT",
            "SCHEDULED",
        }:
            raise ValidationError(
                {
                    "status": (
                        "A new appointment may "
                        "only start as DRAFT or "
                        "SCHEDULED."
                    )
                }
            )
        return
    provided_lifecycle = sorted(
        payload_keys
        & APPOINTMENT_LIFECYCLE_INPUT_FIELDS
    )
    if provided_lifecycle:
        raise ValidationError(
            {
                field_name: (
                    "Use the appointment status "
                    "endpoint to update lifecycle "
                    "fields."
                )
                for field_name
                in provided_lifecycle
            }
        )
    reschedule_requested = bool(
        payload_keys
        & APPOINTMENT_RESCHEDULE_INPUT_FIELDS
    )
    if (
        reschedule_requested
        and not appointment_can_reschedule(
            appointment
        )
    ):
        raise ValidationError(
            {
                "scheduled_start": (
                    "The appointment cannot be "
                    "rescheduled after check-in, "
                    "after starting, or after "
                    "reaching a terminal status."
                )
            }
        )
def capture_appointment_schedule(
    appointment,
) -> dict:
    return {
        "scheduled_start": (
            appointment.scheduled_start
        ),
        "scheduled_end": (
            appointment.scheduled_end
        ),
        "practitioner_assignment_id": (
            appointment
            .practitioner_assignment_id
        ),
        "practitioner_service_assignment_id": (
            appointment
            .practitioner_service_assignment_id
        ),
        "status": appointment.status,
    }
def _iso(value):
    if value is None:
        return None
    return value.isoformat()
def finalize_appointment_reschedule(
    *,
    appointment,
    before: dict | None,
    actor,
    at=None,
) -> bool:
    if not before:
        return False
    changed = any(
        (
            before.get("scheduled_start")
            != appointment.scheduled_start,
            before.get("scheduled_end")
            != appointment.scheduled_end,
            before.get(
                "practitioner_assignment_id"
            )
            != appointment.practitioner_assignment_id,
            before.get(
                "practitioner_service_assignment_id"
            )
            != (
                appointment
                .practitioner_service_assignment_id
            ),
        )
    )
    if not changed:
        return False
    if (
        before.get("status")
        not in APPOINTMENT_RESCHEDULABLE_STATUSES
    ):
        from django.core.exceptions import (
            ValidationError,
        )
        raise ValidationError(
            {
                "scheduled_start": (
                    "The appointment cannot be "
                    "rescheduled in its current "
                    "status."
                )
            }
        )
    changed_at = at or timezone.now()
    if appointment.status == "CONFIRMED":
        appointment.status = "SCHEDULED"
        appointment.confirmed_at = None
    extra_data = dict(
        appointment.extra_data or {}
    )
    history = list(
        extra_data.get(
            "reschedule_history",
            [],
        )
        or []
    )
    history.append(
        {
            "from_scheduled_start": _iso(
                before.get("scheduled_start")
            ),
            "from_scheduled_end": _iso(
                before.get("scheduled_end")
            ),
            "to_scheduled_start": _iso(
                appointment.scheduled_start
            ),
            "to_scheduled_end": _iso(
                appointment.scheduled_end
            ),
            "from_practitioner_assignment_id": (
                before.get(
                    "practitioner_assignment_id"
                )
            ),
            "to_practitioner_assignment_id": (
                appointment
                .practitioner_assignment_id
            ),
            (
                "from_practitioner_service_"
                "assignment_id"
            ): before.get(
                (
                    "practitioner_service_"
                    "assignment_id"
                )
            ),
            (
                "to_practitioner_service_"
                "assignment_id"
            ): (
                appointment
                .practitioner_service_assignment_id
            ),
            "from_status": before.get("status"),
            "to_status": appointment.status,
            "changed_at": _iso(changed_at),
            "changed_by_id": getattr(
                actor,
                "id",
                None,
            ),
        }
    )
    extra_data["reschedule_history"] = (
        history[-50:]
    )
    extra_data["reschedule_count"] = int(
        extra_data.get(
            "reschedule_count",
            0,
        )
        or 0
    ) + 1
    appointment.extra_data = extra_data
    return True
def apply_appointment_status_transition(
    *,
    appointment,
    requested_status: str,
    actor,
    cancellation_reason: str = "",
    at=None,
) -> dict:
    from django.core.exceptions import (
        ValidationError,
    )
    normalized_status = str(
        requested_status or ""
    ).strip().upper()
    valid_statuses = {
        value
        for value, _label
        in (
            appointment
            ._meta
            .get_field("status")
            .choices
        )
    }
    if normalized_status not in valid_statuses:
        raise ValidationError(
            {
                "status": (
                    "Appointment status is invalid."
                ),
                "valid_statuses": sorted(
                    valid_statuses
                ),
            }
        )
    previous_status = appointment.status
    allowed_statuses = set(
        APPOINTMENT_STATUS_TRANSITIONS.get(
            previous_status,
            set(),
        )
    )
    if (
        normalized_status != previous_status
        and normalized_status
        not in allowed_statuses
    ):
        raise ValidationError(
            {
                "status": (
                    "Appointment status transition "
                    "is invalid."
                ),
                "current_status": previous_status,
                "allowed_statuses": sorted(
                    allowed_statuses
                ),
            }
        )
    reason = str(
        cancellation_reason or ""
    ).strip()
    if (
        normalized_status == "CANCELLED"
        and not reason
    ):
        raise ValidationError(
            {
                "cancellation_reason": (
                    "Cancellation reason is required "
                    "when cancelling an appointment."
                )
            }
        )
    if normalized_status == previous_status:
        return {
            "from_status": previous_status,
            "to_status": normalized_status,
            "changed": False,
            "timestamp_field": None,
        }
    changed_at = at or timezone.now()
    timestamp_field = (
        APPOINTMENT_STATUS_TIMESTAMP_FIELDS.get(
            normalized_status
        )
    )
    if normalized_status == "CANCELLED":
        appointment.cancellation_reason = reason
    if timestamp_field:
        setattr(
            appointment,
            timestamp_field,
            changed_at,
        )
    appointment.status = normalized_status
    appointment.updated_by = actor
    appointment.save()
    return {
        "from_status": previous_status,
        "to_status": normalized_status,
        "changed": True,
        "timestamp_field": timestamp_field,
        "changed_at": _iso(changed_at),
    }
# END APPOINTMENT_LIFECYCLE_ENGINE
