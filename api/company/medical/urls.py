from __future__ import annotations

from django.urls import path

from .views import (
    medical_collection,
    medical_detail,
    medical_status,
    medical_summary,
)


app_name = "company_medical"


urlpatterns = [
    path(
        "summary/",
        medical_summary,
        name="summary",
    ),

    path(
        "departments/",
        medical_collection,
        {"resource": "departments"},
        name="departments-list-create",
    ),
    path(
        "departments/<int:object_id>/",
        medical_detail,
        {"resource": "departments"},
        name="departments-detail",
    ),
    path(
        "departments/<int:object_id>/status/",
        medical_status,
        {"resource": "departments"},
        name="departments-status",
    ),

    path(
        "specialties/",
        medical_collection,
        {"resource": "specialties"},
        name="specialties-list-create",
    ),
    path(
        "specialties/<int:object_id>/",
        medical_detail,
        {"resource": "specialties"},
        name="specialties-detail",
    ),
    path(
        "specialties/<int:object_id>/status/",
        medical_status,
        {"resource": "specialties"},
        name="specialties-status",
    ),

    path(
        "clinics/",
        medical_collection,
        {"resource": "clinics"},
        name="clinics-list-create",
    ),
    path(
        "clinics/<int:object_id>/",
        medical_detail,
        {"resource": "clinics"},
        name="clinics-detail",
    ),
    path(
        "clinics/<int:object_id>/status/",
        medical_status,
        {"resource": "clinics"},
        name="clinics-status",
    ),
]
