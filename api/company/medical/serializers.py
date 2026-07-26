from __future__ import annotations

from typing import Any

from medical.models import (
    MedicalClinicSpecialty,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
)


def iso_value(value):
    if value is None:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return value


def basic_object(obj) -> dict[str, Any] | None:
    if obj is None:
        return None

    return {
        "id": obj.id,
        "code": (
            getattr(obj, "code", "")
            or getattr(obj, "employee_number", "")
            or getattr(obj, "company_code", "")
        ),
        "name": (
            getattr(obj, "display_name", "")
            or getattr(obj, "name_ar", "")
            or getattr(obj, "name_en", "")
            or getattr(obj, "name", "")
            or str(obj)
        ),
    }


def serialize_specialty(specialty) -> dict[str, Any]:
    return {
        "id": specialty.id,
        "company_id": specialty.company_id,
        "code": specialty.code,
        "name_ar": specialty.name_ar,
        "name_en": specialty.name_en,
        "display_name": specialty.display_name,
        "description": specialty.description,
        "is_system": specialty.is_system,
        "is_active": specialty.is_active,
        "sort_order": specialty.sort_order,
        "notes": specialty.notes,
        "extra_data": specialty.extra_data,
        "created_at": iso_value(specialty.created_at),
        "updated_at": iso_value(specialty.updated_at),
    }


def serialize_department(department) -> dict[str, Any]:
    branch_links = (
        MedicalDepartmentBranch.objects
        .filter(
            company=department.company,
            department=department,
        )
        .select_related("branch")
        .order_by("-is_primary", "branch_id", "id")
    )

    specialty_links = (
        MedicalDepartmentSpecialty.objects
        .filter(
            company=department.company,
            department=department,
        )
        .select_related("specialty")
        .order_by("-is_primary", "specialty_id", "id")
    )

    return {
        "id": department.id,
        "company_id": department.company_id,
        "code": department.code,
        "name_ar": department.name_ar,
        "name_en": department.name_en,
        "display_name": department.display_name,
        "description": department.description,
        "parent": basic_object(department.parent),
        "manager": basic_object(department.manager_membership),
        "cost_center": basic_object(department.cost_center),
        "is_active": department.is_active,
        "sort_order": department.sort_order,
        "notes": department.notes,
        "extra_data": department.extra_data,
        "branches": [
            {
                "id": link.id,
                "branch": basic_object(link.branch),
                "is_primary": link.is_primary,
                "is_active": link.is_active,
                "opening_time": iso_value(
                    getattr(link, "opening_time", None)
                ),
                "closing_time": iso_value(
                    getattr(link, "closing_time", None)
                ),
            }
            for link in branch_links
        ],
        "specialties": [
            {
                "id": link.id,
                "specialty": serialize_specialty(
                    link.specialty
                ),
                "is_primary": link.is_primary,
                "is_active": link.is_active,
            }
            for link in specialty_links
        ],
        "created_at": iso_value(department.created_at),
        "updated_at": iso_value(department.updated_at),
    }


def serialize_clinic(clinic) -> dict[str, Any]:
    specialty_links = (
        MedicalClinicSpecialty.objects
        .filter(
            company=clinic.company,
            clinic=clinic,
        )
        .select_related("specialty")
        .order_by("-is_primary", "specialty_id", "id")
    )

    return {
        "id": clinic.id,
        "company_id": clinic.company_id,
        "code": clinic.code,
        "name_ar": clinic.name_ar,
        "name_en": clinic.name_en,
        "display_name": clinic.display_name,
        "description": clinic.description,
        "branch": basic_object(clinic.branch),
        "department": basic_object(clinic.department),
        "room_number": clinic.room_number,
        "floor": clinic.floor,
        "capacity": clinic.capacity,
        "opening_time": iso_value(clinic.opening_time),
        "closing_time": iso_value(clinic.closing_time),
        "is_default": clinic.is_default,
        "is_active": clinic.is_active,
        "notes": clinic.notes,
        "extra_data": clinic.extra_data,
        "specialties": [
            {
                "id": link.id,
                "specialty": serialize_specialty(
                    link.specialty
                ),
                "is_primary": link.is_primary,
                "is_active": link.is_active,
            }
            for link in specialty_links
        ],
        "created_at": iso_value(clinic.created_at),
        "updated_at": iso_value(clinic.updated_at),
    }
