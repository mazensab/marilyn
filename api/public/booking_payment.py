from __future__ import annotations

import logging

from urllib.parse import (
    parse_qsl,
    urlencode,
    urlsplit,
    urlunsplit,
)

from decimal import (
    Decimal,
    InvalidOperation,
    ROUND_HALF_UP,
)
from typing import Any

from django.conf import settings
from django.core import signing
from django.http import HttpResponseRedirect
from django.utils import timezone

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from medical.models import MedicalAppointment
from payments.models import (
    CompanyPaymentGateway,
    CompanyPaymentMethod,
    PaymentCheckoutSession,
)
from payments.services import (
    create_checkout_session,
)

from integrations.payments import (
    PaymentGatewayConfigurationError,
    PaymentGatewayError,
    PaymentRequest,
    PaymentStatus,
)

from integrations.payments.moyasar.adapter import (
    MoyasarAdapter,
)
from integrations.payments.moyasar.client import (
    MoyasarClient,
)
from integrations.payments.tamara.adapter import (
    TamaraAdapter,
)
from integrations.payments.tamara.client import (
    TamaraClient,
)
from integrations.payments.tabby.adapter import (
    TabbyAdapter,
)
from integrations.payments.tabby.client import (
    TabbyClient,
)


PUBLIC_PAYMENT_TOKEN_SALT = (
    "marilyn.public.booking.payment"
)

PUBLIC_PAYMENT_TOKEN_MAX_AGE_SECONDS = (
    60 * 60 * 24
)

MONEY_QUANT = Decimal("0.01")

logger = logging.getLogger(__name__)


def issue_public_payment_token(
    appointment: MedicalAppointment,
) -> str:
    """
    Issue a short-lived signed capability that allows the public
    booking flow to retrieve payment options for one appointment.

    Security properties:
    - no patient data is placed in the token;
    - no company identifier is accepted from the client;
    - appointment ID tampering invalidates the signature;
    - tokens expire automatically.
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
) -> MedicalAppointment | None:
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
            "patient",
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


def _money(
    value: Any,
) -> Decimal:
    try:
        amount = Decimal(
            str(
                value
                if value is not None
                else "0"
            )
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return Decimal("0.00")

    if not amount.is_finite():
        return Decimal("0.00")

    return amount.quantize(
        MONEY_QUANT,
        rounding=ROUND_HALF_UP,
    )


def _currency_code(
    appointment: MedicalAppointment,
) -> str:
    currency = str(
        getattr(
            appointment.company,
            "currency_code",
            "SAR",
        )
        or "SAR"
    ).strip().upper()

    if (
        len(currency) != 3
        or not currency.isalpha()
    ):
        return "SAR"

    return currency


def _gateway_code(
    method: CompanyPaymentMethod,
) -> str:
    if method.gateway is None:
        return ""

    return str(
        method.gateway.code or ""
    ).strip().lower()


def _gateway_type(
    method: CompanyPaymentMethod,
) -> str:
    if method.gateway is None:
        return ""

    return str(
        method.gateway.gateway_type or ""
    ).strip().upper()


def _provider_for_method(
    method: CompanyPaymentMethod,
) -> str:
    method_type = str(
        method.method_type or ""
    ).strip().upper()

    gateway_type = _gateway_type(
        method
    )

    gateway_code = _gateway_code(
        method
    )

    if (
        method_type
        == CompanyPaymentMethod.MethodType.CASH
    ):
        return "cash_at_clinic"

    if method.gateway is None:
        return ""

    if not method.gateway.is_active:
        return ""

    if (
        method_type
        == CompanyPaymentMethod.MethodType.TAMARA
    ):
        return "tamara"

    if (
        method_type
        == CompanyPaymentMethod.MethodType.TABBY
    ):
        return "tabby"

    if (
        method_type
        == CompanyPaymentMethod.MethodType.ONLINE_GATEWAY
        and gateway_type
        == CompanyPaymentGateway.GatewayType.MOYASAR
    ):
        return "moyasar"

    if (
        method_type
        == CompanyPaymentMethod.MethodType.ONLINE_GATEWAY
        and gateway_code == "tamara"
    ):
        return "tamara"

    if (
        method_type
        == CompanyPaymentMethod.MethodType.ONLINE_GATEWAY
        and gateway_code == "tabby"
    ):
        return "tabby"

    return ""


def _requires_redirect(
    provider: str,
) -> bool:
    return provider in {
        "moyasar",
        "tamara",
        "tabby",
    }


def _public_payment_method_queryset(
    appointment: MedicalAppointment,
):
    return (
        CompanyPaymentMethod.objects
        .filter(
            company=appointment.company,
            is_active=True,
            allow_customer_checkout=True,
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
) -> list[CompanyPaymentMethod]:
    result: list[
        CompanyPaymentMethod
    ] = []

    for method in (
        _public_payment_method_queryset(
            appointment
        )
    ):
        provider = _provider_for_method(
            method
        )

        if not provider:
            continue

        result.append(
            method
        )

    return result


def _serialize_public_payment_method(
    method: CompanyPaymentMethod,
) -> dict[str, Any]:
    provider = _provider_for_method(
        method
    )
    return {
        "id": method.id,
        "name": str(
            method.name or ""
        ).strip(),
        "code": str(
            method.code or ""
        ).strip(),
        "method_type": str(
            method.method_type or ""
        ).strip(),
        "gateway_type": (
            _gateway_type(
                method
            )
        ),
        "provider": provider,
        "requires_redirect": (
            _requires_redirect(
                provider
            )
        ),
        "is_cash_at_clinic": (
            provider
            == "cash_at_clinic"
        ),
    }
def _gateway_settings(
    gateway: CompanyPaymentGateway,
) -> dict[str, Any]:
    settings = getattr(
        gateway,
        "settings",
        {},
    )
    if not isinstance(
        settings,
        dict,
    ):
        return {}
    return settings
def _gateway_setting(
    gateway: CompanyPaymentGateway,
    *names: str,
    default: Any = "",
) -> Any:
    settings = _gateway_settings(
        gateway
    )
    for name in names:
        if not name:
            continue
        value = settings.get(
            name
        )
        if value is None:
            continue
        if isinstance(
            value,
            str,
        ):
            value = value.strip()
            if not value:
                continue
        return value
    return default
def _gateway_timeout(
    gateway: CompanyPaymentGateway,
) -> float:
    raw = _gateway_setting(
        gateway,
        "timeout",
        "request_timeout",
        default=15.0,
    )
    try:
        timeout = float(
            raw
        )
    except (
        TypeError,
        ValueError,
    ):
        timeout = 15.0
    if (
        timeout <= 0
        or timeout > 60
    ):
        timeout = 15.0
    return timeout
def _public_callback_urls(
    request: Request,
    *,
    provider: str,
    session: PaymentCheckoutSession,
) -> dict[str, str]:
    """
    Construct absolute HTTPS callback URLs without trusting arbitrary
    client-supplied redirect hosts.
    The URLs remain inside Marilyn's own public API namespace.
    """
    provider_value = str(
        provider or ""
    ).strip().lower()
    session_id = int(
        session.id
    )
    success_path = (
        "/api/public/booking/payment/"
        f"return/{provider_value}/success/"
        f"?session={session_id}"
    )
    failure_path = (
        "/api/public/booking/payment/"
        f"return/{provider_value}/failure/"
        f"?session={session_id}"
    )
    cancel_path = (
        "/api/public/booking/payment/"
        f"return/{provider_value}/cancel/"
        f"?session={session_id}"
    )
    success_url = (
        request.build_absolute_uri(
            success_path
        )
    )
    failure_url = (
        request.build_absolute_uri(
            failure_path
        )
    )
    cancel_url = (
        request.build_absolute_uri(
            cancel_path
        )
    )
    return {
        "success": success_url,
        "failure": failure_url,
        "cancel": cancel_url,
    }
def _patient_name(
    appointment: MedicalAppointment,
) -> str:
    patient = appointment.patient
    if patient is None:
        return ""
    for field_name in (
        "full_name",
        "full_name_en",
        "full_name_ar",
        "name",
    ):
        value = str(
            getattr(
                patient,
                field_name,
                "",
            )
            or ""
        ).strip()
        if value:
            return value[:220]
    return ""
def _appointment_reference(
    appointment: MedicalAppointment,
) -> str:
    reference = str(
        getattr(
            appointment,
            "appointment_number",
            "",
        )
        or ""
    ).strip()
    if reference:
        return reference[:100]
    return (
        f"appointment-{appointment.id}"
    )
def _payment_request_for_tamara(
    *,
    request: Request,
    appointment: MedicalAppointment,
    session: PaymentCheckoutSession,
    amount: Decimal,
    currency: str,
) -> PaymentRequest:
    patient = appointment.patient
    customer_name = _patient_name(
        appointment
    )
    customer_email = str(
        getattr(
            patient,
            "email",
            "",
        )
        or ""
    ).strip()
    customer_phone = str(
        getattr(
            patient,
            "mobile",
            "",
        )
        or ""
    ).strip()
    reference = _appointment_reference(
        appointment
    )
    urls = _public_callback_urls(
        request,
        provider="tamara",
        session=session,
    )
    item_name = (
        "Clinic appointment"
    )
    service_assignment = getattr(
        appointment,
        "practitioner_service_assignment",
        None,
    )
    if service_assignment is not None:
        offering = getattr(
            service_assignment,
            "service_offering",
            None,
        )
        if offering is not None:
            catalog_item = getattr(
                offering,
                "catalog_item",
                None,
            )
            candidate = str(
                getattr(
                    catalog_item,
                    "name",
                    "",
                )
                or getattr(
                    offering,
                    "name",
                    "",
                )
                or ""
            ).strip()
            if candidate:
                item_name = candidate[:255]
    amount_minor = _minor_units(
        amount
    )
    amount_major = format(
        amount,
        ".2f",
    )
    consumer = {
        "first_name": (
            customer_name
            or "Marilyn Customer"
        ),
        "last_name": "",
        "phone_number": (
            customer_phone
        ),
        "email": (
            customer_email
        ),
    }
    shipping_address = {
        "first_name": (
            customer_name
            or "Marilyn Customer"
        ),
        "last_name": "",
        "line1": "Marilyn Clinics",
        "line2": "",
        "region": "",
        "postal_code": "",
        "city": "",
        "country_code": "SA",
    }
    item = {
        "reference_id": (
            reference
        ),
        "type": "service",
        "name": item_name,
        "sku": (
            f"appointment-{appointment.id}"
        ),
        "quantity": 1,
        "unit_price": {
            "amount": float(
                amount_major
            ),
            "currency": currency,
        },
        "total_amount": {
            "amount": float(
                amount_major
            ),
            "currency": currency,
        },
        "discount_amount": {
            "amount": 0.0,
            "currency": currency,
        },
        "tax_amount": {
            "amount": 0.0,
            "currency": currency,
        },
    }
    return PaymentRequest(
        amount=amount_minor,
        currency=currency,
        description=(
            "Marilyn clinic appointment "
            f"{reference}"
        ),
        callback_url=urls[
            "success"
        ],
        reference=reference,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        metadata={
            "reference": reference,
            "appointment_reference": (
                reference
            ),
            "order_number": reference,
            "description": (
                "Marilyn clinic appointment"
            ),
            "consumer": consumer,
            "shipping_address": (
                shipping_address
            ),
            "merchant_url": {
                "success": urls[
                    "success"
                ],
                "failure": urls[
                    "failure"
                ],
                "cancel": urls[
                    "cancel"
                ],
                "notification": (
                    request.build_absolute_uri(
                        "/api/public/payments/webhooks/"
                        f"tamara/{session.gateway_id}/"
                    )
                ),
            },
            "items": [
                item
            ],
            "appointment_id": (
                appointment.id
            ),
            "checkout_session_id": (
                session.id
            ),
        },
    )
def _payment_request_for_tabby(
    *,
    request: Request,
    appointment: MedicalAppointment,
    session: PaymentCheckoutSession,
    amount: Decimal,
    currency: str,
) -> PaymentRequest:
    patient = appointment.patient
    customer_name = _patient_name(
        appointment
    )
    customer_email = str(
        getattr(
            patient,
            "email",
            "",
        )
        or ""
    ).strip()
    customer_phone = str(
        getattr(
            patient,
            "mobile",
            "",
        )
        or ""
    ).strip()
    reference = _appointment_reference(
        appointment
    )
    urls = _public_callback_urls(
        request,
        provider="tabby",
        session=session,
    )
    item_name = (
        "Clinic appointment"
    )
    service_assignment = getattr(
        appointment,
        "practitioner_service_assignment",
        None,
    )
    if service_assignment is not None:
        offering = getattr(
            service_assignment,
            "service_offering",
            None,
        )
        if offering is not None:
            catalog_item = getattr(
                offering,
                "catalog_item",
                None,
            )
            candidate = str(
                getattr(
                    catalog_item,
                    "name",
                    "",
                )
                or getattr(
                    offering,
                    "name",
                    "",
                )
                or ""
            ).strip()
            if candidate:
                item_name = candidate[:255]
    amount_minor = _minor_units(
        amount
    )
    amount_major = format(
        amount,
        ".2f",
    )
    buyer = {
        "phone": customer_phone,
        "email": customer_email,
        "name": (
            customer_name
            or "Marilyn Customer"
        ),
    }
    order = {
        "reference_id": reference,
        "items": [
            {
                "title": item_name,
                "description": (
                    "Marilyn clinic appointment"
                ),
                "quantity": 1,
                "unit_price": (
                    amount_major
                ),
                "reference_id": (
                    f"appointment-{appointment.id}"
                ),
                "product_url": (
                    request.build_absolute_uri(
                        "/"
                    )
                ),
                "category": "Medical service",
            }
        ],
    }
    return PaymentRequest(
        amount=amount_minor,
        currency=currency,
        description=(
            "Marilyn clinic appointment "
            f"{reference}"
        ),
        callback_url=urls[
            "success"
        ],
        reference=reference,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        metadata={
            "reference": reference,
            "booking_reference": (
                reference
            ),
            "appointment_reference": (
                reference
            ),
            "buyer": buyer,
            "order": order,
            "merchant_urls": {
                "success": urls[
                    "success"
                ],
                "cancel": urls[
                    "cancel"
                ],
                "failure": urls[
                    "failure"
                ],
            },
            "appointment_id": (
                appointment.id
            ),
            "checkout_session_id": (
                session.id
            ),
        },
    )
def _moyasar_adapter(
    gateway: CompanyPaymentGateway,
) -> MoyasarAdapter:
    secret_key = str(
        _gateway_setting(
            gateway,
            "secret_key",
            "api_secret_key",
            "api_key",
        )
        or ""
    ).strip()
    if not secret_key:
        raise PaymentGatewayConfigurationError(
            "Moyasar secret key is not configured."
        )
    base_url = str(
        _gateway_setting(
            gateway,
            "base_url",
            "api_base_url",
            default=MoyasarClient.DEFAULT_BASE_URL,
        )
        or MoyasarClient.DEFAULT_BASE_URL
    ).strip()
    webhook_secret = str(
        _gateway_setting(
            gateway,
            "webhook_secret",
            "webhook_token",
        )
        or ""
    ).strip()
    client = MoyasarClient(
        secret_key=secret_key,
        base_url=base_url,
        timeout=_gateway_timeout(
            gateway
        ),
    )
    return MoyasarAdapter(
        client=client,
        webhook_secret=webhook_secret,
    )

def _tamara_adapter(
    gateway: CompanyPaymentGateway,
) -> TamaraAdapter:
    api_token = str(
        _gateway_setting(
            gateway,
            "api_token",
            "secret_key",
            "token",
        )
        or ""
    ).strip()
    if not api_token:
        raise PaymentGatewayConfigurationError(
            "Tamara API token is not configured."
        )
    environment = str(
        gateway.environment
        or ""
    ).strip().upper()
    default_url = (
        TamaraClient.PRODUCTION_BASE_URL
        if environment == "LIVE"
        else TamaraClient.SANDBOX_BASE_URL
    )
    base_url = str(
        _gateway_setting(
            gateway,
            "base_url",
            "api_base_url",
            default=default_url,
        )
        or default_url
    ).strip()
    notification_token = str(
        _gateway_setting(
            gateway,
            "notification_token",
            "webhook_token",
        )
        or ""
    ).strip()
    client = TamaraClient(
        api_token=api_token,
        base_url=base_url,
        timeout=_gateway_timeout(
            gateway
        ),
    )
    return TamaraAdapter(
        client=client,
        notification_token=(
            notification_token
        ),
    )
def _tabby_adapter(
    gateway: CompanyPaymentGateway,
) -> TabbyAdapter:
    secret_key = str(
        _gateway_setting(
            gateway,
            "secret_key",
            "api_secret_key",
            "api_key",
        )
        or ""
    ).strip()
    merchant_code = str(
        _gateway_setting(
            gateway,
            "merchant_code",
            default=(
                gateway.merchant_id
            ),
        )
        or gateway.merchant_id
        or ""
    ).strip()
    if not secret_key:
        raise PaymentGatewayConfigurationError(
            "Tabby secret key is not configured."
        )
    if not merchant_code:
        raise PaymentGatewayConfigurationError(
            "Tabby merchant code is not configured."
        )
    base_url = str(
        _gateway_setting(
            gateway,
            "base_url",
            "api_base_url",
            default=(
                TabbyClient.KSA_BASE_URL
            ),
        )
        or TabbyClient.KSA_BASE_URL
    ).strip()
    webhook_header_name = str(
        _gateway_setting(
            gateway,
            "webhook_header_name",
        )
        or ""
    ).strip()
    webhook_header_value = str(
        _gateway_setting(
            gateway,
            "webhook_header_value",
            "webhook_secret",
        )
        or ""
    ).strip()
    client = TabbyClient(
        secret_key=secret_key,
        merchant_code=merchant_code,
        base_url=base_url,
        timeout=_gateway_timeout(
            gateway
        ),
    )
    return TabbyAdapter(
        client=client,
        webhook_header_name=(
            webhook_header_name
        ),
        webhook_header_value=(
            webhook_header_value
        ),
    )
def _create_redirect_checkout(
    *,
    request: Request,
    provider: str,
    gateway: CompanyPaymentGateway,
    appointment: MedicalAppointment,
    session: PaymentCheckoutSession,
    amount: Decimal,
    currency: str,
):
    if provider == "tamara":
        adapter = _tamara_adapter(
            gateway
        )
        payment_request = (
            _payment_request_for_tamara(
                request=request,
                appointment=appointment,
                session=session,
                amount=amount,
                currency=currency,
            )
        )
    elif provider == "tabby":
        adapter = _tabby_adapter(
            gateway
        )
        payment_request = (
            _payment_request_for_tabby(
                request=request,
                appointment=appointment,
                session=session,
                amount=amount,
                currency=currency,
            )
        )
    else:
        raise PaymentGatewayConfigurationError(
            "Unsupported redirect payment provider."
        )
    return adapter.create_payment(
        payment_request
    )
def _minor_units(
    amount: Decimal,
) -> int:
    normalized = _money(
        amount
    )
    if normalized <= Decimal("0"):
        raise ValueError(
            "Payment amount must be "
            "greater than zero."
        )
    return int(
        (
            normalized
            * Decimal("100")
        ).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )
def _public_idempotency_key(
    *,
    appointment: MedicalAppointment,
    method: CompanyPaymentMethod,
    value: Any,
) -> str:
    raw = str(
        value or ""
    ).strip()
    if not raw:
        raw = (
            f"appointment-"
            f"{appointment.id}-"
            f"method-"
            f"{method.id}"
        )
    raw = raw[:120]
    key = (
        f"public-booking:"
        f"{appointment.id}:"
        f"{method.id}:"
        f"{raw}"
    )
    return key[:180]
def _serialize_checkout_session(
    session: PaymentCheckoutSession,
) -> dict[str, Any]:
    return {
        "id": session.id,
        "status": str(
            session.status or ""
        ),
        "amount": format(
            _money(
                session.amount
            ),
            ".2f",
        ),
        "currency_code": str(
            session.currency_code
            or "SAR"
        ).strip().upper(),
        "checkout_url": str(
            session.checkout_url
            or ""
        ).strip(),
        "external_checkout_id": str(
            session.external_checkout_id
            or ""
        ).strip(),
        "external_payment_id": str(
            session.external_payment_id
            or ""
        ).strip(),
    }
def _public_payment_method(
    *,
    appointment: MedicalAppointment,
    payment_method_id: Any,
) -> CompanyPaymentMethod | None:
    try:
        method_id = int(
            payment_method_id
        )
    except (
        TypeError,
        ValueError,
    ):
        return None
    if method_id <= 0:
        return None
    for method in (
        _public_payment_methods(
            appointment
        )
    ):
        if method.id == method_id:
            return method
    return None




def _tamara_result_status_value(
    result: Any,
) -> str:
    status = getattr(
        result,
        "status",
        "",
    )

    return str(
        getattr(
            status,
            "value",
            status,
        )
        or ""
    ).strip().lower()


def _validate_public_tamara_result(
    *,
    session: PaymentCheckoutSession,
    appointment: MedicalAppointment,
    result: Any,
    order_id: str,
) -> None:
    returned_order_id = str(
        getattr(
            result,
            "provider_payment_id",
            "",
        )
        or ""
    ).strip()

    if returned_order_id != order_id:
        raise ValueError(
            "Tamara order identity does not match checkout session."
        )

    expected_amount = _minor_units(
        _money(
            session.amount
        )
    )

    if getattr(
        result,
        "amount",
        None,
    ) != expected_amount:
        raise ValueError(
            "Tamara order amount does not match booking."
        )

    expected_currency = str(
        session.currency_code
        or "SAR"
    ).strip().upper()

    returned_currency = str(
        getattr(
            result,
            "currency",
            "",
        )
        or ""
    ).strip().upper()

    if returned_currency != expected_currency:
        raise ValueError(
            "Tamara order currency does not match booking."
        )

    expected_reference = _appointment_reference(
        appointment
    )

    returned_reference = str(
        getattr(
            result,
            "reference",
            "",
        )
        or ""
    ).strip()

    if (
        not returned_reference
        or returned_reference != expected_reference
    ):
        raise ValueError(
            "Tamara order reference does not match booking."
        )


def _reconcile_public_tamara_return(
    session_id: int,
) -> None:
    """
    Reconcile a successful Tamara browser return against Tamara's API.

    The redirect itself is never authoritative. The provider order ID
    comes only from the internal checkout session created by Marilyn.
    """

    session = (
        PaymentCheckoutSession.objects
        .filter(
            id=session_id,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
        )
        .select_related(
            "gateway",
            "payment_method",
            "company",
        )
        .first()
    )

    if session is None:
        return

    if (
        session.status
        == PaymentCheckoutSession.Status.PAID
    ):
        return

    method = session.payment_method

    if (
        method is None
        or _provider_for_method(
            method
        ) != "tamara"
    ):
        return

    gateway = session.gateway

    if (
        gateway is None
        or not gateway.is_active
    ):
        raise PaymentGatewayConfigurationError(
            "Tamara payment gateway is unavailable."
        )

    order_id = str(
        session.external_checkout_id
        or ""
    ).strip()

    if (
        not order_id
        or len(order_id) > 200
    ):
        raise ValueError(
            "Tamara order ID is missing from checkout session."
        )

    appointment = (
        MedicalAppointment.objects
        .filter(
            id=session.source_id,
            company=session.company,
            source="ONLINE",
            status__in=(
                "SCHEDULED",
                "CONFIRMED",
            ),
        )
        .first()
    )

    if appointment is None:
        raise ValueError(
            "Tamara checkout appointment was not found."
        )

    adapter = _tamara_adapter(
        gateway
    )

    result = adapter.retrieve_payment(
        order_id
    )

    _validate_public_tamara_result(
        session=session,
        appointment=appointment,
        result=result,
        order_id=order_id,
    )

    if result.status == PaymentStatus.PENDING:
        try:
            result = adapter.authorise_payment(
                order_id
            )
        except PaymentGatewayError:
            result = adapter.retrieve_payment(
                order_id
            )

        _validate_public_tamara_result(
            session=session,
            appointment=appointment,
            result=result,
            order_id=order_id,
        )

    if result.status not in {
        PaymentStatus.AUTHORIZED,
        PaymentStatus.PAID,
    }:
        return

    now = timezone.now()

    metadata = dict(
        session.metadata
        or {}
    )

    provider_status = (
        _tamara_result_status_value(
            result
        )
    )

    metadata.update(
        {
            "payment_provider": "tamara",
            "provider_payment_id": order_id,
            "provider_status": provider_status,
            "provider_reference": (
                str(
                    getattr(
                        result,
                        "reference",
                        "",
                    )
                    or ""
                ).strip()
            ),
            "verified_via": (
                "tamara_return_api"
            ),
            "verified_at": (
                now.isoformat()
            ),
            "capture_required": (
                result.status
                == PaymentStatus.AUTHORIZED
            ),
        }
    )

    session.external_payment_id = (
        order_id
    )
    session.status = (
        PaymentCheckoutSession
        .Status
        .PAID
    )
    session.paid_at = now
    session.failure_reason = ""
    session.metadata = metadata

    session.save(
        update_fields=[
            "external_payment_id",
            "status",
            "paid_at",
            "failure_reason",
            "metadata",
            "updated_at",
        ]
    )



def _tabby_result_status_value(
    result: Any,
) -> str:
    status = getattr(
        result,
        "status",
        "",
    )
    return str(
        getattr(
            status,
            "value",
            status,
        )
        or ""
    ).strip().lower()


def _validate_public_tabby_result(
    *,
    session: PaymentCheckoutSession,
    appointment: MedicalAppointment,
    result: Any,
    payment_id: str,
) -> None:
    returned_payment_id = str(
        getattr(
            result,
            "provider_payment_id",
            "",
        )
        or ""
    ).strip()

    if returned_payment_id != payment_id:
        raise ValueError(
            "Tabby payment identity does not match checkout session."
        )

    expected_amount = _minor_units(
        _money(
            session.amount
        )
    )

    if getattr(
        result,
        "amount",
        None,
    ) != expected_amount:
        raise ValueError(
            "Tabby payment amount does not match booking."
        )

    expected_currency = str(
        session.currency_code
        or "SAR"
    ).strip().upper()

    returned_currency = str(
        getattr(
            result,
            "currency",
            "",
        )
        or ""
    ).strip().upper()

    if returned_currency != expected_currency:
        raise ValueError(
            "Tabby payment currency does not match booking."
        )

    expected_reference = _appointment_reference(
        appointment
    )

    returned_reference = str(
        getattr(
            result,
            "reference",
            "",
        )
        or ""
    ).strip()

    if (
        not returned_reference
        or returned_reference != expected_reference
    ):
        raise ValueError(
            "Tabby payment reference does not match booking."
        )


def _reconcile_public_tabby_return(
    session_id: int,
) -> None:
    """
    Reconcile a successful Tabby browser return against Tabby's API.

    The browser redirect is never authoritative. AUTHORIZED payments
    are captured server-side, and Marilyn marks the checkout PAID only
    after Tabby reports the final PAID/CLOSED state.
    """

    session = (
        PaymentCheckoutSession.objects
        .filter(
            id=session_id,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
        )
        .select_related(
            "gateway",
            "payment_method",
            "company",
        )
        .first()
    )

    if session is None:
        return

    if (
        session.status
        == PaymentCheckoutSession.Status.PAID
    ):
        return

    method = session.payment_method

    if (
        method is None
        or _provider_for_method(
            method
        ) != "tabby"
    ):
        return

    gateway = session.gateway

    if (
        gateway is None
        or not gateway.is_active
    ):
        raise PaymentGatewayConfigurationError(
            "Tabby payment gateway is unavailable."
        )

    payment_id = str(
        session.external_checkout_id
        or session.external_payment_id
        or ""
    ).strip()

    if (
        not payment_id
        or len(payment_id) > 200
    ):
        raise ValueError(
            "Tabby payment ID is missing from checkout session."
        )

    appointment = (
        MedicalAppointment.objects
        .filter(
            id=session.source_id,
            company=session.company,
            source="ONLINE",
            status__in=(
                "SCHEDULED",
                "CONFIRMED",
            ),
        )
        .first()
    )

    if appointment is None:
        raise ValueError(
            "Tabby checkout appointment was not found."
        )

    adapter = _tabby_adapter(
        gateway
    )

    result = adapter.retrieve_payment(
        payment_id
    )

    _validate_public_tabby_result(
        session=session,
        appointment=appointment,
        result=result,
        payment_id=payment_id,
    )

    if result.status == PaymentStatus.AUTHORIZED:
        result = adapter.capture_payment(
            payment_id,
            amount=_minor_units(
                _money(
                    session.amount
                )
            ),
        )

        _validate_public_tabby_result(
            session=session,
            appointment=appointment,
            result=result,
            payment_id=payment_id,
        )

    if result.status != PaymentStatus.PAID:
        return

    now = timezone.now()

    metadata = dict(
        session.metadata
        or {}
    )

    metadata.update(
        {
            "payment_provider": "tabby",
            "provider_payment_id": payment_id,
            "provider_status": (
                _tabby_result_status_value(
                    result
                )
            ),
            "provider_reference": (
                str(
                    getattr(
                        result,
                        "reference",
                        "",
                    )
                    or ""
                ).strip()
            ),
            "verified_via": (
                "tabby_return_api"
            ),
            "verified_at": (
                now.isoformat()
            ),
            "capture_required": False,
            "captured": True,
        }
    )

    session.external_payment_id = (
        payment_id
    )
    session.status = (
        PaymentCheckoutSession
        .Status
        .PAID
    )
    session.paid_at = now
    session.failure_reason = ""
    session.metadata = metadata

    session.save(
        update_fields=[
            "external_payment_id",
            "status",
            "paid_at",
            "failure_reason",
            "metadata",
            "updated_at",
        ]
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_payment_return(
    request: Request,
    provider: str,
    result: str,
):
    """
    Return the customer from a payment provider to the public
    booking frontend.

    This endpoint does NOT mark a payment as paid.

    Security:
    - provider and result are allow-listed;
    - session must be a positive integer;
    - arbitrary provider query parameters are not forwarded;
    - Moyasar payment ID is forwarded only so the frontend can
      request server-side verification;
    - no payment token, patient data, gateway secret, amount,
      or currency is placed in the redirect.
    """

    provider_value = str(
        provider or ""
    ).strip().lower()

    result_value = str(
        result or ""
    ).strip().lower()

    if provider_value not in {
        "moyasar",
        "tamara",
        "tabby",
    }:
        return Response(
            {
                "success": False,
                "message": (
                    "Payment provider "
                    "is not supported."
                ),
            },
            status=404,
        )

    if result_value not in {
        "success",
        "failure",
        "cancel",
    }:
        return Response(
            {
                "success": False,
                "message": (
                    "Payment return result "
                    "is not supported."
                ),
            },
            status=404,
        )

    try:
        session_id = int(
            request.query_params.get(
                "session",
                "",
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        session_id = 0

    if session_id <= 0:
        return Response(
            {
                "success": False,
                "message": (
                    "Payment checkout session "
                    "is invalid."
                ),
            },
            status=400,
        )

    if (
        provider_value == "tamara"
        and result_value == "success"
    ):
        try:
            _reconcile_public_tamara_return(
                session_id
            )
        except (
            PaymentGatewayConfigurationError,
            PaymentGatewayError,
            ValueError,
        ) as error:
            logger.warning(
                "Tamara public return reconciliation failed "
                "for checkout session %s: %s",
                session_id,
                str(error)[:300],
            )
        except Exception:
            logger.exception(
                "Unexpected Tamara public return reconciliation "
                "failure for checkout session %s.",
                session_id,
            )

    if (
        provider_value == "tabby"
        and result_value == "success"
    ):
        try:
            _reconcile_public_tabby_return(
                session_id
            )
        except (
            PaymentGatewayConfigurationError,
            PaymentGatewayError,
            ValueError,
        ) as error:
            logger.warning(
                "Tabby public return reconciliation failed "
                "for checkout session %s: %s",
                session_id,
                str(error)[:300],
            )
        except Exception:
            logger.exception(
                "Unexpected Tabby public return reconciliation "
                "failure for checkout session %s.",
                session_id,
            )

    frontend_url = str(
        getattr(
            settings,
            "PUBLIC_BOOKING_PAYMENT_RETURN_URL",
            "",
        )
        or ""
    ).strip()

    if not frontend_url:
        return Response(
            {
                "success": False,
                "message": (
                    "Payment return URL "
                    "is not configured."
                ),
            },
            status=503,
        )

    parsed = urlsplit(
        frontend_url
    )

    if (
        parsed.scheme not in {
            "http",
            "https",
        }
        or not parsed.netloc
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Payment return URL "
                    "is invalid."
                ),
            },
            status=503,
        )

    query = dict(
        parse_qsl(
            parsed.query,
            keep_blank_values=True,
        )
    )

    query.update(
        {
            "payment_return": "1",
            "provider": provider_value,
            "result": result_value,
            "session": str(
                session_id
            ),
        }
    )

    if provider_value == "moyasar":
        payment_id = str(
            request.query_params.get(
                "id",
                "",
            )
            or ""
        ).strip()

        if (
            payment_id
            and len(payment_id) <= 200
        ):
            query[
                "payment_id"
            ] = payment_id

    redirect_url = urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path or "/book",
            urlencode(
                query
            ),
            "",
        )
    )

    response = HttpResponseRedirect(
        redirect_url
    )

    response[
        "Cache-Control"
    ] = (
        "no-store, no-cache, "
        "must-revalidate, max-age=0"
    )

    response[
        "Pragma"
    ] = "no-cache"

    response[
        "Referrer-Policy"
    ] = "no-referrer"

    return response


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
    currency = _currency_code(
        appointment
    )
    if amount <= Decimal("0"):
        return Response(
            {
                "success": True,
                "payment_required": False,
                "payment_available": False,
                "amount": format(
                    amount,
                    ".2f",
                ),
                "currency_code": currency,
                "methods": [],
            },
            status=200,
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
            "amount": format(
                amount,
                ".2f",
            ),
            "currency_code": currency,
            "methods": [
                _serialize_public_payment_method(
                    method
                )
                for method in methods
            ],
        },
        status=200,
    )
@api_view(["POST"])
@permission_classes([AllowAny])
def public_booking_payment_checkout(
    request: Request,
) -> Response:
    """
    Create or reuse an internal checkout session for a
    confirmed public appointment.
    The client cannot choose:
    - company
    - appointment
    - amount
    - currency
    - gateway
    Those values are resolved server-side.
    """
    if not hasattr(
        request.data,
        "get",
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Payment request "
                    "is invalid."
                ),
            },
            status=400,
        )
    appointment = (
        _load_public_payment_appointment(
            request.data.get(
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
    if amount <= Decimal("0"):
        return Response(
            {
                "success": False,
                "message": (
                    "This appointment does not "
                    "require payment."
                ),
            },
            status=409,
        )
    method = _public_payment_method(
        appointment=appointment,
        payment_method_id=(
            request.data.get(
                "payment_method_id"
            )
        ),
    )
    if method is None:
        return Response(
            {
                "success": False,
                "message": (
                    "The selected payment method "
                    "is not available."
                ),
            },
            status=404,
        )
    provider = _provider_for_method(
        method
    )
    if not provider:
        return Response(
            {
                "success": False,
                "message": (
                    "The selected payment method "
                    "is not available."
                ),
            },
            status=404,
        )
    if provider == "cash_at_clinic":
        return Response(
            {
                "success": True,
                "provider": (
                    "cash_at_clinic"
                ),
                "payment_mode": (
                    "cash_at_clinic"
                ),
                "requires_redirect": False,
                "checkout_session": None,
            },
            status=200,
        )
    gateway = method.gateway
    if (
        gateway is None
        or not gateway.is_active
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "The payment gateway "
                    "is unavailable."
                ),
            },
            status=409,
        )
    patient = appointment.patient
    customer_email = str(
        getattr(
            patient,
            "email",
            "",
        )
        or ""
    ).strip()
    customer_phone = str(
        getattr(
            patient,
            "mobile",
            "",
        )
        or ""
    ).strip()
    currency = _currency_code(
        appointment
    )
    idempotency_key = (
        _public_idempotency_key(
            appointment=appointment,
            method=method,
            value=request.data.get(
                "idempotency_key"
            ),
        )
    )
    existing = (
        PaymentCheckoutSession.objects
        .filter(
            company=appointment.company,
            idempotency_key=(
                idempotency_key
            ),
        )
        .select_related(
            "gateway",
            "payment_method",
        )
        .first()
    )
    if existing is not None:
        if (
            existing.source_id
            != appointment.id
            or existing.payment_method_id
            != method.id
            or _money(
                existing.amount
            )
            != amount
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "The payment request "
                        "conflicts with an "
                        "existing session."
                    ),
                },
                status=409,
            )
        session = existing
    else:
        try:
            session = (
                create_checkout_session(
                    appointment.company,
                    {
                        "payment_method": (
                            method
                        ),
                        "gateway": (
                            gateway
                        ),
                        "source_type": (
                            PaymentCheckoutSession
                            .SourceType
                            .OTHER
                        ),
                        "source_id": (
                            appointment.id
                        ),
                        "amount": amount,
                        "currency_code": (
                            currency
                        ),
                        "description": (
                            "Marilyn clinic "
                            "appointment "
                            f"{appointment.appointment_number}"
                        ),
                        "customer_email": (
                            customer_email
                        ),
                        "customer_phone": (
                            customer_phone
                        ),
                        "idempotency_key": (
                            idempotency_key
                        ),
                        "metadata": {
                            "source": (
                                "public_booking"
                            ),
                            "appointment_id": (
                                appointment.id
                            ),
                            "appointment_number": (
                                str(
                                    appointment
                                    .appointment_number
                                    or ""
                                )
                            ),
                            "payment_provider": (
                                provider
                            ),
                        },
                    },
                )
            )
        except Exception:
            return Response(
                {
                    "success": False,
                    "message": (
                        "The payment session "
                        "could not be created."
                    ),
                },
                status=409,
            )
    response: dict[str, Any] = {
        "success": True,
        "provider": provider,
        "requires_redirect": (
            _requires_redirect(
                provider
            )
        ),
        "checkout_session": (
            _serialize_checkout_session(
                session
            )
        ),
    }
    if provider == "moyasar":
        publishable_key = str(
            gateway.public_key
            or ""
        ).strip()
        if not publishable_key:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Moyasar public key "
                        "is not configured."
                    ),
                    "checkout_session": (
                        _serialize_checkout_session(
                            session
                        )
                    ),
                },
                status=409,
            )
        response.update(
            {
                "payment_mode": (
                    "client_side"
                ),
                "publishable_key": (
                    publishable_key
                ),
                "amount_minor": (
                    _minor_units(
                        amount
                    )
                ),
                "currency_code": (
                    currency
                ),
                "callback_reference": (
                    str(
                        session.id
                    )
                ),
                "callback_url": (
                    _public_callback_urls(
                        request,
                        provider="moyasar",
                        session=session,
                    )["success"]
                ),
            }
        )
        return Response(
            response,
            status=201,
        )
    if provider in {
        "tamara",
        "tabby",
    }:
        if (
            session.status
            == PaymentCheckoutSession.Status.PROCESSING
            and str(
                session.checkout_url
                or ""
            ).strip()
        ):
            response.update(
                {
                    "payment_mode": (
                        "server_redirect"
                    ),
                    "checkout_ready": True,
                    "checkout_url": (
                        str(
                            session.checkout_url
                            or ""
                        ).strip()
                    ),
                }
            )
            return Response(
                response,
                status=200,
            )
        try:
            result = (
                _create_redirect_checkout(
                    request=request,
                    provider=provider,
                    gateway=gateway,
                    appointment=(
                        appointment
                    ),
                    session=session,
                    amount=amount,
                    currency=currency,
                )
            )
        except (
            PaymentGatewayConfigurationError,
            PaymentGatewayError,
            ValueError,
        ) as error:
            return Response(
                {
                    "success": False,
                    "provider": provider,
                    "message": (
                        "The payment provider "
                        "could not start checkout."
                    ),
                    "detail": str(
                        error
                    )[:300],
                    "checkout_session": (
                        _serialize_checkout_session(
                            session
                        )
                    ),
                },
                status=409,
            )
        except Exception:
            return Response(
                {
                    "success": False,
                    "provider": provider,
                    "message": (
                        "The payment provider "
                        "could not start checkout."
                    ),
                    "checkout_session": (
                        _serialize_checkout_session(
                            session
                        )
                    ),
                },
                status=502,
            )
        checkout_url = str(
            result.checkout_url
            or ""
        ).strip()
        provider_payment_id = str(
            result.provider_payment_id
            or ""
        ).strip()
        if not checkout_url:
            return Response(
                {
                    "success": False,
                    "provider": provider,
                    "message": (
                        "The payment provider "
                        "did not return a checkout URL."
                    ),
                    "checkout_session": (
                        _serialize_checkout_session(
                            session
                        )
                    ),
                },
                status=502,
            )
        session.status = (
            PaymentCheckoutSession
            .Status
            .PROCESSING
        )
        session.checkout_url = (
            checkout_url
        )
        if provider_payment_id:
            session.external_checkout_id = (
                provider_payment_id
            )
        metadata = (
            dict(
                session.metadata
                or {}
            )
        )
        metadata.update(
            {
                "provider_reference": (
                    str(
                        result.reference
                        or ""
                    ).strip()
                ),
                "provider_status": (
                    str(
                        result.status
                        or ""
                    )
                ),
            }
        )
        session.metadata = metadata
        session.save(
            update_fields=[
                "status",
                "checkout_url",
                "external_checkout_id",
                "metadata",
                "updated_at",
            ]
        )
        response.update(
            {
                "payment_mode": (
                    "server_redirect"
                ),
                "checkout_ready": True,
                "checkout_url": (
                    checkout_url
                ),
                "provider_payment_id": (
                    provider_payment_id
                ),
                "provider_status": (
                    str(
                        result.status
                        or ""
                    )
                ),
                "checkout_session": (
                    _serialize_checkout_session(
                        session
                    )
                ),
            }
        )
        return Response(
            response,
            status=201,
        )
    return Response(
        {
            "success": False,
            "message": (
                "The selected payment provider "
                "is not supported."
            ),
        },
        status=409,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_booking_payment_status(
    request: Request,
) -> Response:
    """
    Read the internal checkout status for the appointment represented
    by the signed public payment token.

    This endpoint never mutates payment state.
    """

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

    try:
        session_id = int(
            request.query_params.get(
                "session",
                "",
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        session_id = 0

    if session_id <= 0:
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session is invalid."
                ),
            },
            status=400,
        )

    session = (
        PaymentCheckoutSession.objects
        .filter(
            id=session_id,
            company=appointment.company,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
            source_id=appointment.id,
        )
        .select_related(
            "gateway",
            "payment_method",
        )
        .first()
    )

    if session is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session was not found."
                ),
            },
            status=404,
        )

    provider = ""

    if session.payment_method is not None:
        provider = _provider_for_method(
            session.payment_method
        )

    status_value = str(
        session.status or ""
    ).strip()

    return Response(
        {
            "success": True,
            "provider": provider,
            "payment_status": status_value,
            "paid": (
                session.status
                == PaymentCheckoutSession.Status.PAID
            ),
            "checkout_session": (
                _serialize_checkout_session(
                    session
                )
            ),
        },
        status=200,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def public_booking_payment_verify(
    request: Request,
) -> Response:
    """
    Verify a Moyasar public booking payment directly against
    Moyasar before marking the internal checkout session paid.
    Security:
    - appointment is resolved only through the signed public token;
    - session must belong to that appointment and company;
    - gateway is resolved server-side;
    - amount and currency must match the internal session;
    - the browser cannot mark a payment as paid by itself.
    """
    if not hasattr(
        request.data,
        "get",
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Payment verification "
                    "request is invalid."
                ),
            },
            status=400,
        )
    appointment = (
        _load_public_payment_appointment(
            request.data.get(
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
    try:
        session_id = int(
            request.data.get(
                "checkout_session_id"
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session is invalid."
                ),
            },
            status=400,
        )
    if session_id <= 0:
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session is invalid."
                ),
            },
            status=400,
        )
    provider_payment_id = str(
        request.data.get(
            "payment_id",
            "",
        )
        or ""
    ).strip()
    if (
        not provider_payment_id
        or len(provider_payment_id) > 200
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Moyasar payment ID is invalid."
                ),
            },
            status=400,
        )
    session = (
        PaymentCheckoutSession.objects
        .filter(
            id=session_id,
            company=appointment.company,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
            source_id=appointment.id,
        )
        .select_related(
            "gateway",
            "payment_method",
        )
        .first()
    )
    if session is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session was not found."
                ),
            },
            status=404,
        )
    gateway = session.gateway
    if (
        gateway is None
        or not gateway.is_active
        or str(
            gateway.gateway_type
            or ""
        ).strip().upper()
        != CompanyPaymentGateway.GatewayType.MOYASAR
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Moyasar payment gateway "
                    "is unavailable."
                ),
            },
            status=409,
        )
    if (
        session.status
        == PaymentCheckoutSession.Status.PAID
    ):
        stored_payment_id = str(
            session.external_payment_id
            or ""
        ).strip()
        if (
            stored_payment_id
            and stored_payment_id
            != provider_payment_id
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Checkout session is already "
                        "linked to another payment."
                    ),
                },
                status=409,
            )
        return Response(
            {
                "success": True,
                "provider": "moyasar",
                "verified": True,
                "already_verified": True,
                "payment_status": "paid",
                "payment_id": (
                    stored_payment_id
                    or provider_payment_id
                ),
                "checkout_session": (
                    _serialize_checkout_session(
                        session
                    )
                ),
            },
            status=200,
        )
    existing_payment_id = str(
        session.external_payment_id
        or ""
    ).strip()
    if (
        existing_payment_id
        and existing_payment_id
        != provider_payment_id
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Checkout session is already "
                    "linked to another payment."
                ),
            },
            status=409,
        )
    try:
        adapter = _moyasar_adapter(
            gateway
        )
        result = adapter.verify_payment(
            provider_payment_id
        )
    except (
        PaymentGatewayConfigurationError,
        PaymentGatewayError,
        ValueError,
    ) as error:
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "message": (
                    "Moyasar payment could "
                    "not be verified."
                ),
                "detail": str(
                    error
                )[:300],
                "checkout_session": (
                    _serialize_checkout_session(
                        session
                    )
                ),
            },
            status=409,
        )
    except Exception:
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "message": (
                    "Moyasar payment could "
                    "not be verified."
                ),
                "checkout_session": (
                    _serialize_checkout_session(
                        session
                    )
                ),
            },
            status=502,
        )
    expected_amount = _minor_units(
        _money(
            session.amount
        )
    )
    expected_currency = str(
        session.currency_code
        or "SAR"
    ).strip().upper()
    if result.amount != expected_amount:
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "message": (
                    "Moyasar payment amount "
                    "does not match the booking."
                ),
            },
            status=409,
        )
    if (
        str(
            result.currency
            or ""
        ).strip().upper()
        != expected_currency
    ):
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "message": (
                    "Moyasar payment currency "
                    "does not match the booking."
                ),
            },
            status=409,
        )
    returned_payment_id = str(
        result.provider_payment_id
        or ""
    ).strip()
    if returned_payment_id != provider_payment_id:
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "message": (
                    "Moyasar payment identity "
                    "does not match."
                ),
            },
            status=409,
        )
    provider_status = result.status
    if provider_status != PaymentStatus.PAID:
        return Response(
            {
                "success": False,
                "provider": "moyasar",
                "verified": False,
                "payment_status": str(
                    getattr(
                        provider_status,
                        "value",
                        provider_status,
                    )
                    or ""
                ),
                "payment_id": (
                    returned_payment_id
                ),
                "provider_status": str(
                    getattr(
                        provider_status,
                        "value",
                        provider_status,
                    )
                    or ""
                ),
                "message": (
                    "Moyasar payment has not "
                    "reached the paid status."
                ),
                "checkout_session": (
                    _serialize_checkout_session(
                        session
                    )
                ),
            },
            status=409,
        )
    now = timezone.now()
    metadata = dict(
        session.metadata
        or {}
    )
    metadata.update(
        {
            "payment_provider": "moyasar",
            "provider_payment_id": (
                returned_payment_id
            ),
            "provider_status": str(
                getattr(
                    result.status,
                    "value",
                    result.status,
                )
                or ""
            ),
            "verified_via": (
                "public_booking_verify"
            ),
            "verified_at": (
                now.isoformat()
            ),
        }
    )
    session.external_payment_id = (
        returned_payment_id
    )
    session.status = (
        PaymentCheckoutSession
        .Status
        .PAID
    )
    session.paid_at = now
    session.failure_reason = ""
    session.metadata = metadata
    session.save(
        update_fields=[
            "external_payment_id",
            "status",
            "paid_at",
            "failure_reason",
            "metadata",
            "updated_at",
        ]
    )
    return Response(
        {
            "success": True,
            "provider": "moyasar",
            "verified": True,
            "already_verified": False,
            "payment_status": "paid",
            "payment_id": (
                returned_payment_id
            ),
            "provider_status": str(
                getattr(
                    result.status,
                    "value",
                    result.status,
                )
                or ""
            ),
            "checkout_session": (
                _serialize_checkout_session(
                    session
                )
            ),
        },
        status=200,
    )
