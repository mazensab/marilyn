from __future__ import annotations
from django.urls import path
from .branches import (
    public_branch_detail,
    public_branch_list,
)
from .practitioners import (
    public_practitioner_detail,
    public_practitioners,
)
from .services import (
    public_service_detail,
    public_service_list,
)
from .booking import (
    public_booking_availability,
    public_booking_options,
)

from .booking_confirmation import (
    public_booking_confirm,
    public_booking_requirements,
)

from .booking_payment import (
    public_booking_payment_options,
)

app_name = "public"
urlpatterns = [
    path(
        "booking/payment/options/",
        public_booking_payment_options,
        name="booking-payment-options",
    ),
    path(
        "booking/requirements/",
        public_booking_requirements,
        name="booking-requirements",
    ),
    path(
        "booking/confirm/",
        public_booking_confirm,
        name="booking-confirm",
    ),
    path(
        "booking/options/",
        public_booking_options,
        name="booking-options",
    ),
    path(
        "booking/availability/",
        public_booking_availability,
        name="booking-availability",
    ),
    path(
        "branches/",
        public_branch_list,
        name="branches",
    ),
    path(
        "branches/<int:branch_id>/",
        public_branch_detail,
        name="branch-detail",
    ),
    path(
        "practitioners/",
        public_practitioners,
        name="practitioners",
    ),
    path(
        "practitioners/<int:practitioner_id>/",
        public_practitioner_detail,
        name="practitioner-detail",
    ),
    path(
        "services/",
        public_service_list,
        name="services",
    ),
    path(
        "services/<int:offering_id>/",
        public_service_detail,
        name="service-detail",
    ),
]
