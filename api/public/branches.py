from __future__ import annotations
from typing import Any
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from companies.models import (
    Branch,
    BranchStatus,
    BranchType,
)
PUBLIC_BRANCH_TYPES = (
    BranchType.HEAD_OFFICE,
    BranchType.BRANCH,
    BranchType.SERVICE_CENTER,
)
def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
def _time(value: Any) -> str:
    if value is None:
        return ""
    try:
        return value.strftime("%H:%M")
    except (AttributeError, ValueError):
        return _text(value)
def _public_queryset():
    return (
        Branch.objects
        .filter(
            status=BranchStatus.ACTIVE,
            is_active=True,
            branch_type__in=PUBLIC_BRANCH_TYPES,
        )
        .order_by(
            "-is_default",
            "city",
            "branch_code",
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
    # The Marilyn public website represents one medical
    # organization. Never anonymously combine branch records
    # belonging to multiple company scopes.
    if len(company_ids) != 1:
        return None
    return company_ids[0]
def _serialize_public_branch(
    branch: Branch,
) -> dict[str, Any]:
    name_ar = _text(
        branch.name_ar
    )
    name_en = _text(
        branch.name_en
    )
    display_name = _text(
        branch.display_name
    )
    return {
        "id": branch.id,
        "branch_code": _text(
            branch.branch_code
        ),
        "name_ar": name_ar,
        "name_en": name_en,
        "display_name": (
            name_ar
            or name_en
            or display_name
        ),
        "branch_type": _text(
            branch.branch_type
        ),
        "is_default": bool(
            branch.is_default
        ),
        "country": _text(
            branch.country
        ),
        "city": _text(
            branch.city
        ),
        "region": _text(
            branch.region
        ),
        "district": _text(
            branch.district
        ),
        "street_name": _text(
            branch.street_name
        ),
        "building_number": _text(
            branch.building_number
        ),
        "postal_code": _text(
            branch.postal_code
        ),
        "short_address": _text(
            branch.short_address
        ),
        "national_address_line": _text(
            getattr(
                branch,
                "national_address_line",
                "",
            )
        ),
        "address": _text(
            branch.address
        ),
        "latitude": (
            str(branch.latitude)
            if branch.latitude is not None
            else ""
        ),
        "longitude": (
            str(branch.longitude)
            if branch.longitude is not None
            else ""
        ),
        "opening_time": _time(
            branch.opening_time
        ),
        "closing_time": _time(
            branch.closing_time
        ),
    }
@api_view(["GET"])
@permission_classes([AllowAny])
def public_branch_list(
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
    branches = list(
        queryset.filter(
            company_id=company_id
        )
    )
    results = [
        _serialize_public_branch(branch)
        for branch in branches
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
def public_branch_detail(
    request: Request,
    branch_id: int,
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
                    "Public branch "
                    "was not found."
                ),
            },
            status=404,
        )
    branch = (
        queryset
        .filter(
            company_id=company_id,
            id=branch_id,
        )
        .first()
    )
    if branch is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Public branch "
                    "was not found."
                ),
            },
            status=404,
        )
    return Response(
        {
            "success": True,
            "item": _serialize_public_branch(
                branch
            ),
        }
    )
