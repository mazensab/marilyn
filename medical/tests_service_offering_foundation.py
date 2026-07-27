from __future__ import annotations
from decimal import Decimal
from typing import Any
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from catalog.models import CatalogItem
from companies.models import Branch, Company
from medical.models import (
    MedicalClinic,
    MedicalClinicSpecialty,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
    MedicalServiceOffering,
    MedicalServiceOfferingStatus,
    MedicalSpecialty,
)
def create_company(
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
class MedicalServiceOfferingFoundationTests(
    TestCase
):
    def setUp(self) -> None:
        self.company_a = create_company(
            code="MSO-A",
            name="Medical Offering Company A",
        )
        self.company_b = create_company(
            code="MSO-B",
            name="Medical Offering Company B",
        )
        self.branch_a = create_branch(
            company=self.company_a,
            code="MSO-A-MAIN",
            name="Offering Branch A",
        )
        self.branch_a_second = create_branch(
            company=self.company_a,
            code="MSO-A-SECOND",
            name="Offering Branch A Second",
        )
        self.branch_b = create_branch(
            company=self.company_b,
            code="MSO-B-MAIN",
            name="Offering Branch B",
        )
        self.department_a = (
            MedicalDepartment.objects.create(
                company=self.company_a,
                code="DERM-A",
                name_ar="قسم الجلدية",
            )
        )
        self.department_b = (
            MedicalDepartment.objects.create(
                company=self.company_b,
                code="DERM-B",
                name_ar="قسم شركة أخرى",
            )
        )
        self.specialty_a = (
            MedicalSpecialty.objects.create(
                company=self.company_a,
                code="DERM-SERVICE-A",
                name_ar="تخصص الجلدية للخدمات",
            )
        )
        self.specialty_b = (
            MedicalSpecialty.objects.create(
                company=self.company_b,
                code="DERM-SERVICE-B",
                name_ar="تخصص شركة أخرى",
            )
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_a,
            department=self.department_a,
            branch=self.branch_a,
            is_primary=True,
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_a,
            department=self.department_a,
            branch=self.branch_a_second,
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_b,
            department=self.department_b,
            branch=self.branch_b,
            is_primary=True,
        )
        MedicalDepartmentSpecialty.objects.create(
            company=self.company_a,
            department=self.department_a,
            specialty=self.specialty_a,
            is_primary=True,
        )
        MedicalDepartmentSpecialty.objects.create(
            company=self.company_b,
            department=self.department_b,
            specialty=self.specialty_b,
            is_primary=True,
        )
        self.clinic_a = MedicalClinic.objects.create(
            company=self.company_a,
            branch=self.branch_a,
            department=self.department_a,
            code="DERM-A-01",
            name_ar="عيادة الجلدية",
            room_number="101",
            is_default=True,
        )
        self.clinic_a_second = (
            MedicalClinic.objects.create(
                company=self.company_a,
                branch=self.branch_a_second,
                department=self.department_a,
                code="DERM-A-02",
                name_ar="عيادة الجلدية الثانية",
                room_number="102",
                is_default=True,
            )
        )
        self.clinic_b = MedicalClinic.objects.create(
            company=self.company_b,
            branch=self.branch_b,
            department=self.department_b,
            code="DERM-B-01",
            name_ar="عيادة شركة أخرى",
            room_number="201",
            is_default=True,
        )
        MedicalClinicSpecialty.objects.create(
            company=self.company_a,
            clinic=self.clinic_a,
            specialty=self.specialty_a,
            is_primary=True,
        )
        MedicalClinicSpecialty.objects.create(
            company=self.company_a,
            clinic=self.clinic_a_second,
            specialty=self.specialty_a,
            is_primary=True,
        )
        MedicalClinicSpecialty.objects.create(
            company=self.company_b,
            clinic=self.clinic_b,
            specialty=self.specialty_b,
            is_primary=True,
        )
        self.service_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type="SERVICE",
            status="ACTIVE",
            code="DERM-CONSULT",
            name="Dermatology Consultation",
            sale_price=Decimal("300.00"),
            taxable=True,
            tax_rate=Decimal("15.00"),
            is_sellable=True,
        )
        self.service_b = CatalogItem.objects.create(
            company=self.company_b,
            item_type="SERVICE",
            status="ACTIVE",
            code="FOREIGN-SERVICE",
            name="Foreign Service",
            sale_price=Decimal("500.00"),
            is_sellable=True,
        )
        self.product_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type="PRODUCT",
            status="ACTIVE",
            code="DERM-PRODUCT",
            name="Dermatology Product",
            sale_price=Decimal("50.00"),
            is_sellable=True,
        )
    def build_offering(self, **overrides):
        payload = {
            "company": self.company_a,
            "catalog_item": self.service_a,
            "branch": self.branch_a,
            "department": self.department_a,
            "specialty": self.specialty_a,
            "clinic": self.clinic_a,
            "status": (
                MedicalServiceOfferingStatus.ACTIVE
            ),
            "duration_minutes": 30,
            "buffer_before_minutes": 5,
            "buffer_after_minutes": 10,
            "default_session_count": 1,
            "online_booking_enabled": True,
        }
        payload.update(overrides)
        return MedicalServiceOffering(**payload)
    def test_create_valid_service_offering(self):
        offering = self.build_offering()
        offering.save()
        self.assertIsNotNone(offering.id)
        self.assertEqual(
            offering.effective_sale_price,
            Decimal("300.00"),
        )
        self.assertEqual(
            offering.total_slot_minutes,
            45,
        )
        self.assertTrue(
            offering.is_active_offering
        )
    def test_price_override_is_used(self):
        offering = self.build_offering(
            sale_price_override=Decimal("275.00"),
        )
        offering.save()
        self.assertEqual(
            offering.effective_sale_price,
            Decimal("275.00"),
        )
    def test_product_cannot_be_offered(self):
        offering = self.build_offering(
            catalog_item=self.product_a,
        )
        with self.assertRaises(ValidationError):
            offering.save()
    def test_foreign_catalog_item_is_rejected(self):
        offering = self.build_offering(
            catalog_item=self.service_b,
        )
        with self.assertRaises(ValidationError):
            offering.save()
    def test_foreign_structure_is_rejected(self):
        offering = self.build_offering(
            branch=self.branch_b,
            department=self.department_b,
            specialty=self.specialty_b,
            clinic=self.clinic_b,
        )
        with self.assertRaises(ValidationError):
            offering.save()
    def test_clinic_must_match_branch(self):
        offering = self.build_offering(
            branch=self.branch_a_second,
        )
        with self.assertRaises(ValidationError):
            offering.save()
    def test_clinic_must_match_department(self):
        other_department = (
            MedicalDepartment.objects.create(
                company=self.company_a,
                code="LASER-A",
                name_ar="قسم الليزر",
            )
        )
        MedicalDepartmentBranch.objects.create(
            company=self.company_a,
            department=other_department,
            branch=self.branch_a,
        )
        MedicalDepartmentSpecialty.objects.create(
            company=self.company_a,
            department=other_department,
            specialty=self.specialty_a,
        )
        offering = self.build_offering(
            department=other_department,
        )
        with self.assertRaises(ValidationError):
            offering.save()
    def test_department_branch_link_is_required(self):
        MedicalDepartmentBranch.objects.filter(
            company=self.company_a,
            department=self.department_a,
            branch=self.branch_a,
        ).delete()
        offering = self.build_offering()
        with self.assertRaises(ValidationError):
            offering.save()
    def test_department_specialty_link_is_required(
        self,
    ):
        MedicalDepartmentSpecialty.objects.filter(
            company=self.company_a,
            department=self.department_a,
            specialty=self.specialty_a,
        ).delete()
        offering = self.build_offering()
        with self.assertRaises(ValidationError):
            offering.save()
    def test_clinic_specialty_link_is_required(self):
        MedicalClinicSpecialty.objects.filter(
            company=self.company_a,
            clinic=self.clinic_a,
            specialty=self.specialty_a,
        ).delete()
        offering = self.build_offering()
        with self.assertRaises(ValidationError):
            offering.save()
    def test_active_offering_requires_active_service(
        self,
    ):
        self.service_a.status = "INACTIVE"
        self.service_a.save()
        offering = self.build_offering()
        with self.assertRaises(ValidationError):
            offering.save()
    def test_inactive_offering_allows_inactive_service(
        self,
    ):
        self.service_a.status = "INACTIVE"
        self.service_a.save()
        offering = self.build_offering(
            status=(
                MedicalServiceOfferingStatus.INACTIVE
            )
        )
        offering.save()
        self.assertEqual(
            offering.status,
            MedicalServiceOfferingStatus.INACTIVE,
        )
        self.assertFalse(
            offering.is_active_offering
        )
    def test_duplicate_scope_is_rejected(self):
        self.build_offering().save()
        duplicate = self.build_offering()
        with self.assertRaises(
            (
                ValidationError,
                IntegrityError,
            )
        ):
            duplicate.save()
    def test_duration_and_session_count_must_be_positive(
        self,
    ):
        invalid_duration = self.build_offering(
            duration_minutes=0,
        )
        with self.assertRaises(ValidationError):
            invalid_duration.save()
        invalid_sessions = self.build_offering(
            default_session_count=0,
        )
        with self.assertRaises(ValidationError):
            invalid_sessions.save()
    def test_preparation_instructions_are_normalized(
        self,
    ):
        offering = self.build_offering(
            requires_preparation=True,
            preparation_instructions=(
                "  Avoid active products  "
            ),
        )
        offering.save()
        self.assertEqual(
            offering.preparation_instructions,
            "Avoid active products",
        )
