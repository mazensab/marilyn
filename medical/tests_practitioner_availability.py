from __future__ import annotations
from datetime import (
    datetime,
    time,
    timedelta,
)
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.urls import resolve, reverse
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import (
    CompanyMembership,
    CompanyRole,
    UserProfile,
)
from medical.models import (
    MedicalPractitionerScheduleBreak,
    MedicalPractitionerServiceAssignmentStatus,
    MedicalPractitionerTimeOff,
    MedicalPractitionerTimeOffStatus,
    MedicalPractitionerWeeklySchedule,
    MedicalWeekday,
)
from api.company.medical import (
    practitioner_availability as availability_api,
)
User = get_user_model()
class PractitionerAvailabilityCombinedTests(
    TestCase
):
    def setUp(self) -> None:
        from medical.tests_practitioner_service_assignment_api import (
            CompanyPractitionerServiceAssignmentApiTests,
        )
        CompanyPractitionerServiceAssignmentApiTests.setUp(
            self
        )
        self.target_date = (
            timezone.localdate()
            + timedelta(days=1)
        )
        self.weekday = self.target_date.weekday()
        self.schedule_a = (
            MedicalPractitionerWeeklySchedule
            .objects
            .create(
                company=self.company_a,
                practitioner_assignment=(
                    self.assignment_a
                ),
                weekday=self.weekday,
                start_time=time(9, 0),
                end_time=time(12, 0),
                slot_interval_minutes=15,
                is_active=True,
                notes="Main schedule",
            )
        )
        self.schedule_b = (
            MedicalPractitionerWeeklySchedule
            .objects
            .create(
                company=self.company_b,
                practitioner_assignment=(
                    self.assignment_b
                ),
                weekday=self.weekday,
                start_time=time(9, 0),
                end_time=time(12, 0),
                slot_interval_minutes=15,
                is_active=True,
            )
        )
        self.schedule_collection_url = (
            "/api/company/medical/"
            "practitioner-schedules/"
        )
        self.schedule_detail_url = (
            self.schedule_collection_url
            + f"{self.schedule_a.id}/"
        )
        self.break_collection_url = (
            "/api/company/medical/"
            "practitioner-schedule-breaks/"
        )
        self.time_off_collection_url = (
            "/api/company/medical/"
            "practitioner-time-offs/"
        )
        self.availability_url = (
            "/api/company/medical/availability/"
        )
    def aware(self, hour, minute=0):
        value = datetime.combine(
            self.target_date,
            time(hour, minute),
        )
        return timezone.make_aware(
            value,
            timezone.get_current_timezone(),
        )
    def availability(self):
        return self.client.get(
            self.availability_url,
            {
                (
                    "practitioner_"
                    "service_assignment_id"
                ): self.link_a.id,
                "date": self.target_date.isoformat(),
            },
        )
    def test_routes_are_registered(self):
        paths = (
            self.schedule_collection_url,
            self.schedule_detail_url,
            self.break_collection_url,
            (
                self.break_collection_url
                + "1/"
            ),
            self.time_off_collection_url,
            (
                self.time_off_collection_url
                + "1/"
            ),
            self.availability_url,
        )
        for path in paths:
            match = resolve(path)
            self.assertEqual(
                reverse(
                    match.view_name,
                    kwargs=match.kwargs,
                ),
                path,
            )
    def test_routes_use_expected_callbacks(self):
        self.assertIs(
            resolve(
                self.schedule_collection_url
            ).func,
            (
                availability_api
                .weekly_schedule_collection
            ),
        )
        self.assertIs(
            resolve(
                self.break_collection_url
            ).func,
            (
                availability_api
                .schedule_break_collection
            ),
        )
        self.assertIs(
            resolve(
                self.time_off_collection_url
            ).func,
            (
                availability_api
                .practitioner_time_off_collection
            ),
        )
        self.assertIs(
            resolve(self.availability_url).func,
            (
                availability_api
                .practitioner_availability
            ),
        )
    def test_permission_contracts(self):
        self.assertEqual(
            (
                availability_api
                .weekly_schedule_collection
                .required_company_permissions
            ),
            availability_api.SCHEDULE_PERMISSIONS,
        )
        self.assertEqual(
            (
                availability_api
                .schedule_break_collection
                .required_company_permissions
            ),
            availability_api.BREAK_PERMISSIONS,
        )
        self.assertEqual(
            (
                availability_api
                .practitioner_time_off_collection
                .required_company_permissions
            ),
            availability_api.TIME_OFF_PERMISSIONS,
        )
        self.assertEqual(
            (
                availability_api
                .practitioner_availability
                .required_company_permissions
            ),
            [
                (
                    availability_api
                    .VIEW_AVAILABILITY_PERMISSION
                )
            ],
        )
    def test_schedule_collection_is_company_scoped(
        self,
    ):
        response = self.client.get(
            self.schedule_collection_url
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            self.schedule_a.id,
        )
    def test_create_schedule_derives_company(self):
        response = self.client.post(
            self.schedule_collection_url,
            {
                "company_id": self.company_b.id,
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "weekday": (
                    self.target_date
                    + timedelta(days=1)
                ).weekday(),
                "start_time": "13:00",
                "end_time": "16:00",
                "slot_interval_minutes": 20,
                "notes": "  Evening schedule  ",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        item = response.data["item"]
        self.assertEqual(
            item["company_id"],
            self.company_a.id,
        )
        self.assertEqual(
            item["notes"],
            "Evening schedule",
        )
    def test_schedule_invalid_time_rejected(self):
        response = self.client.post(
            self.schedule_collection_url,
            {
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "weekday": self.weekday,
                "start_time": "12:00",
                "end_time": "09:00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "end_time",
            response.data["errors"],
        )
    def test_foreign_assignment_is_rejected(self):
        response = self.client.post(
            self.schedule_collection_url,
            {
                "practitioner_assignment_id": (
                    self.assignment_b.id
                ),
                "weekday": self.weekday,
                "start_time": "13:00",
                "end_time": "16:00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "practitioner_assignment_id",
            response.data["errors"],
        )
    def test_schedule_detail_update(self):
        response = self.client.patch(
            self.schedule_detail_url,
            {
                "slot_interval_minutes": 30,
                "notes": "  Updated schedule  ",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.schedule_a.refresh_from_db()
        self.assertEqual(
            self.schedule_a.slot_interval_minutes,
            30,
        )
        self.assertEqual(
            self.schedule_a.notes,
            "Updated schedule",
        )
    def test_duplicate_schedule_rejected(self):
        with self.assertRaises(
            (
                ValidationError,
                IntegrityError,
            )
        ):
            MedicalPractitionerWeeklySchedule.objects.create(
                company=self.company_a,
                practitioner_assignment=(
                    self.assignment_a
                ),
                weekday=self.weekday,
                start_time=time(9, 0),
                end_time=time(12, 0),
            )
    def test_schedule_applies_on_contract(self):
        self.assertTrue(
            self.schedule_a.applies_on(
                self.target_date
            )
        )
        self.schedule_a.is_active = False
        self.schedule_a.save()
        self.assertFalse(
            self.schedule_a.applies_on(
                self.target_date
            )
        )
    def test_break_collection_is_company_scoped(
        self,
    ):
        break_a = (
            MedicalPractitionerScheduleBreak
            .objects
            .create(
                company=self.company_a,
                weekly_schedule=self.schedule_a,
                start_time=time(10, 0),
                end_time=time(10, 15),
            )
        )
        MedicalPractitionerScheduleBreak.objects.create(
            company=self.company_b,
            weekly_schedule=self.schedule_b,
            start_time=time(10, 0),
            end_time=time(10, 15),
        )
        response = self.client.get(
            self.break_collection_url
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            break_a.id,
        )
    def test_create_schedule_break(self):
        response = self.client.post(
            self.break_collection_url,
            {
                "weekly_schedule_id": (
                    self.schedule_a.id
                ),
                "start_time": "09:45",
                "end_time": "10:30",
                "notes": "  Lunch break  ",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        self.assertEqual(
            response.data["item"]["notes"],
            "Lunch break",
        )
    def test_break_outside_schedule_rejected(self):
        response = self.client.post(
            self.break_collection_url,
            {
                "weekly_schedule_id": (
                    self.schedule_a.id
                ),
                "start_time": "08:00",
                "end_time": "09:30",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "end_time",
            response.data["errors"],
        )
    def test_foreign_schedule_break_rejected(self):
        response = self.client.post(
            self.break_collection_url,
            {
                "weekly_schedule_id": (
                    self.schedule_b.id
                ),
                "start_time": "10:00",
                "end_time": "10:15",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "weekly_schedule_id",
            response.data["errors"],
        )
    def test_time_off_collection_is_company_scoped(
        self,
    ):
        item_a = MedicalPractitionerTimeOff.objects.create(
            company=self.company_a,
            practitioner_assignment=self.assignment_a,
            starts_at=self.aware(9),
            ends_at=self.aware(10),
            reason="Company A",
        )
        MedicalPractitionerTimeOff.objects.create(
            company=self.company_b,
            practitioner_assignment=self.assignment_b,
            starts_at=self.aware(9),
            ends_at=self.aware(10),
            reason="Company B",
        )
        response = self.client.get(
            self.time_off_collection_url
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["items"][0]["id"],
            item_a.id,
        )
    def test_create_time_off(self):
        response = self.client.post(
            self.time_off_collection_url,
            {
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "starts_at": (
                    self.aware(13).isoformat()
                ),
                "ends_at": (
                    self.aware(15).isoformat()
                ),
                "reason": "  Medical leave  ",
                "notes": "  Approved by manager  ",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )
        self.assertEqual(
            response.data["item"]["reason"],
            "Medical leave",
        )
        self.assertTrue(
            response.data["item"]["is_effective"]
        )
    def test_invalid_time_off_range_rejected(self):
        response = self.client.post(
            self.time_off_collection_url,
            {
                "practitioner_assignment_id": (
                    self.assignment_a.id
                ),
                "starts_at": (
                    self.aware(15).isoformat()
                ),
                "ends_at": (
                    self.aware(13).isoformat()
                ),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "ends_at",
            response.data["errors"],
        )
    def test_cancel_time_off(self):
        item = MedicalPractitionerTimeOff.objects.create(
            company=self.company_a,
            practitioner_assignment=self.assignment_a,
            starts_at=self.aware(13),
            ends_at=self.aware(15),
        )
        response = self.client.patch(
            (
                self.time_off_collection_url
                + f"{item.id}/"
            ),
            {
                "status": "CANCELLED",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertFalse(
            response.data["item"]["is_effective"]
        )
    def test_basic_availability_slots(self):
        response = self.availability()
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 4)
        self.assertEqual(
            response.data["slots"],
            response.data["available_slots"],
        )
        self.assertEqual(
            response.data["slots"][0][
                "total_slot_minutes"
            ],
            45,
        )
    def test_schedule_break_removes_slot(self):
        MedicalPractitionerScheduleBreak.objects.create(
            company=self.company_a,
            weekly_schedule=self.schedule_a,
            start_time=time(9, 45),
            end_time=time(10, 30),
        )
        response = self.availability()
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 3)
    def test_time_off_removes_overlapping_slots(self):
        MedicalPractitionerTimeOff.objects.create(
            company=self.company_a,
            practitioner_assignment=self.assignment_a,
            starts_at=self.aware(10),
            ends_at=self.aware(11),
        )
        response = self.availability()
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            response.data["time_off_count"],
            1,
        )
    def test_cancelled_time_off_does_not_block(self):
        MedicalPractitionerTimeOff.objects.create(
            company=self.company_a,
            practitioner_assignment=self.assignment_a,
            starts_at=self.aware(9),
            ends_at=self.aware(12),
            status=(
                MedicalPractitionerTimeOffStatus
                .CANCELLED
            ),
        )
        response = self.availability()
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 4)
    def test_inactive_schedule_has_no_slots(self):
        self.schedule_a.is_active = False
        self.schedule_a.save()
        response = self.availability()
        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )
        self.assertEqual(response.data["count"], 0)
    def test_inactive_service_assignment_rejected(
        self,
    ):
        self.link_a.status = (
            MedicalPractitionerServiceAssignmentStatus
            .INACTIVE
        )
        self.link_a.save()
        response = self.availability()
        self.assertEqual(response.status_code, 400)
    def test_missing_service_assignment_rejected(
        self,
    ):
        response = self.client.get(
            self.availability_url,
            {
                "date": self.target_date.isoformat(),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            (
                "practitioner_"
                "service_assignment_id"
            ),
            response.data["errors"],
        )
    def test_invalid_availability_date_rejected(
        self,
    ):
        response = self.client.get(
            self.availability_url,
            {
                (
                    "practitioner_"
                    "service_assignment_id"
                ): self.link_a.id,
                "date": "invalid-date",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "date",
            response.data["errors"],
        )
    def test_weekday_and_status_contracts(self):
        self.assertEqual(
            set(MedicalWeekday.values),
            set(range(7)),
        )
        self.assertEqual(
            set(
                MedicalPractitionerTimeOffStatus
                .values
            ),
            {
                "APPROVED",
                "CANCELLED",
            },
        )
