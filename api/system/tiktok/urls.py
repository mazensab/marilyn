from __future__ import annotations

from django.urls import path

from .views import (
    TikTokCallbackView,
    TikTokConnectView,
    TikTokDisconnectView,
    TikTokStatusView,
    TikTokSyncView,
)


app_name = "tiktok"


urlpatterns = [
    path(
        "status/",
        TikTokStatusView.as_view(),
        name="status",
    ),
    path(
        "connect/",
        TikTokConnectView.as_view(),
        name="connect",
    ),
    path(
        "callback/",
        TikTokCallbackView.as_view(),
        name="callback",
    ),
    path(
        "sync/",
        TikTokSyncView.as_view(),
        name="sync",
    ),
    path(
        "disconnect/",
        TikTokDisconnectView.as_view(),
        name="disconnect",
    ),
]
