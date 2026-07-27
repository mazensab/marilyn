from __future__ import annotations

from django.contrib.auth import get_user_model
from django.urls import resolve
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import (
    CompanyMembership,
    CompanyRole,
    UserProfile,
)
from companies.models import Branch, Company

from api.company.medical.referrals import (
    ALL_PERMISSIONS,
    CREATE_PERMISSION,
    STATUS_PERMISSION,
    UPDATE_PERMISSION,
    VIEW_PERMISSION,
    referral_collection,
    referral_detail,
    referral_status,
)
from medical.models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalEncounter,
    MedicalPatient,
    MedicalPractitioner,
    MedicalReferral,
    MedicalReferralPriority,
    MedicalReferralStatus,
)

from django.test import TestCase


class CompanyMedicalReferralApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = get_user_model().objects.create_user(
            username="referral-api-owner",
            email="referral-api@example.com",
            password="test-pass",
        )

        self.company_a = Company.objects.create(
            name="Referral API Company A",
            company_code="REF-API-A",
        )
        self.company_b = Company.objects.create(
            name="Referral API Company B",
            company_code="REF-API-B",
        )

        self.profile = UserProfile.objects.create(
            user=self.user,
            display_name="Referral API Owner",
            default_company=self.company_a,
        )
        self.membership = CompanyMembership.objects.create(
            user=self.user,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )

        self.branch_a = self._branch(
            company=self.company_a,
            code="REF-API-A-MAIN",
            name="Referral Branch A",
        )
        self.branch_b = self._branch(
            company=self.company_b,
            code="REF-API-B-MAIN",
            name="Referral Branch B",
        )

        self.department_a = MedicalDepartment.objects.create(
            company=self.company_a,
            code="REF-DERM-A",
            name_ar="Referral Dermatology A",
            name_en="Referral Dermatology A",
        )
        self.department_b = MedicalDepartment.objects.create(
            company=self.company_b,
            code="REF-DERM-B",
            name_ar="Referral Dermatology B",
            name_en="Referral Dermatology B",
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
            code="REF-CLINIC-A",
            name_ar="Referral Clinic A",
            name_en="Referral Clinic A",
            room_number="101",
            is_default=True,
        )
        self.clinic_b = MedicalClinic.objects.create(
            company=self.company_b,
            branch=self.branch_b,
            department=self.department_b,
            code="REF-CLINIC-B",
            name_ar="Referral Clinic B",
            name_en="Referral Clinic B",
            room_number="201",
            is_default=True,
        )

        self.sender = MedicalPractitioner.objects.create(
            company=self.company_a,
            practitioner_number="REF-API-DR-A-001",
            full_name_en="Dr. Referral Sender",
        )
        self.receiver = MedicalPractitioner.objects.create(
            company=self.company_a,
            practitioner_number="REF-API-DR-A-002",
            full_name_en="Dr. Referral Receiver",
        )
        self.receiver_two = MedicalPractitioner.objects.create(
            company=self.company_a,
            practitioner_number="REF-API-DR-A-003",
            full_name_en="Dr. Referral Receiver Two",
        )
        self.foreign_practitioner = (
            MedicalPractitioner.objects.create(
                company=self.company_b,
                practitioner_number="REF-API-DR-B-001",
                full_name_en="Dr. Foreign Referral",
            )
        )

        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="REF-API-PAT-A",
            full_name="Referral Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="REF-API-PAT-B",
            full_name="Referral Patient B",
        )

        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            practitioner=self.sender,
            encounter_number="REF-API-ENC-A",
        )
        self.encounter_without_practitioner = (
            MedicalEncounter.objects.create(
                company=self.company_a,
                patient=self.patient_a,
                encounter_number="REF-API-ENC-NO-DR",
            )
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            practitioner=self.foreign_practitioner,
            encounter_number="REF-API-ENC-B",
        )

        self.referral_a = MedicalReferral.objects.create(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            target_branch=self.branch_a,
            target_department=self.department_a,
            target_clinic=self.clinic_a,
            referral_number="REF-API-A-001",
            referral_reason="Specialist review",
        )
        self.referral_b = MedicalReferral.objects.create(
            company=self.company_b,
            source_encounter=self.encounter_b,
            patient=self.patient_b,
            referring_practitioner=self.foreign_practitioner,
            receiving_practitioner=self.foreign_practitioner,
            target_branch=self.branch_b,
            target_department=self.department_b,
            target_clinic=self.clinic_b,
            referral_number="REF-API-B-001",
            referral_reason="Foreign specialist review",
        )

        self.collection_url = "/api/company/medical/referrals/"
        self.detail_url = (
            self.collection_url
            + f"{self.referral_a.id}/"
        )
        self.status_url = (
            self.detail_url
            + "status/"
        )

        self.client.force_authenticate(user=self.user)

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

        if "name_ar" in fields:
            payload["name_ar"] = name

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

    def _sent_referral(
        self,
        *,
        number: str,
    ) -> MedicalReferral:
        now = timezone.now()

        return MedicalReferral.objects.create(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver,
            target_branch=self.branch_a,
            target_department=self.department_a,
            target_clinic=self.clinic_a,
            referral_number=number,
            referral_reason="Sent referral",
            referred_at=now,
            status=MedicalReferralStatus.SENT,
            sent_at=now,
        )

    def test_routes_are_registered(self):
        self.assertEqual(
            resolve(self.collection_url).url_name,
            "company-medical-referrals",
        )
        self.assertEqual(
            resolve(self.detail_url).url_name,
            "company-medical-referral-detail",
        )
        self.assertEqual(
            resolve(self.status_url).url_name,
            "company-medical-referral-status",
        )

    def test_routes_use_expected_callbacks(self):
        self.assertEqual(
            resolve(self.collection_url).func,
            referral_collection,
        )
        self.assertEqual(
            resolve(self.detail_url).func,
            referral_detail,
        )
        self.assertEqual(
            resolve(self.status_url).func,
            referral_status,
        )

    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            VIEW_PERMISSION,
            "medical.view_medicalreferral",
        )
        self.assertEqual(
            CREATE_PERMISSION,
            "medical.add_medicalreferral",
        )
        self.assertEqual(
            UPDATE_PERMISSION,
            "medical.change_medicalreferral",
        )
        self.assertEqual(
            STATUS_PERMISSION,
            UPDATE_PERMISSION,
        )
        self.assertEqual(
            referral_collection.required_company_permissions,
            ALL_PERMISSIONS,
        )
        self.assertEqual(
            referral_detail.required_company_permissions,
            [
                VIEW_PERMISSION,
                UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            referral_status.required_company_permissions,
            [STATUS_PERMISSION],
        )

    def test_collection_is_company_scoped(self):
        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.referral_a.id,
        )

    def test_collection_filters_status_priority_and_search(self):
        MedicalReferral.objects.create(
            company=self.company_a,
            source_encounter=self.encounter_a,
            patient=self.patient_a,
            referring_practitioner=self.sender,
            receiving_practitioner=self.receiver_two,
            referral_number="REF-API-A-URGENT",
            priority=MedicalReferralPriority.URGENT,
            referral_reason="Urgent laser consultation",
        )

        response = self.client.get(
            self.collection_url,
            {
                "priority": "urgent",
                "status": "draft",
                "q": "laser",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["referral_number"],
            "REF-API-A-URGENT",
        )

    def test_create_derives_scope_and_ignores_spoofed_fields(self):
        response = self.client.post(
            self.collection_url,
            {
                "company_id": self.company_b.id,
                "source_encounter_id": self.encounter_a.id,
                "patient_id": self.patient_b.id,
                "referring_practitioner_id": (
                    self.foreign_practitioner.id
                ),
                "receiving_practitioner_id": self.receiver.id,
                "target_branch_id": self.branch_a.id,
                "target_department_id": self.department_a.id,
                "target_clinic_id": self.clinic_a.id,
                "referral_number": " ref-api-a-002 ",
                "priority": "urgent",
                "referral_reason": "  Advanced review  ",
                "clinical_summary": "  Summary  ",
                "requested_service": "  Laser review  ",
                "extra_data": {"source": "api-test"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        referral = MedicalReferral.objects.get(
            referral_number="REF-API-A-002"
        )

        self.assertEqual(
            referral.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            referral.patient_id,
            self.patient_a.id,
        )
        self.assertEqual(
            referral.referring_practitioner_id,
            self.sender.id,
        )
        self.assertEqual(
            referral.receiving_practitioner_id,
            self.receiver.id,
        )
        self.assertEqual(
            referral.priority,
            MedicalReferralPriority.URGENT,
        )
        self.assertEqual(
            referral.status,
            MedicalReferralStatus.DRAFT,
        )
        self.assertEqual(
            referral.referral_reason,
            "Advanced review",
        )
        self.assertEqual(
            referral.created_by_id,
            self.user.id,
        )

    def test_create_rejects_foreign_source_encounter(self):
        response = self.client.post(
            self.collection_url,
            {
                "source_encounter_id": self.encounter_b.id,
                "receiving_practitioner_id": self.receiver.id,
                "referral_number": "REF-API-A-003",
                "referral_reason": "Foreign encounter",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_create_requires_source_encounter_practitioner(self):
        response = self.client.post(
            self.collection_url,
            {
                "source_encounter_id": (
                    self.encounter_without_practitioner.id
                ),
                "receiving_practitioner_id": self.receiver.id,
                "referral_number": "REF-API-A-004",
                "referral_reason": "No source doctor",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "source_encounter_id",
            response.data["errors"],
        )

    def test_create_rejects_foreign_destination(self):
        response = self.client.post(
            self.collection_url,
            {
                "source_encounter_id": self.encounter_a.id,
                "receiving_practitioner_id": (
                    self.foreign_practitioner.id
                ),
                "referral_number": "REF-API-A-005",
                "referral_reason": "Foreign destination",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "receiving_practitioner_id",
            response.data["errors"],
        )

    def test_create_requires_destination(self):
        response = self.client.post(
            self.collection_url,
            {
                "source_encounter_id": self.encounter_a.id,
                "referral_number": "REF-API-A-006",
                "referral_reason": "No destination",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_foreign_referral_is_not_exposed(self):
        response = self.client.get(
            (
                self.collection_url
                + f"{self.referral_b.id}/"
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_draft_detail_update_normalizes_values(self):
        response = self.client.patch(
            self.detail_url,
            {
                "referral_number": " ref-api-a-009 ",
                "priority": "emergency",
                "receiving_practitioner_id": (
                    self.receiver_two.id
                ),
                "referral_reason": "  Updated reason  ",
                "clinical_summary": "  Updated summary  ",
                "requested_service": "  Updated service  ",
                "notes": "  Updated notes  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.referral_a.refresh_from_db()

        self.assertEqual(
            self.referral_a.referral_number,
            "REF-API-A-009",
        )
        self.assertEqual(
            self.referral_a.priority,
            MedicalReferralPriority.EMERGENCY,
        )
        self.assertEqual(
            self.referral_a.receiving_practitioner_id,
            self.receiver_two.id,
        )
        self.assertEqual(
            self.referral_a.referral_reason,
            "Updated reason",
        )
        self.assertEqual(
            self.referral_a.updated_by_id,
            self.user.id,
        )

    def test_sent_referral_blocks_detail_mutation(self):
        referral = self._sent_referral(
            number="REF-API-A-SENT-EDIT",
        )

        response = self.client.patch(
            (
                self.collection_url
                + f"{referral.id}/"
            ),
            {
                "referral_reason": "Changed",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_status_lifecycle_sets_audit_fields(self):
        send = self.client.post(
            self.status_url,
            {"status": "SENT"},
            format="json",
        )
        self.assertEqual(send.status_code, 200)

        accept = self.client.post(
            self.status_url,
            {"action": "accept"},
            format="json",
        )
        self.assertEqual(accept.status_code, 200)

        start = self.client.post(
            self.status_url,
            {"status": "IN_PROGRESS"},
            format="json",
        )
        self.assertEqual(start.status_code, 200)

        complete = self.client.post(
            self.status_url,
            {"action": "complete"},
            format="json",
        )
        self.assertEqual(complete.status_code, 200)

        self.referral_a.refresh_from_db()

        self.assertEqual(
            self.referral_a.status,
            MedicalReferralStatus.COMPLETED,
        )
        self.assertIsNotNone(self.referral_a.sent_at)
        self.assertIsNotNone(self.referral_a.accepted_at)
        self.assertIsNotNone(self.referral_a.started_at)
        self.assertIsNotNone(self.referral_a.completed_at)
        self.assertEqual(
            self.referral_a.accepted_by_id,
            self.user.id,
        )
        self.assertEqual(
            self.referral_a.completed_by_id,
            self.user.id,
        )

    def test_reject_status_requires_reason(self):
        referral = self._sent_referral(
            number="REF-API-A-REJECT",
        )
        url = (
            self.collection_url
            + f"{referral.id}/status/"
        )

        missing = self.client.post(
            url,
            {"status": "REJECTED"},
            format="json",
        )
        self.assertEqual(missing.status_code, 400)

        valid = self.client.post(
            url,
            {
                "status": "REJECTED",
                "rejection_reason": "Not suitable",
            },
            format="json",
        )
        self.assertEqual(valid.status_code, 200)

        referral.refresh_from_db()

        self.assertEqual(
            referral.status,
            MedicalReferralStatus.REJECTED,
        )
        self.assertEqual(
            referral.rejected_by_id,
            self.user.id,
        )
        self.assertEqual(
            referral.rejection_reason,
            "Not suitable",
        )

    def test_cancel_status_requires_reason(self):
        missing = self.client.post(
            self.status_url,
            {"status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(missing.status_code, 400)

        valid = self.client.post(
            self.status_url,
            {
                "action": "cancel",
                "cancellation_reason": "Patient request",
            },
            format="json",
        )
        self.assertEqual(valid.status_code, 200)

        self.referral_a.refresh_from_db()

        self.assertEqual(
            self.referral_a.status,
            MedicalReferralStatus.CANCELLED,
        )
        self.assertEqual(
            self.referral_a.cancelled_by_id,
            self.user.id,
        )

    def test_invalid_status_transition_is_rejected(self):
        response = self.client.post(
            self.status_url,
            {"status": "ACCEPTED"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

        self.referral_a.refresh_from_db()

        self.assertEqual(
            self.referral_a.status,
            MedicalReferralStatus.DRAFT,
        )

    def test_foreign_status_endpoint_is_not_exposed(self):
        response = self.client.post(
            (
                self.collection_url
                + f"{self.referral_b.id}/status/"
            ),
            {"status": "SENT"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
