from __future__ import annotations

from datetime import timedelta

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
from companies.models import Company
from medical.models import (
    MedicalAppointment,
    MedicalEncounter,
    MedicalEncounterStatus,
    MedicalPatient,
)

from api.company.medical import encounters


class CompanyMedicalEncounterApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="encounter-api-owner",
            email="encounter-api@example.com",
            password="test-pass",
        )
        self.company_a = Company.objects.create(
            name="Encounter API Company A",
            company_code="ENC-API-A",
        )
        self.company_b = Company.objects.create(
            name="Encounter API Company B",
            company_code="ENC-API-B",
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            display_name="Encounter API Owner",
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
            patient_number="PAT-A",
            full_name="Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="PAT-B",
            full_name="Patient B",
        )
        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="ENC-A-001",
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            encounter_number="ENC-B-001",
        )
        self.client.force_authenticate(user=self.user)

    def test_routes_are_registered(self):
        paths = [
            "/api/company/medical/encounters/",
            "/api/company/medical/encounters/1/",
            "/api/company/medical/encounters/1/status/",
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
            resolve(
                "/api/company/medical/encounters/"
            ).func,
            encounters.encounter_collection,
        )
        self.assertIs(
            resolve(
                "/api/company/medical/encounters/1/"
            ).func,
            encounters.encounter_detail,
        )
        self.assertIs(
            resolve(
                "/api/company/medical/encounters/1/status/"
            ).func,
            encounters.encounter_status,
        )

    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            encounters.encounter_collection
            .required_company_permissions,
            encounters.ALL_PERMISSIONS,
        )
        self.assertEqual(
            encounters.encounter_detail
            .required_company_permissions,
            [
                encounters.VIEW_PERMISSION,
                encounters.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            encounters.encounter_status
            .required_company_permissions,
            [encounters.STATUS_PERMISSION],
        )

    def test_collection_is_company_scoped(self):
        response = self.client.get(
            "/api/company/medical/encounters/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.encounter_a.id,
        )

    def test_create_ignores_company_id(self):
        response = self.client.post(
            "/api/company/medical/encounters/",
            {
                "company_id": self.company_b.id,
                "patient_id": self.patient_a.id,
                "chief_complaint": "  Skin concern  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created = MedicalEncounter.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertEqual(created.company_id, self.company_a.id)
        self.assertEqual(created.chief_complaint, "Skin concern")

    def test_create_from_appointment_derives_patient(self):
        appointment = MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            appointment_number="APT-ENC-001",
            scheduled_start=timezone.now(),
            scheduled_end=(
                timezone.now() + timedelta(minutes=30)
            ),
        )
        response = self.client.post(
            "/api/company/medical/encounters/",
            {
                "appointment_id": appointment.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created = MedicalEncounter.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertEqual(created.patient_id, self.patient_a.id)
        self.assertEqual(created.appointment_id, appointment.id)

    def test_create_rejects_foreign_patient(self):
        response = self.client.post(
            "/api/company/medical/encounters/",
            {
                "patient_id": self.patient_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn("patient_id", response.data["errors"])

    def test_detail_does_not_expose_other_company(self):
        response = self.client.get(
            (
                "/api/company/medical/encounters/"
                f"{self.encounter_b.id}/"
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_status_lifecycle_sets_closure_fields(self):
        base = (
            "/api/company/medical/encounters/"
            f"{self.encounter_a.id}/status/"
        )

        open_response = self.client.post(
            base,
            {"status": MedicalEncounterStatus.OPEN},
            format="json",
        )
        self.assertEqual(open_response.status_code, 200)

        progress_response = self.client.post(
            base,
            {
                "status": (
                    MedicalEncounterStatus.IN_PROGRESS
                )
            },
            format="json",
        )
        self.assertEqual(progress_response.status_code, 200)

        complete_response = self.client.post(
            base,
            {"status": MedicalEncounterStatus.COMPLETED},
            format="json",
        )
        self.assertEqual(complete_response.status_code, 200)

        self.encounter_a.refresh_from_db()
        self.assertEqual(
            self.encounter_a.status,
            MedicalEncounterStatus.COMPLETED,
        )
        self.assertIsNotNone(self.encounter_a.closed_at)
        self.assertEqual(
            self.encounter_a.closed_by_id,
            self.user.id,
        )

    def test_invalid_status_transition_is_rejected(self):
        response = self.client.post(
            (
                "/api/company/medical/encounters/"
                f"{self.encounter_a.id}/status/"
            ),
            {"status": MedicalEncounterStatus.COMPLETED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.encounter_a.refresh_from_db()
        self.assertEqual(
            self.encounter_a.status,
            MedicalEncounterStatus.DRAFT,
        )
