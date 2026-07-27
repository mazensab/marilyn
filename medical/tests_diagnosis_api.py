from __future__ import annotations

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
    MedicalDiagnosis,
    MedicalEncounter,
    MedicalEncounterStatus,
    MedicalPatient,
)

from api.company.medical import diagnoses


class CompanyMedicalDiagnosisApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = get_user_model().objects.create_user(
            username="diagnosis-api-owner",
            email="diagnosis-api@example.com",
            password="test-pass",
        )

        self.company_a = Company.objects.create(
            name="Diagnosis API Company A",
            company_code="DIA-API-A",
        )
        self.company_b = Company.objects.create(
            name="Diagnosis API Company B",
            company_code="DIA-API-B",
        )

        self.profile = UserProfile.objects.create(
            user=self.user,
            display_name="Diagnosis API Owner",
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
            patient_number="DIA-PAT-A",
            full_name="Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="DIA-PAT-B",
            full_name="Patient B",
        )

        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="DIA-ENC-A",
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            encounter_number="DIA-ENC-B",
        )

        self.diagnosis_a = MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_code="L30.9",
            diagnosis_name="Dermatitis",
            is_primary=True,
        )
        self.diagnosis_b = MedicalDiagnosis.objects.create(
            company=self.company_b,
            encounter=self.encounter_b,
            patient=self.patient_b,
            diagnosis_code="L40.9",
            diagnosis_name="Psoriasis",
            is_primary=True,
        )

        self.collection_url = (
            "/api/company/medical/encounters/"
            f"{self.encounter_a.id}/diagnoses/"
        )
        self.detail_url = (
            self.collection_url
            + f"{self.diagnosis_a.id}/"
        )
        self.primary_url = (
            self.collection_url
            + f"{self.diagnosis_a.id}/primary/"
        )

        self.client.force_authenticate(user=self.user)

    def test_routes_are_registered(self):
        paths = [
            self.collection_url,
            self.detail_url,
            self.primary_url,
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
            diagnoses.diagnosis_collection,
        )
        self.assertIs(
            resolve(self.detail_url).func,
            diagnoses.diagnosis_detail,
        )
        self.assertIs(
            resolve(self.primary_url).func,
            diagnoses.diagnosis_primary,
        )

    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            diagnoses.diagnosis_collection
            .required_company_permissions,
            diagnoses.ALL_PERMISSIONS,
        )
        self.assertEqual(
            diagnoses.diagnosis_detail
            .required_company_permissions,
            [
                diagnoses.VIEW_PERMISSION,
                diagnoses.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            diagnoses.diagnosis_primary
            .required_company_permissions,
            [diagnoses.PRIMARY_PERMISSION],
        )

    def test_collection_is_encounter_and_company_scoped(self):
        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.diagnosis_a.id,
        )

    def test_create_derives_company_patient_and_normalizes(self):
        response = self.client.post(
            self.collection_url,
            {
                "company_id": self.company_b.id,
                "patient_id": self.patient_b.id,
                "diagnosis_code": " e66.9 ",
                "diagnosis_name": "  Obesity  ",
                "notes": "  Initial finding  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        created = MedicalDiagnosis.objects.get(
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
        self.assertEqual(created.diagnosis_code, "E66.9")
        self.assertEqual(created.diagnosis_name, "Obesity")
        self.assertEqual(created.notes, "Initial finding")

    def test_create_primary_demotes_previous_primary(self):
        response = self.client.post(
            self.collection_url,
            {
                "diagnosis_code": "L70.0",
                "diagnosis_name": "Acne vulgaris",
                "is_primary": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.diagnosis_a.refresh_from_db()
        created = MedicalDiagnosis.objects.get(
            id=response.data["item"]["id"]
        )

        self.assertFalse(self.diagnosis_a.is_primary)
        self.assertTrue(created.is_primary)
        self.assertEqual(
            MedicalDiagnosis.objects.filter(
                encounter=self.encounter_a,
                is_primary=True,
            ).count(),
            1,
        )

    def test_primary_action_demotes_existing_primary(self):
        secondary = MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_code="Z09",
            diagnosis_name="Follow-up examination",
            is_primary=False,
        )

        response = self.client.post(
            self.collection_url
            + f"{secondary.id}/primary/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.diagnosis_a.refresh_from_db()
        secondary.refresh_from_db()

        self.assertFalse(self.diagnosis_a.is_primary)
        self.assertTrue(secondary.is_primary)

    def test_detail_update_normalizes_values(self):
        response = self.client.patch(
            self.detail_url,
            {
                "diagnosis_code": " l30.8 ",
                "diagnosis_name": "  Other dermatitis  ",
                "notes": "  Updated note  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.diagnosis_a.refresh_from_db()
        self.assertEqual(
            self.diagnosis_a.diagnosis_code,
            "L30.8",
        )
        self.assertEqual(
            self.diagnosis_a.diagnosis_name,
            "Other dermatitis",
        )
        self.assertEqual(
            self.diagnosis_a.notes,
            "Updated note",
        )

    def test_foreign_encounter_is_not_exposed(self):
        response = self.client.get(
            (
                "/api/company/medical/encounters/"
                f"{self.encounter_b.id}/diagnoses/"
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_foreign_diagnosis_is_not_exposed(self):
        response = self.client.get(
            self.collection_url
            + f"{self.diagnosis_b.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_blank_diagnosis_name_is_rejected(self):
        response = self.client.post(
            self.collection_url,
            {
                "diagnosis_code": "X00",
                "diagnosis_name": "   ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn(
            "diagnosis_name",
            response.data["errors"],
        )

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
                "diagnosis_name": "Blocked diagnosis",
            },
            format="json",
        )

        update_response = self.client.patch(
            self.detail_url,
            {
                "diagnosis_name": "Blocked update",
            },
            format="json",
        )

        primary_response = self.client.post(
            self.primary_url,
            {},
            format="json",
        )

        self.assertEqual(create_response.status_code, 400)
        self.assertEqual(update_response.status_code, 400)
        self.assertEqual(primary_response.status_code, 400)
