from __future__ import annotations

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
from catalog.models import CatalogItem, CatalogItemType
from companies.models import Company
from medical.models import (
    MedicalEncounter,
    MedicalEncounterStatus,
    MedicalPatient,
    MedicalProcedure,
    MedicalProcedureStatus,
)

from api.company.medical import procedures


class CompanyMedicalProcedureApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = get_user_model().objects.create_user(
            username="procedure-api-owner",
            email="procedure-api@example.com",
            password="test-pass",
        )

        self.company_a = Company.objects.create(
            name="Procedure API Company A",
            company_code="PROC-API-A",
        )
        self.company_b = Company.objects.create(
            name="Procedure API Company B",
            company_code="PROC-API-B",
        )

        self.profile = UserProfile.objects.create(
            user=self.user,
            display_name="Procedure API Owner",
            default_company=self.company_a,
        )
        self.membership = CompanyMembership.objects.create(
            user=self.user,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )

        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="PROC-PAT-A",
            full_name="Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="PROC-PAT-B",
            full_name="Patient B",
        )

        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="PROC-ENC-A",
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            encounter_number="PROC-ENC-B",
        )

        self.service_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type=CatalogItemType.SERVICE,
            code="PROC-SRV-A",
            name="Laser Procedure",
            sale_price=Decimal("450.00"),
        )
        self.service_a_two = CatalogItem.objects.create(
            company=self.company_a,
            item_type=CatalogItemType.SERVICE,
            code="PROC-SRV-A2",
            name="Injection Procedure",
            sale_price=Decimal("275.00"),
        )
        self.product_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type=CatalogItemType.PRODUCT,
            code="PROC-PRD-A",
            name="Medical Product",
            sale_price=Decimal("50.00"),
        )
        self.service_b = CatalogItem.objects.create(
            company=self.company_b,
            item_type=CatalogItemType.SERVICE,
            code="PROC-SRV-B",
            name="Foreign Procedure",
            sale_price=Decimal("600.00"),
        )

        self.procedure_a = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            catalog_item=self.service_a,
        )
        self.procedure_b = MedicalProcedure.objects.create(
            company=self.company_b,
            encounter=self.encounter_b,
            patient=self.patient_b,
            catalog_item=self.service_b,
        )

        self.collection_url = (
            "/api/company/medical/encounters/"
            f"{self.encounter_a.id}/procedures/"
        )
        self.detail_url = (
            self.collection_url
            + f"{self.procedure_a.id}/"
        )
        self.status_url = (
            self.collection_url
            + f"{self.procedure_a.id}/status/"
        )

        self.client.force_authenticate(user=self.user)

    def test_routes_are_registered(self):
        paths = [
            self.collection_url,
            self.detail_url,
            self.status_url,
        ]

        for route_path in paths:
            match = resolve(route_path)
            self.assertEqual(
                reverse(
                    match.view_name,
                    kwargs=match.kwargs,
                ),
                route_path,
            )

    def test_routes_use_expected_callbacks(self):
        self.assertIs(
            resolve(self.collection_url).func,
            procedures.procedure_collection,
        )
        self.assertIs(
            resolve(self.detail_url).func,
            procedures.procedure_detail,
        )
        self.assertIs(
            resolve(self.status_url).func,
            procedures.procedure_status,
        )

    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            procedures.procedure_collection
            .required_company_permissions,
            procedures.ALL_PERMISSIONS,
        )
        self.assertEqual(
            procedures.procedure_detail
            .required_company_permissions,
            [
                procedures.VIEW_PERMISSION,
                procedures.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            procedures.procedure_status
            .required_company_permissions,
            [procedures.STATUS_PERMISSION],
        )

    def test_collection_is_encounter_and_company_scoped(self):
        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.procedure_a.id,
        )

    def test_create_from_catalog_derives_scope_and_snapshots(self):
        response = self.client.post(
            self.collection_url,
            {
                "company_id": self.company_b.id,
                "patient_id": self.patient_b.id,
                "catalog_item_id": self.service_a_two.id,
                "quantity": "2.000",
                "notes": "  First session  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        created = MedicalProcedure.objects.get(
            id=response.data["item"]["id"]
        )

        self.assertEqual(
            created.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            created.encounter_id,
            self.encounter_a.id,
        )
        self.assertEqual(
            created.patient_id,
            self.patient_a.id,
        )
        self.assertEqual(
            created.catalog_item_id,
            self.service_a_two.id,
        )
        self.assertEqual(
            created.procedure_code_snapshot,
            "PROC-SRV-A2",
        )
        self.assertEqual(
            created.procedure_name_snapshot,
            "Injection Procedure",
        )
        self.assertEqual(
            created.unit_price_snapshot,
            Decimal("275.00"),
        )
        self.assertEqual(
            created.quantity,
            Decimal("2.000"),
        )
        self.assertEqual(created.notes, "First session")
        self.assertEqual(
            created.status,
            MedicalProcedureStatus.PLANNED,
        )

    def test_create_manual_procedure_normalizes_values(self):
        response = self.client.post(
            self.collection_url,
            {
                "procedure_code_snapshot": " manual-002 ",
                "procedure_name_snapshot": "  Manual procedure  ",
                "quantity": "1.500",
                "unit_price_snapshot": "125.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        created = MedicalProcedure.objects.get(
            id=response.data["item"]["id"]
        )

        self.assertIsNone(created.catalog_item_id)
        self.assertEqual(
            created.procedure_code_snapshot,
            "MANUAL-002",
        )
        self.assertEqual(
            created.procedure_name_snapshot,
            "Manual procedure",
        )
        self.assertEqual(
            created.quantity,
            Decimal("1.500"),
        )
        self.assertEqual(
            created.unit_price_snapshot,
            Decimal("125.00"),
        )

    def test_product_catalog_item_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "catalog_item_id": self.product_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn(
            "catalog_item_id",
            response.data["errors"],
        )

    def test_foreign_catalog_item_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "catalog_item_id": self.service_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn(
            "catalog_item_id",
            response.data["errors"],
        )

    def test_foreign_encounter_is_not_exposed(self):
        response = self.client.get(
            (
                "/api/company/medical/encounters/"
                f"{self.encounter_b.id}/procedures/"
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_foreign_procedure_is_not_exposed(self):
        response = self.client.get(
            self.collection_url
            + f"{self.procedure_b.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_detail_update_normalizes_and_can_change_service(self):
        response = self.client.patch(
            self.detail_url,
            {
                "catalog_item_id": self.service_a_two.id,
                "quantity": "3.000",
                "notes": "  Updated note  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.procedure_a.refresh_from_db()

        self.assertEqual(
            self.procedure_a.catalog_item_id,
            self.service_a_two.id,
        )
        self.assertEqual(
            self.procedure_a.procedure_code_snapshot,
            "PROC-SRV-A2",
        )
        self.assertEqual(
            self.procedure_a.procedure_name_snapshot,
            "Injection Procedure",
        )
        self.assertEqual(
            self.procedure_a.unit_price_snapshot,
            Decimal("275.00"),
        )
        self.assertEqual(
            self.procedure_a.quantity,
            Decimal("3.000"),
        )
        self.assertEqual(
            self.procedure_a.notes,
            "Updated note",
        )

    def test_invalid_quantity_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "procedure_name_snapshot": "Invalid quantity",
                "quantity": "0",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn(
            "quantity",
            response.data["errors"],
        )

    def test_status_lifecycle_sets_performed_time(self):
        progress_response = self.client.post(
            self.status_url,
            {"status": MedicalProcedureStatus.IN_PROGRESS},
            format="json",
        )

        self.assertEqual(progress_response.status_code, 200)

        completed_response = self.client.post(
            self.status_url,
            {"status": MedicalProcedureStatus.COMPLETED},
            format="json",
        )

        self.assertEqual(completed_response.status_code, 200)

        self.procedure_a.refresh_from_db()
        self.assertEqual(
            self.procedure_a.status,
            MedicalProcedureStatus.COMPLETED,
        )
        self.assertIsNotNone(self.procedure_a.performed_at)
        self.assertEqual(
            self.procedure_a.updated_by_id,
            self.user.id,
        )

    def test_cancel_status_requires_reason(self):
        missing_reason = self.client.post(
            self.status_url,
            {"status": MedicalProcedureStatus.CANCELLED},
            format="json",
        )

        self.assertEqual(missing_reason.status_code, 400)

        cancelled = self.client.post(
            self.status_url,
            {
                "status": MedicalProcedureStatus.CANCELLED,
                "cancellation_reason": "  Patient request  ",
            },
            format="json",
        )

        self.assertEqual(cancelled.status_code, 200)

        self.procedure_a.refresh_from_db()
        self.assertEqual(
            self.procedure_a.status,
            MedicalProcedureStatus.CANCELLED,
        )
        self.assertEqual(
            self.procedure_a.cancellation_reason,
            "Patient request",
        )

    def test_invalid_status_transition_is_rejected(self):
        complete_response = self.client.post(
            self.status_url,
            {"status": MedicalProcedureStatus.COMPLETED},
            format="json",
        )
        self.assertEqual(complete_response.status_code, 200)

        invalid_response = self.client.post(
            self.status_url,
            {"status": MedicalProcedureStatus.IN_PROGRESS},
            format="json",
        )

        self.assertEqual(invalid_response.status_code, 400)

        self.procedure_a.refresh_from_db()
        self.assertEqual(
            self.procedure_a.status,
            MedicalProcedureStatus.COMPLETED,
        )

    def test_terminal_procedure_blocks_detail_mutation(self):
        self.procedure_a.status = (
            MedicalProcedureStatus.COMPLETED
        )
        self.procedure_a.performed_at = timezone.now()
        self.procedure_a.save()

        response = self.client.patch(
            self.detail_url,
            {
                "procedure_name_snapshot": (
                    "Blocked update"
                )
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_terminal_encounter_blocks_mutation(self):
        self.encounter_a.status = (
            MedicalEncounterStatus.COMPLETED
        )
        self.encounter_a.closed_at = timezone.now()
        self.encounter_a.closed_by = self.user
        self.encounter_a.save()

        create_response = self.client.post(
            self.collection_url,
            {
                "procedure_name_snapshot": (
                    "Blocked procedure"
                )
            },
            format="json",
        )

        status_response = self.client.post(
            self.status_url,
            {
                "status": (
                    MedicalProcedureStatus.IN_PROGRESS
                )
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 400)
        self.assertEqual(status_response.status_code, 400)
