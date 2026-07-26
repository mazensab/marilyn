from __future__ import annotations

from django.urls import path

from .views import (
    medical_collection,
    medical_detail,
    medical_status,
    medical_summary,
)

from .practitioners import (
    practitioner_collection,
    practitioner_detail,
    practitioner_status,
)
from .practitioner_relations import (
    practitioner_assignment_collection,
    practitioner_assignment_detail,
    practitioner_specialty_collection,
    practitioner_specialty_detail,
)
from .practitioner_licenses import (
    practitioner_license_collection,
    practitioner_license_detail,
    practitioner_license_status,
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

# PHASE 10.2-C2-A PRACTITIONER ROUTES START
path(
    "practitioners/",
    practitioner_collection,
    name="practitioners-list-create",
),
path(
    "practitioners/<int:practitioner_id>/",
    practitioner_detail,
    name="practitioners-detail",
),
path(
    (
        "practitioners/"
        "<int:practitioner_id>/status/"
    ),
    practitioner_status,
    name="practitioners-status",
),
# PHASE 10.2-C2-A PRACTITIONER ROUTES END

# PHASE 10.2-C2-B1 PRACTITIONER RELATIONS START
path(
    (
        "practitioners/"
        "<int:practitioner_id>/specialties/"
    ),
    practitioner_specialty_collection,
    name="practitioner-specialties-list-create",
),
path(
    (
        "practitioners/"
        "<int:practitioner_id>/specialties/"
        "<int:specialty_assignment_id>/"
    ),
    practitioner_specialty_detail,
    name="practitioner-specialties-detail",
),
path(
    (
        "practitioners/"
        "<int:practitioner_id>/assignments/"
    ),
    practitioner_assignment_collection,
    name="practitioner-assignments-list-create",
),
path(
    (
        "practitioners/"
        "<int:practitioner_id>/assignments/"
        "<int:assignment_id>/"
    ),
    practitioner_assignment_detail,
    name="practitioner-assignments-detail",
),
# PHASE 10.2-C2-B1 PRACTITIONER RELATIONS END

    # PHASE 10.2-C2-B2 PRACTITIONER LICENSES START
    path(
        (
            "practitioners/"
            "<int:practitioner_id>/licenses/"
        ),
        practitioner_license_collection,
        name="practitioner-licenses-list-create",
    ),
    path(
        (
            "practitioners/"
            "<int:practitioner_id>/licenses/"
            "<int:license_id>/"
        ),
        practitioner_license_detail,
        name="practitioner-licenses-detail",
    ),
    path(
        (
            "practitioners/"
            "<int:practitioner_id>/licenses/"
            "<int:license_id>/status/"
        ),
        practitioner_license_status,
        name="practitioner-licenses-status",
    ),
    # PHASE 10.2-C2-B2 PRACTITIONER LICENSES END
]
