
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
