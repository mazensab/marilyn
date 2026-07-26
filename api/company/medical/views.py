from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils.dateparse import parse_time
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response

from accounting.models import CostCenter
from api.permissions import (
    HasAnyCompanyPermission,
    require_company_permission,
)
from companies.models import Branch
from accounts.models import CompanyMembership
from medical.models import (
    MedicalClinic,
    MedicalClinicSpecialty,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
    MedicalSpecialty,
)
from medical.services import (
    MedicalServiceError,
    create_clinic,
    create_custom_specialty,
    create_department,
)

from .serializers import (
    serialize_clinic,
    serialize_department,
    serialize_specialty,
)


RESOURCE_CONFIG = {
    "departments": {
        "view": "company.medical.departments.view",
        "create": "company.medical.departments.create",
        "update": "company.medical.departments.update",
        "status": "company.medical.departments.status",
    },
    "specialties": {
        "view": "company.medical.specialties.view",
        "create": "company.medical.specialties.create",
        "update": "company.medical.specialties.update",
        "status": "company.medical.specialties.status",
    },
    "clinics": {
        "view": "company.medical.clinics.view",
        "create": "company.medical.clinics.create",
        "update": "company.medical.clinics.update",
        "status": "company.medical.clinics.status",
    },
}


ALL_STRUCTURE_PERMISSIONS = [
    permission
    for config in RESOURCE_CONFIG.values()
    for permission in config.values()
]


def validation_payload(exc: ValidationError):
    if hasattr(exc, "message_dict"):
        return exc.message_dict

    if hasattr(exc, "messages"):
        return {
            "detail": exc.messages,
        }

    return {
        "detail": [str(exc)],
    }


def company_or_error(request: Request):
    company = getattr(request, "company", None)

    if company is None:
        return None, Response(
            {
                "success": False,
                "message": (
                    "Active company context is required."
                ),
            },
            status=403,
        )

    return company, None


def forbidden(permission: str) -> Response:
    return Response(
        {
            "success": False,
            "message": (
                "You do not have the required permission."
            ),
            "required_permission": permission,
        },
        status=403,
    )


def ensure_permission(
    request: Request,
    permission: str,
) -> Response | None:
    if require_company_permission(
        request,
        permission,
    ):
        return None

    return forbidden(permission)


def parse_bool(
    value,
    default: bool = False,
) -> bool:
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
        "active",
        "activate",
    }


def parse_integer(
    value,
    *,
    default: int = 0,
    minimum: int | None = None,
) -> int:
    if value in [None, ""]:
        result = default
    else:
        try:
            result = int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(
                {
                    "detail": "A valid integer is required."
                }
            ) from exc

    if minimum is not None and result < minimum:
        raise ValidationError(
            {
                "detail": (
                    f"Value must be at least {minimum}."
                )
            }
        )

    return result


def parse_ids(value) -> list[int]:
    if value in [None, ""]:
        return []

    if not isinstance(value, list):
        raise ValidationError(
            {
                "detail": "Expected a list of IDs."
            }
        )

    result = []

    for item in value:
        try:
            parsed = int(item)
        except (TypeError, ValueError) as exc:
            raise ValidationError(
                {
                    "detail": "All IDs must be integers."
                }
            ) from exc

        if parsed not in result:
            result.append(parsed)

    return result


def set_audit(
    instance,
    *,
    user,
    creating: bool,
) -> None:
    field_names = {
        field.name
        for field in instance._meta.fields
    }

    if creating and "created_by" in field_names:
        instance.created_by = user

    if "updated_by" in field_names:
        instance.updated_by = user


def available_specialties(
    *,
    company,
    ids: list[int] | None = None,
):
    queryset = MedicalSpecialty.objects.filter(
        Q(company=company)
        | Q(
            company__isnull=True,
            is_system=True,
        )
    )

    if ids is not None:
        queryset = queryset.filter(id__in=ids)

    return queryset


def sync_department_branches(
    *,
    company,
    department,
    branch_ids: list[int],
    user,
) -> None:
    branches = list(
        Branch.objects.filter(
            company=company,
            id__in=branch_ids,
        )
    )

    if len(branches) != len(branch_ids):
        raise ValidationError(
            {
                "branch_ids": (
                    "One or more branches were not found "
                    "for the current company."
                )
            }
        )

    links = MedicalDepartmentBranch.objects.filter(
        company=company,
        department=department,
    )

    links.exclude(
        branch_id__in=branch_ids,
    ).update(
        is_active=False,
        is_primary=False,
        updated_by=user,
    )

    branches_by_id = {
        branch.id: branch
        for branch in branches
    }

    for index, branch_id in enumerate(branch_ids):
        link, created = (
            MedicalDepartmentBranch.objects
            .get_or_create(
                company=company,
                department=department,
                branch=branches_by_id[branch_id],
            )
        )

        link.is_active = True
        link.is_primary = index == 0
        set_audit(
            link,
            user=user,
            creating=created,
        )
        link.save()


def sync_department_specialties(
    *,
    company,
    department,
    specialty_ids: list[int],
    user,
) -> None:
    specialties = list(
        available_specialties(
            company=company,
            ids=specialty_ids,
        )
    )

    if len(specialties) != len(specialty_ids):
        raise ValidationError(
            {
                "specialty_ids": (
                    "One or more specialties are not "
                    "available to the current company."
                )
            }
        )

    links = MedicalDepartmentSpecialty.objects.filter(
        company=company,
        department=department,
    )

    links.exclude(
        specialty_id__in=specialty_ids,
    ).update(
        is_active=False,
        is_primary=False,
        updated_by=user,
    )

    specialties_by_id = {
        specialty.id: specialty
        for specialty in specialties
    }

    for index, specialty_id in enumerate(
        specialty_ids
    ):
        link, created = (
            MedicalDepartmentSpecialty.objects
            .get_or_create(
                company=company,
                department=department,
                specialty=(
                    specialties_by_id[specialty_id]
                ),
            )
        )

        link.is_active = True
        link.is_primary = index == 0
        set_audit(
            link,
            user=user,
            creating=created,
        )
        link.save()


def sync_clinic_specialties(
    *,
    company,
    clinic,
    specialty_ids: list[int],
    user,
) -> None:
    specialties = list(
        available_specialties(
            company=company,
            ids=specialty_ids,
        )
    )

    if len(specialties) != len(specialty_ids):
        raise ValidationError(
            {
                "specialty_ids": (
                    "One or more specialties are not "
                    "available to the current company."
                )
            }
        )

    links = MedicalClinicSpecialty.objects.filter(
        company=company,
        clinic=clinic,
    )

    links.exclude(
        specialty_id__in=specialty_ids,
    ).update(
        is_active=False,
        is_primary=False,
        updated_by=user,
    )

    specialties_by_id = {
        specialty.id: specialty
        for specialty in specialties
    }

    for index, specialty_id in enumerate(
        specialty_ids
    ):
        link, created = (
            MedicalClinicSpecialty.objects
            .get_or_create(
                company=company,
                clinic=clinic,
                specialty=(
                    specialties_by_id[specialty_id]
                ),
            )
        )

        link.is_active = True
        link.is_primary = index == 0
        set_audit(
            link,
            user=user,
            creating=created,
        )
        link.save()


def resolve_department(
    *,
    company,
    value,
    field_name: str,
    required: bool = False,
    exclude_id: int | None = None,
):
    if value in [None, ""]:
        if required:
            raise ValidationError(
                {
                    field_name: (
                        "This department is required."
                    )
                }
            )

        return None

    queryset = MedicalDepartment.objects.filter(
        company=company,
        id=value,
    )

    if exclude_id is not None:
        queryset = queryset.exclude(id=exclude_id)

    department = queryset.first()

    if department is None:
        raise ValidationError(
            {
                field_name: (
                    "Department was not found for "
                    "the current company."
                )
            }
        )

    return department


def resolve_branch(
    *,
    company,
    value,
    required: bool = False,
):
    if value in [None, ""]:
        if required:
            raise ValidationError(
                {
                    "branch_id": "Branch is required."
                }
            )

        return None

    branch = Branch.objects.filter(
        company=company,
        id=value,
    ).first()

    if branch is None:
        raise ValidationError(
            {
                "branch_id": (
                    "Branch was not found for "
                    "the current company."
                )
            }
        )

    return branch


def resolve_manager_membership(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    membership = CompanyMembership.objects.filter(
        company=company,
        id=value,
    ).select_related(
        "user",
    ).first()

    if membership is None:
        raise ValidationError(
            {
                "manager_membership_id": (
                    "Manager membership was not found "
                    "for the current company."
                )
            }
        )

    return membership


def resolve_cost_center(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    cost_center = CostCenter.objects.filter(
        company=company,
        id=value,
    ).first()

    if cost_center is None:
        raise ValidationError(
            {
                "cost_center_id": (
                    "Cost center was not found for "
                    "the current company."
                )
            }
        )

    return cost_center


def filtered_queryset(
    *,
    resource: str,
    company,
    request: Request,
):
    search = str(
        request.query_params.get("search", "")
        or ""
    ).strip()

    active = request.query_params.get("is_active")

    if resource == "departments":
        queryset = MedicalDepartment.objects.filter(
            company=company,
        ).select_related(
            "parent",
            "manager_membership",
            "cost_center",
        )

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search)
                | Q(name_ar__icontains=search)
                | Q(name_en__icontains=search)
                | Q(description__icontains=search)
            )

    elif resource == "specialties":
        queryset = available_specialties(
            company=company,
        )

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search)
                | Q(name_ar__icontains=search)
                | Q(name_en__icontains=search)
                | Q(description__icontains=search)
            )

    elif resource == "clinics":
        queryset = MedicalClinic.objects.filter(
            company=company,
        ).select_related(
            "branch",
            "department",
        )

        branch_id = request.query_params.get(
            "branch_id"
        )
        department_id = request.query_params.get(
            "department_id"
        )

        if branch_id:
            queryset = queryset.filter(
                branch_id=branch_id,
            )

        if department_id:
            queryset = queryset.filter(
                department_id=department_id,
            )

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search)
                | Q(name_ar__icontains=search)
                | Q(name_en__icontains=search)
                | Q(room_number__icontains=search)
                | Q(floor__icontains=search)
            )

    else:
        raise ValidationError(
            {
                "resource": (
                    "Unsupported medical resource."
                )
            }
        )

    if active is not None:
        queryset = queryset.filter(
            is_active=parse_bool(active),
        )

    return queryset


def serialize_resource(
    resource: str,
    instance,
):
    if resource == "departments":
        return serialize_department(instance)

    if resource == "specialties":
        return serialize_specialty(instance)

    if resource == "clinics":
        return serialize_clinic(instance)

    raise ValidationError(
        {
            "resource": "Unsupported medical resource."
        }
    )


def get_instance(
    *,
    resource: str,
    company,
    object_id: int,
):
    if resource == "departments":
        return MedicalDepartment.objects.filter(
            company=company,
            id=object_id,
        ).first()

    if resource == "specialties":
        return available_specialties(
            company=company,
        ).filter(
            id=object_id,
        ).first()

    if resource == "clinics":
        return MedicalClinic.objects.filter(
            company=company,
            id=object_id,
        ).first()

    return None


def update_department(
    *,
    department,
    company,
    payload,
    user,
):
    text_fields = [
        "code",
        "name_ar",
        "name_en",
        "description",
        "notes",
    ]

    for field in text_fields:
        if field in payload:
            setattr(
                department,
                field,
                str(payload.get(field) or "").strip(),
            )

    if "sort_order" in payload:
        department.sort_order = parse_integer(
            payload.get("sort_order"),
            minimum=0,
        )

    if "is_active" in payload:
        department.is_active = parse_bool(
            payload.get("is_active"),
        )

    if "extra_data" in payload:
        extra_data = payload.get("extra_data")

        if not isinstance(extra_data, dict):
            raise ValidationError(
                {
                    "extra_data": (
                        "Extra data must be an object."
                    )
                }
            )

        department.extra_data = extra_data

    if "parent_id" in payload:
        department.parent = resolve_department(
            company=company,
            value=payload.get("parent_id"),
            field_name="parent_id",
            exclude_id=department.id,
        )

    if "manager_membership_id" in payload:
        department.manager_membership = (
            resolve_manager_membership(
                company=company,
                value=payload.get(
                    "manager_membership_id"
                ),
            )
        )

    if "cost_center_id" in payload:
        department.cost_center = resolve_cost_center(
            company=company,
            value=payload.get("cost_center_id"),
        )

    set_audit(
        department,
        user=user,
        creating=False,
    )
    department.save()

    return department


def update_specialty(
    *,
    specialty,
    payload,
    user,
):
    if specialty.is_system or specialty.company_id is None:
        raise ValidationError(
            {
                "specialty": (
                    "System specialties are read-only."
                )
            }
        )

    for field in [
        "code",
        "name_ar",
        "name_en",
        "description",
        "notes",
    ]:
        if field in payload:
            setattr(
                specialty,
                field,
                str(payload.get(field) or "").strip(),
            )

    if "sort_order" in payload:
        specialty.sort_order = parse_integer(
            payload.get("sort_order"),
            minimum=0,
        )

    if "is_active" in payload:
        specialty.is_active = parse_bool(
            payload.get("is_active"),
        )

    if "extra_data" in payload:
        extra_data = payload.get("extra_data")

        if not isinstance(extra_data, dict):
            raise ValidationError(
                {
                    "extra_data": (
                        "Extra data must be an object."
                    )
                }
            )

        specialty.extra_data = extra_data

    set_audit(
        specialty,
        user=user,
        creating=False,
    )
    specialty.save()

    return specialty


def update_clinic(
    *,
    clinic,
    company,
    payload,
    user,
):
    for field in [
        "code",
        "name_ar",
        "name_en",
        "description",
        "room_number",
        "floor",
        "notes",
    ]:
        if field in payload:
            setattr(
                clinic,
                field,
                str(payload.get(field) or "").strip(),
            )

    if "capacity" in payload:
        clinic.capacity = parse_integer(
            payload.get("capacity"),
            minimum=1,
        )

    if "is_active" in payload:
        clinic.is_active = parse_bool(
            payload.get("is_active"),
        )

    if "is_default" in payload:
        clinic.is_default = parse_bool(
            payload.get("is_default"),
        )

    if "opening_time" in payload:
        value = payload.get("opening_time")
        clinic.opening_time = (
            parse_time(str(value))
            if value
            else None
        )

        if value and clinic.opening_time is None:
            raise ValidationError(
                {
                    "opening_time": (
                        "Opening time is invalid."
                    )
                }
            )

    if "closing_time" in payload:
        value = payload.get("closing_time")
        clinic.closing_time = (
            parse_time(str(value))
            if value
            else None
        )

        if value and clinic.closing_time is None:
            raise ValidationError(
                {
                    "closing_time": (
                        "Closing time is invalid."
                    )
                }
            )

    if "branch_id" in payload:
        clinic.branch = resolve_branch(
            company=company,
            value=payload.get("branch_id"),
            required=True,
        )

    if "department_id" in payload:
        clinic.department = resolve_department(
            company=company,
            value=payload.get("department_id"),
            field_name="department_id",
            required=True,
        )

    if "extra_data" in payload:
        extra_data = payload.get("extra_data")

        if not isinstance(extra_data, dict):
            raise ValidationError(
                {
                    "extra_data": (
                        "Extra data must be an object."
                    )
                }
            )

        clinic.extra_data = extra_data

    if clinic.is_default:
        MedicalClinic.objects.filter(
            company=company,
            branch=clinic.branch,
            is_default=True,
        ).exclude(
            id=clinic.id,
        ).update(
            is_default=False,
            updated_by=user,
        )

    set_audit(
        clinic,
        user=user,
        creating=False,
    )
    clinic.save()

    return clinic


@api_view(["GET"])
@permission_classes([HasAnyCompanyPermission])
def medical_summary(request: Request) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission_error = ensure_permission(
        request,
        "company.medical.structure.view",
    )

    if permission_error:
        return permission_error

    return Response(
        {
            "success": True,
            "summary": {
                "departments": (
                    MedicalDepartment.objects.filter(
                        company=company,
                    ).count()
                ),
                "active_departments": (
                    MedicalDepartment.objects.filter(
                        company=company,
                        is_active=True,
                    ).count()
                ),
                "system_specialties": (
                    MedicalSpecialty.objects.filter(
                        company__isnull=True,
                        is_system=True,
                        is_active=True,
                    ).count()
                ),
                "custom_specialties": (
                    MedicalSpecialty.objects.filter(
                        company=company,
                    ).count()
                ),
                "clinics": (
                    MedicalClinic.objects.filter(
                        company=company,
                    ).count()
                ),
                "active_clinics": (
                    MedicalClinic.objects.filter(
                        company=company,
                        is_active=True,
                    ).count()
                ),
            },
        }
    )


medical_summary.required_company_permissions = [
    "company.medical.view",
    "company.medical.structure.view",
]


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def medical_collection(
    request: Request,
    resource: str,
) -> Response:
    config = RESOURCE_CONFIG.get(resource)

    if config is None:
        return Response(
            {
                "success": False,
                "message": "Unsupported medical resource.",
            },
            status=404,
        )

    company, error = company_or_error(request)

    if error:
        return error

    permission_code = (
        config["view"]
        if request.method == "GET"
        else config["create"]
    )

    permission_error = ensure_permission(
        request,
        permission_code,
    )

    if permission_error:
        return permission_error

    if request.method == "GET":
        try:
            queryset = filtered_queryset(
                resource=resource,
                company=company,
                request=request,
            )

            total = queryset.count()
            items = [
                serialize_resource(resource, item)
                for item in queryset[:500]
            ]

            return Response(
                {
                    "success": True,
                    "resource": resource,
                    "count": total,
                    "items": items,
                    resource: items,
                }
            )

        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": "Invalid filters.",
                    "errors": validation_payload(exc),
                },
                status=400,
            )

    payload = request.data.copy()

    try:
        with transaction.atomic():
            if resource == "departments":
                instance = create_department(
                    company=company,
                    data=payload,
                    user=request.user,
                )

                if "branch_ids" in payload:
                    sync_department_branches(
                        company=company,
                        department=instance,
                        branch_ids=parse_ids(
                            payload.get("branch_ids")
                        ),
                        user=request.user,
                    )

                if "specialty_ids" in payload:
                    sync_department_specialties(
                        company=company,
                        department=instance,
                        specialty_ids=parse_ids(
                            payload.get("specialty_ids")
                        ),
                        user=request.user,
                    )

            elif resource == "specialties":
                instance = create_custom_specialty(
                    company=company,
                    data=payload,
                    user=request.user,
                )

            elif resource == "clinics":
                instance = create_clinic(
                    company=company,
                    data=payload,
                    user=request.user,
                )

                if "specialty_ids" in payload:
                    sync_clinic_specialties(
                        company=company,
                        clinic=instance,
                        specialty_ids=parse_ids(
                            payload.get("specialty_ids")
                        ),
                        user=request.user,
                    )

            else:
                raise ValidationError(
                    {
                        "resource": (
                            "Unsupported medical resource."
                        )
                    }
                )

        return Response(
            {
                "success": True,
                "message": (
                    f"{resource[:-1].title()} "
                    "created successfully."
                ),
                "item": serialize_resource(
                    resource,
                    instance,
                ),
            },
            status=201,
        )

    except (
        ValidationError,
        MedicalServiceError,
    ) as exc:
        errors = (
            validation_payload(exc)
            if isinstance(exc, ValidationError)
            else {"detail": [str(exc)]}
        )

        return Response(
            {
                "success": False,
                "message": (
                    "Medical structure data is invalid."
                ),
                "errors": errors,
            },
            status=400,
        )

    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": (
                    "A conflicting medical record "
                    "already exists."
                ),
            },
            status=400,
        )


medical_collection.required_company_permissions = (
    ALL_STRUCTURE_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def medical_detail(
    request: Request,
    object_id: int,
    resource: str,
) -> Response:
    config = RESOURCE_CONFIG.get(resource)

    if config is None:
        return Response(
            {
                "success": False,
                "message": "Unsupported medical resource.",
            },
            status=404,
        )

    company, error = company_or_error(request)

    if error:
        return error

    read_only = request.method == "GET"
    permission_code = (
        config["view"]
        if read_only
        else config["update"]
    )

    permission_error = ensure_permission(
        request,
        permission_code,
    )

    if permission_error:
        return permission_error

    instance = get_instance(
        resource=resource,
        company=company,
        object_id=object_id,
    )

    if instance is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical structure record "
                    "was not found."
                ),
            },
            status=404,
        )

    if read_only:
        return Response(
            {
                "success": True,
                "item": serialize_resource(
                    resource,
                    instance,
                ),
            }
        )

    payload = request.data.copy()

    try:
        with transaction.atomic():
            if resource == "departments":
                instance = update_department(
                    department=instance,
                    company=company,
                    payload=payload,
                    user=request.user,
                )

                if "branch_ids" in payload:
                    sync_department_branches(
                        company=company,
                        department=instance,
                        branch_ids=parse_ids(
                            payload.get("branch_ids")
                        ),
                        user=request.user,
                    )

                if "specialty_ids" in payload:
                    sync_department_specialties(
                        company=company,
                        department=instance,
                        specialty_ids=parse_ids(
                            payload.get("specialty_ids")
                        ),
                        user=request.user,
                    )

            elif resource == "specialties":
                instance = update_specialty(
                    specialty=instance,
                    payload=payload,
                    user=request.user,
                )

            elif resource == "clinics":
                instance = update_clinic(
                    clinic=instance,
                    company=company,
                    payload=payload,
                    user=request.user,
                )

                if "specialty_ids" in payload:
                    sync_clinic_specialties(
                        company=company,
                        clinic=instance,
                        specialty_ids=parse_ids(
                            payload.get("specialty_ids")
                        ),
                        user=request.user,
                    )

        return Response(
            {
                "success": True,
                "message": (
                    "Medical structure record "
                    "updated successfully."
                ),
                "item": serialize_resource(
                    resource,
                    instance,
                ),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical structure data is invalid."
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
                    "A conflicting medical record "
                    "already exists."
                ),
            },
            status=400,
        )


medical_detail.required_company_permissions = (
    ALL_STRUCTURE_PERMISSIONS
)


@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def medical_status(
    request: Request,
    object_id: int,
    resource: str,
) -> Response:
    config = RESOURCE_CONFIG.get(resource)

    if config is None:
        return Response(
            {
                "success": False,
                "message": "Unsupported medical resource.",
            },
            status=404,
        )

    company, error = company_or_error(request)

    if error:
        return error

    permission_error = ensure_permission(
        request,
        config["status"],
    )

    if permission_error:
        return permission_error

    instance = get_instance(
        resource=resource,
        company=company,
        object_id=object_id,
    )

    if instance is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Medical structure record "
                    "was not found."
                ),
            },
            status=404,
        )

    if (
        resource == "specialties"
        and (
            instance.is_system
            or instance.company_id is None
        )
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "System specialties are read-only."
                ),
            },
            status=400,
        )

    action = str(
        request.data.get("action", "")
        or ""
    ).strip().lower()

    if "is_active" in request.data:
        is_active = parse_bool(
            request.data.get("is_active"),
        )
    elif action in {
        "activate",
        "active",
        "enable",
    }:
        is_active = True
    elif action in {
        "deactivate",
        "inactive",
        "disable",
    }:
        is_active = False
    else:
        return Response(
            {
                "success": False,
                "message": (
                    "Provide is_active or a valid action."
                ),
            },
            status=400,
        )

    instance.is_active = is_active
    set_audit(
        instance,
        user=request.user,
        creating=False,
    )

    try:
        instance.save()
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": "Status change is invalid.",
                "errors": validation_payload(exc),
            },
            status=400,
        )

    return Response(
        {
            "success": True,
            "message": (
                "Medical structure status "
                "updated successfully."
            ),
            "item": serialize_resource(
                resource,
                instance,
            ),
        }
    )


medical_status.required_company_permissions = (
    ALL_STRUCTURE_PERMISSIONS
)
