# ============================================================
# ًں“‚ activity_backends/models.py
# ًں§  Mhamcloud | Activity-Specific Backend Models â€” Phase 25.3
# ============================================================
# âœ… Restaurant tables, menu categories/items, kitchen orders
# âœ… Clinic patients, services and appointments
# âœ… Contracting projects, work orders and cost lines
# âœ… Company-scoped tenant isolation
# âœ… Lightweight foundations without touching core apps
# ============================================================
# ط§ظ„ظ‚ط§ط¹ط¯ط© ط§ظ„ظ…ط¹طھظ…ط¯ط©:
# - ظƒظ„ ط³ط¬ظ„ ظ…ط±طھط¨ط· ط¨ط´ط±ظƒط© ظˆط§ط­ط¯ط© ظپظ‚ط·.
# - ظ„ط§ ظ†ط«ظ‚ ط¨ط£ظٹ company_id ظ‚ط§ط¯ظ… ظ…ظ† ط§ظ„ظˆط§ط¬ظ‡ط©.
# - ظ„ط§ ظ†ط¶ط¹ ظ…ظ†ط·ظ‚ ظ…ط­ط§ط³ط¨ظٹ ط£ظˆ ظ…ط®ط²ظ†ظٹ ط«ظ‚ظٹظ„ ط¯ط§ط®ظ„ models.py.
# - ظ‡ط°ظ‡ foundation ظ„ظ„ظ†ط´ط§ط·ط§طھ ط§ظ„ظ…طھط®طµطµط© ظˆطھطھظƒط§ظ…ظ„ ظ„ط§ط­ظ‚ط§ ط¹ط¨ط± services.
# ============================================================

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


MONEY_ZERO = Decimal("0.00")
QTY_ZERO = Decimal("0.0000")


def quant_money(value) -> Decimal:
    if value in [None, ""]:
        value = MONEY_ZERO
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def quant_qty(value) -> Decimal:
    if value in [None, ""]:
        value = QTY_ZERO
    return Decimal(str(value)).quantize(Decimal("0.0000"), rounding=ROUND_HALF_UP)


class ClinicAppointmentStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    CHECKED_IN = "CHECKED_IN", "Checked in"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
    NO_SHOW = "NO_SHOW", "No show"


class ClinicPatient(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="clinic_patients",
        db_index=True,
    )
    patient_number = models.CharField(max_length=80, db_index=True)
    full_name = models.CharField(max_length=220, db_index=True)
    mobile = models.CharField(max_length=50, blank=True, default="", db_index=True)
    email = models.EmailField(blank=True, default="")
    national_id = models.CharField(max_length=80, blank=True, default="", db_index=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["company_id", "full_name", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "patient_number"],
                name="unique_clinic_patient_number_per_company",
            ),
            models.UniqueConstraint(
                fields=["company", "national_id"],
                condition=~Q(national_id=""),
                name="unique_clinic_patient_national_id_per_company",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "mobile"]),
            models.Index(fields=["company", "full_name"]),
            models.Index(fields=["company", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.patient_number} - {self.full_name}"

    def clean(self) -> None:
        super().clean()
        self.patient_number = (self.patient_number or "").strip().upper()
        self.full_name = (self.full_name or "").strip()
        self.mobile = (self.mobile or "").strip()
        self.national_id = (self.national_id or "").strip()
        if not self.patient_number:
            raise ValidationError({"patient_number": "Patient number is required."})
        if not self.full_name:
            raise ValidationError({"full_name": "Patient full name is required."})


class ClinicService(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="clinic_services",
        db_index=True,
    )
    catalog_item_id = models.PositiveBigIntegerField(blank=True, null=True, db_index=True)
    code = models.CharField(max_length=80, db_index=True)
    name = models.CharField(max_length=220, db_index=True)
    department = models.CharField(max_length=160, blank=True, default="", db_index=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    price = models.DecimalField(max_digits=14, decimal_places=2, default=MONEY_ZERO)
    taxable = models.BooleanField(default=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("15.00"))
    is_active = models.BooleanField(default=True, db_index=True)
    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["company_id", "department", "name", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"],
                name="unique_clinic_service_code_per_company",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "department"]),
            models.Index(fields=["company", "is_active"]),
            models.Index(fields=["company", "catalog_item_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"

    def clean(self) -> None:
        super().clean()
        self.code = (self.code or "").strip().upper()
        self.name = (self.name or "").strip()
        self.department = (self.department or "").strip()
        self.price = quant_money(self.price)
        self.tax_rate = quant_money(self.tax_rate)
        if not self.code:
            raise ValidationError({"code": "Service code is required."})
        if not self.name:
            raise ValidationError({"name": "Service name is required."})
        if self.duration_minutes <= 0:
            raise ValidationError({"duration_minutes": "Duration must be greater than zero."})


class ClinicAppointment(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="clinic_appointments",
        db_index=True,
    )
    patient = models.ForeignKey(
        ClinicPatient,
        on_delete=models.PROTECT,
        related_name="appointments",
        db_index=True,
    )
    medical_patient = models.ForeignKey(
        "medical.MedicalPatient",
        on_delete=models.PROTECT,
        related_name="legacy_clinic_appointments",
        blank=True,
        null=True,
        db_index=True,
    )
    service = models.ForeignKey(
        ClinicService,
        on_delete=models.PROTECT,
        related_name="appointments",
        db_index=True,
    )
    appointment_number = models.CharField(max_length=80, db_index=True)
    appointment_at = models.DateTimeField(db_index=True)
    practitioner_name = models.CharField(max_length=180, blank=True, default="", db_index=True)
    status = models.CharField(
        max_length=20,
        choices=ClinicAppointmentStatus.choices,
        default=ClinicAppointmentStatus.SCHEDULED,
        db_index=True,
    )
    price_snapshot = models.DecimalField(max_digits=14, decimal_places=2, default=MONEY_ZERO)
    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["company_id", "-appointment_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "appointment_number"],
                name="unique_clinic_appointment_number_per_company",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "patient"]),
            models.Index(fields=["company", "medical_patient"]),
            models.Index(fields=["company", "service"]),
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "appointment_at"]),
            models.Index(fields=["company", "practitioner_name"]),
        ]

    def __str__(self) -> str:
        return self.appointment_number

    def clean(self) -> None:
        super().clean()
        self.appointment_number = (self.appointment_number or "").strip().upper()
        self.practitioner_name = (self.practitioner_name or "").strip()
        self.price_snapshot = quant_money(self.price_snapshot)
        if not self.appointment_number:
            raise ValidationError({"appointment_number": "Appointment number is required."})
        if self.patient_id and self.company_id and self.patient.company_id != self.company_id:
            raise ValidationError({"patient": "Patient must belong to the same company."})
        if (
            self.medical_patient_id
            and self.company_id
            and self.medical_patient.company_id != self.company_id
        ):
            raise ValidationError(
                {"medical_patient": "Medical patient must belong to the same company."}
            )
        if (
            self.patient_id
            and self.medical_patient_id
            and self.medical_patient.legacy_patient_id
            and self.medical_patient.legacy_patient_id != self.patient_id
        ):
            raise ValidationError(
                {"medical_patient": "Medical patient does not match the legacy patient."}
            )
        if self.service_id and self.company_id and self.service.company_id != self.company_id:
            raise ValidationError({"service": "Service must belong to the same company."})
        if self.service_id and self.price_snapshot == MONEY_ZERO:
            self.price_snapshot = quant_money(self.service.price)


