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
    MedicalSpecialty,
)


User = get_user_model()


class CompanyMedicalStructureAPITests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

        self.company_a = self.create_company(
            code="MED-API-A",
            name="Medical API Company A",
        )
        self.company_b = self.create_company(
            code="MED-API-B",
            name="Medical API Company B",
        )

        self.branch_a = self.create_branch(
            company=self.company_a,
            code="MED-A-MAIN",
            name="Medical Branch A",
        )
        self.branch_b = self.create_branch(
            company=self.company_b,
            code="MED-B-MAIN",
            name="Medical Branch B",
        )

        self.user_a = User.objects.create_user(
            username="medical_api_owner_a",
            email="medical-api-a@example.com",
            password="StrongPass123!",
        )

        CompanyMembership.objects.create(
            user=self.user_a,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )

        self.client.force_authenticate(
            user=self.user_a,
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

        self.system_specialty = (
            MedicalSpecialty.objects.get(
                company__isnull=True,
                code="DENTISTRY",
            )
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

    def test_department_list_is_company_scoped(
        self,
    ) -> None:
        response = self.client.get(
            "/api/company/medical/departments/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertTrue(
            response.data["success"]
        )
        self.assertEqual(
            response.data["count"],
            1,
        )
        self.assertEqual(
            response.data["items"][0]["id"],
            self.department_a.id,
        )

    def test_department_create_ignores_company_id(
        self,
    ) -> None:
        response = self.client.post(
            "/api/company/medical/departments/",
            {
                "company_id": self.company_b.id,
                "code": "DERM-A",
                "name_ar": "??? ???????",
                "branch_ids": [
                    self.branch_a.id,
                ],
                "specialty_ids": [
                    self.system_specialty.id,
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        department = (
            MedicalDepartment.objects.get(
                code="DERM-A",
            )
        )

        self.assertEqual(
            department.company_id,
            self.company_a.id,
        )
        self.assertTrue(
            MedicalDepartmentBranch.objects.filter(
                company=self.company_a,
                department=department,
                branch=self.branch_a,
                is_active=True,
            ).exists()
        )

    def test_foreign_department_detail_is_hidden(
        self,
    ) -> None:
        response = self.client.get(
            (
                "/api/company/medical/departments/"
                f"{self.department_b.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_system_specialty_is_visible_and_read_only(
        self,
    ) -> None:
        list_response = self.client.get(
            "/api/company/medical/specialties/"
        )

        specialty_ids = {
            item["id"]
            for item in list_response.data["items"]
        }

        self.assertIn(
            self.system_specialty.id,
            specialty_ids,
        )

        update_response = self.client.patch(
            (
                "/api/company/medical/specialties/"
                f"{self.system_specialty.id}/"
            ),
            {
                "name_en": "Changed",
            },
            format="json",
        )

        self.assertEqual(
            update_response.status_code,
            400,
        )

    def test_clinic_rejects_foreign_branch(
        self,
    ) -> None:
        response = self.client.post(
            "/api/company/medical/clinics/",
            {
                "code": "CLINIC-A-01",
                "name_ar": "????? ??????",
                "branch_id": self.branch_b.id,
                "department_id": self.department_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertFalse(
            MedicalClinic.objects.filter(
                company=self.company_a,
                code="CLINIC-A-01",
            ).exists()
        )

    def test_department_status_endpoint(
        self,
    ) -> None:
        response = self.client.post(
            (
                "/api/company/medical/departments/"
                f"{self.department_a.id}/status/"
            ),
            {
                "action": "deactivate",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.department_a.refresh_from_db()

        self.assertFalse(
            self.department_a.is_active
        )

    def test_viewer_cannot_create_department(
        self,
    ) -> None:
        viewer = User.objects.create_user(
            username="medical_api_viewer",
            email="medical-viewer@example.com",
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
            "/api/company/medical/departments/",
            {
                "code": "FORBIDDEN",
                "name_ar": "??? ?????",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_summary_is_company_scoped(
        self,
    ) -> None:
        response = self.client.get(
            "/api/company/medical/summary/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            response.data["summary"]["branches"],
            1,
        )
        self.assertEqual(
            response.data["summary"]["departments"],
            1,
        )
        self.assertEqual(
            response.data["summary"][
                "system_specialties"
            ],
            15,
        )
