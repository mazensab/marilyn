import django.db.models.deletion
from django.db import migrations, models
MEDICAL_CODE = "MEDICAL"
def normalize_medical_activity_profile(
    apps,
    schema_editor,
):
    ActivityProfile = apps.get_model(
        "companies",
        "ActivityProfile",
    )
    Company = apps.get_model(
        "companies",
        "Company",
    )
    database = schema_editor.connection.alias
    field_names = {
        field.name
        for field
        in ActivityProfile._meta.fields
    }
    defaults = {}
    supported_defaults = {
        "name": "Medical Clinics",
        "name_ar": (
            "العيادات والمراكز الطبية"
        ),
        "name_en": (
            "Medical Clinics"
        ),
        "description": (
            "Beauty, dermatology and "
            "medical clinic operations."
        ),
        "is_system": True,
        "is_active": True,
        "default_settings": {},
        "extra_data": {
            "activity_type": "MEDICAL",
            "business_type": "SERVICES",
            "sector": "HEALTHCARE",
            "source": (
                "companies.migrations."
                "0009_normalize_medical_"
                "activity_profile"
            ),
        },
    }
    for field_name, value in (
        supported_defaults.items()
    ):
        if field_name in field_names:
            defaults[field_name] = value
    medical_profile, _created = (
        ActivityProfile.objects.using(
            database
        ).update_or_create(
            company_id=None,
            code=MEDICAL_CODE,
            defaults=defaults,
        )
    )
    Company.objects.using(
        database
    ).all().update(
        activity_profile=MEDICAL_CODE,
        activity_profile_ref_id=(
            medical_profile.pk
        ),
    )
    ActivityProfile.objects.using(
        database
    ).filter(
        company_id__isnull=True,
    ).exclude(
        pk=medical_profile.pk,
    ).delete()
class Migration(migrations.Migration):
    dependencies = [
        (
            "companies",
            "0008_purge_pos_content_types",
        ),
    ]
    operations = [
        migrations.RunPython(
            normalize_medical_activity_profile,
            reverse_code=(
                migrations.RunPython.noop
            ),
        ),
        migrations.AlterField(
            model_name="company",
            name="activity_profile",
            field=models.CharField(
                choices=[
                    (
                        "MEDICAL",
                        "Medical / Clinics",
                    ),
                ],
                db_index=True,
                default="MEDICAL",
                max_length=40,
                verbose_name=(
                    "Activity profile"
                ),
            ),
        ),
    ]
