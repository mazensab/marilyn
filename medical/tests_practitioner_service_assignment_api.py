from __future__ import annotations
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve, reverse
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import (
    CompanyMembership,
    CompanyRole,
    UserProfile,
)
from catalog.models import CatalogItem
from medical.models import (
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerServiceAssignmentStatus,
    MedicalServiceOffering,
)
from api.company.medical import (
    practitioner_service_assignments,
)
User = get_user_model()
class CompanyPractitionerServiceAssignmentApiTests(
    TestCase
):
    def setUp(self) -> None:
        from medical.tests_practitioner_service_assignment_foundation import (
            PractitionerServiceAssignmentFoundationTests,
        )
        PractitionerServiceAssignmentFoundationTests.setUp(
            self
        )
        self.user = User.objects.create_user(
            username="practitioner-service-api-owner",
            email=(
                "practitioner-service-api@example.com"
            ),
            password="StrongPass123!",
        )
        UserProfile.objects.update_or_create(
            user=self.user,
            defaults={
                "display_name": (
                    "Practitioner Service API Owner"
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
                code="PSA-API-SERVICE-A2",
                name="Second Medical Service",
                name_ar="خدمة طبية ثانية",
                sale_price=Decimal("375.00"),
                taxable=True,
                tax_rate=Decimal("15.00"),
                is_sellable=True,
            )
        )
        self.offering_a_second_service = (
            MedicalServiceOffering.objects.create(
                company=self.company_a,
                catalog_item=self.service_a_second,
                branch=self.branch_a,
                department=self.department_a,
                specialty=self.specialty_a,
                clinic=self.clinic_a,
                duration_minutes=35,
                buffer_before_minutes=5,
                buffer_after_minutes=5,
                online_booking_enabled=True,
            )
        )
        self.link_a = (
            MedicalPractitionerServiceAssignment
            .objects
            .create(
                company=self.company_a,
                practitioner_assignment=(
                    self.assignment_a
                ),
                service_offering=self.offering_a,
                status=(
                    MedicalPractitionerServiceAssignmentStatus
                    .ACTIVE
                ),
                notes="Primary practitioner service",
            )
        )
        self.link_b = (
            MedicalPractitionerServiceAssignment
            .objects
            .create(
                company=self.company_b,
                practitioner_assignment=(
                    self.assignment_b
                ),
                service_offering=self.offering_b,
                status=(
                    MedicalPractitionerServiceAssignmentStatus
                    .ACTIVE
                ),
            )
        )
        self.collection_url = (
            "/api/company/medical/"
            "practitioner-service-assignments/"
        )
        self.detail_url = (
            self.collection_url
            + f"{self.link_a.id}/"
        )
        self.status_url = (
            self.detail_url + "status/"
        )
        self.client = APIClient()
        self.client.force_authenticate(
            user=self.user
        )
    def create_payload(self):
        today = timezone.localdate()
        return {
            "company_id": self.company_b.id,
            "practitioner_assignment_id": (
                self.assignment_a.id
            ),
            "service_offering_id": (
                self.offering_a_second_service.id
            ),
            "duration_override_minutes": 50,
            "online_booking_enabled": False,
            "effective_from": today.isoformat(),
            "effective_until": (
                today + timedelta(days=30)
            ).isoformat(),
            "notes": "  API service assignment  ",
            "extra_data": {
                "source": "api-test",
            },
        }
    def create_second_link(self, **overrides):
        payload = {
            "company": self.company_a,
            "practitioner_assignment": (
                self.assignment_a
            ),
            "service_offering": (
                self.offering_a_second_service
            ),
            "status": (
                MedicalPractitionerServiceAssignmentStatus
                .ACTIVE
            ),
        }
        payload.update(overrides)
        return (
            MedicalPractitionerServiceAssignment
            .objects
            .create(**payload)
        )
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
                practitioner_service_assignments
                .practitioner_service_assignment_collection
            ),
        )
        self.assertIs(
            resolve(self.detail_url).func,
            (
                practitioner_service_assignments
                .practitioner_service_assignment_detail
            ),
        )
        self.assertIs(
            resolve(self.status_url).func,
            (
                practitioner_service_assignments
                .practitioner_service_assignment_status
            ),
        )
    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            (
                practitioner_service_assignments
                .practitioner_service_assignment_collection
                .required_company_permissions
            ),
            (
                practitioner_service_assignments
                .ALL_PERMISSIONS
            ),
        )
        self.assertEqual(
            (
                practitioner_service_assignments
                .practitioner_service_assignment_detail
                .required_company_permissions
            ),
            [
                (
                    practitioner_service_assignments
                    .VIEW_PERMISSION
                ),
                (
                    practitioner_service_assignments
                    .UPDATE_PERMISSION
                ),
            ],
        )
        self.assertEqual(
            (
                practitioner_service_assignments
                .practitioner_service_assignment_status
                .required_company_permissions
            ),
            [
                (
                    practitioner_service_assignments
                    .STATUS_PERMISSION
                )
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
            self.link_a.id,
        )
    def test_collection_filters_and_alias(self):
        today = timezone.localdate()
        response = self.client.get(
            self.collection_url,
            {
                "search": "Service Doctor A",
                "status": "ACTIVE",
                "practitioner_id": (
                    self.practitioner_a.id
                ),
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "service_offering_id": (
                    self.offering_a.id
                ),
                "catalog_item_id": self.service_a.id,
                "branch_id": self.branch_a.id,
                "department_id": (
                    self.department_a.id
                ),
                "specialty_id": self.specialty_a.id,
                "clinic_id": self.clinic_a.id,
                "online_booking_enabled": "true",
                "is_active": "true",
                "effective_on": today.isoformat(),
                "ordering": "-created_at",
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
            response.data[
                "practitioner_service_assignments"
            ],
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
        self.assertEqual(len(response.data["items"]), 1)
    def test_create_derives_company_and_serializes(
        self,
    ):
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
        created = (
            MedicalPractitionerServiceAssignment
            .objects
            .get(
                id=response.data["item"]["id"]
            )
        )
        self.assertEqual(
            created.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            created.practitioner_id,
            self.practitioner_a.id,
        )
        self.assertEqual(
            created.service_offering_id,
            self.offering_a_second_service.id,
        )
        self.assertEqual(
            created.duration_override_minutes,
            50,
        )
        self.assertFalse(
            created.online_booking_enabled
        )
        self.assertEqual(
            created.notes,
            "API service assignment",
        )
        self.assertEqual(
            response.data["item"][
                "effective_duration_minutes"
            ],
            50,
        )
        self.assertEqual(
            response.data["item"][
                "total_slot_minutes"
            ],
            60,
        )
        self.assertFalse(
            response.data["item"][
                "effective_online_booking_enabled"
            ]
        )
    def test_create_requires_relation_ids(self):
        response = self.client.post(
            self.collection_url,
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "practitioner_assignment_id",
            response.data["errors"],
        )
    def test_foreign_practitioner_assignment_rejected(
        self,
    ):
        payload = self.create_payload()
        payload["practitioner_assignment_id"] = (
            self.assignment_b.id
        )
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "practitioner_assignment_id",
            response.data["errors"],
        )
    def test_foreign_service_offering_rejected(self):
        payload = self.create_payload()
        payload["service_offering_id"] = (
            self.offering_b.id
        )
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "service_offering_id",
            response.data["errors"],
        )
    def test_location_mismatch_is_rejected(self):
        payload = self.create_payload()
        payload["practitioner_assignment_id"] = (
            self.assignment_a_second.id
        )
        response = self.client.post(
            self.collection_url,
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "service_offering",
            response.data["errors"],
        )
    def test_duplicate_scope_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "service_offering_id": (
                    self.offering_a.id
                ),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
    def test_detail_serialization(self):
        response = self.client.get(
            self.detail_url
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        item = response.data["item"]
        self.assertEqual(
            item["practitioner_id"],
            self.practitioner_a.id,
        )
        self.assertEqual(
            item["practitioner_assignment"]["id"],
            self.assignment_a.id,
        )
        self.assertEqual(
            item["service_offering"]["id"],
            self.offering_a.id,
        )
        self.assertEqual(
            item["effective_duration_minutes"],
            30,
        )
        self.assertEqual(
            item["total_slot_minutes"],
            45,
        )
        self.assertTrue(
            item["effective_online_booking_enabled"]
        )
        self.assertTrue(
            item["is_active_service_assignment"]
        )
    def test_foreign_detail_is_hidden(self):
        response = self.client.get(
            (
                self.collection_url
                + f"{self.link_b.id}/"
            )
        )
        self.assertEqual(response.status_code, 404)
    def test_detail_update_normalizes(self):
        today = timezone.localdate()
        response = self.client.patch(
            self.detail_url,
            {
                "company_id": self.company_b.id,
                "duration_override_minutes": 40,
                "online_booking_enabled": False,
                "effective_from": today.isoformat(),
                "effective_until": (
                    today + timedelta(days=5)
                ).isoformat(),
                "notes": "  Updated assignment  ",
                "extra_data": {
                    "updated": True,
                },
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.link_a.refresh_from_db()
        self.assertEqual(
            self.link_a.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            self.link_a.duration_override_minutes,
            40,
        )
        self.assertFalse(
            self.link_a.online_booking_enabled
        )
        self.assertEqual(
            self.link_a.notes,
            "Updated assignment",
        )
        self.assertEqual(
            response.data["item"][
                "total_slot_minutes"
            ],
            55,
        )
    def test_invalid_duration_is_rejected(self):
        response = self.client.patch(
            self.detail_url,
            {
                "duration_override_minutes": 0,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "duration_override_minutes",
            response.data["errors"],
        )
    def test_invalid_date_range_is_rejected(self):
        today = timezone.localdate()
        response = self.client.patch(
            self.detail_url,
            {
                "effective_from": (
                    today + timedelta(days=10)
                ).isoformat(),
                "effective_until": (
                    today + timedelta(days=1)
                ).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "effective_until",
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
    def test_inactive_dependency_blocks_activation(
        self,
    ):
        self.link_a.status = (
            MedicalPractitionerServiceAssignmentStatus
            .INACTIVE
        )
        self.link_a.save()
        self.assignment_a.is_active = False
        self.assignment_a.save()
        response = self.client.post(
            self.status_url,
            {
                "action": "activate",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "practitioner_assignment",
            response.data["errors"],
        )
    def test_effective_on_filter(self):
        today = timezone.localdate()
        future = self.create_second_link(
            effective_from=(
                today + timedelta(days=10)
            ),
        )
        current_response = self.client.get(
            self.collection_url,
            {
                "effective_on": today.isoformat(),
            },
        )
        self.assertEqual(
            current_response.status_code,
            200,
            current_response.data,
        )
        self.assertEqual(
            current_response.data["count"],
            1,
        )
        self.assertEqual(
            current_response.data["items"][0]["id"],
            self.link_a.id,
        )
        future_response = self.client.get(
            self.collection_url,
            {
                "effective_on": (
                    today + timedelta(days=15)
                ).isoformat(),
            },
        )
        self.assertEqual(
            future_response.status_code,
            200,
            future_response.data,
        )
        self.assertEqual(
            future_response.data["count"],
            2,
        )
        self.assertIn(
            future.id,
            {
                item["id"]
                for item in future_response.data["items"]
            },
        )
    def test_is_active_filter(self):
        inactive = self.create_second_link(
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        active_response = self.client.get(
            self.collection_url,
            {
                "is_active": "true",
            },
        )
        self.assertEqual(
            active_response.status_code,
            200,
            active_response.data,
        )
        self.assertEqual(
            active_response.data["count"],
            1,
        )
        self.assertEqual(
            active_response.data["items"][0]["id"],
            self.link_a.id,
        )
        inactive_response = self.client.get(
            self.collection_url,
            {
                "is_active": "false",
            },
        )
        self.assertEqual(
            inactive_response.status_code,
            200,
            inactive_response.data,
        )
        self.assertEqual(
            inactive_response.data["count"],
            1,
        )
        self.assertEqual(
            inactive_response.data["items"][0]["id"],
            inactive.id,
        )
    def test_effective_online_booking_filter(self):
        disabled = self.create_second_link(
            online_booking_enabled=False,
        )
        enabled_response = self.client.get(
            self.collection_url,
            {
                "online_booking_enabled": "true",
            },
        )
        self.assertEqual(
            enabled_response.status_code,
            200,
            enabled_response.data,
        )
        self.assertEqual(
            enabled_response.data["count"],
            1,
        )
        self.assertEqual(
            enabled_response.data["items"][0]["id"],
            self.link_a.id,
        )
        disabled_response = self.client.get(
            self.collection_url,
            {
                "online_booking_enabled": "false",
            },
        )
        self.assertEqual(
            disabled_response.status_code,
            200,
            disabled_response.data,
        )
        self.assertEqual(
            disabled_response.data["count"],
            1,
        )
        self.assertEqual(
            disabled_response.data["items"][0]["id"],
            disabled.id,
        )
    def test_invalid_filter_is_rejected(self):
        response = self.client.get(
            self.collection_url,
            {
                "is_active": "invalid",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "is_active",
            response.data["errors"],
        )
