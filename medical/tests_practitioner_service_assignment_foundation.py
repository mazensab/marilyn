from __future__ import annotations
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from medical.models import (
    MedicalPractitioner,
    MedicalPractitionerAssignment,
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerServiceAssignmentStatus,
    MedicalPractitionerSpecialty,
    MedicalPractitionerStatus,
    MedicalServiceOffering,
    MedicalServiceOfferingStatus,
)
class PractitionerServiceAssignmentFoundationTests(
    TestCase
):
    def setUp(self) -> None:
        from medical.tests_service_offering_foundation import (
            MedicalServiceOfferingFoundationTests,
        )
        MedicalServiceOfferingFoundationTests.setUp(
            self
        )
        self.practitioner_a = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                practitioner_number="PSA-PR-A",
                full_name_ar="د. خدمة أ",
                full_name_en="Service Doctor A",
                primary_specialty=self.specialty_a,
                default_branch=self.branch_a,
                default_department=self.department_a,
                default_clinic=self.clinic_a,
                status=MedicalPractitionerStatus.ACTIVE,
            )
        )
        self.practitioner_b = (
            MedicalPractitioner.objects.create(
                company=self.company_b,
                practitioner_number="PSA-PR-B",
                full_name_ar="د. خدمة ب",
                full_name_en="Service Doctor B",
                primary_specialty=self.specialty_b,
                default_branch=self.branch_b,
                default_department=self.department_b,
                default_clinic=self.clinic_b,
                status=MedicalPractitionerStatus.ACTIVE,
            )
        )
        self.practitioner_without_specialty = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                practitioner_number="PSA-PR-NO-SPEC",
                full_name_en="No Specialty Doctor",
                default_branch=self.branch_a,
                default_department=self.department_a,
                default_clinic=self.clinic_a,
                status=MedicalPractitionerStatus.ACTIVE,
            )
        )
        MedicalPractitionerSpecialty.objects.create(
            company=self.company_a,
            practitioner=self.practitioner_a,
            specialty=self.specialty_a,
            is_primary=True,
            is_active=True,
        )
        MedicalPractitionerSpecialty.objects.create(
            company=self.company_b,
            practitioner=self.practitioner_b,
            specialty=self.specialty_b,
            is_primary=True,
            is_active=True,
        )
        self.assignment_a = (
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=self.practitioner_a,
                branch=self.branch_a,
                department=self.department_a,
                clinic=self.clinic_a,
                is_primary=True,
                is_active=True,
            )
        )
        self.assignment_a_second = (
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=self.practitioner_a,
                branch=self.branch_a_second,
                department=self.department_a,
                clinic=self.clinic_a_second,
                is_active=True,
            )
        )
        self.assignment_without_specialty = (
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=(
                    self.practitioner_without_specialty
                ),
                branch=self.branch_a,
                department=self.department_a,
                clinic=self.clinic_a,
                is_active=True,
            )
        )
        self.assignment_b = (
            MedicalPractitionerAssignment.objects.create(
                company=self.company_b,
                practitioner=self.practitioner_b,
                branch=self.branch_b,
                department=self.department_b,
                clinic=self.clinic_b,
                is_primary=True,
                is_active=True,
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
                duration_minutes=30,
                buffer_before_minutes=5,
                buffer_after_minutes=10,
                online_booking_enabled=True,
            )
        )
        self.offering_a_second_location = (
            MedicalServiceOffering.objects.create(
                company=self.company_a,
                catalog_item=self.service_a,
                branch=self.branch_a_second,
                department=self.department_a,
                specialty=self.specialty_a,
                clinic=self.clinic_a_second,
                duration_minutes=45,
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
                online_booking_enabled=True,
            )
        )
    def build_link(self, **overrides):
        payload = {
            "company": self.company_a,
            "practitioner_assignment": (
                self.assignment_a
            ),
            "service_offering": self.offering_a,
            "status": (
                MedicalPractitionerServiceAssignmentStatus
                .ACTIVE
            ),
        }
        payload.update(overrides)
        return (
            MedicalPractitionerServiceAssignment(
                **payload
            )
        )
    def test_create_valid_assignment(self):
        item = self.build_link()
        item.save()
        self.assertEqual(
            item.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            item.practitioner_id,
            self.practitioner_a.id,
        )
        self.assertTrue(
            item.is_active_service_assignment
        )
    def test_duration_is_inherited(self):
        item = self.build_link()
        item.save()
        self.assertEqual(
            item.effective_duration_minutes,
            30,
        )
        self.assertEqual(
            item.total_slot_minutes,
            45,
        )
    def test_duration_override_is_used(self):
        item = self.build_link(
            duration_override_minutes=50,
        )
        item.save()
        self.assertEqual(
            item.effective_duration_minutes,
            50,
        )
        self.assertEqual(
            item.total_slot_minutes,
            65,
        )
    def test_online_booking_is_inherited(self):
        item = self.build_link()
        item.save()
        self.assertTrue(
            item.effective_online_booking_enabled
        )
    def test_online_booking_override_is_used(self):
        item = self.build_link(
            online_booking_enabled=False,
        )
        item.save()
        self.assertFalse(
            item.effective_online_booking_enabled
        )
    def test_foreign_practitioner_assignment_rejected(
        self,
    ):
        item = self.build_link(
            practitioner_assignment=self.assignment_b,
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_foreign_service_offering_rejected(self):
        item = self.build_link(
            service_offering=self.offering_b,
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_branch_mismatch_is_rejected(self):
        item = self.build_link(
            practitioner_assignment=(
                self.assignment_a_second
            ),
            service_offering=self.offering_a,
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_department_mismatch_is_rejected(self):
        original = (
            self.assignment_a.department
        )
        self.assignment_a.department = (
            self.department_b
        )
        item = self.build_link(
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
        self.assignment_a.department = original
    def test_clinic_mismatch_is_rejected(self):
        item = self.build_link(
            practitioner_assignment=(
                self.assignment_a_second
            ),
            service_offering=self.offering_a,
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_active_link_requires_specialty(self):
        item = self.build_link(
            practitioner_assignment=(
                self.assignment_without_specialty
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_inactive_assignment_blocks_active_link(
        self,
    ):
        self.assignment_a.is_active = False
        self.assignment_a.save()
        item = self.build_link()
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_inactive_offering_blocks_active_link(self):
        self.offering_a.status = (
            MedicalServiceOfferingStatus.INACTIVE
        )
        self.offering_a.save()
        item = self.build_link()
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_inactive_link_allows_inactive_dependencies(
        self,
    ):
        self.assignment_a.is_active = False
        self.assignment_a.save()
        self.offering_a.status = (
            MedicalServiceOfferingStatus.INACTIVE
        )
        self.offering_a.save()
        item = self.build_link(
            status=(
                MedicalPractitionerServiceAssignmentStatus
                .INACTIVE
            ),
        )
        item.save()
        self.assertFalse(
            item.is_active_service_assignment
        )
    def test_duplicate_scope_is_rejected(self):
        first = self.build_link()
        first.save()
        duplicate = self.build_link()
        with self.assertRaises(
            (
                ValidationError,
                IntegrityError,
            )
        ):
            duplicate.save()
    def test_invalid_date_range_is_rejected(self):
        today = timezone.localdate()
        item = self.build_link(
            effective_from=(
                today + timedelta(days=5)
            ),
            effective_until=(
                today + timedelta(days=1)
            ),
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_effective_date_window(self):
        today = timezone.localdate()
        item = self.build_link(
            effective_from=(
                today + timedelta(days=1)
            ),
        )
        item.save()
        self.assertFalse(
            item.is_active_service_assignment
        )
        item.effective_from = today
        item.effective_until = (
            today + timedelta(days=1)
        )
        item.save()
        self.assertTrue(
            item.is_active_service_assignment
        )
    def test_notes_are_normalized(self):
        item = self.build_link(
            notes="  Practitioner note  ",
        )
        item.save()
        self.assertEqual(
            item.notes,
            "Practitioner note",
        )
    def test_duration_override_must_be_positive(self):
        item = self.build_link(
            duration_override_minutes=0,
        )
        with self.assertRaises(ValidationError):
            item.full_clean()
    def test_status_contract(self):
        self.assertEqual(
            set(
                MedicalPractitionerServiceAssignmentStatus
                .values
            ),
            {
                "ACTIVE",
                "INACTIVE",
                "ARCHIVED",
            },
        )
