from __future__ import annotations

from datetime import datetime

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission
from companies.models import Branch
from medical.models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalEncounter,
    MedicalPractitioner,
    MedicalReferral,
    MedicalReferralPriority,
    MedicalReferralStatus,
)

from .encounters import (
    company_or_error,
    encounter_queryset,
    ensure_permission,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicalreferral"
CREATE_PERMISSION = "medical.add_medicalreferral"
UPDATE_PERMISSION = "medical.change_medicalreferral"
STATUS_PERMISSION = UPDATE_PERMISSION

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]

VALID_PRIORITY_VALUES = set(MedicalReferralPriority.values)
VALID_STATUS_VALUES = set(MedicalReferralStatus.values)

STATUS_TRANSITIONS = {
    MedicalReferralStatus.DRAFT: {
        MedicalReferralStatus.SENT,
        MedicalReferralStatus.CANCELLED,
    },
    MedicalReferralStatus.SENT: {
        MedicalReferralStatus.ACCEPTED,
        MedicalReferralStatus.REJECTED,
        MedicalReferralStatus.CANCELLED,
        MedicalReferralStatus.EXPIRED,
    },
    MedicalReferralStatus.ACCEPTED: {
        MedicalReferralStatus.IN_PROGRESS,
        MedicalReferralStatus.CANCELLED,
        MedicalReferralStatus.EXPIRED,
    },
    MedicalReferralStatus.IN_PROGRESS: {
        MedicalReferralStatus.COMPLETED,
        MedicalReferralStatus.CANCELLED,
        MedicalReferralStatus.EXPIRED,
    },
    MedicalReferralStatus.COMPLETED: set(),
    MedicalReferralStatus.REJECTED: set(),
    MedicalReferralStatus.CANCELLED: set(),
    MedicalReferralStatus.EXPIRED: set(),
}


def referral_queryset(company):
    return (
        MedicalReferral.objects
        .filter(company=company)
        .select_related(
            "company",
            "source_encounter",
            "patient",
            "referring_practitioner",
            "receiving_practitioner",
            "target_branch",
            "target_department",
            "target_clinic",
            "accepted_by",
            "rejected_by",
            "completed_by",
            "cancelled_by",
            "created_by",
            "updated_by",
        )
    )


def _display_name(instance) -> str:
    if instance is None:
        return ""

    for attribute in (
        "display_name",
        "full_name",
        "full_name_ar",
        "full_name_en",
        "name_ar",
        "name_en",
        "name",
    ):
        value = getattr(instance, attribute, "")

        if value:
            return str(value)

    return str(instance)


def _iso(value):
    return value.isoformat() if value else None


def serialize_referral(referral: MedicalReferral) -> dict:
    return {
        "id": referral.id,
        "company_id": referral.company_id,
        "referral_number": referral.referral_number,
        "source_encounter_id": referral.source_encounter_id,
        "source_encounter_number": (
            referral.source_encounter.encounter_number
            if referral.source_encounter_id
            else ""
        ),
        "patient_id": referral.patient_id,
        "patient_number": (
            referral.patient.patient_number
            if referral.patient_id
            else ""
        ),
        "patient_name": _display_name(referral.patient),
        "referring_practitioner_id": (
            referral.referring_practitioner_id
        ),
        "referring_practitioner_name": _display_name(
            referral.referring_practitioner
        ),
        "receiving_practitioner_id": (
            referral.receiving_practitioner_id
        ),
        "receiving_practitioner_name": _display_name(
            referral.receiving_practitioner
        ),
        "target_branch_id": referral.target_branch_id,
        "target_branch_name": _display_name(
            referral.target_branch
        ),
        "target_department_id": referral.target_department_id,
        "target_department_name": _display_name(
            referral.target_department
        ),
        "target_clinic_id": referral.target_clinic_id,
        "target_clinic_name": _display_name(
            referral.target_clinic
        ),
        "priority": referral.priority,
        "priority_label": referral.get_priority_display(),
        "status": referral.status,
        "status_label": referral.get_status_display(),
        "referral_reason": referral.referral_reason,
        "clinical_summary": referral.clinical_summary,
        "requested_service": referral.requested_service,
        "referred_at": _iso(referral.referred_at),
        "sent_at": _iso(referral.sent_at),
        "accepted_at": _iso(referral.accepted_at),
        "rejected_at": _iso(referral.rejected_at),
        "started_at": _iso(referral.started_at),
        "completed_at": _iso(referral.completed_at),
        "cancelled_at": _iso(referral.cancelled_at),
        "expires_at": _iso(referral.expires_at),
        "accepted_by_id": referral.accepted_by_id,
        "rejected_by_id": referral.rejected_by_id,
        "completed_by_id": referral.completed_by_id,
        "cancelled_by_id": referral.cancelled_by_id,
        "rejection_reason": referral.rejection_reason,
        "cancellation_reason": referral.cancellation_reason,
        "notes": referral.notes,
        "extra_data": referral.extra_data,
        "is_terminal": referral.is_terminal,
        "allows_record_access": referral.allows_record_access,
        "created_by_id": referral.created_by_id,
        "updated_by_id": referral.updated_by_id,
        "created_at": _iso(referral.created_at),
        "updated_at": _iso(referral.updated_at),
    }


def _parse_optional_id(value, field_name: str) -> int | None:
    if value in (None, ""):
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: (
                    "A valid positive integer is required."
                )
            }
        )

    if parsed <= 0:
        raise ValidationError(
            {
                field_name: (
                    "A valid positive integer is required."
                )
            }
        )

    return parsed


def _parse_required_id(value, field_name: str) -> int:
    parsed = _parse_optional_id(value, field_name)

    if parsed is None:
        raise ValidationError(
            {
                field_name: "This field is required."
            }
        )

    return parsed


def _parse_datetime_value(value, field_name: str):
    if value in (None, ""):
        return None

    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = parse_datetime(str(value).strip())

    if parsed is None:
        raise ValidationError(
            {
                field_name: (
                    "Provide a valid ISO 8601 datetime."
                )
            }
        )

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(
            parsed,
            timezone.get_current_timezone(),
        )

    return parsed


def _parse_json_object(value, field_name: str) -> dict:
    if value in (None, ""):
        return {}

    if not isinstance(value, dict):
        raise ValidationError(
            {
                field_name: "A JSON object is required."
            }
        )

    return value


def _related_or_error(
    model,
    *,
    company,
    value,
    field_name: str,
):
    object_id = _parse_optional_id(value, field_name)

    if object_id is None:
        return None

    instance = model.objects.filter(
        company=company,
        id=object_id,
    ).first()

    if instance is None:
        raise ValidationError(
            {
                field_name: (
                    "Related record was not found "
                    "inside the active company."
                )
            }
        )

    return instance


def _apply_destination(
    referral: MedicalReferral,
    *,
    company,
    data,
    creating: bool,
) -> None:
    destination_fields = (
        (
            "receiving_practitioner_id",
            "receiving_practitioner",
            MedicalPractitioner,
        ),
        (
            "target_branch_id",
            "target_branch",
            Branch,
        ),
        (
            "target_department_id",
            "target_department",
            MedicalDepartment,
        ),
        (
            "target_clinic_id",
            "target_clinic",
            MedicalClinic,
        ),
    )

    for input_name, attribute_name, model in destination_fields:
        if creating or input_name in data:
            setattr(
                referral,
                attribute_name,
                _related_or_error(
                    model,
                    company=company,
                    value=data.get(input_name),
                    field_name=input_name,
                ),
            )


def _validation_response(
    exc: ValidationError,
    *,
    message: str,
) -> Response:
    return Response(
        {
            "success": False,
            "message": message,
            "errors": validation_payload(exc),
        },
        status=400,
    )


def _not_found_response() -> Response:
    return Response(
        {
            "success": False,
            "message": "Medical referral was not found.",
        },
        status=404,
    )


def _apply_collection_filters(queryset, request: Request):
    query = str(
        request.query_params.get("q") or ""
    ).strip()

    if query:
        queryset = queryset.filter(
            Q(referral_number__icontains=query)
            | Q(referral_reason__icontains=query)
            | Q(requested_service__icontains=query)
            | Q(source_encounter__encounter_number__icontains=query)
            | Q(patient__patient_number__icontains=query)
            | Q(patient__full_name__icontains=query)
            | Q(
                referring_practitioner__practitioner_number__icontains=query
            )
            | Q(
                referring_practitioner__full_name_ar__icontains=query
            )
            | Q(
                referring_practitioner__full_name_en__icontains=query
            )
            | Q(
                receiving_practitioner__practitioner_number__icontains=query
            )
            | Q(
                receiving_practitioner__full_name_ar__icontains=query
            )
            | Q(
                receiving_practitioner__full_name_en__icontains=query
            )
        )

    status_value = str(
        request.query_params.get("status") or ""
    ).strip().upper()

    if status_value:
        if status_value not in VALID_STATUS_VALUES:
            raise ValidationError(
                {"status": "Invalid referral status."}
            )

        queryset = queryset.filter(status=status_value)

    priority_value = str(
        request.query_params.get("priority") or ""
    ).strip().upper()

    if priority_value:
        if priority_value not in VALID_PRIORITY_VALUES:
            raise ValidationError(
                {"priority": "Invalid referral priority."}
            )

        queryset = queryset.filter(
            priority=priority_value
        )

    integer_filters = (
        ("patient_id", "patient_id"),
        ("source_encounter_id", "source_encounter_id"),
        (
            "referring_practitioner_id",
            "referring_practitioner_id",
        ),
        (
            "receiving_practitioner_id",
            "receiving_practitioner_id",
        ),
        ("target_branch_id", "target_branch_id"),
        (
            "target_department_id",
            "target_department_id",
        ),
        ("target_clinic_id", "target_clinic_id"),
    )

    for parameter_name, lookup in integer_filters:
        if parameter_name not in request.query_params:
            continue

        object_id = _parse_required_id(
            request.query_params.get(parameter_name),
            parameter_name,
        )

        queryset = queryset.filter(
            **{lookup: object_id}
        )

    return queryset


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def referral_collection(request: Request) -> Response:
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
            queryset = _apply_collection_filters(
                referral_queryset(company),
                request,
            )
        except ValidationError as exc:
            return _validation_response(
                exc,
                message="Referral filters are invalid.",
            )

        items = [
            serialize_referral(referral)
            for referral in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
            }
        )

    try:
        source_encounter_id = _parse_required_id(
            request.data.get("source_encounter_id"),
            "source_encounter_id",
        )

        source_encounter = encounter_queryset(
            company
        ).filter(
            id=source_encounter_id,
        ).first()

        if source_encounter is None:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Source medical encounter "
                        "was not found."
                    ),
                },
                status=404,
            )

        if not source_encounter.practitioner_id:
            raise ValidationError(
                {
                    "source_encounter_id": (
                        "Source encounter must have "
                        "a practitioner before referral."
                    )
                }
            )

        priority = str(
            request.data.get(
                "priority",
                MedicalReferralPriority.ROUTINE,
            )
            or MedicalReferralPriority.ROUTINE
        ).strip().upper()

        if priority not in VALID_PRIORITY_VALUES:
            raise ValidationError(
                {"priority": "Invalid referral priority."}
            )

        referral = MedicalReferral(
            company=company,
            source_encounter=source_encounter,
            patient=source_encounter.patient,
            referring_practitioner=(
                source_encounter.practitioner
            ),
            referral_number=str(
                request.data.get("referral_number") or ""
            ),
            priority=priority,
            status=MedicalReferralStatus.DRAFT,
            referral_reason=str(
                request.data.get("referral_reason") or ""
            ),
            clinical_summary=str(
                request.data.get("clinical_summary") or ""
            ),
            requested_service=str(
                request.data.get("requested_service") or ""
            ),
            referred_at=(
                _parse_datetime_value(
                    request.data.get("referred_at"),
                    "referred_at",
                )
                or timezone.now()
            ),
            expires_at=_parse_datetime_value(
                request.data.get("expires_at"),
                "expires_at",
            ),
            notes=str(
                request.data.get("notes") or ""
            ),
            extra_data=_parse_json_object(
                request.data.get("extra_data"),
                "extra_data",
            ),
            created_by=request.user,
            updated_by=request.user,
        )

        _apply_destination(
            referral,
            company=company,
            data=request.data,
            creating=True,
        )

        referral.save()
    except ValidationError as exc:
        return _validation_response(
            exc,
            message="Medical referral could not be created.",
        )

    return Response(
        {
            "success": True,
            "message": "Medical referral created successfully.",
            "item": serialize_referral(referral),
        },
        status=201,
    )


referral_collection.required_company_permissions = (
    ALL_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def referral_detail(
    request: Request,
    referral_id: int,
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

    referral = referral_queryset(company).filter(
        id=referral_id,
    ).first()

    if referral is None:
        return _not_found_response()

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_referral(referral),
            }
        )

    if referral.status != MedicalReferralStatus.DRAFT:
        return Response(
            {
                "success": False,
                "message": (
                    "Only draft referrals can be edited."
                ),
            },
            status=400,
        )

    data = request.data

    try:
        if "referral_number" in data:
            referral.referral_number = str(
                data.get("referral_number") or ""
            )

        if "priority" in data:
            priority = str(
                data.get("priority") or ""
            ).strip().upper()

            if priority not in VALID_PRIORITY_VALUES:
                raise ValidationError(
                    {
                        "priority": (
                            "Invalid referral priority."
                        )
                    }
                )

            referral.priority = priority

        text_fields = (
            "referral_reason",
            "clinical_summary",
            "requested_service",
            "notes",
        )

        for field_name in text_fields:
            if field_name in data:
                setattr(
                    referral,
                    field_name,
                    str(data.get(field_name) or ""),
                )

        if "referred_at" in data:
            referral.referred_at = (
                _parse_datetime_value(
                    data.get("referred_at"),
                    "referred_at",
                )
                or referral.referred_at
            )

        if "expires_at" in data:
            referral.expires_at = _parse_datetime_value(
                data.get("expires_at"),
                "expires_at",
            )

        if "extra_data" in data:
            referral.extra_data = _parse_json_object(
                data.get("extra_data"),
                "extra_data",
            )

        _apply_destination(
            referral,
            company=company,
            data=data,
            creating=False,
        )

        referral.updated_by = request.user
        referral.save()
    except ValidationError as exc:
        return _validation_response(
            exc,
            message="Medical referral could not be updated.",
        )

    return Response(
        {
            "success": True,
            "message": "Medical referral updated successfully.",
            "item": serialize_referral(referral),
        }
    )


referral_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


def _status_value(data) -> str:
    value = str(
        data.get("status")
        or data.get("action")
        or ""
    ).strip().upper()

    action_aliases = {
        "SEND": MedicalReferralStatus.SENT,
        "ACCEPT": MedicalReferralStatus.ACCEPTED,
        "START": MedicalReferralStatus.IN_PROGRESS,
        "IN-PROGRESS": MedicalReferralStatus.IN_PROGRESS,
        "COMPLETE": MedicalReferralStatus.COMPLETED,
        "REJECT": MedicalReferralStatus.REJECTED,
        "CANCEL": MedicalReferralStatus.CANCELLED,
        "EXPIRE": MedicalReferralStatus.EXPIRED,
    }

    return action_aliases.get(value, value)


@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def referral_status(
    request: Request,
    referral_id: int,
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

    referral = referral_queryset(company).filter(
        id=referral_id,
    ).first()

    if referral is None:
        return _not_found_response()

    target_status = _status_value(request.data)

    if target_status not in VALID_STATUS_VALUES:
        return Response(
            {
                "success": False,
                "message": "Provide a valid referral status.",
            },
            status=400,
        )

    allowed = STATUS_TRANSITIONS.get(
        referral.status,
        set(),
    )

    if target_status not in allowed:
        return Response(
            {
                "success": False,
                "message": (
                    "Invalid medical referral "
                    "status transition."
                ),
                "current_status": referral.status,
                "requested_status": target_status,
            },
            status=400,
        )

    now = timezone.now()

    try:
        if target_status == MedicalReferralStatus.SENT:
            referral.sent_at = now

        elif target_status == MedicalReferralStatus.ACCEPTED:
            referral.accepted_at = now
            referral.accepted_by = request.user

        elif target_status == MedicalReferralStatus.IN_PROGRESS:
            referral.started_at = now

        elif target_status == MedicalReferralStatus.COMPLETED:
            referral.completed_at = now
            referral.completed_by = request.user

        elif target_status == MedicalReferralStatus.REJECTED:
            reason = str(
                request.data.get("rejection_reason")
                or request.data.get("reason")
                or ""
            ).strip()

            if not reason:
                raise ValidationError(
                    {
                        "rejection_reason": (
                            "Rejection reason is required."
                        )
                    }
                )

            referral.rejected_at = now
            referral.rejected_by = request.user
            referral.rejection_reason = reason

        elif target_status == MedicalReferralStatus.CANCELLED:
            reason = str(
                request.data.get("cancellation_reason")
                or request.data.get("reason")
                or ""
            ).strip()

            if not reason:
                raise ValidationError(
                    {
                        "cancellation_reason": (
                            "Cancellation reason is required."
                        )
                    }
                )

            referral.cancelled_at = now
            referral.cancelled_by = request.user
            referral.cancellation_reason = reason

        elif target_status == MedicalReferralStatus.EXPIRED:
            referral.expires_at = now

        referral.status = target_status
        referral.updated_by = request.user
        referral.save()
    except ValidationError as exc:
        return _validation_response(
            exc,
            message=(
                "Medical referral status "
                "could not be updated."
            ),
        )

    return Response(
        {
            "success": True,
            "message": (
                "Medical referral status "
                "updated successfully."
            ),
            "item": serialize_referral(referral),
        }
    )


referral_status.required_company_permissions = [
    STATUS_PERMISSION,
]
