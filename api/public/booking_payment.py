from __future__ import annotations
from decimal import Decimal
from typing import Any
from django.core import signing
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from medical.models import MedicalAppointment
from payments.models import CompanyPaymentMethod
PUBLIC_PAYMENT_TOKEN_SALT = (
    "marilyn.public.booking.payment"
)
PUBLIC_PAYMENT_TOKEN_MAX_AGE_SECONDS = (
    60 * 60 * 24
)
# Intentionally empty.
#
# A provider is added here only after Marilyn has a real
# server-side adapter that creates an external checkout
# with that provider and returns a genuine checkout URL.
PUBLIC_PAYMENT_PROVIDER_ADAPTERS: frozenset[str] = (
    frozenset()
)
def issue_public_payment_token(
    appointment: MedicalAppointment,
) -> str:
    """
    Produce a short-lived signed capability for the confirmed
    appointment.
    The token contains no patient data and no company identifier.
    The appointment primary key is safe only because the payload
    is cryptographically signed and cannot be changed by the
    client without invalidating the token.
    """
    return signing.dumps(
        {
            "appointment_id": (
                appointment.id
            ),
        },
        salt=PUBLIC_PAYMENT_TOKEN_SALT,
        compress=True,
    )
def _load_public_payment_appointment(
    token: str,
):
    value = str(
        token or ""
    ).strip()
    if not value:
        return None
    try:
        payload = signing.loads(
            value,
            salt=PUBLIC_PAYMENT_TOKEN_SALT,
            max_age=(
                PUBLIC_PAYMENT_TOKEN_MAX_AGE_SECONDS
            ),
        )
    except (
        signing.BadSignature,
        signing.SignatureExpired,
    ):
        return None
    if not isinstance(
        payload,
        dict,
    ):
        return None
    try:
        appointment_id = int(
            payload.get(
                "appointment_id"
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return None
    if appointment_id <= 0:
        return None
    return (
        MedicalAppointment.objects
        .filter(
            id=appointment_id,
            source="ONLINE",
            status__in=(
                "SCHEDULED",
                "CONFIRMED",
            ),
        )
        .select_related(
            "company",
            "branch",
            "practitioner",
            "practitioner_service_assignment",
            (
                "practitioner_service_assignment__"
                "service_offering"
            ),
            (
                "practitioner_service_assignment__"
                "service_offering__catalog_item"
            ),
        )
        .first()
    )
def _adapter_ready(
    gateway_type: str,
) -> bool:
    return (
        str(
            gateway_type or ""
        ).strip()
        in PUBLIC_PAYMENT_PROVIDER_ADAPTERS
    )
def _public_payment_method_queryset(
    appointment: MedicalAppointment,
):
    return (
        CompanyPaymentMethod.objects
        .filter(
            company=(
                appointment.company
            ),
            is_active=True,
            allow_customer_checkout=True,
            is_online=True,
            gateway__isnull=False,
            gateway__is_active=True,
        )
        .select_related(
            "gateway"
        )
        .order_by(
            "sort_order",
            "id",
        )
    )
def _public_payment_methods(
    appointment: MedicalAppointment,
):
    return [
        method
        for method
        in _public_payment_method_queryset(
            appointment
        )
        if (
            method.gateway is not None
            and _adapter_ready(
                method.gateway.gateway_type
            )
        )
    ]
def _serialize_public_payment_method(
    method: CompanyPaymentMethod,
) -> dict[str, Any]:
    return {
        "name": str(
            method.name or ""
        ).strip(),
        "code": str(
            method.code or ""
        ).strip(),
        "method_type": str(
            method.method_type or ""
        ).strip(),
        "gateway_type": str(
            method.gateway.gateway_type
            if method.gateway
            else ""
        ).strip(),
    }
def _money(
    value,
) -> Decimal:
    try:
        return Decimal(
            str(
                value or "0"
            )
        )
    except (
        ArithmeticError,
        TypeError,
        ValueError,
    ):
        return Decimal("0")
@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_payment_options(
    request: Request,
) -> Response:
    appointment = (
        _load_public_payment_appointment(
            request.query_params.get(
                "token",
                "",
            )
        )
    )
    if appointment is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Payment access is invalid "
                    "or has expired."
                ),
            },
            status=404,
        )
    amount = _money(
        appointment.price_snapshot
    )
    currency = str(
        getattr(
            appointment.company,
            "currency_code",
            "SAR",
        )
        or "SAR"
    ).strip().upper()
    if amount <= Decimal("0"):
        return Response(
            {
                "success": True,
                "payment_required": False,
                "payment_available": False,
                "amount": str(
                    amount
                ),
                "currency_code": (
                    currency
                ),
                "methods": [],
            }
        )
    methods = (
        _public_payment_methods(
            appointment
        )
    )
    return Response(
        {
            "success": True,
            "payment_required": True,
            "payment_available": bool(
                methods
            ),
            "amount": str(
                amount
            ),
            "currency_code": (
                currency
            ),
            "methods": [
                _serialize_public_payment_method(
                    method
                )
                for method in methods
            ],
        }
    )
