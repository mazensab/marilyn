from __future__ import annotations
from datetime import timedelta
from decimal import Decimal
from typing import Any
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import (
    CompanyMembership,
    CompanyRole,
)
from companies.models import Branch, Company
from medical.models import (
    MedicalAppointment,
    MedicalDiagnosis,
    MedicalEncounter,
    MedicalPatient,
    MedicalPractitioner,
    MedicalProcedure,
    MedicalRecordShareScope,
    MedicalReferral,
    MedicalReferralAccessStatus,
    MedicalReferralRecordAccess,
)
from api.company.medical.patient_medical_file import (
    REQUIRED_VIEW_PERMISSIONS,
    patient_medical_file,
)
User = get_user_model()
def create_company(
    *,
    code: str,
    name: str,
) -> Company:
    fields = {
        field.name
        for field in Company._meta.fields
    }
    payload: dict[str, Any] = {}
    if "company_code" in fields:
        payload["company_code"] = code
    if "code" in fields:
        payload["code"] = code
    if "name" in fields:
        payload["name"] = name
    if "company_name" in fields:
        payload["company_name"] = name
    if "display_name" in fields:
        payload["display_name"] = name
    if "legal_name" in fields:
        payload["legal_name"] = name
    if "currency_code" in fields:
        payload["currency_code"] = "SAR"
    if "currency" in fields:
        payload["currency"] = "SAR"
    if "is_active" in fields:
        payload["is_active"] = True
    return Company.objects.create(**payload)
def create_branch(
    *,
    company: Company,
    code: str,
    name: str,
) -> Branch:
    fields = {
        field.name
        for field in Branch._meta.fields
    }
    payload: dict[str, Any] = {
        "company": company,
    }
    if "branch_code" in fields:
        payload["branch_code"] = code
    if "code" in fields:
        payload["code"] = code
    if "name" in fields:
        payload["name"] = name
    if "branch_name" in fields:
        payload["branch_name"] = name
    if "display_name" in fields:
        payload["display_name"] = name
    if "is_active" in fields:
        payload["is_active"] = True
    if "status" in fields:
        payload["status"] = "ACTIVE"
    return Branch.objects.create(**payload)
class CompanyPatientMedicalFileApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.now = timezone.now()
        self.company_a = create_company(
            code="PMF-A",
            name="Patient Medical File Company A",
        )
        self.company_b = create_company(
            code="PMF-B",
            name="Patient Medical File Company B",
        )
        self.branch_a = create_branch(
            company=self.company_a,
            code="PMF-A-MAIN",
            name="Medical File Branch A",
        )
        self.branch_b = create_branch(
            company=self.company_b,
            code="PMF-B-MAIN",
            name="Medical File Branch B",
        )
        self.owner = User.objects.create_user(
            username="patient-medical-file-owner",
            email="patient-medical-file@example.com",
            password="StrongPass123!",
        )
        CompanyMembership.objects.create(
            user=self.owner,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )
        self.patient = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="PMF-PAT-001",
            full_name="Medical File Patient",
        )
        self.empty_patient = (
            MedicalPatient.objects.create(
                company=self.company_a,
                registration_branch=self.branch_a,
                patient_number="PMF-PAT-002",
                full_name="Empty Medical File Patient",
            )
        )
        self.foreign_patient = (
            MedicalPatient.objects.create(
                company=self.company_b,
                registration_branch=self.branch_b,
                patient_number="PMF-PAT-B-001",
                full_name="Foreign Medical File Patient",
            )
        )
        self.source_practitioner = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                practitioner_number="PMF-DR-001",
                full_name_en="Dr. Source",
            )
        )
        self.receiving_practitioner = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                practitioner_number="PMF-DR-002",
                full_name_en="Dr. Receiving",
            )
        )
        self.appointment = (
            MedicalAppointment.objects.create(
                company=self.company_a,
                patient=self.patient,
                practitioner=self.source_practitioner,
                branch=self.branch_a,
                appointment_number="PMF-APT-001",
                scheduled_start=(
                    self.now + timedelta(days=1)
                ),
                scheduled_end=(
                    self.now
                    + timedelta(days=1, minutes=30)
                ),
            )
        )
        self.encounter = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient,
            practitioner=self.source_practitioner,
            branch=self.branch_a,
            encounter_number="PMF-ENC-001",
            chief_complaint="Skin concern",
            clinical_notes="Clinical note",
            treatment_plan="Treatment plan",
            follow_up_plan="Follow-up plan",
            opened_at=self.now,
        )
        self.diagnosis = MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter,
            patient=self.patient,
            practitioner=self.source_practitioner,
            diagnosis_code="L98.9",
            diagnosis_name="Skin condition",
            is_primary=True,
            diagnosed_at=self.now,
        )
        self.procedure = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter,
            patient=self.patient,
            practitioner=self.source_practitioner,
            procedure_code_snapshot="PMF-PROC-001",
            procedure_name_snapshot="Skin Procedure",
            quantity=Decimal("1"),
            unit_price_snapshot=Decimal("500"),
        )
        self.referral = MedicalReferral.objects.create(
            company=self.company_a,
            source_encounter=self.encounter,
            patient=self.patient,
            referring_practitioner=(
                self.source_practitioner
            ),
            receiving_practitioner=(
                self.receiving_practitioner
            ),
            referral_number="PMF-REF-001",
            referral_reason="Specialist review",
            clinical_summary="Clinical summary",
            referred_at=self.now,
        )
        self.record_access = (
            MedicalReferralRecordAccess.objects.create(
                company=self.company_a,
                referral=self.referral,
                patient=self.patient,
                receiving_practitioner=(
                    self.receiving_practitioner
                ),
                scope=MedicalRecordShareScope.SUMMARY,
                status=(
                    MedicalReferralAccessStatus.PENDING
                ),
                created_by=self.owner,
                updated_by=self.owner,
            )
        )
        self.client.force_authenticate(
            user=self.owner
        )
    def _url(
        self,
        patient: MedicalPatient,
    ) -> str:
        return (
            "/api/company/medical/patients/"
            f"{patient.id}/medical-file/"
        )
    def test_route_and_permission_contracts(self):
        match = resolve(
            "/api/company/medical/patients/"
            "1/medical-file/"
        )
        self.assertIs(
            match.func,
            patient_medical_file,
        )
        self.assertEqual(
            match.url_name,
            (
                "company-medical-"
                "patient-medical-file"
            ),
        )
        self.assertEqual(
            (
                patient_medical_file
                .required_company_permissions
            ),
            REQUIRED_VIEW_PERMISSIONS,
        )
        self.assertEqual(
            len(REQUIRED_VIEW_PERMISSIONS),
            7,
        )
    def test_returns_unified_medical_file(self):
        response = self.client.get(
            self._url(self.patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertTrue(response.data["success"])
        item = response.data["item"]
        sections = item["sections"]
        self.assertEqual(
            item["patient"]["id"],
            self.patient.id,
        )
        self.assertEqual(
            sections["appointments"]["count"],
            1,
        )
        self.assertEqual(
            sections["encounters"]["count"],
            1,
        )
        self.assertEqual(
            sections["diagnoses"]["count"],
            1,
        )
        self.assertEqual(
            sections["procedures"]["count"],
            1,
        )
        self.assertEqual(
            sections["referrals"]["count"],
            1,
        )
        self.assertEqual(
            sections["record_access"]["count"],
            1,
        )
        self.assertEqual(
            (
                sections["encounters"]
                ["items"][0]
                ["clinical_notes"]
            ),
            "Clinical note",
        )
        self.assertEqual(
            (
                sections["diagnoses"]
                ["items"][0]
                ["diagnosis_name"]
            ),
            "Skin condition",
        )
        self.assertEqual(
            (
                sections["procedures"]
                ["items"][0]
                ["procedure_name_snapshot"]
            ),
            "Skin Procedure",
        )
    def test_summary_matches_sections(self):
        response = self.client.get(
            self._url(self.patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        summary = response.data["item"]["summary"]
        self.assertEqual(
            summary["appointments_total"],
            1,
        )
        self.assertEqual(
            summary["upcoming_appointments"],
            1,
        )
        self.assertEqual(
            summary["encounters_total"],
            1,
        )
        self.assertEqual(
            summary["open_encounters"],
            1,
        )
        self.assertEqual(
            summary["diagnoses_total"],
            1,
        )
        self.assertEqual(
            summary["primary_diagnoses"],
            1,
        )
        self.assertEqual(
            summary["procedures_total"],
            1,
        )
        self.assertEqual(
            summary["referrals_total"],
            1,
        )
        self.assertEqual(
            summary["active_referrals"],
            1,
        )
        self.assertEqual(
            summary["record_access_total"],
            1,
        )
        self.assertEqual(
            summary["effective_record_access"],
            0,
        )
        self.assertEqual(
            summary["total_clinical_records"],
            6,
        )
        self.assertIsNotNone(
            summary["next_appointment_at"]
        )
        self.assertIsNotNone(
            summary["latest_encounter_at"]
        )
    def test_response_aliases_same_payload(self):
        response = self.client.get(
            self._url(self.patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(
            response.data["item"],
            response.data["medical_file"],
        )
    def test_empty_patient_returns_empty_sections(self):
        response = self.client.get(
            self._url(self.empty_patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        item = response.data["item"]
        for section in item["sections"].values():
            self.assertEqual(section["count"], 0)
            self.assertEqual(section["items"], [])
        self.assertEqual(
            (
                item["summary"]
                ["total_clinical_records"]
            ),
            0,
        )
        self.assertIsNone(
            item["summary"]["next_appointment_at"]
        )
        self.assertIsNone(
            item["summary"]["latest_encounter_at"]
        )
    def test_other_local_patient_records_are_excluded(
        self,
    ):
        MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.empty_patient,
            appointment_number="PMF-APT-OTHER",
            scheduled_start=(
                self.now + timedelta(days=3)
            ),
            scheduled_end=(
                self.now
                + timedelta(days=3, minutes=30)
            ),
        )
        response = self.client.get(
            self._url(self.patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(
            (
                response.data["item"]
                ["sections"]
                ["appointments"]
                ["count"]
            ),
            1,
        )
        self.assertEqual(
            (
                response.data["item"]
                ["sections"]
                ["appointments"]
                ["items"][0]
                ["id"]
            ),
            self.appointment.id,
        )
    def test_foreign_patient_is_hidden(self):
        response = self.client.get(
            self._url(self.foreign_patient)
        )
        self.assertEqual(
            response.status_code,
            404,
            response.data,
        )
        self.assertFalse(response.data["success"])
    def test_appointments_are_newest_first(self):
        newest = MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient,
            practitioner=self.source_practitioner,
            branch=self.branch_a,
            appointment_number="PMF-APT-NEWEST",
            scheduled_start=(
                self.now + timedelta(days=5)
            ),
            scheduled_end=(
                self.now
                + timedelta(days=5, minutes=30)
            ),
        )
        response = self.client.get(
            self._url(self.patient)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        appointment_items = (
            response.data["item"]
            ["sections"]
            ["appointments"]
            ["items"]
        )
        self.assertEqual(
            appointment_items[0]["id"],
            newest.id,
        )
        self.assertEqual(
            appointment_items[1]["id"],
            self.appointment.id,
        )
    def test_endpoint_is_get_only(self):
        response = self.client.post(
            self._url(self.patient),
            {},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            405,
            response.data,
        )
