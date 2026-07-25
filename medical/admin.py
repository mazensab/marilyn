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
