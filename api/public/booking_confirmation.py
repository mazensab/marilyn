from __future__ import annotations
import unicodedata
from typing import Any
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import (
    IntegrityError,
    transaction,
)
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from api.company.medical.appointments import (
    apply_payload as apply_appointment_payload,
)
from api.company.medical.patients import (
    apply_payload as apply_patient_payload,
)
from medical.models import (
    MedicalPatient,
    MedicalPatientIdentifierType,
    MedicalPatientStatus,
    MedicalPractitionerAssignment,
    MedicalPractitionerServiceAssignment,
    MedicalSettings,
)
from .booking import (
    _parse_positive_integer,
    _public_assignments,
    _public_company,
    _serialize_assignment,
    _validation_payload,
)
class PublicBookingConflict(Exception):
    def __init__(
        self,
        message: str,
    ):
        super().__init__(
            message
        )
        self.message = (
            message
        )
def _text(
    value: Any,
) -> str:
    return str(
        value or ""
    ).strip()
def _normalized_identity_text(
    value: Any,
) -> str:
    normalized = (
        unicodedata.normalize(
            "NFKC",
            str(
                value or ""
            ),
        )
    )
    return " ".join(
        normalized
        .casefold()
        .split()
    )
def _normalized_public_mobile(
    value: Any,
) -> str:
    raw = _text(
        value
    )
    digits = []
    for character in raw:
        try:
            digit = (
                unicodedata.digit(
                    character
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            continue
        digits.append(
            str(
                digit
            )
        )
    normalized = "".join(
        digits
    )
    if normalized.startswith(
        "00"
    ):
        normalized = (
            normalized[2:]
        )
    if (
        normalized.startswith(
            "966"
        )
        and len(
            normalized
        ) == 12
        and normalized[3:4]
        == "5"
    ):
        canonical = (
            normalized
        )
    elif (
        normalized.startswith(
            "05"
        )
        and len(
            normalized
        ) == 10
    ):
        canonical = (
            "966"
            + normalized[1:]
        )
    elif (
        normalized.startswith(
            "5"
        )
        and len(
            normalized
        ) == 9
    ):
        canonical = (
            "966"
            + normalized
        )
    else:
        canonical = (
            normalized
        )
    if (
        len(
            canonical
        ) < 8
        or len(
            canonical
        ) > 15
    ):
        raise ValidationError(
            {
                "mobile": [
                    (
                        "Provide a valid "
                        "mobile number."
                    )
                ]
            }
        )
    return canonical
def _public_patient_requirements(
    company,
) -> dict[str, Any]:
    settings = (
        MedicalSettings.objects
        .filter(
            company=company,
        )
        .only(
            "require_patient_identifier",
        )
        .first()
    )
    require_identifier = bool(
        settings
        and settings
        .require_patient_identifier
    )
    unspecified = str(
        getattr(
            MedicalPatientIdentifierType,
            "UNSPECIFIED",
            "",
        )
        or ""
    )
    identifier_types = [
        {
            "value": value,
        }
        for value, _label
        in MedicalPatientIdentifierType.choices
        if (
            value
            and value
            != unspecified
        )
    ]
    return {
        "require_identifier": (
            require_identifier
        ),
        "identifier_types": (
            identifier_types
        ),
    }
def _clean_public_patient_payload(
    *,
    company,
    payload,
) -> dict[str, Any]:
    if not isinstance(
        payload,
        dict,
    ):
        raise ValidationError(
            {
                "patient": [
                    (
                        "Patient details "
                        "are required."
                    )
                ]
            }
        )
    full_name = _text(
        payload.get(
            "full_name"
        )
    )
    if not full_name:
        raise ValidationError(
            {
                "full_name": [
                    (
                        "Full name "
                        "is required."
                    )
                ]
            }
        )
    if len(
        full_name
    ) > 220:
        raise ValidationError(
            {
                "full_name": [
                    (
                        "Full name "
                        "is too long."
                    )
                ]
            }
        )
    mobile = _text(
        payload.get(
            "mobile"
        )
    )
    if not mobile:
        raise ValidationError(
            {
                "mobile": [
                    (
                        "Mobile number "
                        "is required."
                    )
                ]
            }
        )
    if len(
        mobile
    ) > 50:
        raise ValidationError(
            {
                "mobile": [
                    (
                        "Mobile number "
                        "is too long."
                    )
                ]
            }
        )
    canonical_mobile = (
        _normalized_public_mobile(
            mobile
        )
    )
    email = _text(
        payload.get(
            "email"
        )
    )
    if email:
        if len(
            email
        ) > 254:
            raise ValidationError(
                {
                    "email": [
                        (
                            "Email address "
                            "is too long."
                        )
                    ]
                }
            )
        try:
            validate_email(
                email
            )
        except ValidationError as error:
            raise ValidationError(
                {
                    "email": (
                        error.messages
                    )
                }
            ) from error
    identifier_type = (
        _text(
            payload.get(
                "identifier_type"
            )
        )
        .upper()
    )
    identifier_number = (
        _text(
            payload.get(
                "identifier_number"
            )
        )
    )
    if len(
        identifier_number
    ) > 80:
        raise ValidationError(
            {
                "identifier_number": [
                    (
                        "Identifier number "
                        "is too long."
                    )
                ]
            }
        )
    valid_types = {
        value
        for value, _label
        in MedicalPatientIdentifierType.choices
    }
    unspecified = str(
        getattr(
            MedicalPatientIdentifierType,
            "UNSPECIFIED",
            "",
        )
        or ""
    )
    if (
        identifier_type
        and identifier_type
        not in valid_types
    ):
        raise ValidationError(
            {
                "identifier_type": [
                    (
                        "Provide a valid "
                        "identifier type."
                    )
                ]
            }
        )
    requirements = (
        _public_patient_requirements(
            company
        )
    )
    require_identifier = bool(
        requirements[
            "require_identifier"
        ]
    )
    if identifier_number:
        if (
            not identifier_type
            or identifier_type
            == unspecified
        ):
            raise ValidationError(
                {
                    "identifier_type": [
                        (
                            "Identifier type "
                            "is required."
                        )
                    ]
                }
            )
    elif (
        identifier_type
        and identifier_type
        != unspecified
    ):
        raise ValidationError(
            {
                "identifier_number": [
                    (
                        "Identifier number "
                        "is required."
                    )
                ]
            }
        )
    else:
        identifier_type = (
            unspecified
        )
    if require_identifier:
        if not identifier_number:
            raise ValidationError(
                {
                    "identifier_number": [
                        (
                            "Patient identifier "
                            "is required."
                        )
                    ]
                }
            )
        if (
            not identifier_type
            or identifier_type
            == unspecified
        ):
            raise ValidationError(
                {
                    "identifier_type": [
                        (
                            "Identifier type "
                            "is required."
                        )
                    ]
                }
            )
    return {
        "full_name": (
            full_name
        ),
        "mobile": (
            mobile
        ),
        "canonical_mobile": (
            canonical_mobile
        ),
        "email": (
            email
        ),
        "identifier_type": (
            identifier_type
        ),
        "identifier_number": (
            identifier_number
        ),
    }
def _find_public_patient(
    *,
    company,
    cleaned_patient,
):
    canonical_mobile = (
        cleaned_patient[
            "canonical_mobile"
        ]
    )
    matches = []
    patients = (
        MedicalPatient.objects
        .filter(
            company=company,
        )
        .exclude(
            mobile="",
        )
    )
    for patient in patients:
        try:
            existing_mobile = (
                _normalized_public_mobile(
                    patient.mobile
                )
            )
        except ValidationError:
            continue
        if (
            existing_mobile
            == canonical_mobile
        ):
            matches.append(
                patient
            )
            if len(
                matches
            ) > 1:
                break
    if len(
        matches
    ) > 1:
        raise PublicBookingConflict(
            "Patient information "
            "could not be matched safely."
        )
    identifier_number = (
        cleaned_patient[
            "identifier_number"
        ]
    )
    if not matches:
        if identifier_number:
            identifier_match = (
                MedicalPatient.objects
                .filter(
                    company=company,
                    identifier_number__iexact=(
                        identifier_number
                    ),
                )
                .exclude(
                    identifier_number="",
                )
                .only(
                    "id"
                )
                .first()
            )
            if (
                identifier_match
                is not None
            ):
                raise PublicBookingConflict(
                    "Patient information "
                    "could not be matched safely."
                )
        return None
    patient = (
        matches[0]
    )
    if (
        patient.status
        != MedicalPatientStatus.ACTIVE
    ):
        raise PublicBookingConflict(
            "The matching patient record "
            "is not available for "
            "online booking."
        )
    submitted_name = (
        _normalized_identity_text(
            cleaned_patient[
                "full_name"
            ]
        )
    )
    existing_names = {
        _normalized_identity_text(
            value
        )
        for value in (
            getattr(
                patient,
                "full_name",
                "",
            ),
            getattr(
                patient,
                "full_name_ar",
                "",
            ),
            getattr(
                patient,
                "full_name_en",
                "",
            ),
        )
        if _text(
            value
        )
    }
    if (
        existing_names
        and submitted_name
        not in existing_names
    ):
        raise PublicBookingConflict(
            "Patient information "
            "could not be matched safely."
        )
    submitted_identifier = (
        _normalized_identity_text(
            identifier_number
        )
    )
    existing_identifier = (
        _normalized_identity_text(
            getattr(
                patient,
                "identifier_number",
                "",
            )
        )
    )
    if (
        submitted_identifier
        and existing_identifier
        and submitted_identifier
        != existing_identifier
    ):
        raise PublicBookingConflict(
            "Patient information "
            "could not be matched safely."
        )
    return patient
def _parse_public_scheduled_start(
    value,
):
    raw = _text(
        value
    )
    if not raw:
        raise ValidationError(
            {
                "scheduled_start": [
                    (
                        "Appointment time "
                        "is required."
                    )
                ]
            }
        )
    parsed = (
        parse_datetime(
            raw
        )
    )
    if parsed is None:
        raise ValidationError(
            {
                "scheduled_start": [
                    (
                        "Provide a valid "
                        "appointment time."
                    )
                ]
            }
        )
    if timezone.is_naive(
        parsed
    ):
        parsed = (
            timezone.make_aware(
                parsed,
                timezone
                .get_current_timezone(),
            )
        )
    if (
        parsed
        <= timezone.now()
    ):
        raise ValidationError(
            {
                "scheduled_start": [
                    (
                        "Appointment time "
                        "must be in the future."
                    )
                ]
            }
        )
    return parsed
def _safe_validation_payload(
    error: ValidationError,
) -> dict[str, Any]:
    allowed = {
        "patient",
        "full_name",
        "mobile",
        "email",
        "identifier_type",
        "identifier_number",
        "scheduled_start",
        (
            "practitioner_"
            "service_assignment_id"
        ),
    }
    payload = (
        _validation_payload(
            error
        )
    )
    if not isinstance(
        payload,
        dict,
    ):
        return {}
    return {
        str(key): value
        for key, value
        in payload.items()
        if str(key)
        in allowed
    }
def _serialize_confirmation(
    *,
    appointment,
    assignment,
) -> dict[str, Any]:
    selection = (
        _serialize_assignment(
            assignment
        )
    )
    return {
        "appointment_number": (
            _text(
                appointment
                .appointment_number
            )
        ),
        "status": (
            _text(
                appointment.status
            )
        ),
        "scheduled_start": (
            appointment
            .scheduled_start
            .isoformat()
        ),
        "scheduled_end": (
            appointment
            .scheduled_end
            .isoformat()
            if appointment
            .scheduled_end
            else None
        ),
        "branch": (
            selection[
                "branch"
            ]
        ),
        "service": (
            selection[
                "service"
            ]
        ),
        "practitioner": (
            selection[
                "practitioner"
            ]
        ),
    }
@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_requirements(
    request: Request,
) -> Response:
    del request
    company = (
        _public_company()
    )
    if company is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Online booking is not "
                    "available right now."
                ),
            },
            status=404,
        )
    return Response(
        {
            "success": True,
            "patient": (
                _public_patient_requirements(
                    company
                )
            ),
        }
    )
@api_view(["POST"])
@permission_classes([AllowAny])
def public_booking_confirm(
    request: Request,
) -> Response:
    company = (
        _public_company()
    )
    if company is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Online booking is not "
                    "available right now."
                ),
            },
            status=404,
        )
    if not hasattr(
        request.data,
        "get",
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Booking details "
                    "are invalid."
                ),
            },
            status=400,
        )
    try:
        assignment_id = (
            _parse_positive_integer(
                request.data.get(
                    (
                        "practitioner_"
                        "service_assignment_id"
                    )
                ),
                (
                    "practitioner_"
                    "service_assignment_id"
                ),
            )
        )
        scheduled_start = (
            _parse_public_scheduled_start(
                request.data.get(
                    "scheduled_start"
                )
            )
        )
        cleaned_patient = (
            _clean_public_patient_payload(
                company=company,
                payload=(
                    request.data.get(
                        "patient"
                    )
                ),
            )
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Booking details "
                    "are invalid."
                ),
                "errors": (
                    _safe_validation_payload(
                        error
                    )
                ),
            },
            status=400,
        )
    preflight = (
        _public_assignments(
            company,
            assignment_id=(
                assignment_id
            ),
        )
    )
    if len(
        preflight
    ) != 1:
        return Response(
            {
                "success": False,
                "message": (
                    "The selected booking option "
                    "is not available."
                ),
            },
            status=404,
        )
    patient_reused = False
    try:
        with transaction.atomic():
            # Serialize public confirmations for this company
            # while patient matching + appointment creation run.
            company = (
                company.__class__
                .objects
                .select_for_update()
                .get(
                    pk=company.pk
                )
            )
            locked_service_assignment = (
                MedicalPractitionerServiceAssignment
                .objects
                .select_for_update()
                .filter(
                    company=company,
                    id=(
                        assignment_id
                    ),
                )
                .first()
            )
            if (
                locked_service_assignment
                is None
            ):
                raise PublicBookingConflict(
                    "The selected booking option "
                    "is no longer available."
                )
            practitioner_assignment_id = (
                locked_service_assignment
                .practitioner_assignment_id
            )
            locked_practitioner_assignment = (
                MedicalPractitionerAssignment
                .objects
                .select_for_update()
                .filter(
                    company=company,
                    id=(
                        practitioner_assignment_id
                    ),
                )
                .first()
            )
            if (
                locked_practitioner_assignment
                is None
            ):
                raise PublicBookingConflict(
                    "The selected booking option "
                    "is no longer available."
                )
            current_assignments = (
                _public_assignments(
                    company,
                    assignment_id=(
                        assignment_id
                    ),
                )
            )
            if len(
                current_assignments
            ) != 1:
                raise PublicBookingConflict(
                    "The selected booking option "
                    "is no longer available."
                )
            assignment = (
                current_assignments[
                    0
                ]
            )
            if (
                assignment
                .practitioner_assignment_id
                !=
                locked_practitioner_assignment
                .id
            ):
                raise PublicBookingConflict(
                    "The selected booking option "
                    "is no longer available."
                )
            patient = (
                _find_public_patient(
                    company=company,
                    cleaned_patient=(
                        cleaned_patient
                    ),
                )
            )
            if patient is None:
                patient_payload = {
                    "full_name": (
                        cleaned_patient[
                            "full_name"
                        ]
                    ),
                    "mobile": (
                        cleaned_patient[
                            "mobile"
                        ]
                    ),
                    "email": (
                        cleaned_patient[
                            "email"
                        ]
                    ),
                    "identifier_type": (
                        cleaned_patient[
                            "identifier_type"
                        ]
                    ),
                    "identifier_number": (
                        cleaned_patient[
                            "identifier_number"
                        ]
                    ),
                    (
                        "registration_"
                        "branch_id"
                    ): (
                        assignment
                        .practitioner_assignment
                        .branch_id
                    ),
                }
                patient = (
                    apply_patient_payload(
                        patient=(
                            MedicalPatient(
                                company=company
                            )
                        ),
                        company=company,
                        payload=(
                            patient_payload
                        ),
                        user=None,
                        creating=True,
                    )
                )
            else:
                patient_reused = (
                    True
                )
            appointment_payload = {
                "patient_id": (
                    patient.id
                ),
                (
                    "practitioner_"
                    "service_assignment_id"
                ): (
                    assignment.id
                ),
                "scheduled_start": (
                    scheduled_start
                    .isoformat()
                ),
                "source": (
                    "ONLINE"
                ),
            }
            try:
                appointment = (
                    apply_appointment_payload(
                        appointment=None,
                        company=company,
                        payload=(
                            appointment_payload
                        ),
                        user=None,
                        creating=True,
                    )
                )
            except ValidationError as error:
                raise PublicBookingConflict(
                    "The selected appointment "
                    "is no longer available."
                ) from error
            confirmation = (
                _serialize_confirmation(
                    appointment=(
                        appointment
                    ),
                    assignment=(
                        assignment
                    ),
                )
            )
    except PublicBookingConflict as error:
        return Response(
            {
                "success": False,
                "message": (
                    error.message
                ),
            },
            status=409,
        )
    except ValidationError as error:
        return Response(
            {
                "success": False,
                "message": (
                    "Patient details "
                    "are invalid."
                ),
                "errors": (
                    _safe_validation_payload(
                        error
                    )
                ),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "The booking could not "
                    "be confirmed because "
                    "the selected data changed."
                ),
            },
            status=409,
        )
    return Response(
        {
            "success": True,
            "patient_reused": (
                patient_reused
            ),
            "appointment": (
                confirmation
            ),
        },
        status=201,
    )
