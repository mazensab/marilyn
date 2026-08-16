from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.urls import reverse

from rest_framework.test import APIClient

from api.public.test_booking_payment import (
    PublicBookingPaymentTests,
)
from integrations.payments import (
    PaymentGatewayName,
    PaymentGatewayVerificationError,
    PaymentResult,
    PaymentStatus,
    WebhookEvent,
)
from payments.models import (
    CompanyPaymentGateway,
    PaymentCheckoutSession,
    PaymentWebhookEvent,
)


class PaymentWebhookReceiverTests(TestCase):
    """
    HTTP security contract for public payment webhooks.

    These tests intentionally mock the provider adapter boundary.
    Provider-specific cryptographic verification is tested separately
    inside integrations/tests/payments.
    """

    scheduled_start = PublicBookingPaymentTests.scheduled_start
    appointment = PublicBookingPaymentTests.appointment
    gateway = PublicBookingPaymentTests.gateway
    payment_method = PublicBookingPaymentTests.payment_method
    moyasar_checkout = PublicBookingPaymentTests.moyasar_checkout

    def setUp(self) -> None:
        PublicBookingPaymentTests.setUp(self)

        self.appointment_obj = self.appointment()

        self.session = self.moyasar_checkout(
            self.appointment_obj,
            external_payment_id="pay_webhook_001",
        )

        self.gateway_obj = self.session.gateway

        self.url = reverse(
            "public:payment-webhook-moyasar",
            kwargs={
                "gateway_id": self.gateway_obj.id,
            },
        )

    def payload(self) -> dict:
        return {
            "id": "evt_webhook_001",
            "type": "payment_paid",
            "payment_id": "pay_webhook_001",
        }

    def event(
        self,
        *,
        payment_id: str = "pay_webhook_001",
        status: PaymentStatus = PaymentStatus.PAID,
    ) -> WebhookEvent:
        return WebhookEvent(
            gateway=PaymentGatewayName.MOYASAR,
            event_type="payment_paid",
            provider_payment_id=payment_id,
            status=status,
            payload=self.payload(),
        )

    def result(
        self,
        *,
        payment_id: str = "pay_webhook_001",
        status: PaymentStatus = PaymentStatus.PAID,
        amount: int = 12500,
        currency: str = "SAR",
    ) -> PaymentResult:
        return PaymentResult(
            gateway=PaymentGatewayName.MOYASAR,
            provider_payment_id=payment_id,
            status=status,
            amount=amount,
            currency=currency,
            reference="",
        )

    def post_raw(
        self,
        body: bytes,
        *,
        url: str | None = None,
        content_type: str = "application/json",
        **headers,
    ):
        return self.client.generic(
            "POST",
            url or self.url,
            data=body,
            content_type=content_type,
            **headers,
        )

    def test_get_is_not_allowed(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            405,
        )

    def test_unknown_gateway_returns_404(self):
        url = reverse(
            "public:payment-webhook-moyasar",
            kwargs={
                "gateway_id": 999999999,
            },
        )

        response = self.client.post(
            url,
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_inactive_gateway_returns_404(self):
        self.gateway_obj.is_active = False
        self.gateway_obj.save(
            update_fields=[
                "is_active",
            ],
        )

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_gateway_without_webhooks_returns_404(self):
        self.gateway_obj.supports_webhooks = False
        self.gateway_obj.save(
            update_fields=[
                "supports_webhooks",
            ],
        )

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_provider_gateway_mismatch_returns_404(self):
        url = reverse(
            "public:payment-webhook-tabby",
            kwargs={
                "gateway_id": self.gateway_obj.id,
            },
        )

        response = self.client.post(
            url,
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_empty_body_returns_400(self):
        response = self.post_raw(
            b"",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_malformed_json_returns_400(self):
        response = self.post_raw(
            b'{"broken":',
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    def test_json_array_returns_400(self):
        response = self.post_raw(
            b'["not", "an", "object"]',
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    @patch.dict(
        "api.public.payment_webhooks.receiver._PROVIDER_BUILDERS",
        {"moyasar": MagicMock()},
    )
    def test_invalid_signature_cannot_mutate_checkout(
        self,
    ):
        from api.public.payment_webhooks.receiver import _PROVIDER_BUILDERS
        builder = _PROVIDER_BUILDERS["moyasar"]
        adapter = MagicMock()
        builder.return_value = adapter

        adapter.verify_webhook.side_effect = (
            PaymentGatewayVerificationError(
                "Invalid webhook signature."
            )
        )


        before = self.session.status

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.session.refresh_from_db()

        self.assertEqual(
            response.status_code,
            401,
        )

        self.assertEqual(
            self.session.status,
            before,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

        adapter.retrieve_payment.assert_not_called()

    @patch.dict(
        "api.public.payment_webhooks.receiver._PROVIDER_BUILDERS",
        {"moyasar": MagicMock()},
    )
    def test_provider_payment_id_mismatch_is_rejected(
        self,
    ):
        from api.public.payment_webhooks.receiver import _PROVIDER_BUILDERS
        builder = _PROVIDER_BUILDERS["moyasar"]
        adapter = MagicMock()
        builder.return_value = adapter

        adapter.verify_webhook.return_value = (
            self.event(
                payment_id="pay_webhook_001",
            )
        )

        adapter.retrieve_payment.return_value = (
            self.result(
                payment_id="different_payment",
            )
        )


        before = self.session.status

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.session.refresh_from_db()

        self.assertEqual(
            response.status_code,
            401,
        )

        self.assertEqual(
            self.session.status,
            before,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    @patch.dict(
        "api.public.payment_webhooks.receiver._PROVIDER_BUILDERS",
        {"moyasar": MagicMock()},
    )
    def test_provider_status_mismatch_is_rejected(
        self,
    ):
        from api.public.payment_webhooks.receiver import _PROVIDER_BUILDERS
        builder = _PROVIDER_BUILDERS["moyasar"]
        adapter = MagicMock()
        builder.return_value = adapter

        adapter.verify_webhook.return_value = (
            self.event(
                status=PaymentStatus.PAID,
            )
        )

        adapter.retrieve_payment.return_value = (
            self.result(
                status=PaymentStatus.FAILED,
            )
        )


        before = self.session.status

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.session.refresh_from_db()

        self.assertEqual(
            response.status_code,
            401,
        )

        self.assertEqual(
            self.session.status,
            before,
        )

        self.assertEqual(
            PaymentWebhookEvent.objects.count(),
            0,
        )

    @patch(
        "api.public.payment_webhooks.receiver"
        ".process_verified_provider_webhook"
    )
    @patch.dict(
        "api.public.payment_webhooks.receiver._PROVIDER_BUILDERS",
        {"moyasar": MagicMock()},
    )
    def test_verified_webhook_reaches_orchestrator(
        self,
        process_webhook,
    ):
        from api.public.payment_webhooks.receiver import _PROVIDER_BUILDERS
        builder = _PROVIDER_BUILDERS["moyasar"]
        adapter = MagicMock()
        builder.return_value = adapter

        adapter.verify_webhook.return_value = (
            self.event()
        )

        adapter.retrieve_payment.return_value = (
            self.result()
        )


        ledger_event = MagicMock()
        ledger_event.status = (
            PaymentWebhookEvent.Status.PROCESSED
        )

        session = MagicMock()
        session.status = (
            PaymentCheckoutSession.Status.PAID
        )

        process_webhook.return_value = (
            ledger_event,
            session,
            True,
        )

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
            HTTP_AUTHORIZATION="Bearer super-secret",
            HTTP_X_REQUEST_ID="request-123",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"],
        )

        self.assertFalse(
            response.data["duplicate"],
        )

        adapter.verify_webhook.assert_called_once()

        adapter.retrieve_payment.assert_called_once_with(
            "pay_webhook_001"
        )

        process_webhook.assert_called_once()

        kwargs = process_webhook.call_args.kwargs

        self.assertEqual(
            kwargs["gateway"],
            self.gateway_obj,
        )

        self.assertEqual(
            kwargs["provider_payment_id"],
            "pay_webhook_001",
        )

        self.assertEqual(
            kwargs["status"],
            PaymentStatus.PAID,
        )

        self.assertEqual(
            kwargs["amount_minor"],
            12500,
        )

        self.assertEqual(
            kwargs["currency"],
            "SAR",
        )

        header_names = {
            key.lower()
            for key in kwargs["headers"]
        }

        self.assertIn(
            "x-request-id",
            header_names,
        )

        self.assertNotIn(
            "authorization",
            header_names,
        )

    @patch(
        "api.public.payment_webhooks.receiver"
        ".process_verified_provider_webhook"
    )
    @patch.dict(
        "api.public.payment_webhooks.receiver._PROVIDER_BUILDERS",
        {"moyasar": MagicMock()},
    )
    def test_duplicate_response_is_idempotent(
        self,
        process_webhook,
    ):
        from api.public.payment_webhooks.receiver import _PROVIDER_BUILDERS
        builder = _PROVIDER_BUILDERS["moyasar"]
        adapter = MagicMock()
        builder.return_value = adapter

        adapter.verify_webhook.return_value = (
            self.event()
        )

        adapter.retrieve_payment.return_value = (
            self.result()
        )


        ledger_event = MagicMock()
        ledger_event.status = (
            PaymentWebhookEvent.Status.IGNORED
        )

        session = MagicMock()
        session.status = (
            PaymentCheckoutSession.Status.PAID
        )

        process_webhook.return_value = (
            ledger_event,
            session,
            False,
        )

        response = self.client.post(
            self.url,
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"],
        )

        self.assertTrue(
            response.data["duplicate"],
        )
