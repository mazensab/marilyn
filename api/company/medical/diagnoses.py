from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from medical.models import (
    MedicalDiagnosis,
    MedicalEncounterStatus,
    MedicalPractitioner,
)

from .encounters import (
    HasAnyCompanyPermission,
    company_or_error,
    encounter_queryset,
    ensure_permission,
    parse_datetime_value,
    parse_json_object,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicaldiagnosis"
CREATE_PERMISSION = "medical.add_medicaldiagnosis"
UPDATE_PERMISSION = "medical.change_medicaldiagnosis"
PRIMARY_PERMISSION = UPDATE_PERMISSION

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]


def diagnosis_queryset(company, encounter):
    return (
        MedicalDiagnosis.objects
        .filter(
            company=company,
            encounter=encounter,
        )
        .select_related(
            "encounter",
            "patient",
            "practitioner",
            "created_by",
            "updated_by",
        )
        .order_by(
            "-is_primary",
            "diagnosed_at",
            "id",
        )
    )


def serialize_diagnosis(
    diagnosis: MedicalDiagnosis,
) -> dict[str, Any]:
    return {
        "id": diagnosis.id,
        "company_id": diagnosis.company_id,
        "encounter_id": diagnosis.encounter_id,
        "encounter_number": (
            diagnosis.encounter.encounter_number
        ),
        "patient_id": diagnosis.patient_id,
        "patient_number": diagnosis.patient.patient_number,
        "patient_name": diagnosis.patient.full_name,
        "practitioner_id": diagnosis.practitioner_id,
        "practitioner_name": (
            str(diagnosis.practitioner)
            if diagnosis.practitioner_id
            else ""
        ),
        "diagnosis_code": diagnosis.diagnosis_code,
        "diagnosis_name": diagnosis.diagnosis_name,
        "is_primary": diagnosis.is_primary,
        "diagnosed_at": (
            diagnosis.diagnosed_at.isoformat()
            if diagnosis.diagnosed_at
            else None
        ),
        "notes": diagnosis.notes,
        "extra_data": diagnosis.extra_data,
        "created_by_id": diagnosis.created_by_id,
        "updated_by_id": diagnosis.updated_by_id,
        "created_at": diagnosis.created_at.isoformat(),
        "updated_at": diagnosis.updated_at.isoformat(),
    }


def parse_boolean_value(
    value: Any,
    field_name: str,
) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, int) and value in {0, 1}:
        return bool(value)

    normalized = str(value or "").strip().lower()

    if normalized in {"true", "1", "yes", "on"}:
        return True

    if normalized in {"false", "0", "no", "off"}:
        return False

    raise ValidationError(
        {
            field_name: (
                "Value must be a valid boolean."
            )
        }
    )


def resolve_practitioner(
    *,
    company,
    payload: dict[str, Any],
    current: MedicalPractitioner | None,
) -> MedicalPractitioner | None:
    if "practitioner_id" not in payload:
        return current

    raw_value = payload.get("practitioner_id")

    if raw_value is None or raw_value == "":
        return None

    try:
        practitioner_id = int(raw_value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                "practitioner_id": (
                    "Practitioner ID must be an integer."
                )
            }
        )

    practitioner = MedicalPractitioner.objects.filter(
        company=company,
        id=practitioner_id,
    ).first()

    if practitioner is None:
        raise ValidationError(
            {
                "practitioner_id": (
                    "Practitioner was not found for this company."
                )
            }
        )

    return practitioner


def apply_payload(
    *,
    diagnosis: MedicalDiagnosis,
    encounter,
    company,
    payload: dict[str, Any],
    user,
    creating: bool,
) -> MedicalDiagnosis:
    ignored_fields = {
        "id",
        "company",
        "company_id",
        "encounter",
        "encounter_id",
        "patient",
        "patient_id",
        "created_by",
        "created_by_id",
        "updated_by",
        "updated_by_id",
        "created_at",
        "updated_at",
    }

    for field_name in ignored_fields:
        payload.pop(field_name, None)

    if creating:
        diagnosis.company = company
        diagnosis.encounter = encounter
        diagnosis.patient = encounter.patient
        diagnosis.practitioner = (
            encounter.practitioner
        )
        diagnosis.created_by = user

    diagnosis.practitioner = resolve_practitioner(
        company=company,
        payload=payload,
        current=diagnosis.practitioner,
    )

    if "diagnosis_code" in payload:
        diagnosis.diagnosis_code = str(
            payload.get("diagnosis_code") or ""
        )

    if "diagnosis_name" in payload:
        diagnosis.diagnosis_name = str(
            payload.get("diagnosis_name") or ""
        )
    elif creating:
        diagnosis.diagnosis_name = ""

    if "notes" in payload:
        diagnosis.notes = str(
            payload.get("notes") or ""
        )

    if "diagnosed_at" in payload:
        diagnosis.diagnosed_at = parse_datetime_value(
            payload.get("diagnosed_at"),
            "diagnosed_at",
        )

    if "extra_data" in payload:
        diagnosis.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    if "is_primary" in payload:
        diagnosis.is_primary = parse_boolean_value(
            payload.get("is_primary"),
            "is_primary",
        )

    diagnosis.updated_by = user

    if diagnosis.is_primary:
        (
            MedicalDiagnosis.objects
            .filter(
                company=company,
                encounter=encounter,
                is_primary=True,
            )
            .exclude(id=diagnosis.id)
            .update(
                is_primary=False,
                updated_by=user,
            )
        )

    diagnosis.save()
    return diagnosis


def encounter_is_terminal(encounter) -> bool:
    return encounter.status in {
        MedicalEncounterStatus.COMPLETED,
        MedicalEncounterStatus.CANCELLED,
    }


def terminal_encounter_response() -> Response:
    return Response(
        {
            "success": False,
            "message": (
                "Diagnoses cannot be changed for a completed "
                "or cancelled encounter."
            ),
        },
        status=400,
    )


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def diagnosis_collection(
    request: Request,
    encounter_id: int,
) -> Response:
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
        queryset = diagnosis_queryset(
            company,
            encounter,
        )

        search = str(
            request.query_params.get("search") or ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(diagnosis_code__icontains=search)
                | Q(diagnosis_name__icontains=search)
                | Q(notes__icontains=search)
            )

        primary_value = request.query_params.get(
            "is_primary"
        )

        if primary_value not in {None, ""}:
            try:
                is_primary = parse_boolean_value(
                    primary_value,
                    "is_primary",
                )
            except ValidationError as exc:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Diagnosis filters are invalid."
                        ),
                        "errors": validation_payload(exc),
                    },
                    status=400,
                )

            queryset = queryset.filter(
                is_primary=is_primary,
            )

        items = [
            serialize_diagnosis(item)
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
            }
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    try:
        with transaction.atomic():
            diagnosis = apply_payload(
                diagnosis=MedicalDiagnosis(),
                encounter=encounter,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        diagnosis = diagnosis_queryset(
            company,
            encounter,
        ).get(id=diagnosis.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Diagnosis created successfully."
                ),
                "item": serialize_diagnosis(diagnosis),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Diagnosis data is invalid."
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
                    "A conflicting diagnosis record "
                    "already exists."
                ),
            },
            status=400,
        )


diagnosis_collection.required_company_permissions = (
    ALL_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def diagnosis_detail(
    request: Request,
    encounter_id: int,
    diagnosis_id: int,
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

    diagnosis = diagnosis_queryset(
        company,
        encounter,
    ).filter(id=diagnosis_id).first()

    if diagnosis is None:
        return Response(
            {
                "success": False,
                "message": "Diagnosis not found.",
            },
            status=404,
        )

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_diagnosis(diagnosis),
            }
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    try:
        with transaction.atomic():
            diagnosis = apply_payload(
                diagnosis=diagnosis,
                encounter=encounter,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        diagnosis = diagnosis_queryset(
            company,
            encounter,
        ).get(id=diagnosis.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Diagnosis updated successfully."
                ),
                "item": serialize_diagnosis(diagnosis),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Diagnosis data is invalid."
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
                    "A conflicting diagnosis record "
                    "already exists."
                ),
            },
            status=400,
        )


diagnosis_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


@api_view(["PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def diagnosis_primary(
    request: Request,
    encounter_id: int,
    diagnosis_id: int,
) -> Response:
    company, error = company_or_error(request)
    if error:
        return error

    permission_error = ensure_permission(
        request,
        PRIMARY_PERMISSION,
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

    diagnosis = diagnosis_queryset(
        company,
        encounter,
    ).filter(id=diagnosis_id).first()

    if diagnosis is None:
        return Response(
            {
                "success": False,
                "message": "Diagnosis not found.",
            },
            status=404,
        )

    if encounter_is_terminal(encounter):
        return terminal_encounter_response()

    try:
        with transaction.atomic():
            (
                MedicalDiagnosis.objects
                .filter(
                    company=company,
                    encounter=encounter,
                    is_primary=True,
                )
                .exclude(id=diagnosis.id)
                .update(
                    is_primary=False,
                    updated_by=request.user,
                )
            )

            diagnosis.is_primary = True
            diagnosis.updated_by = request.user
            diagnosis.save()

        diagnosis = diagnosis_queryset(
            company,
            encounter,
        ).get(id=diagnosis.id)

        return Response(
            {
                "success": True,
                "message": (
                    "Primary diagnosis updated successfully."
                ),
                "item": serialize_diagnosis(diagnosis),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Primary diagnosis update is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )


diagnosis_primary.required_company_permissions = [
    PRIMARY_PERMISSION,
]
