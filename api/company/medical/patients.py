from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission
from companies.models import Branch
from medical.models import (
    MedicalPatient,
    MedicalPatientStatus,
    MedicalSettings,
)

from .practitioners import (
    company_or_error,
    ensure_permission,
    validation_payload,
)


VIEW_PERMISSION = "medical.view_medicalpatient"
CREATE_PERMISSION = "medical.add_medicalpatient"
UPDATE_PERMISSION = "medical.change_medicalpatient"
STATUS_PERMISSION = UPDATE_PERMISSION
ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
]


def patient_queryset(company):
    return MedicalPatient.objects.filter(
        company=company,
    ).select_related(
        "registration_branch",
    ).order_by(
        "-registered_at",
        "-id",
    )


def serialize_patient(patient: MedicalPatient) -> dict:
    branch = patient.registration_branch
    return {
        "id": patient.id,
        "company_id": patient.company_id,
        "patient_number": patient.patient_number,
        "identifier_type": patient.identifier_type,
        "identifier_number": patient.identifier_number,
        "full_name": patient.full_name,
        "full_name_ar": patient.full_name_ar,
        "full_name_en": patient.full_name_en,
        "display_name": patient.display_name,
        "date_of_birth": (
            patient.date_of_birth.isoformat()
            if patient.date_of_birth else None
        ),
        "gender": patient.gender,
        "nationality": patient.nationality,
        "mobile": patient.mobile,
        "email": patient.email,
        "status": patient.status,
        "registration_branch_id": patient.registration_branch_id,
        "registration_branch": (
            {
                "id": branch.id,
                "name": (
                    getattr(branch, "branch_name", "")
                    or getattr(branch, "name", "")
                    or str(branch)
                ),
            }
            if branch else None
        ),
        "registered_at": (
            patient.registered_at.isoformat()
            if patient.registered_at else None
        ),
        "notes": patient.notes,
        "extra_data": patient.extra_data or {},
        "created_at": patient.created_at.isoformat(),
        "updated_at": patient.updated_at.isoformat(),
    }


def next_patient_number(company) -> str:
    prefix = (
        MedicalSettings.objects.filter(
            company=company,
        ).values_list(
            "patient_number_prefix",
            flat=True,
        ).first()
        or "PAT"
    ).strip().upper()

    sequence = (
        MedicalPatient.objects.filter(
            company=company,
        ).count()
        + 1
    )

    while True:
        value = f"{prefix}-{sequence:06d}"
        if not MedicalPatient.objects.filter(
            company=company,
            patient_number=value,
        ).exists():
            return value
        sequence += 1


def apply_payload(
    *,
    patient: MedicalPatient,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalPatient:
    for field in (
        "patient_number",
        "identifier_type",
        "identifier_number",
        "full_name",
        "full_name_ar",
        "full_name_en",
        "date_of_birth",
        "gender",
        "nationality",
        "mobile",
        "email",
        "status",
        "registered_at",
        "notes",
    ):
        if field in payload:
            setattr(patient, field, payload.get(field))

    if "extra_data" in payload:
        extra_data = payload.get("extra_data")
        if not isinstance(extra_data, dict):
            raise ValidationError(
                {"extra_data": "Extra data must be an object."}
            )
        patient.extra_data = extra_data

    if "registration_branch_id" in payload:
        branch_id = payload.get("registration_branch_id")
        if branch_id in [None, ""]:
            patient.registration_branch = None
        else:
            branch = Branch.objects.filter(
                company=company,
                id=branch_id,
            ).first()
            if branch is None:
                raise ValidationError(
                    {
                        "registration_branch_id": (
                            "Registration branch was not found "
                            "for the current company."
                        )
                    }
                )
            patient.registration_branch = branch

    if creating and not str(
        patient.patient_number or ""
    ).strip():
        patient.patient_number = next_patient_number(company)

    patient.company = company
    if creating:
        patient.created_by = user
    patient.updated_by = user
    patient.save()
    return patient


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def patient_collection(request: Request) -> Response:
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
        queryset = patient_queryset(company)
        search = str(
            request.query_params.get("search", "") or ""
        ).strip()
        if search:
            queryset = queryset.filter(
                Q(patient_number__icontains=search)
                | Q(identifier_number__icontains=search)
                | Q(full_name__icontains=search)
                | Q(full_name_ar__icontains=search)
                | Q(full_name_en__icontains=search)
                | Q(mobile__icontains=search)
                | Q(email__icontains=search)
            )

        for key in (
            "status",
            "gender",
            "identifier_type",
        ):
            value = request.query_params.get(key)
            if value:
                queryset = queryset.filter(
                    **{key: str(value).strip().upper()}
                )

        branch_id = request.query_params.get(
            "registration_branch_id"
        ) or request.query_params.get("branch_id")
        if branch_id:
            queryset = queryset.filter(
                registration_branch_id=branch_id,
            )

        total = queryset.count()
        items = [
            serialize_patient(item)
            for item in queryset[:500]
        ]
        return Response(
            {
                "success": True,
                "count": total,
                "items": items,
                "patients": items,
            }
        )

    try:
        with transaction.atomic():
            patient = apply_payload(
                patient=MedicalPatient(company=company),
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )
        return Response(
            {
                "success": True,
                "message": "Patient created successfully.",
                "item": serialize_patient(
                    patient_queryset(company).get(id=patient.id)
                ),
            },
            status=201,
        )
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Patient data is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting patient record already exists."
                ),
            },
            status=400,
        )


patient_collection.required_company_permissions = ALL_PERMISSIONS


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def patient_detail(
    request: Request,
    patient_id: int,
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

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_patient(patient),
            }
        )

    try:
        with transaction.atomic():
            patient = apply_payload(
                patient=patient,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )
        return Response(
            {
                "success": True,
                "message": "Patient updated successfully.",
                "item": serialize_patient(
                    patient_queryset(company).get(id=patient.id)
                ),
            }
        )
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Patient data is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting patient record already exists."
                ),
            },
            status=400,
        )


patient_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def patient_status(
    request: Request,
    patient_id: int,
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

    action = str(
        request.data.get("action", "") or ""
    ).strip().lower()
    status_value = request.data.get("status")
    action_statuses = {
        "activate": MedicalPatientStatus.ACTIVE,
        "active": MedicalPatientStatus.ACTIVE,
        "deactivate": MedicalPatientStatus.INACTIVE,
        "inactive": MedicalPatientStatus.INACTIVE,
        "block": MedicalPatientStatus.BLOCKED,
        "blocked": MedicalPatientStatus.BLOCKED,
        "deceased": MedicalPatientStatus.DECEASED,
    }

    new_status = (
        str(status_value).strip().upper()
        if status_value not in [None, ""]
        else action_statuses.get(action)
    )
    valid_statuses = {
        value
        for value, _label
        in MedicalPatientStatus.choices
    }
    if new_status not in valid_statuses:
        return Response(
            {
                "success": False,
                "message": "Provide a valid patient status.",
            },
            status=400,
        )

    patient.status = new_status
    patient.updated_by = request.user
    try:
        patient.save()
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Patient status is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )

    return Response(
        {
            "success": True,
            "message": "Patient status updated successfully.",
            "item": serialize_patient(
                patient_queryset(company).get(id=patient.id)
            ),
        }
    )


patient_status.required_company_permissions = [
    STATUS_PERMISSION,
]
