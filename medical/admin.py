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

from .models import MedicalPatient


@admin.register(MedicalPatient)
class MedicalPatientAdmin(CompanyScopedAdmin):
    list_display = (
        "patient_number",
        "full_name",
        "company",
        "registration_branch",
        "mobile",
        "identifier_type",
        "identifier_number",
        "status",
        "created_at",
    )
    list_filter = (
        "status",
        "gender",
        "identifier_type",
        "company",
        "registration_branch",
    )
    search_fields = (
        "patient_number",
        "full_name",
        "full_name_ar",
        "full_name_en",
        "mobile",
        "email",
        "identifier_number",
    )
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

# PHASE 10.8-A MEDICAL DIAGNOSIS AND PROCEDURE ADMIN
from .models import (
    MedicalDiagnosis,
    MedicalProcedure,
)
@admin.register(MedicalDiagnosis)
class MedicalDiagnosisAdmin(CompanyScopedAdmin):
    list_display = (
        "diagnosis_code",
        "diagnosis_name",
        "encounter",
        "patient",
        "practitioner",
        "company",
        "is_primary",
        "diagnosed_at",
    )
    list_filter = (
        "company",
        "is_primary",
        "diagnosed_at",
    )
    search_fields = (
        "diagnosis_code",
        "diagnosis_name",
        "encounter__encounter_number",
        "patient__patient_number",
        "patient__full_name",
    )
    list_select_related = (
        "company",
        "encounter",
        "patient",
        "practitioner",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
@admin.register(MedicalProcedure)
class MedicalProcedureAdmin(CompanyScopedAdmin):
    list_display = (
        "procedure_code_snapshot",
        "procedure_name_snapshot",
        "encounter",
        "patient",
        "practitioner",
        "company",
        "status",
        "quantity",
        "unit_price_snapshot",
        "performed_at",
    )
    list_filter = (
        "company",
        "status",
        "performed_at",
    )
    search_fields = (
        "procedure_code_snapshot",
        "procedure_name_snapshot",
        "encounter__encounter_number",
        "patient__patient_number",
        "patient__full_name",
        "catalog_item__code",
        "catalog_item__name",
    )
    list_select_related = (
        "company",
        "encounter",
        "patient",
        "practitioner",
        "catalog_item",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
# END PHASE 10.8-A MEDICAL DIAGNOSIS AND PROCEDURE ADMIN

# PHASE 10.9-A MEDICAL REFERRAL AND RECORD ACCESS ADMIN
from .models import (
    MedicalReferral,
    MedicalReferralRecordAccess,
)
@admin.register(MedicalReferral)
class MedicalReferralAdmin(CompanyScopedAdmin):
    list_display = (
        "referral_number",
        "patient",
        "referring_practitioner",
        "receiving_practitioner",
        "target_branch",
        "target_department",
        "priority",
        "status",
        "referred_at",
        "company",
    )
    list_filter = (
        "company",
        "priority",
        "status",
        "target_branch",
        "target_department",
        "referred_at",
    )
    search_fields = (
        "referral_number",
        "patient__patient_number",
        "patient__full_name",
        "referring_practitioner__practitioner_number",
        "receiving_practitioner__practitioner_number",
        "referral_reason",
        "requested_service",
    )
    list_select_related = (
        "company",
        "source_encounter",
        "patient",
        "referring_practitioner",
        "receiving_practitioner",
        "target_branch",
        "target_department",
        "target_clinic",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
@admin.register(MedicalReferralRecordAccess)
class MedicalReferralRecordAccessAdmin(
    CompanyScopedAdmin
):
    list_display = (
        "referral",
        "patient",
        "receiving_practitioner",
        "scope",
        "status",
        "access_starts_at",
        "access_ends_at",
        "company",
    )
    list_filter = (
        "company",
        "scope",
        "status",
        "access_starts_at",
        "access_ends_at",
    )
    search_fields = (
        "referral__referral_number",
        "patient__patient_number",
        "patient__full_name",
        "receiving_practitioner__practitioner_number",
    )
    list_select_related = (
        "company",
        "referral",
        "patient",
        "receiving_practitioner",
        "granted_by",
        "accepted_by",
        "rejected_by",
        "revoked_by",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
# END PHASE 10.9-A MEDICAL REFERRAL AND RECORD ACCESS ADMIN
# ============================================================
# PHASE 10.3-A2 — MEDICAL SERVICE OFFERING ADMIN
# ============================================================
from .models import MedicalServiceOffering
@admin.register(MedicalServiceOffering)
class MedicalServiceOfferingAdmin(
    CompanyScopedAdmin
):
    list_display = (
        "catalog_item",
        "company",
        "branch",
        "department",
        "specialty",
        "clinic",
        "status",
        "duration_minutes",
        "sale_price_override",
        "online_booking_enabled",
    )
    list_filter = (
        "status",
        "online_booking_enabled",
        "requires_approval",
        "requires_preparation",
        "branch",
        "department",
        "specialty",
    )
    search_fields = (
        "catalog_item__code",
        "catalog_item__name",
        "catalog_item__name_ar",
        "catalog_item__name_en",
        "branch__name",
        "department__code",
        "department__name_ar",
        "department__name_en",
        "clinic__code",
        "clinic__name_ar",
        "clinic__name_en",
    )
    list_select_related = (
        "company",
        "catalog_item",
        "branch",
        "department",
        "specialty",
        "clinic",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
# PHASE 10.3-B2 PRACTITIONER SERVICE ASSIGNMENT ADMIN
from .models import (
    MedicalPractitionerServiceAssignment,
)
@admin.register(
    MedicalPractitionerServiceAssignment
)
class MedicalPractitionerServiceAssignmentAdmin(
    CompanyScopedAdmin
):
    list_display = (
        "practitioner_assignment",
        "service_offering",
        "company",
        "status",
        "duration_override_minutes",
        "online_booking_enabled",
        "effective_from",
        "effective_until",
        "created_at",
    )
    list_filter = (
        "company",
        "status",
        "online_booking_enabled",
        "effective_from",
        "effective_until",
    )
    search_fields = (
        (
            "practitioner_assignment__"
            "practitioner__practitioner_number"
        ),
        (
            "practitioner_assignment__"
            "practitioner__full_name_ar"
        ),
        (
            "practitioner_assignment__"
            "practitioner__full_name_en"
        ),
        "service_offering__catalog_item__code",
        "service_offering__catalog_item__name",
        "service_offering__catalog_item__name_ar",
        "service_offering__catalog_item__name_en",
    )
    list_select_related = (
        "company",
        "practitioner_assignment",
        "practitioner_assignment__practitioner",
        "service_offering",
        "service_offering__catalog_item",
        "service_offering__branch",
        "service_offering__department",
        "service_offering__specialty",
        "service_offering__clinic",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
# END PHASE 10.3-B2 PRACTITIONER SERVICE ASSIGNMENT ADMIN
