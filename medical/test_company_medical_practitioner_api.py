from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import (
    CompanyMembership,
    CompanyRole,
)
from companies.models import Branch, Company
from medical.models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalPractitioner,
    MedicalPractitionerStatus,
    MedicalSpecialty,
)


User = get_user_model()


class CompanyMedicalPractitionerAPITests(
    TestCase
):
    def setUp(self) -> None:
        self.client = APIClient()

        self.company_a = self.create_company(
            code="PRACT-API-A",
            name="Practitioner API Company A",
        )
        self.company_b = self.create_company(
            code="PRACT-API-B",
            name="Practitioner API Company B",
        )

        self.branch_a = self.create_branch(
            company=self.company_a,
            code="PRACT-A-MAIN",
            name="Practitioner Branch A",
        )
        self.branch_b = self.create_branch(
            company=self.company_b,
            code="PRACT-B-MAIN",
            name="Practitioner Branch B",
        )

        self.owner = User.objects.create_user(
            username="practitioner_api_owner",
            email="pract-owner@example.com",
            password="StrongPass123!",
        )

        self.owner_membership = (
            CompanyMembership.objects.create(
                user=self.owner,
                company=self.company_a,
                role=CompanyRole.OWNER,
                is_primary=True,
            )
        )

        self.foreign_user = (
            User.objects.create_user(
                username="practitioner_foreign",
                email="pract-foreign@example.com",
                password="StrongPass123!",
            )
        )

        self.foreign_membership = (
            CompanyMembership.objects.create(
                user=self.foreign_user,
                company=self.company_b,
                role=CompanyRole.OWNER,
                is_primary=True,
            )
        )

        self.department_a = (
            MedicalDepartment.objects.create(
                company=self.company_a,
                code="DENTAL-A",
                name_ar="??? ???????",
            )
        )
        self.department_b = (
            MedicalDepartment.objects.create(
                company=self.company_b,
                code="DENTAL-B",
                name_ar="??? ???? ????",
            )
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

        self.clinic_a = (
            MedicalClinic.objects.create(
                company=self.company_a,
                branch=self.branch_a,
                department=self.department_a,
                code="DENTAL-A-01",
                name_ar="????? ???????",
                room_number="101",
                is_default=True,
            )
        )
        self.clinic_b = (
            MedicalClinic.objects.create(
                company=self.company_b,
                branch=self.branch_b,
                department=self.department_b,
                code="DENTAL-B-01",
                name_ar="????? ???? ????",
                room_number="201",
                is_default=True,
            )
        )

        self.specialty = (
            MedicalSpecialty.objects.get(
                company__isnull=True,
                code="DENTISTRY",
            )
        )

        self.practitioner_a = (
            MedicalPractitioner.objects.create(
                company=self.company_a,
                membership=self.owner_membership,
                practitioner_number="PR-A-001",
                full_name_ar="?. ????",
                full_name_en="Dr. Ahmed",
                practitioner_type="DENTIST",
                primary_specialty=self.specialty,
                default_branch=self.branch_a,
                default_department=(
                    self.department_a
                ),
                default_clinic=self.clinic_a,
            )
        )

        self.practitioner_b = (
            MedicalPractitioner.objects.create(
                company=self.company_b,
                membership=(
                    self.foreign_membership
                ),
                practitioner_number="PR-B-001",
                full_name_en="Foreign Doctor",
                practitioner_type="DENTIST",
                primary_specialty=self.specialty,
                default_branch=self.branch_b,
                default_department=(
                    self.department_b
                ),
                default_clinic=self.clinic_b,
            )
        )

        self.client.force_authenticate(
            user=self.owner
        )

    def create_company(
        self,
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

    def test_list_is_company_scoped(
        self,
    ) -> None:
        response = self.client.get(
            "/api/company/medical/practitioners/"
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
            self.practitioner_a.id,
        )

    def test_create_ignores_company_id(
        self,
    ) -> None:
        response = self.client.post(
            "/api/company/medical/practitioners/",
            {
                "company_id": self.company_b.id,
                "practitioner_number": "PR-A-002",
                "full_name_ar": "?. ????",
                "full_name_en": "Dr. Sarah",
                "practitioner_type": "PHYSICIAN",
                "gender": "FEMALE",
                "primary_specialty_id": (
                    self.specialty.id
                ),
                "default_branch_id": (
                    self.branch_a.id
                ),
                "default_department_id": (
                    self.department_a.id
                ),
                "default_clinic_id": (
                    self.clinic_a.id
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        practitioner = (
            MedicalPractitioner.objects.get(
                practitioner_number="PR-A-002"
            )
        )

        self.assertEqual(
            practitioner.company_id,
            self.company_a.id,
        )

    def test_foreign_structure_is_rejected(
        self,
    ) -> None:
        response = self.client.post(
            "/api/company/medical/practitioners/",
            {
                "practitioner_number": "PR-A-003",
                "full_name_en": "Invalid Doctor",
                "practitioner_type": "PHYSICIAN",
                "default_branch_id": (
                    self.branch_b.id
                ),
                "default_clinic_id": (
                    self.clinic_b.id
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_foreign_detail_is_hidden(
        self,
    ) -> None:
        response = self.client.get(
            (
                "/api/company/medical/"
                "practitioners/"
                f"{self.practitioner_b.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_status_endpoint(
        self,
    ) -> None:
        response = self.client.post(
            (
                "/api/company/medical/"
                "practitioners/"
                f"{self.practitioner_a.id}/"
                "status/"
            ),
            {
                "action": "suspend",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        self.practitioner_a.refresh_from_db()

        self.assertEqual(
            self.practitioner_a.status,
            MedicalPractitionerStatus.SUSPENDED,
        )
        self.assertFalse(
            self.practitioner_a
            .is_accepting_appointments
        )

    def test_search_filter(
        self,
    ) -> None:
        response = self.client.get(
            (
                "/api/company/medical/"
                "practitioners/"
                "?search=Ahmed"
                "&practitioner_type=DENTIST"
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

    def test_viewer_cannot_create(
        self,
    ) -> None:
        viewer = User.objects.create_user(
            username="practitioner_viewer",
            email="pract-viewer@example.com",
            password="StrongPass123!",
        )

        CompanyMembership.objects.create(
            user=viewer,
            company=self.company_a,
            role=CompanyRole.VIEWER,
            is_primary=True,
        )

        self.client.force_authenticate(
            user=viewer,
        )

        response = self.client.post(
            "/api/company/medical/practitioners/",
            {
                "practitioner_number": "FORBIDDEN",
                "full_name_en": "Forbidden",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )
