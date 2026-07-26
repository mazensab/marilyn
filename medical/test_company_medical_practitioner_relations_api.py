from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import (
    CompanyMembership,
    CompanyRole,
)
from medical.models import (
    MedicalPractitionerAssignment,
    MedicalPractitionerSpecialty,
    MedicalSpecialty,
)
from medical.test_company_medical_practitioner_api import (
    CompanyMedicalPractitionerAPITests,
)


User = get_user_model()


class CompanyMedicalPractitionerRelationsAPITests(
    CompanyMedicalPractitionerAPITests
):
    def setUp(self) -> None:
        super().setUp()

        self.second_specialty = (
            MedicalSpecialty.objects
            .filter(
                company__isnull=True,
                is_system=True,
            )
            .exclude(id=self.specialty.id)
            .order_by("id")
            .first()
        )

        self.assertIsNotNone(
            self.second_specialty
        )

    def specialty_url(
        self,
        practitioner_id: int,
    ) -> str:
        return (
            "/api/company/medical/practitioners/"
            f"{practitioner_id}/specialties/"
        )

    def assignment_url(
        self,
        practitioner_id: int,
    ) -> str:
        return (
            "/api/company/medical/practitioners/"
            f"{practitioner_id}/assignments/"
        )

    def test_specialty_list_is_company_scoped(
        self,
    ) -> None:
        own = (
            MedicalPractitionerSpecialty.objects
            .create(
                company=self.company_a,
                practitioner=self.practitioner_a,
                specialty=self.specialty,
                is_primary=True,
            )
        )

        MedicalPractitionerSpecialty.objects.create(
            company=self.company_b,
            practitioner=self.practitioner_b,
            specialty=self.specialty,
            is_primary=True,
        )

        response = self.client.get(
            self.specialty_url(
                self.practitioner_a.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            response.data["count"],
            1,
        )
        self.assertEqual(
            response.data["items"][0]["id"],
            own.id,
        )

    def test_specialty_create_sets_primary(
        self,
    ) -> None:
        response = self.client.post(
            self.specialty_url(
                self.practitioner_a.id
            ),
            {
                "company_id": self.company_b.id,
                "specialty_id": (
                    self.second_specialty.id
                ),
                "is_primary": True,
                "is_active": True,
                "years_experience": 6,
                "valid_from": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        self.practitioner_a.refresh_from_db()

        self.assertEqual(
            self.practitioner_a
            .primary_specialty_id,
            self.second_specialty.id,
        )

        item = (
            MedicalPractitionerSpecialty.objects
            .get(id=response.data["item"]["id"])
        )

        self.assertEqual(
            item.company_id,
            self.company_a.id,
        )
        self.assertTrue(item.is_primary)

    def test_foreign_practitioner_specialties_hidden(
        self,
    ) -> None:
        response = self.client.get(
            self.specialty_url(
                self.practitioner_b.id
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_assignment_create_sets_defaults(
        self,
    ) -> None:
        response = self.client.post(
            self.assignment_url(
                self.practitioner_a.id
            ),
            {
                "company_id": self.company_b.id,
                "branch_id": self.branch_a.id,
                "department_id": (
                    self.department_a.id
                ),
                "clinic_id": self.clinic_a.id,
                "is_primary": True,
                "is_active": True,
                "start_date": "2026-01-01",
                "working_hours": {
                    "sunday": {
                        "from": "09:00",
                        "to": "17:00",
                    }
                },
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        self.practitioner_a.refresh_from_db()

        self.assertEqual(
            self.practitioner_a
            .default_branch_id,
            self.branch_a.id,
        )
        self.assertEqual(
            self.practitioner_a
            .default_department_id,
            self.department_a.id,
        )
        self.assertEqual(
            self.practitioner_a
            .default_clinic_id,
            self.clinic_a.id,
        )

        item = (
            MedicalPractitionerAssignment.objects
            .get(id=response.data["item"]["id"])
        )

        self.assertEqual(
            item.company_id,
            self.company_a.id,
        )
        self.assertTrue(item.is_primary)

    def test_foreign_assignment_structure_rejected(
        self,
    ) -> None:
        response = self.client.post(
            self.assignment_url(
                self.practitioner_a.id
            ),
            {
                "branch_id": self.branch_b.id,
                "department_id": (
                    self.department_b.id
                ),
                "clinic_id": self.clinic_b.id,
                "is_primary": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_foreign_practitioner_assignments_hidden(
        self,
    ) -> None:
        response = self.client.get(
            self.assignment_url(
                self.practitioner_b.id
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_viewer_cannot_manage_relations(
        self,
    ) -> None:
        viewer = User.objects.create_user(
            username="relations_viewer",
            email="relations-viewer@example.com",
            password="StrongPass123!",
        )

        CompanyMembership.objects.create(
            user=viewer,
            company=self.company_a,
            role=CompanyRole.VIEWER,
            is_primary=True,
        )

        viewer_client = APIClient()
        viewer_client.force_authenticate(
            user=viewer
        )

        specialty_response = (
            viewer_client.post(
                self.specialty_url(
                    self.practitioner_a.id
                ),
                {
                    "specialty_id": (
                        self.second_specialty.id
                    )
                },
                format="json",
            )
        )

        assignment_response = (
            viewer_client.post(
                self.assignment_url(
                    self.practitioner_a.id
                ),
                {
                    "branch_id": (
                        self.branch_a.id
                    )
                },
                format="json",
            )
        )

        self.assertEqual(
            specialty_response.status_code,
            403,
        )
        self.assertEqual(
            assignment_response.status_code,
            403,
        )
