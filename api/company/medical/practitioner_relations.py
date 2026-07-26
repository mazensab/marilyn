from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission
from medical.models import (
    MedicalPractitioner,
    MedicalPractitionerAssignment,
    MedicalPractitionerSpecialty,
)

from .practitioners import (
    company_or_error,
    ensure_permission,
    parse_bool,
    parse_date_value,
    parse_json_object,
    resolve_branch,
    resolve_clinic,
    resolve_department,
    resolve_specialty,
    set_audit,
    validation_payload,
)
from .serializers import (
    basic_object,
    iso_value,
    serialize_specialty,
)


SPECIALTY_VIEW_PERMISSION = (
    "company.medical.practitioners.specialties.view"
)
SPECIALTY_MANAGE_PERMISSION = (
    "company.medical.practitioners.specialties.manage"
)

ASSIGNMENT_VIEW_PERMISSION = (
    "company.medical.practitioners.assignments.view"
)
ASSIGNMENT_MANAGE_PERMISSION = (
    "company.medical.practitioners.assignments.manage"
)


def practitioner_or_404(
    company,
    practitioner_id: int,
):
    return (
        MedicalPractitioner.objects
        .filter(
            company=company,
            id=practitioner_id,
        )
        .first()
    )


def parse_non_negative_integer(
    value,
    field_name: str,
    default: int = 0,
) -> int:
    if value in [None, ""]:
        return default

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                field_name: (
                    "Expected a non-negative integer."
                )
            }
        )

    if parsed < 0:
        raise ValidationError(
            {
                field_name: (
                    "Expected a non-negative integer."
                )
            }
        )

    return parsed


def serialize_specialty_assignment(
    item: MedicalPractitionerSpecialty,
) -> dict[str, Any]:
    return {
        "id": item.id,
        "company_id": item.company_id,
        "practitioner_id": item.practitioner_id,
        "specialty": serialize_specialty(
            item.specialty
        ),
        "is_primary": item.is_primary,
        "is_active": item.is_active,
        "years_experience": item.years_experience,
        "valid_from": iso_value(item.valid_from),
        "valid_until": iso_value(item.valid_until),
        "notes": item.notes,
        "extra_data": item.extra_data,
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }


def serialize_assignment(
    item: MedicalPractitionerAssignment,
) -> dict[str, Any]:
    return {
        "id": item.id,
        "company_id": item.company_id,
        "practitioner_id": item.practitioner_id,
        "branch": basic_object(item.branch),
        "department": basic_object(item.department),
        "clinic": basic_object(item.clinic),
        "is_primary": item.is_primary,
        "is_active": item.is_active,
        "start_date": iso_value(item.start_date),
        "end_date": iso_value(item.end_date),
        "working_hours": item.working_hours,
        "notes": item.notes,
        "extra_data": item.extra_data,
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }


def specialty_queryset(
    company,
    practitioner,
):
    return (
        MedicalPractitionerSpecialty.objects
        .filter(
            company=company,
            practitioner=practitioner,
        )
        .select_related("specialty")
        .order_by(
            "-is_primary",
            "-is_active",
            "specialty__code",
            "id",
        )
    )


def assignment_queryset(
    company,
    practitioner,
):
    return (
        MedicalPractitionerAssignment.objects
        .filter(
            company=company,
            practitioner=practitioner,
        )
        .select_related(
            "branch",
            "department",
            "clinic",
        )
        .order_by(
            "-is_primary",
            "-is_active",
            "id",
        )
    )


def sync_primary_specialty(
    practitioner: MedicalPractitioner,
    *,
    clear_when_missing: bool,
    user,
) -> None:
    primary = (
        MedicalPractitionerSpecialty.objects
        .filter(
            company=practitioner.company,
            practitioner=practitioner,
            is_primary=True,
            is_active=True,
        )
        .select_related("specialty")
        .order_by("-updated_at", "-id")
        .first()
    )

    if primary is not None:
        practitioner.primary_specialty = (
            primary.specialty
        )
    elif clear_when_missing:
        practitioner.primary_specialty = None
    else:
        return

    set_audit(
        practitioner,
        user=user,
        creating=False,
    )

    practitioner.save(
        update_fields=[
            "primary_specialty",
            "updated_by",
            "updated_at",
        ]
    )


def sync_primary_assignment(
    practitioner: MedicalPractitioner,
    *,
    clear_when_missing: bool,
    user,
) -> None:
    primary = (
        MedicalPractitionerAssignment.objects
        .filter(
            company=practitioner.company,
            practitioner=practitioner,
            is_primary=True,
            is_active=True,
        )
        .select_related(
            "branch",
            "department",
            "clinic",
        )
        .order_by("-updated_at", "-id")
        .first()
    )

    if primary is not None:
        practitioner.default_branch = primary.branch
        practitioner.default_department = (
            primary.department
        )
        practitioner.default_clinic = primary.clinic

    elif clear_when_missing:
        practitioner.default_branch = None
        practitioner.default_department = None
        practitioner.default_clinic = None

    else:
        return

    set_audit(
        practitioner,
        user=user,
        creating=False,
    )

    practitioner.save(
        update_fields=[
            "default_branch",
            "default_department",
            "default_clinic",
            "updated_by",
            "updated_at",
        ]
    )


def apply_specialty_payload(
    *,
    item: MedicalPractitionerSpecialty,
    company,
    practitioner,
    payload,
    user,
    creating: bool,
) -> MedicalPractitionerSpecialty:
    was_primary = bool(
        item.pk
        and item.is_primary
    )

    if creating and "specialty_id" not in payload:
        raise ValidationError(
            {
                "specialty_id": (
                    "This field is required."
                )
            }
        )

    if "specialty_id" in payload:
        item.specialty = resolve_specialty(
            company=company,
            value=payload.get("specialty_id"),
        )

    if "is_primary" in payload:
        item.is_primary = parse_bool(
            payload.get("is_primary")
        )

    if "is_active" in payload:
        item.is_active = parse_bool(
            payload.get("is_active")
        )

    if not item.is_active:
        item.is_primary = False

    if "years_experience" in payload:
        item.years_experience = (
            parse_non_negative_integer(
                payload.get("years_experience"),
                "years_experience",
            )
        )

    if "valid_from" in payload:
        item.valid_from = parse_date_value(
            payload.get("valid_from"),
            "valid_from",
        )

    if "valid_until" in payload:
        item.valid_until = parse_date_value(
            payload.get("valid_until"),
            "valid_until",
        )

    if (
        item.valid_from
        and item.valid_until
        and item.valid_until < item.valid_from
    ):
        raise ValidationError(
            {
                "valid_until": (
                    "Valid-until date cannot be "
                    "before valid-from date."
                )
            }
        )

    if "notes" in payload:
        item.notes = str(
            payload.get("notes")
            or ""
        ).strip()

    if "extra_data" in payload:
        item.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    item.company = company
    item.practitioner = practitioner

    if item.is_primary:
        (
            MedicalPractitionerSpecialty.objects
            .filter(
                company=company,
                practitioner=practitioner,
            )
            .exclude(id=item.id)
            .update(is_primary=False)
        )

    set_audit(
        item,
        user=user,
        creating=creating,
    )

    item.full_clean()
    item.save()

    sync_primary_specialty(
        practitioner,
        clear_when_missing=(
            was_primary or item.is_primary
        ),
        user=user,
    )

    return item


def apply_assignment_payload(
    *,
    item: MedicalPractitionerAssignment,
    company,
    practitioner,
    payload,
    user,
    creating: bool,
) -> MedicalPractitionerAssignment:
    was_primary = bool(
        item.pk
        and item.is_primary
    )

    if creating and "branch_id" not in payload:
        raise ValidationError(
            {
                "branch_id": (
                    "This field is required."
                )
            }
        )

    if "branch_id" in payload:
        item.branch = resolve_branch(
            company=company,
            value=payload.get("branch_id"),
        )

    if "department_id" in payload:
        item.department = resolve_department(
            company=company,
            value=payload.get("department_id"),
        )

    if "clinic_id" in payload:
        item.clinic = resolve_clinic(
            company=company,
            value=payload.get("clinic_id"),
        )

    if item.clinic_id:
        if (
            item.branch_id
            and item.clinic.branch_id
            != item.branch_id
        ):
            raise ValidationError(
                {
                    "clinic_id": (
                        "Clinic must belong "
                        "to the selected branch."
                    )
                }
            )

        if (
            item.department_id
            and item.clinic.department_id
            != item.department_id
        ):
            raise ValidationError(
                {
                    "clinic_id": (
                        "Clinic must belong "
                        "to the selected department."
                    )
                }
            )

        if not item.department_id:
            item.department = item.clinic.department

    if "is_primary" in payload:
        item.is_primary = parse_bool(
            payload.get("is_primary")
        )

    if "is_active" in payload:
        item.is_active = parse_bool(
            payload.get("is_active")
        )

    if not item.is_active:
        item.is_primary = False

    if "start_date" in payload:
        item.start_date = parse_date_value(
            payload.get("start_date"),
            "start_date",
        )

    if "end_date" in payload:
        item.end_date = parse_date_value(
            payload.get("end_date"),
            "end_date",
        )

    if (
        item.start_date
        and item.end_date
        and item.end_date < item.start_date
    ):
        raise ValidationError(
            {
                "end_date": (
                    "End date cannot be "
                    "before start date."
                )
            }
        )

    if "working_hours" in payload:
        item.working_hours = parse_json_object(
            payload.get("working_hours"),
            "working_hours",
        )

    if "notes" in payload:
        item.notes = str(
            payload.get("notes")
            or ""
        ).strip()

    if "extra_data" in payload:
        item.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    item.company = company
    item.practitioner = practitioner

    if item.is_primary:
        (
            MedicalPractitionerAssignment.objects
            .filter(
                company=company,
                practitioner=practitioner,
            )
            .exclude(id=item.id)
            .update(is_primary=False)
        )

    set_audit(
        item,
        user=user,
        creating=creating,
    )

    item.full_clean()
    item.save()

    sync_primary_assignment(
        practitioner,
        clear_when_missing=(
            was_primary or item.is_primary
        ),
        user=user,
    )

    return item


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_specialty_collection(
    request: Request,
    practitioner_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        SPECIALTY_VIEW_PERMISSION
        if request.method == "GET"
        else SPECIALTY_MANAGE_PERMISSION
    )

    permission_error = ensure_permission(
        request,
        permission,
    )

    if permission_error:
        return permission_error

    practitioner = practitioner_or_404(
        company,
        practitioner_id,
    )

    if practitioner is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner was not found."
                ),
            },
            status=404,
        )

    if request.method == "GET":
        queryset = specialty_queryset(
            company,
            practitioner,
        )

        if "is_active" in request.query_params:
            queryset = queryset.filter(
                is_active=parse_bool(
                    request.query_params.get(
                        "is_active"
                    )
                )
            )

        if "is_primary" in request.query_params:
            queryset = queryset.filter(
                is_primary=parse_bool(
                    request.query_params.get(
                        "is_primary"
                    )
                )
            )

        specialty_id = request.query_params.get(
            "specialty_id"
        )

        if specialty_id:
            queryset = queryset.filter(
                specialty_id=specialty_id
            )

        items = [
            serialize_specialty_assignment(item)
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "specialties": items,
            }
        )

    try:
        with transaction.atomic():
            item = MedicalPractitionerSpecialty(
                company=company,
                practitioner=practitioner,
            )

            item = apply_specialty_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        item = (
            specialty_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner specialty "
                    "created successfully."
                ),
                "item": (
                    serialize_specialty_assignment(
                        item
                    )
                ),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner specialty "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "specialty already exists."
                ),
            },
            status=400,
        )


practitioner_specialty_collection.required_company_permissions = [
    SPECIALTY_VIEW_PERMISSION,
    SPECIALTY_MANAGE_PERMISSION,
]


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_specialty_detail(
    request: Request,
    practitioner_id: int,
    specialty_assignment_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        SPECIALTY_VIEW_PERMISSION
        if request.method == "GET"
        else SPECIALTY_MANAGE_PERMISSION
    )

    permission_error = ensure_permission(
        request,
        permission,
    )

    if permission_error:
        return permission_error

    practitioner = practitioner_or_404(
        company,
        practitioner_id,
    )

    if practitioner is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner was not found."
                ),
            },
            status=404,
        )

    item = (
        specialty_queryset(
            company,
            practitioner,
        )
        .filter(id=specialty_assignment_id)
        .first()
    )

    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner specialty "
                    "was not found."
                ),
            },
            status=404,
        )

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": (
                    serialize_specialty_assignment(
                        item
                    )
                ),
            }
        )

    try:
        with transaction.atomic():
            item = apply_specialty_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        item = (
            specialty_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner specialty "
                    "updated successfully."
                ),
                "item": (
                    serialize_specialty_assignment(
                        item
                    )
                ),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner specialty "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "specialty already exists."
                ),
            },
            status=400,
        )


practitioner_specialty_detail.required_company_permissions = [
    SPECIALTY_VIEW_PERMISSION,
    SPECIALTY_MANAGE_PERMISSION,
]


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_assignment_collection(
    request: Request,
    practitioner_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        ASSIGNMENT_VIEW_PERMISSION
        if request.method == "GET"
        else ASSIGNMENT_MANAGE_PERMISSION
    )

    permission_error = ensure_permission(
        request,
        permission,
    )

    if permission_error:
        return permission_error

    practitioner = practitioner_or_404(
        company,
        practitioner_id,
    )

    if practitioner is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner was not found."
                ),
            },
            status=404,
        )

    if request.method == "GET":
        queryset = assignment_queryset(
            company,
            practitioner,
        )

        if "is_active" in request.query_params:
            queryset = queryset.filter(
                is_active=parse_bool(
                    request.query_params.get(
                        "is_active"
                    )
                )
            )

        if "is_primary" in request.query_params:
            queryset = queryset.filter(
                is_primary=parse_bool(
                    request.query_params.get(
                        "is_primary"
                    )
                )
            )

        for field_name in [
            "branch_id",
            "department_id",
            "clinic_id",
        ]:
            value = request.query_params.get(
                field_name
            )

            if value:
                queryset = queryset.filter(
                    **{field_name: value}
                )

        items = [
            serialize_assignment(item)
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "count": len(items),
                "items": items,
                "assignments": items,
            }
        )

    try:
        with transaction.atomic():
            item = MedicalPractitionerAssignment(
                company=company,
                practitioner=practitioner,
            )

            item = apply_assignment_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        item = (
            assignment_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner assignment "
                    "created successfully."
                ),
                "item": serialize_assignment(item),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner assignment "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "assignment already exists."
                ),
            },
            status=400,
        )


practitioner_assignment_collection.required_company_permissions = [
    ASSIGNMENT_VIEW_PERMISSION,
    ASSIGNMENT_MANAGE_PERMISSION,
]


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_assignment_detail(
    request: Request,
    practitioner_id: int,
    assignment_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        ASSIGNMENT_VIEW_PERMISSION
        if request.method == "GET"
        else ASSIGNMENT_MANAGE_PERMISSION
    )

    permission_error = ensure_permission(
        request,
        permission,
    )

    if permission_error:
        return permission_error

    practitioner = practitioner_or_404(
        company,
        practitioner_id,
    )

    if practitioner is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner was not found."
                ),
            },
            status=404,
        )

    item = (
        assignment_queryset(
            company,
            practitioner,
        )
        .filter(id=assignment_id)
        .first()
    )

    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner assignment "
                    "was not found."
                ),
            },
            status=404,
        )

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_assignment(item),
            }
        )

    try:
        with transaction.atomic():
            item = apply_assignment_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        item = (
            assignment_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner assignment "
                    "updated successfully."
                ),
                "item": serialize_assignment(item),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner assignment "
                    "data is invalid."
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
                    "A conflicting practitioner "
                    "assignment already exists."
                ),
            },
            status=400,
        )


practitioner_assignment_detail.required_company_permissions = [
    ASSIGNMENT_VIEW_PERMISSION,
    ASSIGNMENT_MANAGE_PERMISSION,
]
