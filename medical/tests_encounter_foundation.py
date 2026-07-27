from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from companies.models import Company

from .models import (
    MedicalAppointment,
    MedicalEncounter,
    MedicalEncounterStatus,
    MedicalEncounterType,
    MedicalPatient,
)


class MedicalEncounterFoundationTests(TestCase):
    def setUp(self) -> None:
        self.company_a = Company.objects.create(
            name="Encounter Company A",
            company_code="ENC-A",
        )
        self.company_b = Company.objects.create(
            name="Encounter Company B",
            company_code="ENC-B",
        )

        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="PAT-A-001",
            full_name="Patient A",
        )
        self.patient_a_two = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="PAT-A-002",
            full_name="Patient A Two",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="PAT-B-001",
            full_name="Patient B",
        )

        self.opened_at = timezone.now()

    def _appointment(
        self,
        *,
        patient: MedicalPatient,
        number: str,
    ) -> MedicalAppointment:
        return MedicalAppointment.objects.create(
            company=patient.company,
            patient=patient,
            appointment_number=number,
            scheduled_start=self.opened_at,
            scheduled_end=(
                self.opened_at
                + timedelta(minutes=30)
            ),
        )

    def test_defaults_and_text_normalization(self):
        encounter = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number=" enc-a-001 ",
            chief_complaint="  Skin irritation  ",
            clinical_notes="  Initial review  ",
        )

        self.assertEqual(
            encounter.encounter_number,
            "ENC-A-001",
        )
        self.assertEqual(
            encounter.status,
            MedicalEncounterStatus.DRAFT,
        )
        self.assertEqual(
            encounter.encounter_type,
            MedicalEncounterType.CONSULTATION,
        )
        self.assertEqual(
            encounter.chief_complaint,
            "Skin irritation",
        )
        self.assertEqual(
            encounter.clinical_notes,
            "Initial review",
        )
        self.assertIsNotNone(encounter.opened_at)

    def test_patient_must_belong_to_company(self):
        encounter = MedicalEncounter(
            company=self.company_a,
            patient=self.patient_b,
            encounter_number="ENC-A-002",
        )

        with self.assertRaises(ValidationError):
            encounter.full_clean()

    def test_appointment_must_match_patient(self):
        appointment = self._appointment(
            patient=self.patient_a,
            number="APT-A-001",
        )

        encounter = MedicalEncounter(
            company=self.company_a,
            patient=self.patient_a_two,
            appointment=appointment,
            encounter_number="ENC-A-003",
        )

        with self.assertRaises(ValidationError):
            encounter.full_clean()

    def test_closed_time_cannot_precede_opened_time(self):
        encounter = MedicalEncounter(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="ENC-A-004",
            opened_at=self.opened_at,
            closed_at=(
                self.opened_at
                - timedelta(minutes=1)
            ),
        )

        with self.assertRaises(ValidationError):
            encounter.full_clean()

    def test_terminal_status_requires_closed_time(self):
        encounter = MedicalEncounter(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="ENC-A-005",
            status=MedicalEncounterStatus.COMPLETED,
        )

        with self.assertRaises(ValidationError):
            encounter.full_clean()

    def test_encounter_number_is_unique_per_company(self):
        MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="ENC-SHARED-001",
        )

        duplicate = MedicalEncounter(
            company=self.company_a,
            patient=self.patient_a_two,
            encounter_number="ENC-SHARED-001",
        )

        with self.assertRaises(ValidationError):
            duplicate.save()

        other_company = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            encounter_number="ENC-SHARED-001",
        )

        self.assertNotEqual(
            other_company.company_id,
            self.company_a.id,
        )

    def test_appointment_relation_is_optional_one_to_one(self):
        field = MedicalEncounter._meta.get_field(
            "appointment"
        )

        self.assertTrue(field.one_to_one)
        self.assertTrue(field.null)
        self.assertTrue(field.blank)

    def test_enum_contracts_are_stable(self):
        self.assertEqual(
            set(MedicalEncounterStatus.values),
            {
                "DRAFT",
                "OPEN",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
            },
        )
        self.assertEqual(
            set(MedicalEncounterType.values),
            {
                "CONSULTATION",
                "FOLLOW_UP",
                "PROCEDURE",
                "EMERGENCY",
                "OTHER",
            },
        )
