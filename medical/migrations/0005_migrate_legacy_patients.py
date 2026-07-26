from django.db import migrations


def _clean(value):
    return (value or "").strip()


def _map_gender(value):
    normalized = _clean(value).upper()
    mapping = {
        "M": "MALE",
        "MALE": "MALE",
        "ذكر": "MALE",
        "F": "FEMALE",
        "FEMALE": "FEMALE",
        "أنثى": "FEMALE",
        "انثى": "FEMALE",
        "OTHER": "OTHER",
        "آخر": "OTHER",
        "اخر": "OTHER",
    }
    return mapping.get(normalized, "UNSPECIFIED")


def migrate_legacy_patients(apps, schema_editor):
    LegacyPatient = apps.get_model("activity_backends", "ClinicPatient")
    MedicalPatient = apps.get_model("medical", "MedicalPatient")
    database = schema_editor.connection.alias

    for legacy in LegacyPatient.objects.using(database).all().iterator():
        if MedicalPatient.objects.using(database).filter(
            legacy_patient_id=legacy.pk
        ).exists():
            continue

        patient_number = _clean(legacy.patient_number).upper()
        if not patient_number:
            patient_number = f"LEGACY-{legacy.pk}"

        if MedicalPatient.objects.using(database).filter(
            company_id=legacy.company_id,
            patient_number=patient_number,
        ).exists():
            patient_number = f"{patient_number}-{legacy.pk}"

        national_id = _clean(legacy.national_id)
        identifier_type = "NATIONAL_ID" if national_id else "UNSPECIFIED"
        extra_data = dict(legacy.extra_data or {})
        extra_data.setdefault("legacy_patient_id", legacy.pk)

        if national_id and MedicalPatient.objects.using(database).filter(
            company_id=legacy.company_id,
            identifier_number=national_id,
        ).exists():
            extra_data.setdefault("legacy_national_id", national_id)
            national_id = ""
            identifier_type = "UNSPECIFIED"

        mapped_gender = _map_gender(legacy.gender)
        if _clean(legacy.gender) and mapped_gender == "UNSPECIFIED":
            extra_data.setdefault("legacy_gender", legacy.gender)

        patient = MedicalPatient.objects.using(database).create(
            company_id=legacy.company_id,
            legacy_patient_id=legacy.pk,
            registration_branch_id=None,
            patient_number=patient_number,
            identifier_type=identifier_type,
            identifier_number=national_id,
            full_name=_clean(legacy.full_name) or patient_number,
            full_name_ar="",
            full_name_en="",
            date_of_birth=legacy.date_of_birth,
            gender=mapped_gender,
            nationality="",
            mobile=_clean(legacy.mobile),
            email=_clean(legacy.email),
            status="ACTIVE",
            registered_at=legacy.created_at,
            notes=legacy.notes or "",
            extra_data=extra_data,
            created_by_id=None,
            updated_by_id=None,
        )

        MedicalPatient.objects.using(database).filter(pk=patient.pk).update(
            created_at=legacy.created_at,
            updated_at=legacy.updated_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("activity_backends", "0001_initial"),
        ("medical", "0004_add_medical_patient"),
    ]

    operations = [
        migrations.RunPython(
            migrate_legacy_patients,
            migrations.RunPython.noop,
        ),
    ]
