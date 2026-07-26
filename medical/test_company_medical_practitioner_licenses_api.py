from __future__ import annotations

from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import (
    CompanyMembership,
    CompanyRole,
)
from medical.models import (
    MedicalLicenseStatus,
    MedicalPractitionerLicense,
)
from medical.test_company_medical_practitioner_api import (
    CompanyMedicalPractitionerAPITests,
)


User = get_user_model()


class CompanyMedicalPractitionerLicenseAPITests(
    CompanyMedicalPractitionerAPITests
):
    def license_url(
        self,
        practitioner_id: int,
    ) -> str:
        return (
            "/api/company/medical/practitioners/"
            f"{practitioner_id}/licenses/"
        )

    def detail_url(
        self,
        practitioner_id: int,
        license_id: int,
    ) -> str:
        return (
            self.license_url(practitioner_id)
            + f"{license_id}/"
        )

    def status_url(
        self,
        practitioner_id: int,
        license_id: int,
    ) -> str:
        return (
            self.detail_url(
                practitioner_id,
                license_id,
            )
            + "status/"
        )

    def create_license(
        self,
        *,
        company=None,
        practitioner=None,
        license_number="SCFHS-10001",
        status=MedicalLicenseStatus.PENDING,
    ):
        return (
            MedicalPractitionerLicense.objects
            .create(
                company=company or self.company_a,
                practitioner=(
                    practitioner
                    or self.practitioner_a
                ),
                specialty=self.specialty,
                license_number=license_number,
                license_type=(
                    "Professional Registration"
                ),
                issuing_authority="SCFHS",
                status=status,
                issued_at=date(2025, 1, 1),
                expires_at=date(2027, 1, 1),
            )
        )

    def test_license_list_is_company_scoped(
        self,
    ) -> None:
        own = self.create_license()

        self.create_license(
            company=self.company_b,
            practitioner=self.practitioner_b,
            license_number="SCFHS-B-10001",
        )

        response = self.client.get(
            self.license_url(
                self.practitioner_a.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            response.data["count"],
            1,
        )
        self.assertEqual(
            response.data["items"][0]["id"],
            own.id,
        )

    def test_license_create_ignores_company_id(
        self,
    ) -> None:
        response = self.client.post(
            self.license_url(
                self.practitioner_a.id
            ),
            {
                "company_id": self.company_b.id,
                "specialty_id": self.specialty.id,
                "license_number": (
                    " scfhs-20001 "
                ),
                "license_type": (
                    "Professional Registration"
                ),
                "issuing_authority": "SCFHS",
                "status": "ACTIVE",
                "issued_at": "2025-01-01",
                "expires_at": "2027-01-01",
                "document_reference": "DOC-20001",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        item = (
            MedicalPractitionerLicense.objects
            .get(id=response.data["item"]["id"])
        )

        self.assertEqual(
            item.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            item.license_number,
            "SCFHS-20001",
        )

    def test_foreign_practitioner_is_hidden(
        self,
    ) -> None:
        response = self.client.get(
            self.license_url(
                self.practitioner_b.id
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_invalid_dates_are_rejected(
        self,
    ) -> None:
        response = self.client.post(
            self.license_url(
                self.practitioner_a.id
            ),
            {
                "license_number": "SCFHS-INVALID",
                "issuing_authority": "SCFHS",
                "issued_at": "2027-01-01",
                "expires_at": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_license_update(
        self,
    ) -> None:
        item = self.create_license()

        response = self.client.patch(
            self.detail_url(
                self.practitioner_a.id,
                item.id,
            ),
            {
                "license_type": (
                    "Updated Registration"
                ),
                "document_reference": (
                    "UPDATED-DOC"
                ),
                "notes": "Updated notes",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        item.refresh_from_db()

        self.assertEqual(
            item.license_type,
            "Updated Registration",
        )
        self.assertEqual(
            item.document_reference,
            "UPDATED-DOC",
        )

    def test_status_actions(
        self,
    ) -> None:
        item = self.create_license()

        verify_response = self.client.post(
            self.status_url(
                self.practitioner_a.id,
                item.id,
            ),
            {
                "action": "verify",
                "verified_at": "2026-01-02",
            },
            format="json",
        )

        self.assertEqual(
            verify_response.status_code,
            200,
            verify_response.data,
        )

        item.refresh_from_db()

        self.assertEqual(
            item.status,
            MedicalLicenseStatus.ACTIVE,
        )
        self.assertEqual(
            item.verified_at,
            date(2026, 1, 2),
        )

        suspend_response = self.client.post(
            self.status_url(
                self.practitioner_a.id,
                item.id,
            ),
            {
                "action": "suspend",
            },
            format="json",
        )

        self.assertEqual(
            suspend_response.status_code,
            200,
            suspend_response.data,
        )

        item.refresh_from_db()

        self.assertEqual(
            item.status,
            MedicalLicenseStatus.SUSPENDED,
        )

    def test_duplicate_license_number_rejected(
        self,
    ) -> None:
        self.create_license(
            license_number="SCFHS-DUPLICATE"
        )

        response = self.client.post(
            self.license_url(
                self.practitioner_a.id
            ),
            {
                "license_number": (
                    "SCFHS-DUPLICATE"
                ),
                "issuing_authority": "SCFHS",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_license_filters(
        self,
    ) -> None:
        self.create_license(
            license_number="SCFHS-ACTIVE",
            status=MedicalLicenseStatus.ACTIVE,
        )

        self.create_license(
            license_number="SCFHS-PENDING",
            status=MedicalLicenseStatus.PENDING,
        )

        response = self.client.get(
            self.license_url(
                self.practitioner_a.id
            ),
            {
                "status": "ACTIVE",
                "search": "ACTIVE",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            response.data["count"],
            1,
        )
        self.assertEqual(
            response.data["items"][0][
                "license_number"
            ],
            "SCFHS-ACTIVE",
        )

    def test_viewer_cannot_manage_licenses(
        self,
    ) -> None:
        item = self.create_license()

        viewer = User.objects.create_user(
            username="license_viewer",
            email="license-viewer@example.com",
            password="StrongPass123!",
        )

        CompanyMembership.objects.create(
            user=viewer,
            company=self.company_a,
            role=CompanyRole.VIEWER,
            is_primary=True,
        )

        viewer_client = APIClient()
        viewer_client.force_authenticate(
            user=viewer
        )

        list_response = viewer_client.get(
            self.license_url(
                self.practitioner_a.id
            )
        )

        create_response = viewer_client.post(
            self.license_url(
                self.practitioner_a.id
            ),
            {
                "license_number": (
                    "SCFHS-VIEWER"
                ),
            },
            format="json",
        )

        update_response = viewer_client.patch(
            self.detail_url(
                self.practitioner_a.id,
                item.id,
            ),
            {
                "notes": "Forbidden",
            },
            format="json",
        )

        status_response = viewer_client.post(
            self.status_url(
                self.practitioner_a.id,
                item.id,
            ),
            {
                "action": "suspend",
            },
            format="json",
        )

        self.assertEqual(
            list_response.status_code,
            200,
        )
        self.assertEqual(
            create_response.status_code,
            403,
        )
        self.assertEqual(
            update_response.status_code,
            403,
        )
        self.assertEqual(
            status_response.status_code,
            403,
        )
