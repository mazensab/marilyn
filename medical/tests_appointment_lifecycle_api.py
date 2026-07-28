
from __future__ import annotations
from datetime import (
    datetime,
    time,
    timedelta,
)
from unittest.mock import patch
from django.contrib.auth import get_user_model
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
    MedicalAppointmentStatus,
    MedicalPatient,
)
class CompanyAppointmentLifecycleApiTests(
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
            patient_number="LIFE-PAT-A",
            full_name="Lifecycle Patient A",
        )
        self.user = (
            get_user_model()
            .objects
            .create_user(
                username="appointment-lifecycle-user",
                password="test-password",
            )
        )
        self.factory = APIRequestFactory()
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
    def booking_payload(
        self,
        *,
        start=None,
        status=None,
    ):
        payload = {
            "patient_id": self.patient_a.id,
            (
                "practitioner_service_"
                "assignment_id"
            ): self.link_a.id,
            "scheduled_start": (
                start or self.aware(9)
            ).isoformat(),
        }
        if status is not None:
            payload["status"] = status
        return payload
    def post_booking(
        self,
        *,
        start=None,
        status=None,
    ):
        request = self.factory.post(
            (
                "/api/company/medical/"
                "appointments/"
            ),
            self.booking_payload(
                start=start,
                status=status,
            ),
            format="json",
        )
        return self.invoke(
            appointments.appointment_collection,
            request,
        )
    def patch_booking(
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
    def set_status(
        self,
        appointment_id,
        status,
        *,
        cancellation_reason="",
    ):
        payload = {
            "status": status,
        }
        if cancellation_reason:
            payload["cancellation_reason"] = (
                cancellation_reason
            )
        request = self.factory.patch(
            (
                "/api/company/medical/"
                f"appointments/{appointment_id}/"
                "status/"
            ),
            payload,
            format="json",
        )
        return self.invoke(
            appointments.appointment_status,
            request,
            appointment_id,
        )
    def create_booking(
        self,
        *,
        start=None,
        status=None,
    ):
        response = self.post_booking(
            start=start,
            status=status,
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        return MedicalAppointment.objects.get(
            id=response.data["item"]["id"]
        )
    def transition(
        self,
        appointment,
        status,
        *,
        cancellation_reason="",
    ):
        response = self.set_status(
            appointment.id,
            status,
            cancellation_reason=(
                cancellation_reason
            ),
        )
        appointment.refresh_from_db()
        return response
    def test_existing_routes_are_preserved(self):
        routes = {
            (
                "/api/company/medical/"
                "appointments/"
            ): appointments.appointment_collection,
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
    def test_new_appointment_allows_draft(self):
        appointment = self.create_booking(
            status=MedicalAppointmentStatus.DRAFT
        )
        self.assertEqual(
            appointment.status,
            MedicalAppointmentStatus.DRAFT,
        )
    def test_new_appointment_rejects_advanced_status(
        self,
    ):
        response = self.post_booking(
            status=(
                MedicalAppointmentStatus.CONFIRMED
            )
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "status",
            response.data["errors"],
        )
    def test_draft_can_be_scheduled(self):
        appointment = self.create_booking(
            status=MedicalAppointmentStatus.DRAFT
        )
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.SCHEDULED,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            appointment.status,
            MedicalAppointmentStatus.SCHEDULED,
        )
    def test_scheduled_confirmation_sets_time(self):
        appointment = self.create_booking()
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertIsNotNone(
            appointment.confirmed_at
        )
    def test_confirmed_check_in_sets_time(self):
        appointment = self.create_booking()
        self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.CHECKED_IN,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertIsNotNone(
            appointment.checked_in_at
        )
    def test_checked_in_can_start(self):
        appointment = self.create_booking()
        self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        self.transition(
            appointment,
            MedicalAppointmentStatus.CHECKED_IN,
        )
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.IN_PROGRESS,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertIsNotNone(
            appointment.started_at
        )
    def test_in_progress_can_complete(self):
        appointment = self.create_booking()
        for status in (
            MedicalAppointmentStatus.CONFIRMED,
            MedicalAppointmentStatus.CHECKED_IN,
            MedicalAppointmentStatus.IN_PROGRESS,
        ):
            self.transition(
                appointment,
                status,
            )
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.COMPLETED,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertIsNotNone(
            appointment.completed_at
        )
        self.assertTrue(
            response.data["item"]["is_terminal"]
        )
    def test_scheduled_can_be_no_show(self):
        appointment = self.create_booking()
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.NO_SHOW,
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertIsNotNone(
            appointment.no_show_at
        )
    def test_cancellation_requires_reason(self):
        appointment = self.create_booking()
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.CANCELLED,
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertIn(
            "cancellation_reason",
            response.data["errors"],
        )
    def test_cancellation_sets_reason_and_time(self):
        appointment = self.create_booking()
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.CANCELLED,
            cancellation_reason="Patient request",
        )
        self.assertEqual(
            response.status_code,
            200,
        )
        self.assertEqual(
            appointment.cancellation_reason,
            "Patient request",
        )
        self.assertIsNotNone(
            appointment.cancelled_at
        )
    def test_invalid_transition_is_rejected(self):
        appointment = self.create_booking()
        response = self.transition(
            appointment,
            MedicalAppointmentStatus.COMPLETED,
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        self.assertEqual(
            appointment.status,
            MedicalAppointmentStatus.SCHEDULED,
        )
    def test_same_status_is_idempotent(self):
        appointment = self.create_booking()
        first = self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        original_time = appointment.confirmed_at
        second = self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        self.assertEqual(
            first.status_code,
            200,
        )
        self.assertEqual(
            second.status_code,
            200,
        )
        self.assertFalse(
            second.data["transition"]["changed"]
        )
        self.assertEqual(
            appointment.confirmed_at,
            original_time,
        )
    def test_detail_cannot_change_status(self):
        appointment = self.create_booking()
        response = self.patch_booking(
            appointment.id,
            {
                "status": (
                    MedicalAppointmentStatus.CONFIRMED
                )
            },
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        appointment.refresh_from_db()
        self.assertEqual(
            appointment.status,
            MedicalAppointmentStatus.SCHEDULED,
        )
    def test_detail_cannot_set_lifecycle_time(self):
        appointment = self.create_booking()
        response = self.patch_booking(
            appointment.id,
            {
                "confirmed_at": (
                    timezone.now().isoformat()
                )
            },
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        appointment.refresh_from_db()
        self.assertIsNone(
            appointment.confirmed_at
        )
    def test_scheduled_reschedule_records_history(
        self,
    ):
        appointment = self.create_booking(
            start=self.aware(9)
        )
        response = self.patch_booking(
            appointment.id,
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
        appointment.refresh_from_db()
        self.assertEqual(
            appointment.scheduled_start,
            self.aware(10),
        )
        self.assertEqual(
            (
                appointment.extra_data[
                    "reschedule_count"
                ]
            ),
            1,
        )
        self.assertEqual(
            len(
                appointment.extra_data[
                    "reschedule_history"
                ]
            ),
            1,
        )
    def test_confirmed_reschedule_requires_reconfirmation(
        self,
    ):
        appointment = self.create_booking(
            start=self.aware(9)
        )
        self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        self.assertIsNotNone(
            appointment.confirmed_at
        )
        response = self.patch_booking(
            appointment.id,
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
        appointment.refresh_from_db()
        self.assertEqual(
            appointment.status,
            MedicalAppointmentStatus.SCHEDULED,
        )
        self.assertIsNone(
            appointment.confirmed_at
        )
    def test_checked_in_cannot_reschedule(self):
        appointment = self.create_booking()
        self.transition(
            appointment,
            MedicalAppointmentStatus.CONFIRMED,
        )
        self.transition(
            appointment,
            MedicalAppointmentStatus.CHECKED_IN,
        )
        response = self.patch_booking(
            appointment.id,
            {
                "scheduled_start": (
                    self.aware(10).isoformat()
                )
            },
        )
        self.assertEqual(
            response.status_code,
            400,
        )
    def test_terminal_appointment_cannot_reschedule(
        self,
    ):
        appointment = self.create_booking()
        self.transition(
            appointment,
            MedicalAppointmentStatus.CANCELLED,
            cancellation_reason="Cancelled",
        )
        response = self.patch_booking(
            appointment.id,
            {
                "scheduled_start": (
                    self.aware(10).isoformat()
                )
            },
        )
        self.assertEqual(
            response.status_code,
            400,
        )
    def test_conflicting_reschedule_is_rejected(self):
        first = self.create_booking(
            start=self.aware(9)
        )
        second = self.create_booking(
            start=self.aware(10, 30)
        )
        response = self.patch_booking(
            second.id,
            {
                "scheduled_start": (
                    self.aware(9, 15).isoformat()
                )
            },
        )
        self.assertEqual(
            response.status_code,
            400,
        )
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(
            first.scheduled_start,
            self.aware(9),
        )
        self.assertEqual(
            second.scheduled_start,
            self.aware(10, 30),
        )
    def test_serializer_exposes_lifecycle_capabilities(
        self,
    ):
        response = self.post_booking()
        self.assertEqual(
            response.status_code,
            201,
        )
        item = response.data["item"]
        self.assertEqual(
            item["allowed_statuses"],
            [
                "CANCELLED",
                "CONFIRMED",
                "NO_SHOW",
            ],
        )
        self.assertTrue(
            item["can_reschedule"]
        )
        self.assertFalse(
            item["is_terminal"]
        )
        self.assertEqual(
            item["reschedule_count"],
            0,
        )
