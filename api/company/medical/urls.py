from __future__ import annotations

from django.urls import path

from .patients import (
    patient_collection,
    patient_detail,
    patient_status,
)

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


from .appointments import (
    appointment_collection,
    appointment_detail,
    appointment_status,
)

from .encounters import (
    encounter_collection,
    encounter_detail,
    encounter_status,
)
from .diagnoses import (
    diagnosis_collection,
    diagnosis_detail,
    diagnosis_primary,
)
from .procedures import (
    procedure_collection,
    procedure_detail,
    procedure_status,
)
from .referrals import (
    referral_collection,
    referral_detail,
    referral_status,
)
from .record_access import (
    record_access_resource,
    record_access_status,
)

from .patient_medical_file import patient_medical_file

urlpatterns = [
    # PHASE 10.10-A COMPANY PATIENT MEDICAL FILE API
    path(
        (
            "patients/"
            "<int:patient_id>/medical-file/"
        ),
        patient_medical_file,
        name=(
            "company-medical-"
            "patient-medical-file"
        ),
    ),
    # PHASE 10.9-C COMPANY MEDICAL RECORD ACCESS API
    path(
        (
            "referrals/"
            "<int:referral_id>/record-access/"
        ),
        record_access_resource,
        name="company-medical-referral-record-access",
    ),
    path(
        (
            "referrals/"
            "<int:referral_id>/record-access/status/"
        ),
        record_access_status,
        name=(
            "company-medical-referral-"
            "record-access-status"
        ),
    ),
    # PHASE 10.9-B COMPANY MEDICAL REFERRAL API
    path(
        "referrals/",
        referral_collection,
        name="company-medical-referrals",
    ),
    path(
        "referrals/<int:referral_id>/",
        referral_detail,
        name="company-medical-referral-detail",
    ),
    path(
        "referrals/<int:referral_id>/status/",
        referral_status,
        name="company-medical-referral-status",
    ),
    # PHASE 10.8-C COMPANY MEDICAL PROCEDURE API
    path(
        (
            "encounters/"
            "<int:encounter_id>/procedures/"
        ),
        procedure_collection,
        name="company-medical-encounter-procedures",
    ),
    path(
        (
            "encounters/"
            "<int:encounter_id>/procedures/"
            "<int:procedure_id>/"
        ),
        procedure_detail,
        name="company-medical-encounter-procedure-detail",
    ),
    path(
        (
            "encounters/"
            "<int:encounter_id>/procedures/"
            "<int:procedure_id>/status/"
        ),
        procedure_status,
        name="company-medical-encounter-procedure-status",
    ),
    # PHASE 10.8-B COMPANY MEDICAL DIAGNOSIS API
    path(
        (
            "encounters/"
            "<int:encounter_id>/diagnoses/"
        ),
        diagnosis_collection,
        name="company-medical-encounter-diagnoses",
    ),
    path(
        (
            "encounters/"
            "<int:encounter_id>/diagnoses/"
            "<int:diagnosis_id>/"
        ),
        diagnosis_detail,
        name="company-medical-encounter-diagnosis-detail",
    ),
    path(
        (
            "encounters/"
            "<int:encounter_id>/diagnoses/"
            "<int:diagnosis_id>/primary/"
        ),
        diagnosis_primary,
        name="company-medical-encounter-diagnosis-primary",
    ),
    # PHASE 10.7-B COMPANY MEDICAL ENCOUNTER API
    path(
        "encounters/",
        encounter_collection,
        name="company-medical-encounters",
    ),
    path(
        "encounters/<int:encounter_id>/",
        encounter_detail,
        name="company-medical-encounter-detail",
    ),
    path(
        "encounters/<int:encounter_id>/status/",
        encounter_status,
        name="company-medical-encounter-status",
    ),
    path(
        "appointments/",
        appointment_collection,
        name="company-medical-appointments",
    ),    path(
        "appointments/<int:appointment_id>/",
        appointment_detail,
        name="company-medical-appointment-detail",
    ),    path(
        "appointments/<int:appointment_id>/status/",
        appointment_status,
        name="company-medical-appointment-status",
    ),
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

    # PHASE 10.5-A1 PATIENT API
    path(
        "patients/",
        patient_collection,
        name="patients-list-create",
    ),
    path(
        "patients/<int:patient_id>/",
        patient_detail,
        name="patients-detail",
    ),
    path(
        "patients/<int:patient_id>/status/",
        patient_status,
        name="patients-status",
    ),
]
