"use client";

import * as React from "react";
import {
  Play,
} from "lucide-react";

import { API_PATHS } from "@/lib/api/endpoints";
import { PUBLIC_SOCIAL_REELS } from "@/lib/public-content";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";


type PublicTikTokVideo = {
  id: string;
  platform: "tiktok";
  title: string;
  description: string;
  cover_image_url: string;
  share_url: string;
  embed_link: string;
  duration: number;
  width: number;
  height: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  published_at: string | null;
};

type PublicTikTokPayload = {
  count: number;
  results: PublicTikTokVideo[];
};

async function fetchPublicTikTokVideos(
  limit: number,
  signal: AbortSignal,
) {
  const url = new URL(
    API_PATHS.publicSocial.tiktokFeedProxy,
    window.location.origin,
  );

  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `TikTok public feed returned HTTP ${response.status}`,
    );
  }

  const payload =
    (await response.json()) as PublicTikTokPayload;

  if (!Array.isArray(payload.results)) {
    return [];
  }

  return payload.results.filter(
    (item) =>
      Boolean(item?.id) &&
      Boolean(item?.embed_link),
  );
}

function buildTikTokPlayerUrl(embedLink: string) {
  try {
    const url = new URL(embedLink);

    url.searchParams.set("autoplay", "1");
    url.searchParams.set("loop", "0");
    url.searchParams.set("muted", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("progress_bar", "0");
    url.searchParams.set("play_button", "0");
    url.searchParams.set("volume_control", "0");
    url.searchParams.set("fullscreen_button", "0");
    url.searchParams.set("timestamp", "0");
    url.searchParams.set("music_info", "0");
    url.searchParams.set("description", "0");
    url.searchParams.set("rel", "0");

    return url.toString();
  } catch {
    return embedLink;
  }
}

export function HeroSocialReel() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  const [activeIndex, setActiveIndex] =
    React.useState(0);

  const [tiktokVideos, setTikTokVideos] =
    React.useState<PublicTikTokVideo[]>([]);

  const [tiktokPlayerFailed, setTikTokPlayerFailed] =
    React.useState(false);

  const tiktokIframeRef =
    React.useRef<HTMLIFrameElement | null>(null);

  const endedTikTokVideoRef =
    React.useRef<string | null>(null);

  const touchStartY =
    React.useRef<number | null>(null);

  const sendTikTokPlayerCommand =
    React.useCallback(
      (
        type: "play" | "pause" | "mute" | "unMute",
      ) => {
        const player =
          tiktokIframeRef.current?.contentWindow;

        if (!player) {
          return;
        }

        player.postMessage(
          {
            "x-tiktok-player": true,
            type,
            value: undefined,
          },
          "*",
        );
      },
      [],
    );

  React.useEffect(() => {
    const syncLocale = () => {
      setLocale(readPublicLocale());
    };

    syncLocale();

    window.addEventListener(
      PUBLIC_LOCALE_CHANGE_EVENT,
      syncLocale,
    );

    window.addEventListener(
      "storage",
      syncLocale,
    );

    return () => {
      window.removeEventListener(
        PUBLIC_LOCALE_CHANGE_EVENT,
        syncLocale,
      );

      window.removeEventListener(
        "storage",
        syncLocale,
      );
    };
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    void fetchPublicTikTokVideos(
      12,
      controller.signal,
    )
      .then((videos) => {
        setTikTokVideos(videos);
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setTikTokVideos([]);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const isArabic = locale === "ar";

  const usingTikTok =
    tiktokVideos.length > 0;

  const reels = usingTikTok
    ? tiktokVideos
    : PUBLIC_SOCIAL_REELS;

  React.useEffect(() => {
    if (
      reels.length > 0 &&
      activeIndex >= reels.length
    ) {
      setActiveIndex(0);
    }
  }, [activeIndex, reels.length]);

  const activeReel =
    reels.length > 0
      ? reels[activeIndex]
      : null;

  const activeTikTokReel =
    usingTikTok && activeReel
      ? (activeReel as PublicTikTokVideo)
      : null;

  const activeLocalReel =
    !usingTikTok && activeReel
      ? (activeReel as (typeof PUBLIC_SOCIAL_REELS)[number])
      : null;

  React.useEffect(() => {
    endedTikTokVideoRef.current = null;

    setTikTokPlayerFailed(false);

  }, [activeTikTokReel?.id]);

  React.useEffect(() => {
    const handleTikTokMessage = (
      event: MessageEvent,
    ) => {
      if (
        event.source !==
        tiktokIframeRef.current?.contentWindow
      ) {
        return;
      }

      let eventOrigin: URL;

      try {
        eventOrigin = new URL(event.origin);
      } catch {
        return;
      }

      const isTikTokOrigin =
        eventOrigin.protocol === "https:" &&
        (
          eventOrigin.hostname === "tiktok.com" ||
          eventOrigin.hostname.endsWith(".tiktok.com")
        );

      if (!isTikTokOrigin) {
        return;
      }

      const payload = event.data as {
        "x-tiktok-player"?: boolean;
        type?: string;
        value?: unknown;
      };

      if (!payload?.["x-tiktok-player"]) {
        return;
      }

      if (payload.type === "onPlayerReady") {

        setTikTokPlayerFailed(false);

        sendTikTokPlayerCommand("mute");
        sendTikTokPlayerCommand("play");

        return;
      }

      if (payload.type === "onStateChange") {
        const state = Number(payload.value);

        if (state === 1) {

          setTikTokPlayerFailed(false);
          return;
        }

        if (state === 0) {

          const endedVideoId =
            activeTikTokReel?.id || null;

          if (
            endedVideoId &&
            reels.length > 1 &&
            endedTikTokVideoRef.current !==
              endedVideoId
          ) {
            endedTikTokVideoRef.current =
              endedVideoId;

            setActiveIndex((current) =>
              current >= reels.length - 1
                ? 0
                : current + 1,
            );
          }

          return;
        }

        if (state === -1 || state === 3) {
          return;
        }

        return;
      }

      if (payload.type === "onPlayerError") {
        const value =
          payload.value as
            | {
                errorCode?: number;
                errorType?: string;
              }
            | undefined;

        if (Number(value?.errorCode) === 3002) {

          setTikTokPlayerFailed(false);
          return;
        }

        setTikTokPlayerFailed(true);
        return;
      }

      if (payload.type === "onError") {

        setTikTokPlayerFailed(true);
      }
    };

    window.addEventListener(
      "message",
      handleTikTokMessage,
    );

    return () => {
      window.removeEventListener(
        "message",
        handleTikTokMessage,
      );
    };
  }, [
    activeTikTokReel?.id,
    reels.length,
    sendTikTokPlayerCommand,
  ]);

  const previous = React.useCallback(() => {
    if (reels.length < 2) {
      return;
    }

    setActiveIndex((current) =>
      current <= 0
        ? reels.length - 1
        : current - 1,
    );
  }, [reels.length]);

  const next = React.useCallback(() => {
    if (reels.length < 2) {
      return;
    }

    setActiveIndex((current) =>
      current >= reels.length - 1
        ? 0
        : current + 1,
    );
  }, [reels.length]);

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchStartY.current =
      event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    if (touchStartY.current === null) {
      return;
    }

    const endY =
      event.changedTouches[0]?.clientY ??
      touchStartY.current;

    const delta =
      touchStartY.current - endY;

    touchStartY.current = null;

    if (Math.abs(delta) < 44) {
      return;
    }

    if (delta > 0) {
      next();
    } else {
      previous();
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="
        relative
        mx-auto
        w-full
        max-w-[286px]

        sm:max-w-[294px] lg:max-w-[306px] xl:max-w-[314px]
      "
    >
      <div
        className="
          relative
          mx-auto
          w-full

          lg:pr-0

          xl:pr-0
        "
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="
            relative
            aspect-[9/19.5]
            w-full
            touch-pan-y before:absolute before:left-1/2 before:top-2 before:z-30 before:h-[17px] before:w-[68px] before:-translate-x-1/2 before:rounded-full before:bg-black before:shadow-[0_1px_0_rgba(255,255,255,0.06)] before:content-['']
            overflow-hidden
            rounded-[42px]
            border-[6px] border-[#202124] bg-[#101216] ring-1 ring-black/20
            shadow-[0_26px_58px_rgba(55,40,24,0.22),0_9px_22px_rgba(0,0,0,0.16)]

            sm:aspect-[9/19.5]

            lg:aspect-[9/19.5]
            lg:rounded-[43px]

            xl:aspect-[9/19.5]

            2xl:rounded-[44px]
          "
        >
          {activeTikTokReel ? (
            <>
              {activeTikTokReel.cover_image_url ? (
                <img
                  src={activeTikTokReel.cover_image_url}
                  alt=""
                  aria-hidden="true"
                  className="
                    absolute
                    inset-0
                    z-0
                    size-full
                    object-cover
                  "
                />
              ) : (
                <div className="absolute inset-0 z-0 bg-[#101216]" />
              )}

              {!tiktokPlayerFailed ? (
                <iframe
                  ref={tiktokIframeRef}
                  key={activeTikTokReel.id}
                  src={buildTikTokPlayerUrl(
                    activeTikTokReel.embed_link,
                  )}
                  title={
                    activeTikTokReel.title ||
                    activeTikTokReel.description ||
                    "Marilyn Clinics TikTok video"
                  }
                  loading="eager"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className={`
                    absolute
                    inset-0
                    z-[1]
                    size-full
                    border-0
                    bg-transparent
                    transition-opacity
                    duration-300
                    opacity-100
                  `}
                />
              ) : null}

              {tiktokPlayerFailed ? (
                <a
                  href={activeTikTokReel.share_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    absolute
                    inset-0
                    z-[2]
                    flex
                    items-center
                    justify-center
                  "
                  aria-label={
                    isArabic
                      ? "مشاهدة الفيديو على TikTok"
                      : "Watch this video on TikTok"
                  }
                >
                  <span
                    className="
                      flex
                      size-12
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-white/25
                      bg-black/35
                      text-white
                      backdrop-blur
                    "
                  >
                    <Play className="size-4 fill-white" />
                  </span>
                </a>
              ) : null}
            </>
          ) : activeLocalReel ? (
            <video
              key={activeLocalReel.id}
              src={activeLocalReel.videoSrc}
              poster={activeLocalReel.posterSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_12%,rgba(185,145,80,0.28),transparent_34%),linear-gradient(155deg,#392f24_0%,#171b24_47%,#0b111d_100%)]" />
          )}


        </div>

      </div>
    </div>
  );
}

export default HeroSocialReel;