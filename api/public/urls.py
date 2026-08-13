from __future__ import annotations
from django.urls import path
from .practitioners import public_practitioners
app_name = "public"
urlpatterns = [
    path(
        "practitioners/",
        public_practitioners,
        name="practitioners",
    ),
]
