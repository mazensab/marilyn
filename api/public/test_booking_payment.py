from __future__ import annotations

from decimal import Decimal

from datetime import (
    datetime,
    time,
    timedelta,
)
from unittest.mock import patch

from django.core import signing
from django.test import TestCase, override_settings
from django.utils import timezone

from rest_framework.test import APIClient

from api.public.booking_payment import (
    issue_public_payment_token,
)
from integrations.payments import (
    PaymentGatewayName,
    PaymentResult,
    PaymentStatus,
)

from medical.models import (
    MedicalAppointment,
    MedicalAppointmentSource,
    MedicalAppointmentStatus,
    MedicalPatient,
)
from payments.models import (
    CompanyPaymentGateway,
    CompanyPaymentMethod,
    PaymentCheckoutSession,
)


class PublicBookingPaymentTests(TestCase):
    PAYMENT_OPTIONS_URL = (
        "/api/public/booking/payment/options/"
    )
    PAYMENT_VERIFY_URL = (
        "/api/public/booking/payment/verify/"
    )

    def setUp(self) -> None:
        from medical.tests_practitioner_availability import (
            PractitionerAvailabilityCombinedTests,
        )

        PractitionerAvailabilityCombinedTests.setUp(
            self
        )

        self.client = APIClient()

        self.patient = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="PUBLIC-PAYMENT-001",
            full_name="Public Payment Patient",
        )

        self.sequence = 0


    def scheduled_start(self):
        """
        Return a time known to fit the practitioner availability
        fixture used by these tests.
        """

        value = datetime.combine(
            self.target_date,
            time(
                9,
                0,
            ),
        )

        return timezone.make_aware(
            value,
            timezone.get_current_timezone(),
        )

    def appointment(
        self,
        *,
        price="125.00",
        source=MedicalAppointmentSource.ONLINE,
        status=MedicalAppointmentStatus.SCHEDULED,
    ) -> MedicalAppointment:
        self.sequence += 1

        start = (
            self.scheduled_start()
            + timedelta(
                minutes=(
                    self.sequence - 1
                )
            )
        )

        return MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient,
            practitioner=self.practitioner_a,
            branch=self.branch_a,
            department=self.department_a,
            clinic=self.clinic_a,
            practitioner_service_assignment=(
                self.link_a
            ),
            appointment_number=(
                f"PUBLIC-PAY-{self.sequence:04d}"
            ),
            scheduled_start=start,
            scheduled_end=(
                start
                + timedelta(
                    minutes=30,
                )
            ),
            source=source,
            status=status,
            price_snapshot=price,
            service_name_snapshot=(
                "Clinic appointment"
            ),
            practitioner_name_snapshot=(
                "Test Practitioner"
            ),
        )

    def gateway(
        self,
        *,
        name: str,
        code: str,
        gateway_type: str,
        is_active: bool = True,
    ) -> CompanyPaymentGateway:
        return CompanyPaymentGateway.objects.create(
            company=self.company_a,
            name=name,
            code=code,
            gateway_type=gateway_type,
            environment=(
                CompanyPaymentGateway
                .Environment
                .SANDBOX
            ),
            is_active=is_active,
            supports_webhooks=True,
        )

    def payment_method(
        self,
        *,
        name: str,
        code: str,
        method_type: str,
        gateway: CompanyPaymentGateway | None = None,
        is_active: bool = True,
        allow_customer_checkout: bool = True,
        sort_order: int = 100,
    ) -> CompanyPaymentMethod:
        return CompanyPaymentMethod.objects.create(
            company=self.company_a,
            gateway=gateway,
            name=name,
            code=code,
            method_type=method_type,
            settlement_behavior=(
                CompanyPaymentMethod
                .SettlementBehavior
                .IMMEDIATE
            ),
            allow_customer_checkout=(
                allow_customer_checkout
            ),
            allow_pos=False,
            is_active=is_active,
            sort_order=sort_order,
        )

    def token(
        self,
        appointment: MedicalAppointment,
    ) -> str:
        return issue_public_payment_token(
            appointment
        )

    def get_options(
        self,
        token: str,
    ):
        return self.client.get(
            self.PAYMENT_OPTIONS_URL,
            {
                "token": token,
            },
        )

    def moyasar_checkout(
        self,
        appointment: MedicalAppointment,
        *,
        amount=Decimal("125.00"),
        currency_code="SAR",
        status=(
            PaymentCheckoutSession
            .Status
            .PENDING
        ),
        external_payment_id="",
    ) -> PaymentCheckoutSession:
        gateway = self.gateway(
            name="Moyasar Verify",
            code=(
                "moyasar-verify-"
                f"{self.sequence}"
            ),
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .MOYASAR
            ),
        )
        method = self.payment_method(
            name="Moyasar Verify",
            code=(
                "moyasar-verify-method-"
                f"{self.sequence}"
            ),
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .ONLINE_GATEWAY
            ),
            gateway=gateway,
        )
        return PaymentCheckoutSession.objects.create(
            company=self.company_a,
            payment_method=method,
            gateway=gateway,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
            source_id=appointment.id,
            amount=amount,
            currency_code=currency_code,
            status=status,
            external_payment_id=(
                external_payment_id
            ),
        )
    def tamara_checkout(
        self,
        appointment: MedicalAppointment,
        *,
        amount=Decimal("125.00"),
        currency_code="SAR",
        status=(
            PaymentCheckoutSession
            .Status
            .PROCESSING
        ),
        order_id="tamara-order-001",
    ) -> PaymentCheckoutSession:
        gateway = self.gateway(
            name="Tamara Return",
            code=(
                "tamara-return-"
                f"{self.sequence}"
            ),
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )
        method = self.payment_method(
            name="Tamara Return",
            code=(
                "tamara-return-method-"
                f"{self.sequence}"
            ),
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .TAMARA
            ),
            gateway=gateway,
        )
        return PaymentCheckoutSession.objects.create(
            company=self.company_a,
            payment_method=method,
            gateway=gateway,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
            source_id=appointment.id,
            amount=amount,
            currency_code=currency_code,
            status=status,
            external_checkout_id=order_id,
            checkout_url=(
                "https://checkout.tamara.example/"
                f"{order_id}"
            ),
        )

    def tamara_result(
        self,
        appointment: MedicalAppointment,
        *,
        order_id: str,
        status: PaymentStatus,
        amount: int = 12500,
        currency: str = "SAR",
        reference: str | None = None,
    ) -> PaymentResult:
        return PaymentResult(
            gateway=PaymentGatewayName.TAMARA,
            provider_payment_id=order_id,
            status=status,
            amount=amount,
            currency=currency,
            reference=(
                reference
                if reference is not None
                else appointment.appointment_number
            ),
        )

    def tamara_return_url(
        self,
        session: PaymentCheckoutSession,
        result: str = "success",
    ) -> str:
        return (
            "/api/public/booking/payment/"
            f"return/tamara/{result}/"
            f"?session={session.id}"
        )

    def tabby_checkout(
        self,
        appointment: MedicalAppointment,
        *,
        amount=Decimal("125.00"),
        currency_code="SAR",
        status=(
            PaymentCheckoutSession
            .Status
            .PROCESSING
        ),
        payment_id="tabby-payment-001",
    ) -> PaymentCheckoutSession:
        gateway = self.gateway(
            name="Tabby Return",
            code="tabby",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )
        method = self.payment_method(
            name="Tabby Return",
            code=(
                "tabby-return-method-"
                f"{self.sequence}"
            ),
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .TABBY
            ),
            gateway=gateway,
        )
        return PaymentCheckoutSession.objects.create(
            company=self.company_a,
            payment_method=method,
            gateway=gateway,
            source_type=(
                PaymentCheckoutSession
                .SourceType
                .OTHER
            ),
            source_id=appointment.id,
            amount=amount,
            currency_code=currency_code,
            status=status,
            external_checkout_id=payment_id,
            checkout_url=(
                "https://checkout.tabby.example/"
                f"{payment_id}"
            ),
        )

    def tabby_result(
        self,
        appointment: MedicalAppointment,
        *,
        payment_id: str,
        status: PaymentStatus,
        amount: int = 12500,
        currency: str = "SAR",
        reference: str | None = None,
    ) -> PaymentResult:
        return PaymentResult(
            gateway=PaymentGatewayName.TABBY,
            provider_payment_id=payment_id,
            status=status,
            amount=amount,
            currency=currency,
            reference=(
                reference
                if reference is not None
                else appointment.appointment_number
            ),
        )

    def tabby_return_url(
        self,
        session: PaymentCheckoutSession,
        result: str = "success",
    ) -> str:
        return (
            "/api/public/booking/payment/"
            f"return/tabby/{result}/"
            f"?session={session.id}"
        )

    def verify_payment(
        self,
        appointment: MedicalAppointment,
        session: PaymentCheckoutSession,
        payment_id: str,
    ):
        return self.client.post(
            self.PAYMENT_VERIFY_URL,
            {
                "token": self.token(
                    appointment
                ),
                "checkout_session_id": (
                    session.id
                ),
                "payment_id": payment_id,
            },
            format="json",
        )
    def payment_result(
        self,
        *,
        payment_id: str,
        status: PaymentStatus,
        amount: int = 12500,
        currency: str = "SAR",
    ) -> PaymentResult:
        return PaymentResult(
            gateway=PaymentGatewayName.MOYASAR,
            provider_payment_id=payment_id,
            status=status,
            amount=amount,
            currency=currency,
        )
    def test_valid_payment_token_returns_options(self):
        appointment = self.appointment()

        self.payment_method(
            name="Pay at Clinic",
            code="cash-at-clinic",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .CASH
            ),
            sort_order=10,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertTrue(
            response.data["payment_required"]
        )

        self.assertTrue(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["amount"],
            "125.00",
        )

        self.assertEqual(
            response.data["currency_code"],
            "SAR",
        )

    def test_tampered_payment_token_is_rejected(self):
        appointment = self.appointment()

        token = self.token(
            appointment
        )

        response = self.get_options(
            f"{token}tampered"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertFalse(
            response.data["success"]
        )

    def test_expired_payment_token_is_rejected(self):
        appointment = self.appointment()

        token = self.token(
            appointment
        )

        with patch(
            "api.public.booking_payment.signing.loads",
            side_effect=signing.SignatureExpired(
                "expired"
            ),
        ):
            response = self.get_options(
                token
            )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertFalse(
            response.data["success"]
        )

    def test_non_online_appointment_is_rejected(self):
        appointment = self.appointment(
            source=(
                MedicalAppointmentSource
                .MANUAL
            )
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_cancelled_appointment_is_rejected(self):
        appointment = self.appointment(
            status=(
                MedicalAppointmentStatus
                .CANCELLED
            )
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_zero_price_does_not_require_payment(self):
        appointment = self.appointment(
            price="0.00"
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertFalse(
            response.data["payment_required"]
        )

        self.assertFalse(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["amount"],
            "0.00",
        )

        self.assertEqual(
            response.data["methods"],
            [],
        )

    def test_cash_at_clinic_is_available_without_gateway(self):
        appointment = self.appointment()

        method = self.payment_method(
            name="Pay at Clinic",
            code="cash-at-clinic",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .CASH
            ),
            sort_order=10,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        methods = response.data[
            "methods"
        ]

        self.assertEqual(
            len(methods),
            1,
        )

        item = methods[0]

        self.assertEqual(
            item["id"],
            method.id,
        )

        self.assertEqual(
            item["provider"],
            "cash_at_clinic",
        )

        self.assertEqual(
            item["method_type"],
            "CASH",
        )

        self.assertEqual(
            item["gateway_type"],
            "",
        )

        self.assertFalse(
            item["requires_redirect"]
        )

        self.assertTrue(
            item["is_cash_at_clinic"]
        )

    def test_moyasar_is_available(self):
        appointment = self.appointment()

        gateway = self.gateway(
            name="Moyasar",
            code="moyasar",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .MOYASAR
            ),
        )

        self.payment_method(
            name="Card / mada / Apple Pay",
            code="moyasar-online",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .ONLINE_GATEWAY
            ),
            gateway=gateway,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["methods"][0][
                "provider"
            ],
            "moyasar",
        )

        self.assertTrue(
            response.data["methods"][0][
                "requires_redirect"
            ]
        )

    def test_tamara_is_available(self):
        appointment = self.appointment()

        gateway = self.gateway(
            name="Tamara",
            code="tamara",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )

        self.payment_method(
            name="Tamara",
            code="tamara",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .TAMARA
            ),
            gateway=gateway,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["methods"][0][
                "provider"
            ],
            "tamara",
        )

    def test_tabby_is_available(self):
        appointment = self.appointment()

        gateway = self.gateway(
            name="Tabby",
            code="tabby",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )

        self.payment_method(
            name="Tabby",
            code="tabby",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .TABBY
            ),
            gateway=gateway,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["methods"][0][
                "provider"
            ],
            "tabby",
        )

    def test_inactive_method_is_hidden(self):
        appointment = self.appointment()

        self.payment_method(
            name="Inactive Cash",
            code="inactive-cash",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .CASH
            ),
            is_active=False,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["methods"],
            [],
        )

    def test_method_not_allowed_for_customer_checkout_is_hidden(
        self,
    ):
        appointment = self.appointment()

        self.payment_method(
            name="Private Cash",
            code="private-cash",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .CASH
            ),
            allow_customer_checkout=False,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["methods"],
            [],
        )

    def test_inactive_gateway_is_hidden(self):
        appointment = self.appointment()

        gateway = self.gateway(
            name="Inactive Moyasar",
            code="inactive-moyasar",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .MOYASAR
            ),
            is_active=False,
        )

        self.payment_method(
            name="Inactive Online",
            code="inactive-online",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .ONLINE_GATEWAY
            ),
            gateway=gateway,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["methods"],
            [],
        )

    def test_unsupported_provider_is_hidden(self):
        appointment = self.appointment()

        gateway = self.gateway(
            name="Unsupported Gateway",
            code="unsupported-provider",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )

        self.payment_method(
            name="Unsupported Online",
            code="unsupported-online",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .ONLINE_GATEWAY
            ),
            gateway=gateway,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["payment_required"]
        )

        self.assertFalse(
            response.data["payment_available"]
        )

        self.assertEqual(
            response.data["methods"],
            [],
        )

    def test_methods_are_returned_in_sort_order(self):
        appointment = self.appointment()

        moyasar_gateway = self.gateway(
            name="Moyasar",
            code="moyasar",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .MOYASAR
            ),
        )

        self.payment_method(
            name="Moyasar",
            code="moyasar",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .ONLINE_GATEWAY
            ),
            gateway=moyasar_gateway,
            sort_order=30,
        )

        self.payment_method(
            name="Pay at Clinic",
            code="cash-at-clinic",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .CASH
            ),
            sort_order=10,
        )

        tabby_gateway = self.gateway(
            name="Tabby",
            code="tabby",
            gateway_type=(
                CompanyPaymentGateway
                .GatewayType
                .CUSTOM
            ),
        )

        self.payment_method(
            name="Tabby",
            code="tabby",
            method_type=(
                CompanyPaymentMethod
                .MethodType
                .TABBY
            ),
            gateway=tabby_gateway,
            sort_order=20,
        )

        response = self.get_options(
            self.token(
                appointment
            )
        )

        providers = [
            method["provider"]
            for method
            in response.data["methods"]
        ]

        self.assertEqual(
            providers,
            [
                "cash_at_clinic",
                "tabby",
                "moyasar",
            ],
        )

    def test_verify_paid_payment_marks_session_paid(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_verify_paid"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.PAID,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertTrue(
            response.data["success"]
        )
        self.assertTrue(
            response.data["verified"]
        )
        self.assertFalse(
            response.data["already_verified"]
        )
        self.assertEqual(
            response.data["payment_status"],
            "paid",
        )
        self.assertEqual(
            response.data["provider_status"],
            "paid",
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            payment_id,
        )
        self.assertIsNotNone(
            session.paid_at
        )
        self.assertEqual(
            session.metadata["payment_provider"],
            "moyasar",
        )
        self.assertEqual(
            session.metadata["provider_payment_id"],
            payment_id,
        )
        self.assertEqual(
            session.metadata["provider_status"],
            "paid",
        )
        self.assertEqual(
            session.metadata["verified_via"],
            "public_booking_verify",
        )
    def test_verify_pending_payment_does_not_mark_paid(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_verify_pending"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.PENDING,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertFalse(
            response.data["success"]
        )
        self.assertFalse(
            response.data["verified"]
        )
        self.assertEqual(
            response.data["payment_status"],
            "pending",
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_authorized_payment_does_not_mark_paid(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_verify_authorized"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertEqual(
            response.data["payment_status"],
            "authorized",
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_failed_payment_does_not_mark_paid(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_verify_failed"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.FAILED,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertEqual(
            response.data["payment_status"],
            "failed",
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_rejects_amount_mismatch(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_amount_mismatch"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.PAID,
            amount=12499,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertFalse(
            response.data["verified"]
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_rejects_currency_mismatch(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        payment_id = "pay_currency_mismatch"
        result = self.payment_result(
            payment_id=payment_id,
            status=PaymentStatus.PAID,
            currency="USD",
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertFalse(
            response.data["verified"]
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_rejects_provider_payment_id_mismatch(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment
        )
        requested_payment_id = "pay_requested"
        returned_payment_id = "pay_returned"
        result = self.payment_result(
            payment_id=returned_payment_id,
            status=PaymentStatus.PAID,
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.verify_payment.return_value = (
                result
            )
            response = self.verify_payment(
                appointment,
                session,
                requested_payment_id,
            )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertFalse(
            response.data["verified"]
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PENDING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )
    def test_verify_paid_session_is_idempotent(self):
        appointment = self.appointment()
        payment_id = "pay_already_verified"
        session = self.moyasar_checkout(
            appointment,
            status=(
                PaymentCheckoutSession
                .Status
                .PAID
            ),
            external_payment_id=payment_id,
        )
        session.paid_at = timezone.now()
        session.save(
            update_fields=[
                "paid_at",
                "updated_at",
            ]
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            response = self.verify_payment(
                appointment,
                session,
                payment_id,
            )
            adapter_factory.assert_not_called()
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertTrue(
            response.data["success"]
        )
        self.assertTrue(
            response.data["verified"]
        )
        self.assertTrue(
            response.data["already_verified"]
        )
        self.assertEqual(
            response.data["payment_status"],
            "paid",
        )
    def test_verify_paid_session_rejects_different_payment_id(self):
        appointment = self.appointment()
        session = self.moyasar_checkout(
            appointment,
            status=(
                PaymentCheckoutSession
                .Status
                .PAID
            ),
            external_payment_id=(
                "pay_original"
            ),
        )
        session.paid_at = timezone.now()
        session.save(
            update_fields=[
                "paid_at",
                "updated_at",
            ]
        )
        with patch(
            "api.public.booking_payment._moyasar_adapter"
        ) as adapter_factory:
            response = self.verify_payment(
                appointment,
                session,
                "pay_different",
            )
            adapter_factory.assert_not_called()
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertFalse(
            response.data["success"]
        )
        session.refresh_from_db()
        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            "pay_original",
        )


    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_success_authorises_pending_order_and_marks_paid(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-approved-order"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )

        pending_result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.PENDING,
        )
        authorised_result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.AUTHORIZED,
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                pending_result
            )
            adapter.authorise_payment.return_value = (
                authorised_result
            )

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.retrieve_payment.assert_called_once_with(
            order_id
        )
        adapter.authorise_payment.assert_called_once_with(
            order_id
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            order_id,
        )
        self.assertIsNotNone(
            session.paid_at
        )
        self.assertEqual(
            session.metadata["payment_provider"],
            "tamara",
        )
        self.assertEqual(
            session.metadata["provider_payment_id"],
            order_id,
        )
        self.assertEqual(
            session.metadata["provider_status"],
            "authorized",
        )
        self.assertEqual(
            session.metadata["verified_via"],
            "tamara_return_api",
        )
        self.assertTrue(
            session.metadata["capture_required"]
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_authorized_order_marks_paid_without_reauthorising(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-authorized-order"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.AUTHORIZED,
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = result

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.authorise_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertTrue(
            session.metadata["capture_required"]
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_captured_order_marks_paid_without_capture_required(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-captured-order"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.PAID,
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertFalse(
            session.metadata["capture_required"]
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_amount_mismatch_does_not_mark_paid(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-amount-mismatch"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.AUTHORIZED,
            amount=12499,
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_currency_mismatch_does_not_mark_paid(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-currency-mismatch"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.AUTHORIZED,
            currency="USD",
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_reference_mismatch_does_not_mark_paid(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-reference-mismatch"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.AUTHORIZED,
            reference="OTHER-APPOINTMENT",
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter_factory.return_value.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_failed_order_does_not_mark_paid(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-failed-order"
        session = self.tamara_checkout(
            appointment,
            order_id=order_id,
        )
        result = self.tamara_result(
            appointment,
            order_id=order_id,
            status=PaymentStatus.FAILED,
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = result

            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.authorise_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tamara_paid_return_is_idempotent(
        self,
    ):
        appointment = self.appointment()
        order_id = "tamara-already-paid"
        session = self.tamara_checkout(
            appointment,
            status=(
                PaymentCheckoutSession
                .Status
                .PAID
            ),
            order_id=order_id,
        )
        session.external_payment_id = order_id
        session.paid_at = timezone.now()
        session.save(
            update_fields=[
                "external_payment_id",
                "paid_at",
                "updated_at",
            ]
        )

        with patch(
            "api.public.booking_payment._tamara_adapter"
        ) as adapter_factory:
            response = self.client.get(
                self.tamara_return_url(
                    session
                )
            )
            adapter_factory.assert_not_called()

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            order_id,
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_authorized_payment_is_captured_and_marked_paid(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-authorized-payment"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        authorized = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
        )
        paid = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.PAID,
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                authorized
            )
            adapter.capture_payment.return_value = (
                paid
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.retrieve_payment.assert_called_once_with(
            payment_id
        )
        adapter.capture_payment.assert_called_once_with(
            payment_id,
            amount=12500,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            payment_id,
        )
        self.assertIsNotNone(
            session.paid_at
        )
        self.assertEqual(
            session.metadata["payment_provider"],
            "tabby",
        )
        self.assertEqual(
            session.metadata["provider_status"],
            "paid",
        )
        self.assertEqual(
            session.metadata["verified_via"],
            "tabby_return_api",
        )
        self.assertFalse(
            session.metadata["capture_required"]
        )
        self.assertTrue(
            session.metadata["captured"]
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_closed_payment_marks_paid_without_capture(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-closed-payment"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        paid = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.PAID,
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                paid
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.capture_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_amount_mismatch_does_not_capture_or_mark_paid(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-amount-mismatch"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        result = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
            amount=12499,
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.capture_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertEqual(
            session.external_payment_id,
            "",
        )
        self.assertIsNone(
            session.paid_at
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_currency_mismatch_does_not_capture_or_mark_paid(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-currency-mismatch"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        result = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
            currency="USD",
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.capture_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_reference_mismatch_does_not_capture_or_mark_paid(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-reference-mismatch"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        result = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
            reference="OTHER-APPOINTMENT",
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                result
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.capture_payment.assert_not_called()

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_capture_must_return_paid_before_session_is_paid(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-capture-not-final"
        session = self.tabby_checkout(
            appointment,
            payment_id=payment_id,
        )
        authorized = self.tabby_result(
            appointment,
            payment_id=payment_id,
            status=PaymentStatus.AUTHORIZED,
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            adapter = adapter_factory.return_value
            adapter.retrieve_payment.return_value = (
                authorized
            )
            adapter.capture_payment.return_value = (
                authorized
            )

            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )

        self.assertEqual(
            response.status_code,
            302,
        )
        adapter.capture_payment.assert_called_once_with(
            payment_id,
            amount=12500,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PROCESSING,
        )
        self.assertIsNone(
            session.paid_at
        )

    @override_settings(
        PUBLIC_BOOKING_PAYMENT_RETURN_URL=(
            "http://testserver/book"
        )
    )
    def test_tabby_paid_return_is_idempotent(
        self,
    ):
        appointment = self.appointment()
        payment_id = "tabby-already-paid"
        session = self.tabby_checkout(
            appointment,
            status=(
                PaymentCheckoutSession
                .Status
                .PAID
            ),
            payment_id=payment_id,
        )
        session.external_payment_id = (
            payment_id
        )
        session.paid_at = timezone.now()
        session.save(
            update_fields=[
                "external_payment_id",
                "paid_at",
                "updated_at",
            ]
        )

        with patch(
            "api.public.booking_payment._tabby_adapter"
        ) as adapter_factory:
            response = self.client.get(
                self.tabby_return_url(
                    session
                )
            )
            adapter_factory.assert_not_called()

        self.assertEqual(
            response.status_code,
            302,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            PaymentCheckoutSession.Status.PAID,
        )
        self.assertEqual(
            session.external_payment_id,
            payment_id,
        )
