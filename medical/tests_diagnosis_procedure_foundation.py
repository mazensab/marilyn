from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from catalog.models import CatalogItem, CatalogItemType
from companies.models import Company
from .models import (
    MedicalDiagnosis,
    MedicalEncounter,
    MedicalPatient,
    MedicalProcedure,
    MedicalProcedureStatus,
)
class MedicalDiagnosisProcedureFoundationTests(TestCase):
    def setUp(self) -> None:
        self.company_a = Company.objects.create(
            name="Diagnosis Procedure Company A",
            company_code="DP-A",
        )
        self.company_b = Company.objects.create(
            name="Diagnosis Procedure Company B",
            company_code="DP-B",
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="DP-PAT-A-001",
            full_name="Patient A",
        )
        self.patient_a_two = MedicalPatient.objects.create(
            company=self.company_a,
            patient_number="DP-PAT-A-002",
            full_name="Patient A Two",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            patient_number="DP-PAT-B-001",
            full_name="Patient B",
        )
        self.encounter_a = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            encounter_number="DP-ENC-A-001",
        )
        self.encounter_a_two = MedicalEncounter.objects.create(
            company=self.company_a,
            patient=self.patient_a_two,
            encounter_number="DP-ENC-A-002",
        )
        self.encounter_b = MedicalEncounter.objects.create(
            company=self.company_b,
            patient=self.patient_b,
            encounter_number="DP-ENC-B-001",
        )
        self.service_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type=CatalogItemType.SERVICE,
            code="SRV-A-001",
            name="Laser Treatment",
            sale_price=Decimal("350.00"),
        )
        self.product_a = CatalogItem.objects.create(
            company=self.company_a,
            item_type=CatalogItemType.PRODUCT,
            code="PRD-A-001",
            name="Medical Product",
            sale_price=Decimal("50.00"),
        )
        self.service_b = CatalogItem.objects.create(
            company=self.company_b,
            item_type=CatalogItemType.SERVICE,
            code="SRV-B-001",
            name="Foreign Service",
            sale_price=Decimal("400.00"),
        )
    def test_diagnosis_normalization_and_defaults(self):
        diagnosis = MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_code=" l30.9 ",
            diagnosis_name="  Dermatitis  ",
            notes="  First diagnosis  ",
        )
        self.assertEqual(
            diagnosis.diagnosis_code,
            "L30.9",
        )
        self.assertEqual(
            diagnosis.diagnosis_name,
            "Dermatitis",
        )
        self.assertEqual(
            diagnosis.notes,
            "First diagnosis",
        )
        self.assertFalse(diagnosis.is_primary)
        self.assertIsNotNone(diagnosis.diagnosed_at)
    def test_diagnosis_patient_must_match_encounter(self):
        diagnosis = MedicalDiagnosis(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a_two,
            diagnosis_name="Mismatch",
        )
        with self.assertRaises(ValidationError):
            diagnosis.full_clean()
    def test_diagnosis_rejects_foreign_company_relation(self):
        diagnosis = MedicalDiagnosis(
            company=self.company_a,
            encounter=self.encounter_b,
            patient=self.patient_b,
            diagnosis_name="Foreign",
        )
        with self.assertRaises(ValidationError):
            diagnosis.full_clean()
    def test_only_one_primary_diagnosis_per_encounter(self):
        MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_name="Primary diagnosis",
            is_primary=True,
        )
        duplicate = MedicalDiagnosis(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_name="Second primary",
            is_primary=True,
        )
        with self.assertRaises(ValidationError):
            duplicate.save()
        secondary = MedicalDiagnosis.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            diagnosis_name="Secondary diagnosis",
            is_primary=False,
        )
        self.assertFalse(secondary.is_primary)
    def test_procedure_copies_catalog_snapshots(self):
        procedure = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            catalog_item=self.service_a,
        )
        self.assertEqual(
            procedure.procedure_code_snapshot,
            "SRV-A-001",
        )
        self.assertEqual(
            procedure.procedure_name_snapshot,
            "Laser Treatment",
        )
        self.assertEqual(
            procedure.unit_price_snapshot,
            Decimal("350.00"),
        )
        self.assertEqual(
            procedure.status,
            MedicalProcedureStatus.PLANNED,
        )
        self.assertEqual(
            procedure.quantity,
            Decimal("1"),
        )
    def test_manual_procedure_is_supported(self):
        procedure = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_code_snapshot=" manual-001 ",
            procedure_name_snapshot="  Manual Procedure  ",
            unit_price_snapshot=Decimal("0.00"),
        )
        self.assertEqual(
            procedure.procedure_code_snapshot,
            "MANUAL-001",
        )
        self.assertEqual(
            procedure.procedure_name_snapshot,
            "Manual Procedure",
        )
    def test_procedure_rejects_product_catalog_item(self):
        procedure = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            catalog_item=self.product_a,
            procedure_name_snapshot="Product procedure",
        )
        with self.assertRaises(ValidationError):
            procedure.full_clean()
    def test_procedure_rejects_foreign_catalog_item(self):
        procedure = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            catalog_item=self.service_b,
            procedure_name_snapshot="Foreign procedure",
        )
        with self.assertRaises(ValidationError):
            procedure.full_clean()
    def test_procedure_patient_must_match_encounter(self):
        procedure = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a_two,
            procedure_name_snapshot="Mismatch procedure",
        )
        with self.assertRaises(ValidationError):
            procedure.full_clean()
    def test_procedure_quantity_and_price_validation(self):
        invalid_quantity = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Invalid quantity",
            quantity=Decimal("0"),
        )
        with self.assertRaises(ValidationError):
            invalid_quantity.full_clean()
        invalid_price = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Invalid price",
            unit_price_snapshot=Decimal("-1.00"),
        )
        with self.assertRaises(ValidationError):
            invalid_price.full_clean()
    def test_completed_procedure_requires_performed_time(self):
        procedure = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Completed procedure",
            status=MedicalProcedureStatus.COMPLETED,
        )
        with self.assertRaises(ValidationError):
            procedure.full_clean()
        completed = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Completed procedure",
            status=MedicalProcedureStatus.COMPLETED,
            performed_at=timezone.now(),
        )
        self.assertIsNotNone(completed.performed_at)
    def test_cancelled_procedure_requires_reason(self):
        procedure = MedicalProcedure(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Cancelled procedure",
            status=MedicalProcedureStatus.CANCELLED,
        )
        with self.assertRaises(ValidationError):
            procedure.full_clean()
        cancelled = MedicalProcedure.objects.create(
            company=self.company_a,
            encounter=self.encounter_a,
            patient=self.patient_a,
            procedure_name_snapshot="Cancelled procedure",
            status=MedicalProcedureStatus.CANCELLED,
            cancellation_reason="Patient request",
        )
        self.assertEqual(
            cancelled.cancellation_reason,
            "Patient request",
        )
    def test_procedure_status_contract(self):
        self.assertEqual(
            set(MedicalProcedureStatus.values),
            {
                "PLANNED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
            },
        )
