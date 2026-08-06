from django.db import migrations
SPECIALTY_NAMES = {
    "FAMILY-MEDICINE": "طب الأسرة",
    "OPHTHALMOLOGY": "طب وجراحة العيون",
    "PEDIATRICS": "طب الأطفال",
    "DENTISTRY": "طب الأسنان",
    "LABORATORY-MEDICINE": "طب المختبرات",
    "GENERAL-MEDICINE": "الطب العام",
    "PSYCHIATRY": "الطب النفسي",
    "CARDIOLOGY": "طب القلب",
    "ENT": "الأنف والأذن والحنجرة",
    "ORTHOPEDICS": "جراحة العظام",
    "RADIOLOGY": "الأشعة",
    "PHYSIOTHERAPY": "العلاج الطبيعي",
    "OBSTETRICS-GYNECOLOGY": "النساء والولادة",
    "INTERNAL-MEDICINE": "الطب الباطني",
    "DERMATOLOGY": "الأمراض الجلدية",
}
def repair_system_specialty_arabic_names(apps, schema_editor):
    MedicalSpecialty = apps.get_model("medical", "MedicalSpecialty")
    for code, name_ar in SPECIALTY_NAMES.items():
        MedicalSpecialty.objects.filter(
            code__iexact=code,
        ).update(
            name_ar=name_ar,
        )
class Migration(migrations.Migration):
    dependencies = [
        ("medical", "0013_harden_medical_appointment_booking"),
    ]
    operations = [
        migrations.RunPython(
            repair_system_specialty_arabic_names,
            migrations.RunPython.noop,
        ),
    ]