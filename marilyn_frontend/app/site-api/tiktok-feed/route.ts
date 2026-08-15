import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const revalidate = 60;

const PUBLIC_TIKTOK_PATH =
  "/api/public/social/tiktok/videos/";

const MAX_LIMIT = 12;

function getUpstreamBaseUrl() {
  const raw = (
    process.env.TIKTOK_PUBLIC_FEED_UPSTREAM_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (!raw) {
    throw new Error(
      "TikTok public feed upstream is not configured.",
    );
  }

  const parsed = new URL(raw);

  if (
    parsed.protocol !== "https:" &&
    parsed.hostname !== "localhost" &&
    parsed.hostname !== "127.0.0.1"
  ) {
    throw new Error(
      "TikTok public feed upstream must use HTTPS.",
    );
  }

  return raw.endsWith("/api")
    ? raw.slice(0, -4)
    : raw;
}

function normalizeLimit(value: string | null) {
  const parsed = Number.parseInt(
    value || "",
    10,
  );

  if (!Number.isFinite(parsed)) {
    return MAX_LIMIT;
  }

  return Math.min(
    Math.max(parsed, 1),
    MAX_LIMIT,
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    const limit = normalizeLimit(
      request.nextUrl.searchParams.get("limit"),
    );

    const upstreamUrl = new URL(
      PUBLIC_TIKTOK_PATH,
      `${getUpstreamBaseUrl()}/`,
    );

    upstreamUrl.searchParams.set(
      "limit",
      String(limit),
    );

    const response = await fetch(
      upstreamUrl.toString(),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        redirect: "follow",
        next: {
          revalidate: 60,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          count: 0,
          results: [],
          detail:
            "TikTok public feed is temporarily unavailable.",
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const payload = await response.json();

    return NextResponse.json(
      payload,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        count: 0,
        results: [],
        detail:
          "TikTok public feed proxy is unavailable.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
