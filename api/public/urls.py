from __future__ import annotations

from django.urls import path

from .social import public_tiktok_videos
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
    public_booking_payment_checkout,
    public_booking_payment_options,
    public_booking_payment_return,
    public_booking_payment_status,
    public_booking_payment_verify,
)

from .payment_webhooks.receiver import provider_payment_webhook

app_name = "public"


urlpatterns = [
    path(
        "payments/webhooks/moyasar/<int:gateway_id>/",
        provider_payment_webhook,
        {"provider": "moyasar"},
        name="payment-webhook-moyasar",
    ),
    path(
        "payments/webhooks/tabby/<int:gateway_id>/",
        provider_payment_webhook,
        {"provider": "tabby"},
        name="payment-webhook-tabby",
    ),
    path(
        "payments/webhooks/tamara/<int:gateway_id>/",
        provider_payment_webhook,
        {"provider": "tamara"},
        name="payment-webhook-tamara",
    ),
    path(
        "social/tiktok/videos/",
        public_tiktok_videos,
        name="social-tiktok-videos",
    ),
    path(
        "booking/payment/return/<str:provider>/<str:result>/",
        public_booking_payment_return,
        name="booking-payment-return",
    ),
    path(
        "booking/payment/options/",
        public_booking_payment_options,
        name="booking-payment-options",
    ),
    path(
        "booking/payment/checkout/",
        public_booking_payment_checkout,
        name="booking-payment-checkout",
    ),
    path(
        "booking/payment/status/",
        public_booking_payment_status,
        name="booking-payment-status",
    ),
    path(
        "booking/payment/verify/",
        public_booking_payment_verify,
        name="booking-payment-verify",
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
