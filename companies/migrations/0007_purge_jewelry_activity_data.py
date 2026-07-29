from django.db import migrations


def purge_jewelry_activity_data(apps, schema_editor):
    Company = apps.get_model("companies", "Company")
    ActivityProfile = apps.get_model("companies", "ActivityProfile")
    ContentType = apps.get_model("contenttypes", "ContentType")

    Company.objects.filter(
        activity_profile="JEWELRY",
    ).update(
        activity_profile="GENERAL",
    )

    ActivityProfile.objects.filter(
        code="JEWELRY",
    ).delete()

    ContentType.objects.filter(
        app_label="jewelry",
    ).delete()


def restore_jewelry_activity_data(apps, schema_editor):
    ActivityProfile = apps.get_model("companies", "ActivityProfile")

    ActivityProfile.objects.update_or_create(
        code="JEWELRY",
        defaults={
            "name": "ذهب ومجوهرات",
            "display_name": "ذهب ومجوهرات",
            "name_ar": "ذهب ومجوهرات",
            "name_en": "Jewelry",
            "description": "Gold and jewelry business activity.",
            "sector": "jewelry",
            "activity_type": "jewelry",
            "business_type": "jewelry",
            "is_active": True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0006_remove_jewelry_activity_profile'),
    ]

    operations = [
        migrations.RunPython(
            purge_jewelry_activity_data,
            restore_jewelry_activity_data,
        ),
    ]
