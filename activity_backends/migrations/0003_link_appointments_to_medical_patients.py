from django.db import migrations


def link_appointments_to_medical_patients(apps, schema_editor):
    ClinicAppointment = apps.get_model(
        "activity_backends",
        "ClinicAppointment",
    )
    MedicalPatient = apps.get_model("medical", "MedicalPatient")
    database = schema_editor.connection.alias

    appointments = ClinicAppointment.objects.using(database).filter(
        medical_patient_id__isnull=True
    )

    for appointment in appointments.iterator():
        medical_patient_id = (
            MedicalPatient.objects.using(database)
            .filter(
                company_id=appointment.company_id,
                legacy_patient_id=appointment.patient_id,
            )
            .values_list("id", flat=True)
            .first()
        )

        if medical_patient_id is None:
            raise RuntimeError(
                "No MedicalPatient mapping exists for "
                f"ClinicAppointment {appointment.pk} and "
                f"ClinicPatient {appointment.patient_id}."
            )

        ClinicAppointment.objects.using(database).filter(
            pk=appointment.pk,
            medical_patient_id__isnull=True,
        ).update(medical_patient_id=medical_patient_id)


class Migration(migrations.Migration):

    dependencies = [
        ("activity_backends", "0002_add_medical_patient_to_appointments"),
    ]

    operations = [
        migrations.RunPython(
            link_appointments_to_medical_patients,
            migrations.RunPython.noop,
        ),
    ]
