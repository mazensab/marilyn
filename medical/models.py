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
from catalog.models import CatalogItem
from decimal import Decimal


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

# PHASE 10.6-A1A MEDICAL APPOINTMENT ENUMS


class MedicalAppointmentStatus(models.TextChoices):

    DRAFT = "DRAFT", "Draft"
    SCHEDULED = "SCHEDULED", "Scheduled"
    CONFIRMED = "CONFIRMED", "Confirmed"
    CHECKED_IN = "CHECKED_IN", "Checked in"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
    NO_SHOW = "NO_SHOW", "No show"


class MedicalAppointmentSource(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    PHONE = "PHONE", "Phone"
    ONLINE = "ONLINE", "Online"
    WHATSAPP = "WHATSAPP", "WhatsApp"
    WALK_IN = "WALK_IN", "Walk in"
    LEGACY = "LEGACY", "Legacy"


# PHASE 10.6-A1B MEDICAL APPOINTMENT CORE
class MedicalAppointment(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_appointments",
        db_index=True,
    )

    legacy_appointment = models.OneToOneField(
        "activity_backends.ClinicAppointment",
        on_delete=models.SET_NULL,
        related_name="medical_appointment",
        null=True,
        blank=True,
    )

    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="appointments",
    )

    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="appointments",
        null=True,
        blank=True,
    )

    # PHASE 10.4-A APPOINTMENT BOOKING RELATIONS
    practitioner_assignment = models.ForeignKey(
        "medical.MedicalPractitionerAssignment",
        on_delete=models.PROTECT,
        related_name="medical_appointments",
        null=True,
        blank=True,
        db_index=True,
    )
    practitioner_service_assignment = models.ForeignKey(
        "medical.MedicalPractitionerServiceAssignment",
        on_delete=models.PROTECT,
        related_name="medical_appointments",
        null=True,
        blank=True,
        db_index=True,
    )

    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_appointments",
        null=True,
        blank=True,
    )

    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        related_name="appointments",
        null=True,
        blank=True,
    )

    clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        related_name="appointments",
        null=True,
        blank=True,
    )

    appointment_number = models.CharField(
        max_length=80,
        db_index=True,
    )

    scheduled_start = models.DateTimeField(
        db_index=True,
    )

    scheduled_end = models.DateTimeField(
        db_index=True,
    )

    # PHASE 10.6-A1C MEDICAL APPOINTMENT OPERATIONS
    status = models.CharField(
        max_length=20,
        choices=MedicalAppointmentStatus.choices,
        default=MedicalAppointmentStatus.SCHEDULED,
        db_index=True,
    )

    source = models.CharField(
        max_length=20,
        choices=MedicalAppointmentSource.choices,
        default=MedicalAppointmentSource.MANUAL,
        db_index=True,
    )

    reason = models.CharField(
        max_length=300,
        blank=True,
        default="",
    )

    practitioner_name_snapshot = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )

    service_name_snapshot = models.CharField(
        max_length=220,
        blank=True,
        default="",
    )

    price_snapshot = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    cancellation_reason = models.TextField(
        blank=True,
        default="",
    )

    extra_data = models.JSONField(
        default=dict,
        blank=True,
    )

    # PHASE 10.6-A1D MEDICAL APPOINTMENT LIFECYCLE
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    checked_in_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    no_show_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # PHASE 10.6-A1E MEDICAL APPOINTMENT AUDIT
    created_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="created_medical_appointments",
        null=True,
        blank=True,
    )

    updated_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="updated_medical_appointments",
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

    # PHASE 10.6-A1F MEDICAL APPOINTMENT META
    class Meta:
        ordering = [
            "company_id",
            "-scheduled_start",
            "id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "appointment_number",
                ],
                name="medical_appointment_number_company_uniq",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    scheduled_end__gt=models.F(
                        "scheduled_start"
                    )
                ),
                name="medical_appointment_end_after_start",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                    "scheduled_start",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "branch",
                    "scheduled_start",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner",
                    "scheduled_start",
                ],
            ),
            models.Index(
                fields=[
                    "patient",
                    "scheduled_start",
                ],
            ),

            models.Index(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "scheduled_start",
                ],
                name="med_appt_assign_start",
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner_service_assignment",
                    "scheduled_start",
                ],
                name="med_appt_service_start",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.appointment_number} - "
            f"{self.patient}"
        )

    # PHASE 10.4-A APPOINTMENT BOOKING FOUNDATION
    @property
    def service_offering(self):
        if not self.practitioner_service_assignment_id:
            return None
        return (
            self.practitioner_service_assignment
            .service_offering
        )
    @property
    def total_slot_minutes(self):
        if not self.practitioner_service_assignment_id:
            return None
        return (
            self.practitioner_service_assignment
            .total_slot_minutes
        )
    def full_clean(self, *args, **kwargs):
        from .appointment_engine import (
            apply_appointment_derivations,
        )
        apply_appointment_derivations(self)
        return super().full_clean(
            *args,
            **kwargs,
        )

    # PHASE 10.6-A1G MEDICAL APPOINTMENT VALIDATION
    def clean(self):
        super().clean()
        errors = {}

        company_objects = [
            ("patient", self.patient if self.patient_id else None),
            ("practitioner", self.practitioner if self.practitioner_id else None),
            ("branch", self.branch if self.branch_id else None),
            ("department", self.department if self.department_id else None),
            ("clinic", self.clinic if self.clinic_id else None),
            ("legacy_appointment", self.legacy_appointment if self.legacy_appointment_id else None),
        ]

        for field_name, related_object in company_objects:
            if (
                related_object
                and self.company_id
                and related_object.company_id != self.company_id
            ):
                errors[field_name] = (
                    "Related record must belong to the same company."
                )

        if (
            self.clinic_id
            and self.branch_id
            and self.clinic.branch_id != self.branch_id
        ):
            errors["clinic"] = (
                "Clinic must belong to the selected branch."
            )

        if (
            self.clinic_id
            and self.department_id
            and self.clinic.department_id != self.department_id
        ):
            errors["clinic"] = (
                "Clinic must belong to the selected department."
            )

        if (
            self.scheduled_start
            and self.scheduled_end
            and self.scheduled_end <= self.scheduled_start
        ):
            errors["scheduled_end"] = (
                "Scheduled end must be after scheduled start."
            )

        if (
            self.price_snapshot is not None
            and self.price_snapshot < 0
        ):
            errors["price_snapshot"] = (
                "Price snapshot cannot be negative."
            )


        from .appointment_engine import (
            validate_appointment_booking,
        )
        validate_appointment_booking(
            self,
            errors,
        )
        if errors:
            raise ValidationError(errors)

    # PHASE 10.6-A1H MEDICAL APPOINTMENT SAVE
    def save(self, *args, **kwargs):
        self.appointment_number = (self.appointment_number or "").strip()
        self.reason = (self.reason or "").strip()
        self.practitioner_name_snapshot = (self.practitioner_name_snapshot or "").strip()
        self.service_name_snapshot = (self.service_name_snapshot or "").strip()
        self.notes = (self.notes or "").strip()
        self.cancellation_reason = (self.cancellation_reason or "").strip()
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)

# PHASE 10.7-A1 MEDICAL ENCOUNTER FOUNDATION


class MedicalEncounterStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class MedicalEncounterType(models.TextChoices):
    CONSULTATION = "CONSULTATION", "Consultation"
    FOLLOW_UP = "FOLLOW_UP", "Follow up"
    PROCEDURE = "PROCEDURE", "Procedure"
    EMERGENCY = "EMERGENCY", "Emergency"
    OTHER = "OTHER", "Other"


class MedicalEncounter(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_encounters",
        db_index=True,
    )
    appointment = models.OneToOneField(
        MedicalAppointment,
        on_delete=models.SET_NULL,
        related_name="encounter",
        null=True,
        blank=True,
    )
    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="encounters",
    )
    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="encounters",
        null=True,
        blank=True,
    )
    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_encounters",
        null=True,
        blank=True,
    )
    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        related_name="encounters",
        null=True,
        blank=True,
    )
    clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        related_name="encounters",
        null=True,
        blank=True,
    )
    encounter_number = models.CharField(max_length=80, db_index=True)
    encounter_type = models.CharField(
        max_length=20,
        choices=MedicalEncounterType.choices,
        default=MedicalEncounterType.CONSULTATION,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=MedicalEncounterStatus.choices,
        default=MedicalEncounterStatus.DRAFT,
        db_index=True,
    )
    chief_complaint = models.TextField(blank=True, default="")
    history_of_present_illness = models.TextField(blank=True, default="")
    clinical_notes = models.TextField(blank=True, default="")
    treatment_plan = models.TextField(blank=True, default="")
    follow_up_plan = models.TextField(blank=True, default="")
    opened_at = models.DateTimeField(
        default=_patient_timezone.now,
        db_index=True,
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="opened_medical_encounters",
        null=True,
        blank=True,
    )
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="closed_medical_encounters",
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True, default="")
    extra_data = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_medical_encounters",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_medical_encounters",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["company_id", "-opened_at", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "encounter_number"],
                name="medical_encounter_number_company_uniq",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(closed_at__isnull=True)
                    | models.Q(closed_at__gte=models.F("opened_at"))
                ),
                name="medical_encounter_closed_after_opened",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "status", "opened_at"]),
            models.Index(fields=["patient", "opened_at"]),
            models.Index(fields=["company", "practitioner", "opened_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.encounter_number} - {self.patient}"

    def clean(self):
        super().clean()
        errors = {}
        related = [
            ("patient", self.patient if self.patient_id else None),
            ("appointment", self.appointment if self.appointment_id else None),
            ("practitioner", self.practitioner if self.practitioner_id else None),
            ("branch", self.branch if self.branch_id else None),
            ("department", self.department if self.department_id else None),
            ("clinic", self.clinic if self.clinic_id else None),
        ]
        for field_name, obj in related:
            if obj and self.company_id and obj.company_id != self.company_id:
                errors[field_name] = (
                    "Related record must belong to the same company."
                )

        if (
            self.appointment_id
            and self.patient_id
            and self.appointment.patient_id != self.patient_id
        ):
            errors["appointment"] = (
                "Appointment must belong to the selected patient."
            )

        if (
            self.clinic_id
            and self.branch_id
            and self.clinic.branch_id != self.branch_id
        ):
            errors["clinic"] = "Clinic must belong to the selected branch."

        if (
            self.clinic_id
            and self.department_id
            and self.clinic.department_id != self.department_id
        ):
            errors["clinic"] = "Clinic must belong to the selected department."

        if self.closed_at and self.opened_at and self.closed_at < self.opened_at:
            errors["closed_at"] = "Closed time cannot be before opened time."

        if (
            self.status
            in {
                MedicalEncounterStatus.COMPLETED,
                MedicalEncounterStatus.CANCELLED,
            }
            and not self.closed_at
        ):
            errors["closed_at"] = (
                "Closed time is required for a completed or cancelled encounter."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.encounter_number = (self.encounter_number or "").strip().upper()
        self.chief_complaint = (self.chief_complaint or "").strip()
        self.history_of_present_illness = (
            self.history_of_present_illness or ""
        ).strip()
        self.clinical_notes = (self.clinical_notes or "").strip()
        self.treatment_plan = (self.treatment_plan or "").strip()
        self.follow_up_plan = (self.follow_up_plan or "").strip()
        self.notes = (self.notes or "").strip()
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)


# END PHASE 10.7-A1 MEDICAL ENCOUNTER FOUNDATION

# PHASE 10.8-A MEDICAL DIAGNOSIS AND PROCEDURE FOUNDATION
class MedicalDiagnosis(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_diagnoses",
        db_index=True,
    )
    encounter = models.ForeignKey(
        MedicalEncounter,
        on_delete=models.CASCADE,
        related_name="diagnoses",
    )
    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="diagnoses",
    )
    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="diagnoses",
        null=True,
        blank=True,
    )
    diagnosis_code = models.CharField(
        max_length=80,
        blank=True,
        default="",
        db_index=True,
    )
    diagnosis_name = models.CharField(
        max_length=255,
        db_index=True,
    )
    is_primary = models.BooleanField(
        default=False,
        db_index=True,
    )
    diagnosed_at = models.DateTimeField(
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
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_medical_diagnoses",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_medical_diagnoses",
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
            "encounter_id",
            "-is_primary",
            "diagnosed_at",
            "id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["encounter"],
                condition=models.Q(is_primary=True),
                name="medical_primary_diagnosis_encounter_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "diagnosed_at"],
            ),
            models.Index(
                fields=["patient", "diagnosed_at"],
            ),
            models.Index(
                fields=["encounter", "is_primary"],
            ),
            models.Index(
                fields=["company", "diagnosis_code"],
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.diagnosis_code or '-'} - "
            f"{self.diagnosis_name}"
        )
    def clean(self):
        super().clean()
        errors = {}
        related = [
            (
                "encounter",
                self.encounter if self.encounter_id else None,
            ),
            (
                "patient",
                self.patient if self.patient_id else None,
            ),
            (
                "practitioner",
                self.practitioner
                if self.practitioner_id
                else None,
            ),
        ]
        for field_name, obj in related:
            if (
                obj
                and self.company_id
                and obj.company_id != self.company_id
            ):
                errors[field_name] = (
                    "Related record must belong to the same company."
                )
        if (
            self.encounter_id
            and self.patient_id
            and self.encounter.patient_id != self.patient_id
        ):
            errors["patient"] = (
                "Patient must match the selected encounter."
            )
        if not (self.diagnosis_name or "").strip():
            errors["diagnosis_name"] = (
                "Diagnosis name is required."
            )
        if errors:
            raise ValidationError(errors)
    def save(self, *args, **kwargs):
        self.diagnosis_code = (
            self.diagnosis_code or ""
        ).strip().upper()
        self.diagnosis_name = (
            self.diagnosis_name or ""
        ).strip()
        self.notes = (self.notes or "").strip()
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)
class MedicalProcedureStatus(models.TextChoices):
    PLANNED = "PLANNED", "Planned"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
class MedicalProcedure(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_procedures",
        db_index=True,
    )
    encounter = models.ForeignKey(
        MedicalEncounter,
        on_delete=models.CASCADE,
        related_name="procedures",
    )
    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="procedures",
    )
    practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="performed_medical_procedures",
        null=True,
        blank=True,
    )
    catalog_item = models.ForeignKey(
        "catalog.CatalogItem",
        on_delete=models.SET_NULL,
        related_name="medical_procedures",
        null=True,
        blank=True,
    )
    procedure_code_snapshot = models.CharField(
        max_length=80,
        blank=True,
        default="",
        db_index=True,
    )
    procedure_name_snapshot = models.CharField(
        max_length=255,
        blank=True,
        default="",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=MedicalProcedureStatus.choices,
        default=MedicalProcedureStatus.PLANNED,
        db_index=True,
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=1,
    )
    unit_price_snapshot = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    performed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    cancellation_reason = models.TextField(
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
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_medical_procedures",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_medical_procedures",
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
            "encounter_id",
            "created_at",
            "id",
        ]
        indexes = [
            models.Index(
                fields=["company", "status", "created_at"],
            ),
            models.Index(
                fields=["patient", "performed_at"],
            ),
            models.Index(
                fields=["encounter", "status"],
            ),
            models.Index(
                fields=["company", "procedure_code_snapshot"],
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="medical_procedure_quantity_positive",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(unit_price_snapshot__isnull=True)
                    | models.Q(unit_price_snapshot__gte=0)
                ),
                name="medical_procedure_price_nonnegative",
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.procedure_code_snapshot or '-'} - "
            f"{self.procedure_name_snapshot}"
        )
    def clean(self):
        super().clean()
        errors = {}
        related = [
            (
                "encounter",
                self.encounter if self.encounter_id else None,
            ),
            (
                "patient",
                self.patient if self.patient_id else None,
            ),
            (
                "practitioner",
                self.practitioner
                if self.practitioner_id
                else None,
            ),
            (
                "catalog_item",
                self.catalog_item
                if self.catalog_item_id
                else None,
            ),
        ]
        for field_name, obj in related:
            if (
                obj
                and self.company_id
                and obj.company_id != self.company_id
            ):
                errors[field_name] = (
                    "Related record must belong to the same company."
                )
        if (
            self.encounter_id
            and self.patient_id
            and self.encounter.patient_id != self.patient_id
        ):
            errors["patient"] = (
                "Patient must match the selected encounter."
            )
        if (
            self.catalog_item_id
            and self.catalog_item.item_type != "SERVICE"
        ):
            errors["catalog_item"] = (
                "Catalog item must be a service."
            )
        if self.quantity is not None and self.quantity <= 0:
            errors["quantity"] = (
                "Procedure quantity must be greater than zero."
            )
        if (
            self.unit_price_snapshot is not None
            and self.unit_price_snapshot < 0
        ):
            errors["unit_price_snapshot"] = (
                "Procedure price cannot be negative."
            )
        if not (self.procedure_name_snapshot or "").strip():
            errors["procedure_name_snapshot"] = (
                "Procedure name is required."
            )
        if (
            self.status == MedicalProcedureStatus.COMPLETED
            and not self.performed_at
        ):
            errors["performed_at"] = (
                "Performed time is required for a completed procedure."
            )
        if (
            self.status == MedicalProcedureStatus.CANCELLED
            and not (self.cancellation_reason or "").strip()
        ):
            errors["cancellation_reason"] = (
                "Cancellation reason is required for a cancelled procedure."
            )
        if errors:
            raise ValidationError(errors)
    def save(self, *args, **kwargs):
        self.procedure_code_snapshot = (
            self.procedure_code_snapshot or ""
        ).strip().upper()
        self.procedure_name_snapshot = (
            self.procedure_name_snapshot or ""
        ).strip()
        self.cancellation_reason = (
            self.cancellation_reason or ""
        ).strip()
        self.notes = (self.notes or "").strip()
        if self.catalog_item_id:
            if not self.procedure_code_snapshot:
                self.procedure_code_snapshot = (
                    self.catalog_item.code or ""
                ).strip().upper()
            if not self.procedure_name_snapshot:
                self.procedure_name_snapshot = (
                    self.catalog_item.name or ""
                ).strip()
            if self.unit_price_snapshot is None:
                self.unit_price_snapshot = (
                    self.catalog_item.sale_price
                )
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)
# END PHASE 10.8-A MEDICAL DIAGNOSIS AND PROCEDURE FOUNDATION

# PHASE 10.9-A MEDICAL REFERRAL AND RECORD ACCESS FOUNDATION
class MedicalReferralPriority(models.TextChoices):
    ROUTINE = "ROUTINE", "Routine"
    URGENT = "URGENT", "Urgent"
    EMERGENCY = "EMERGENCY", "Emergency"
class MedicalReferralStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SENT = "SENT", "Sent"
    ACCEPTED = "ACCEPTED", "Accepted"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"
class MedicalRecordShareScope(models.TextChoices):
    SUMMARY = "SUMMARY", "Patient summary"
    SOURCE_ENCOUNTER = (
        "SOURCE_ENCOUNTER",
        "Source encounter",
    )
    FULL_RECORD = "FULL_RECORD", "Full medical record"
    CUSTOM = "CUSTOM", "Custom sections"
class MedicalRecordShareSection(models.TextChoices):
    PATIENT_SUMMARY = (
        "PATIENT_SUMMARY",
        "Patient summary",
    )
    SOURCE_ENCOUNTER = (
        "SOURCE_ENCOUNTER",
        "Source encounter",
    )
    DIAGNOSES = "DIAGNOSES", "Diagnoses"
    PROCEDURES = "PROCEDURES", "Procedures"
    CLINICAL_NOTES = (
        "CLINICAL_NOTES",
        "Clinical notes",
    )
    TREATMENT_PLAN = (
        "TREATMENT_PLAN",
        "Treatment plan",
    )
    FOLLOW_UP_PLAN = (
        "FOLLOW_UP_PLAN",
        "Follow-up plan",
    )
class MedicalReferralAccessStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    REJECTED = "REJECTED", "Rejected"
    REVOKED = "REVOKED", "Revoked"
    EXPIRED = "EXPIRED", "Expired"
class MedicalReferral(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_referrals",
        db_index=True,
    )
    source_encounter = models.ForeignKey(
        MedicalEncounter,
        on_delete=models.PROTECT,
        related_name="outgoing_referrals",
    )
    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="medical_referrals",
    )
    referring_practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="medical_referrals_sent",
    )
    receiving_practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="medical_referrals_received",
        null=True,
        blank=True,
    )
    target_branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_referrals_received",
        null=True,
        blank=True,
    )
    target_department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        related_name="medical_referrals_received",
        null=True,
        blank=True,
    )
    target_clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        related_name="medical_referrals_received",
        null=True,
        blank=True,
    )
    referral_number = models.CharField(
        max_length=80,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=MedicalReferralPriority.choices,
        default=MedicalReferralPriority.ROUTINE,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=MedicalReferralStatus.choices,
        default=MedicalReferralStatus.DRAFT,
        db_index=True,
    )
    referral_reason = models.TextField()
    clinical_summary = models.TextField(
        blank=True,
        default="",
    )
    requested_service = models.TextField(
        blank=True,
        default="",
    )
    referred_at = models.DateTimeField(
        default=_patient_timezone.now,
        db_index=True,
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    rejected_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="accepted_medical_referrals",
        null=True,
        blank=True,
    )
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="rejected_medical_referrals",
        null=True,
        blank=True,
    )
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="completed_medical_referrals",
        null=True,
        blank=True,
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="cancelled_medical_referrals",
        null=True,
        blank=True,
    )
    rejection_reason = models.TextField(
        blank=True,
        default="",
    )
    cancellation_reason = models.TextField(
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
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_medical_referrals",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_medical_referrals",
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
            "-referred_at",
            "-id",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "referral_number",
                ],
                name=(
                    "medical_referral_number_company_uniq"
                ),
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                    "referred_at",
                ],
            ),
            models.Index(
                fields=[
                    "patient",
                    "referred_at",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "referring_practitioner",
                    "referred_at",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "receiving_practitioner",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "target_branch",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "target_department",
                    "status",
                ],
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.referral_number} - "
            f"{self.patient}"
        )
    @property
    def is_terminal(self) -> bool:
        return self.status in {
            MedicalReferralStatus.COMPLETED,
            MedicalReferralStatus.REJECTED,
            MedicalReferralStatus.CANCELLED,
            MedicalReferralStatus.EXPIRED,
        }
    @property
    def allows_record_access(self) -> bool:
        return self.status in {
            MedicalReferralStatus.ACCEPTED,
            MedicalReferralStatus.IN_PROGRESS,
            MedicalReferralStatus.COMPLETED,
        }
    def clean(self):
        super().clean()
        errors = {}
        related = [
            (
                "source_encounter",
                self.source_encounter
                if self.source_encounter_id
                else None,
            ),
            (
                "patient",
                self.patient
                if self.patient_id
                else None,
            ),
            (
                "referring_practitioner",
                self.referring_practitioner
                if self.referring_practitioner_id
                else None,
            ),
            (
                "receiving_practitioner",
                self.receiving_practitioner
                if self.receiving_practitioner_id
                else None,
            ),
            (
                "target_branch",
                self.target_branch
                if self.target_branch_id
                else None,
            ),
            (
                "target_department",
                self.target_department
                if self.target_department_id
                else None,
            ),
            (
                "target_clinic",
                self.target_clinic
                if self.target_clinic_id
                else None,
            ),
        ]
        for field_name, obj in related:
            if (
                obj
                and self.company_id
                and obj.company_id != self.company_id
            ):
                errors[field_name] = (
                    "Related record must belong "
                    "to the same company."
                )
        if (
            self.source_encounter_id
            and self.patient_id
            and self.source_encounter.patient_id
            != self.patient_id
        ):
            errors["patient"] = (
                "Patient must match the source encounter."
            )
        if (
            self.source_encounter_id
            and self.source_encounter.practitioner_id
            and self.referring_practitioner_id
            and self.source_encounter.practitioner_id
            != self.referring_practitioner_id
        ):
            errors["referring_practitioner"] = (
                "Referring practitioner must match "
                "the source encounter practitioner."
            )
        if not any(
            [
                self.receiving_practitioner_id,
                self.target_branch_id,
                self.target_department_id,
                self.target_clinic_id,
            ]
        ):
            errors["receiving_practitioner"] = (
                "A receiving practitioner or target "
                "medical location is required."
            )
        if (
            self.target_clinic_id
            and self.target_branch_id
            and self.target_clinic.branch_id
            != self.target_branch_id
        ):
            errors["target_clinic"] = (
                "Target clinic must belong "
                "to the selected branch."
            )
        if (
            self.target_clinic_id
            and self.target_department_id
            and self.target_clinic.department_id
            != self.target_department_id
        ):
            errors["target_clinic"] = (
                "Target clinic must belong "
                "to the selected department."
            )
        if not (self.referral_reason or "").strip():
            errors["referral_reason"] = (
                "Referral reason is required."
            )
        status_requires_sent = {
            MedicalReferralStatus.SENT,
            MedicalReferralStatus.ACCEPTED,
            MedicalReferralStatus.IN_PROGRESS,
            MedicalReferralStatus.COMPLETED,
            MedicalReferralStatus.REJECTED,
        }
        if (
            self.status in status_requires_sent
            and not self.sent_at
        ):
            errors["sent_at"] = (
                "Sent time is required "
                "for the selected status."
            )
        if self.status in {
            MedicalReferralStatus.ACCEPTED,
            MedicalReferralStatus.IN_PROGRESS,
            MedicalReferralStatus.COMPLETED,
        }:
            if not self.accepted_at:
                errors["accepted_at"] = (
                    "Accepted time is required "
                    "for the selected status."
                )
            if not self.accepted_by_id:
                errors["accepted_by"] = (
                    "Accepted by is required "
                    "for the selected status."
                )
        if (
            self.status
            == MedicalReferralStatus.IN_PROGRESS
            and not self.started_at
        ):
            errors["started_at"] = (
                "Started time is required "
                "for an in-progress referral."
            )
        if self.status == MedicalReferralStatus.COMPLETED:
            if not self.completed_at:
                errors["completed_at"] = (
                    "Completed time is required "
                    "for a completed referral."
                )
            if not self.completed_by_id:
                errors["completed_by"] = (
                    "Completed by is required "
                    "for a completed referral."
                )
        if self.status == MedicalReferralStatus.REJECTED:
            if not self.rejected_at:
                errors["rejected_at"] = (
                    "Rejected time is required "
                    "for a rejected referral."
                )
            if not self.rejected_by_id:
                errors["rejected_by"] = (
                    "Rejected by is required "
                    "for a rejected referral."
                )
            if not (self.rejection_reason or "").strip():
                errors["rejection_reason"] = (
                    "Rejection reason is required "
                    "for a rejected referral."
                )
        if self.status == MedicalReferralStatus.CANCELLED:
            if not self.cancelled_at:
                errors["cancelled_at"] = (
                    "Cancelled time is required "
                    "for a cancelled referral."
                )
            if not self.cancelled_by_id:
                errors["cancelled_by"] = (
                    "Cancelled by is required "
                    "for a cancelled referral."
                )
            if not (
                self.cancellation_reason or ""
            ).strip():
                errors["cancellation_reason"] = (
                    "Cancellation reason is required "
                    "for a cancelled referral."
                )
        if (
            self.status == MedicalReferralStatus.EXPIRED
            and not self.expires_at
        ):
            errors["expires_at"] = (
                "Expiry time is required "
                "for an expired referral."
            )
        if (
            self.expires_at
            and self.referred_at
            and self.expires_at < self.referred_at
        ):
            errors["expires_at"] = (
                "Expiry time cannot be before "
                "the referral time."
            )
        event_fields = [
            "sent_at",
            "accepted_at",
            "rejected_at",
            "started_at",
            "completed_at",
            "cancelled_at",
        ]
        for field_name in event_fields:
            value = getattr(self, field_name)
            if (
                value
                and self.referred_at
                and value < self.referred_at
            ):
                errors[field_name] = (
                    "Referral event time cannot be "
                    "before the referral time."
                )
        if errors:
            raise ValidationError(errors)
    def save(self, *args, **kwargs):
        self.referral_number = (
            self.referral_number or ""
        ).strip().upper()
        self.referral_reason = (
            self.referral_reason or ""
        ).strip()
        self.clinical_summary = (
            self.clinical_summary or ""
        ).strip()
        self.requested_service = (
            self.requested_service or ""
        ).strip()
        self.rejection_reason = (
            self.rejection_reason or ""
        ).strip()
        self.cancellation_reason = (
            self.cancellation_reason or ""
        ).strip()
        self.notes = (self.notes or "").strip()
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)
class MedicalReferralRecordAccess(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_referral_record_accesses",
        db_index=True,
    )
    referral = models.OneToOneField(
        MedicalReferral,
        on_delete=models.CASCADE,
        related_name="record_access",
    )
    patient = models.ForeignKey(
        MedicalPatient,
        on_delete=models.PROTECT,
        related_name="medical_referral_record_accesses",
    )
    receiving_practitioner = models.ForeignKey(
        MedicalPractitioner,
        on_delete=models.PROTECT,
        related_name="medical_record_accesses",
        null=True,
        blank=True,
    )
    scope = models.CharField(
        max_length=30,
        choices=MedicalRecordShareScope.choices,
        default=MedicalRecordShareScope.SUMMARY,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=MedicalReferralAccessStatus.choices,
        default=MedicalReferralAccessStatus.PENDING,
        db_index=True,
    )
    shared_sections = models.JSONField(
        default=list,
        blank=True,
    )
    access_starts_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    access_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="granted_medical_record_accesses",
        null=True,
        blank=True,
    )
    granted_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="accepted_medical_record_accesses",
        null=True,
        blank=True,
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="rejected_medical_record_accesses",
        null=True,
        blank=True,
    )
    rejected_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    rejection_reason = models.TextField(
        blank=True,
        default="",
    )
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="revoked_medical_record_accesses",
        null=True,
        blank=True,
    )
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    revocation_reason = models.TextField(
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
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_medical_record_accesses",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_medical_record_accesses",
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
            "-created_at",
            "-id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                    "access_starts_at",
                ],
            ),
            models.Index(
                fields=[
                    "patient",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "receiving_practitioner",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "company",
                    "access_ends_at",
                ],
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.referral.referral_number} - "
            f"{self.status}"
        )
    def is_effective_at(self, moment=None) -> bool:
        moment = moment or _patient_timezone.now()
        if self.status != MedicalReferralAccessStatus.ACTIVE:
            return False
        if not self.referral.allows_record_access:
            return False
        if (
            not self.access_starts_at
            or self.access_starts_at > moment
        ):
            return False
        if (
            self.access_ends_at
            and self.access_ends_at < moment
        ):
            return False
        return True
    @property
    def is_effective(self) -> bool:
        return self.is_effective_at()
    def clean(self):
        super().clean()
        errors = {}
        related = [
            (
                "referral",
                self.referral
                if self.referral_id
                else None,
            ),
            (
                "patient",
                self.patient
                if self.patient_id
                else None,
            ),
            (
                "receiving_practitioner",
                self.receiving_practitioner
                if self.receiving_practitioner_id
                else None,
            ),
        ]
        for field_name, obj in related:
            if (
                obj
                and self.company_id
                and obj.company_id != self.company_id
            ):
                errors[field_name] = (
                    "Related record must belong "
                    "to the same company."
                )
        if (
            self.referral_id
            and self.patient_id
            and self.referral.patient_id
            != self.patient_id
        ):
            errors["patient"] = (
                "Patient must match the referral patient."
            )
        if (
            self.referral_id
            and self.referral.receiving_practitioner_id
            and self.receiving_practitioner_id
            and self.referral.receiving_practitioner_id
            != self.receiving_practitioner_id
        ):
            errors["receiving_practitioner"] = (
                "Receiving practitioner must match "
                "the referral recipient."
            )
        if not isinstance(self.shared_sections, list):
            errors["shared_sections"] = (
                "Shared sections must be a list."
            )
        valid_sections = set(
            MedicalRecordShareSection.values
        )
        if isinstance(self.shared_sections, list):
            invalid_sections = [
                section
                for section in self.shared_sections
                if section not in valid_sections
            ]
            if invalid_sections:
                errors["shared_sections"] = (
                    "One or more shared sections "
                    "are invalid."
                )
        if (
            self.scope == MedicalRecordShareScope.CUSTOM
            and not self.shared_sections
        ):
            errors["shared_sections"] = (
                "Custom record access requires "
                "at least one shared section."
            )
        if (
            self.access_starts_at
            and self.access_ends_at
            and self.access_ends_at
            < self.access_starts_at
        ):
            errors["access_ends_at"] = (
                "Access end time cannot be before "
                "the access start time."
            )
        if self.status == MedicalReferralAccessStatus.ACTIVE:
            if not self.receiving_practitioner_id:
                errors["receiving_practitioner"] = (
                    "Receiving practitioner is required "
                    "for active access."
                )
            if not self.granted_by_id:
                errors["granted_by"] = (
                    "Granted by is required "
                    "for active access."
                )
            if not self.granted_at:
                errors["granted_at"] = (
                    "Granted time is required "
                    "for active access."
                )
            if not self.accepted_by_id:
                errors["accepted_by"] = (
                    "Accepted by is required "
                    "for active access."
                )
            if not self.accepted_at:
                errors["accepted_at"] = (
                    "Accepted time is required "
                    "for active access."
                )
            if not self.access_starts_at:
                errors["access_starts_at"] = (
                    "Access start time is required "
                    "for active access."
                )
            if (
                self.referral_id
                and not self.referral.allows_record_access
            ):
                errors["referral"] = (
                    "The referral status does not "
                    "allow medical record access."
                )
        if (
            self.status
            == MedicalReferralAccessStatus.REJECTED
        ):
            if not self.rejected_by_id:
                errors["rejected_by"] = (
                    "Rejected by is required "
                    "for rejected access."
                )
            if not self.rejected_at:
                errors["rejected_at"] = (
                    "Rejected time is required "
                    "for rejected access."
                )
            if not (
                self.rejection_reason or ""
            ).strip():
                errors["rejection_reason"] = (
                    "Rejection reason is required "
                    "for rejected access."
                )
        if (
            self.status
            == MedicalReferralAccessStatus.REVOKED
        ):
            if not self.revoked_by_id:
                errors["revoked_by"] = (
                    "Revoked by is required "
                    "for revoked access."
                )
            if not self.revoked_at:
                errors["revoked_at"] = (
                    "Revoked time is required "
                    "for revoked access."
                )
            if not (
                self.revocation_reason or ""
            ).strip():
                errors["revocation_reason"] = (
                    "Revocation reason is required "
                    "for revoked access."
                )
        if (
            self.status
            == MedicalReferralAccessStatus.EXPIRED
            and not self.access_ends_at
        ):
            errors["access_ends_at"] = (
                "Access end time is required "
                "for expired access."
            )
        if errors:
            raise ValidationError(errors)
    def save(self, *args, **kwargs):
        if self.referral_id:
            self.company = self.referral.company
            self.patient = self.referral.patient
            if (
                not self.receiving_practitioner_id
                and self.referral.receiving_practitioner_id
            ):
                self.receiving_practitioner = (
                    self.referral.receiving_practitioner
                )
        normalized_sections = []
        if isinstance(self.shared_sections, list):
            for raw_section in self.shared_sections:
                section = str(raw_section or "").strip().upper()
                if (
                    section
                    and section not in normalized_sections
                ):
                    normalized_sections.append(section)
        self.shared_sections = normalized_sections
        self.rejection_reason = (
            self.rejection_reason or ""
        ).strip()
        self.revocation_reason = (
            self.revocation_reason or ""
        ).strip()
        self.notes = (self.notes or "").strip()
        if self.extra_data is None:
            self.extra_data = {}
        self.full_clean()
        return super().save(*args, **kwargs)
# END PHASE 10.9-A MEDICAL REFERRAL AND RECORD ACCESS FOUNDATION
# ============================================================
# PHASE 10.3-A2 — MEDICAL SERVICE OFFERING FOUNDATION
# ============================================================
class MedicalServiceOfferingStatus(
    models.TextChoices
):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    ARCHIVED = "ARCHIVED", "Archived"
class MedicalServiceOffering(
    MedicalAuditModel
):
    """
    Defines where and how a reusable CatalogItem
    service is offered medically.
    CatalogItem remains the source of truth for
    service identity, default pricing, taxation,
    billing, and accounting references.
    """
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="medical_service_offerings",
        db_index=True,
    )
    catalog_item = models.ForeignKey(
        CatalogItem,
        on_delete=models.PROTECT,
        related_name="medical_service_offerings",
        db_index=True,
    )
    branch = models.ForeignKey(
        "companies.Branch",
        on_delete=models.PROTECT,
        related_name="medical_service_offerings",
        db_index=True,
    )
    department = models.ForeignKey(
        MedicalDepartment,
        on_delete=models.PROTECT,
        related_name="service_offerings",
        db_index=True,
    )
    specialty = models.ForeignKey(
        MedicalSpecialty,
        on_delete=models.PROTECT,
        related_name="service_offerings",
        db_index=True,
    )
    clinic = models.ForeignKey(
        MedicalClinic,
        on_delete=models.PROTECT,
        related_name="service_offerings",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=(
            MedicalServiceOfferingStatus.choices
        ),
        default=(
            MedicalServiceOfferingStatus.ACTIVE
        ),
        db_index=True,
    )
    duration_minutes = (
        models.PositiveSmallIntegerField(
            default=30,
            help_text=(
                "Clinical service duration in minutes."
            ),
        )
    )
    buffer_before_minutes = (
        models.PositiveSmallIntegerField(
            default=0,
            help_text=(
                "Preparation time reserved before "
                "the appointment."
            ),
        )
    )
    buffer_after_minutes = (
        models.PositiveSmallIntegerField(
            default=0,
            help_text=(
                "Cleanup or recovery time reserved "
                "after the appointment."
            ),
        )
    )
    sale_price_override = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        blank=True,
        null=True,
        help_text=(
            "Optional location-specific price. "
            "CatalogItem.sale_price is used when empty."
        ),
    )
    default_session_count = (
        models.PositiveSmallIntegerField(
            default=1,
        )
    )
    online_booking_enabled = models.BooleanField(
        default=False,
        db_index=True,
    )
    requires_approval = models.BooleanField(
        default=False,
        db_index=True,
    )
    requires_preparation = models.BooleanField(
        default=False,
        db_index=True,
    )
    preparation_instructions = models.TextField(
        blank=True,
        default="",
    )
    class Meta:
        verbose_name = "Medical Service Offering"
        verbose_name_plural = (
            "Medical Service Offerings"
        )
        ordering = [
            "branch_id",
            "department_id",
            "clinic_id",
            "catalog_item_id",
            "id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                ],
                name="medical_off_company_status_idx",
            ),
            models.Index(
                fields=[
                    "company",
                    "catalog_item",
                ],
                name="medical_off_company_item_idx",
            ),
            models.Index(
                fields=[
                    "company",
                    "branch",
                    "clinic",
                    "status",
                ],
                name="medical_off_location_idx",
            ),
            models.Index(
                fields=[
                    "company",
                    "specialty",
                    "status",
                ],
                name="medical_off_specialty_idx",
            ),
            models.Index(
                fields=[
                    "company",
                    "online_booking_enabled",
                    "status",
                ],
                name="medical_off_online_idx",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "catalog_item",
                    "branch",
                    "department",
                    "specialty",
                    "clinic",
                ],
                name=(
                    "unique_medical_service_"
                    "offering_scope"
                ),
            ),
            models.CheckConstraint(
                condition=Q(
                    duration_minutes__gt=0
                ),
                name=(
                    "medical_service_offering_"
                    "duration_positive"
                ),
            ),
            models.CheckConstraint(
                condition=Q(
                    default_session_count__gt=0
                ),
                name=(
                    "medical_service_offering_"
                    "sessions_positive"
                ),
            ),
            models.CheckConstraint(
                condition=(
                    Q(sale_price_override__isnull=True)
                    | Q(
                        sale_price_override__gte=(
                            Decimal("0.00")
                        )
                    )
                ),
                name=(
                    "medical_service_offering_"
                    "price_nonnegative"
                ),
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.catalog_item} — "
            f"{self.branch} — "
            f"{self.clinic}"
        )
    @property
    def effective_sale_price(self):
        if self.sale_price_override is not None:
            return self.sale_price_override
        return self.catalog_item.sale_price
    @property
    def total_slot_minutes(self) -> int:
        return (
            self.buffer_before_minutes
            + self.duration_minutes
            + self.buffer_after_minutes
        )
    @property
    def is_active_offering(self) -> bool:
        return (
            self.status
            == MedicalServiceOfferingStatus.ACTIVE
            and self.catalog_item.status == "ACTIVE"
            and self.catalog_item.is_sellable
            and self.department.is_active
            and self.clinic.is_active
        )
    def clean(self) -> None:
        super().clean()
        self.preparation_instructions = clean_text(
            self.preparation_instructions
        )
        if self.duration_minutes < 1:
            raise ValidationError(
                {
                    "duration_minutes": (
                        "Service duration must be "
                        "greater than zero."
                    )
                }
            )
        if self.default_session_count < 1:
            raise ValidationError(
                {
                    "default_session_count": (
                        "Default session count must be "
                        "greater than zero."
                    )
                }
            )
        if (
            self.sale_price_override is not None
            and self.sale_price_override
            < Decimal("0.00")
        ):
            raise ValidationError(
                {
                    "sale_price_override": (
                        "Sale price override cannot "
                        "be negative."
                    )
                }
            )
        if self.catalog_item_id:
            if (
                self.catalog_item.company_id
                != self.company_id
            ):
                raise ValidationError(
                    {
                        "catalog_item": (
                            "Catalog item must belong "
                            "to the same company."
                        )
                    }
                )
            if not self.catalog_item.is_service:
                raise ValidationError(
                    {
                        "catalog_item": (
                            "Only CatalogItem services "
                            "can be medically offered."
                        )
                    }
                )
            if (
                self.status
                == MedicalServiceOfferingStatus.ACTIVE
                and (
                    self.catalog_item.status
                    != "ACTIVE"
                    or not self.catalog_item.is_sellable
                )
            ):
                raise ValidationError(
                    {
                        "catalog_item": (
                            "An active medical offering "
                            "requires an active, sellable "
                            "catalog service."
                        )
                    }
                )
        if (
            self.branch_id
            and self.branch.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "branch": (
                        "Branch must belong to the "
                        "same company."
                    )
                }
            )
        if (
            self.department_id
            and self.department.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "department": (
                        "Department must belong to the "
                        "same company."
                    )
                }
            )
        if (
            self.specialty_id
            and self.specialty.company_id
            not in {
                None,
                self.company_id,
            }
        ):
            raise ValidationError(
                {
                    "specialty": (
                        "Specialty must be system-wide "
                        "or belong to the same company."
                    )
                }
            )
        if (
            self.clinic_id
            and self.clinic.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "clinic": (
                        "Clinic must belong to the "
                        "same company."
                    )
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
                    "clinic": (
                        "Clinic must belong to the "
                        "selected branch."
                    )
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
                    "clinic": (
                        "Clinic must belong to the "
                        "selected department."
                    )
                }
            )
        relation_ids_ready = all(
            [
                self.company_id,
                self.branch_id,
                self.department_id,
                self.specialty_id,
                self.clinic_id,
            ]
        )
        if not relation_ids_ready:
            return
        if not MedicalDepartmentBranch.objects.filter(
            company_id=self.company_id,
            department_id=self.department_id,
            branch_id=self.branch_id,
            is_active=True,
        ).exists():
            raise ValidationError(
                {
                    "department": (
                        "Department is not active in "
                        "the selected branch."
                    )
                }
            )
        if not (
            MedicalDepartmentSpecialty.objects
            .filter(
                company_id=self.company_id,
                department_id=self.department_id,
                specialty_id=self.specialty_id,
                is_active=True,
            )
            .exists()
        ):
            raise ValidationError(
                {
                    "specialty": (
                        "Specialty is not active in "
                        "the selected department."
                    )
                }
            )
        if not (
            MedicalClinicSpecialty.objects
            .filter(
                company_id=self.company_id,
                clinic_id=self.clinic_id,
                specialty_id=self.specialty_id,
                is_active=True,
            )
            .exists()
        ):
            raise ValidationError(
                {
                    "specialty": (
                        "Specialty is not active in "
                        "the selected clinic."
                    )
                }
            )
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
# PHASE 10.3-B2 PRACTITIONER SERVICE ASSIGNMENT FOUNDATION
from django.utils import timezone as medical_timezone
class MedicalPractitionerServiceAssignmentStatus(
    models.TextChoices
):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    ARCHIVED = "ARCHIVED", "Archived"
class MedicalPractitionerServiceAssignment(
    MedicalAuditModel
):
    """
    Declares that a practitioner assignment is
    qualified and enabled to deliver a specific
    MedicalServiceOffering.
    MedicalPractitionerAssignment remains the
    source of truth for practitioner location.
    MedicalServiceOffering remains the source of
    truth for service, specialty, duration, price,
    booking rules, and clinic scope.
    """
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name=(
            "medical_practitioner_service_assignments"
        ),
        db_index=True,
    )
    practitioner_assignment = models.ForeignKey(
        MedicalPractitionerAssignment,
        on_delete=models.CASCADE,
        related_name="service_assignments",
        db_index=True,
    )
    service_offering = models.ForeignKey(
        MedicalServiceOffering,
        on_delete=models.CASCADE,
        related_name="practitioner_assignments",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=(
            MedicalPractitionerServiceAssignmentStatus
            .choices
        ),
        default=(
            MedicalPractitionerServiceAssignmentStatus
            .ACTIVE
        ),
        db_index=True,
    )
    duration_override_minutes = (
        models.PositiveSmallIntegerField(
            blank=True,
            null=True,
            help_text=(
                "Optional practitioner-specific "
                "clinical duration. Offering duration "
                "is inherited when empty."
            ),
        )
    )
    online_booking_enabled = models.BooleanField(
        blank=True,
        null=True,
        default=None,
        help_text=(
            "Optional practitioner-specific booking "
            "override. Offering setting is inherited "
            "when empty."
        ),
    )
    effective_from = models.DateField(
        blank=True,
        null=True,
        db_index=True,
    )
    effective_until = models.DateField(
        blank=True,
        null=True,
        db_index=True,
    )
    class Meta:
        verbose_name = (
            "Medical Practitioner Service Assignment"
        )
        verbose_name_plural = (
            "Medical Practitioner Service Assignments"
        )
        ordering = [
            "company_id",
            "practitioner_assignment_id",
            "service_offering_id",
            "id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "status",
                ],
                name="med_psa_company_status",
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "status",
                ],
                name="med_psa_practitioner",
            ),
            models.Index(
                fields=[
                    "company",
                    "service_offering",
                    "status",
                ],
                name="med_psa_offering_status",
            ),
            models.Index(
                fields=[
                    "company",
                    "effective_from",
                    "effective_until",
                ],
                name="med_psa_effective_dates",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "service_offering",
                ],
                name="med_psa_scope_uniq",
            ),
            models.CheckConstraint(
                condition=(
                    Q(
                        duration_override_minutes__isnull=True
                    )
                    | Q(
                        duration_override_minutes__gt=0
                    )
                ),
                name="med_psa_duration_pos",
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.practitioner_assignment.practitioner}"
            f" — {self.service_offering}"
        )
    @property
    def practitioner(self):
        return (
            self.practitioner_assignment.practitioner
        )
    @property
    def practitioner_id(self):
        return (
            self.practitioner_assignment
            .practitioner_id
        )
    @property
    def effective_duration_minutes(self) -> int:
        if self.duration_override_minutes is not None:
            return self.duration_override_minutes
        return self.service_offering.duration_minutes
    @property
    def effective_online_booking_enabled(
        self,
    ) -> bool:
        if self.online_booking_enabled is not None:
            return self.online_booking_enabled
        return (
            self.service_offering
            .online_booking_enabled
        )
    @property
    def total_slot_minutes(self) -> int:
        return (
            self.service_offering
            .buffer_before_minutes
            + self.effective_duration_minutes
            + self.service_offering
            .buffer_after_minutes
        )
    @property
    def is_active_service_assignment(
        self,
    ) -> bool:
        if (
            self.status
            != (
                MedicalPractitionerServiceAssignmentStatus
                .ACTIVE
            )
        ):
            return False
        assignment = self.practitioner_assignment
        offering = self.service_offering
        today = medical_timezone.localdate()
        if not assignment.is_active:
            return False
        if not offering.is_active_offering:
            return False
        if (
            self.effective_from
            and today < self.effective_from
        ):
            return False
        if (
            self.effective_until
            and today > self.effective_until
        ):
            return False
        return (
            MedicalPractitionerSpecialty.objects
            .filter(
                company_id=self.company_id,
                practitioner_id=(
                    assignment.practitioner_id
                ),
                specialty_id=offering.specialty_id,
                is_active=True,
            )
            .exists()
        )
    def clean(self) -> None:
        super().clean()
        self.notes = clean_text(self.notes)
        if (
            self.duration_override_minutes
            is not None
            and self.duration_override_minutes < 1
        ):
            raise ValidationError(
                {
                    "duration_override_minutes": (
                        "Duration override must be "
                        "greater than zero."
                    )
                }
            )
        if (
            self.effective_from
            and self.effective_until
            and (
                self.effective_until
                < self.effective_from
            )
        ):
            raise ValidationError(
                {
                    "effective_until": (
                        "Effective-until date cannot "
                        "precede effective-from date."
                    )
                }
            )
        if not (
            self.company_id
            and self.practitioner_assignment_id
            and self.service_offering_id
        ):
            return
        assignment = self.practitioner_assignment
        offering = self.service_offering
        if assignment.company_id != self.company_id:
            raise ValidationError(
                {
                    "practitioner_assignment": (
                        "Practitioner assignment must "
                        "belong to the same company."
                    )
                }
            )
        if offering.company_id != self.company_id:
            raise ValidationError(
                {
                    "service_offering": (
                        "Service offering must belong "
                        "to the same company."
                    )
                }
            )
        if (
            assignment.branch_id
            != offering.branch_id
        ):
            raise ValidationError(
                {
                    "service_offering": (
                        "Service offering branch must "
                        "match practitioner assignment."
                    )
                }
            )
        if (
            assignment.department_id
            != offering.department_id
        ):
            raise ValidationError(
                {
                    "service_offering": (
                        "Service offering department "
                        "must match practitioner "
                        "assignment."
                    )
                }
            )
        if (
            assignment.clinic_id
            != offering.clinic_id
        ):
            raise ValidationError(
                {
                    "service_offering": (
                        "Service offering clinic must "
                        "match practitioner assignment."
                    )
                }
            )
        if (
            self.status
            != (
                MedicalPractitionerServiceAssignmentStatus
                .ACTIVE
            )
        ):
            return
        if not assignment.is_active:
            raise ValidationError(
                {
                    "practitioner_assignment": (
                        "An active service assignment "
                        "requires an active practitioner "
                        "location assignment."
                    )
                }
            )
        if not offering.is_active_offering:
            raise ValidationError(
                {
                    "service_offering": (
                        "An active practitioner service "
                        "assignment requires an active "
                        "medical service offering."
                    )
                }
            )
        specialty_exists = (
            MedicalPractitionerSpecialty.objects
            .filter(
                company_id=self.company_id,
                practitioner_id=(
                    assignment.practitioner_id
                ),
                specialty_id=offering.specialty_id,
                is_active=True,
            )
            .exists()
        )
        if not specialty_exists:
            raise ValidationError(
                {
                    "service_offering": (
                        "Practitioner must have an "
                        "active assignment to the "
                        "service specialty."
                    )
                }
            )
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(
            *args,
            **kwargs,
        )
# END PHASE 10.3-B2 PRACTITIONER SERVICE ASSIGNMENT FOUNDATION
# PHASE 10.3-C PRACTITIONER SCHEDULE AND TIME OFF FOUNDATION
from django.utils import timezone as practitioner_schedule_timezone
class MedicalWeekday(models.IntegerChoices):
    MONDAY = 0, "Monday"
    TUESDAY = 1, "Tuesday"
    WEDNESDAY = 2, "Wednesday"
    THURSDAY = 3, "Thursday"
    FRIDAY = 4, "Friday"
    SATURDAY = 5, "Saturday"
    SUNDAY = 6, "Sunday"
class MedicalPractitionerWeeklySchedule(
    MedicalAuditModel
):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name=(
            "medical_practitioner_weekly_schedules"
        ),
        db_index=True,
    )
    practitioner_assignment = models.ForeignKey(
        MedicalPractitionerAssignment,
        on_delete=models.CASCADE,
        related_name="weekly_schedules",
        db_index=True,
    )
    weekday = models.PositiveSmallIntegerField(
        choices=MedicalWeekday.choices,
        db_index=True,
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_interval_minutes = (
        models.PositiveSmallIntegerField(
            default=15,
            help_text=(
                "Minimum interval between generated "
                "appointment starting times."
            ),
        )
    )
    effective_from = models.DateField(
        blank=True,
        null=True,
        db_index=True,
    )
    effective_until = models.DateField(
        blank=True,
        null=True,
        db_index=True,
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )
    class Meta:
        verbose_name = (
            "Medical Practitioner Weekly Schedule"
        )
        verbose_name_plural = (
            "Medical Practitioner Weekly Schedules"
        )
        ordering = [
            "practitioner_assignment_id",
            "weekday",
            "start_time",
            "id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "is_active",
                ],
                name="med_pws_company_active",
            ),
            models.Index(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "weekday",
                ],
                name="med_pws_assignment_day",
            ),
            models.Index(
                fields=[
                    "company",
                    "effective_from",
                    "effective_until",
                ],
                name="med_pws_effective_dates",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "weekday",
                    "start_time",
                    "end_time",
                ],
                name="med_pws_unique_shift",
            ),
            models.CheckConstraint(
                condition=Q(
                    slot_interval_minutes__gt=0
                ),
                name="med_pws_interval_positive",
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.practitioner_assignment} — "
            f"{self.get_weekday_display()} — "
            f"{self.start_time}-{self.end_time}"
        )
    @property
    def practitioner(self):
        return (
            self.practitioner_assignment.practitioner
        )
    @property
    def practitioner_id(self):
        return (
            self.practitioner_assignment
            .practitioner_id
        )
    def applies_on(self, value) -> bool:
        if not self.is_active:
            return False
        if value.weekday() != self.weekday:
            return False
        if (
            self.effective_from
            and value < self.effective_from
        ):
            return False
        if (
            self.effective_until
            and value > self.effective_until
        ):
            return False
        return self.practitioner_assignment.is_active
    def clean(self) -> None:
        super().clean()
        self.notes = clean_text(self.notes)
        if self.weekday not in MedicalWeekday.values:
            raise ValidationError(
                {
                    "weekday": (
                        "Provide a valid weekday."
                    )
                }
            )
        if (
            self.start_time
            and self.end_time
            and self.end_time <= self.start_time
        ):
            raise ValidationError(
                {
                    "end_time": (
                        "End time must be after "
                        "start time."
                    )
                }
            )
        if self.slot_interval_minutes < 1:
            raise ValidationError(
                {
                    "slot_interval_minutes": (
                        "Slot interval must be "
                        "greater than zero."
                    )
                }
            )
        if (
            self.effective_from
            and self.effective_until
            and self.effective_until
            < self.effective_from
        ):
            raise ValidationError(
                {
                    "effective_until": (
                        "Effective-until date cannot "
                        "precede effective-from date."
                    )
                }
            )
        if not (
            self.company_id
            and self.practitioner_assignment_id
        ):
            return
        if (
            self.practitioner_assignment.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "practitioner_assignment": (
                        "Practitioner assignment must "
                        "belong to the same company."
                    )
                }
            )
        if (
            self.is_active
            and not (
                self.practitioner_assignment
                .is_active
            )
        ):
            raise ValidationError(
                {
                    "practitioner_assignment": (
                        "An active weekly schedule "
                        "requires an active practitioner "
                        "assignment."
                    )
                }
            )
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(
            *args,
            **kwargs,
        )
class MedicalPractitionerScheduleBreak(
    MedicalAuditModel
):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name=(
            "medical_practitioner_schedule_breaks"
        ),
        db_index=True,
    )
    weekly_schedule = models.ForeignKey(
        MedicalPractitionerWeeklySchedule,
        on_delete=models.CASCADE,
        related_name="schedule_breaks",
        db_index=True,
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )
    class Meta:
        verbose_name = (
            "Medical Practitioner Schedule Break"
        )
        verbose_name_plural = (
            "Medical Practitioner Schedule Breaks"
        )
        ordering = [
            "weekly_schedule_id",
            "start_time",
            "id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "weekly_schedule",
                    "is_active",
                ],
                name="med_psb_schedule_active",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "company",
                    "weekly_schedule",
                    "start_time",
                    "end_time",
                ],
                name="med_psb_unique_window",
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.weekly_schedule} — "
            f"{self.start_time}-{self.end_time}"
        )
    @property
    def practitioner_assignment(self):
        return (
            self.weekly_schedule
            .practitioner_assignment
        )
    @property
    def practitioner_id(self):
        return (
            self.weekly_schedule
            .practitioner_id
        )
    def clean(self) -> None:
        super().clean()
        self.notes = clean_text(self.notes)
        if (
            self.start_time
            and self.end_time
            and self.end_time <= self.start_time
        ):
            raise ValidationError(
                {
                    "end_time": (
                        "Break end time must be after "
                        "break start time."
                    )
                }
            )
        if not (
            self.company_id
            and self.weekly_schedule_id
        ):
            return
        schedule = self.weekly_schedule
        if schedule.company_id != self.company_id:
            raise ValidationError(
                {
                    "weekly_schedule": (
                        "Weekly schedule must belong "
                        "to the same company."
                    )
                }
            )
        if (
            self.start_time < schedule.start_time
            or self.end_time > schedule.end_time
        ):
            raise ValidationError(
                {
                    "end_time": (
                        "Schedule break must remain "
                        "inside the weekly schedule."
                    )
                }
            )
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(
            *args,
            **kwargs,
        )
class MedicalPractitionerTimeOffStatus(
    models.TextChoices
):
    APPROVED = "APPROVED", "Approved"
    CANCELLED = "CANCELLED", "Cancelled"
class MedicalPractitionerTimeOff(
    MedicalAuditModel
):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name=(
            "medical_practitioner_time_offs"
        ),
        db_index=True,
    )
    practitioner_assignment = models.ForeignKey(
        MedicalPractitionerAssignment,
        on_delete=models.CASCADE,
        related_name="time_off_periods",
        db_index=True,
    )
    starts_at = models.DateTimeField(
        db_index=True,
    )
    ends_at = models.DateTimeField(
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=(
            MedicalPractitionerTimeOffStatus
            .choices
        ),
        default=(
            MedicalPractitionerTimeOffStatus
            .APPROVED
        ),
        db_index=True,
    )
    reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )
    class Meta:
        verbose_name = (
            "Medical Practitioner Time Off"
        )
        verbose_name_plural = (
            "Medical Practitioner Time Offs"
        )
        ordering = [
            "starts_at",
            "practitioner_assignment_id",
            "id",
        ]
        indexes = [
            models.Index(
                fields=[
                    "company",
                    "practitioner_assignment",
                    "starts_at",
                    "ends_at",
                ],
                name="med_pto_assignment_dates",
            ),
            models.Index(
                fields=[
                    "company",
                    "status",
                    "starts_at",
                ],
                name="med_pto_status_start",
            ),
        ]
    def __str__(self) -> str:
        return (
            f"{self.practitioner_assignment} — "
            f"{self.starts_at} — {self.ends_at}"
        )
    @property
    def practitioner(self):
        return (
            self.practitioner_assignment.practitioner
        )
    @property
    def practitioner_id(self):
        return (
            self.practitioner_assignment
            .practitioner_id
        )
    @property
    def is_effective(self) -> bool:
        return (
            self.status
            == (
                MedicalPractitionerTimeOffStatus
                .APPROVED
            )
        )
    def overlaps(
        self,
        start,
        end,
    ) -> bool:
        if not self.is_effective:
            return False
        return (
            self.starts_at < end
            and self.ends_at > start
        )
    def clean(self) -> None:
        super().clean()
        self.notes = clean_text(self.notes)
        self.reason = clean_text(self.reason)
        if (
            self.starts_at
            and self.ends_at
            and self.ends_at <= self.starts_at
        ):
            raise ValidationError(
                {
                    "ends_at": (
                        "Time-off end must be after "
                        "its start."
                    )
                }
            )
        if not (
            self.company_id
            and self.practitioner_assignment_id
        ):
            return
        if (
            self.practitioner_assignment.company_id
            != self.company_id
        ):
            raise ValidationError(
                {
                    "practitioner_assignment": (
                        "Practitioner assignment must "
                        "belong to the same company."
                    )
                }
            )
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(
            *args,
            **kwargs,
        )
# END PHASE 10.3-C PRACTITIONER SCHEDULE AND TIME OFF FOUNDATION
