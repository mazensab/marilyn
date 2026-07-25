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
