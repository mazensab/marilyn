from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve
from rest_framework.test import APIClient

from accounts.models import CompanyMembership, CompanyRole
from companies.models import Branch, Company
from medical.models import MedicalPatient, MedicalPatientStatus

from api.company.medical import patients


User = get_user_model()


def create_company(*, code: str, name: str) -> Company:
    fields = {field.name for field in Company._meta.fields}
    payload: dict[str, Any] = {}
    for field_name in ("company_code", "code"):
        if field_name in fields:
            payload[field_name] = code
    for field_name in ("name", "company_name", "display_name", "legal_name"):
        if field_name in fields:
            payload[field_name] = name
    for field_name in ("currency_code", "currency"):
        if field_name in fields:
            payload[field_name] = "SAR"
    if "is_active" in fields:
        payload["is_active"] = True
    return Company.objects.create(**payload)


def create_branch(*, company: Company, code: str, name: str) -> Branch:
    fields = {field.name for field in Branch._meta.fields}
    payload: dict[str, Any] = {"company": company}
    for field_name in ("branch_code", "code"):
        if field_name in fields:
            payload[field_name] = code
    for field_name in ("name", "branch_name", "display_name"):
        if field_name in fields:
            payload[field_name] = name
    if "is_active" in fields:
        payload["is_active"] = True
    if "status" in fields:
        payload["status"] = "ACTIVE"
    return Branch.objects.create(**payload)


class CompanyMedicalPatientAPITests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.company_a = create_company(code="PAT-A", name="Patient Company A")
        self.company_b = create_company(code="PAT-B", name="Patient Company B")
        self.branch_a = create_branch(
            company=self.company_a,
            code="PAT-A-MAIN",
            name="Patient Branch A",
        )
        self.branch_b = create_branch(
            company=self.company_b,
            code="PAT-B-MAIN",
            name="Patient Branch B",
        )
        self.owner = User.objects.create_user(
            username="patient_owner",
            email="patient-owner@example.com",
            password="StrongPass123!",
        )
        self.viewer = User.objects.create_user(
            username="patient_viewer",
            email="patient-viewer@example.com",
            password="StrongPass123!",
        )
        CompanyMembership.objects.create(
            user=self.owner,
            company=self.company_a,
            role=CompanyRole.OWNER,
            is_primary=True,
        )
        CompanyMembership.objects.create(
            user=self.viewer,
            company=self.company_a,
            role=CompanyRole.VIEWER,
            is_primary=True,
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="PAT-A-001",
            identifier_type="NATIONAL_ID",
            identifier_number="1000000001",
            full_name="Local Patient",
            gender="MALE",
            mobile="0550000001",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            registration_branch=self.branch_b,
            patient_number="PAT-B-001",
            identifier_type="NATIONAL_ID",
            identifier_number="2000000001",
            full_name="Foreign Patient",
            gender="FEMALE",
            mobile="0550000009",
        )
        self.client.force_authenticate(user=self.owner)

    def test_routes_use_expected_callbacks(
        self,
    ) -> None:
        collection = resolve(
            "/api/company/medical/patients/"
        )
        detail = resolve(
            "/api/company/medical/patients/1/"
        )
        status = resolve(
            "/api/company/medical/patients/1/status/"
        )
        self.assertIs(
            collection.func,
            patients.patient_collection,
        )
        self.assertIs(
            detail.func,
            patients.patient_detail,
        )
        self.assertIs(
            status.func,
            patients.patient_status,
        )
        self.assertEqual(
            collection.url_name,
            "patients-list-create",
        )
        self.assertEqual(
            detail.url_name,
            "patients-detail",
        )
        self.assertEqual(
            status.url_name,
            "patients-status",
        )
    def test_permission_contracts_are_declared(
        self,
    ) -> None:
        self.assertEqual(
            patients.VIEW_PERMISSION,
            "medical.view_medicalpatient",
        )
        self.assertEqual(
            patients.CREATE_PERMISSION,
            "medical.add_medicalpatient",
        )
        self.assertEqual(
            patients.UPDATE_PERMISSION,
            "medical.change_medicalpatient",
        )
        self.assertEqual(
            patients.STATUS_PERMISSION,
            patients.UPDATE_PERMISSION,
        )
        self.assertEqual(
            (
                patients.patient_collection
                .required_company_permissions
            ),
            patients.ALL_PERMISSIONS,
        )
        self.assertEqual(
            (
                patients.patient_detail
                .required_company_permissions
            ),
            [
                patients.VIEW_PERMISSION,
                patients.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            (
                patients.patient_status
                .required_company_permissions
            ),
            [patients.STATUS_PERMISSION],
        )
    def test_list_is_company_scoped(self) -> None:
        response = self.client.get("/api/company/medical/patients/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["items"][0]["id"], self.patient_a.id)

    def test_create_ignores_company_id(self) -> None:
        response = self.client.post(
            "/api/company/medical/patients/",
            {
                "company_id": self.company_b.id,
                "registration_branch_id": self.branch_a.id,
                "patient_number": "pat-a-002",
                "identifier_type": "NATIONAL_ID",
                "identifier_number": "1000000002",
                "full_name": "Created Patient",
                "gender": "FEMALE",
                "mobile": "0550000002",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        patient = MedicalPatient.objects.get(patient_number="PAT-A-002")
        self.assertEqual(patient.company_id, self.company_a.id)
        self.assertEqual(patient.registration_branch_id, self.branch_a.id)

    def test_create_generates_patient_number(self) -> None:
        response = self.client.post(
            "/api/company/medical/patients/",
            {"full_name": "Generated Number Patient"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["item"]["patient_number"])

    def test_foreign_branch_is_rejected(self) -> None:
        response = self.client.post(
            "/api/company/medical/patients/",
            {
                "patient_number": "PAT-A-003",
                "full_name": "Invalid Branch Patient",
                "registration_branch_id": self.branch_b.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400, response.data)

    def test_foreign_detail_is_hidden(self) -> None:
        response = self.client.get(
            f"/api/company/medical/patients/{self.patient_b.id}/"
        )
        self.assertEqual(response.status_code, 404)

    def test_search_and_filters(self) -> None:
        blocked = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="PAT-A-004",
            identifier_type="PASSPORT",
            identifier_number="PASS-0004",
            full_name="Searchable Patient",
            gender="FEMALE",
            mobile="0554444444",
            status=MedicalPatientStatus.BLOCKED,
        )
        search = self.client.get(
            "/api/company/medical/patients/?search=0554444444"
        )
        self.assertEqual(search.status_code, 200, search.data)
        self.assertEqual(search.data["items"][0]["id"], blocked.id)
        filtered = self.client.get(
            "/api/company/medical/patients/"
            "?status=BLOCKED&gender=FEMALE"
            "&identifier_type=PASSPORT"
            f"&registration_branch_id={self.branch_a.id}"
        )
        self.assertEqual(filtered.status_code, 200, filtered.data)
        self.assertEqual(filtered.data["count"], 1)
        self.assertEqual(filtered.data["items"][0]["id"], blocked.id)

    def test_update_ignores_company_id(self) -> None:
        response = self.client.patch(
            f"/api/company/medical/patients/{self.patient_a.id}/",
            {
                "company_id": self.company_b.id,
                "full_name": "Updated Patient",
                "registration_branch_id": self.branch_a.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.patient_a.refresh_from_db()
        self.assertEqual(self.patient_a.company_id, self.company_a.id)
        self.assertEqual(self.patient_a.full_name, "Updated Patient")

    def test_status_endpoint(self) -> None:
        response = self.client.post(
            f"/api/company/medical/patients/{self.patient_a.id}/status/",
            {"action": "block"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.patient_a.refresh_from_db()
        self.assertEqual(self.patient_a.status, MedicalPatientStatus.BLOCKED)

    def test_viewer_cannot_manage_patients(self) -> None:
        self.client.force_authenticate(user=self.viewer)
        create_response = self.client.post(
            "/api/company/medical/patients/",
            {"patient_number": "PAT-A-006", "full_name": "Viewer Patient"},
            format="json",
        )
        update_response = self.client.patch(
            f"/api/company/medical/patients/{self.patient_a.id}/",
            {"full_name": "Unauthorized Update"},
            format="json",
        )
        status_response = self.client.post(
            f"/api/company/medical/patients/{self.patient_a.id}/status/",
            {"status": "BLOCKED"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 403, create_response.data)
        self.assertEqual(update_response.status_code, 403, update_response.data)
        self.assertEqual(status_response.status_code, 403, status_response.data)
