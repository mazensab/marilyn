from django.apps import apps
from django.test import SimpleTestCase
from .services import activity_backends_summary
class ActivityBackendsScopeTests(SimpleTestCase):
    def test_only_legacy_clinic_models_remain(self):
        app_config = apps.get_app_config(
            "activity_backends"
        )
        model_names = {
            model.__name__
            for model in app_config.get_models()
        }
        self.assertEqual(
            model_names,
            {
                "ClinicPatient",
                "ClinicService",
                "ClinicAppointment",
            },
        )
    def test_system_summary_service_remains_available(self):
        self.assertTrue(
            callable(activity_backends_summary)
        )
