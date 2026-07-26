from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from activity_backends.models import ClinicPatient
from companies.models import Branch, Company
from medical.models import (
    MedicalPatient,
    MedicalPatientIdentifierType,
    MedicalSettings,
)


class MedicalPatientFoundationTests(TestCase):
    def setUp(self):
        self.company_a = Company.objects.create(
            name="Patient Company A",
            company_code="PATIENT-A",
        )
        self.company_b = Company.objects.create(
            name="Patient Company B",
            company_code="PATIENT-B",
        )
        self.branch_a = Branch.objects.create(
            company=self.company_a,
            branch_code="PAT-A",
            name="Patient Branch A",
        )
        self.branch_b = Branch.objects.create(
            company=self.company_b,
            branch_code="PAT-B",
            name="Patient Branch B",
        )

    def create_patient(
        self,
        *,
        company=None,
        patient_number="PAT-0001",
        identifier_number="1000000001",
    ):
        return MedicalPatient.objects.create(
            company=company or self.company_a,
            patient_number=patient_number,
            full_name="Patient One",
            identifier_type=(
                MedicalPatientIdentifierType.NATIONAL_ID
            ),
            identifier_number=identifier_number,
            mobile="0500000000",
        )

    def test_create_patient(self):
        patient = self.create_patient()

        self.assertEqual(
            patient.patient_number,
            "PAT-0001",
        )
        self.assertEqual(
            patient.full_name,
            "Patient One",
        )

    def test_patient_number_is_normalized(self):
        patient = self.create_patient(
            patient_number="  pat-0002  ",
            identifier_number="1000000002",
        )

        self.assertEqual(
            patient.patient_number,
            "PAT-0002",
        )

    def test_patient_number_unique_per_company(self):
        self.create_patient()

        with self.assertRaises(ValidationError):
            self.create_patient(
                identifier_number="1000000002",
            )

    def test_identifier_unique_per_company(self):
        self.create_patient()

        with self.assertRaises(ValidationError):
            self.create_patient(
                patient_number="PAT-0002",
            )

    def test_same_values_allowed_across_companies(self):
        first = self.create_patient()

        second = self.create_patient(
            company=self.company_b,
        )

        self.assertNotEqual(
            first.company_id,
            second.company_id,
        )

    def test_registration_branch_must_match_company(self):
        patient = MedicalPatient(
            company=self.company_a,
            registration_branch=self.branch_b,
            patient_number="PAT-0003",
            full_name="Wrong Branch",
        )

        with self.assertRaises(ValidationError):
            patient.full_clean()

    def test_legacy_patient_must_match_company(self):
        legacy = ClinicPatient.objects.create(
            company=self.company_b,
            patient_number="LEG-0001",
            full_name="Legacy Patient",
        )

        patient = MedicalPatient(
            company=self.company_a,
            legacy_patient=legacy,
            patient_number="PAT-0004",
            full_name="Wrong Legacy",
        )

        with self.assertRaises(ValidationError):
            patient.full_clean()

    def test_future_birth_date_is_rejected(self):
        patient = MedicalPatient(
            company=self.company_a,
            patient_number="PAT-0005",
            full_name="Future Patient",
            date_of_birth=(
                timezone.localdate()
                + timedelta(days=1)
            ),
        )

        with self.assertRaises(ValidationError):
            patient.full_clean()

    def test_identifier_required_by_settings(self):
        MedicalSettings.objects.create(
            company=self.company_a,
            require_patient_identifier=True,
        )

        patient = MedicalPatient(
            company=self.company_a,
            patient_number="PAT-0006",
            full_name="Identifier Required",
        )

        with self.assertRaises(ValidationError):
            patient.full_clean()
