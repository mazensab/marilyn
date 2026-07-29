from typing import Any
from .models import (
    ClinicAppointment,
    ClinicAppointmentStatus,
    ClinicPatient,
    ClinicService,
)
def activity_backends_summary(
    company,
) -> dict[str, Any]:
    """
    Return the transitional legacy-clinic summary.
    Restaurant and project activity backends were removed
    from Marilyn Clinics. Their zero-valued sections remain
    temporarily for backward-compatible system monitoring.
    """
    return {
        "restaurant": {
            "menu_categories": 0,
            "menu_items": 0,
            "available_menu_items": 0,
            "tables": 0,
            "active_tables": 0,
            "orders": 0,
            "open_orders": 0,
        },
        "clinic": {
            "patients": (
                ClinicPatient.objects.filter(
                    company=company,
                ).count()
            ),
            "services": (
                ClinicService.objects.filter(
                    company=company,
                ).count()
            ),
            "active_services": (
                ClinicService.objects.filter(
                    company=company,
                    is_active=True,
                ).count()
            ),
            "appointments": (
                ClinicAppointment.objects.filter(
                    company=company,
                ).count()
            ),
            "scheduled_appointments": (
                ClinicAppointment.objects.filter(
                    company=company,
                    status=(
                        ClinicAppointmentStatus.SCHEDULED
                    ),
                ).count()
            ),
        },
        "projects": {
            "projects": 0,
            "work_orders": 0,
            "cost_lines": 0,
        },
    }
