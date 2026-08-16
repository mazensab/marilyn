from __future__ import annotations

import json
from typing import Any

from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from integrations.payments import (
    PaymentGatewayConfigurationError,
    PaymentGatewayError,
    PaymentGatewayVerificationError,
)
from payments.models import CompanyPaymentGateway

from ..booking_payment import (
    _moyasar_adapter,
    _tabby_adapter,
    _tamara_adapter,
)
from .service import process_verified_provider_webhook


_PROVIDER_BUILDERS = {
    "moyasar": _moyasar_adapter,
    "tabby": _tabby_adapter,
    "tamara": _tamara_adapter,
}


def _gateway_matches(provider: str, gateway: CompanyPaymentGateway) -> bool:
    code = str(gateway.code or "").strip().lower()
    gateway_type = str(gateway.gateway_type or "").strip().upper()
    if provider == "moyasar":
        return gateway_type == CompanyPaymentGateway.GatewayType.MOYASAR
    return code == provider


def _gateway(provider: str, gateway_id: int) -> CompanyPaymentGateway | None:
    gateway = (
        CompanyPaymentGateway.objects
        .select_related("company")
        .filter(
            id=gateway_id,
            is_active=True,
            supports_webhooks=True,
        )
        .first()
    )
    if gateway is None or not _gateway_matches(provider, gateway):
        return None
    return gateway


def _headers(request: Request) -> dict[str, str]:
    return {
        str(key): str(value)
        for key, value in request.headers.items()
    }


def _audit_headers(headers: dict[str, str]) -> dict[str, str]:
    allowed = {
        "content-type",
        "user-agent",
        "x-request-id",
        "x-correlation-id",
    }
    return {
        key: value[:500]
        for key, value in headers.items()
        if key.strip().lower() in allowed
    }


def _json_body(request: Request) -> tuple[bytes, dict[str, Any]]:
    body = bytes(request.body or b"")
    if not body:
        raise ValueError("Webhook body is empty.")
    payload = json.loads(body.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Webhook payload must be a JSON object.")
    return body, payload


def _event_id(provider: str, payload: dict[str, Any]) -> str:
    if provider == "moyasar":
        return str(payload.get("id") or "").strip()[:180]
    return str(
        payload.get("event_id")
        or payload.get("webhook_id")
        or payload.get("notification_id")
        or ""
    ).strip()[:180]


@api_view(["POST"])
@permission_classes([AllowAny])
def provider_payment_webhook(
    request: Request,
    provider: str,
    gateway_id: int,
) -> Response:
    provider = str(provider or "").strip().lower()
    builder = _PROVIDER_BUILDERS.get(provider)
    if builder is None:
        return Response({"success": False}, status=404)

    gateway = _gateway(provider, gateway_id)
    if gateway is None:
        return Response({"success": False}, status=404)

    try:
        body, payload = _json_body(request)
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return Response(
            {"success": False, "message": "Invalid webhook payload."},
            status=400,
        )

    raw_headers = _headers(request)

    try:
        adapter = builder(gateway)
        event = adapter.verify_webhook(
            headers=raw_headers,
            body=body,
            payload=payload,
        )

        payment = adapter.retrieve_payment(
            event.provider_payment_id
        )

        if (
            payment.provider_payment_id != event.provider_payment_id
            or payment.status != event.status
        ):
            raise PaymentGatewayVerificationError(
                "Provider payment changed during webhook verification."
            )

        ledger_event, session, created = process_verified_provider_webhook(
            gateway=gateway,
            event_type=event.event_type,
            provider_payment_id=payment.provider_payment_id,
            status=payment.status,
            payload=payload,
            headers=_audit_headers(raw_headers),
            external_event_id=_event_id(provider, payload),
            reference=payment.reference,
            amount_minor=payment.amount,
            currency=payment.currency,
        )

    except PaymentGatewayVerificationError:
        return Response(
            {"success": False, "message": "Webhook verification failed."},
            status=401,
        )
    except PaymentGatewayConfigurationError:
        return Response(
            {"success": False, "message": "Webhook gateway is unavailable."},
            status=409,
        )
    except PaymentGatewayError:
        return Response(
            {"success": False, "message": "Payment provider is unavailable."},
            status=502,
        )
    except ValidationError:
        return Response(
            {"success": False, "message": "Webhook could not be applied."},
            status=409,
        )
    except Exception:
        return Response(
            {"success": False, "message": "Webhook processing failed."},
            status=502,
        )

    return Response(
        {
            "success": True,
            "provider": provider,
            "duplicate": not created,
            "event_status": ledger_event.status,
            "checkout_status": session.status,
        },
        status=200,
    )
