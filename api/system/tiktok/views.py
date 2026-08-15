from __future__ import annotations

import secrets

from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.http import urlencode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from integrations.models import TikTokConnection
from integrations.tiktok_service import (
    TikTokIntegrationError,
    build_authorization_url,
    exchange_authorization_code,
    generate_oauth_state,
    persist_token_payload,
    revoke_connection,
    sync_tiktok_account,
)

from .serializers import TikTokConnectionSerializer


SESSION_STATE_KEY = "marilyn_tiktok_oauth_state"


def _can_manage_tiktok(user) -> bool:
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    profile = getattr(user, "Mhamcloud_profile", None)

    return bool(profile and profile.can_access_system)


def _forbidden():
    return Response(
        {
            "detail": "You do not have permission to manage TikTok integration.",
            "code": "permission_denied",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def _return_url(status_value: str, message: str = "") -> str:
    base = str(
        getattr(
            settings,
            "TIKTOK_FRONTEND_RETURN_URL",
            "http://localhost:3000/system/integrations",
        )
        or ""
    ).strip()

    query = {
        "tiktok": status_value,
    }

    if message:
        query["message"] = message[:300]

    separator = "&" if "?" in base else "?"

    return f"{base}{separator}{urlencode(query)}"


class TikTokStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _can_manage_tiktok(request.user):
            return _forbidden()

        connection = (
            TikTokConnection.objects.filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        return Response(
            {
                "configured": bool(
                    getattr(settings, "TIKTOK_CLIENT_KEY", "")
                    and getattr(settings, "TIKTOK_CLIENT_SECRET", "")
                    and getattr(settings, "TIKTOK_REDIRECT_URI", "")
                ),
                "connected": bool(connection),
                "connection": (
                    TikTokConnectionSerializer(connection).data
                    if connection
                    else None
                ),
            }
        )


class TikTokConnectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _can_manage_tiktok(request.user):
            return _forbidden()

        try:
            state_value = generate_oauth_state()

            request.session[SESSION_STATE_KEY] = state_value
            request.session.modified = True

            return Response(
                {
                    "authorization_url": build_authorization_url(
                        state_value
                    )
                }
            )

        except TikTokIntegrationError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "code": "tiktok_configuration_error",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class TikTokCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        error = str(request.query_params.get("error") or "").strip()

        if error:
            description = str(
                request.query_params.get("error_description")
                or error
            )

            return HttpResponseRedirect(
                _return_url("error", description)
            )

        code = str(request.query_params.get("code") or "").strip()
        state_value = str(
            request.query_params.get("state") or ""
        ).strip()

        expected_state = str(
            request.session.get(SESSION_STATE_KEY) or ""
        ).strip()

        if (
            not expected_state
            or not state_value
            or not secrets.compare_digest(
                expected_state,
                state_value,
            )
        ):
            return HttpResponseRedirect(
                _return_url(
                    "error",
                    "OAuth state validation failed.",
                )
            )

        request.session.pop(SESSION_STATE_KEY, None)
        request.session.modified = True

        try:
            payload = exchange_authorization_code(code)
            connection = persist_token_payload(payload)

            sync_tiktok_account(connection)

            return HttpResponseRedirect(
                _return_url("connected")
            )

        except Exception as exc:
            return HttpResponseRedirect(
                _return_url("error", str(exc))
            )


class TikTokSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _can_manage_tiktok(request.user):
            return _forbidden()

        connection = (
            TikTokConnection.objects.filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        if not connection:
            return Response(
                {
                    "detail": "TikTok account is not connected.",
                    "code": "not_connected",
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            result = sync_tiktok_account(connection)

            return Response(
                {
                    "ok": True,
                    "result": result,
                    "connection": TikTokConnectionSerializer(
                        connection
                    ).data,
                }
            )

        except Exception as exc:
            return Response(
                {
                    "detail": str(exc),
                    "code": "tiktok_sync_failed",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )


class TikTokDisconnectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _can_manage_tiktok(request.user):
            return _forbidden()

        connection = (
            TikTokConnection.objects.filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        if not connection:
            return Response(
                {
                    "ok": True,
                    "connected": False,
                }
            )

        try:
            revoke_connection(connection)

        except TikTokIntegrationError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "code": "tiktok_disconnect_failed",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "ok": True,
                "connected": False,
            }
        )
