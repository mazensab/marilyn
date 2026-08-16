from __future__ import annotations

import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from integrations.payments.types import PaymentStatus
from payments.models import (
    CompanyPaymentGateway,
    PaymentCheckoutSession,
    PaymentWebhookEvent,
)


MONEY_QUANT = Decimal("0.01")


def _money(value: Any) -> Decimal:
    try:
        return Decimal(str(value)).quantize(
            MONEY_QUANT,
            rounding=ROUND_HALF_UP,
        )
    except Exception as exc:
        raise ValidationError(
            {
                "amount": (
                    "Invalid provider payment amount."
                )
            }
        ) from exc


def _currency(value: Any) -> str:
    return str(value or "").strip().upper()


def _event_key(
    *,
    provider: str,
    event_type: str,
    provider_payment_id: str,
    payload: dict[str, Any],
) -> str:
    """
    Produce a deterministic fallback idempotency key.

    This is used only when the provider does not supply a dedicated
    webhook event ID.
    """

    canonical = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )

    raw = "|".join(
        [
            str(provider or "").strip().lower(),
            str(event_type or "").strip().lower(),
            str(provider_payment_id or "").strip(),
            canonical,
        ]
    )

    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


def _find_checkout_session(
    *,
    gateway: CompanyPaymentGateway,
    provider_payment_id: str,
    reference: str = "",
) -> PaymentCheckoutSession:
    """
    Resolve the Marilyn checkout without trusting company identifiers
    supplied by the webhook payload.

    Resolution is always scoped by the already-selected gateway.
    """

    payment_id = str(
        provider_payment_id or ""
    ).strip()

    reference = str(
        reference or ""
    ).strip()

    if payment_id:
        session = (
            PaymentCheckoutSession.objects
            .select_for_update()
            .filter(
                gateway=gateway,
                external_payment_id=payment_id,
            )
            .order_by("-id")
            .first()
        )

        if session is not None:
            return session

        session = (
            PaymentCheckoutSession.objects
            .select_for_update()
            .filter(
                gateway=gateway,
                external_checkout_id=payment_id,
            )
            .order_by("-id")
            .first()
        )

        if session is not None:
            return session

    if reference:
        try:
            session_id = int(reference)
        except (TypeError, ValueError):
            session_id = 0

        if session_id > 0:
            session = (
                PaymentCheckoutSession.objects
                .select_for_update()
                .filter(
                    pk=session_id,
                    gateway=gateway,
                )
                .first()
            )

            if session is not None:
                return session

        session = (
            PaymentCheckoutSession.objects
            .select_for_update()
            .filter(
                gateway=gateway,
                external_checkout_id=reference,
            )
            .order_by("-id")
            .first()
        )

        if session is not None:
            return session

    raise ValidationError(
        {
            "checkout_session": (
                "Matching checkout session was not found."
            )
        }
    )


def _validate_payment_identity(
    *,
    session: PaymentCheckoutSession,
    provider_payment_id: str,
) -> None:
    payment_id = str(
        provider_payment_id or ""
    ).strip()

    if not payment_id:
        raise ValidationError(
            {
                "external_payment_id": (
                    "Provider payment ID is required."
                )
            }
        )

    current_payment_id = str(
        session.external_payment_id or ""
    ).strip()

    if (
        current_payment_id
        and current_payment_id != payment_id
    ):
        raise ValidationError(
            {
                "external_payment_id": (
                    "Provider payment ID does not match "
                    "the checkout session."
                )
            }
        )


def _validate_amount_currency(
    *,
    session: PaymentCheckoutSession,
    amount_minor: int | None = None,
    amount_major: Any = None,
    currency: str = "",
) -> None:
    if amount_minor is not None:
        provider_amount = (
            Decimal(int(amount_minor))
            / Decimal("100")
        ).quantize(MONEY_QUANT)

        if provider_amount != session.amount:
            raise ValidationError(
                {
                    "amount": (
                        "Provider payment amount does not match "
                        "the checkout session."
                    )
                }
            )

    elif amount_major is not None:
        provider_amount = _money(amount_major)

        if provider_amount != session.amount:
            raise ValidationError(
                {
                    "amount": (
                        "Provider payment amount does not match "
                        "the checkout session."
                    )
                }
            )

    normalized_currency = _currency(currency)

    if (
        normalized_currency
        and normalized_currency
        != _currency(session.currency_code)
    ):
        raise ValidationError(
            {
                "currency_code": (
                    "Provider payment currency does not match "
                    "the checkout session."
                )
            }
        )


def _record_event(
    *,
    gateway: CompanyPaymentGateway,
    session: PaymentCheckoutSession,
    event_type: str,
    external_event_id: str,
    external_payment_id: str,
    idempotency_key: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    signature: str = "",
) -> tuple[PaymentWebhookEvent, bool]:
    """
    Record the webhook exactly once.

    Returns:
        (event, created)
    """

    event_id = str(
        external_event_id or ""
    ).strip()

    idem = str(
        idempotency_key or ""
    ).strip()

    lookup = PaymentWebhookEvent.objects.filter(
        company=gateway.company,
        gateway=gateway,
    )

    if event_id:
        existing = (
            lookup
            .filter(external_event_id=event_id)
            .first()
        )

        if existing is not None:
            return existing, False

    if idem:
        existing = (
            lookup
            .filter(idempotency_key=idem)
            .first()
        )

        if existing is not None:
            return existing, False

    event = PaymentWebhookEvent(
        company=gateway.company,
        gateway=gateway,
        checkout_session=session,
        event_type=str(
            event_type or "payment.event"
        )[:120],
        external_event_id=event_id,
        external_payment_id=str(
            external_payment_id or ""
        ).strip(),
        idempotency_key=idem,
        status=PaymentWebhookEvent.Status.RECEIVED,
        payload=payload,
        headers=headers,
        signature=str(
            signature or ""
        )[:500],
    )

    event.save()

    return event, True


def _mark_event(
    event: PaymentWebhookEvent,
    *,
    status: str,
    error_message: str = "",
) -> PaymentWebhookEvent:
    event.status = status
    event.error_message = str(
        error_message or ""
    )
    event.processed_at = timezone.now()

    event.save(
        update_fields=[
            "status",
            "error_message",
            "processed_at",
        ]
    )

    return event


def _apply_authoritative_status(
    *,
    session: PaymentCheckoutSession,
    status: PaymentStatus,
    provider_payment_id: str,
) -> None:
    """
    Apply only conservative, final state transitions.

    AUTHORIZED is intentionally NOT treated as PAID.
    """

    payment_id = str(
        provider_payment_id or ""
    ).strip()

    _validate_payment_identity(
        session=session,
        provider_payment_id=payment_id,
    )

    if status == PaymentStatus.PAID:
        if (
            session.status
            == PaymentCheckoutSession.Status.PAID
        ):
            if (
                session.external_payment_id
                and session.external_payment_id
                != payment_id
            ):
                raise ValidationError(
                    {
                        "external_payment_id": (
                            "Paid checkout session belongs "
                            "to another provider payment."
                        )
                    }
                )

            return

        if session.status in {
            PaymentCheckoutSession.Status.CANCELLED,
            PaymentCheckoutSession.Status.EXPIRED,
        }:
            raise ValidationError(
                {
                    "status": (
                        "Cancelled or expired checkout "
                        "sessions cannot be paid."
                    )
                }
            )

        session.status = (
            PaymentCheckoutSession.Status.PAID
        )
        session.external_payment_id = payment_id
        session.paid_at = timezone.now()
        session.failure_reason = ""

        session.save(
            update_fields=[
                "status",
                "external_payment_id",
                "paid_at",
                "failure_reason",
                "updated_at",
            ]
        )
        return

    if status == PaymentStatus.FAILED:
        if (
            session.status
            == PaymentCheckoutSession.Status.PAID
        ):
            raise ValidationError(
                {
                    "status": (
                        "A paid checkout session cannot "
                        "be changed to failed."
                    )
                }
            )

        session.status = (
            PaymentCheckoutSession.Status.FAILED
        )
        session.failure_reason = (
            "Authoritative provider state "
            "reported payment failure."
        )

        if payment_id:
            session.external_payment_id = payment_id

        session.save(
            update_fields=[
                "status",
                "external_payment_id",
                "failure_reason",
                "updated_at",
            ]
        )
        return

    if status == PaymentStatus.CANCELLED:
        if (
            session.status
            == PaymentCheckoutSession.Status.PAID
        ):
            raise ValidationError(
                {
                    "status": (
                        "A paid checkout session cannot "
                        "be cancelled by webhook."
                    )
                }
            )

        session.status = (
            PaymentCheckoutSession.Status.CANCELLED
        )

        if payment_id:
            session.external_payment_id = payment_id

        session.save(
            update_fields=[
                "status",
                "external_payment_id",
                "updated_at",
            ]
        )
        return

    if status in {
        PaymentStatus.INITIATED,
        PaymentStatus.PENDING,
        PaymentStatus.AUTHORIZED,
    }:
        if session.status in {
            PaymentCheckoutSession.Status.PENDING,
            PaymentCheckoutSession.Status.PROCESSING,
        }:
            session.status = (
                PaymentCheckoutSession.Status.PROCESSING
            )

            if payment_id:
                session.external_payment_id = payment_id

            session.save(
                update_fields=[
                    "status",
                    "external_payment_id",
                    "updated_at",
                ]
            )

        return

    # REFUNDED / VOIDED / UNKNOWN are deliberately not mapped to
    # PAID/FAILED here. Refund accounting and post-payment reversals
    # belong to their own domain workflow.


@transaction.atomic
def process_verified_provider_webhook(
    *,
    gateway: CompanyPaymentGateway,
    event_type: str,
    provider_payment_id: str,
    status: PaymentStatus,
    payload: dict[str, Any],
    headers: dict[str, str],
    external_event_id: str = "",
    idempotency_key: str = "",
    reference: str = "",
    amount_minor: int | None = None,
    amount_major: Any = None,
    currency: str = "",
    signature: str = "",
) -> tuple[
    PaymentWebhookEvent,
    PaymentCheckoutSession,
    bool,
]:
    """
    Persist and apply an already authenticated + provider-verified
    webhook.

    Authentication and authoritative provider retrieval MUST happen
    before calling this function.
    """

    if not gateway.is_active:
        raise ValidationError(
            {
                "gateway": (
                    "Payment gateway is inactive."
                )
            }
        )

    if not gateway.supports_webhooks:
        raise ValidationError(
            {
                "gateway": (
                    "Payment gateway does not support webhooks."
                )
            }
        )

    payment_id = str(
        provider_payment_id or ""
    ).strip()

    session = _find_checkout_session(
        gateway=gateway,
        provider_payment_id=payment_id,
        reference=reference,
    )

    if session.company_id != gateway.company_id:
        raise ValidationError(
            {
                "company": (
                    "Checkout session does not belong "
                    "to the gateway company."
                )
            }
        )

    _validate_payment_identity(
        session=session,
        provider_payment_id=payment_id,
    )

    _validate_amount_currency(
        session=session,
        amount_minor=amount_minor,
        amount_major=amount_major,
        currency=currency,
    )

    idem = str(
        idempotency_key or ""
    ).strip()

    if not idem:
        idem = _event_key(
            provider=str(gateway.code),
            event_type=event_type,
            provider_payment_id=payment_id,
            payload=payload,
        )

    event, created = _record_event(
        gateway=gateway,
        session=session,
        event_type=event_type,
        external_event_id=external_event_id,
        external_payment_id=payment_id,
        idempotency_key=idem,
        payload=payload,
        headers=headers,
        signature=signature,
    )

    if not created:
        return event, session, False

    try:
        _apply_authoritative_status(
            session=session,
            status=status,
            provider_payment_id=payment_id,
        )

        if status in {
            PaymentStatus.REFUNDED,
            PaymentStatus.VOIDED,
            PaymentStatus.UNKNOWN,
        }:
            _mark_event(
                event,
                status=PaymentWebhookEvent.Status.IGNORED,
                error_message=(
                    "Webhook was verified but requires "
                    "a dedicated post-payment workflow."
                ),
            )
        else:
            _mark_event(
                event,
                status=PaymentWebhookEvent.Status.PROCESSED,
            )

        return event, session, True

    except Exception as exc:
        _mark_event(
            event,
            status=PaymentWebhookEvent.Status.FAILED,
            error_message=str(exc),
        )
        raise
