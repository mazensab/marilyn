from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

from accounts.models import CompanyMembership, CompanyRole, MembershipStatus
from api.company.payments.gateways.provider_configuration import (
    payment_gateway_provider_configuration,
)
from companies.models import Company
from payments.models import CompanyPaymentGateway, CompanyPaymentMethod


User = get_user_model()


class PaymentGatewayProviderConfigurationTests(TestCase):
    """
    Regression tests for the managed Moyasar / Tamara / Tabby configuration API.

    These tests protect:
    - company-scoped configuration
    - secret non-disclosure
    - preservation of existing secrets when blank/masked values are submitted
    - explicit secret rotation
    - provider credential requirements before activation
    - Moyasar sandbox/live key compatibility
    - gateway/payment-method activation synchronization
    """

    def setUp(self) -> None:
        self.factory = APIRequestFactory()

        self.user = User.objects.create_user(
            username="payment-provider-admin",
            email="payment-provider-admin@example.com",
            password="StrongPass123!",
        )
        self.other_user = User.objects.create_user(
            username="payment-provider-other",
            email="payment-provider-other@example.com",
            password="StrongPass123!",
        )
        self.no_membership_user = User.objects.create_user(
            username="payment-provider-no-membership",
            email="payment-provider-no-membership@example.com",
            password="StrongPass123!",
        )

        self.company = Company.objects.create(
            name="Payment Provider Test Company",
            company_code="PAYMENT-PROVIDER-001",
            currency_code="SAR",
        )
        self.other_company = Company.objects.create(
            name="Other Payment Provider Company",
            company_code="PAYMENT-PROVIDER-002",
            currency_code="SAR",
        )

        self.membership = CompanyMembership.objects.create(
            user=self.user,
            company=self.company,
            role=CompanyRole.OWNER,
            status=MembershipStatus.ACTIVE,
            is_primary=True,
        )
        self.other_membership = CompanyMembership.objects.create(
            user=self.other_user,
            company=self.other_company,
            role=CompanyRole.OWNER,
            status=MembershipStatus.ACTIVE,
            is_primary=True,
        )

    def request(
        self,
        method: str,
        provider: str,
        *,
        company=None,
        user=None,
        data=None,
        company_id=None,
    ):
        method_name = method.lower()
        request_builder = getattr(self.factory, method_name)

        path = f"/api/company/payments/gateways/integrations/{provider}/"
        if company_id is not None:
            path = f"{path}?company_id={company_id}"

        if method_name == "get":
            request = request_builder(path, format="json")
        else:
            request = request_builder(
                path,
                data=data or {},
                format="json",
            )

        force_authenticate(request, user=user or self.user)

        return payment_gateway_provider_configuration(request, provider=provider)

    def create_moyasar(
        self,
        *,
        company=None,
        public_key="pk_test_public",
        secret_key="sk_test_secret",
        webhook_secret="wh_secret",
        timeout=15,
        is_active=True,
    ):
        company = company or self.company

        gateway = CompanyPaymentGateway.objects.create(
            company=company,
            name="Moyasar",
            code="moyasar",
            gateway_type=CompanyPaymentGateway.GatewayType.MOYASAR,
            environment=CompanyPaymentGateway.Environment.SANDBOX,
            public_key=public_key,
            settings={
                "secret_key": secret_key,
                "webhook_secret": webhook_secret,
                "base_url": "https://api.moyasar.com/v1",
                "timeout": timeout,
            },
            supports_refunds=True,
            supports_partial_refunds=True,
            supports_webhooks=True,
            is_active=is_active,
        )

        method = CompanyPaymentMethod.objects.create(
            company=company,
            gateway=gateway,
            name="mada / Apple Pay / Cards",
            code="moyasar-online",
            method_type=CompanyPaymentMethod.MethodType.ONLINE_GATEWAY,
            settlement_behavior=CompanyPaymentMethod.SettlementBehavior.IMMEDIATE,
            allow_customer_checkout=True,
            allow_pos=False,
            is_active=is_active,
            sort_order=20,
        )

        return gateway, method

    def create_tabby(
        self,
        *,
        company=None,
        merchant_code="",
        secret_key="",
        is_active=False,
    ):
        company = company or self.company

        gateway = CompanyPaymentGateway.objects.create(
            company=company,
            name="Tabby",
            code="tabby",
            gateway_type=CompanyPaymentGateway.GatewayType.CUSTOM,
            environment=CompanyPaymentGateway.Environment.SANDBOX,
            merchant_id=merchant_code,
            settings={
                "merchant_code": merchant_code,
                "secret_key": secret_key,
                "base_url": "https://api.tabby.sa",
                "timeout": 15,
            },
            supports_refunds=True,
            supports_partial_refunds=True,
            supports_webhooks=True,
            is_active=is_active,
        )

        method = CompanyPaymentMethod.objects.create(
            company=company,
            gateway=gateway,
            name="Tabby",
            code="tabby",
            method_type=CompanyPaymentMethod.MethodType.TABBY,
            settlement_behavior=CompanyPaymentMethod.SettlementBehavior.EXTERNAL_CLEARING,
            allow_customer_checkout=True,
            allow_pos=False,
            is_active=is_active,
            sort_order=40,
        )

        return gateway, method

    def test_owner_membership_can_read_provider_configuration(self):
        response = self.request("GET", "moyasar")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])

    def test_user_without_active_membership_is_forbidden(self):
        response = self.request(
            "GET",
            "moyasar",
            user=self.no_membership_user,
        )

        self.assertEqual(response.status_code, 403)

    def test_company_selector_cannot_switch_to_unowned_company(self):
        self.create_moyasar(
            company=self.company,
            public_key="pk_test_current_company",
        )
        self.create_moyasar(
            company=self.other_company,
            public_key="pk_test_other_company",
        )

        response = self.request(
            "GET",
            "moyasar",
            company_id=self.other_company.id,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["item"]["public_key"],
            "pk_test_current_company",
        )

    def test_real_integrations_route_is_reachable(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            "/api/company/payments/gateways/integrations/moyasar/"
        )

        self.assertEqual(response.status_code, 200)

    def test_get_never_returns_stored_moyasar_secrets(self):
        self.create_moyasar(
            secret_key="sk_test_never_expose_me",
            webhook_secret="webhook_never_expose_me",
        )

        response = self.request("GET", "moyasar")

        self.assertEqual(response.status_code, 200)
        payload = response.data["item"]

        self.assertEqual(payload["public_key"], "pk_test_public")
        self.assertTrue(payload["credential_status"]["secret_key"])
        self.assertTrue(payload["credential_status"]["webhook_secret"])

        serialized = str(response.data)
        self.assertNotIn("sk_test_never_expose_me", serialized)
        self.assertNotIn("webhook_never_expose_me", serialized)
        self.assertNotIn("secret_key", payload)
        self.assertNotIn("webhook_secret", payload)

    def test_blank_secret_preserves_existing_secret_when_updating_timeout(self):
        gateway, _method = self.create_moyasar(
            secret_key="sk_test_keep_me",
            webhook_secret="webhook_keep_me",
            timeout=15,
        )

        response = self.request(
            "PATCH",
            "moyasar",
            data={
                "environment": "SANDBOX",
                "public_key": "pk_test_public",
                "secret_key": "",
                "webhook_secret": "",
                "timeout": 16,
                "is_active": True,
            },
        )

        self.assertEqual(response.status_code, 200)

        gateway.refresh_from_db()
        settings = gateway.settings or {}

        self.assertEqual(settings["secret_key"], "sk_test_keep_me")
        self.assertEqual(settings["webhook_secret"], "webhook_keep_me")
        self.assertEqual(settings["timeout"], 16)
        self.assertEqual(settings["base_url"], "https://api.moyasar.com/v1")

    def test_masked_secret_preserves_existing_secret(self):
        gateway, _method = self.create_moyasar(
            secret_key="sk_test_keep_masked",
            webhook_secret="webhook_keep_masked",
        )

        response = self.request(
            "PATCH",
            "moyasar",
            data={
                "secret_key": "********",
                "webhook_secret": "********",
                "timeout": 17,
            },
        )

        self.assertEqual(response.status_code, 200)

        gateway.refresh_from_db()
        settings = gateway.settings or {}

        self.assertEqual(settings["secret_key"], "sk_test_keep_masked")
        self.assertEqual(settings["webhook_secret"], "webhook_keep_masked")
        self.assertEqual(settings["timeout"], 17)

    def test_new_secret_explicitly_rotates_stored_secret(self):
        gateway, _method = self.create_moyasar(
            secret_key="sk_test_old_secret",
        )

        response = self.request(
            "PATCH",
            "moyasar",
            data={
                "public_key": "pk_test_public",
                "secret_key": "sk_test_new_secret",
                "is_active": True,
            },
        )

        self.assertEqual(response.status_code, 200)

        gateway.refresh_from_db()
        self.assertEqual(
            (gateway.settings or {}).get("secret_key"),
            "sk_test_new_secret",
        )

    def test_tabby_cannot_activate_without_required_credentials(self):
        gateway, method = self.create_tabby()

        response = self.request(
            "PATCH",
            "tabby",
            data={"is_active": True},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.data["errors"])

        gateway.refresh_from_db()
        method.refresh_from_db()

        self.assertFalse(gateway.is_active)
        self.assertFalse(method.is_active)

    def test_tamara_cannot_activate_without_api_token(self):
        response = self.request(
            "POST",
            "tamara",
            data={
                "environment": "SANDBOX",
                "is_active": True,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.data["errors"])

        self.assertFalse(
            CompanyPaymentGateway.objects.filter(
                company=self.company,
                code="tamara",
            ).exists()
        )
        self.assertFalse(
            CompanyPaymentMethod.objects.filter(
                company=self.company,
                code="tamara",
            ).exists()
        )

    def test_moyasar_sandbox_rejects_live_keys(self):
        response = self.request(
            "POST",
            "moyasar",
            data={
                "environment": "SANDBOX",
                "public_key": "pk_live_wrong_environment",
                "secret_key": "sk_live_wrong_environment",
                "is_active": False,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.data["errors"])

        self.assertFalse(
            CompanyPaymentGateway.objects.filter(
                company=self.company,
                code="moyasar",
            ).exists()
        )

    def test_moyasar_live_rejects_test_keys(self):
        response = self.request(
            "POST",
            "moyasar",
            data={
                "environment": "LIVE",
                "public_key": "pk_test_wrong_environment",
                "secret_key": "sk_test_wrong_environment",
                "is_active": False,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.data["errors"])

        self.assertFalse(
            CompanyPaymentGateway.objects.filter(
                company=self.company,
                code="moyasar",
            ).exists()
        )

    def test_gateway_activation_is_synchronized_with_payment_method(self):
        gateway, method = self.create_tabby(
            merchant_code="merchant-test",
            secret_key="sk_test_tabby",
            is_active=False,
        )

        activate_response = self.request(
            "PATCH",
            "tabby",
            data={
                "merchant_code": "merchant-test",
                "secret_key": "",
                "is_active": True,
            },
        )

        self.assertEqual(activate_response.status_code, 200)

        gateway.refresh_from_db()
        method.refresh_from_db()

        self.assertTrue(gateway.is_active)
        self.assertTrue(method.is_active)

        deactivate_response = self.request(
            "PATCH",
            "tabby",
            data={
                "is_active": False,
            },
        )

        self.assertEqual(deactivate_response.status_code, 200)

        gateway.refresh_from_db()
        method.refresh_from_db()

        self.assertFalse(gateway.is_active)
        self.assertFalse(method.is_active)

    def test_company_context_does_not_read_or_modify_other_company_gateway(self):
        other_gateway, other_method = self.create_moyasar(
            company=self.other_company,
            public_key="pk_test_other_public",
            secret_key="sk_test_other_secret",
            webhook_secret="other_webhook_secret",
            timeout=21,
            is_active=True,
        )

        get_response = self.request(
            "GET",
            "moyasar",
            company=self.company,
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertFalse(get_response.data["item"]["exists"])
        self.assertEqual(get_response.data["item"]["public_key"], "")

        patch_response = self.request(
            "PATCH",
            "moyasar",
            company=self.company,
            data={
                "environment": "SANDBOX",
                "public_key": "pk_test_current_public",
                "secret_key": "sk_test_current_secret",
                "is_active": True,
            },
        )

        self.assertEqual(patch_response.status_code, 200)

        other_gateway.refresh_from_db()
        other_method.refresh_from_db()

        self.assertEqual(other_gateway.public_key, "pk_test_other_public")
        self.assertEqual((other_gateway.settings or {})["secret_key"], "sk_test_other_secret")
        self.assertEqual((other_gateway.settings or {})["timeout"], 21)
        self.assertTrue(other_gateway.is_active)
        self.assertTrue(other_method.is_active)

        self.assertTrue(
            CompanyPaymentGateway.objects.filter(
                company=self.company,
                code="moyasar",
            ).exists()
        )

    def test_unsupported_provider_is_rejected(self):
        response = self.request(
            "GET",
            "unsupported-provider",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("provider", response.data["errors"])
