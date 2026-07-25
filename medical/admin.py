from django.contrib import admin

from .models import (
    MedicalClinic,
    MedicalClinicSpecialty,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
    MedicalSettings,
    MedicalSpecialty,
)


class CompanyScopedAdmin(admin.ModelAdmin):
    list_select_related = ("company",)


@admin.register(MedicalSettings)
class MedicalSettingsAdmin(CompanyScopedAdmin):
    list_display = (
        "company",
        "patient_number_prefix",
        "practitioner_number_prefix",
        "default_appointment_duration",
        "require_patient_identifier",
    )
    search_fields = (
        "company__name",
        "company__company_code",
    )


@admin.register(MedicalDepartment)
class MedicalDepartmentAdmin(CompanyScopedAdmin):
    list_display = (
        "code",
        "name_ar",
        "company",
        "parent",
        "cost_center",
        "is_active",
        "sort_order",
    )
    list_filter = ("company", "is_active")
    search_fields = (
        "code",
        "name_ar",
        "name_en",
        "company__name",
    )


@admin.register(MedicalDepartmentBranch)
class MedicalDepartmentBranchAdmin(CompanyScopedAdmin):
    list_display = (
        "department",
        "branch",
        "company",
        "is_primary",
        "is_active",
    )
    list_filter = ("company", "is_primary", "is_active")
    search_fields = (
        "department__code",
        "department__name_ar",
        "branch__name",
    )


@admin.register(MedicalSpecialty)
class MedicalSpecialtyAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name_ar",
        "company",
        "is_system",
        "is_active",
        "sort_order",
    )
    list_filter = ("is_system", "is_active", "company")
    search_fields = ("code", "name_ar", "name_en")


@admin.register(MedicalDepartmentSpecialty)
class MedicalDepartmentSpecialtyAdmin(CompanyScopedAdmin):
    list_display = (
        "department",
        "specialty",
        "company",
        "is_primary",
        "is_active",
    )
    list_filter = ("company", "is_primary", "is_active")


@admin.register(MedicalClinic)
class MedicalClinicAdmin(CompanyScopedAdmin):
    list_display = (
        "code",
        "name_ar",
        "company",
        "branch",
        "department",
        "room_number",
        "is_default",
        "is_active",
    )
    list_filter = (
        "company",
        "branch",
        "department",
        "is_default",
        "is_active",
    )
    search_fields = (
        "code",
        "name_ar",
        "name_en",
        "room_number",
    )


@admin.register(MedicalClinicSpecialty)
class MedicalClinicSpecialtyAdmin(CompanyScopedAdmin):
    list_display = (
        "clinic",
        "specialty",
        "company",
        "is_primary",
        "is_active",
    )
    list_filter = ("company", "is_primary", "is_active")

# Phase 10.2-B - Healthcare Practitioners Admin
from .models import (
    MedicalPractitioner,
    MedicalPractitionerAssignment,
    MedicalPractitionerLicense,
    MedicalPractitionerSpecialty,
)


@admin.register(MedicalPractitioner)
class MedicalPractitionerAdmin(admin.ModelAdmin):
    list_display = (
        "practitioner_number",
        "full_name_ar",
        "full_name_en",
        "company",
        "practitioner_type",
        "primary_specialty",
        "default_branch",
        "status",
        "is_accepting_appointments",
    )
    list_filter = (
        "company",
        "practitioner_type",
        "status",
        "is_accepting_appointments",
        "default_branch",
    )
    search_fields = (
        "practitioner_number",
        "full_name_ar",
        "full_name_en",
        "professional_title",
        "mobile",
        "email",
    )
    list_select_related = (
        "company",
        "membership",
        "employee",
        "primary_specialty",
        "default_branch",
        "default_department",
        "default_clinic",
    )


@admin.register(MedicalPractitionerSpecialty)
class MedicalPractitionerSpecialtyAdmin(admin.ModelAdmin):
    list_display = (
        "practitioner",
        "specialty",
        "company",
        "is_primary",
        "is_active",
        "years_experience",
        "valid_until",
    )
    list_filter = (
        "company",
        "is_primary",
        "is_active",
        "specialty",
    )
    list_select_related = (
        "company",
        "practitioner",
        "specialty",
    )


@admin.register(MedicalPractitionerAssignment)
class MedicalPractitionerAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "practitioner",
        "company",
        "branch",
        "department",
        "clinic",
        "is_primary",
        "is_active",
        "start_date",
        "end_date",
    )
    list_filter = (
        "company",
        "branch",
        "department",
        "clinic",
        "is_primary",
        "is_active",
    )
    list_select_related = (
        "company",
        "practitioner",
        "branch",
        "department",
        "clinic",
    )


@admin.register(MedicalPractitionerLicense)
class MedicalPractitionerLicenseAdmin(admin.ModelAdmin):
    list_display = (
        "license_number",
        "practitioner",
        "company",
        "license_type",
        "issuing_authority",
        "status",
        "issued_at",
        "expires_at",
    )
    list_filter = (
        "company",
        "status",
        "issuing_authority",
        "expires_at",
    )
    search_fields = (
        "license_number",
        "license_type",
        "issuing_authority",
        "practitioner__practitioner_number",
        "practitioner__full_name_ar",
        "practitioner__full_name_en",
    )
    list_select_related = (
        "company",
        "practitioner",
        "specialty",
    )
# End Phase 10.2-B - Healthcare Practitioners Admin
