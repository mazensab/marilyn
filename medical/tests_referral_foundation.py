from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from companies.models import Branch, Company
from .models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalEncounter,
    MedicalPatient,
    MedicalPractitioner,
    MedicalRecordShareScope,
    MedicalRecordShareSection,
    MedicalReferral,
    MedicalReferralAccessStatus,
    MedicalReferralPriority,
    MedicalReferralRecordAccess,
    MedicalReferralStatus,
)
class MedicalReferralFoundationTests(TestCase):
    def setUp(self) -> None:
        self.company_a = Company.objects.create(
            name="Referral Company A",
            company_code="REF-A",
        )
        self.company_b = Company.objects.create(
            name="Referral Company B",
            company_code="REF-B",
        )
        self.branch_a = self._branch(
            company=self.company_a,
            code="REF-A-MAIN",
            name="Referral Branch A",
        )
        self.branch_b = self._branch(
            company=self.company_b,
            code="REF-B-MAIN",
            name="Referral Branch B",
        )
        self.department_a = MedicalDepartment.objects.create(
            company=self.company_a,
            code="DERM-A",
            name_ar="Dermatology Department A",
            name_en="Dermatology A",
        )
        self.department_b = MedicalDepartment.objects.create(
            company=self.company_b,
            code="DERM-B",
            name_ar="Dermatology Department B",
            name_en="Dermatology B",
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_a,
            department=self.department_a,
            branch=self.branch_a,
            is_primary=True,
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_b,
            department=self.department_b,
            branch=self.branch_b,
            is_primary=True,
        )
        self.clinic_a = MedicalClinic.objects.create(
            company=self.company_a,
            branch=self.branch_a,
            department=self.department_a,
            code="DERM-A-01",
            name_ar="Dermatology Clinic A",
            name_en="Dermatology Clinic A",
            room_number="101",
            is_default=True,
        )
        self.clinic_b = MedicalClinic.objects.create(
            company=self.company_b,
            branch=self.branch_b,
            department=self.department_b,
            code="DERM-B-01",
            name_ar="Dermatology Clinic B",
            name_en="Dermatology Clinic B",
            room_number="201",
            is_default=True,
        )
        self.sender = MedicalPractitioner.objects.create(
            company=self.company_a,
            practitioner_number="REF-DR-A-001",
            full_name_en="Dr. Sender",
        )
        self.receiver = MedicalPractitioner.objects.create(
            company=self.company_a,
            practitioner_number="REF-DR-A-002",
            full_name_en="Dr. Receiver",
        )
        self.other_receiver = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                practitioner_number="REF-DR-A-003",
                full_name_en="Dr. Other Receiver",
            )
        )
        self.foreign_practitioner = (
            MedicalPractitioner.objects.create(
                company=self.company_b,
                practitioner_number="REF-DR-B-001",
                full_name_en="Dr. Foreign",
            )
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="REF-PAT-A-001",
            full_name="Patient A",
        )
        self.patient_a_two = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="REF-PAT-A-002",
            full_name="Patient A Two",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="REF-PAT-B-001",
            full_name="Patient B",
        )
        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            practitioner=self.sender,
            encounter_number="REF-ENC-A-001",
        )
        self.encounter_a_two = (
            MedicalEncounter.objects.create(
                company=self.company_a,
                patient=self.patient_a_two,
                practitioner=self.sender,
                encounter_number="REF-ENC-A-002",
            )
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            practitioner=self.foreign_practitioner,
            encounter_number="REF-ENC-B-001",
        )
        self.user = get_user_model().objects.create_user(
            username="referral-foundation-user",
            email="referral-foundation@example.com",
            password="test-pass",
        )
        self.now = timezone.now()
    def _branch(
        self,
        *,
        company: Company,
        code: str,
        name: str,
    ) -> Branch:
        fields = {
            field.name
            for field in Branch._meta.fields
        }
        payload = {
            "company": company,
        }
        if "branch_code" in fields:
            payload["branch_code"] = code
        if "code" in fields:
            payload["code"] = code
        if "name" in fields:
            payload["name"] = name
        if "name_en" in fields:
            payload["name_en"] = name
        if "branch_name" in fields:
            payload["branch_name"] = name
        if "display_name" in fields:
            payload["display_name"] = name
        if "is_active" in fields:
            payload["is_active"] = True
        if "status" in fields:
            payload["status"] = "ACTIVE"
        return Branch.objects.create(**payload)
    def _referral(self, **overrides) -> MedicalReferral:
        payload = {
            "company": self.company_a,
            "source_encounter": self.encounter_a,
            "patient": self.patient_a,
            "referring_practitioner": self.sender,
            "receiving_practitioner": self.receiver,
            "target_branch": self.branch_a,
            "target_department": self.department_a,
            "target_clinic": self.clinic_a,
            "referral_number": "REF-A-001",
            "referral_reason": "Specialist review",
        }
        payload.update(overrides)
        return MedicalReferral.objects.create(**payload)
    def _accepted_referral(self) -> MedicalReferral:
        return self._referral(
            status=MedicalReferralStatus.ACCEPTED,
            referred_at=self.now,
            sent_at=self.now,
            accepted_at=self.now,
            accepted_by=self.user,
        )
    def test_enum_contracts(self):
        self.assertEqual(
            set(MedicalReferralPriority.values),
            {
                "ROUTINE",
                "URGENT",
                "EMERGENCY",
            },
        )
        self.assertEqual(
            set(MedicalReferralStatus.values),
            {
                "DRAFT",
                "SENT",
                "ACCEPTED",
                "IN_PROGRESS",
                "COMPLETED",
                "REJECTED",
                "CANCELLED",
                "EXPIRED",
            },
        )
        self.assertEqual(
            set(MedicalReferralAccessStatus.values),
            {
                "PENDING",
                "ACTIVE",
                "REJECTED",
                "REVOKED",
                "EXPIRED",
            },
        )
    def test_referral_normalization_and_defaults(self):
        referral = self._referral(
            referral_number=" ref-a-001 ",
            referral_reason="  Specialist review  ",
            clinical_summary="  Clinical summary  ",
        )
        self.assertEqual(
            referral.referral_number,
            "REF-A-001",
        )
        self.assertEqual(
            referral.referral_reason,
            "Specialist review",
        )
        self.assertEqual(
            referral.clinical_summary,
            "Clinical summary",
        )
        self.assertEqual(
            referral.priority,
            MedicalReferralPriority.ROUTINE,
        )
        self.assertEqual(
            referral.status,
            MedicalReferralStatus.DRAFT,
        )
    def test_referral_number_unique_per_company(self):
        self._referral()
        duplicate = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-001",
            referral_reason="Duplicate",
        )
        with self.assertRaises(ValidationError):
            duplicate.save()
        other_company = MedicalReferral.objects.create(
            company=self.company_b,
            source_encounter=self.encounter_b,
            patient=self.patient_b,
            referring_practitioner=(
                self.foreign_practitioner
            ),
            receiving_practitioner=(
                self.foreign_practitioner
            ),
            referral_number="REF-A-001",
            referral_reason="Other company",
        )
        self.assertEqual(
            other_company.company_id,
            self.company_b.id,
        )
    def test_patient_must_match_source_encounter(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a_two,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-002",
            referral_reason="Mismatch",
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
    def test_referring_practitioner_must_match_encounter(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.other_receiver,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-003",
            referral_reason="Mismatch",
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
    def test_foreign_relations_are_rejected(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=(
                self.foreign_practitioner
            ),
            referral_number="REF-A-004",
            referral_reason="Foreign receiver",
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
    def test_receiving_destination_is_required(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            referral_number="REF-A-005",
            referral_reason="No destination",
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
    def test_target_clinic_must_match_location(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            target_branch=self.branch_a,
            target_department=self.department_a,
            target_clinic=self.clinic_b,
            referral_number="REF-A-006",
            referral_reason="Wrong clinic",
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
    def test_accepted_status_requires_audit_fields(self):
        referral = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-007",
            referral_reason="Accepted referral",
            status=MedicalReferralStatus.ACCEPTED,
        )
        with self.assertRaises(ValidationError):
            referral.full_clean()
        accepted = self._accepted_referral()
        self.assertTrue(accepted.allows_record_access)
        self.assertFalse(accepted.is_terminal)
    def test_rejected_and_cancelled_require_reasons(self):
        rejected = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-008",
            referral_reason="Rejected referral",
            status=MedicalReferralStatus.REJECTED,
            sent_at=self.now,
        )
        with self.assertRaises(ValidationError):
            rejected.full_clean()
        cancelled = MedicalReferral(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            referral_number="REF-A-009",
            referral_reason="Cancelled referral",
            status=MedicalReferralStatus.CANCELLED,
        )
        with self.assertRaises(ValidationError):
            cancelled.full_clean()
    def test_access_derives_referral_scope(self):
        referral = self._referral()
        access = MedicalReferralRecordAccess.objects.create(
            company=self.company_b,
            referral=referral,
            patient=self.patient_b,
        )
        self.assertEqual(
            access.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            access.patient_id,
            self.patient_a.id,
        )
        self.assertEqual(
            access.receiving_practitioner_id,
            self.receiver.id,
        )
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.PENDING,
        )
    def test_access_rejects_wrong_receiver(self):
        referral = self._referral()
        access = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            receiving_practitioner=(
                self.other_receiver
            ),
        )
        with self.assertRaises(ValidationError):
            access.full_clean()
    def test_custom_access_requires_valid_sections(self):
        referral = self._referral()
        empty_custom = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            scope=MedicalRecordShareScope.CUSTOM,
            shared_sections=[],
        )
        with self.assertRaises(ValidationError):
            empty_custom.full_clean()
        access = MedicalReferralRecordAccess.objects.create(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            scope=MedicalRecordShareScope.CUSTOM,
            shared_sections=[
                " diagnoses ",
                MedicalRecordShareSection.PROCEDURES,
                "DIAGNOSES",
            ],
        )
        self.assertEqual(
            access.shared_sections,
            [
                MedicalRecordShareSection.DIAGNOSES,
                MedicalRecordShareSection.PROCEDURES,
            ],
        )
    def test_active_access_requires_valid_referral(self):
        referral = self._referral()
        access = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            receiving_practitioner=self.receiver,
            status=MedicalReferralAccessStatus.ACTIVE,
            access_starts_at=self.now,
            granted_by=self.user,
            granted_at=self.now,
            accepted_by=self.user,
            accepted_at=self.now,
        )
        with self.assertRaises(ValidationError):
            access.full_clean()
    def test_active_access_is_effective_inside_window(self):
        referral = self._accepted_referral()
        access = MedicalReferralRecordAccess.objects.create(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            receiving_practitioner=self.receiver,
            status=MedicalReferralAccessStatus.ACTIVE,
            access_starts_at=(
                self.now - timedelta(minutes=1)
            ),
            access_ends_at=(
                self.now + timedelta(hours=1)
            ),
            granted_by=self.user,
            granted_at=self.now,
            accepted_by=self.user,
            accepted_at=self.now,
        )
        self.assertTrue(
            access.is_effective_at(self.now)
        )
        self.assertFalse(
            access.is_effective_at(
                self.now + timedelta(hours=2)
            )
        )
    def test_rejected_and_revoked_access_require_audit(self):
        referral = self._referral()
        rejected = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            status=MedicalReferralAccessStatus.REJECTED,
        )
        with self.assertRaises(ValidationError):
            rejected.full_clean()
        revoked = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            status=MedicalReferralAccessStatus.REVOKED,
        )
        with self.assertRaises(ValidationError):
            revoked.full_clean()
    def test_access_end_cannot_precede_start(self):
        referral = self._referral()
        access = MedicalReferralRecordAccess(
            company=self.company_a,
            referral=referral,
            patient=self.patient_a,
            access_starts_at=self.now,
            access_ends_at=(
                self.now - timedelta(minutes=1)
            ),
        )
        with self.assertRaises(ValidationError):
            access.full_clean()
