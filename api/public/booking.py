from __future__ import annotations
from datetime import (
    date,
    time,
    timedelta,
)
from typing import Any
from django.core.exceptions import ValidationError
from django.db.models import F
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from api.company.medical.practitioner_availability import (
    appointment_intervals,
    aware_datetime,
    intervals_overlap,
    schedule_queryset,
    time_off_queryset,
)
from companies.models import (
    Branch,
    BranchStatus,
    BranchType,
)
from medical.models import (
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerTimeOffStatus,
)
PUBLIC_BRANCH_TYPES = (
    BranchType.HEAD_OFFICE,
    BranchType.BRANCH,
    BranchType.SERVICE_CENTER,
)
PUBLIC_ASSIGNMENT_LIMIT = 500
def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
def _public_branch_queryset():
    return (
        Branch.objects
        .filter(
            status=BranchStatus.ACTIVE,
            is_active=True,
            branch_type__in=PUBLIC_BRANCH_TYPES,
        )
        .select_related("company")
        .order_by(
            "-is_default",
            "city",
            "branch_code",
            "id",
        )
    )
def _public_company():
    queryset = _public_branch_queryset()
    company_ids = list(
        queryset
        .values_list(
            "company_id",
            flat=True,
        )
        .distinct()[:2]
    )
    if len(company_ids) != 1:
        return None
    branch = (
        queryset
        .filter(
            company_id=company_ids[0]
        )
        .first()
    )
    if branch is None:
        return None
    return branch.company
def _assignment_queryset(company):
    return (
        MedicalPractitionerServiceAssignment
        .objects
        .filter(
            company=company,
            status="ACTIVE",
            practitioner_assignment__company=company,
            practitioner_assignment__is_active=True,
            practitioner_assignment__branch__status=(
                BranchStatus.ACTIVE
            ),
            practitioner_assignment__branch__is_active=True,
            practitioner_assignment__branch__branch_type__in=(
                PUBLIC_BRANCH_TYPES
            ),
            practitioner_assignment__practitioner__status=(
                "ACTIVE"
            ),
            practitioner_assignment__practitioner__is_accepting_appointments=True,
            service_offering__company=company,
            service_offering__status="ACTIVE",
            service_offering__online_booking_enabled=True,
            service_offering__catalog_item__item_type="SERVICE",
            service_offering__catalog_item__status="ACTIVE",
            service_offering__catalog_item__is_sellable=True,
            service_offering__branch_id=F(
                "practitioner_assignment__branch_id"
            ),
        )
        .select_related(
            "practitioner_assignment",
            "practitioner_assignment__branch",
            "practitioner_assignment__practitioner",
            (
                "practitioner_assignment__"
                "practitioner__primary_specialty"
            ),
            "service_offering",
            "service_offering__catalog_item",
            "service_offering__branch",
        )
        .order_by(
            "practitioner_assignment__branch_id",
            "service_offering_id",
            "practitioner_assignment__practitioner_id",
            "id",
        )
    )
def _is_public_assignment(
    assignment: MedicalPractitionerServiceAssignment,
) -> bool:
    try:
        return (
            bool(
                assignment
                .is_active_service_assignment
            )
            and bool(
                assignment
                .effective_online_booking_enabled
            )
        )
    except Exception:
        return False
def _public_assignments(
    company,
    *,
    assignment_id: int | None = None,
):
    queryset = _assignment_queryset(company)
    if assignment_id is not None:
        queryset = queryset.filter(
            id=assignment_id
        )
    results = []
    for assignment in queryset[:PUBLIC_ASSIGNMENT_LIMIT]:
        if _is_public_assignment(assignment):
            results.append(assignment)
    return results
def _serialize_specialty(
    specialty,
) -> dict[str, Any] | None:
    if specialty is None:
        return None
    name_ar = _text(
        getattr(
            specialty,
            "name_ar",
            "",
        )
    )
    name_en = _text(
        getattr(
            specialty,
            "name_en",
            "",
        )
    )
    return {
        "id": specialty.id,
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": (
            name_ar
            or name_en
            or _text(
                getattr(
                    specialty,
                    "display_name",
                    "",
                )
            )
        ),
    }
def _serialize_branch(
    branch: Branch,
) -> dict[str, Any]:
    name_ar = _text(
        branch.name_ar
    )
    name_en = _text(
        branch.name_en
    )
    return {
        "id": branch.id,
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": (
            name_ar
            or name_en
            or _text(
                branch.display_name
            )
        ),
        "city": _text(
            branch.city
        ),
        "region": _text(
            branch.region
        ),
        "is_default": bool(
            branch.is_default
        ),
    }
def _serialize_assignment(
    assignment: MedicalPractitionerServiceAssignment,
) -> dict[str, Any]:
    practitioner_assignment = (
        assignment.practitioner_assignment
    )
    practitioner = (
        practitioner_assignment.practitioner
    )
    branch = (
        practitioner_assignment.branch
    )
    service = (
        assignment.service_offering
    )
    catalog_item = (
        service.catalog_item
    )
    service_name_ar = _text(
        getattr(
            catalog_item,
            "name_ar",
            "",
        )
    )
    service_name_en = _text(
        getattr(
            catalog_item,
            "name_en",
            "",
        )
    )
    service_display_name = (
        service_name_ar
        or service_name_en
        or _text(
            getattr(
                catalog_item,
                "name",
                "",
            )
        )
        or _text(
            getattr(
                catalog_item,
                "code",
                "",
            )
        )
    )
    practitioner_name_ar = _text(
        practitioner.full_name_ar
    )
    practitioner_name_en = _text(
        practitioner.full_name_en
    )
    return {
        "id": assignment.id,
        "branch": (
            _serialize_branch(
                branch
            )
        ),
        "service": {
            "id": service.id,
            "name_ar": (
                service_name_ar
            ),
            "name_en": (
                service_name_en
            ),
            "display_name": (
                service_display_name
            ),
            "duration_minutes": (
                assignment
                .effective_duration_minutes
            ),
            "total_slot_minutes": (
                assignment
                .total_slot_minutes
            ),
            "effective_sale_price": str(
                service
                .effective_sale_price
            ),
        },
        "practitioner": {
            "id": practitioner.id,
            "full_name_ar": (
                practitioner_name_ar
            ),
            "full_name_en": (
                practitioner_name_en
            ),
            "display_name": (
                practitioner_name_ar
                or practitioner_name_en
            ),
            "professional_title": _text(
                practitioner
                .professional_title
            ),
            "primary_specialty": (
                _serialize_specialty(
                    practitioner
                    .primary_specialty
                )
            ),
        },
    }
def _parse_positive_integer(
    value,
    field_name: str,
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
    if parsed < 1:
        raise ValidationError(
            {
                field_name: [
                    "Value must be at least 1."
                ]
            }
        )
    return parsed
def _parse_booking_date(
    value,
) -> date:
    try:
        result = date.fromisoformat(
            str(
                value or ""
            ).strip()
        )
    except (TypeError, ValueError):
        raise ValidationError(
            {
                "date": [
                    (
                        "Provide a valid ISO date "
                        "in YYYY-MM-DD format."
                    )
                ]
            }
        )
    if result < timezone.localdate():
        raise ValidationError(
            {
                "date": [
                    "Past dates cannot be booked."
                ]
            }
        )
    return result
def _validation_payload(
    error: ValidationError,
):
    if hasattr(
        error,
        "message_dict",
    ):
        return {
            key: [
                str(message)
                for message in messages
            ]
            for key, messages
            in error.message_dict.items()
        }
    return {
        "non_field_errors": [
            str(message)
            for message
            in error.messages
        ]
    }
@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_options(
    request: Request,
) -> Response:
    del request
    company = _public_company()
    if company is None:
        return Response(
            {
                "success": True,
                "branches": [],
                "assignments": [],
            }
        )
    branches = list(
        _public_branch_queryset()
        .filter(
            company=company
        )
    )
    assignments = (
        _public_assignments(
            company
        )
    )
    return Response(
        {
            "success": True,
            "branches": [
                _serialize_branch(
                    branch
                )
                for branch in branches
            ],
            "assignments": [
                _serialize_assignment(
                    assignment
                )
                for assignment
                in assignments
            ],
        }
    )
@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_availability(
    request: Request,
) -> Response:
    company = _public_company()
    if company is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Public booking is not "
                    "currently available."
                ),
            },
            status=404,
        )
    try:
        assignment_id = (
            _parse_positive_integer(
                request.query_params.get(
                    "practitioner_service_assignment_id"
                ),
                "practitioner_service_assignment_id",
            )
        )
        target_date = (
            _parse_booking_date(
                request.query_params.get(
                    "date"
                )
            )
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Availability query is invalid."
                ),
                "errors": (
                    _validation_payload(
                        error
                    )
                ),
            },
            status=400,
        )
    assignments = (
        _public_assignments(
            company,
            assignment_id=assignment_id,
        )
    )
    if len(assignments) != 1:
        return Response(
            {
                "success": False,
                "message": (
                    "Public booking option "
                    "was not found."
                ),
            },
            status=404,
        )
    service_assignment = (
        assignments[0]
    )
    practitioner_assignment = (
        service_assignment
        .practitioner_assignment
    )
    schedules = list(
        schedule_queryset(
            company
        )
        .filter(
            practitioner_assignment=(
                practitioner_assignment
            ),
            weekday=(
                target_date.weekday()
            ),
            is_active=True,
        )
        .prefetch_related(
            "schedule_breaks"
        )
    )
    schedules = [
        schedule
        for schedule in schedules
        if schedule.applies_on(
            target_date
        )
    ]
    day_start = aware_datetime(
        target_date,
        time.min,
    )
    day_end = aware_datetime(
        (
            target_date
            + timedelta(days=1)
        ),
        time.min,
    )
    time_off_intervals = [
        (
            item.starts_at,
            item.ends_at,
        )
        for item in (
            time_off_queryset(
                company
            )
            .filter(
                practitioner_assignment=(
                    practitioner_assignment
                ),
                status=(
                    MedicalPractitionerTimeOffStatus
                    .APPROVED
                ),
                starts_at__lt=(
                    day_end
                ),
                ends_at__gt=(
                    day_start
                ),
            )
        )
    ]
    booked_intervals = (
        appointment_intervals(
            company=company,
            practitioner_assignment=(
                practitioner_assignment
            ),
            day_start=day_start,
            day_end=day_end,
        )
    )
    total_slot_minutes = (
        service_assignment
        .total_slot_minutes
    )
    now = timezone.now()
    slots = []
    for schedule in schedules:
        schedule_start = (
            aware_datetime(
                target_date,
                schedule.start_time,
            )
        )
        # A published closing boundary of 24:00 cannot be
        # represented directly by Django TimeField. When
        # an explicitly normalized schedule preserves that
        # source boundary in metadata, treat its technical
        # 23:59:59 value as midnight of the following day.
        schedule_end_date = target_date
        schedule_end_time = schedule.end_time

        schedule_extra = (
            schedule.extra_data
            if isinstance(
                schedule.extra_data,
                dict,
            )
            else {}
        )

        if (
            schedule.end_time
            == time(23, 59, 59)
            and schedule_extra.get(
                "source_end_time"
            )
            == "24:00"
            and schedule_extra.get(
                "technical_normalization"
            )
            == (
                "SOURCE_24_00_TO_TIMEFIELD_"
                "23_59_59"
            )
        ):
            schedule_end_date = (
                target_date
                + timedelta(days=1)
            )
            schedule_end_time = time.min

        schedule_end = (
            aware_datetime(
                schedule_end_date,
                schedule_end_time,
            )
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
                schedule
                .schedule_breaks
                .all()
            )
            if item.is_active
        ]
        step_minutes = max(
            schedule
            .slot_interval_minutes,
            total_slot_minutes,
        )
        candidate_start = (
            schedule_start
        )
        while (
            candidate_start
            + timedelta(
                minutes=(
                    total_slot_minutes
                )
            )
            <= schedule_end
        ):
            candidate_end = (
                candidate_start
                + timedelta(
                    minutes=(
                        total_slot_minutes
                    )
                )
            )
            blocked = any(
                intervals_overlap(
                    candidate_start,
                    candidate_end,
                    block_start,
                    block_end,
                )
                for (
                    block_start,
                    block_end,
                ) in (
                    recurring_breaks
                    + time_off_intervals
                    + booked_intervals
                )
            )
            if (
                not blocked
                and candidate_start > now
            ):
                slots.append(
                    {
                        "start": (
                            candidate_start
                            .isoformat()
                        ),
                        "end": (
                            candidate_end
                            .isoformat()
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
                    }
                )
            candidate_start = (
                candidate_start
                + timedelta(
                    minutes=(
                        step_minutes
                    )
                )
            )
    slots.sort(
        key=lambda item: item["start"]
    )
    return Response(
        {
            "success": True,
            "date": (
                target_date
                .isoformat()
            ),
            "timezone": str(
                timezone
                .get_current_timezone()
            ),
            "practitioner_service_assignment_id": (
                service_assignment.id
            ),
            "count": len(slots),
            "slots": slots,
            "available_slots": slots,
        }
    )
