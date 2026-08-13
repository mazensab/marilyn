from __future__ import annotations
from typing import Any
from django.db.models import Q
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from medical.models import (
    MedicalPractitioner,
    MedicalPractitionerStatus,
)
PUBLIC_LIMIT = 6
def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
def _related_name(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    name_ar = _text(
        getattr(value, "name_ar", "")
    )
    name_en = _text(
        getattr(value, "name_en", "")
    )
    display_name = _text(
        getattr(value, "display_name", "")
    )
    if not display_name:
        display_name = (
            name_ar
            or name_en
            or _text(getattr(value, "name", ""))
            or _text(getattr(value, "code", ""))
        )
    return {
        "id": getattr(value, "id", None),
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": display_name,
    }
def _serialize_public_practitioner(
    practitioner: MedicalPractitioner,
) -> dict[str, Any]:
    full_name_ar = _text(
        practitioner.full_name_ar
    )
    full_name_en = _text(
        practitioner.full_name_en
    )
    return {
        "id": practitioner.id,
        "full_name_ar": full_name_ar,
        "full_name_en": full_name_en,
        "display_name": (
            full_name_ar
            or full_name_en
        ),
        "professional_title": _text(
            practitioner.professional_title
        ),
        "practitioner_type": _text(
            practitioner.practitioner_type
        ),
        "primary_specialty": _related_name(
            practitioner.primary_specialty
        ),
        "default_branch": _related_name(
            practitioner.default_branch
        ),
        "is_accepting_appointments": True,
    }
@api_view(["GET"])
@permission_classes([AllowAny])
def public_practitioners(
    request: Request,
) -> Response:
    del request
    queryset = (
        MedicalPractitioner.objects
        .filter(
            status=MedicalPractitionerStatus.ACTIVE,
            is_accepting_appointments=True,
        )
        .filter(
            Q(full_name_ar__gt="")
            | Q(full_name_en__gt="")
        )
        .select_related(
            "primary_specialty",
            "default_branch",
        )
        .order_by(
            "practitioner_number",
            "id",
        )
    )
    company_ids = list(
        queryset
        .values_list(
            "company_id",
            flat=True,
        )
        .distinct()[:2]
    )
    # Marilyn public website represents one medical entity.
    # Never mix anonymous public practitioner records from
    # multiple company scopes.
    if len(company_ids) != 1:
        return Response(
            {
                "success": True,
                "count": 0,
                "results": [],
            }
        )
    practitioners = list(
        queryset
        .filter(
            company_id=company_ids[0]
        )
        [:PUBLIC_LIMIT]
    )
    results = [
        _serialize_public_practitioner(
            practitioner
        )
        for practitioner in practitioners
    ]
    return Response(
        {
            "success": True,
            "count": len(results),
            "results": results,
        }
    )

@api_view(["GET"])
@permission_classes([AllowAny])
def public_practitioner_detail(
    request: Request,
    practitioner_id: int,
) -> Response:
    del request
    queryset = (
        MedicalPractitioner.objects
        .filter(
            status=MedicalPractitionerStatus.ACTIVE,
            is_accepting_appointments=True,
        )
        .filter(
            Q(full_name_ar__gt="")
            | Q(full_name_en__gt="")
        )
        .select_related(
            "primary_specialty",
            "default_branch",
        )
    )
    company_ids = list(
        queryset
        .values_list(
            "company_id",
            flat=True,
        )
        .distinct()[:2]
    )
    if len(company_ids) != 1:
        return Response(
            {
                "success": False,
                "message": (
                    "Public medical practitioner "
                    "was not found."
                ),
            },
            status=404,
        )
    practitioner = (
        queryset
        .filter(
            company_id=company_ids[0],
            id=practitioner_id,
        )
        .first()
    )
    if practitioner is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Public medical practitioner "
                    "was not found."
                ),
            },
            status=404,
        )
    return Response(
        {
            "success": True,
            "item": _serialize_public_practitioner(
                practitioner
            ),
        }
    )
