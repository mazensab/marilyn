from __future__ import annotations
from django.urls import path
from .practitioners import (
    public_practitioner_detail,
    public_practitioners,
)
from .services import (
    public_service_detail,
    public_service_list,
)
app_name = "public"
urlpatterns = [
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
