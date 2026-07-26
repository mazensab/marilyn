from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.request import Request
from rest_framework.response import Response

from accounts.models import CompanyMembership
from api.permissions import (
    HasAnyCompanyPermission,
    require_company_permission,
)
from companies.models import Branch
from hr.models import Employee
from medical.models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalPractitioner,
    MedicalPractitionerStatus,
    MedicalSpecialty,
)

from .serializers import (
    basic_object,
    iso_value,
    serialize_specialty,
)


VIEW_PERMISSION = (
    "company.medical.practitioners.view"
)
CREATE_PERMISSION = (
    "company.medical.practitioners.create"
)
UPDATE_PERMISSION = (
    "company.medical.practitioners.update"
)
STATUS_PERMISSION = (
    "company.medical.practitioners.status"
)

ALL_PERMISSIONS = [
    VIEW_PERMISSION,
    CREATE_PERMISSION,
    UPDATE_PERMISSION,
    STATUS_PERMISSION,
]


def validation_payload(
    exc: ValidationError,
) -> dict[str, Any]:
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


def ensure_permission(
    request: Request,
    permission: str,
) -> Response | None:
    if require_company_permission(
        request,
        permission,
    ):
        return None

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
        "enable",
    }


def parse_date_value(
    value,
    field_name: str,
):
    if value in [None, ""]:
        return None

    parsed = parse_date(str(value))

    if parsed is None:
        raise ValidationError(
            {
                field_name: (
                    "Use a valid YYYY-MM-DD date."
                )
            }
        )

    return parsed


def parse_json_object(
    value,
    field_name: str,
) -> dict[str, Any]:
    if value in [None, ""]:
        return {}

    if not isinstance(value, dict):
        raise ValidationError(
            {
                field_name: (
                    "Expected a JSON object."
                )
            }
        )

    return value


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


def choice_values(
    field_name: str,
) -> set[str]:
    field = MedicalPractitioner._meta.get_field(
        field_name
    )

    return {
        str(value)
        for value, _label in field.flatchoices
    }


def resolve_membership(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    membership = (
        CompanyMembership.objects
        .filter(
            company=company,
            id=value,
        )
        .select_related("user")
        .first()
    )

    if membership is None:
        raise ValidationError(
            {
                "membership_id": (
                    "Membership was not found "
                    "for the current company."
                )
            }
        )

    return membership


def resolve_employee(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    employee = Employee.objects.filter(
        company=company,
        id=value,
    ).first()

    if employee is None:
        raise ValidationError(
            {
                "employee_id": (
                    "Employee was not found "
                    "for the current company."
                )
            }
        )

    return employee


def resolve_specialty(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    specialty = (
        MedicalSpecialty.objects
        .filter(
            Q(company=company)
            | Q(
                company__isnull=True,
                is_system=True,
            ),
            id=value,
        )
        .first()
    )

    if specialty is None:
        raise ValidationError(
            {
                "primary_specialty_id": (
                    "Specialty is not available "
                    "to the current company."
                )
            }
        )

    return specialty


def resolve_branch(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    branch = Branch.objects.filter(
        company=company,
        id=value,
    ).first()

    if branch is None:
        raise ValidationError(
            {
                "default_branch_id": (
                    "Branch was not found "
                    "for the current company."
                )
            }
        )

    return branch


def resolve_department(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    department = (
        MedicalDepartment.objects
        .filter(
            company=company,
            id=value,
        )
        .first()
    )

    if department is None:
        raise ValidationError(
            {
                "default_department_id": (
                    "Department was not found "
                    "for the current company."
                )
            }
        )

    return department


def resolve_clinic(
    *,
    company,
    value,
):
    if value in [None, ""]:
        return None

    clinic = (
        MedicalClinic.objects
        .filter(
            company=company,
            id=value,
        )
        .select_related(
            "branch",
            "department",
        )
        .first()
    )

    if clinic is None:
        raise ValidationError(
            {
                "default_clinic_id": (
                    "Clinic was not found "
                    "for the current company."
                )
            }
        )

    return clinic


def practitioner_queryset(company):
    return (
        MedicalPractitioner.objects
        .filter(company=company)
        .select_related(
            "membership",
            "membership__user",
            "employee",
            "primary_specialty",
            "default_branch",
            "default_department",
            "default_clinic",
        )
        .annotate(
            specialties_count=Count(
                "specialty_assignments",
                filter=Q(
                    specialty_assignments__is_active=True
                ),
                distinct=True,
            ),
            assignments_count=Count(
                "location_assignments",
                filter=Q(
                    location_assignments__is_active=True
                ),
                distinct=True,
            ),
            licenses_count=Count(
                "licenses",
                distinct=True,
            ),
        )
    )


def serialize_practitioner(
    practitioner: MedicalPractitioner,
) -> dict[str, Any]:
    return {
        "id": practitioner.id,
        "company_id": practitioner.company_id,
        "practitioner_number": (
            practitioner.practitioner_number
        ),
        "full_name_ar": practitioner.full_name_ar,
        "full_name_en": practitioner.full_name_en,
        "display_name": (
            practitioner.full_name_ar
            or practitioner.full_name_en
            or practitioner.practitioner_number
        ),
        "professional_title": (
            practitioner.professional_title
        ),
        "practitioner_type": (
            practitioner.practitioner_type
        ),
        "gender": practitioner.gender,
        "nationality": practitioner.nationality,
        "mobile": practitioner.mobile,
        "email": practitioner.email,
        "membership": basic_object(
            practitioner.membership
        ),
        "employee": basic_object(
            practitioner.employee
        ),
        "primary_specialty": (
            serialize_specialty(
                practitioner.primary_specialty
            )
            if practitioner.primary_specialty_id
            else None
        ),
        "default_branch": basic_object(
            practitioner.default_branch
        ),
        "default_department": basic_object(
            practitioner.default_department
        ),
        "default_clinic": basic_object(
            practitioner.default_clinic
        ),
        "hire_date": iso_value(
            practitioner.hire_date
        ),
        "status": practitioner.status,
        "is_accepting_appointments": (
            practitioner.is_accepting_appointments
        ),
        "notes": practitioner.notes,
        "extra_data": practitioner.extra_data,
        "specialties_count": getattr(
            practitioner,
            "specialties_count",
            0,
        ),
        "assignments_count": getattr(
            practitioner,
            "assignments_count",
            0,
        ),
        "licenses_count": getattr(
            practitioner,
            "licenses_count",
            0,
        ),
        "created_at": iso_value(
            practitioner.created_at
        ),
        "updated_at": iso_value(
            practitioner.updated_at
        ),
    }


def apply_payload(
    *,
    practitioner: MedicalPractitioner,
    company,
    payload,
    user,
    creating: bool,
) -> MedicalPractitioner:
    text_fields = [
        "practitioner_number",
        "full_name_ar",
        "full_name_en",
        "professional_title",
        "nationality",
        "mobile",
        "email",
        "notes",
    ]

    for field_name in text_fields:
        if field_name in payload:
            setattr(
                practitioner,
                field_name,
                str(
                    payload.get(field_name)
                    or ""
                ).strip(),
            )

    if "practitioner_type" in payload:
        value = str(
            payload.get("practitioner_type")
            or ""
        ).strip().upper()

        if value not in choice_values(
            "practitioner_type"
        ):
            raise ValidationError(
                {
                    "practitioner_type": (
                        "Unsupported practitioner type."
                    )
                }
            )

        practitioner.practitioner_type = value

    if "gender" in payload:
        value = str(
            payload.get("gender")
            or ""
        ).strip().upper()

        if value not in choice_values("gender"):
            raise ValidationError(
                {
                    "gender": (
                        "Unsupported practitioner gender."
                    )
                }
            )

        practitioner.gender = value

    if "status" in payload:
        value = str(
            payload.get("status")
            or ""
        ).strip().upper()

        if value not in choice_values("status"):
            raise ValidationError(
                {
                    "status": (
                        "Unsupported practitioner status."
                    )
                }
            )

        practitioner.status = value

    if "hire_date" in payload:
        practitioner.hire_date = parse_date_value(
            payload.get("hire_date"),
            "hire_date",
        )

    if "is_accepting_appointments" in payload:
        practitioner.is_accepting_appointments = (
            parse_bool(
                payload.get(
                    "is_accepting_appointments"
                )
            )
        )

    if "extra_data" in payload:
        practitioner.extra_data = (
            parse_json_object(
                payload.get("extra_data"),
                "extra_data",
            )
        )

    if "membership_id" in payload:
        practitioner.membership = (
            resolve_membership(
                company=company,
                value=payload.get(
                    "membership_id"
                ),
            )
        )

    if "employee_id" in payload:
        practitioner.employee = resolve_employee(
            company=company,
            value=payload.get("employee_id"),
        )

    if "primary_specialty_id" in payload:
        practitioner.primary_specialty = (
            resolve_specialty(
                company=company,
                value=payload.get(
                    "primary_specialty_id"
                ),
            )
        )

    if "default_branch_id" in payload:
        practitioner.default_branch = (
            resolve_branch(
                company=company,
                value=payload.get(
                    "default_branch_id"
                ),
            )
        )

    if "default_department_id" in payload:
        practitioner.default_department = (
            resolve_department(
                company=company,
                value=payload.get(
                    "default_department_id"
                ),
            )
        )

    if "default_clinic_id" in payload:
        practitioner.default_clinic = (
            resolve_clinic(
                company=company,
                value=payload.get(
                    "default_clinic_id"
                ),
            )
        )

    if (
        practitioner.default_clinic_id
        and practitioner.default_branch_id
        and practitioner.default_clinic.branch_id
        != practitioner.default_branch_id
    ):
        raise ValidationError(
            {
                "default_clinic_id": (
                    "Default clinic must belong "
                    "to the default branch."
                )
            }
        )

    if (
        practitioner.default_clinic_id
        and practitioner.default_department_id
        and practitioner.default_clinic.department_id
        != practitioner.default_department_id
    ):
        raise ValidationError(
            {
                "default_clinic_id": (
                    "Default clinic must belong "
                    "to the default department."
                )
            }
        )

    set_audit(
        practitioner,
        user=user,
        creating=creating,
    )
    practitioner.save()

    return practitioner


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_collection(
    request: Request,
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

    if request.method == "GET":
        queryset = practitioner_queryset(company)

        search = str(
            request.query_params.get(
                "search",
                "",
            )
            or ""
        ).strip()

        status_value = (
            request.query_params.get("status")
        )
        type_value = (
            request.query_params.get(
                "practitioner_type"
            )
        )
        branch_id = (
            request.query_params.get("branch_id")
        )
        specialty_id = (
            request.query_params.get(
                "specialty_id"
            )
        )
        accepting = (
            request.query_params.get(
                "is_accepting_appointments"
            )
        )

        if search:
            queryset = queryset.filter(
                Q(
                    practitioner_number__icontains=(
                        search
                    )
                )
                | Q(
                    full_name_ar__icontains=search
                )
                | Q(
                    full_name_en__icontains=search
                )
                | Q(
                    professional_title__icontains=(
                        search
                    )
                )
                | Q(mobile__icontains=search)
                | Q(email__icontains=search)
            )

        if status_value:
            queryset = queryset.filter(
                status=str(
                    status_value
                ).strip().upper()
            )

        if type_value:
            queryset = queryset.filter(
                practitioner_type=str(
                    type_value
                ).strip().upper()
            )

        if branch_id:
            queryset = queryset.filter(
                default_branch_id=branch_id
            )

        if specialty_id:
            queryset = queryset.filter(
                Q(
                    primary_specialty_id=(
                        specialty_id
                    )
                )
                | Q(
                    specialty_assignments__specialty_id=(
                        specialty_id
                    ),
                    specialty_assignments__is_active=True,
                )
            ).distinct()

        if accepting is not None:
            queryset = queryset.filter(
                is_accepting_appointments=(
                    parse_bool(accepting)
                )
            )

        total = queryset.count()

        items = [
            serialize_practitioner(item)
            for item in queryset[:500]
        ]

        return Response(
            {
                "success": True,
                "count": total,
                "items": items,
                "practitioners": items,
            }
        )

    try:
        with transaction.atomic():
            practitioner = MedicalPractitioner(
                company=company,
            )

            practitioner = apply_payload(
                practitioner=practitioner,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        practitioner = (
            practitioner_queryset(company)
            .get(id=practitioner.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner created successfully."
                ),
                "item": serialize_practitioner(
                    practitioner
                ),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner data is invalid."
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
                    "record already exists."
                ),
            },
            status=400,
        )


practitioner_collection.required_company_permissions = (
    ALL_PERMISSIONS
)


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_detail(
    request: Request,
    practitioner_id: int,
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

    practitioner = (
        practitioner_queryset(company)
        .filter(id=practitioner_id)
        .first()
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
        return Response(
            {
                "success": True,
                "item": serialize_practitioner(
                    practitioner
                ),
            }
        )

    try:
        with transaction.atomic():
            practitioner = apply_payload(
                practitioner=practitioner,
                company=company,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        practitioner = (
            practitioner_queryset(company)
            .get(id=practitioner.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner updated successfully."
                ),
                "item": serialize_practitioner(
                    practitioner
                ),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner data is invalid."
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
                    "record already exists."
                ),
            },
            status=400,
        )


practitioner_detail.required_company_permissions = [
    VIEW_PERMISSION,
    UPDATE_PERMISSION,
]


@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_status(
    request: Request,
    practitioner_id: int,
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

    practitioner = (
        practitioner_queryset(company)
        .filter(id=practitioner_id)
        .first()
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

    action = str(
        request.data.get("action", "")
        or ""
    ).strip().lower()

    status_value = request.data.get("status")

    action_statuses = {
        "activate": (
            MedicalPractitionerStatus.ACTIVE
        ),
        "active": (
            MedicalPractitionerStatus.ACTIVE
        ),
        "deactivate": (
            MedicalPractitionerStatus.INACTIVE
        ),
        "inactive": (
            MedicalPractitionerStatus.INACTIVE
        ),
        "suspend": (
            MedicalPractitionerStatus.SUSPENDED
        ),
        "suspended": (
            MedicalPractitionerStatus.SUSPENDED
        ),
        "leave": (
            MedicalPractitionerStatus.ON_LEAVE
        ),
        "on_leave": (
            MedicalPractitionerStatus.ON_LEAVE
        ),
    }

    if status_value not in [None, ""]:
        new_status = str(
            status_value
        ).strip().upper()
    else:
        new_status = action_statuses.get(action)

    if new_status not in choice_values("status"):
        return Response(
            {
                "success": False,
                "message": (
                    "Provide a valid practitioner status."
                ),
            },
            status=400,
        )

    practitioner.status = new_status

    if (
        "is_accepting_appointments"
        in request.data
    ):
        practitioner.is_accepting_appointments = (
            parse_bool(
                request.data.get(
                    "is_accepting_appointments"
                )
            )
        )
    elif (
        new_status
        != MedicalPractitionerStatus.ACTIVE
    ):
        practitioner.is_accepting_appointments = (
            False
        )

    set_audit(
        practitioner,
        user=request.user,
        creating=False,
    )

    try:
        practitioner.save()
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner status is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )

    practitioner = (
        practitioner_queryset(company)
        .get(id=practitioner.id)
    )

    return Response(
        {
            "success": True,
            "message": (
                "Practitioner status "
                "updated successfully."
            ),
            "item": serialize_practitioner(
                practitioner
            ),
        }
    )


practitioner_status.required_company_permissions = [
    STATUS_PERMISSION,
]
