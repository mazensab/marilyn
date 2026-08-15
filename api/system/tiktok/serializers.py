from __future__ import annotations

from rest_framework import serializers

from integrations.models import TikTokConnection


class TikTokConnectionSerializer(serializers.ModelSerializer):
    video_count = serializers.IntegerField(
        source="videos.count",
        read_only=True,
    )

    class Meta:
        model = TikTokConnection
        fields = [
            "id",
            "open_id",
            "display_name",
            "avatar_url",
            "scopes",
            "is_active",
            "access_token_expires_at",
            "refresh_token_expires_at",
            "last_synced_at",
            "last_error",
            "video_count",
            "created_at",
            "updated_at",
        ]
