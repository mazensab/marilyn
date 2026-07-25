from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q, QuerySet

from accounting.models import CostCenter
from accounts.models import CompanyMembership
from companies.models import Branch, Company

from .models import (
    MedicalClinic,
    MedicalClinicSpecialty,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
    MedicalSettings,
    MedicalSpecialty,
    clean_text,
    normalize_code,
)


class MedicalServiceError(ValueError):
    pass


def clean_bool(value: Any, default: bool = False) -> bool:
    if value in [None, ""]:
        return default

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in {"1", "true", "yes", "on"}:
            return True

        if normalized in {"0", "false", "no", "off"}:
            return False

    return bool(value)


def clean_int(value: Any, default: int = 0) -> int:
    if value in [None, ""]:
        return default

    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise MedicalServiceError("Invalid integer value.") from exc


def resolve_branch(
    *,
    company: Company,
    branch_id: Any,
    required: bool = False,
) -> Branch | None:
    if branch_id in [None, ""]:
        if required:
            raise MedicalServiceError("Branch is required.")
        return None

    try:
        parsed_id = int(branch_id)
    except (TypeError, ValueError) as exc:
        raise MedicalServiceError("Invalid branch id.") from exc

    branch = Branch.objects.filter(
        company=company,
        id=parsed_id,
    ).first()

    if branch is None:
        raise MedicalServiceError(
            "Branch was not found for the current company."
        )

    return branch


def resolve_membership(
    *,
    company: Company,
    membership_id: Any,
) -> CompanyMembership | None:
    if membership_id in [None, ""]:
        return None

    try:
        parsed_id = int(membership_id)
    except (TypeError, ValueError) as exc:
        raise MedicalServiceError(
            "Invalid company membership id."
        ) from exc

    membership = CompanyMembership.objects.filter(
        company=company,
        id=parsed_id,
    ).first()

    if membership is None:
        raise MedicalServiceError(
            "Company membership was not found."
        )

    return membership


def resolve_cost_center(
    *,
    company: Company,
    cost_center_id: Any,
) -> CostCenter | None:
    if cost_center_id in [None, ""]:
        return None

    try:
        parsed_id = int(cost_center_id)
    except (TypeError, ValueError) as exc:
        raise MedicalServiceError(
            "Invalid cost center id."
        ) from exc

    cost_center = CostCenter.objects.filter(
        company=company,
        id=parsed_id,
    ).first()

    if cost_center is None:
        raise MedicalServiceError(
            "Cost center was not found for the current company."
        )

    if not cost_center.can_post:
        raise MedicalServiceError(
            "A posting-enabled cost center is required."
        )

    return cost_center


def get_company_specialties(
    *,
    company: Company,
    include_inactive: bool = False,
) -> QuerySet[MedicalSpecialty]:
    queryset = MedicalSpecialty.objects.filter(
        Q(company__isnull=True) | Q(company=company)
    )

    if not include_inactive:
        queryset = queryset.filter(is_active=True)

    return queryset.order_by(
        "-is_system",
        "sort_order",
        "name_ar",
        "id",
    )


@transaction.atomic
def ensure_medical_settings(
    *,
    company: Company,
    user=None,
) -> MedicalSettings:
    settings_obj, created = MedicalSettings.objects.get_or_create(
        company=company,
        defaults={
            "created_by": user,
            "updated_by": user,
        },
    )

    if not created and user and not settings_obj.updated_by_id:
        settings_obj.updated_by = user
        settings_obj.save(update_fields=["updated_by", "updated_at"])

    return settings_obj


@transaction.atomic
def create_department(
    *,
    company: Company,
    data: dict[str, Any],
    user=None,
) -> MedicalDepartment:
    parent = None

    if data.get("parent_id") not in [None, ""]:
        parent = MedicalDepartment.objects.filter(
            company=company,
            id=data.get("parent_id"),
        ).first()

        if parent is None:
            raise MedicalServiceError(
                "Parent department was not found."
            )

    department = MedicalDepartment(
        company=company,
        parent=parent,
        code=normalize_code(data.get("code")),
        name_ar=clean_text(data.get("name_ar")),
        name_en=clean_text(data.get("name_en")),
        description=clean_text(data.get("description")),
        cost_center=resolve_cost_center(
            company=company,
            cost_center_id=data.get("cost_center_id"),
        ),
        manager_membership=resolve_membership(
            company=company,
            membership_id=data.get("manager_membership_id"),
        ),
        sort_order=clean_int(data.get("sort_order"), 0),
        is_active=clean_bool(data.get("is_active"), True),
        notes=clean_text(data.get("notes")),
        extra_data=(
            data.get("extra_data")
            if isinstance(data.get("extra_data"), dict)
            else {}
        ),
        created_by=user,
        updated_by=user,
    )
    department.save()
    return department


@transaction.atomic
def assign_department_to_branch(
    *,
    company: Company,
    department: MedicalDepartment,
    data: dict[str, Any],
    user=None,
) -> MedicalDepartmentBranch:
    if department.company_id != company.id:
        raise MedicalServiceError(
            "Department does not belong to the current company."
        )

    branch = resolve_branch(
        company=company,
        branch_id=data.get("branch_id"),
        required=True,
    )

    assignment = MedicalDepartmentBranch(
        company=company,
        department=department,
        branch=branch,
        manager_membership=resolve_membership(
            company=company,
            membership_id=data.get("manager_membership_id"),
        ),
        is_primary=clean_bool(data.get("is_primary"), False),
        is_active=clean_bool(data.get("is_active"), True),
        opening_time=data.get("opening_time") or None,
        closing_time=data.get("closing_time") or None,
        notes=clean_text(data.get("notes")),
        extra_data=(
            data.get("extra_data")
            if isinstance(data.get("extra_data"), dict)
            else {}
        ),
        created_by=user,
        updated_by=user,
    )
    assignment.save()
    return assignment


@transaction.atomic
def create_custom_specialty(
    *,
    company: Company,
    data: dict[str, Any],
    user=None,
) -> MedicalSpecialty:
    specialty = MedicalSpecialty(
        company=company,
        code=normalize_code(data.get("code")),
        name_ar=clean_text(data.get("name_ar")),
        name_en=clean_text(data.get("name_en")),
        description=clean_text(data.get("description")),
        is_system=False,
        is_active=clean_bool(data.get("is_active"), True),
        sort_order=clean_int(data.get("sort_order"), 0),
        notes=clean_text(data.get("notes")),
        extra_data=(
            data.get("extra_data")
            if isinstance(data.get("extra_data"), dict)
            else {}
        ),
        created_by=user,
        updated_by=user,
    )
    specialty.save()
    return specialty


@transaction.atomic
def link_department_specialty(
    *,
    company: Company,
    department: MedicalDepartment,
    specialty: MedicalSpecialty,
    is_primary: bool = False,
    user=None,
) -> MedicalDepartmentSpecialty:
    link = MedicalDepartmentSpecialty(
        company=company,
        department=department,
        specialty=specialty,
        is_primary=is_primary,
        created_by=user,
        updated_by=user,
    )
    link.save()
    return link


@transaction.atomic
def create_clinic(
    *,
    company: Company,
    data: dict[str, Any],
    user=None,
) -> MedicalClinic:
    branch = resolve_branch(
        company=company,
        branch_id=data.get("branch_id"),
        required=True,
    )

    department = MedicalDepartment.objects.filter(
        company=company,
        id=data.get("department_id"),
    ).first()

    if department is None:
        raise MedicalServiceError(
            "Department was not found for the current company."
        )

    clinic = MedicalClinic(
        company=company,
        branch=branch,
        department=department,
        code=normalize_code(data.get("code")),
        name_ar=clean_text(data.get("name_ar")),
        name_en=clean_text(data.get("name_en")),
        room_number=clean_text(data.get("room_number")),
        floor=clean_text(data.get("floor")),
        capacity=clean_int(data.get("capacity"), 1),
        opening_time=data.get("opening_time") or None,
        closing_time=data.get("closing_time") or None,
        is_default=clean_bool(data.get("is_default"), False),
        is_active=clean_bool(data.get("is_active"), True),
        description=clean_text(data.get("description")),
        notes=clean_text(data.get("notes")),
        extra_data=(
            data.get("extra_data")
            if isinstance(data.get("extra_data"), dict)
            else {}
        ),
        created_by=user,
        updated_by=user,
    )
    clinic.save()
    return clinic


@transaction.atomic
def link_clinic_specialty(
    *,
    company: Company,
    clinic: MedicalClinic,
    specialty: MedicalSpecialty,
    is_primary: bool = False,
    user=None,
) -> MedicalClinicSpecialty:
    link = MedicalClinicSpecialty(
        company=company,
        clinic=clinic,
        specialty=specialty,
        is_primary=is_primary,
        created_by=user,
        updated_by=user,
    )
    link.save()
    return link
