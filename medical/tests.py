from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from accounting.models import CostCenter
from accounts.models import (
    COMPANY_ROLE_PERMISSIONS,
    CompanyMembership,
    CompanyRole,
)
from companies.models import Branch, Company

from .models import (
    MedicalClinic,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalSpecialty,
)


User = get_user_model()


class MedicalStructureFoundationTests(TestCase):
    def setUp(self) -> None:
        self.company_a = self._create_company(
            code="MED-A",
            name="Medical Company A",
        )
        self.company_b = self._create_company(
            code="MED-B",
            name="Medical Company B",
        )

        self.branch_a = self._create_branch(
            company=self.company_a,
            code="BR-A",
            name="Main Branch A",
        )
        self.branch_b = self._create_branch(
            company=self.company_b,
            code="BR-B",
            name="Main Branch B",
        )

        self.user_a = User.objects.create_user(
            username="medical_owner_a",
            email="medical-a@example.com",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="medical_owner_b",
            email="medical-b@example.com",
            password="StrongPass123!",
        )

        self.membership_a = CompanyMembership.objects.create(
            user=self.user_a,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )
        self.membership_b = CompanyMembership.objects.create(
            user=self.user_b,
            company=self.company_b,
            role=CompanyRole.OWNER,
            is_primary=True,
        )

        self.cost_center_a = CostCenter.objects.create(
            company=self.company_a,
            code="MED-A-CC",
            name="Medical Cost Center A",
            is_group=False,
        )
        self.cost_center_b = CostCenter.objects.create(
            company=self.company_b,
            code="MED-B-CC",
            name="Medical Cost Center B",
            is_group=False,
        )

    def _create_company(
        self,
        *,
        code: str,
        name: str,
    ) -> Company:
        fields = {field.name for field in Company._meta.fields}
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

    def _create_branch(
        self,
        *,
        company: Company,
        code: str,
        name: str,
    ) -> Branch:
        fields = {field.name for field in Branch._meta.fields}
        payload: dict[str, Any] = {"company": company}

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

    def _create_department(self) -> MedicalDepartment:
        return MedicalDepartment.objects.create(
            company=self.company_a,
            code="DENTAL",
            name_ar="??? ?? ???????",
            name_en="Dental Department",
            cost_center=self.cost_center_a,
            manager_membership=self.membership_a,
        )

    def test_system_specialties_are_seeded(self) -> None:
        specialty = MedicalSpecialty.objects.get(
            company__isnull=True,
            code="GENERAL-MEDICINE",
        )

        self.assertTrue(specialty.is_system)
        self.assertTrue(specialty.is_active)

    def test_department_accepts_same_company_relations(self) -> None:
        department = self._create_department()

        self.assertEqual(
            department.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            department.cost_center_id,
            self.cost_center_a.id,
        )
        self.assertEqual(
            department.manager_membership_id,
            self.membership_a.id,
        )

    def test_department_rejects_foreign_cost_center(self) -> None:
        with self.assertRaises(ValidationError):
            MedicalDepartment.objects.create(
                company=self.company_a,
                code="WRONG-CC",
                name_ar="??? ????",
                cost_center=self.cost_center_b,
            )

    def test_department_rejects_foreign_manager(self) -> None:
        with self.assertRaises(ValidationError):
            MedicalDepartment.objects.create(
                company=self.company_a,
                code="WRONG-MANAGER",
                name_ar="??? ????",
                manager_membership=self.membership_b,
            )

    def test_department_branch_rejects_foreign_branch(self) -> None:
        department = self._create_department()

        with self.assertRaises(ValidationError):
            MedicalDepartmentBranch.objects.create(
                company=self.company_a,
                department=department,
                branch=self.branch_b,
            )

    def test_clinic_requires_department_branch_assignment(self) -> None:
        department = self._create_department()

        with self.assertRaises(ValidationError):
            MedicalClinic.objects.create(
                company=self.company_a,
                branch=self.branch_a,
                department=department,
                code="DENTAL-01",
                name_ar="????? ??????? 1",
                room_number="101",
            )

        MedicalDepartmentBranch.objects.create(
            company=self.company_a,
            department=department,
            branch=self.branch_a,
            is_primary=True,
        )

        clinic = MedicalClinic.objects.create(
            company=self.company_a,
            branch=self.branch_a,
            department=department,
            code="DENTAL-01",
            name_ar="????? ??????? 1",
            room_number="101",
            is_default=True,
        )

        self.assertEqual(clinic.branch_id, self.branch_a.id)
        self.assertEqual(clinic.department_id, department.id)

    def test_custom_specialties_are_company_isolated(self) -> None:
        specialty_a = MedicalSpecialty.objects.create(
            company=self.company_a,
            code="CUSTOM-A",
            name_ar="???? ???? ?",
        )
        specialty_b = MedicalSpecialty.objects.create(
            company=self.company_b,
            code="CUSTOM-B",
            name_ar="???? ???? ?",
        )

        company_a_codes = set(
            MedicalSpecialty.objects.filter(
                company=self.company_a
            ).values_list("code", flat=True)
        )

        self.assertIn(specialty_a.code, company_a_codes)
        self.assertNotIn(specialty_b.code, company_a_codes)

    def test_admin_and_manager_receive_structure_permissions(self) -> None:
        admin_permissions = COMPANY_ROLE_PERMISSIONS[
            CompanyRole.ADMIN
        ]

        self.assertIn(
            "company.medical.departments.create",
            admin_permissions,
        )
        self.assertIn(
            "company.medical.clinics.update",
            admin_permissions,
        )

        manager = getattr(CompanyRole, "MANAGER", None)

        if manager is not None:
            self.assertIn(
                "company.medical.specialties.create",
                COMPANY_ROLE_PERMISSIONS[manager],
            )
