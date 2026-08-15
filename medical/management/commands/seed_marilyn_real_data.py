from __future__ import annotations

from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import CatalogCategory, CatalogItem
from companies.models import Branch, Company
from medical.models import (
    MedicalClinic,
    MedicalClinicSpecialty,
    MedicalDepartment,
    MedicalDepartmentBranch,
    MedicalDepartmentSpecialty,
    MedicalPractitioner,
    MedicalPractitionerAssignment,
    MedicalPractitionerLicense,
    MedicalPractitionerScheduleBreak,
    MedicalPractitionerServiceAssignment,
    MedicalPractitionerSpecialty,
    MedicalPractitionerWeeklySchedule,
    MedicalServiceOffering,
    MedicalSettings,
    MedicalSpecialty,
)


COMPANY_CODE = "CMP-2026-000001"
BRANCH_CODE = "MARILYN-MAIN"
DERMATOLOGY_CODE = "DERMATOLOGY"
DEPARTMENT_CODE = "DERM-AESTHETICS"

SOURCE_SITE = "https://marilynclinics.net/ar"
SOURCE_KIND = "PUBLIC_WEBSITE"
SEED_VERSION = "2026-08-15-v1"


def provenance(*, source: str, confidence: str = "verified", **extra):
    data = {
        "seed_version": SEED_VERSION,
        "source": source,
        "confidence": confidence,
    }
    data.update(extra)
    return data


CATEGORIES = [
    {
        "code": "SKIN-CARE",
        "name": "العناية بالبشرة",
        "name_ar": "العناية بالبشرة",
        "name_en": "Skin Care",
        "sort_order": 10,
        "description": "خدمات جلدية وتجميلية مخصصة للعناية بالبشرة وتحسين مظهرها.",
    },
    {
        "code": "HAIR-CARE",
        "name": "العناية بالشعر",
        "name_ar": "العناية بالشعر",
        "name_en": "Hair Care",
        "sort_order": 20,
        "description": "خدمات مخصصة للعناية بالشعر وفروة الرأس ضمن نطاق الجلدية والتجميل.",
    },
    {
        "code": "LASER",
        "name": "الليزر",
        "name_ar": "الليزر",
        "name_en": "Laser",
        "sort_order": 30,
        "description": "خدمات الليزر والتشقير وإزالة الشعر والتاتو حسب التقييم السريري.",
    },
]


SERVICES = [
    # Skin care (9)
    dict(category="SKIN-CARE", code="SKIN-COLD-PEEL", name_ar="التقشير البارد", name_en="Cold Peel", price="1200.00", duration=45),
    dict(category="SKIN-CARE", code="SKIN-FACE-PRP", name_ar="بلازما الوجه", name_en="Face PRP", price="600.00", duration=45),
    dict(category="SKIN-CARE", code="SKIN-TATTOO-REMOVE-S", name_ar="جلسة إزالة تاتو (منطقة صغيرة)", name_en="Small Area Tattoo Removal", price="250.00", duration=30),
    dict(category="SKIN-CARE", code="SKIN-FRACTIONAL-LASER", name_ar="فراكشنال ليزر", name_en="Fractional Laser", price="600.00", duration=45),
    dict(category="SKIN-CARE", code="SKIN-POTENZA", name_ar="البوتنزا", name_en="Potenza", price="1200.00", duration=60),
    dict(category="SKIN-CARE", code="SKIN-DERMAPEN", name_ar="الديرمابن", name_en="Dermapen", price="600.00", duration=45),
    dict(category="SKIN-CARE", code="SKIN-TATTOO-REMOVE-L", name_ar="جلسة إزالة تاتو (منطقة كبيرة)", name_en="Large Area Tattoo Removal", price="750.00", duration=45),
    dict(category="SKIN-CARE", code="SKIN-COLD-PEEL-CREAM", name_ar="تقشير بارد مع الكريم", name_en="Cold Peel with Cream", price="2200.00", duration=60),
    dict(category="SKIN-CARE", code="SKIN-HYDRATOUCH", name_ar="هيدراتاتش", name_en="HydraTouch", price="350.00", old_price="400.00", duration=60),

    # Hair care (5)
    dict(category="HAIR-CARE", code="HAIR-EXOSOME-PRP", name_ar="جلسة اكسوزوم + بلازما للشعر", name_en="Hair Exosome + PRP", price="1200.00", old_price="1600.00", duration=60),
    dict(category="HAIR-CARE", code="HAIR-EXOSOME-DERMAPEN", name_ar="جلسة اكسوزوم + ديرما بن للشعر", name_en="Hair Exosome + Dermapen", price="1200.00", old_price="1600.00", duration=60),
    dict(category="HAIR-CARE", code="HAIR-STEM-CELLS", name_ar="الخلايا الجذعية للشعر", name_en="Hair Stem Cell Session", price="1200.00", duration=60),
    dict(category="HAIR-CARE", code="HAIR-EXOSOME", name_ar="الإكسوزوم للشعر", name_en="Hair Exosome Session", price="1000.00", duration=60),
    dict(category="HAIR-CARE", code="HAIR-PRP", name_ar="البلازما للشعر", name_en="Hair PRP", price="600.00", duration=45),

    # Laser (18)
    dict(category="LASER", code="LASER-MEN-FACE-3X", name_ar="3 جلسات ليزر وجه رجال + 3 رتوش", name_en="3 Men's Face Laser Sessions + 3 Retouches", price="560.00", old_price="750.00", duration=30, sessions=3),
    dict(category="LASER", code="LASER-WOMEN-FULLBODY-3X", name_ar="3 جلسات فل بدي نساء + 3 رتوش", name_en="3 Women's Full Body Laser Sessions + 3 Retouches", price="795.00", old_price="1000.00", duration=60, sessions=3),
    dict(category="LASER", code="LASER-WOMEN-3AREAS-3X", name_ar="3 جلسات مناطق (وجه + الإبطين + البكيني) + 3 رتوش", name_en="3 Sessions: Face + Underarms + Bikini + 3 Retouches", price="450.00", old_price="600.00", duration=45, sessions=3),
    dict(category="LASER", code="LASER-BLEACH-FACE-BROWS-3X", name_ar="3 جلسات تشقير وجه وحواجب", name_en="3 Face & Eyebrow Bleaching Sessions", price="315.00", old_price="450.00", duration=30, sessions=3),
    dict(category="LASER", code="LASER-WOMEN-FULLBODY", name_ar="ليزر جسم كامل للنساء", name_en="Women's Full Body Laser", price="400.00", duration=60),
    dict(category="LASER", code="LASER-TATTOO-REMOVE-S", name_ar="جلسة إزالة تاتو (منطقة صغيرة)", name_en="Small Area Tattoo Removal - Laser", internal_name="جلسة إزالة تاتو (منطقة صغيرة) - ليزر", price="250.00", duration=30),
    dict(category="LASER", code="LASER-WOMEN-3AREAS", name_ar="ليزر 3 مناطق صغيرة (الوجه + الإبطين + البكيني)", name_en="Laser 3 Small Areas: Face + Underarms + Bikini", price="200.00", duration=45),
    dict(category="LASER", code="LASER-MEN-FACE", name_ar="جلسة ليزر وجه للرجال", name_en="Men's Face Laser", price="250.00", duration=30),
    dict(category="LASER", code="LASER-MEN-UNDERARM", name_ar="جلسة ليزر إبط رجال", name_en="Men's Underarm Laser", price="200.00", duration=30),
    dict(category="LASER", code="LASER-MEN-FULLBODY", name_ar="جلسة فل بدي رجال (بدون البكيني والبوكسر)", name_en="Men's Full Body Laser (Excluding Bikini/Boxer Area)", price="1200.00", duration=75),
    dict(category="LASER", code="LASER-TATTOO-REMOVE-L", name_ar="جلسة إزالة تاتو (منطقة كبيرة)", name_en="Large Area Tattoo Removal - Laser", internal_name="جلسة إزالة تاتو (منطقة كبيرة) - ليزر", price="750.00", duration=45),
    dict(category="LASER", code="LASER-BLEACH-FACE-BROWS", name_ar="جلسة تشقير الوجه + الحواجب", name_en="Face & Eyebrow Bleaching Session", price="150.00", duration=30),
    dict(category="LASER", code="LASER-WOMEN-FULLBODY-BLEACH", name_ar="جلسة فل بدي نساء + جلسة تشقير وجه وحواجب", name_en="Women's Full Body Laser + Face & Eyebrow Bleaching", price="440.00", old_price="550.00", duration=75),
    dict(category="LASER", code="LASER-BLEACH-BROWS", name_ar="جلسة تشقير حواجب", name_en="Eyebrow Bleaching Session", price="100.00", duration=20),
    dict(category="LASER", code="LASER-WOMEN-MINIBODY", name_ar="جلسة ميني بدي بدون (ظهر، بطن)", name_en="Women's Mini Body Laser (Excluding Back & Abdomen)", price="300.00", old_price="350.00", duration=45),
    dict(category="LASER", code="LASER-WOMEN-FULLBODY-OFFER", name_ar="جلسة ليزر فل بدي - عرض", name_en="Women's Full Body Laser - Offer", price="350.00", old_price="400.00", duration=60),
    dict(category="LASER", code="LASER-WOMEN-FULLBODY-3X-OFFER", name_ar="3 جلسات فل بدي نساء + 3 رتوش - عرض", name_en="3 Women's Full Body Sessions + 3 Retouches - Offer", price="1000.00", old_price="1200.00", duration=60, sessions=3),
    dict(category="LASER", code="LASER-WOMEN-MINIBODY-3X", name_ar="بكج ميني بدي بدون (ظهر، بطن)", name_en="Women's Mini Body Package (Excluding Back & Abdomen)", price="800.00", old_price="1000.00", duration=45, sessions=3),
]


PRACTITIONERS = [
    {
        "number": "PRC-000001",
        "name_ar": "د. سارة الهيبي",
        "name_en": "Dr. Sara Al-Haibi",
        "title": "طبيبة أمراض جلدية وتجميل غير جراحي",
        "gender": "FEMALE",
        "years_experience": 12,  # Development placeholder
        "license_number": "DEV-SCFHS-DERM-0001",
        "license_type": "تصنيف مهني - تطوير",
        "issuing_authority": "الهيئة السعودية للتخصصات الصحية",
        "issued_at": date(2022, 1, 1),
        "expires_at": date(2027, 12, 31),
        "verified_at": date(2026, 8, 15),
        "source_note": "الموقع يذكر التصنيف من الهيئة وماجستير الأمراض الجلدية والتجميل.",
    },
    {
        "number": "PRC-000002",
        "name_ar": "د. ياسمين الجبيلي",
        "name_en": "Dr. Yasmin Al-Jbeili",
        "title": "طبيبة مقيمة جلدية وتجميل",
        "gender": "FEMALE",
        "years_experience": 6,
        "license_number": "DEV-SCFHS-DERM-0002",
        "license_type": "ترخيص مهني - تطوير",
        "issuing_authority": "الهيئة السعودية للتخصصات الصحية",
        "issued_at": date(2023, 1, 1),
        "expires_at": date(2028, 12, 31),
        "verified_at": date(2026, 8, 15),
        "source_note": "الموقع يذكر بكالوريوس الطب والجراحة، ماجستير الجلدية والتجميل، وخبرة أكثر من 5 سنوات.",
    },
]


class Command(BaseCommand):
    help = "Seed/update Marilyn Clinics real development data safely and idempotently."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run all validations and DB operations inside a transaction, then roll back.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options["dry_run"])
        self.created = 0
        self.updated = 0

        with transaction.atomic():
            company = self.seed_company()
            branch = self.seed_branch(company)
            specialty = self.get_dermatology_specialty()
            settings_obj = self.seed_medical_settings(company, branch)

            categories = self.seed_categories(company)
            items = self.seed_services(company, categories)

            department = self.seed_department(company)
            self.seed_department_links(company, branch, department, specialty)
            clinics = self.seed_clinics(company, branch, department, specialty)

            practitioners = self.seed_practitioners(
                company=company,
                branch=branch,
                department=department,
                specialty=specialty,
                clinics=clinics,
            )

            offerings = self.seed_offerings(
                company=company,
                branch=branch,
                department=department,
                specialty=specialty,
                clinics=clinics,
                items=items,
            )

            self.seed_practitioner_services(
                company=company,
                practitioners=practitioners,
                offerings=offerings,
            )
            self.seed_schedules(company, practitioners)

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("===== MARILYN REAL DATA SEED ====="))
        self.stdout.write(f"MODE={'DRY-RUN' if dry_run else 'APPLY'}")
        self.stdout.write(f"CREATED={self.created}")
        self.stdout.write(f"UPDATED_OR_EXISTING={self.updated}")
        self.stdout.write(f"COMPANY={COMPANY_CODE}")
        self.stdout.write(f"BRANCH={BRANCH_CODE}")
        self.stdout.write(f"SERVICES={len(SERVICES)}")
        self.stdout.write(f"PRACTITIONERS={len(PRACTITIONERS)}")
        self.stdout.write("RESULT=PASS")
        if dry_run:
            self.stdout.write(self.style.WARNING("DATABASE_CHANGES=ROLLED_BACK"))
        else:
            self.stdout.write(self.style.SUCCESS("DATABASE_CHANGES=COMMITTED"))

    def record(self, created: bool):
        if created:
            self.created += 1
        else:
            self.updated += 1

    def uoc(self, model, defaults=None, **lookup):
        obj, created = model.objects.update_or_create(defaults=defaults or {}, **lookup)
        self.record(created)
        return obj


    def upsert_catalog_item(self, *, company, row, defaults):
        target_code = str(row["code"]).strip()
        target_name = str(
            defaults.get("name")
            or row.get("name_ar")
            or row.get("name_en")
            or target_code
        ).strip()

        obj = CatalogItem.objects.filter(
            company=company,
            code=target_code,
        ).first()

        if obj is None and target_name:
            obj = CatalogItem.objects.filter(
                company=company,
                name=target_name,
            ).first()

        if obj is None:
            target_name_ar = str(row.get("name_ar") or "").strip()
            if target_name_ar:
                obj = CatalogItem.objects.filter(
                    company=company,
                    name_ar=target_name_ar,
                ).order_by("id").first()

        if obj is None:
            obj = CatalogItem(
                company=company,
                code=target_code,
                **defaults,
            )
            obj.full_clean()
            obj.save()
            self.record(True)
            return obj

        code_conflict = CatalogItem.objects.filter(
            company=company,
            code=target_code,
        ).exclude(pk=obj.pk).first()

        if code_conflict:
            raise RuntimeError(
                f"Catalog code conflict: {target_code} "
                f"belongs to item {code_conflict.pk}"
            )

        name_conflict = CatalogItem.objects.filter(
            company=company,
            name=target_name,
        ).exclude(pk=obj.pk).first()

        if name_conflict:
            raise RuntimeError(
                f"Catalog name conflict: {target_name} "
                f"belongs to item {name_conflict.pk}"
            )

        obj.code = target_code

        for field_name, value in defaults.items():
            setattr(obj, field_name, value)

        obj.full_clean()
        obj.save()
        self.record(False)
        return obj

    def seed_company(self):
        company = Company.objects.filter(company_code=COMPANY_CODE).first()
        if not company:
            raise RuntimeError(
                f"Expected production company {COMPANY_CODE} to exist. "
                "This command will not create a new tenant automatically."
            )

        company.name = "Marilyn Clinics"
        company.name_ar = "عيادات مارلين"
        company.name_en = "Marilyn Clinics"
        company.activity_profile = "MEDICAL"
        company.status = "ACTIVE"
        company.is_active = True
        company.email = "info@marilynclinics.com"
        company.phone = "0115444888"
        company.mobile = "0539676122"
        company.whatsapp_number = "+966115444888"
        company.country = "Saudi Arabia"
        company.street_name = "طريق الملك عبدالله"
        company.district = "حي القدس"
        company.city = "الرياض"
        company.region = "منطقة الرياض"
        company.postal_code = "13214"
        company.short_address = "RFQA3767"
        company.address = "طريق الملك عبدالله، حي القدس، الرياض 13214، المملكة العربية السعودية"
        company.currency_code = "SAR"
        company.vat_percentage = Decimal("15.00")
        company.extra_data = {
            **(company.extra_data or {}),
            "public_profile": {
                "brand_name_ar": "عيادات مارلين للتجميل",
                "brand_name_en": "Marilyn Clinics",
                "primary_email": "info@marilynclinics.com",
                "website_current": SOURCE_SITE,
                "public_landline": "0115444888",
                "public_mobile": "0539676122",
                "public_website_email": "marilyncl183@gmail.com",
                "experience_since": 1988,
                "specialization_ar": "الجلدية والتجميل والليزر",
                "location": {
                    "country": "Saudi Arabia",
                    "region": "Riyadh",
                    "city": "Riyadh",
                    "district": "Al Quds",
                    "street": "King Abdullah Road",
                    "postal_code": "13214",
                    "short_address": "RFQA3767",
                    "latitude": 24.7660356,
                    "longitude": 46.7560932,
                },
                "data_provenance": provenance(
                    source="LOCAL_APPROVED_DATA + PUBLIC_WEBSITE",
                    confidence="mixed_verified_and_development",
                ),
            },
        }
        company.save()
        self.updated += 1
        return company

    def seed_branch(self, company):
        branch = Branch.objects.filter(company=company, branch_code=BRANCH_CODE).first()
        if not branch:
            raise RuntimeError(
                f"Expected branch {BRANCH_CODE} to exist for {COMPANY_CODE}. "
                "This command will not create a duplicate branch."
            )

        branch.name = "Marilyn Clinics - Al Quds Branch"
        branch.name_ar = "عيادات مارلين - فرع القدس"
        branch.name_en = "Marilyn Clinics - Al Quds Branch"
        branch.branch_type = "BRANCH"
        branch.status = "ACTIVE"
        branch.is_active = True
        branch.is_default = True
        branch.email = "info@marilynclinics.com"
        branch.phone = "0115444888"
        branch.mobile = "0539676122"
        branch.whatsapp_number = "+966115444888"
        branch.country = "Saudi Arabia"
        branch.street_name = "طريق الملك عبدالله"
        branch.district = "حي القدس"
        branch.city = "الرياض"
        branch.region = "منطقة الرياض"
        branch.postal_code = "13214"
        branch.short_address = "RFQA3767"
        branch.address = "طريق الملك عبدالله، حي القدس، الرياض 13214، المملكة العربية السعودية"
        branch.latitude = Decimal("24.7660356")
        branch.longitude = Decimal("46.7560932")
        branch.extra_data = {
            **(branch.extra_data or {}),
            "public_profile": {
                "display_name_ar": "عيادات مارلين - فرع القدس",
                "display_name_en": "Marilyn Clinics - Al Quds Branch",
                "online_booking_visible": True,
                "opening_hours_verified": False,
                "opening_hours_source_type": "DEVELOPMENT_DEFAULT",
                "weekly_opening_hours": {
                    "monday": [{"start": "12:00", "end": "22:00"}],
                    "tuesday": [{"start": "12:00", "end": "22:00"}],
                    "wednesday": [{"start": "12:00", "end": "22:00"}],
                    "thursday": [{"start": "12:00", "end": "20:00"}],
                    "friday": [],
                    "saturday": [{"start": "12:00", "end": "23:59"}],
                    "sunday": [
                        {"start": "00:00", "end": "10:00"},
                        {"start": "12:00", "end": "22:00"},
                    ],
                },
                "data_provenance": provenance(
                    source="LOCAL_APPROVED_DATA",
                    confidence="development_reference",
                ),
            },
        }
        branch.save()
        self.updated += 1
        return branch

    def get_dermatology_specialty(self):
        specialty = MedicalSpecialty.objects.filter(
            company__isnull=True,
            code=DERMATOLOGY_CODE,
            is_active=True,
        ).first()
        if not specialty:
            raise RuntimeError("System specialty DERMATOLOGY is missing.")
        return specialty

    def seed_medical_settings(self, company, branch):
        return self.uoc(
            MedicalSettings,
            company=company,
            defaults={
                "patient_number_prefix": "PAT",
                "practitioner_number_prefix": "PRC",
                "default_appointment_duration": 30,
                "default_registration_branch": branch,
                "require_patient_identifier": False,
                "allow_duplicate_patient_override": False,
                "extra_data": provenance(
                    source="DEVELOPMENT_DEFAULT",
                    confidence="curated",
                ),
            },
        )

    def seed_categories(self, company):
        result = {}
        for row in CATEGORIES:
            extra = provenance(source=SOURCE_SITE, confidence="verified_category")
            obj = self.uoc(
                CatalogCategory,
                company=company,
                code=row["code"],
                defaults={
                    "parent": None,
                    "status": "ACTIVE",
                    "name": row["name"],
                    "name_ar": row["name_ar"],
                    "name_en": row["name_en"],
                    "description": row["description"],
                    "sort_order": row["sort_order"],
                    "notes": "",
                    "extra_data": extra,
                },
            )
            obj.full_clean()
            obj.save()
            result[row["code"]] = obj
        return result

    def seed_services(self, company, categories):
        items = {}
        for index, row in enumerate(SERVICES, start=1):
            extra = provenance(
                source=SOURCE_SITE,
                confidence="verified_name_and_current_price",
                old_price=row.get("old_price"),
                promotion_detected=bool(row.get("old_price")),
                duration_source="DEVELOPMENT_DEFAULT",
            )
            obj = self.upsert_catalog_item(
                company=company,
                row=row,
                defaults={
                    "category": categories[row["category"]],
                    "unit": None,
                    "item_type": "SERVICE",
                    "status": "ACTIVE",
                    "sku": "",
                    "barcode": "",
                    "name": row.get("internal_name", row["name_ar"]),
                    "name_ar": row["name_ar"],
                    "name_en": row["name_en"],
                    "description": (
                        "خدمة تجميلية/طبية ضمن نطاق عيادات مارلين. "
                        "يتم تحديد الملاءمة النهائية بعد التقييم السريري."
                    ),
                    "sale_price": Decimal(row["price"]),
                    "purchase_price": Decimal("0.00"),
                    "cost_price": Decimal("0.00"),
                    "is_sellable": True,
                    "is_purchasable": False,
                    "track_inventory": False,
                    "inventory_tracking_method": "NONE",
                    "track_expiry_dates": False,
                    "taxable": True,
                    "tax_rate": Decimal("15.00"),
                    "sort_order": index * 10,
                    "notes": "",
                    "extra_data": extra,
                },
            )
            obj.full_clean()
            obj.save()
            items[row["code"]] = obj
        return items

    def seed_department(self, company):
        return self.uoc(
            MedicalDepartment,
            company=company,
            code=DEPARTMENT_CODE,
            defaults={
                "parent": None,
                "name_ar": "قسم الجلدية والتجميل والليزر",
                "name_en": "Dermatology, Aesthetics & Laser Department",
                "description": (
                    "القسم التشغيلي لخدمات الجلدية والتجميل غير الجراحي "
                    "والعناية بالبشرة والشعر والليزر."
                ),
                "cost_center": None,
                "manager_membership": None,
                "sort_order": 10,
                "is_active": True,
                "extra_data": provenance(
                    source=SOURCE_SITE,
                    confidence="curated_from_public_scope",
                ),
            },
        )

    def seed_department_links(self, company, branch, department, specialty):
        self.uoc(
            MedicalDepartmentBranch,
            department=department,
            branch=branch,
            defaults={
                "company": company,
                "manager_membership": None,
                "is_primary": True,
                "is_active": True,
                "opening_time": time(12, 0),
                "closing_time": time(22, 0),
                "extra_data": provenance(
                    source="DEVELOPMENT_DEFAULT",
                    confidence="curated",
                ),
            },
        )
        self.uoc(
            MedicalDepartmentSpecialty,
            department=department,
            specialty=specialty,
            defaults={
                "company": company,
                "is_primary": True,
                "is_active": True,
                "extra_data": provenance(
                    source=SOURCE_SITE,
                    confidence="verified_scope",
                ),
            },
        )

    def seed_clinics(self, company, branch, department, specialty):
        clinics = {}
        clinic_rows = [
            {
                "key": "DERM",
                "code": "DERM-AESTHETICS-CLINIC",
                "name_ar": "عيادة الجلدية والتجميل",
                "name_en": "Dermatology & Aesthetics Clinic",
                "room": "D-01",
                "floor": "1",
                "default": True,
            },
            {
                "key": "LASER",
                "code": "LASER-CLINIC",
                "name_ar": "عيادة الليزر",
                "name_en": "Laser Clinic",
                "room": "L-01",
                "floor": "1",
                "default": False,
            },
        ]

        for row in clinic_rows:
            clinic = self.uoc(
                MedicalClinic,
                company=company,
                code=row["code"],
                defaults={
                    "branch": branch,
                    "department": department,
                    "name_ar": row["name_ar"],
                    "name_en": row["name_en"],
                    "room_number": row["room"],
                    "floor": row["floor"],
                    "capacity": 1,
                    "opening_time": time(12, 0),
                    "closing_time": time(22, 0),
                    "is_default": row["default"],
                    "is_active": True,
                    "description": (
                        "عيادة تشغيلية ضمن قسم الجلدية والتجميل والليزر."
                    ),
                    "extra_data": provenance(
                        source="LOCAL_APPROVED_DATA + DEVELOPMENT_DEFAULT",
                        confidence="mixed",
                    ),
                },
            )
            self.uoc(
                MedicalClinicSpecialty,
                clinic=clinic,
                specialty=specialty,
                defaults={
                    "company": company,
                    "is_primary": True,
                    "is_active": True,
                    "extra_data": provenance(
                        source="DEVELOPMENT_DEFAULT",
                        confidence="curated",
                    ),
                },
            )
            clinics[row["key"]] = clinic
        return clinics

    def seed_practitioners(self, *, company, branch, department, specialty, clinics):
        result = {}

        for index, row in enumerate(PRACTITIONERS):
            default_clinic = clinics["DERM"]
            practitioner = self.uoc(
                MedicalPractitioner,
                company=company,
                practitioner_number=row["number"],
                defaults={
                    "membership": None,
                    "employee": None,
                    "full_name_ar": row["name_ar"],
                    "full_name_en": row["name_en"],
                    "professional_title": row["title"],
                    "practitioner_type": "PHYSICIAN",
                    "gender": row["gender"],
                    "nationality": "",
                    "mobile": "",
                    "email": "",
                    "primary_specialty": specialty,
                    "default_branch": branch,
                    "default_department": department,
                    "default_clinic": default_clinic,
                    "hire_date": date(2026, 1, 1),
                    "status": "ACTIVE",
                    "is_accepting_appointments": True,
                    "notes": "",
                    "extra_data": provenance(
                        source=SOURCE_SITE,
                        confidence="verified_identity_development_admin_fields",
                        public_bio=row["source_note"],
                    ),
                },
            )

            self.uoc(
                MedicalPractitionerSpecialty,
                practitioner=practitioner,
                specialty=specialty,
                defaults={
                    "company": company,
                    "is_primary": True,
                    "is_active": True,
                    "years_experience": row["years_experience"],
                    "valid_from": date(2026, 1, 1),
                    "valid_until": None,
                    "notes": "Development profile; years can be corrected later.",
                    "extra_data": provenance(
                        source=SOURCE_SITE,
                        confidence="mixed_verified_and_development",
                    ),
                },
            )

            assignment = self.uoc(
                MedicalPractitionerAssignment,
                practitioner=practitioner,
                is_primary=True,
                defaults={
                    "company": company,
                    "branch": branch,
                    "clinic": default_clinic,
                    "department": department,
                    "is_active": True,
                    "start_date": date(2026, 1, 1),
                    "end_date": None,
                    "working_hours": {},
                    "notes": "",
                    "extra_data": provenance(
                        source="DEVELOPMENT_DEFAULT",
                        confidence="curated",
                    ),
                },
            )

            self.uoc(
                MedicalPractitionerLicense,
                company=company,
                license_number=row["license_number"],
                defaults={
                    "practitioner": practitioner,
                    "specialty": specialty,
                    "license_type": row["license_type"],
                    "issuing_authority": row["issuing_authority"],
                    "status": "ACTIVE",
                    "issued_at": row["issued_at"],
                    "expires_at": row["expires_at"],
                    "verified_at": row["verified_at"],
                    "document_reference": "",
                    "notes": (
                        "DEV PLACEHOLDER: replace with the official professional "
                        "license/classification number before production go-live."
                    ),
                    "extra_data": provenance(
                        source="DEVELOPMENT_PLACEHOLDER",
                        confidence="invented_for_development",
                    ),
                },
            )

            result[row["number"]] = {
                "practitioner": practitioner,
                "primary_assignment": assignment,
                "assignments": {"DERM": assignment},
            }

            # Yasmin's public bio explicitly references laser experience.
            # Create a second non-primary location assignment in the laser clinic.
            if row["number"] == "PRC-000002":
                laser_assignment = self.uoc(
                    MedicalPractitionerAssignment,
                    company=company,
                    practitioner=practitioner,
                    branch=branch,
                    clinic=clinics["LASER"],
                    defaults={
                        "department": department,
                        "is_primary": False,
                        "is_active": True,
                        "start_date": date(2026, 1, 1),
                        "end_date": None,
                        "working_hours": {},
                        "notes": "",
                        "extra_data": provenance(
                            source=SOURCE_SITE,
                            confidence="curated_from_public_bio",
                        ),
                    },
                )
                result[row["number"]]["assignments"]["LASER"] = laser_assignment

        return result

    def seed_offerings(self, *, company, branch, department, specialty, clinics, items):
        offerings = {}

        for row in SERVICES:
            clinic_key = "LASER" if row["category"] == "LASER" else "DERM"
            clinic = clinics[clinic_key]
            item = items[row["code"]]

            offering = self.uoc(
                MedicalServiceOffering,
                company=company,
                catalog_item=item,
                branch=branch,
                department=department,
                specialty=specialty,
                clinic=clinic,
                defaults={
                    "status": "ACTIVE",
                    "duration_minutes": row["duration"],
                    "buffer_before_minutes": 0,
                    "buffer_after_minutes": 10,
                    "sale_price_override": None,
                    "default_session_count": row.get("sessions", 1),
                    "online_booking_enabled": True,
                    "requires_approval": False,
                    "requires_preparation": False,
                    "preparation_instructions": "",
                    "notes": "",
                    "extra_data": provenance(
                        source=SOURCE_SITE,
                        confidence="verified_service_development_booking_rules",
                    ),
                },
            )
            offerings[row["code"]] = offering

        return offerings

    def seed_practitioner_services(self, *, company, practitioners, offerings):
        for code, offering in offerings.items():
            is_laser = code.startswith("LASER-")

            # Dr. Yasmin: skin/hair + laser based on public bio.
            yasmin_assignment = practitioners["PRC-000002"]["assignments"][
                "LASER" if is_laser else "DERM"
            ]
            self.uoc(
                MedicalPractitionerServiceAssignment,
                company=company,
                practitioner_assignment=yasmin_assignment,
                service_offering=offering,
                defaults={
                    "status": "ACTIVE",
                    "duration_override_minutes": None,
                    "online_booking_enabled": True,
                    "effective_from": date(2026, 8, 15),
                    "effective_until": None,
                    "notes": "",
                    "extra_data": provenance(
                        source=SOURCE_SITE,
                        confidence="curated_from_public_bio",
                    ),
                },
            )

            # Dr. Sara: dermatology/aesthetic and hair services.
            if not is_laser:
                sara_assignment = practitioners["PRC-000001"]["assignments"]["DERM"]
                self.uoc(
                    MedicalPractitionerServiceAssignment,
                    company=company,
                    practitioner_assignment=sara_assignment,
                    service_offering=offering,
                    defaults={
                        "status": "ACTIVE",
                        "duration_override_minutes": None,
                        "online_booking_enabled": True,
                        "effective_from": date(2026, 8, 15),
                        "effective_until": None,
                        "notes": "",
                        "extra_data": provenance(
                            source=SOURCE_SITE,
                            confidence="curated_from_public_role",
                        ),
                    },
                )

    def seed_schedules(self, company, practitioners):
        # Development schedule: Sat-Thu 12:00-20:00, Friday off.
        # Every active location assignment receives its own availability,
        # because booking validates against the exact practitioner assignment.
        weekdays = [0, 1, 2, 3, 5, 6]  # Mon-Thu, Sat, Sun

        seen_assignment_ids = set()
        for payload in practitioners.values():
            for assignment in payload["assignments"].values():
                if assignment.pk in seen_assignment_ids:
                    continue
                seen_assignment_ids.add(assignment.pk)

                for weekday in weekdays:
                    schedule = self.uoc(
                        MedicalPractitionerWeeklySchedule,
                        company=company,
                        practitioner_assignment=assignment,
                        weekday=weekday,
                        start_time=time(12, 0),
                        end_time=time(20, 0),
                        defaults={
                            "slot_interval_minutes": 15,
                            "effective_from": date(2026, 8, 15),
                            "effective_until": None,
                            "is_active": True,
                            "notes": (
                                "DEV schedule placeholder; replace with final practitioner schedule."
                            ),
                            "extra_data": provenance(
                                source="DEVELOPMENT_DEFAULT",
                                confidence="invented_for_development",
                            ),
                        },
                    )

                    self.uoc(
                        MedicalPractitionerScheduleBreak,
                        company=company,
                        weekly_schedule=schedule,
                        start_time=time(16, 0),
                        end_time=time(16, 30),
                        defaults={
                            "is_active": True,
                            "notes": "DEV break placeholder.",
                            "extra_data": provenance(
                                source="DEVELOPMENT_DEFAULT",
                                confidence="invented_for_development",
                            ),
                        },
                    )
