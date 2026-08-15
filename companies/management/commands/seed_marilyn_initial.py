from __future__ import annotations

import os

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.test import Client
from django.utils import timezone


def has_field(model, field_name: str) -> bool:
    try:
        model._meta.get_field(field_name)
        return True
    except Exception:
        return False


def set_existing(instance, values: dict) -> list[str]:
    changed: list[str] = []

    for field_name, value in values.items():
        if not has_field(instance.__class__, field_name):
            continue

        if getattr(instance, field_name) != value:
            setattr(instance, field_name, value)
            changed.append(field_name)

    return changed


def choice_value(model, field_name: str, preferred: list[str], fallback=None):
    if not has_field(model, field_name):
        return fallback

    field = model._meta.get_field(field_name)
    values = [str(value) for value, _label in field.choices]

    for candidate in preferred:
        if candidate in values:
            return candidate

    if fallback in values:
        return fallback

    return values[0] if values else fallback


def find_branch_model(company_model):
    candidates = []

    for model in apps.get_models():
        if "branch" not in model._meta.model_name.lower():
            continue

        company_fields = [
            field
            for field in model._meta.fields
            if getattr(field.remote_field, "model", None) is company_model
        ]

        if company_fields:
            candidates.append((model, company_fields[0].name))

    if not candidates:
        raise CommandError("No branch model linked directly to Company was found.")

    candidates.sort(
        key=lambda item: (
            item[0]._meta.model_name not in {"branch", "companybranch"},
            item[0]._meta.label_lower,
        )
    )

    return candidates[0]


def validate_required_fields(instance) -> None:
    missing = []

    for field in instance._meta.concrete_fields:
        if field.primary_key or field.auto_created:
            continue

        if getattr(field, "auto_now", False) or getattr(field, "auto_now_add", False):
            continue

        if field.has_default() or field.null:
            continue

        value = getattr(instance, field.attname)

        if value is None:
            missing.append(field.name)
            continue

        if isinstance(value, str) and not value and not field.blank:
            missing.append(field.name)

    if missing:
        raise CommandError(
            f"{instance._meta.label} has unsupported required fields: "
            + ", ".join(sorted(missing))
        )


class Command(BaseCommand):
    help = (
        "Create the initial Marilyn Clinics organization, medical activity "
        "profile, main branch, and system administrator membership."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=os.environ.get("MARILYN_ADMIN_USERNAME", "admin"),
        )
        parser.add_argument(
            "--email",
            default=os.environ.get("MARILYN_ADMIN_EMAIL", "info@marilynclinics.com"),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        username = str(options["username"]).strip()
        email = str(options["email"]).strip()

        if not username:
            raise CommandError("Administrator username cannot be empty.")

        if not email:
            raise CommandError("Administrator email cannot be empty.")

        User = get_user_model()
        Company = apps.get_model("companies", "Company")
        ActivityProfile = apps.get_model("companies", "ActivityProfile")
        UserProfile = apps.get_model("accounts", "UserProfile")
        CompanyMembership = apps.get_model("accounts", "CompanyMembership")

        admin = User.objects.filter(username=username).first()
        admin_created = admin is None

        if admin_created:
            admin_password = os.environ.get("MARILYN_ADMIN_PASSWORD", "")

            if not admin_password:
                raise CommandError(
                    "MARILYN_ADMIN_PASSWORD is required when creating the "
                    "initial administrator."
                )

            if len(admin_password) < 12:
                raise CommandError(
                    "MARILYN_ADMIN_PASSWORD must contain at least 12 characters."
                )

            admin = User.objects.create_superuser(
                username=username,
                email=email,
                password=admin_password,
            )
        else:
            # Existing credentials are intentionally preserved. Re-running the
            # bootstrap must never rotate an administrator password implicitly.
            admin_values = {
                "email": admin.email or email,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            }

            admin_changed = []

            for field_name, value in admin_values.items():
                if getattr(admin, field_name) != value:
                    setattr(admin, field_name, value)
                    admin_changed.append(field_name)

            if admin_changed:
                admin.save(update_fields=admin_changed)

        activity_defaults = {
            "name": "Clinics and Medical Centers",
            "name_ar": "العيادات والمراكز الطبية",
            "name_en": "Clinics and Medical Centers",
            "display_name": "Clinics and Medical Centers",
            "description": (
                "Platform activity profile for clinics, medical centers, "
                "patients, appointments, practitioners, billing, and branches."
            ),
            "activity_type": "MEDICAL",
            "business_type": "SERVICES",
            "sector": "HEALTHCARE",
            "is_system": True,
            "is_active": True,
            "status": choice_value(
                ActivityProfile,
                "status",
                ["ACTIVE", "ENABLED"],
                "ACTIVE",
            ),
        }

        activity_profile, activity_created = ActivityProfile.objects.get_or_create(
            code="MEDICAL",
            defaults={
                key: value
                for key, value in activity_defaults.items()
                if has_field(ActivityProfile, key)
            },
        )

        set_existing(activity_profile, activity_defaults)
        validate_required_fields(activity_profile)
        activity_profile.save()

        company = (
            Company.objects.filter(name_en__iexact="Marilyn Clinics").first()
            if has_field(Company, "name_en")
            else None
        )

        if company is None:
            company = Company.objects.filter(name__iexact="Marilyn Clinics").first()

        company_created = company is None

        if company is None:
            try:
                from api.system.companies.create import _generate_company_code

                company_code = _generate_company_code()
            except Exception:
                company_code = "CMP-MARILYN-000001"

            company = Company(company_code=company_code)

        company_values = {
            "name": "Marilyn Clinics",
            "name_ar": "عيادات مارلين",
            "name_en": "Marilyn Clinics",
            "activity_profile_ref": activity_profile,
            "activity_profile": choice_value(
                Company,
                "activity_profile",
                ["MEDICAL"],
                "MEDICAL",
            ),
            "status": choice_value(
                Company,
                "status",
                ["TRIAL", "ACTIVE"],
                "TRIAL",
            ),
            "is_active": True,
            "currency_code": "SAR",
            "country": "Saudi Arabia",
        }

        set_existing(company, company_values)
        validate_required_fields(company)
        company.save()

        Branch, company_field_name = find_branch_model(Company)

        branch_filters = {company_field_name: company}

        if has_field(Branch, "branch_code"):
            branch_filters["branch_code"] = "MARILYN-MAIN"
        elif has_field(Branch, "code"):
            branch_filters["code"] = "MARILYN-MAIN"
        elif has_field(Branch, "name_en"):
            branch_filters["name_en"] = "Marilyn Clinics Main Branch"
        else:
            branch_filters["name"] = "Marilyn Clinics Main Branch"

        branch, branch_created = Branch.objects.get_or_create(**branch_filters)

        branch_values = {
            company_field_name: company,
            "name": "Marilyn Clinics Main Branch",
            "name_ar": "عيادات مارلين - الفرع الرئيسي",
            "name_en": "Marilyn Clinics Main Branch",
            "branch_code": "MARILYN-MAIN",
            "code": "MARILYN-MAIN",
            "is_active": True,
            "is_main": True,
            "is_head_office": True,
            "status": choice_value(
                Branch,
                "status",
                ["ACTIVE", "ENABLED"],
                "ACTIVE",
            ),
        }

        set_existing(branch, branch_values)
        validate_required_fields(branch)
        branch.save()

        membership_role = choice_value(
            CompanyMembership,
            "role",
            ["OWNER", "ADMIN", "MANAGER"],
            "ADMIN",
        )
        membership_status = choice_value(
            CompanyMembership,
            "status",
            ["ACTIVE"],
            "ACTIVE",
        )

        CompanyMembership.objects.filter(
            user=admin,
            is_primary=True,
        ).exclude(company=company).update(is_primary=False)

        membership, membership_created = CompanyMembership.objects.get_or_create(
            user=admin,
            company=company,
            defaults={
                "role": membership_role,
                "status": membership_status,
                "is_primary": True,
            },
        )

        membership_values = {
            "role": membership_role,
            "status": membership_status,
            "is_primary": True,
            "job_title": "Platform and Clinic Administrator",
            "department": "Administration",
            "joined_at": membership.joined_at or timezone.now(),
            "created_by": admin,
            "updated_by": admin,
        }

        set_existing(membership, membership_values)
        membership.save()

        profile, profile_created = UserProfile.objects.get_or_create(user=admin)

        profile_values = {
            "default_company": company,
            "status": choice_value(
                UserProfile,
                "status",
                ["ACTIVE"],
                "ACTIVE",
            ),
            "default_workspace": choice_value(
                UserProfile,
                "default_workspace",
                ["SYSTEM"],
                "SYSTEM",
            ),
            "system_role": choice_value(
                UserProfile,
                "system_role",
                ["SUPER_ADMIN"],
                "SUPER_ADMIN",
            ),
            "is_system_user": True,
            "display_name": profile.display_name or "Marilyn Admin",
            "language": "ar",
            "timezone": "Asia/Riyadh",
        }

        set_existing(profile, profile_values)
        profile.save()
        profile.refresh_from_db()

        if not profile.can_access_system:
            raise CommandError("Admin still cannot access the system workspace.")

        if not profile.can_access_company:
            raise CommandError("Admin still cannot access the company workspace.")

        default_membership = profile.get_default_company_membership()

        if not default_membership or default_membership.company_id != company.id:
            raise CommandError("Default company membership resolution failed.")

        client = Client()
        client.force_login(admin)

        endpoints = [
            "/api/auth/whoami/",
            "/api/company/profile/",
            "/api/company/branches/",
        ]

        endpoint_results = {}
        use_secure_requests = bool(
            getattr(settings, "SECURE_SSL_REDIRECT", False)
        )

        for endpoint in endpoints:
            response = client.get(
                endpoint,
                HTTP_HOST="127.0.0.1",
                secure=use_secure_requests,
            )
            endpoint_results[endpoint] = response.status_code

            if response.status_code != 200:
                raise CommandError(
                    f"{endpoint} returned HTTP {response.status_code}."
                )

        self.stdout.write(self.style.SUCCESS("ITEM9_INITIAL_SETUP=1"))
        self.stdout.write(f"ACTIVITY_PROFILE_ID={activity_profile.id}")
        self.stdout.write(f"ACTIVITY_PROFILE_CREATED={int(activity_created)}")
        self.stdout.write(f"COMPANY_ID={company.id}")
        self.stdout.write(f"COMPANY_CODE={company.company_code}")
        self.stdout.write(f"COMPANY_CREATED={int(company_created)}")
        self.stdout.write(f"BRANCH_MODEL={Branch._meta.label}")
        self.stdout.write(f"BRANCH_ID={branch.id}")
        self.stdout.write(f"BRANCH_CREATED={int(branch_created)}")
        self.stdout.write(f"MEMBERSHIP_ID={membership.id}")
        self.stdout.write(f"MEMBERSHIP_ROLE={membership.role}")
        self.stdout.write(f"MEMBERSHIP_CREATED={int(membership_created)}")
        self.stdout.write(f"PROFILE_CREATED={int(profile_created)}")
        self.stdout.write(f"ADMIN_ID={admin.id}")
        self.stdout.write(f"ADMIN_USERNAME={admin.username}")
        self.stdout.write(f"ADMIN_CREATED={int(admin_created)}")
        self.stdout.write(f"ADMIN_ACTIVE={int(admin.is_active)}")
        self.stdout.write(f"ADMIN_STAFF={int(admin.is_staff)}")
        self.stdout.write(f"ADMIN_SUPERUSER={int(admin.is_superuser)}")
        self.stdout.write(f"PROFILE_WORKSPACE={profile.default_workspace}")
        self.stdout.write(f"PROFILE_SYSTEM_ROLE={profile.system_role}")
        self.stdout.write(f"PROFILE_SYSTEM_USER={int(profile.is_system_user)}")
        self.stdout.write(f"CAN_ACCESS_SYSTEM={int(profile.can_access_system)}")
        self.stdout.write(f"CAN_ACCESS_COMPANY={int(profile.can_access_company)}")

        for endpoint, status_code in endpoint_results.items():
            self.stdout.write(f"ENDPOINT={endpoint} STATUS={status_code}")
