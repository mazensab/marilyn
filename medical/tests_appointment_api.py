from django.test import SimpleTestCase

from api.company.medical import appointments
from api.company.medical.urls import urlpatterns


class CompanyMedicalAppointmentApiContractTests(SimpleTestCase):
    @staticmethod
    def pattern_map():
        return {
            pattern.name: pattern
            for pattern in urlpatterns
            if pattern.name
        }

    def test_appointment_routes_are_registered(self):
        patterns = self.pattern_map()

        self.assertEqual(
            str(
                patterns[
                    "company-medical-appointments"
                ].pattern
            ),
            "appointments/",
        )
        self.assertEqual(
            str(
                patterns[
                    "company-medical-appointment-detail"
                ].pattern
            ),
            "appointments/<int:appointment_id>/",
        )
        self.assertEqual(
            str(
                patterns[
                    "company-medical-appointment-status"
                ].pattern
            ),
            (
                "appointments/"
                "<int:appointment_id>/status/"
            ),
        )

    def test_appointment_routes_use_expected_views(self):
        patterns = self.pattern_map()

        self.assertIs(
            patterns[
                "company-medical-appointments"
            ].callback,
            appointments.appointment_collection,
        )
        self.assertIs(
            patterns[
                "company-medical-appointment-detail"
            ].callback,
            appointments.appointment_detail,
        )
        self.assertIs(
            patterns[
                "company-medical-appointment-status"
            ].callback,
            appointments.appointment_status,
        )

    def test_permission_contracts_are_declared(self):
        self.assertEqual(
            appointments.appointment_collection
            .required_company_permissions,
            appointments.ALL_PERMISSIONS,
        )
        self.assertEqual(
            appointments.appointment_detail
            .required_company_permissions,
            [
                appointments.VIEW_PERMISSION,
                appointments.UPDATE_PERMISSION,
            ],
        )
        self.assertEqual(
            appointments.appointment_status
            .required_company_permissions,
            [appointments.STATUS_PERMISSION],
        )

    def test_status_values_match_model_choices(self):
        expected = {
            value
            for value, _label in (
                appointments.MedicalAppointment
                ._meta.get_field("status").choices
            )
        }
        self.assertEqual(
            appointments.VALID_STATUS_VALUES,
            expected,
        )
