# ============================================================
# api/company/payments/gateways/provider_configuration.py
# Marilyn Clinics | Managed payment provider configuration
# ------------------------------------------------------------
# - Company scoped through request.company only
# - Supports Moyasar, Tamara and Tabby
# - Never returns stored secrets in plaintext
# - Blank secret fields preserve existing values
# - Creates/updates the matching customer checkout method
# - Activation is blocked until required credentials exist
# ============================================================

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import HasAnyCompanyPermission, require_company_permission
from payments.models import CompanyPaymentGateway, CompanyPaymentMethod


MASKED_SECRET = "********"


PROVIDERS: dict[str, dict[str, Any]] = {
    "moyasar": {
        "name": "Moyasar",
        "gateway_type": CompanyPaymentGateway.GatewayType.MOYASAR,
        "method_name": "mada / Apple Pay / Cards",
        "method_code": "moyasar-online",
        "method_type": CompanyPaymentMethod.MethodType.ONLINE_GATEWAY,
        "settlement_behavior": CompanyPaymentMethod.SettlementBehavior.IMMEDIATE,
        "sort_order": 20,
        "required_root": ("public_key",),
        "required_settings": ("secret_key",),
        "secret_settings": ("secret_key", "webhook_secret"),
    },
    "tamara": {
        "name": "Tamara",
        "gateway_type": CompanyPaymentGateway.GatewayType.CUSTOM,
        "method_name": "Tamara",
        "method_code": "tamara",
        "method_type": CompanyPaymentMethod.MethodType.TAMARA,
        "settlement_behavior": CompanyPaymentMethod.SettlementBehavior.EXTERNAL_CLEARING,
        "sort_order": 30,
        "required_root": (),
        "required_settings": ("api_token",),
        "secret_settings": ("api_token", "notification_token"),
    },
    "tabby": {
        "name": "Tabby",
        "gateway_type": CompanyPaymentGateway.GatewayType.CUSTOM,
        "method_name": "Tabby",
        "method_code": "tabby",
        "method_type": CompanyPaymentMethod.MethodType.TABBY,
        "settlement_behavior": CompanyPaymentMethod.SettlementBehavior.EXTERNAL_CLEARING,
        "sort_order": 40,
        "required_root": ("merchant_id",),
        "required_settings": ("secret_key",),
        "secret_settings": ("secret_key", "webhook_header_value"),
    },
}


def _request_company(request: Request):
    company = getattr(request, "company", None)
    if not company:
        raise ValidationError({"detail": "Current company context was not resolved."})
    return company


def _provider_definition(provider: str) -> dict[str, Any]:
    normalized = str(provider or "").strip().lower()
    definition = PROVIDERS.get(normalized)
    if not definition:
        raise ValidationError({"provider": "Unsupported payment provider."})
    return {"code": normalized, **definition}


def _default_base_url(provider: str, environment: str) -> str:
    if provider == "moyasar":
        return "https://api.moyasar.com/v1"
    if provider == "tamara":
        return (
            "https://api.tamara.co"
            if environment == CompanyPaymentGateway.Environment.LIVE
            else "https://api-sandbox.tamara.co"
        )
    return "https://api.tabby.sa"


def _clean_environment(value: Any) -> str:
    text = str(value or "").strip().upper()
    if text in {"LIVE", "PRODUCTION", "PROD"}:
        return CompanyPaymentGateway.Environment.LIVE
    return CompanyPaymentGateway.Environment.SANDBOX


def _clean_bool(value: Any, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value in [None, ""]:
        return fallback
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    raise ValidationError({"is_active": "Invalid boolean value."})


def _clean_timeout(value: Any) -> int:
    if value in [None, ""]:
        return 15
    try:
        timeout = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({"timeout": "Timeout must be an integer."}) from exc
    if timeout < 1 or timeout > 60:
        raise ValidationError({"timeout": "Timeout must be between 1 and 60 seconds."})
    return timeout


def _clean_https_url(value: Any, fallback: str) -> str:
    url = str(value or fallback or "").strip().rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValidationError({"base_url": "Base URL must use HTTPS."})
    return url


def _credential_state(
    provider: str,
    definition: dict[str, Any],
    gateway: CompanyPaymentGateway | None,
) -> tuple[dict[str, bool], bool]:
    settings = dict(getattr(gateway, "settings", None) or {})
    public_key = str(getattr(gateway, "public_key", "") or "").strip()
    merchant_id = str(getattr(gateway, "merchant_id", "") or "").strip()

    state: dict[str, bool] = {}
    if provider == "moyasar":
        state["public_key"] = bool(public_key)
        state["secret_key"] = bool(str(settings.get("secret_key") or "").strip())
        state["webhook_secret"] = bool(str(settings.get("webhook_secret") or "").strip())
    elif provider == "tamara":
        state["api_token"] = bool(str(settings.get("api_token") or "").strip())
        state["notification_token"] = bool(
            str(settings.get("notification_token") or "").strip()
        )
    else:
        merchant_code = str(settings.get("merchant_code") or merchant_id or "").strip()
        state["merchant_code"] = bool(merchant_code)
        state["secret_key"] = bool(str(settings.get("secret_key") or "").strip())
        state["webhook_header_name"] = bool(
            str(settings.get("webhook_header_name") or "").strip()
        )
        state["webhook_header_value"] = bool(
            str(settings.get("webhook_header_value") or "").strip()
        )

    complete = True
    for field in definition["required_root"]:
        if field == "public_key":
            complete = complete and bool(public_key)
        elif field == "merchant_id":
            complete = complete and bool(
                str(settings.get("merchant_code") or merchant_id or "").strip()
            )
        else:
            complete = complete and bool(str(getattr(gateway, field, "") or "").strip())

    for field in definition["required_settings"]:
        complete = complete and bool(str(settings.get(field) or "").strip())

    return state, bool(complete)


def _serialize_provider(
    company,
    provider: str,
    definition: dict[str, Any],
) -> dict[str, Any]:
    gateway = CompanyPaymentGateway.objects.filter(company=company, code=provider).first()
    method = CompanyPaymentMethod.objects.filter(
        company=company,
        code=definition["method_code"],
    ).first()

    environment = (
        gateway.environment
        if gateway
        else CompanyPaymentGateway.Environment.SANDBOX
    )
    settings = dict(gateway.settings or {}) if gateway else {}
    credential_state, credentials_complete = _credential_state(
        provider,
        definition,
        gateway,
    )

    return {
        "provider": provider,
        "name": definition["name"],
        "exists": bool(gateway),
        "configured": credentials_complete,
        "is_active": bool(gateway and gateway.is_active and method and method.is_active),
        "environment": environment,
        "gateway_id": gateway.id if gateway else None,
        "payment_method_id": method.id if method else None,
        "payment_method_active": bool(method and method.is_active),
        "public_key": gateway.public_key if gateway else "",
        "merchant_code": (
            str(settings.get("merchant_code") or gateway.merchant_id or "")
            if gateway
            else ""
        ),
        "base_url": str(
            settings.get("base_url")
            or _default_base_url(provider, environment)
        ),
        "timeout": int(settings.get("timeout") or 15),
        "webhook_header_name": str(settings.get("webhook_header_name") or ""),
        "credential_status": credential_state,
        "updated_at": gateway.updated_at.isoformat() if gateway and gateway.updated_at else None,
    }


def _validate_moyasar_key_environment(
    environment: str,
    public_key: str,
    secret_key: str,
) -> None:
    if not public_key or not secret_key:
        return

    if environment == CompanyPaymentGateway.Environment.LIVE:
        if not public_key.startswith("pk_live_") or not secret_key.startswith("sk_live_"):
            raise ValidationError(
                {"credentials": "Live Moyasar requires pk_live_ and sk_live_ keys."}
            )
    else:
        if not public_key.startswith("pk_test_") or not secret_key.startswith("sk_test_"):
            raise ValidationError(
                {"credentials": "Sandbox Moyasar requires pk_test_ and sk_test_ keys."}
            )


@transaction.atomic
def _save_provider_configuration(
    company,
    provider: str,
    definition: dict[str, Any],
    data: dict[str, Any],
):
    gateway = CompanyPaymentGateway.objects.filter(company=company, code=provider).first()
    existing_settings = dict(gateway.settings or {}) if gateway else {}

    environment = _clean_environment(
        data.get("environment")
        if "environment" in data
        else getattr(gateway, "environment", None)
    )

    base_url = _clean_https_url(
        _default_base_url(provider, environment),
        _default_base_url(provider, environment),
    )
    timeout = _clean_timeout(
        data.get("timeout") if "timeout" in data else existing_settings.get("timeout")
    )

    settings = dict(existing_settings)
    settings["base_url"] = base_url
    settings["timeout"] = timeout

    for field in definition["secret_settings"]:
        if field not in data:
            continue
        value = str(data.get(field) or "").strip()
        if value and value != MASKED_SECRET:
            settings[field] = value

    if provider == "tabby":
        if "merchant_code" in data:
            merchant_code = str(data.get("merchant_code") or "").strip()
            settings["merchant_code"] = merchant_code
        else:
            merchant_code = str(
                settings.get("merchant_code")
                or getattr(gateway, "merchant_id", "")
                or ""
            ).strip()

        if "webhook_header_name" in data:
            settings["webhook_header_name"] = str(
                data.get("webhook_header_name") or ""
            ).strip()
    else:
        merchant_code = ""

    public_key = (
        str(data.get("public_key") or "").strip()
        if "public_key" in data
        else str(getattr(gateway, "public_key", "") or "").strip()
    )

    if provider == "moyasar":
        _validate_moyasar_key_environment(
            environment,
            public_key,
            str(settings.get("secret_key") or "").strip(),
        )

    desired_active = _clean_bool(
        data.get("is_active") if "is_active" in data else None,
        fallback=bool(getattr(gateway, "is_active", False)),
    )

    gateway_defaults = {
        "name": definition["name"],
        "gateway_type": definition["gateway_type"],
        "environment": environment,
        "settings": settings,
        "public_key": public_key,
        "merchant_id": merchant_code if provider == "tabby" else str(
            data.get("merchant_id")
            if "merchant_id" in data
            else getattr(gateway, "merchant_id", "") or ""
        ).strip(),
        "supports_refunds": True,
        "supports_partial_refunds": True,
        "supports_webhooks": True,
        "is_active": False,
        "is_default": False,
    }

    gateway, _ = CompanyPaymentGateway.objects.update_or_create(
        company=company,
        code=provider,
        defaults=gateway_defaults,
    )

    credential_state, credentials_complete = _credential_state(
        provider,
        definition,
        gateway,
    )
    if desired_active and not credentials_complete:
        missing = [key for key, configured in credential_state.items() if not configured]
        required_missing = [
            key
            for key in missing
            if key in {"public_key", "secret_key", "api_token", "merchant_code"}
        ]
        raise ValidationError(
            {
                "credentials": (
                    "Cannot activate provider before required credentials are configured: "
                    + ", ".join(required_missing or missing)
                )
            }
        )

    gateway.is_active = desired_active
    gateway.full_clean()
    gateway.save(update_fields=["is_active", "updated_at"])

    method, _ = CompanyPaymentMethod.objects.update_or_create(
        company=company,
        code=definition["method_code"],
        defaults={
            "gateway": gateway,
            "name": definition["method_name"],
            "method_type": definition["method_type"],
            "settlement_behavior": definition["settlement_behavior"],
            "allow_customer_checkout": True,
            "allow_pos": False,
            "is_active": desired_active,
            "is_default": False,
            "sort_order": definition["sort_order"],
        },
    )
    method.full_clean()
    method.save()

    return gateway, method


@api_view(["GET", "PATCH", "PUT", "POST"])
@permission_classes([HasAnyCompanyPermission])
def payment_gateway_provider_configuration(request: Request, provider: str) -> Response:
    required_permission = (
        "company.payments.gateways.view"
        if request.method == "GET"
        else "company.payments.gateways.update"
    )

    if not require_company_permission(request, required_permission):
        return Response(
            {
                "ok": False,
                "success": False,
                "message": "You do not have permission to access this payment provider configuration.",
                "code": "PAYMENT_GATEWAY_PERMISSION_REQUIRED",
            },
            status=403,
        )

    try:
        company = _request_company(request)
        definition = _provider_definition(provider)
        provider_code = definition["code"]

        if request.method != "GET":
            _save_provider_configuration(
                company,
                provider_code,
                definition,
                dict(request.data or {}),
            )

        item = _serialize_provider(company, provider_code, definition)
        return Response(
            {
                "ok": True,
                "success": True,
                "message": (
                    "Payment provider loaded successfully."
                    if request.method == "GET"
                    else "Payment provider configuration saved successfully."
                ),
                "item": item,
                "result": item,
            },
            status=200,
        )
    except ValidationError as exc:
        return Response(
            {
                "ok": False,
                "success": False,
                "message": "Payment provider configuration validation failed.",
                "errors": getattr(exc, "message_dict", None) or {"detail": exc.messages},
            },
            status=400,
        )


payment_gateway_provider_configuration.required_company_permissions = [
    "company.payments.gateways.view",
    "company.payments.gateways.update",
]
