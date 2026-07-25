from django.db import migrations


SPECIALTIES = [
    (
        "GENERAL-MEDICINE",
        "\u0627\u0644\u0637\u0628 \u0627\u0644\u0639\u0627\u0645",
        "General Medicine",
        10,
    ),
    (
        "FAMILY-MEDICINE",
        "\u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629",
        "Family Medicine",
        20,
    ),
    (
        "INTERNAL-MEDICINE",
        "\u0627\u0644\u0628\u0627\u0637\u0646\u0629",
        "Internal Medicine",
        30,
    ),
    (
        "PEDIATRICS",
        "\u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644",
        "Pediatrics",
        40,
    ),
    (
        "DENTISTRY",
        "\u0637\u0628 \u0627\u0644\u0623\u0633\u0646\u0627\u0646",
        "Dentistry",
        50,
    ),
    (
        "DERMATOLOGY",
        "\u0627\u0644\u062c\u0644\u062f\u064a\u0629",
        "Dermatology",
        60,
    ),
    (
        "OBSTETRICS-GYNECOLOGY",
        "\u0627\u0644\u0646\u0633\u0627\u0621 \u0648\u0627\u0644\u0648\u0644\u0627\u062f\u0629",
        "Obstetrics and Gynecology",
        70,
    ),
    (
        "OPHTHALMOLOGY",
        "\u0637\u0628 \u0648\u062c\u0631\u0627\u062d\u0629 \u0627\u0644\u0639\u064a\u0648\u0646",
        "Ophthalmology",
        80,
    ),
    (
        "ENT",
        "\u0627\u0644\u0623\u0646\u0641 \u0648\u0627\u0644\u0623\u0630\u0646 \u0648\u0627\u0644\u062d\u0646\u062c\u0631\u0629",
        "ENT",
        90,
    ),
    (
        "ORTHOPEDICS",
        "\u0627\u0644\u0639\u0638\u0627\u0645",
        "Orthopedics",
        100,
    ),
    (
        "CARDIOLOGY",
        "\u0627\u0644\u0642\u0644\u0628",
        "Cardiology",
        110,
    ),
    (
        "PSYCHIATRY",
        "\u0627\u0644\u0637\u0628 \u0627\u0644\u0646\u0641\u0633\u064a",
        "Psychiatry",
        120,
    ),
    (
        "RADIOLOGY",
        "\u0627\u0644\u0623\u0634\u0639\u0629",
        "Radiology",
        130,
    ),
    (
        "LABORATORY-MEDICINE",
        "\u0637\u0628 \u0627\u0644\u0645\u062e\u062a\u0628\u0631\u0627\u062a",
        "Laboratory Medicine",
        140,
    ),
    (
        "PHYSIOTHERAPY",
        "\u0627\u0644\u0639\u0644\u0627\u062c \u0627\u0644\u0637\u0628\u064a\u0639\u064a",
        "Physiotherapy",
        150,
    ),
]


def seed_system_specialties(apps, schema_editor):
    Specialty = apps.get_model(
        "medical",
        "MedicalSpecialty",
    )

    for code, name_ar, name_en, sort_order in SPECIALTIES:
        Specialty.objects.update_or_create(
            company=None,
            code=code,
            defaults={
                "name_ar": name_ar,
                "name_en": name_en,
                "description": "",
                "is_system": True,
                "is_active": True,
                "sort_order": sort_order,
                "notes": "",
                "extra_data": {},
            },
        )


def remove_system_specialties(apps, schema_editor):
    Specialty = apps.get_model(
        "medical",
        "MedicalSpecialty",
    )

    Specialty.objects.filter(
        company__isnull=True,
        is_system=True,
        code__in=[
            row[0]
            for row in SPECIALTIES
        ],
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "medical",
            "0001_initial",
        ),
    ]

    operations = [
        migrations.RunPython(
            seed_system_specialties,
            remove_system_specialties,
        ),
    ]
