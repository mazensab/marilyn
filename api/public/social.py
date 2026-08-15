from __future__ import annotations

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from integrations.models import TikTokVideo


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tiktok_videos(request):
    try:
        limit = int(request.query_params.get("limit", 12))
    except (TypeError, ValueError):
        limit = 12

    limit = max(1, min(limit, 20))

    videos = (
        TikTokVideo.objects.filter(
            is_visible=True,
            connection__is_active=True,
        )
        .select_related("connection")
        .order_by("-published_at", "-id")[:limit]
    )

    results = [
        {
            "id": video.tiktok_video_id,
            "platform": "tiktok",
            "title": video.title,
            "description": video.description,
            "cover_image_url": video.cover_image_url,
            "share_url": video.share_url,
            "embed_link": video.embed_link,
            "duration": video.duration,
            "width": video.width,
            "height": video.height,
            "like_count": video.like_count,
            "comment_count": video.comment_count,
            "share_count": video.share_count,
            "view_count": video.view_count,
            "published_at": (
                video.published_at.isoformat()
                if video.published_at
                else None
            ),
        }
        for video in videos
    ]

    return Response(
        {
            "count": len(results),
            "results": results,
        }
    )
