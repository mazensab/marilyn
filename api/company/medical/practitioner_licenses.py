from __future__ import annotations

from datetime import date
from typing import Any

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission
from medical.models import (
    MedicalLicenseStatus,
    MedicalPractitioner,
    MedicalPractitionerLicense,
)

from .practitioners import (
    company_or_error,
    ensure_permission,
    parse_date_value,
    parse_json_object,
    resolve_specialty,
    set_audit,
    validation_payload,
)
from .serializers import iso_value, serialize_specialty


LICENSE_VIEW_PERMISSION = (
    "company.medical.practitioners.licenses.view"
)
LICENSE_CREATE_PERMISSION = (
    "company.medical.practitioners.licenses.create"
)
LICENSE_UPDATE_PERMISSION = (
    "company.medical.practitioners.licenses.update"
)
LICENSE_STATUS_PERMISSION = (
    "company.medical.practitioners.licenses.status"
)

LICENSE_STATUS_VALUES = {
    value
    for value, _label in MedicalLicenseStatus.choices
}

LICENSE_ACTIONS = {
    "pending": MedicalLicenseStatus.PENDING,
    "activate": MedicalLicenseStatus.ACTIVE,
    "expire": MedicalLicenseStatus.EXPIRED,
    "suspend": MedicalLicenseStatus.SUSPENDED,
    "revoke": MedicalLicenseStatus.REVOKED,
}


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


def license_queryset(
    company,
    practitioner,
):
    return (
        MedicalPractitionerLicense.objects
        .filter(
            company=company,
            practitioner=practitioner,
        )
        .select_related(
            "practitioner",
            "specialty",
        )
        .order_by(
            "license_number",
            "id",
        )
    )


def normalize_status(value: Any) -> str:
    status_value = str(value or "").strip().upper()

    if status_value not in LICENSE_STATUS_VALUES:
        raise ValidationError(
            {
                "status": "Invalid license status."
            }
        )

    return status_value


def serialize_license(
    item: MedicalPractitionerLicense,
) -> dict[str, Any]:
    today = date.today()

    days_until_expiry = None

    if item.expires_at:
        days_until_expiry = (
            item.expires_at - today
        ).days

    return {
        "id": item.id,
        "company_id": item.company_id,
        "practitioner_id": item.practitioner_id,
        "specialty": (
            serialize_specialty(item.specialty)
            if item.specialty_id
            else None
        ),
        "license_number": item.license_number,
        "license_type": item.license_type,
        "issuing_authority": item.issuing_authority,
        "status": item.status,
        "status_display": item.get_status_display(),
        "issued_at": iso_value(item.issued_at),
        "expires_at": iso_value(item.expires_at),
        "verified_at": iso_value(item.verified_at),
        "document_reference": item.document_reference,
        "notes": item.notes,
        "extra_data": item.extra_data,
        "is_expired": bool(
            item.expires_at
            and item.expires_at < today
        ),
        "days_until_expiry": days_until_expiry,
        "created_at": iso_value(item.created_at),
        "updated_at": iso_value(item.updated_at),
    }


def validate_license_dates(
    item: MedicalPractitionerLicense,
) -> None:
    if (
        item.issued_at
        and item.expires_at
        and item.expires_at < item.issued_at
    ):
        raise ValidationError(
            {
                "expires_at": (
                    "Expiry date cannot be "
                    "before issue date."
                )
            }
        )

    if (
        item.issued_at
        and item.verified_at
        and item.verified_at < item.issued_at
    ):
        raise ValidationError(
            {
                "verified_at": (
                    "Verification date cannot be "
                    "before issue date."
                )
            }
        )


def apply_license_payload(
    *,
    item: MedicalPractitionerLicense,
    company,
    practitioner,
    payload,
    user,
    creating: bool,
) -> MedicalPractitionerLicense:
    if (
        creating
        and "license_number" not in payload
    ):
        raise ValidationError(
            {
                "license_number": (
                    "This field is required."
                )
            }
        )


    if creating and not str(
        payload.get("issuing_authority") or ""
    ).strip():
        raise ValidationError(
            {
                "issuing_authority": (
                    "This field is required."
                )
            }
        )

    if "license_number" in payload:
        item.license_number = str(
            payload.get("license_number") or ""
        ).strip().upper()

    if "license_type" in payload:
        item.license_type = str(
            payload.get("license_type") or ""
        ).strip()


    if "issuing_authority" in payload:
        item.issuing_authority = str(
            payload.get("issuing_authority")
            or ""
        ).strip()

    if "specialty_id" in payload:
        specialty_value = payload.get(
            "specialty_id"
        )

        if specialty_value in [None, ""]:
            item.specialty = None
        else:
            item.specialty = resolve_specialty(
                company=company,
                value=specialty_value,
            )

    if creating and "status" in payload:
        item.status = normalize_status(
            payload.get("status")
        )

    if (
        not creating
        and "status" in payload
    ):
        raise ValidationError(
            {
                "status": (
                    "Use the license status endpoint "
                    "to change license status."
                )
            }
        )

    for field_name in [
        "issued_at",
        "expires_at",
        "verified_at",
    ]:
        if field_name in payload:
            setattr(
                item,
                field_name,
                parse_date_value(
                    payload.get(field_name),
                    field_name,
                ),
            )

    if "document_reference" in payload:
        item.document_reference = str(
            payload.get("document_reference")
            or ""
        ).strip()

    if "notes" in payload:
        item.notes = str(
            payload.get("notes") or ""
        ).strip()

    if "extra_data" in payload:
        item.extra_data = parse_json_object(
            payload.get("extra_data"),
            "extra_data",
        )

    item.company = company
    item.practitioner = practitioner

    validate_license_dates(item)

    set_audit(
        item,
        user=user,
        creating=creating,
    )

    item.full_clean()
    item.save()

    return item


@api_view(["GET", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_license_collection(
    request: Request,
    practitioner_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        LICENSE_VIEW_PERMISSION
        if request.method == "GET"
        else LICENSE_CREATE_PERMISSION
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
        try:
            queryset = license_queryset(
                company,
                practitioner,
            )

            search = str(
                request.query_params.get("search")
                or ""
            ).strip()

            if search:
                queryset = queryset.filter(
                    Q(
                        license_number__icontains=search
                    )
                    | Q(
                        license_type__icontains=search
                    )
                    | Q(
                        issuing_authority__icontains=search
                    )
                    | Q(
                        document_reference__icontains=search
                    )
                    | Q(
                        notes__icontains=search
                    )
                )

            status_value = (
                request.query_params.get("status")
            )

            if status_value:
                queryset = queryset.filter(
                    status=normalize_status(
                        status_value
                    )
                )

            specialty_id = (
                request.query_params.get(
                    "specialty_id"
                )
            )

            if specialty_id:
                queryset = queryset.filter(
                    specialty_id=specialty_id
                )

            expires_before = (
                request.query_params.get(
                    "expires_before"
                )
            )

            if expires_before:
                queryset = queryset.filter(
                    expires_at__lte=parse_date_value(
                        expires_before,
                        "expires_before",
                    )
                )

            expires_after = (
                request.query_params.get(
                    "expires_after"
                )
            )

            if expires_after:
                queryset = queryset.filter(
                    expires_at__gte=parse_date_value(
                        expires_after,
                        "expires_after",
                    )
                )

            items = [
                serialize_license(item)
                for item in queryset
            ]

            return Response(
                {
                    "success": True,
                    "count": len(items),
                    "items": items,
                    "licenses": items,
                }
            )

        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        "License filters are invalid."
                    ),
                    "errors": validation_payload(exc),
                },
                status=400,
            )

    try:
        with transaction.atomic():
            item = MedicalPractitionerLicense(
                company=company,
                practitioner=practitioner,
            )

            item = apply_license_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=True,
            )

        item = (
            license_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner license "
                    "created successfully."
                ),
                "item": serialize_license(item),
            },
            status=201,
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner license "
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
                    "A license with this number "
                    "already exists."
                ),
            },
            status=400,
        )


practitioner_license_collection.required_company_permissions = [
    LICENSE_VIEW_PERMISSION,
    LICENSE_CREATE_PERMISSION,
]


@api_view(["GET", "PATCH", "POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_license_detail(
    request: Request,
    practitioner_id: int,
    license_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission = (
        LICENSE_VIEW_PERMISSION
        if request.method == "GET"
        else LICENSE_UPDATE_PERMISSION
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
        license_queryset(
            company,
            practitioner,
        )
        .filter(id=license_id)
        .first()
    )

    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner license "
                    "was not found."
                ),
            },
            status=404,
        )

    if request.method == "GET":
        return Response(
            {
                "success": True,
                "item": serialize_license(item),
            }
        )

    try:
        with transaction.atomic():
            item = apply_license_payload(
                item=item,
                company=company,
                practitioner=practitioner,
                payload=request.data.copy(),
                user=request.user,
                creating=False,
            )

        item = (
            license_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner license "
                    "updated successfully."
                ),
                "item": serialize_license(item),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner license "
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
                    "A license with this number "
                    "already exists."
                ),
            },
            status=400,
        )


practitioner_license_detail.required_company_permissions = [
    LICENSE_VIEW_PERMISSION,
    LICENSE_UPDATE_PERMISSION,
]


@api_view(["POST"])
@permission_classes([HasAnyCompanyPermission])
def practitioner_license_status(
    request: Request,
    practitioner_id: int,
    license_id: int,
) -> Response:
    company, error = company_or_error(request)

    if error:
        return error

    permission_error = ensure_permission(
        request,
        LICENSE_STATUS_PERMISSION,
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
        license_queryset(
            company,
            practitioner,
        )
        .filter(id=license_id)
        .first()
    )

    if item is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Practitioner license "
                    "was not found."
                ),
            },
            status=404,
        )

    try:
        action = str(
            request.data.get("action") or ""
        ).strip().lower()

        direct_status = request.data.get("status")

        if action == "verify":
            item.status = MedicalLicenseStatus.ACTIVE

            verification_value = (
                request.data.get("verified_at")
                or date.today().isoformat()
            )

            item.verified_at = parse_date_value(
                verification_value,
                "verified_at",
            )

        elif action in LICENSE_ACTIONS:
            item.status = LICENSE_ACTIONS[action]

        elif direct_status not in [None, ""]:
            item.status = normalize_status(
                direct_status
            )

        else:
            raise ValidationError(
                {
                    "action": (
                        "A valid license status "
                        "action is required."
                    )
                }
            )

        if (
            "verified_at" in request.data
            and action != "verify"
        ):
            item.verified_at = parse_date_value(
                request.data.get("verified_at"),
                "verified_at",
            )

        validate_license_dates(item)

        set_audit(
            item,
            user=request.user,
            creating=False,
        )

        item.full_clean()
        item.save()

        item = (
            license_queryset(
                company,
                practitioner,
            )
            .get(id=item.id)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Practitioner license status "
                    "updated successfully."
                ),
                "item": serialize_license(item),
            }
        )

    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "License status action "
                    "is invalid."
                ),
                "errors": validation_payload(exc),
            },
            status=400,
        )


practitioner_license_status.required_company_permissions = [
    LICENSE_STATUS_PERMISSION,
]
