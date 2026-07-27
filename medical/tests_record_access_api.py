from __future__ import annotations
from datetime import timedelta
from django.urls import resolve
from django.utils import timezone
from api.company.medical.record_access import (
    ALL_PERMISSIONS,
    CREATE_PERMISSION,
    STATUS_PERMISSION,
    STATUS_TRANSITIONS,
    UPDATE_PERMISSION,
    VIEW_PERMISSION,
    record_access_resource,
    record_access_status,
)
from medical.models import (
    MedicalEncounter,
    MedicalPractitioner,
    MedicalRecordShareScope,
    MedicalRecordShareSection,
    MedicalReferral,
    MedicalReferralAccessStatus,
    MedicalReferralRecordAccess,
    MedicalReferralStatus,
)
from medical import tests_referral_api as referral_tests
class CompanyMedicalRecordAccessApiTests(
    referral_tests.CompanyMedicalReferralApiTests
):
    def setUp(self):
        super().setUp()
        self.owner = self.user
    def _company(self):
        encounter = (
            MedicalEncounter.objects
            .filter(practitioner__isnull=False)
            .select_related(
                "company",
                "patient",
                "practitioner",
            )
            .order_by("id")
            .first()
        )
        self.assertIsNotNone(encounter)
        return encounter.company
    def _encounter(self, company=None):
        company = company or self._company()
        encounter = (
            MedicalEncounter.objects
            .filter(
                company=company,
                practitioner__isnull=False,
                patient__isnull=False,
            )
            .select_related(
                "company",
                "patient",
                "practitioner",
            )
            .order_by("id")
            .first()
        )
        self.assertIsNotNone(encounter)
        return encounter
    def _receiver(
        self,
        *,
        company,
        excluding_id=None,
    ):
        queryset = (
            MedicalPractitioner.objects
            .filter(company=company)
            .order_by("id")
        )
        if excluding_id:
            queryset = queryset.exclude(
                id=excluding_id
            )
        receiver = queryset.first()
        if receiver is None:
            receiver = (
                MedicalPractitioner.objects
                .filter(company=company)
                .order_by("id")
                .first()
            )
        self.assertIsNotNone(receiver)
        return receiver
    def _referral(
        self,
        *,
        company=None,
        status=MedicalReferralStatus.DRAFT,
        suffix="BASE",
        receiver=True,
    ):
        encounter = self._encounter(company)
        now = timezone.now()
        receiving_practitioner = None
        if receiver:
            receiving_practitioner = self._receiver(
                company=encounter.company,
                excluding_id=(
                    encounter.practitioner_id
                ),
            )
        payload = {
            "company": encounter.company,
            "referral_number": (
                f"ACCESS-{suffix}-{status}"
            ),
            "source_encounter": encounter,
            "patient": encounter.patient,
            "referring_practitioner": (
                encounter.practitioner
            ),
            "receiving_practitioner": (
                receiving_practitioner
            ),
            "referral_reason": (
                f"Record access referral {suffix}"
            ),
            "status": status,
            "referred_at": now,
            "created_by": self.owner,
            "updated_by": self.owner,
        }
        if status in {
            MedicalReferralStatus.SENT,
            MedicalReferralStatus.ACCEPTED,
            MedicalReferralStatus.IN_PROGRESS,
            MedicalReferralStatus.COMPLETED,
            MedicalReferralStatus.REJECTED,
        }:
            payload["sent_at"] = now
        if status in {
            MedicalReferralStatus.ACCEPTED,
            MedicalReferralStatus.IN_PROGRESS,
            MedicalReferralStatus.COMPLETED,
        }:
            payload["accepted_at"] = now
            payload["accepted_by"] = self.owner
        if status == MedicalReferralStatus.IN_PROGRESS:
            payload["started_at"] = now
        if status == MedicalReferralStatus.COMPLETED:
            payload["started_at"] = now
            payload["completed_at"] = now
            payload["completed_by"] = self.owner
        return MedicalReferral.objects.create(
            **payload
        )
    def _access_url(self, referral):
        return (
            "/api/company/medical/"
            f"referrals/{referral.id}/"
            "record-access/"
        )
    def _status_url(self, referral):
        return (
            "/api/company/medical/"
            f"referrals/{referral.id}/"
            "record-access/status/"
        )
    def _create_access(
        self,
        *,
        referral=None,
        payload=None,
    ):
        referral = referral or self._referral(
            suffix="CREATE"
        )
        response = self.client.post(
            self._access_url(referral),
            payload or {},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            getattr(response, "data", None),
        )
        return (
            referral,
            MedicalReferralRecordAccess.objects.get(
                referral=referral
            ),
            response,
        )
    def test_routes_use_expected_callbacks(self):
        referral = self._referral(
            suffix="ROUTES"
        )
        self.assertIs(
            resolve(
                self._access_url(referral)
            ).func,
            record_access_resource,
        )
        self.assertIs(
            resolve(
                self._status_url(referral)
            ).func,
            record_access_status,
        )
    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            VIEW_PERMISSION,
            (
                "medical."
                "view_medicalreferralrecordaccess"
            ),
        )
        self.assertEqual(
            CREATE_PERMISSION,
            (
                "medical."
                "add_medicalreferralrecordaccess"
            ),
        )
        self.assertEqual(
            UPDATE_PERMISSION,
            (
                "medical."
                "change_medicalreferralrecordaccess"
            ),
        )
        self.assertEqual(
            STATUS_PERMISSION,
            UPDATE_PERMISSION,
        )
        self.assertEqual(
            (
                record_access_resource
                .required_company_permissions
            ),
            ALL_PERMISSIONS,
        )
        self.assertEqual(
            (
                record_access_status
                .required_company_permissions
            ),
            [STATUS_PERMISSION],
        )
    def test_create_derives_referral_scope(self):
        referral = self._referral(
            suffix="DERIVE"
        )
        foreign_company = (
            referral.company.__class__.objects
            .exclude(id=referral.company_id)
            .order_by("id")
            .first()
        )
        payload = {
            "company_id": (
                foreign_company.id
                if foreign_company
                else 999999
            ),
            "patient_id": 999999,
            "receiving_practitioner_id": 999999,
            "scope": "summary",
            "notes": "  Shared notes  ",
        }
        response = self.client.post(
            self._access_url(referral),
            payload,
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        access = (
            MedicalReferralRecordAccess.objects
            .get(referral=referral)
        )
        self.assertEqual(
            access.company_id,
            referral.company_id,
        )
        self.assertEqual(
            access.patient_id,
            referral.patient_id,
        )
        self.assertEqual(
            access.receiving_practitioner_id,
            referral.receiving_practitioner_id,
        )
        self.assertEqual(
            access.scope,
            MedicalRecordShareScope.SUMMARY,
        )
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.PENDING,
        )
        self.assertEqual(
            access.notes,
            "Shared notes",
        )
    def test_duplicate_create_is_rejected(self):
        referral, _, _ = self._create_access()
        response = self.client.post(
            self._access_url(referral),
            {},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            409,
        )
        self.assertEqual(
            MedicalReferralRecordAccess.objects
            .filter(referral=referral)
            .count(),
            1,
        )
    def test_get_returns_serialized_access(self):
        referral, access, _ = self._create_access(
            payload={
                "scope": "SOURCE_ENCOUNTER",
                "notes": "Visible access",
            }
        )
        response = self.client.get(
            self._access_url(referral)
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(
            response.data["item"]["id"],
            access.id,
        )
        self.assertEqual(
            response.data["item"]["referral_id"],
            referral.id,
        )
        self.assertEqual(
            response.data["item"]["patient_id"],
            referral.patient_id,
        )
        self.assertEqual(
            response.data["item"]["scope"],
            MedicalRecordShareScope.SOURCE_ENCOUNTER,
        )
        self.assertFalse(
            response.data["item"]["is_effective"]
        )
    def test_missing_access_returns_not_found(self):
        referral = self._referral(
            suffix="MISSING"
        )
        response = self.client.get(
            self._access_url(referral)
        )
        self.assertEqual(
            response.status_code,
            404,
        )
    def test_pending_access_can_be_updated(self):
        referral, access, _ = self._create_access()
        response = self.client.patch(
            self._access_url(referral),
            {
                "scope": "custom",
                "shared_sections": [
                    " diagnoses ",
                    "PROCEDURES",
                    "DIAGNOSES",
                ],
                "notes": "  Updated notes  ",
                "extra_data": {
                    "source": "api-test",
                },
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.scope,
            MedicalRecordShareScope.CUSTOM,
        )
        self.assertEqual(
            access.shared_sections,
            [
                MedicalRecordShareSection.DIAGNOSES,
                MedicalRecordShareSection.PROCEDURES,
            ],
        )
        self.assertEqual(
            access.notes,
            "Updated notes",
        )
        self.assertEqual(
            access.extra_data,
            {"source": "api-test"},
        )
    def test_custom_scope_requires_sections(self):
        referral = self._referral(
            suffix="CUSTOM-EMPTY"
        )
        response = self.client.post(
            self._access_url(referral),
            {
                "scope": "CUSTOM",
                "shared_sections": [],
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertFalse(
            MedicalReferralRecordAccess.objects
            .filter(referral=referral)
            .exists()
        )
    def test_invalid_shared_section_is_rejected(self):
        referral = self._referral(
            suffix="INVALID-SECTION"
        )
        response = self.client.post(
            self._access_url(referral),
            {
                "scope": "CUSTOM",
                "shared_sections": [
                    "DIAGNOSES",
                    "INVALID_SECTION",
                ],
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
    def test_access_end_cannot_precede_start(self):
        referral = self._referral(
            suffix="WINDOW"
        )
        now = timezone.now()
        response = self.client.post(
            self._access_url(referral),
            {
                "access_starts_at": (
                    now.isoformat()
                ),
                "access_ends_at": (
                    now
                    - timedelta(minutes=10)
                ).isoformat(),
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
    def test_foreign_referral_is_hidden(self):
        company = self._company()
        foreign_company = (
            company.__class__.objects
            .exclude(id=company.id)
            .order_by("id")
            .first()
        )
        self.assertIsNotNone(foreign_company)
        referral = self._referral(
            company=foreign_company,
            suffix="FOREIGN",
        )
        get_response = self.client.get(
            self._access_url(referral)
        )
        post_response = self.client.post(
            self._access_url(referral),
            {},
            format="json",
        )
        status_response = self.client.post(
            self._status_url(referral),
            {"action": "activate"},
            format="json",
        )
        self.assertEqual(
            get_response.status_code,
            404,
        )
        self.assertEqual(
            post_response.status_code,
            404,
        )
        self.assertEqual(
            status_response.status_code,
            404,
        )
    def test_draft_referral_cannot_activate_access(self):
        referral, access, _ = self._create_access(
            referral=self._referral(
                status=MedicalReferralStatus.DRAFT,
                suffix="DRAFT-ACTIVATE",
            )
        )
        response = self.client.post(
            self._status_url(referral),
            {"action": "activate"},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.PENDING,
        )
    def test_activate_sets_audit_and_effective_access(self):
        referral = self._referral(
            status=MedicalReferralStatus.ACCEPTED,
            suffix="ACTIVATE",
        )
        referral, access, _ = self._create_access(
            referral=referral,
            payload={
                "scope": "FULL_RECORD",
            },
        )
        end = timezone.now() + timedelta(hours=2)
        response = self.client.post(
            self._status_url(referral),
            {
                "action": "grant",
                "access_ends_at": end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.ACTIVE,
        )
        self.assertEqual(
            access.granted_by_id,
            self.owner.id,
        )
        self.assertEqual(
            access.accepted_by_id,
            self.owner.id,
        )
        self.assertIsNotNone(
            access.granted_at
        )
        self.assertIsNotNone(
            access.accepted_at
        )
        self.assertIsNotNone(
            access.access_starts_at
        )
        self.assertTrue(
            access.is_effective
        )
    def test_active_access_blocks_detail_mutation(self):
        referral = self._referral(
            status=MedicalReferralStatus.ACCEPTED,
            suffix="LOCKED",
        )
        referral, access, _ = self._create_access(
            referral=referral
        )
        activate_response = self.client.post(
            self._status_url(referral),
            {"action": "activate"},
            format="json",
        )
        self.assertEqual(
            activate_response.status_code,
            200,
            activate_response.data,
        )
        response = self.client.patch(
            self._access_url(referral),
            {
                "notes": "Should not update",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        access.refresh_from_db()
        self.assertNotEqual(
            access.notes,
            "Should not update",
        )
    def test_reject_requires_reason_and_sets_audit(self):
        referral, access, _ = self._create_access(
            referral=self._referral(
                suffix="REJECT"
            )
        )
        missing_reason = self.client.post(
            self._status_url(referral),
            {"action": "reject"},
            format="json",
        )
        self.assertEqual(
            missing_reason.status_code,
            400,
        )
        response = self.client.post(
            self._status_url(referral),
            {
                "action": "reject",
                "reason": "Patient did not consent",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.REJECTED,
        )
        self.assertEqual(
            access.rejection_reason,
            "Patient did not consent",
        )
        self.assertEqual(
            access.rejected_by_id,
            self.owner.id,
        )
        self.assertIsNotNone(
            access.rejected_at
        )
    def test_revoke_requires_reason_and_sets_audit(self):
        referral = self._referral(
            status=MedicalReferralStatus.ACCEPTED,
            suffix="REVOKE",
        )
        referral, access, _ = self._create_access(
            referral=referral
        )
        activate_response = self.client.post(
            self._status_url(referral),
            {"action": "activate"},
            format="json",
        )
        self.assertEqual(
            activate_response.status_code,
            200,
            activate_response.data,
        )
        missing_reason = self.client.post(
            self._status_url(referral),
            {"action": "revoke"},
            format="json",
        )
        self.assertEqual(
            missing_reason.status_code,
            400,
        )
        response = self.client.post(
            self._status_url(referral),
            {
                "action": "revoke",
                "revocation_reason": (
                    "Referral access withdrawn"
                ),
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.REVOKED,
        )
        self.assertEqual(
            access.revocation_reason,
            "Referral access withdrawn",
        )
        self.assertEqual(
            access.revoked_by_id,
            self.owner.id,
        )
        self.assertIsNotNone(
            access.revoked_at
        )
        self.assertFalse(
            access.is_effective
        )
    def test_expire_sets_access_end(self):
        referral = self._referral(
            status=MedicalReferralStatus.ACCEPTED,
            suffix="EXPIRE",
        )
        referral, access, _ = self._create_access(
            referral=referral
        )
        activate_response = self.client.post(
            self._status_url(referral),
            {"action": "activate"},
            format="json",
        )
        self.assertEqual(
            activate_response.status_code,
            200,
            activate_response.data,
        )
        response = self.client.post(
            self._status_url(referral),
            {"action": "expire"},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.EXPIRED,
        )
        self.assertIsNotNone(
            access.access_ends_at
        )
        self.assertFalse(
            access.is_effective
        )
    def test_invalid_status_transition_is_rejected(self):
        referral, access, _ = self._create_access(
            referral=self._referral(
                suffix="INVALID-TRANSITION"
            )
        )
        response = self.client.post(
            self._status_url(referral),
            {"status": "REVOKED"},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        access.refresh_from_db()
        self.assertEqual(
            access.status,
            MedicalReferralAccessStatus.PENDING,
        )
    def test_status_transition_contract(self):
        self.assertEqual(
            STATUS_TRANSITIONS[
                MedicalReferralAccessStatus.PENDING
            ],
            {
                MedicalReferralAccessStatus.ACTIVE,
                MedicalReferralAccessStatus.REJECTED,
            },
        )
        self.assertEqual(
            STATUS_TRANSITIONS[
                MedicalReferralAccessStatus.ACTIVE
            ],
            {
                MedicalReferralAccessStatus.REVOKED,
                MedicalReferralAccessStatus.EXPIRED,
            },
        )
        for status_value in {
            MedicalReferralAccessStatus.REJECTED,
            MedicalReferralAccessStatus.REVOKED,
            MedicalReferralAccessStatus.EXPIRED,
        }:
            self.assertEqual(
                STATUS_TRANSITIONS[status_value],
                set(),
            )
for _inherited_test_name in dir(
    referral_tests.CompanyMedicalReferralApiTests
):
    if (
        _inherited_test_name.startswith("test_")
        and _inherited_test_name
        not in CompanyMedicalRecordAccessApiTests.__dict__
    ):
        setattr(
            CompanyMedicalRecordAccessApiTests,
            _inherited_test_name,
            None,
        )
