from __future__ import annotations
from typing import Any
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response
from api.permissions import HasAnyCompanyPermission
from medical.models import (
    MedicalDiagnosis,
    MedicalProcedure,
)
from .appointments import (
    VIEW_PERMISSION as APPOINTMENT_VIEW_PERMISSION,
    appointment_queryset,
    serialize_appointment,
)
from .diagnoses import (
    VIEW_PERMISSION as DIAGNOSIS_VIEW_PERMISSION,
    serialize_diagnosis,
)
from .encounters import (
    VIEW_PERMISSION as ENCOUNTER_VIEW_PERMISSION,
    encounter_queryset,
    serialize_encounter,
)
from .patients import (
    VIEW_PERMISSION as PATIENT_VIEW_PERMISSION,
    company_or_error,
    ensure_permission,
    patient_queryset,
    serialize_patient,
)
from .procedures import (
    VIEW_PERMISSION as PROCEDURE_VIEW_PERMISSION,
    serialize_procedure,
)
from .record_access import (
    VIEW_PERMISSION as RECORD_ACCESS_VIEW_PERMISSION,
    record_access_queryset,
    serialize_record_access,
)
from .referrals import (
    VIEW_PERMISSION as REFERRAL_VIEW_PERMISSION,
    referral_queryset,
    serialize_referral,
)
REQUIRED_VIEW_PERMISSIONS = [
    PATIENT_VIEW_PERMISSION,
    APPOINTMENT_VIEW_PERMISSION,
    ENCOUNTER_VIEW_PERMISSION,
    DIAGNOSIS_VIEW_PERMISSION,
    PROCEDURE_VIEW_PERMISSION,
    REFERRAL_VIEW_PERMISSION,
    RECORD_ACCESS_VIEW_PERMISSION,
]
ALL_PERMISSIONS = REQUIRED_VIEW_PERMISSIONS
def _iso(value) -> str | None:
    if value is None:
        return None
    return value.isoformat()
def _section(items: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "count": len(items),
        "items": items,
    }
def diagnosis_queryset(
    company,
    patient,
):
    return (
        MedicalDiagnosis.objects
        .filter(
            company=company,
            patient=patient,
        )
        .select_related(
            "encounter",
            "patient",
            "practitioner",
        )
        .order_by(
            "-diagnosed_at",
            "-created_at",
            "-id",
        )
    )
def procedure_queryset(
    company,
    patient,
):
    return (
        MedicalProcedure.objects
        .filter(
            company=company,
            patient=patient,
        )
        .select_related(
            "encounter",
            "patient",
            "practitioner",
            "catalog_item",
        )
        .order_by(
            "-created_at",
            "-id",
        )
    )
def build_patient_medical_file(
    *,
    company,
    patient,
) -> dict[str, Any]:
    appointments = list(
        appointment_queryset(company)
        .filter(patient=patient)
        .order_by(
            "-scheduled_start",
            "-id",
        )
    )
    encounters = list(
        encounter_queryset(company)
        .filter(patient=patient)
        .order_by(
            "-opened_at",
            "-id",
        )
    )
    diagnoses = list(
        diagnosis_queryset(
            company,
            patient,
        )
    )
    procedures = list(
        procedure_queryset(
            company,
            patient,
        )
    )
    referrals = list(
        referral_queryset(company)
        .filter(patient=patient)
        .order_by(
            "-referred_at",
            "-id",
        )
    )
    record_access = list(
        record_access_queryset(company)
        .filter(patient=patient)
        .order_by(
            "-created_at",
            "-id",
        )
    )
    serialized_appointments = [
        serialize_appointment(item)
        for item in appointments
    ]
    serialized_encounters = [
        serialize_encounter(item)
        for item in encounters
    ]
    serialized_diagnoses = [
        serialize_diagnosis(item)
        for item in diagnoses
    ]
    serialized_procedures = [
        serialize_procedure(item)
        for item in procedures
    ]
    serialized_referrals = [
        serialize_referral(item)
        for item in referrals
    ]
    serialized_record_access = [
        serialize_record_access(item)
        for item in record_access
    ]
    now = timezone.now()
    future_appointment_times = [
        appointment.scheduled_start
        for appointment in appointments
        if (
            appointment.scheduled_start
            and appointment.scheduled_start >= now
            and appointment.status
            not in {
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
            }
        )
    ]
    next_appointment_at = (
        min(future_appointment_times)
        if future_appointment_times
        else None
    )
    summary = {
        "appointments_total": len(appointments),
        "upcoming_appointments": sum(
            1
            for appointment in appointments
            if (
                appointment.scheduled_start
                and appointment.scheduled_start >= now
                and appointment.status
                not in {
                    "COMPLETED",
                    "CANCELLED",
                    "NO_SHOW",
                }
            )
        ),
        "encounters_total": len(encounters),
        "open_encounters": sum(
            1
            for encounter in encounters
            if encounter.status
            not in {
                "COMPLETED",
                "CANCELLED",
            }
        ),
        "diagnoses_total": len(diagnoses),
        "primary_diagnoses": sum(
            1
            for diagnosis in diagnoses
            if diagnosis.is_primary
        ),
        "procedures_total": len(procedures),
        "completed_procedures": sum(
            1
            for procedure in procedures
            if procedure.status == "COMPLETED"
        ),
        "referrals_total": len(referrals),
        "active_referrals": sum(
            1
            for referral in referrals
            if not referral.is_terminal
        ),
        "record_access_total": len(record_access),
        "effective_record_access": sum(
            1
            for access in record_access
            if access.is_effective
        ),
        "total_clinical_records": (
            len(appointments)
            + len(encounters)
            + len(diagnoses)
            + len(procedures)
            + len(referrals)
            + len(record_access)
        ),
        "next_appointment_at": _iso(
            next_appointment_at
        ),
        "latest_encounter_at": _iso(
            encounters[0].opened_at
            if encounters
            else None
        ),
    }
    return {
        "patient": serialize_patient(patient),
        "summary": summary,
        "sections": {
            "appointments": _section(
                serialized_appointments
            ),
            "encounters": _section(
                serialized_encounters
            ),
            "diagnoses": _section(
                serialized_diagnoses
            ),
            "procedures": _section(
                serialized_procedures
            ),
            "referrals": _section(
                serialized_referrals
            ),
            "record_access": _section(
                serialized_record_access
            ),
        },
        "generated_at": now.isoformat(),
    }
@api_view(["GET"])
@permission_classes([HasAnyCompanyPermission])
def patient_medical_file(
    request: Request,
    patient_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error
    for permission in REQUIRED_VIEW_PERMISSIONS:
        permission_error = ensure_permission(
            request,
            permission,
        )
        if permission_error:
            return permission_error
    patient = patient_queryset(company).filter(
        id=patient_id,
    ).first()
    if patient is None:
        return Response(
            {
                "success": False,
                "message": "Patient was not found.",
            },
            status=404,
        )
    payload = build_patient_medical_file(
        company=company,
        patient=patient,
    )
    return Response(
        {
            "success": True,
            "item": payload,
            "medical_file": payload,
        }
    )
patient_medical_file.required_company_permissions = (
    REQUIRED_VIEW_PERMISSIONS
)
