from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


def clean_text(value) -> str:
    return str(value or "").strip()


def normalize_code(value) -> str:
    return clean_text(value).upper().replace(" ", "-")


class MedicalAuditModel(models.Model):
    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(app_label)s_%(class)s_records",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_%(app_label)s_%(class)s_records",
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class MedicalSettings(MedicalAuditModel):
    company = models.OneToOneField(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_settings",
    )
    patient_number_prefix = models.CharField(
        max_length=20,
        default="PAT",
    )
    practitioner_number_prefix = models.CharField(
        max_length=20,
        default="PRC",
    )
    default_appointment_duration = models.PositiveIntegerField(
        default=30,
    )
    default_registration_branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_medical_registration_settings",
    )
    require_patient_identifier = models.BooleanField(default=False)
    allow_duplicate_patient_override = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Medical settings"
        verbose_name_plural = "Medical settings"

    def __str__(self) -> str:
        return f"Medical settings - {self.company}"

    def clean(self) -> None:
        super().clean()

        self.patient_number_prefix = normalize_code(
            self.patient_number_prefix
        )
        self.practitioner_number_prefix = normalize_code(
            self.practitioner_number_prefix
        )

        if self.default_appointment_duration <= 0:
            raise ValidationError(
                {
                    "default_appointment_duration": (
                        "Appointment duration must be greater than zero."
                    )
                }
            )

        if (
            self.default_registration_branch_id
            and self.company_id
            and self.default_registration_branch.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "default_registration_branch": (
                        "Default registration branch must belong "
                        "to the same company."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MedicalDepartment(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_departments",
        db_index=True,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )
    code = models.CharField(max_length=50, db_index=True)
    name_ar = models.CharField(max_length=180, db_index=True)
    name_en = models.CharField(
        max_length=180,
        blank=True,
        default="",
        db_index=True,
    )
    description = models.TextField(blank=True, default="")
    cost_center = models.ForeignKey(
        "accounting.CostCenter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_departments",
    )
    manager_membership = models.ForeignKey(
        "accounts.CompanyMembership",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_medical_departments",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = [
            "company_id",
            "sort_order",
            "name_ar",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"],
                name="medical_dept_code_company_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "is_active"]),
            models.Index(fields=["company", "parent"]),
            models.Index(fields=["company", "sort_order"]),
            models.Index(fields=["company", "cost_center"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.display_name}"

    @property
    def display_name(self) -> str:
        return self.name_ar or self.name_en or self.code

    def clean(self) -> None:
        super().clean()

        self.code = normalize_code(self.code)
        self.name_ar = clean_text(self.name_ar)
        self.name_en = clean_text(self.name_en)
        self.description = clean_text(self.description)

        if not self.code:
            raise ValidationError({"code": "Department code is required."})

        if not self.name_ar:
            raise ValidationError(
                {"name_ar": "Arabic department name is required."}
            )

        if self.parent_id:
            if self.pk and self.parent_id == self.pk:
                raise ValidationError(
                    {"parent": "Department cannot be its own parent."}
                )

            if (
                self.company_id
                and self.parent.company_id != self.company_id
            ):
                raise ValidationError(
                    {
                        "parent": (
                            "Parent department must belong "
                            "to the same company."
                        )
                    }
                )

            current = self.parent
            visited: set[int] = set()

            while current is not None:
                if current.pk:
                    if current.pk in visited:
                        raise ValidationError(
                            {
                                "parent": (
                                    "Department hierarchy contains a cycle."
                                )
                            }
                        )

                    visited.add(current.pk)

                if self.pk and current.pk == self.pk:
                    raise ValidationError(
                        {
                            "parent": (
                                "Department hierarchy cannot reference "
                                "the same department."
                            )
                        }
                    )

                current = current.parent

        if (
            self.manager_membership_id
            and self.company_id
            and self.manager_membership.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "manager_membership": (
                        "Department manager must belong "
                        "to the same company."
                    )
                }
            )

        if (
            self.cost_center_id
            and self.company_id
            and self.cost_center.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "cost_center": (
                        "Cost center must belong to the same company."
                    )
                }
            )

        if (
            self.cost_center_id
            and not self.cost_center.can_post
        ):
            raise ValidationError(
                {
                    "cost_center": (
                        "A posting-enabled cost center is required."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MedicalDepartmentBranch(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_department_branches",
        db_index=True,
    )
    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.CASCADE,
        related_name="branch_assignments",
    )
    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_department_assignments",
    )
    manager_membership = models.ForeignKey(
        "accounts.CompanyMembership",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_medical_department_branches",
    )
    is_primary = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = [
            "company_id",
            "department_id",
            "-is_primary",
            "branch_id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["department", "branch"],
                name="medical_dept_branch_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "branch", "is_active"]),
            models.Index(
                fields=["company", "department", "is_active"]
            ),
        ]

    def __str__(self) -> str:
        return f"{self.department} - {self.branch}"

    def clean(self) -> None:
        super().clean()

        if (
            self.department_id
            and self.company_id
            and self.department.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "department": (
                        "Department must belong to the same company."
                    )
                }
            )

        if (
            self.branch_id
            and self.company_id
            and self.branch.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "branch": (
                        "Branch must belong to the same company."
                    )
                }
            )

        if (
            self.manager_membership_id
            and self.company_id
            and self.manager_membership.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "manager_membership": (
                        "Branch department manager must belong "
                        "to the same company."
                    )
                }
            )

        if (
            self.opening_time
            and self.closing_time
            and self.closing_time <= self.opening_time
        ):
            raise ValidationError(
                {
                    "closing_time": (
                        "Closing time must be after opening time."
                    )
                }
            )

    def save(self, *args, **kwargs):
        if self.department_id and not self.company_id:
            self.company_id = self.department.company_id

        self.full_clean()
        super().save(*args, **kwargs)


class MedicalSpecialty(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="medical_specialties",
        db_index=True,
    )
    code = models.CharField(max_length=80, db_index=True)
    name_ar = models.CharField(max_length=180, db_index=True)
    name_en = models.CharField(
        max_length=180,
        blank=True,
        default="",
        db_index=True,
    )
    description = models.TextField(blank=True, default="")
    is_system = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = [
            "-is_system",
            "sort_order",
            "name_ar",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                condition=Q(company__isnull=True),
                name="medical_specialty_system_code_uniq",
            ),
            models.UniqueConstraint(
                fields=["company", "code"],
                condition=Q(company__isnull=False),
                name="medical_specialty_company_code_uniq",
            ),
            models.CheckConstraint(
                condition=(
                    Q(is_system=True, company__isnull=True)
                    | Q(is_system=False, company__isnull=False)
                ),
                name="medical_specialty_scope_check",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "is_system", "is_active"]
            ),
            models.Index(fields=["code", "is_active"]),
            models.Index(fields=["sort_order", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.display_name}"

    @property
    def display_name(self) -> str:
        return self.name_ar or self.name_en or self.code

    def clean(self) -> None:
        super().clean()

        self.code = normalize_code(self.code)
        self.name_ar = clean_text(self.name_ar)
        self.name_en = clean_text(self.name_en)
        self.description = clean_text(self.description)
        self.is_system = self.company_id is None

        if not self.code:
            raise ValidationError({"code": "Specialty code is required."})

        if not self.name_ar:
            raise ValidationError(
                {"name_ar": "Arabic specialty name is required."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MedicalDepartmentSpecialty(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_department_specialties",
        db_index=True,
    )
    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.CASCADE,
        related_name="specialty_assignments",
    )
    specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        related_name="department_assignments",
    )
    is_primary = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = [
            "company_id",
            "department_id",
            "-is_primary",
            "specialty_id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["department", "specialty"],
                name="medical_dept_specialty_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "department", "is_active"]
            ),
            models.Index(
                fields=["company", "specialty", "is_active"]
            ),
        ]

    def __str__(self) -> str:
        return f"{self.department} - {self.specialty}"

    def clean(self) -> None:
        super().clean()

        if (
            self.department_id
            and self.company_id
            and self.department.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "department": (
                        "Department must belong to the same company."
                    )
                }
            )

        if self.specialty_id and self.company_id:
            specialty_company_id = self.specialty.company_id

            if (
                specialty_company_id is not None
                and specialty_company_id != self.company_id
            ):
                raise ValidationError(
                    {
                        "specialty": (
                            "Specialty must be system-wide or belong "
                            "to the same company."
                        )
                    }
                )

    def save(self, *args, **kwargs):
        if self.department_id and not self.company_id:
            self.company_id = self.department.company_id

        self.full_clean()
        super().save(*args, **kwargs)


class MedicalClinic(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_clinics",
        db_index=True,
    )
    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_clinics",
    )
    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        related_name="clinics",
    )
    code = models.CharField(max_length=60, db_index=True)
    name_ar = models.CharField(max_length=180, db_index=True)
    name_en = models.CharField(
        max_length=180,
        blank=True,
        default="",
        db_index=True,
    )
    room_number = models.CharField(
        max_length=60,
        blank=True,
        default="",
        db_index=True,
    )
    floor = models.CharField(
        max_length=60,
        blank=True,
        default="",
        db_index=True,
    )
    capacity = models.PositiveIntegerField(default=1)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    is_default = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = [
            "company_id",
            "branch_id",
            "department_id",
            "code",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"],
                name="medical_clinic_code_company_uniq",
            ),
            models.UniqueConstraint(
                fields=["branch", "room_number"],
                condition=~Q(room_number=""),
                name="medical_clinic_room_branch_uniq",
            ),
            models.UniqueConstraint(
                fields=["company", "branch", "department"],
                condition=Q(is_default=True),
                name="medical_clinic_default_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "branch", "is_active"]
            ),
            models.Index(
                fields=["company", "department", "is_active"]
            ),
            models.Index(fields=["company", "is_default"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.display_name}"

    @property
    def display_name(self) -> str:
        return self.name_ar or self.name_en or self.code

    def clean(self) -> None:
        super().clean()

        self.code = normalize_code(self.code)
        self.name_ar = clean_text(self.name_ar)
        self.name_en = clean_text(self.name_en)
        self.room_number = clean_text(self.room_number)
        self.floor = clean_text(self.floor)
        self.description = clean_text(self.description)

        if not self.code:
            raise ValidationError({"code": "Clinic code is required."})

        if not self.name_ar:
            raise ValidationError(
                {"name_ar": "Arabic clinic name is required."}
            )

        if self.capacity <= 0:
            raise ValidationError(
                {"capacity": "Clinic capacity must be greater than zero."}
            )

        if (
            self.branch_id
            and self.company_id
            and self.branch.company_id != self.company_id
        ):
            raise ValidationError(
                {"branch": "Branch must belong to the same company."}
            )

        if (
            self.department_id
            and self.company_id
            and self.department.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "department": (
                        "Department must belong to the same company."
                    )
                }
            )

        if (
            self.branch_id
            and self.department_id
            and self.company_id
            and not MedicalDepartmentBranch.objects.filter(
                company_id=self.company_id,
                department_id=self.department_id,
                branch_id=self.branch_id,
                is_active=True,
            ).exists()
        ):
            raise ValidationError(
                {
                    "department": (
                        "Department must be active in the selected branch "
                        "before creating a clinic."
                    )
                }
            )

        if (
            self.opening_time
            and self.closing_time
            and self.closing_time <= self.opening_time
        ):
            raise ValidationError(
                {
                    "closing_time": (
                        "Closing time must be after opening time."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MedicalClinicSpecialty(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_clinic_specialties",
        db_index=True,
    )
    clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.CASCADE,
        related_name="specialty_assignments",
    )
    specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        related_name="clinic_assignments",
    )
    is_primary = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = [
            "company_id",
            "clinic_id",
            "-is_primary",
            "specialty_id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["clinic", "specialty"],
                name="medical_clinic_specialty_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "clinic", "is_active"]
            ),
            models.Index(
                fields=["company", "specialty", "is_active"]
            ),
        ]

    def __str__(self) -> str:
        return f"{self.clinic} - {self.specialty}"

    def clean(self) -> None:
        super().clean()

        if (
            self.clinic_id
            and self.company_id
            and self.clinic.company_id != self.company_id
        ):
            raise ValidationError(
                {"clinic": "Clinic must belong to the same company."}
            )

        if self.specialty_id and self.company_id:
            specialty_company_id = self.specialty.company_id

            if (
                specialty_company_id is not None
                and specialty_company_id != self.company_id
            ):
                raise ValidationError(
                    {
                        "specialty": (
                            "Specialty must be system-wide or belong "
                            "to the same company."
                        )
                    }
                )

    def save(self, *args, **kwargs):
        if self.clinic_id and not self.company_id:
            self.company_id = self.clinic.company_id

        self.full_clean()
        super().save(*args, **kwargs)

# Phase 10.2-B - Healthcare Practitioners Models
from django.core.validators import MinValueValidator


class MedicalPractitionerType(models.TextChoices):
    PHYSICIAN = "PHYSICIAN", "Physician"
    DENTIST = "DENTIST", "Dentist"
    NURSE = "NURSE", "Nurse"
    PHARMACIST = "PHARMACIST", "Pharmacist"
    TECHNICIAN = "TECHNICIAN", "Technician"
    THERAPIST = "THERAPIST", "Therapist"
    OTHER = "OTHER", "Other"


class MedicalPractitionerStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"
    ON_LEAVE = "ON_LEAVE", "On leave"


class MedicalPractitionerGender(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"
    UNSPECIFIED = "UNSPECIFIED", "Unspecified"


class MedicalLicenseStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    EXPIRED = "EXPIRED", "Expired"
    SUSPENDED = "SUSPENDED", "Suspended"
    REVOKED = "REVOKED", "Revoked"


class MedicalPractitioner(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_practitioners",
    )

    membership = models.ForeignKey(
        "accounts.CompanyMembership",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="medical_practitioner_profiles",
    )

    employee = models.ForeignKey(
        "hr.Employee",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="medical_practitioner_profiles",
    )

    practitioner_number = models.CharField(
        max_length=50,
    )

    full_name_ar = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )
    full_name_en = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )

    professional_title = models.CharField(
        max_length=160,
        blank=True,
        default="",
    )

    practitioner_type = models.CharField(
        max_length=30,
        choices=MedicalPractitionerType.choices,
        default=MedicalPractitionerType.PHYSICIAN,
    )

    gender = models.CharField(
        max_length=20,
        choices=MedicalPractitionerGender.choices,
        default=MedicalPractitionerGender.UNSPECIFIED,
    )

    nationality = models.CharField(
        max_length=120,
        blank=True,
        default="",
    )
    mobile = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )
    email = models.EmailField(
        blank=True,
        default="",
    )

    primary_specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="primary_practitioners",
    )

    default_branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="default_medical_practitioners",
    )

    default_department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="default_practitioners",
    )

    default_clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="default_practitioners",
    )

    hire_date = models.DateField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=MedicalPractitionerStatus.choices,
        default=MedicalPractitionerStatus.ACTIVE,
    )

    is_accepting_appointments = models.BooleanField(
        default=True,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
    )

    class Meta:
        ordering = [
            "company_id",
            "practitioner_number",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "practitioner_number",
                ],
                name="medical_practitioner_number_company_uniq",
            ),
            models.UniqueConstraint(
                fields=[
                    "company",
                    "membership",
                ],
                condition=models.Q(
                    membership__isnull=False,
                ),
                name="medical_practitioner_membership_uniq",
            ),
            models.UniqueConstraint(
                fields=[
                    "company",
                    "employee",
                ],
                condition=models.Q(
                    employee__isnull=False,
                ),
                name="medical_practitioner_employee_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner_type",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "primary_specialty",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "default_branch",
                ],
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.practitioner_number} - "
            f"{self.display_name}"
        )

    @property
    def display_name(self) -> str:
        return (
            self.full_name_ar
            or self.full_name_en
            or self.practitioner_number
        )

    def clean(self) -> None:
        super().clean()

        self.practitioner_number = (
            self.practitioner_number or ""
        ).strip().upper()

        self.full_name_ar = (
            self.full_name_ar or ""
        ).strip()
        self.full_name_en = (
            self.full_name_en or ""
        ).strip()
        self.professional_title = (
            self.professional_title or ""
        ).strip()
        self.nationality = (
            self.nationality or ""
        ).strip()
        self.mobile = (
            self.mobile or ""
        ).strip()
        self.email = (
            self.email or ""
        ).strip().lower()
        self.notes = (
            self.notes or ""
        ).strip()

        if not self.practitioner_number:
            raise ValidationError(
                {
                    "practitioner_number":
                        "Practitioner number is required."
                }
            )

        if not self.full_name_ar and not self.full_name_en:
            raise ValidationError(
                {
                    "full_name_ar":
                        "At least one practitioner name is required."
                }
            )

        if (
            self.membership_id
            and self.company_id
            and self.membership.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "membership":
                        "Membership must belong to the same company."
                }
            )

        if (
            self.employee_id
            and self.company_id
            and self.employee.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "employee":
                        "Employee must belong to the same company."
                }
            )

        if (
            self.membership_id
            and self.employee_id
            and getattr(
                self.employee,
                "user_id",
                None,
            )
            and self.membership.user_id
            != self.employee.user_id
        ):
            raise ValidationError(
                {
                    "employee":
                        "Employee and membership must belong "
                        "to the same user."
                }
            )

        if (
            self.primary_specialty_id
            and self.company_id
            and self.primary_specialty.company_id
            not in [
                None,
                self.company_id,
            ]
        ):
            raise ValidationError(
                {
                    "primary_specialty":
                        "Specialty is not available "
                        "to this company."
                }
            )

        if (
            self.default_branch_id
            and self.company_id
            and self.default_branch.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "default_branch":
                        "Branch must belong to the same company."
                }
            )

        if (
            self.default_department_id
            and self.company_id
            and self.default_department.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "default_department":
                        "Department must belong "
                        "to the same company."
                }
            )

        if (
            self.default_clinic_id
            and self.company_id
            and self.default_clinic.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "default_clinic":
                        "Clinic must belong to the same company."
                }
            )

        if (
            self.default_clinic_id
            and self.default_branch_id
            and self.default_clinic.branch_id
            != self.default_branch_id
        ):
            raise ValidationError(
                {
                    "default_clinic":
                        "Default clinic must belong "
                        "to the default branch."
                }
            )

        if (
            self.default_clinic_id
            and self.default_department_id
            and self.default_clinic.department_id
            != self.default_department_id
        ):
            raise ValidationError(
                {
                    "default_clinic":
                        "Default clinic must belong "
                        "to the default department."
                }
            )

        if self.status != MedicalPractitionerStatus.ACTIVE:
            self.is_accepting_appointments = False

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class MedicalPractitionerSpecialty(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_practitioner_specialties",
    )

    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.CASCADE,
        related_name="specialty_assignments",
    )

    specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        related_name="practitioner_assignments",
    )

    is_primary = models.BooleanField(
        default=False,
    )
    is_active = models.BooleanField(
        default=True,
    )

    years_experience = models.PositiveIntegerField(
        default=0,
    )

    valid_from = models.DateField(
        null=True,
        blank=True,
    )
    valid_until = models.DateField(
        null=True,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = [
            "company_id",
            "practitioner_id",
            "-is_primary",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "practitioner",
                    "specialty",
                ],
                name="medical_practitioner_specialty_uniq",
            ),
            models.UniqueConstraint(
                fields=[
                    "practitioner",
                ],
                condition=models.Q(
                    is_primary=True,
                    is_active=True,
                ),
                name="medical_practitioner_primary_specialty_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "specialty",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner",
                    "is_active",
                ],
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.practitioner} - "
            f"{self.specialty}"
        )

    def clean(self) -> None:
        super().clean()

        self.notes = (
            self.notes or ""
        ).strip()

        if (
            self.practitioner_id
            and self.company_id
            and self.practitioner.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "practitioner":
                        "Practitioner must belong "
                        "to the same company."
                }
            )

        if (
            self.specialty_id
            and self.company_id
            and self.specialty.company_id
            not in [
                None,
                self.company_id,
            ]
        ):
            raise ValidationError(
                {
                    "specialty":
                        "Specialty is not available "
                        "to this company."
                }
            )

        if (
            self.valid_from
            and self.valid_until
            and self.valid_until < self.valid_from
        ):
            raise ValidationError(
                {
                    "valid_until":
                        "Valid-until date cannot be "
                        "before valid-from date."
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class MedicalPractitionerAssignment(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_practitioner_assignments",
    )

    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.CASCADE,
        related_name="location_assignments",
    )

    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_practitioner_assignments",
    )

    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="practitioner_assignments",
    )

    clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="practitioner_assignments",
    )

    is_primary = models.BooleanField(
        default=False,
    )
    is_active = models.BooleanField(
        default=True,
    )

    start_date = models.DateField(
        null=True,
        blank=True,
    )
    end_date = models.DateField(
        null=True,
        blank=True,
    )

    working_hours = models.JSONField(
        default=dict,
        blank=True,
    )
    notes = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = [
            "company_id",
            "practitioner_id",
            "-is_primary",
            "branch_id",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "practitioner",
                ],
                condition=models.Q(
                    is_primary=True,
                    is_active=True,
                ),
                name="medical_practitioner_primary_assignment_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "branch",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "department",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "clinic",
                    "is_active",
                ],
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.practitioner} - "
            f"{self.branch}"
        )

    def clean(self) -> None:
        super().clean()

        self.notes = (
            self.notes or ""
        ).strip()

        if (
            self.practitioner_id
            and self.company_id
            and self.practitioner.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "practitioner":
                        "Practitioner must belong "
                        "to the same company."
                }
            )

        if (
            self.branch_id
            and self.company_id
            and self.branch.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "branch":
                        "Branch must belong to the same company."
                }
            )

        if (
            self.department_id
            and self.company_id
            and self.department.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "department":
                        "Department must belong "
                        "to the same company."
                }
            )

        if (
            self.department_id
            and self.branch_id
            and not MedicalDepartmentBranch.objects.filter(
                company_id=self.company_id,
                department_id=self.department_id,
                branch_id=self.branch_id,
                is_active=True,
            ).exists()
        ):
            raise ValidationError(
                {
                    "department":
                        "Department is not active "
                        "inside the selected branch."
                }
            )

        if (
            self.clinic_id
            and self.company_id
            and self.clinic.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "clinic":
                        "Clinic must belong to the same company."
                }
            )

        if (
            self.clinic_id
            and self.branch_id
            and self.clinic.branch_id
            != self.branch_id
        ):
            raise ValidationError(
                {
                    "clinic":
                        "Clinic must belong to "
                        "the selected branch."
                }
            )

        if (
            self.clinic_id
            and self.department_id
            and self.clinic.department_id
            != self.department_id
        ):
            raise ValidationError(
                {
                    "clinic":
                        "Clinic must belong to "
                        "the selected department."
                }
            )

        if (
            self.start_date
            and self.end_date
            and self.end_date < self.start_date
        ):
            raise ValidationError(
                {
                    "end_date":
                        "End date cannot be "
                        "before start date."
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class MedicalPractitionerLicense(MedicalAuditModel):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_practitioner_licenses",
    )

    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.CASCADE,
        related_name="licenses",
    )

    specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="practitioner_licenses",
    )

    license_number = models.CharField(
        max_length=100,
    )
    license_type = models.CharField(
        max_length=120,
        blank=True,
        default="",
    )
    issuing_authority = models.CharField(
        max_length=180,
    )

    status = models.CharField(
        max_length=20,
        choices=MedicalLicenseStatus.choices,
        default=MedicalLicenseStatus.PENDING,
    )

    issued_at = models.DateField(
        null=True,
        blank=True,
    )
    expires_at = models.DateField(
        null=True,
        blank=True,
    )
    verified_at = models.DateField(
        null=True,
        blank=True,
    )

    document_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    notes = models.TextField(
        blank=True,
        default="",
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
    )

    class Meta:
        ordering = [
            "company_id",
            "practitioner_id",
            "license_number",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "license_number",
                ],
                name="medical_license_number_company_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "expires_at",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner",
                ],
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.license_number} - "
            f"{self.practitioner}"
        )

    def clean(self) -> None:
        super().clean()

        self.license_number = (
            self.license_number or ""
        ).strip().upper()
        self.license_type = (
            self.license_type or ""
        ).strip()
        self.issuing_authority = (
            self.issuing_authority or ""
        ).strip()
        self.document_reference = (
            self.document_reference or ""
        ).strip()
        self.notes = (
            self.notes or ""
        ).strip()

        if not self.license_number:
            raise ValidationError(
                {
                    "license_number":
                        "License number is required."
                }
            )

        if not self.issuing_authority:
            raise ValidationError(
                {
                    "issuing_authority":
                        "Issuing authority is required."
                }
            )

        if (
            self.practitioner_id
            and self.company_id
            and self.practitioner.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "practitioner":
                        "Practitioner must belong "
                        "to the same company."
                }
            )

        if (
            self.specialty_id
            and self.company_id
            and self.specialty.company_id
            not in [
                None,
                self.company_id,
            ]
        ):
            raise ValidationError(
                {
                    "specialty":
                        "Specialty is not available "
                        "to this company."
                }
            )

        if (
            self.issued_at
            and self.expires_at
            and self.expires_at < self.issued_at
        ):
            raise ValidationError(
                {
                    "expires_at":
                        "Expiry date cannot be "
                        "before issue date."
                }
            )

        if (
            self.issued_at
            and self.verified_at
            and self.verified_at < self.issued_at
        ):
            raise ValidationError(
                {
                    "verified_at":
                        "Verification date cannot be "
                        "before issue date."
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
# End Phase 10.2-B - Healthcare Practitioners Models
# PHASE 10.4-A4 MEDICAL PATIENT FOUNDATION

from django.db.models import Q as _patient_Q
from django.utils import timezone as _patient_timezone


class MedicalPatientStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    DECEASED = "DECEASED", "Deceased"
    BLOCKED = "BLOCKED", "Blocked"


class MedicalPatientGender(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"
    OTHER = "OTHER", "Other"
    UNSPECIFIED = "UNSPECIFIED", "Unspecified"


class MedicalPatientIdentifierType(models.TextChoices):
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    IQAMA = "IQAMA", "Iqama"
    PASSPORT = "PASSPORT", "Passport"
    OTHER = "OTHER", "Other"
    UNSPECIFIED = "UNSPECIFIED", "Unspecified"


class MedicalPatient(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_patients",
        db_index=True,
    )

    legacy_patient = models.OneToOneField(
        "activity_backends.ClinicPatient",
        on_delete=models.SET_NULL,
        related_name="medical_patient",
        null=True,
        blank=True,
    )

    registration_branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="registered_medical_patients",
        null=True,
        blank=True,
    )

    patient_number = models.CharField(
        max_length=80,
        db_index=True,
    )

    identifier_type = models.CharField(
        max_length=20,
        choices=MedicalPatientIdentifierType.choices,
        default=MedicalPatientIdentifierType.UNSPECIFIED,
        db_index=True,
    )

    identifier_number = models.CharField(
        max_length=80,
        blank=True,
        default="",
        db_index=True,
    )

    full_name = models.CharField(
        max_length=220,
        db_index=True,
    )

    full_name_ar = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )

    full_name_en = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    gender = models.CharField(
        max_length=20,
        choices=MedicalPatientGender.choices,
        default=MedicalPatientGender.UNSPECIFIED,
        db_index=True,
    )

    nationality = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    mobile = models.CharField(
        max_length=50,
        blank=True,
        default="",
        db_index=True,
    )

    email = models.EmailField(
        blank=True,
        default="",
    )

    status = models.CharField(
        max_length=20,
        choices=MedicalPatientStatus.choices,
        default=MedicalPatientStatus.ACTIVE,
        db_index=True,
    )

    registered_at = models.DateTimeField(
        default=_patient_timezone.now,
        db_index=True,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    extra_data = models.JSONField(
        default=dict,
        blank=True,
    )

    created_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="created_medical_patient_records",
        null=True,
        blank=True,
    )

    updated_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="updated_medical_patient_records",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "company_id",
            "full_name",
            "id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "patient_number",
                ],
                name="medical_patient_number_company_uniq",
            ),
            models.UniqueConstraint(
                fields=[
                    "company",
                    "identifier_number",
                ],
                condition=~_patient_Q(
                    identifier_number=""
                ),
                name="medical_patient_identifier_company_uniq",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "mobile",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "full_name",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "registration_branch",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "registered_at",
                ],
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.patient_number} - "
            f"{self.full_name}"
        )

    @property
    def display_name(self) -> str:
        return (
            self.full_name_ar
            or self.full_name_en
            or self.full_name
        )

    def clean(self) -> None:
        super().clean()

        self.patient_number = (
            self.patient_number or ""
        ).strip().upper()

        self.identifier_number = (
            self.identifier_number or ""
        ).strip().upper()

        self.full_name = (
            self.full_name or ""
        ).strip()

        self.full_name_ar = (
            self.full_name_ar or ""
        ).strip()

        self.full_name_en = (
            self.full_name_en or ""
        ).strip()

        self.nationality = (
            self.nationality or ""
        ).strip()

        self.mobile = (
            self.mobile or ""
        ).strip()

        self.email = (
            self.email or ""
        ).strip().lower()

        if not self.patient_number:
            raise ValidationError(
                {
                    "patient_number": (
                        "Patient number is required."
                    )
                }
            )

        if not self.full_name:
            self.full_name = (
                self.full_name_ar
                or self.full_name_en
            )

        if not self.full_name:
            raise ValidationError(
                {
                    "full_name": (
                        "Patient full name is required."
                    )
                }
            )

        if (
            self.date_of_birth
            and self.date_of_birth
            > _patient_timezone.localdate()
        ):
            raise ValidationError(
                {
                    "date_of_birth": (
                        "Date of birth cannot "
                        "be in the future."
                    )
                }
            )

        if (
            self.registration_branch_id
            and self.company_id
            and self.registration_branch.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "registration_branch": (
                        "Registration branch must "
                        "belong to the same company."
                    )
                }
            )

        if (
            self.legacy_patient_id
            and self.company_id
            and self.legacy_patient.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "legacy_patient": (
                        "Legacy patient must belong "
                        "to the same company."
                    )
                }
            )

        if self.company_id:
            settings = MedicalSettings.objects.filter(
                company_id=self.company_id
            ).first()

            if (
                settings
                and settings.require_patient_identifier
                and not self.identifier_number
            ):
                raise ValidationError(
                    {
                        "identifier_number": (
                            "Patient identifier is "
                            "required by company settings."
                        )
                    }
                )

        if not self.identifier_number:
            self.identifier_type = (
                MedicalPatientIdentifierType.UNSPECIFIED
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# END PHASE 10.4-A4 MEDICAL PATIENT FOUNDATION
