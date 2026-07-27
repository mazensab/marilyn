from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from companies.models import Company
from medical.models import MedicalAppointment, MedicalPatient
class MedicalAppointmentModelTests(TestCase):
    def setUp(self):
        self.company_a = Company.objects.create(
            name="Appointment Clinic A",
            company_code="TEST-APPT-A",
        )
        self.company_b = Company.objects.create(
            name="Appointment Clinic B",
            company_code="TEST-APPT-B",
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="PAT-A-001",
            full_name="Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="PAT-B-001",
            full_name="Patient B",
        )
    def appointment(
        self,
        *,
        company=None,
        patient=None,
        number="AP-001",
        start=None,
        end=None,
        price=Decimal("0"),
        **extra,
    ):
        start = start or timezone.now()
        end = end if end is not None else start + timedelta(minutes=30)
        return MedicalAppointment(
            company=company or self.company_a,
            patient=patient or self.patient_a,
            appointment_number=number,
            scheduled_start=start,
            scheduled_end=end,
            price_snapshot=price,
            **extra,
        )
    def test_save_normalizes_values(self):
        appointment = self.appointment(
            number="  AP-001  ",
            reason="  Follow up  ",
            notes="  Appointment notes  ",
            extra_data=None,
        )
        appointment.save()
        appointment.refresh_from_db()
        self.assertEqual(appointment.appointment_number, "AP-001")
        self.assertEqual(appointment.reason, "Follow up")
        self.assertEqual(appointment.notes, "Appointment notes")
        self.assertEqual(appointment.extra_data, {})
    def test_invalid_time_and_negative_price_are_rejected(self):
        now = timezone.now()
        appointment = self.appointment(
            start=now,
            end=now,
            price=Decimal("-1"),
        )
        with self.assertRaises(ValidationError) as context:
            appointment.save()
        self.assertIn("scheduled_end", context.exception.message_dict)
        self.assertIn("price_snapshot", context.exception.message_dict)
    def test_patient_must_belong_to_same_company(self):
        appointment = self.appointment(
            company=self.company_a,
            patient=self.patient_b,
        )
        with self.assertRaises(ValidationError) as context:
            appointment.save()
        self.assertIn("patient", context.exception.message_dict)
    def test_number_is_unique_per_company(self):
        self.appointment(number="AP-100").save()
        with self.assertRaises(ValidationError):
            self.appointment(number="  AP-100  ").save()
        other = self.appointment(
            company=self.company_b,
            patient=self.patient_b,
            number="AP-100",
        )
        other.save()
        self.assertIsNotNone(other.pk)