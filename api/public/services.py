from __future__ import annotations
from typing import Any
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from medical.models import (
    MedicalServiceOffering,
    MedicalServiceOfferingStatus,
)
PUBLIC_SERVICE_LIMIT = 100
def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
def _related(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    name_ar = _text(
        getattr(value, "name_ar", "")
    )
    name_en = _text(
        getattr(value, "name_en", "")
    )
    generic_name = _text(
        getattr(value, "name", "")
    )
    code = _text(
        getattr(value, "code", "")
    )
    return {
        "id": getattr(value, "id", None),
        "code": code,
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": (
            name_ar
            or name_en
            or generic_name
            or code
        ),
    }
def _public_queryset():
    return (
        MedicalServiceOffering.objects
        .filter(
            status=MedicalServiceOfferingStatus.ACTIVE,
            online_booking_enabled=True,
            catalog_item__item_type="SERVICE",
            catalog_item__status="ACTIVE",
            catalog_item__is_sellable=True,
        )
        .select_related(
            "catalog_item",
            "branch",
            "department",
            "specialty",
            "clinic",
        )
        .order_by(
            "catalog_item__name_ar",
            "catalog_item__name_en",
            "id",
        )
    )
def _public_company_id(queryset) -> int | None:
    company_ids = list(
        queryset
        .values_list(
            "company_id",
            flat=True,
        )
        .distinct()[:2]
    )
    # Marilyn public website represents one medical entity.
    # If multiple company scopes are ever present, expose
    # nothing instead of anonymously mixing their data.
    if len(company_ids) != 1:
        return None
    return company_ids[0]
def _serialize(
    offering: MedicalServiceOffering,
) -> dict[str, Any]:
    item = offering.catalog_item
    name_ar = _text(
        getattr(item, "name_ar", "")
    )
    name_en = _text(
        getattr(item, "name_en", "")
    )
    generic_name = _text(
        getattr(item, "name", "")
    )
    code = _text(
        getattr(item, "code", "")
    )
    return {
        "id": offering.id,
        "code": code,
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": (
            name_ar
            or name_en
            or generic_name
            or code
        ),
        "description": _text(
            getattr(item, "description", "")
        ),
        "branch": _related(
            offering.branch
        ),
        "department": _related(
            offering.department
        ),
        "specialty": _related(
            offering.specialty
        ),
        "clinic": _related(
            offering.clinic
        ),
        "duration_minutes": (
            offering.duration_minutes
        ),
        "effective_sale_price": str(
            offering.effective_sale_price
        ),
        "default_session_count": (
            offering.default_session_count
        ),
        "requires_approval": (
            offering.requires_approval
        ),
        "requires_preparation": (
            offering.requires_preparation
        ),
        "preparation_instructions": _text(
            offering.preparation_instructions
        ),
        "online_booking_enabled": True,
    }
@api_view(["GET"])
@permission_classes([AllowAny])
def public_service_list(
    request: Request,
) -> Response:
    del request
    queryset = _public_queryset()
    company_id = _public_company_id(
        queryset
    )
    if company_id is None:
        return Response(
            {
                "success": True,
                "count": 0,
                "results": [],
            }
        )
    offerings = list(
        queryset
        .filter(
            company_id=company_id
        )
        [:PUBLIC_SERVICE_LIMIT]
    )
    results = [
        _serialize(offering)
        for offering in offerings
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
def public_service_detail(
    request: Request,
    offering_id: int,
) -> Response:
    del request
    queryset = _public_queryset()
    company_id = _public_company_id(
        queryset
    )
    if company_id is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Public medical service "
                    "was not found."
                ),
            },
            status=404,
        )
    offering = (
        queryset
        .filter(
            company_id=company_id,
            id=offering_id,
        )
        .first()
    )
    if offering is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Public medical service "
                    "was not found."
                ),
            },
            status=404,
        )
    return Response(
        {
            "success": True,
            "item": _serialize(
                offering
            ),
        }
    )
