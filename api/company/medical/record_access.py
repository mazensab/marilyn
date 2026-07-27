from __future__ import annotations
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response
from api.permissions import HasAnyCompanyPermission
from medical.models import (
    MedicalRecordShareScope,
    MedicalRecordShareSection,
    MedicalReferralAccessStatus,
    MedicalReferralRecordAccess,
)
from .referrals import (
    _parse_datetime_value as parse_datetime_value,
    _parse_json_object as parse_json_object,
    company_or_error,
    ensure_permission,
    referral_queryset,
)
VIEW_PERMISSION = (
    "medical.view_medicalreferralrecordaccess"
)
CREATE_PERMISSION = (
    "medical.add_medicalreferralrecordaccess"
)
UPDATE_PERMISSION = (
    "medical.change_medicalreferralrecordaccess"
)
STATUS_PERMISSION = UPDATE_PERMISSION
ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]
VALID_SCOPE_VALUES = set(
    MedicalRecordShareScope.values
)
VALID_SECTION_VALUES = set(
    MedicalRecordShareSection.values
)
VALID_STATUS_VALUES = set(
    MedicalReferralAccessStatus.values
)
STATUS_TRANSITIONS = {
    MedicalReferralAccessStatus.PENDING: {
        MedicalReferralAccessStatus.ACTIVE,
        MedicalReferralAccessStatus.REJECTED,
    },
    MedicalReferralAccessStatus.ACTIVE: {
        MedicalReferralAccessStatus.REVOKED,
        MedicalReferralAccessStatus.EXPIRED,
    },
    MedicalReferralAccessStatus.REJECTED: set(),
    MedicalReferralAccessStatus.REVOKED: set(),
    MedicalReferralAccessStatus.EXPIRED: set(),
}
def validation_payload(
    exc: ValidationError,
) -> dict:
    if hasattr(exc, "message_dict"):
        return exc.message_dict
    messages = list(
        getattr(exc, "messages", [])
    )
    return {
        "non_field_errors": (
            messages
            or [str(exc)]
        )
    }
def record_access_queryset(company):
    return (
        MedicalReferralRecordAccess.objects
        .filter(company=company)
        .select_related(
            "company",
            "referral",
            "patient",
            "receiving_practitioner",
            "granted_by",
            "accepted_by",
            "rejected_by",
            "revoked_by",
            "created_by",
            "updated_by",
        )
    )
def _iso(value):
    return value.isoformat() if value else None
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
def serialize_record_access(
    access: MedicalReferralRecordAccess,
) -> dict:
    return {
        "id": access.id,
        "company_id": access.company_id,
        "referral_id": access.referral_id,
        "referral_number": (
            access.referral.referral_number
            if access.referral_id
            else ""
        ),
        "referral_status": (
            access.referral.status
            if access.referral_id
            else ""
        ),
        "referral_allows_record_access": (
            access.referral.allows_record_access
            if access.referral_id
            else False
        ),
        "patient_id": access.patient_id,
        "patient_number": (
            access.patient.patient_number
            if access.patient_id
            else ""
        ),
        "patient_name": _display_name(
            access.patient
        ),
        "receiving_practitioner_id": (
            access.receiving_practitioner_id
        ),
        "receiving_practitioner_name": (
            _display_name(
                access.receiving_practitioner
            )
        ),
        "scope": access.scope,
        "status": access.status,
        "shared_sections": access.shared_sections,
        "access_starts_at": _iso(
            access.access_starts_at
        ),
        "access_ends_at": _iso(
            access.access_ends_at
        ),
        "is_effective": access.is_effective,
        "granted_by_id": access.granted_by_id,
        "granted_at": _iso(access.granted_at),
        "accepted_by_id": access.accepted_by_id,
        "accepted_at": _iso(access.accepted_at),
        "rejected_by_id": access.rejected_by_id,
        "rejected_at": _iso(access.rejected_at),
        "rejection_reason": access.rejection_reason,
        "revoked_by_id": access.revoked_by_id,
        "revoked_at": _iso(access.revoked_at),
        "revocation_reason": access.revocation_reason,
        "notes": access.notes,
        "extra_data": access.extra_data,
        "created_by_id": access.created_by_id,
        "updated_by_id": access.updated_by_id,
        "created_at": _iso(access.created_at),
        "updated_at": _iso(access.updated_at),
    }
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
def _referral_not_found() -> Response:
    return Response(
        {
            "success": False,
            "message": "Medical referral was not found.",
        },
        status=404,
    )
def _access_not_found() -> Response:
    return Response(
        {
            "success": False,
            "message": (
                "Medical record access was not found."
            ),
        },
        status=404,
    )
def _parse_sections(value) -> list[str]:
    if value in (None, ""):
        return []
    if not isinstance(value, list):
        raise ValidationError(
            {
                "shared_sections": (
                    "Shared sections must be a list."
                )
            }
        )
    sections = []
    for raw_section in value:
        section = str(
            raw_section or ""
        ).strip().upper()
        if not section:
            continue
        if section not in VALID_SECTION_VALUES:
            raise ValidationError(
                {
                    "shared_sections": (
                        "One or more shared sections "
                        "are invalid."
                    )
                }
            )
        if section not in sections:
            sections.append(section)
    return sections
def _apply_editable_payload(
    access: MedicalReferralRecordAccess,
    data,
) -> None:
    if "scope" in data:
        scope = str(
            data.get("scope") or ""
        ).strip().upper()
        if scope not in VALID_SCOPE_VALUES:
            raise ValidationError(
                {
                    "scope": (
                        "Provide a valid record "
                        "sharing scope."
                    )
                }
            )
        access.scope = scope
    if "shared_sections" in data:
        access.shared_sections = _parse_sections(
            data.get("shared_sections")
        )
    if "access_starts_at" in data:
        access.access_starts_at = (
            parse_datetime_value(
                data.get("access_starts_at"),
                "access_starts_at",
            )
        )
    if "access_ends_at" in data:
        access.access_ends_at = (
            parse_datetime_value(
                data.get("access_ends_at"),
                "access_ends_at",
            )
        )
    if "notes" in data:
        access.notes = str(
            data.get("notes") or ""
        )
    if "extra_data" in data:
        access.extra_data = parse_json_object(
            data.get("extra_data"),
            "extra_data",
        )
def _status_value(data) -> str:
    value = str(
        data.get("status")
        or data.get("action")
        or ""
    ).strip().upper()
    aliases = {
        "ACTIVATE": MedicalReferralAccessStatus.ACTIVE,
        "ACCEPT": MedicalReferralAccessStatus.ACTIVE,
        "GRANT": MedicalReferralAccessStatus.ACTIVE,
        "REJECT": MedicalReferralAccessStatus.REJECTED,
        "REVOKE": MedicalReferralAccessStatus.REVOKED,
        "EXPIRE": MedicalReferralAccessStatus.EXPIRED,
    }
    return aliases.get(value, value)
@api_view(["GET", "POST", "PATCH"])
@permission_classes([HasAnyCompanyPermission])
def record_access_resource(
    request: Request,
    referral_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    permission = {
        "GET": VIEW_PERMISSION,
        "POST": CREATE_PERMISSION,
        "PATCH": UPDATE_PERMISSION,
    }[request.method]
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
        return _referral_not_found()
    access = record_access_queryset(company).filter(
        referral=referral,
    ).first()
    if request.method == "GET":
        if access is None:
            return _access_not_found()
        return Response(
            {
                "success": True,
                "item": serialize_record_access(access),
            }
        )
    if request.method == "POST":
        if access is not None:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Medical record access already "
                        "exists for this referral."
                    ),
                },
                status=409,
            )
        access = MedicalReferralRecordAccess(
            company=company,
            referral=referral,
            patient=referral.patient,
            receiving_practitioner=(
                referral.receiving_practitioner
            ),
            status=(
                MedicalReferralAccessStatus.PENDING
            ),
            created_by=request.user,
            updated_by=request.user,
        )
        try:
            with transaction.atomic():
                _apply_editable_payload(
                    access,
                    request.data,
                )
                access.save()
        except ValidationError as exc:
            return _validation_response(
                exc,
                message=(
                    "Medical record access could "
                    "not be created."
                ),
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Medical record access already "
                        "exists for this referral."
                    ),
                },
                status=409,
            )
        access = record_access_queryset(company).get(
            id=access.id,
        )
        return Response(
            {
                "success": True,
                "message": (
                    "Medical record access created "
                    "successfully."
                ),
                "item": serialize_record_access(access),
            },
            status=201,
        )
    if access is None:
        return _access_not_found()
    if (
        access.status
        != MedicalReferralAccessStatus.PENDING
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Only pending medical record "
                    "access can be edited."
                ),
            },
            status=400,
        )
    try:
        with transaction.atomic():
            _apply_editable_payload(
                access,
                request.data,
            )
            access.updated_by = request.user
            access.save()
    except ValidationError as exc:
        return _validation_response(
            exc,
            message=(
                "Medical record access could "
                "not be updated."
            ),
        )
    access = record_access_queryset(company).get(
        id=access.id,
    )
    return Response(
        {
            "success": True,
            "message": (
                "Medical record access updated "
                "successfully."
            ),
            "item": serialize_record_access(access),
        }
    )
record_access_resource.required_company_permissions = (
    ALL_PERMISSIONS
)
@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def record_access_status(
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
        return _referral_not_found()
    access = record_access_queryset(company).filter(
        referral=referral,
    ).first()
    if access is None:
        return _access_not_found()
    target_status = _status_value(request.data)
    if target_status not in VALID_STATUS_VALUES:
        return Response(
            {
                "success": False,
                "message": (
                    "Provide a valid medical record "
                    "access status."
                ),
            },
            status=400,
        )
    allowed = STATUS_TRANSITIONS.get(
        access.status,
        set(),
    )
    if target_status not in allowed:
        return Response(
            {
                "success": False,
                "message": (
                    "Invalid medical record access "
                    "status transition."
                ),
                "current_status": access.status,
                "requested_status": target_status,
            },
            status=400,
        )
    now = timezone.now()
    try:
        with transaction.atomic():
            if (
                target_status
                == MedicalReferralAccessStatus.ACTIVE
            ):
                if not referral.allows_record_access:
                    raise ValidationError(
                        {
                            "referral": (
                                "The referral status does "
                                "not allow medical record "
                                "access."
                            )
                        }
                    )
                if (
                    not access.receiving_practitioner_id
                ):
                    raise ValidationError(
                        {
                            "receiving_practitioner": (
                                "A receiving practitioner "
                                "is required to activate "
                                "record access."
                            )
                        }
                    )
                if "access_starts_at" in request.data:
                    access.access_starts_at = (
                        parse_datetime_value(
                            request.data.get(
                                "access_starts_at"
                            ),
                            "access_starts_at",
                        )
                    )
                elif not access.access_starts_at:
                    access.access_starts_at = now
                if "access_ends_at" in request.data:
                    access.access_ends_at = (
                        parse_datetime_value(
                            request.data.get(
                                "access_ends_at"
                            ),
                            "access_ends_at",
                        )
                    )
                access.granted_by = request.user
                access.granted_at = now
                access.accepted_by = request.user
                access.accepted_at = now
            elif (
                target_status
                == MedicalReferralAccessStatus.REJECTED
            ):
                reason = str(
                    request.data.get(
                        "rejection_reason"
                    )
                    or request.data.get("reason")
                    or ""
                ).strip()
                if not reason:
                    raise ValidationError(
                        {
                            "rejection_reason": (
                                "Rejection reason "
                                "is required."
                            )
                        }
                    )
                access.rejected_by = request.user
                access.rejected_at = now
                access.rejection_reason = reason
            elif (
                target_status
                == MedicalReferralAccessStatus.REVOKED
            ):
                reason = str(
                    request.data.get(
                        "revocation_reason"
                    )
                    or request.data.get("reason")
                    or ""
                ).strip()
                if not reason:
                    raise ValidationError(
                        {
                            "revocation_reason": (
                                "Revocation reason "
                                "is required."
                            )
                        }
                    )
                access.revoked_by = request.user
                access.revoked_at = now
                access.revocation_reason = reason
            elif (
                target_status
                == MedicalReferralAccessStatus.EXPIRED
            ):
                access.access_ends_at = now
            access.status = target_status
            access.updated_by = request.user
            access.save()
    except ValidationError as exc:
        return _validation_response(
            exc,
            message=(
                "Medical record access status "
                "could not be updated."
            ),
        )
    access = record_access_queryset(company).get(
        id=access.id,
    )
    return Response(
        {
            "success": True,
            "message": (
                "Medical record access status "
                "updated successfully."
            ),
            "item": serialize_record_access(access),
        }
    )
record_access_status.required_company_permissions = [
    STATUS_PERMISSION,
]
