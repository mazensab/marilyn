from django.contrib import admin
from .models import (
    ClinicAppointment,
    ClinicPatient,
    ClinicService,
)
@admin.register(ClinicPatient)
class ClinicPatientAdmin(admin.ModelAdmin):
    list_display = (
        "patient_number",
        "full_name",
        "mobile",
        "national_id",
        "company",
        "created_at",
    )
    search_fields = (
        "patient_number",
        "full_name",
        "mobile",
        "national_id",
        "email",
    )
    list_filter = (
        "company",
        "gender",
        "created_at",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
@admin.register(ClinicService)
class ClinicServiceAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "department",
        "duration_minutes",
        "price",
        "is_active",
        "company",
    )
    search_fields = (
        "code",
        "name",
        "department",
    )
    list_filter = (
        "company",
        "department",
        "is_active",
        "taxable",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
@admin.register(ClinicAppointment)
class ClinicAppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "appointment_number",
        "patient",
        "service",
        "appointment_at",
        "practitioner_name",
        "status",
        "company",
    )
    search_fields = (
        "appointment_number",
        "patient__patient_number",
        "patient__full_name",
        "service__code",
        "service__name",
        "practitioner_name",
    )
    list_filter = (
        "company",
        "status",
        "appointment_at",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
