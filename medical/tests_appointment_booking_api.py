
from __future__ import annotations
from datetime import (
    datetime,
    time,
    timedelta,
)
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import resolve
from django.utils import timezone
from rest_framework.test import (
    APIRequestFactory,
    force_authenticate,
)
from django.test import TestCase
from api.company.medical import appointments
from medical.models import (
    MedicalAppointment,
    MedicalPatient,
)
class CompanyAppointmentBookingApiTests(
    TestCase
):
    def setUp(self):
        from medical.tests_practitioner_availability import (
            PractitionerAvailabilityCombinedTests,
        )
        PractitionerAvailabilityCombinedTests.setUp(
            self
        )
        self.patient_a = MedicalPatient.objects.create(
            company=self.company_a,
            registration_branch=self.branch_a,
            patient_number="API-BOOK-PAT-A",
            full_name="API Booking Patient A",
        )
        self.patient_b = MedicalPatient.objects.create(
            company=self.company_b,
            registration_branch=self.branch_b,
            patient_number="API-BOOK-PAT-B",
            full_name="API Booking Patient B",
        )
        self.user = (
            get_user_model()
            .objects
            .create_user(
                username="appointment-api-user",
                password="test-password",
            )
        )
        self.factory = APIRequestFactory()
        self.sequence = 0
    def aware(
        self,
        hour: int,
        minute: int = 0,
    ):
        value = datetime.combine(
            self.target_date,
            time(hour, minute),
        )
        return timezone.make_aware(
            value,
            timezone.get_current_timezone(),
        )
    def payload(
        self,
        *,
        start=None,
    ):
        return {
            "patient_id": self.patient_a.id,
            (
                "practitioner_service_"
                "assignment_id"
            ): self.link_a.id,
            "scheduled_start": (
                start or self.aware(9)
            ).isoformat(),
        }
    def invoke(
        self,
        view,
        request,
        *args,
    ):
        force_authenticate(
            request,
            user=self.user,
        )
        view_class = view.cls
        original_permissions = (
            view_class.permission_classes
        )
        view_class.permission_classes = []
        try:
            with patch.object(
                appointments,
                "company_or_error",
                return_value=(
                    self.company_a,
                    None,
                ),
            ), patch.object(
                appointments,
                "ensure_permission",
                return_value=None,
            ):
                return view(
                    request,
                    *args,
                )
        finally:
            view_class.permission_classes = (
                original_permissions
            )
    def post(self, payload):
        request = self.factory.post(
            (
                "/api/company/medical/"
                "appointments/"
            ),
            payload,
            format="json",
        )
        return self.invoke(
            appointments.appointment_collection,
            request,
        )
    def patch_item(
        self,
        appointment_id,
        payload,
    ):
        request = self.factory.patch(
            (
                "/api/company/medical/"
                f"appointments/{appointment_id}/"
            ),
            payload,
            format="json",
        )
        return self.invoke(
            appointments.appointment_detail,
            request,
            appointment_id,
        )
    def get_collection(self, query):
        request = self.factory.get(
            (
                "/api/company/medical/"
                "appointments/"
            ),
            query,
        )
        return self.invoke(
            appointments.appointment_collection,
            request,
        )
    def get_detail(self, appointment_id):
        request = self.factory.get(
            (
                "/api/company/medical/"
                f"appointments/{appointment_id}/"
            )
        )
        return self.invoke(
            appointments.appointment_detail,
            request,
            appointment_id,
        )
    def create_legacy(
        self,
        *,
        number,
        start,
    ):
        return MedicalAppointment.objects.create(
            company=self.company_a,
            patient=self.patient_a,
            practitioner=self.practitioner_a,
            branch=self.branch_a,
            department=self.department_a,
            clinic=self.clinic_a,
            appointment_number=number,
            scheduled_start=start,
            scheduled_end=(
                start
                + timedelta(minutes=30)
            ),
            source="LEGACY",
        )
    def test_existing_routes_are_preserved(self):
        routes = {
            (
                "/api/company/medical/"
                "appointments/"
            ): (
                appointments
                .appointment_collection
            ),
            (
                "/api/company/medical/"
                "appointments/1/"
            ): appointments.appointment_detail,
            (
                "/api/company/medical/"
                "appointments/1/status/"
            ): appointments.appointment_status,
        }
        for path, callback in routes.items():
            self.assertIs(
                resolve(path).func,
                callback,
            )
    def test_minimal_service_booking_creates(
        self,
    ):
        response = self.post(
            self.payload()
        )
        self.assertEqual(
            response.status_code,
            201,
        )
        item = MedicalAppointment.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertEqual(
            item.practitioner_assignment_id,
            self.assignment_a.id,
        )
        self.assertEqual(
            (
                item
                .practitioner_service_assignment_id
            ),
            self.link_a.id,
        )
        self.assertEqual(
            item.practitioner_id,
            self.practitioner_a.id,
        )
        self.assertEqual(
            item.branch_id,
            self.branch_a.id,
        )
        self.assertEqual(
            item.clinic_id,
            self.clinic_a.id,
        )
    def test_scheduled_end_is_derived(self):
        start = self.aware(9)
        response = self.post(
            self.payload(start=start)
        )
        self.assertEqual(
            response.status_code,
            201,
        )
        item = MedicalAppointment.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertEqual(
            item.scheduled_end,
            (
                start
                + timedelta(
                    minutes=(
                        self.link_a
                        .total_slot_minutes
                    )
                )
            ),
        )
    def test_client_derived_values_are_ignored(
        self,
    ):
        payload = self.payload()
        payload.update(
            {
                "scheduled_end": (
                    self.aware(16).isoformat()
                ),
                "practitioner_name_snapshot": (
                    "Client Practitioner"
                ),
                "service_name_snapshot": (
                    "Client Service"
                ),
                "price_snapshot": "99999.00",
            }
        )
        response = self.post(payload)
        self.assertEqual(
            response.status_code,
            201,
        )
        item = MedicalAppointment.objects.get(
            id=response.data["item"]["id"]
        )
        self.assertNotEqual(
            item.practitioner_name_snapshot,
            "Client Practitioner",
        )
        self.assertNotEqual(
            item.service_name_snapshot,
            "Client Service",
        )
        self.assertNotEqual(
            str(item.price_snapshot),
            "99999.00",
        )
        self.assertNotEqual(
            item.scheduled_end,
            self.aware(16),
        )
    def test_response_contains_booking_fields(
        self,
    ):
        response = self.post(
            self.payload()
        )
        item = response.data["item"]
        self.assertEqual(
            item["practitioner_assignment_id"],
            self.assignment_a.id,
        )
        self.assertEqual(
            (
                item[
                    "practitioner_service_"
                    "assignment_id"
                ]
            ),
            self.link_a.id,
        )
        self.assertEqual(
            item["service_offering_id"],
            self.link_a.service_offering_id,
        )
        self.assertEqual(
            item["total_slot_minutes"],
            self.link_a.total_slot_minutes,
        )
        self.assertEqual(
            item["booking_mode"],
            "SERVICE_ASSIGNMENT",
        )
    def test_manual_booking_requires_end(self):
        response = self.post(
            {
                "patient_id": self.patient_a.id,
                "scheduled_start": (
                    self.aware(9).isoformat()
                ),
            }
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "scheduled_end",
            response.data["errors"],
        )
    def test_assignment_only_requires_end(self):
        response = self.post(
            {
                "patient_id": self.patient_a.id,
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "scheduled_start": (
                    self.aware(9).isoformat()
                ),
            }
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "scheduled_end",
            response.data["errors"],
        )
    def test_assignment_only_booking_derives_location(
        self,
    ):
        response = self.post(
            {
                "patient_id": self.patient_a.id,
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "scheduled_start": (
                    self.aware(10).isoformat()
                ),
                "scheduled_end": (
                    self.aware(10, 30).isoformat()
                ),
            }
        )
        self.assertEqual(
            response.status_code,
            201,
        )
        item = response.data["item"]
        self.assertEqual(
            item["practitioner_id"],
            self.practitioner_a.id,
        )
        self.assertEqual(
            item["branch_id"],
            self.branch_a.id,
        )
        self.assertEqual(
            item["booking_mode"],
            "PRACTITIONER_ASSIGNMENT",
        )
    def test_foreign_service_assignment_rejected(
        self,
    ):
        payload = self.payload()
        payload[
            "practitioner_service_assignment_id"
        ] = self.link_b.id
        response = self.post(payload)
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "practitioner_service_assignment_id",
            response.data["errors"],
        )
    def test_invalid_service_assignment_rejected(
        self,
    ):
        payload = self.payload()
        payload[
            "practitioner_service_assignment_id"
        ] = 999999999
        response = self.post(payload)
        self.assertEqual(
            response.status_code,
            400,
        )
    def test_unavailable_slot_rejected(self):
        response = self.post(
            self.payload(
                start=self.aware(8)
            )
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "scheduled_start",
            response.data["errors"],
        )
    def test_conflicting_slot_rejected(self):
        first = self.post(
            self.payload(
                start=self.aware(9)
            )
        )
        self.assertEqual(
            first.status_code,
            201,
        )
        second = self.post(
            self.payload(
                start=self.aware(9, 15)
            )
        )
        self.assertEqual(
            second.status_code,
            400,
        )
        self.assertIn(
            "scheduled_start",
            second.data["errors"],
        )
    def test_patch_start_recalculates_end(
        self,
    ):
        created = self.post(
            self.payload(
                start=self.aware(9)
            )
        )
        appointment_id = (
            created.data["item"]["id"]
        )
        response = self.patch_item(
            appointment_id,
            {
                "scheduled_start": (
                    self.aware(10).isoformat()
                )
            },
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        item = MedicalAppointment.objects.get(
            id=appointment_id
        )
        self.assertEqual(
            item.scheduled_end,
            (
                self.aware(10)
                + timedelta(
                    minutes=(
                        self.link_a
                        .total_slot_minutes
                    )
                )
            ),
        )
    def test_collection_filters_new_relations(
        self,
    ):
        created = self.post(
            self.payload()
        )
        self.assertEqual(
            created.status_code,
            201,
        )
        self.create_legacy(
            number="API-FILTER-LEGACY",
            start=self.aware(14),
        )
        by_assignment = self.get_collection(
            {
                "practitioner_assignment_id": (
                    self.assignment_a.id
                )
            }
        )
        self.assertEqual(
            by_assignment.status_code,
            200,
        )
        self.assertEqual(
            by_assignment.data["count"],
            1,
        )
        by_service = self.get_collection(
            {
                (
                    "practitioner_service_"
                    "assignment_id"
                ): self.link_a.id
            }
        )
        self.assertEqual(
            by_service.status_code,
            200,
        )
        self.assertEqual(
            by_service.data["count"],
            1,
        )
    def test_legacy_serialization_has_null_relations(
        self,
    ):
        legacy = self.create_legacy(
            number="API-LEGACY-SERIALIZE",
            start=self.aware(14),
        )
        response = self.get_detail(
            legacy.id
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        item = response.data["item"]
        self.assertIsNone(
            item["practitioner_assignment_id"]
        )
        self.assertIsNone(
            (
                item[
                    "practitioner_service_"
                    "assignment_id"
                ]
            )
        )
        self.assertIsNone(
            item["service_offering_id"]
        )
        self.assertIsNone(
            item["total_slot_minutes"]
        )
        self.assertEqual(
            item["booking_mode"],
            "MANUAL",
        )
