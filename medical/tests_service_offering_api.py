from __future__ import annotations
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve, reverse
from rest_framework.test import APIClient
from accounts.models import (
    CompanyMembership,
    CompanyRole,
    UserProfile,
)
from catalog.models import CatalogItem
from medical.models import (
    MedicalServiceOffering,
    MedicalServiceOfferingStatus,
)
from api.company.medical import service_offerings
User = get_user_model()
class CompanyMedicalServiceOfferingApiTests(
    TestCase
):
    def setUp(self) -> None:
        from medical.tests_service_offering_foundation import (
            MedicalServiceOfferingFoundationTests,
        )
        MedicalServiceOfferingFoundationTests.setUp(
            self
        )
        self.user = User.objects.create_user(
            username="service-offering-api-owner",
            email="service-offering-api@example.com",
            password="StrongPass123!",
        )
        UserProfile.objects.update_or_create(
            user=self.user,
            defaults={
                "display_name": (
                    "Service Offering Owner"
                ),
                "default_company": self.company_a,
            },
        )
        CompanyMembership.objects.update_or_create(
            user=self.user,
            company=self.company_a,
            defaults={
                "role": CompanyRole.OWNER,
                "is_primary": True,
            },
        )
        self.service_a_second = (
            CatalogItem.objects.create(
                company=self.company_a,
                item_type="SERVICE",
                status="ACTIVE",
                code="MSO-SERVICE-A2",
                name="Laser Session",
                name_ar="جلسة ليزر",
                sale_price=Decimal("450.00"),
                taxable=True,
                tax_rate=Decimal("15.00"),
                is_sellable=True,
            )
        )
        self.offering_a = (
            MedicalServiceOffering.objects.create(
                company=self.company_a,
                catalog_item=self.service_a,
                branch=self.branch_a,
                department=self.department_a,
                specialty=self.specialty_a,
                clinic=self.clinic_a,
                status=(
                    MedicalServiceOfferingStatus.ACTIVE
                ),
                duration_minutes=30,
                buffer_before_minutes=5,
                buffer_after_minutes=10,
                default_session_count=1,
                online_booking_enabled=True,
            )
        )
        self.offering_b = (
            MedicalServiceOffering.objects.create(
                company=self.company_b,
                catalog_item=self.service_b,
                branch=self.branch_b,
                department=self.department_b,
                specialty=self.specialty_b,
                clinic=self.clinic_b,
                duration_minutes=60,
            )
        )
        self.collection_url = (
            "/api/company/medical/"
            "service-offerings/"
        )
        self.detail_url = (
            self.collection_url
            + f"{self.offering_a.id}/"
        )
        self.status_url = (
            self.detail_url + "status/"
        )
        self.client = APIClient()
        self.client.force_authenticate(
            user=self.user
        )
    def create_payload(self):
        return {
            "company_id": self.company_b.id,
            "catalog_item_id": (
                self.service_a_second.id
            ),
            "branch_id": self.branch_a.id,
            "department_id": self.department_a.id,
            "specialty_id": self.specialty_a.id,
            "clinic_id": self.clinic_a.id,
            "duration_minutes": 45,
            "buffer_before_minutes": 5,
            "buffer_after_minutes": 15,
            "sale_price_override": "425.00",
            "default_session_count": 3,
            "online_booking_enabled": True,
            "requires_approval": True,
            "requires_preparation": True,
            "preparation_instructions": (
                "  Avoid active products  "
            ),
            "notes": "  API offering  ",
            "extra_data": {
                "source": "api-test",
            },
        }
    def test_routes_are_registered(self):
        for path in (
            self.collection_url,
            self.detail_url,
            self.status_url,
        ):
            match = resolve(path)
            self.assertEqual(
                reverse(
                    match.view_name,
                    kwargs=match.kwargs,
                ),
                path,
            )
    def test_routes_use_expected_callbacks(self):
        self.assertIs(
            resolve(self.collection_url).func,
            (
                service_offerings
                .service_offering_collection
            ),
        )
        self.assertIs(
            resolve(self.detail_url).func,
            (
                service_offerings
                .service_offering_detail
            ),
        )
        self.assertIs(
            resolve(self.status_url).func,
            (
                service_offerings
                .service_offering_status
            ),
        )
    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            (
                service_offerings
                .service_offering_collection
                .required_company_permissions
            ),
            service_offerings.ALL_PERMISSIONS,
        )
        self.assertEqual(
            (
                service_offerings
                .service_offering_detail
                .required_company_permissions
            ),
            [
                service_offerings.VIEW_PERMISSION,
                service_offerings.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            (
                service_offerings
                .service_offering_status
                .required_company_permissions
            ),
            [
                service_offerings.STATUS_PERMISSION
            ],
        )
    def test_collection_is_company_scoped(self):
        response = self.client.get(
            self.collection_url
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.offering_a.id,
        )
    def test_collection_filters_and_alias(self):
        response = self.client.get(
            self.collection_url,
            {
                "search": "Dermatology",
                "status": "ACTIVE",
                "branch_id": self.branch_a.id,
                "clinic_id": self.clinic_a.id,
                "online_booking_enabled": "true",
                "ordering": "-duration",
            },
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"],
            response.data["service_offerings"],
        )
    def test_pagination_contract(self):
        response = self.client.get(
            self.collection_url,
            {
                "page": 1,
                "page_size": 1,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["page"], 1)
        self.assertEqual(response.data["page_size"], 1)
        self.assertEqual(response.data["pages"], 1)
    def test_create_derives_company(self):
        response = self.client.post(
            self.collection_url,
            self.create_payload(),
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        created = MedicalServiceOffering.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertEqual(
            created.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            created.catalog_item_id,
            self.service_a_second.id,
        )
        self.assertEqual(
            created.sale_price_override,
            Decimal("425.00"),
        )
        self.assertEqual(
            response.data["item"][
                "total_slot_minutes"
            ],
            65,
        )
        self.assertEqual(
            created.preparation_instructions,
            "Avoid active products",
        )
    def test_product_is_rejected(self):
        payload = self.create_payload()
        payload["catalog_item_id"] = self.product_a.id
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "catalog_item_id",
            response.data["errors"],
        )
    def test_foreign_service_is_rejected(self):
        payload = self.create_payload()
        payload["catalog_item_id"] = self.service_b.id
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "catalog_item_id",
            response.data["errors"],
        )
    def test_foreign_branch_is_rejected(self):
        payload = self.create_payload()
        payload["branch_id"] = self.branch_b.id
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "branch_id",
            response.data["errors"],
        )
    def test_clinic_branch_mismatch_is_rejected(self):
        payload = self.create_payload()
        payload["branch_id"] = (
            self.branch_a_second.id
        )
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "clinic",
            response.data["errors"],
        )
    def test_duplicate_scope_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "catalog_item_id": self.service_a.id,
                "branch_id": self.branch_a.id,
                "department_id": self.department_a.id,
                "specialty_id": self.specialty_a.id,
                "clinic_id": self.clinic_a.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
    def test_detail_serialization(self):
        response = self.client.get(
            self.detail_url
        )
        self.assertEqual(response.status_code, 200)
        item = response.data["item"]
        self.assertEqual(
            item["catalog_item"]["id"],
            self.service_a.id,
        )
        self.assertEqual(
            item["branch"]["id"],
            self.branch_a.id,
        )
        self.assertEqual(
            item["clinic"]["id"],
            self.clinic_a.id,
        )
        self.assertEqual(
            item["effective_sale_price"],
            "300.00",
        )
        self.assertEqual(
            item["total_slot_minutes"],
            45,
        )
    def test_foreign_detail_is_hidden(self):
        response = self.client.get(
            (
                self.collection_url
                + f"{self.offering_b.id}/"
            )
        )
        self.assertEqual(response.status_code, 404)
    def test_detail_update_normalizes(self):
        response = self.client.patch(
            self.detail_url,
            {
                "company_id": self.company_b.id,
                "duration_minutes": 50,
                "buffer_before_minutes": 10,
                "buffer_after_minutes": 5,
                "sale_price_override": "325.50",
                "online_booking_enabled": False,
                "preparation_instructions": (
                    "  Updated instructions  "
                ),
                "notes": "  Updated notes  ",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.offering_a.refresh_from_db()
        self.assertEqual(
            self.offering_a.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            self.offering_a.duration_minutes,
            50,
        )
        self.assertEqual(
            self.offering_a.sale_price_override,
            Decimal("325.50"),
        )
        self.assertEqual(
            self.offering_a.notes,
            "Updated notes",
        )
        self.assertEqual(
            response.data["item"][
                "total_slot_minutes"
            ],
            65,
        )
    def test_invalid_decimal_is_rejected(self):
        response = self.client.patch(
            self.detail_url,
            {
                "sale_price_override": "invalid",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "sale_price_override",
            response.data["errors"],
        )
    def test_status_lifecycle(self):
        for action, expected in (
            ("deactivate", "INACTIVE"),
            ("activate", "ACTIVE"),
            ("archive", "ARCHIVED"),
        ):
            response = self.client.post(
                self.status_url,
                {
                    "action": action,
                },
                format="json",
            )
            self.assertEqual(
                response.status_code,
                200,
                response.data,
            )
            self.assertEqual(
                response.data["item"]["status"],
                expected,
            )
    def test_invalid_status_is_rejected(self):
        response = self.client.post(
            self.status_url,
            {
                "status": "UNKNOWN",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
    def test_invalid_filter_is_rejected(self):
        response = self.client.get(
            self.collection_url,
            {
                "status": "UNKNOWN",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "status",
            response.data["errors"],
        )
    def test_inactive_catalog_blocks_activation(self):
        self.offering_a.status = (
            MedicalServiceOfferingStatus.INACTIVE
        )
        self.offering_a.save()
        self.service_a.status = "INACTIVE"
        self.service_a.save()
        response = self.client.post(
            self.status_url,
            {
                "action": "activate",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "catalog_item",
            response.data["errors"],
        )
    def test_status_values_match_model(self):
        expected = {
            value
            for value, _label in (
                MedicalServiceOfferingStatus.choices
            )
        }
        self.assertEqual(
            service_offerings.VALID_STATUS_VALUES,
            expected,
        )
