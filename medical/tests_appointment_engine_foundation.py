
from __future__ import annotations
from datetime import datetime, time, timedelta
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from medical.models import (
    MedicalAppointment,
    MedicalAppointmentStatus,
    MedicalPatient,
    MedicalPractitionerScheduleBreak,
    MedicalPractitionerServiceAssignmentStatus,
    MedicalPractitionerTimeOff,
)
class AppointmentEngineFoundationTests(
    TestCase
):
    def setUp(self):
        from medical.tests_practitioner_availability import (
            PractitionerAvailabilityCombinedTests,
        )
        PractitionerAvailabilityCombinedTests.setUp(
            self
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="APT-ENGINE-A",
            full_name="Appointment Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            registration_branch=self.branch_b,
            patient_number="APT-ENGINE-B",
            full_name="Appointment Patient B",
        )
        self.sequence = 0
    def aware(self, hour, minute=0):
        value = datetime.combine(
            self.target_date,
            time(hour, minute),
        )
        return timezone.make_aware(
            value,
            timezone.get_current_timezone(),
        )
    def create_booking(
        self,
        *,
        start=None,
        patient=None,
        service_assignment=None,
        status=MedicalAppointmentStatus.SCHEDULED,
    ):
        self.sequence += 1
        return MedicalAppointment.objects.create(
            company=self.company_a,
            patient=patient or self.patient_a,
            appointment_number=(
                f"ENGINE-{self.sequence:04d}"
            ),
            practitioner_service_assignment=(
                self.link_a
                if service_assignment is None
                else service_assignment
            ),
            scheduled_start=(
                start or self.aware(9)
            ),
            status=status,
        )
    def test_contract_and_admin(self):
        appointment_fields = {
            field.name
            for field in (
                MedicalAppointment
                ._meta
                .get_fields()
            )
            if not field.auto_created
        }
        self.assertIn(
            "practitioner_assignment",
            appointment_fields,
        )
        self.assertIn(
            "practitioner_service_assignment",
            appointment_fields,
        )
        self.assertIn(
            MedicalAppointment,
            admin.site._registry,
        )
    def test_draft_status_and_default(self):
        values = set(
            MedicalAppointmentStatus.values
        )
        self.assertIn("DRAFT", values)
        self.assertEqual(
            (
                MedicalAppointment
                ._meta
                .get_field("status")
                .default
            ),
            MedicalAppointmentStatus.SCHEDULED,
        )
    def test_service_assignment_derives_booking(self):
        start = self.aware(9)
        item = self.create_booking(
            start=start
        )
        self.assertEqual(
            item.practitioner_assignment_id,
            self.assignment_a.id,
        )
        self.assertEqual(
            item.practitioner_id,
            self.practitioner_a.id,
        )
        self.assertEqual(
            item.branch_id,
            self.branch_a.id,
        )
        self.assertEqual(
            item.department_id,
            self.department_a.id,
        )
        self.assertEqual(
            item.clinic_id,
            self.clinic_a.id,
        )
        self.assertEqual(
            item.scheduled_end,
            (
                start
                + timedelta(
                    minutes=(
                        self.link_a
                        .total_slot_minutes
                    )
                )
            ),
        )
        self.assertTrue(
            item.practitioner_name_snapshot
        )
        self.assertTrue(
            item.service_name_snapshot
        )
        self.assertEqual(
            item.price_snapshot,
            (
                self.link_a
                .service_offering
                .effective_sale_price
            ),
        )
    def test_assignment_only_booking(self):
        item = MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            appointment_number="ENGINE-ASSIGNMENT",
            practitioner_assignment=(
                self.assignment_a
            ),
            scheduled_start=self.aware(10),
            scheduled_end=self.aware(10, 30),
        )
        self.assertEqual(
            item.practitioner_id,
            self.practitioner_a.id,
        )
        self.assertEqual(
            item.branch_id,
            self.branch_a.id,
        )
    def test_legacy_shape_is_preserved(self):
        item = MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            practitioner=self.practitioner_a,
            branch=self.branch_a,
            department=self.department_a,
            clinic=self.clinic_a,
            appointment_number="ENGINE-LEGACY",
            scheduled_start=self.aware(14),
            scheduled_end=self.aware(14, 30),
            source="LEGACY",
        )
        self.assertIsNone(
            item.practitioner_assignment_id
        )
        self.assertIsNone(
            item.practitioner_service_assignment_id
        )
    def test_foreign_patient_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.create_booking(
                patient=self.patient_b
            )
    def test_inactive_service_is_rejected(self):
        self.link_a.status = (
            MedicalPractitionerServiceAssignmentStatus
            .INACTIVE
        )
        self.link_a.save()
        with self.assertRaises(ValidationError):
            self.create_booking()
    def test_future_service_is_rejected(self):
        self.link_a.effective_from = (
            self.target_date
            + timedelta(days=1)
        )
        self.link_a.save()
        with self.assertRaises(ValidationError):
            self.create_booking()
    def test_outside_schedule_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.create_booking(
                start=self.aware(8)
            )
    def test_schedule_break_is_rejected(self):
        MedicalPractitionerScheduleBreak.objects.create(
            company=self.company_a,
            weekly_schedule=self.schedule_a,
            start_time=time(9, 15),
            end_time=time(9, 30),
        )
        with self.assertRaises(ValidationError):
            self.create_booking()
    def test_time_off_is_rejected(self):
        MedicalPractitionerTimeOff.objects.create(
            company=self.company_a,
            practitioner_assignment=(
                self.assignment_a
            ),
            starts_at=self.aware(9),
            ends_at=self.aware(10),
        )
        with self.assertRaises(ValidationError):
            self.create_booking()
    def test_overlap_is_rejected(self):
        self.create_booking(
            start=self.aware(9)
        )
        with self.assertRaises(ValidationError):
            self.create_booking(
                start=self.aware(9, 15)
            )
    def test_cancelled_and_no_show_do_not_block(self):
        self.create_booking(
            start=self.aware(9),
            status=MedicalAppointmentStatus.CANCELLED,
        )
        scheduled = self.create_booking(
            start=self.aware(9)
        )
        self.assertIsNotNone(scheduled.id)
        self.create_booking(
            start=self.aware(10, 30),
            status=MedicalAppointmentStatus.NO_SHOW,
        )
        second = self.create_booking(
            start=self.aware(10, 30)
        )
        self.assertIsNotNone(second.id)
    def test_non_overlap_and_self_update(self):
        first = self.create_booking(
            start=self.aware(9)
        )
        second = self.create_booking(
            start=first.scheduled_end
        )
        self.assertIsNotNone(second.id)
        first.notes = "Updated"
        first.save()
        first.refresh_from_db()
        self.assertEqual(
            first.notes,
            "Updated",
        )
