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

# Phase 10.2-B - Healthcare Practitioners Tests
from datetime import date


from .models import (
    MedicalLicenseStatus,
    MedicalPractitioner,
    MedicalPractitionerAssignment,
    MedicalPractitionerLicense,
    MedicalPractitionerSpecialty,
    MedicalPractitionerStatus,
    MedicalSpecialty,
)


class MedicalPractitionerFoundationTests(TestCase):
    def setUp(self) -> None:
        self.company_a = self._create_company(
            code="PRACT-A",
            name="Practitioner Company A",
        )
        self.company_b = self._create_company(
            code="PRACT-B",
            name="Practitioner Company B",
        )

        self.branch_a = self._create_branch(
            company=self.company_a,
            code="PRACT-A-MAIN",
            name="Practitioner Branch A",
        )
        self.branch_b = self._create_branch(
            company=self.company_b,
            code="PRACT-B-MAIN",
            name="Practitioner Branch B",
        )

        self.user_a = User.objects.create_user(
            username="practitioner_a",
            email="practitioner-a@example.com",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="practitioner_b",
            email="practitioner-b@example.com",
            password="StrongPass123!",
        )

        self.membership_a = CompanyMembership.objects.create(
            user=self.user_a,
            company=self.company_a,
            role=CompanyRole.EMPLOYEE,
            is_primary=True,
        )
        self.membership_b = CompanyMembership.objects.create(
            user=self.user_b,
            company=self.company_b,
            role=CompanyRole.EMPLOYEE,
            is_primary=True,
        )

        self.department_a = MedicalDepartment.objects.create(
            company=self.company_a,
            code="DENTAL-A",
            name_ar="??? ???????",
        )
        self.department_b = MedicalDepartment.objects.create(
            company=self.company_b,
            code="DENTAL-B",
            name_ar="??? ??????? ?????",
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
            code="DENTAL-A-01",
            name_ar="????? ???????",
            room_number="101",
            is_default=True,
        )
        self.clinic_b = MedicalClinic.objects.create(
            company=self.company_b,
            branch=self.branch_b,
            department=self.department_b,
            code="DENTAL-B-01",
            name_ar="????? ??????? ??????",
            room_number="201",
            is_default=True,
        )

        self.system_specialty = MedicalSpecialty.objects.get(
            company__isnull=True,
            code="DENTISTRY",
        )

    def _create_company(
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

    def _create_branch(
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

    def _create_practitioner(
        self,
    ) -> MedicalPractitioner:
        return MedicalPractitioner.objects.create(
            company=self.company_a,
            membership=self.membership_a,
            practitioner_number="PR-A-001",
            full_name_ar="?. ????",
            full_name_en="Dr. Ahmed",
            primary_specialty=self.system_specialty,
            default_branch=self.branch_a,
            default_department=self.department_a,
            default_clinic=self.clinic_a,
            status=MedicalPractitionerStatus.ACTIVE,
        )

    def test_practitioner_accepts_same_company_structure(
        self,
    ) -> None:
        practitioner = self._create_practitioner()

        self.assertEqual(
            practitioner.company_id,
            self.company_a.id,
        )
        self.assertEqual(
            practitioner.membership_id,
            self.membership_a.id,
        )
        self.assertEqual(
            practitioner.default_clinic_id,
            self.clinic_a.id,
        )
        self.assertTrue(
            practitioner.is_accepting_appointments
        )

    def test_practitioner_rejects_foreign_membership(
        self,
    ) -> None:
        with self.assertRaises(ValidationError):
            MedicalPractitioner.objects.create(
                company=self.company_a,
                membership=self.membership_b,
                practitioner_number="PR-A-002",
                full_name_en="Wrong Practitioner",
            )

    def test_practitioner_rejects_foreign_clinic(
        self,
    ) -> None:
        with self.assertRaises(ValidationError):
            MedicalPractitioner.objects.create(
                company=self.company_a,
                membership=self.membership_a,
                practitioner_number="PR-A-003",
                full_name_en="Wrong Clinic Practitioner",
                default_clinic=self.clinic_b,
            )

    def test_practitioner_employee_field_targets_hr_employee(
        self,
    ) -> None:
        field = MedicalPractitioner._meta.get_field(
            "employee"
        )

        self.assertEqual(
            field.remote_field.model._meta.label,
            "hr.Employee",
        )

    def test_practitioner_specialty_and_assignment(
        self,
    ) -> None:
        practitioner = self._create_practitioner()

        specialty_link = (
            MedicalPractitionerSpecialty.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                specialty=self.system_specialty,
                is_primary=True,
                years_experience=5,
            )
        )

        assignment = (
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                branch=self.branch_a,
                department=self.department_a,
                clinic=self.clinic_a,
                is_primary=True,
                working_hours={
                    "sunday": [
                        {
                            "from": "09:00",
                            "to": "17:00",
                        }
                    ]
                },
            )
        )

        self.assertTrue(specialty_link.is_primary)
        self.assertTrue(assignment.is_primary)
        self.assertEqual(
            assignment.clinic_id,
            self.clinic_a.id,
        )

    def test_assignment_rejects_foreign_branch(
        self,
    ) -> None:
        practitioner = self._create_practitioner()

        with self.assertRaises(ValidationError):
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                branch=self.branch_b,
            )

    def test_license_validates_company_and_dates(
        self,
    ) -> None:
        practitioner = self._create_practitioner()

        license_obj = (
            MedicalPractitionerLicense.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                specialty=self.system_specialty,
                license_number="SCFHS-10001",
                license_type="Professional Registration",
                issuing_authority="SCFHS",
                status=MedicalLicenseStatus.ACTIVE,
                issued_at=date(2025, 1, 1),
                expires_at=date(2027, 1, 1),
            )
        )

        self.assertEqual(
            license_obj.practitioner_id,
            practitioner.id,
        )

        with self.assertRaises(ValidationError):
            MedicalPractitionerLicense.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                license_number="SCFHS-INVALID",
                issuing_authority="SCFHS",
                issued_at=date(2027, 1, 1),
                expires_at=date(2026, 1, 1),
            )

    def test_one_active_primary_assignment_only(
        self,
    ) -> None:
        practitioner = self._create_practitioner()

        MedicalPractitionerAssignment.objects.create(
            company=self.company_a,
            practitioner=practitioner,
            branch=self.branch_a,
            department=self.department_a,
            clinic=self.clinic_a,
            is_primary=True,
        )

        with self.assertRaises(ValidationError):
            MedicalPractitionerAssignment.objects.create(
                company=self.company_a,
                practitioner=practitioner,
                branch=self.branch_a,
                is_primary=True,
            )

    def test_roles_receive_practitioner_permissions(
        self,
    ) -> None:
        admin_permissions = COMPANY_ROLE_PERMISSIONS[
            CompanyRole.ADMIN
        ]

        self.assertIn(
            "company.medical.practitioners.create",
            admin_permissions,
        )
        self.assertIn(
            "company.medical.practitioners.licenses.update",
            admin_permissions,
        )
# End Phase 10.2-B - Healthcare Practitioners Tests
