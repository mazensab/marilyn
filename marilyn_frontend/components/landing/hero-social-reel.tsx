"use client";

import * as React from "react";
import {
  Heart,
  Instagram,
  MessageCircle,
  Music2,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_PATHS } from "@/lib/api/endpoints";
import { PUBLIC_SOCIAL_REELS } from "@/lib/public-content";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";


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

function formatSocialCount(value: number | null | undefined) {
  const number = Number(value || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return "—";
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000)
      .toFixed(number >= 10_000_000 ? 0 : 1)
      .replace(/\.0$/, "")}M`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000)
      .toFixed(number >= 100_000 ? 0 : 1)
      .replace(/\.0$/, "")}K`;
  }

  return new Intl.NumberFormat("en-US").format(number);
}


export function HeroSocialReel() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  const [activeIndex, setActiveIndex] =
    React.useState(0);

  const [muted, setMuted] =
    React.useState(true);

  const [tiktokVideos, setTikTokVideos] =
    React.useState<PublicTikTokVideo[]>([]);

  const [tiktokPlayerReady, setTikTokPlayerReady] =
    React.useState(false);

  const [tiktokPlayerFailed, setTikTokPlayerFailed] =
    React.useState(false);

  const [tiktokPlayerPlaying, setTikTokPlayerPlaying] =
    React.useState(false);

  const [tiktokAutoplayBlocked, setTikTokAutoplayBlocked] =
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

    setTikTokPlayerReady(false);
    setTikTokPlayerFailed(false);
    setTikTokPlayerPlaying(false);
    setTikTokAutoplayBlocked(false);
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
        setTikTokPlayerReady(true);
        setTikTokPlayerFailed(false);
        setTikTokPlayerPlaying(false);

        sendTikTokPlayerCommand("mute");
        sendTikTokPlayerCommand("play");

        return;
      }

      if (payload.type === "onStateChange") {
        const state = Number(payload.value);

        if (state === 1) {
          setTikTokPlayerPlaying(true);
          setTikTokAutoplayBlocked(false);
          setTikTokPlayerFailed(false);
          return;
        }

        if (state === 0) {
          setTikTokPlayerPlaying(false);

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

        setTikTokPlayerPlaying(false);
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
          setTikTokPlayerReady(true);
          setTikTokPlayerPlaying(false);
          setTikTokAutoplayBlocked(true);
          setTikTokPlayerFailed(false);
          return;
        }

        setTikTokPlayerPlaying(false);
        setTikTokPlayerFailed(true);
        return;
      }

      if (payload.type === "onError") {
        setTikTokPlayerPlaying(false);
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
                    ${
                      tiktokPlayerReady
                        ? "opacity-100"
                        : "opacity-0"
                    }
                  `}
                />
              ) : null}

              {!tiktokPlayerFailed &&
              tiktokPlayerReady &&
              (!tiktokPlayerPlaying ||
                tiktokAutoplayBlocked) ? (
                <button
                  type="button"
                  onClick={() => {
                    setTikTokAutoplayBlocked(false);
                    setTikTokPlayerFailed(false);

                    sendTikTokPlayerCommand("mute");
                    sendTikTokPlayerCommand("play");
                  }}
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    z-[8]
                    flex
                    size-14
                    -translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/25
                    bg-black/40
                    text-white
                    shadow-[0_12px_32px_rgba(0,0,0,0.28)]
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-black/55
                  "
                  aria-label={
                    isArabic
                      ? "تشغيل فيديو TikTok"
                      : "Play TikTok video"
                  }
                >
                  <Play className="ml-0.5 size-5 fill-white" />
                </button>
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
              muted={muted}
              playsInline
              preload="metadata"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_12%,rgba(185,145,80,0.28),transparent_34%),linear-gradient(155deg,#392f24_0%,#171b24_47%,#0b111d_100%)]" />
          )}

          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/78 via-black/5 to-black/20" />

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-7
              flex
              items-center
              justify-center
              gap-5
              text-[10px]
              font-medium
              text-white/55

              sm:text-[11px]
            "
          >
            <span>
              {isArabic
                ? "متابعة"
                : "Following"}
            </span>

            <span className="border-b-2 border-[#b48745] pb-1 text-white">
              {isArabic
                ? "لك"
                : "For You"}
            </span>
          </div>

          {!activeTikTokReel ? (
            <div className="absolute left-3 top-7 z-[4]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setMuted((value) => !value);
              }}
              className="
                size-8
                rounded-full
                bg-black/20
                text-white
                backdrop-blur
                hover:bg-black/35
              "
              aria-label={
                muted
                  ? isArabic
                    ? "تشغيل الصوت"
                    : "Unmute"
                  : isArabic
                    ? "كتم الصوت"
                    : "Mute"
              }
            >
              {muted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
            </div>
          ) : null}

          {!activeReel ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="
                  flex
                  size-12
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-white/10
                  text-white
                  backdrop-blur

                  lg:size-13
                "
              >
                <Play className="size-4 fill-white lg:size-[18px]" />
              </div>
            </div>
          ) : null}

          <div
            className="
              pointer-events-none
              absolute
              bottom-5
              left-4
              z-[3]
              right-14
              text-white

              lg:bottom-5
              lg:left-5
              lg:right-20
            "
          >
            <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <span dir="ltr">
                marilyn.clinics
              </span>

              <span className="size-1.5 rounded-full bg-sky-400" />
            </div>

            <p
              className="
                mt-2
                max-w-[240px]
                text-xs
                leading-5
                text-white/82

                sm:text-sm
                sm:leading-6

                lg:max-w-[360px]
              "
            >
              {activeTikTokReel
                ? activeTikTokReel.title ||
                  activeTikTokReel.description ||
                  (isArabic
                    ? "من أحدث فيديوهات Marilyn على TikTok."
                    : "From Marilyn's latest TikTok videos.")
                : activeLocalReel
                  ? isArabic
                    ? activeLocalReel.title.ar
                    : activeLocalReel.title.en
                  : isArabic
                    ? "هنا ستظهر فيديوهات Marilyn الحقيقية عند إضافتها."
                    : "Real Marilyn videos will appear here once added."}
            </p>

            <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70 sm:text-xs">
              <Music2 className="size-3.5" />
              Marilyn Clinics
            </div>
          </div>

          <div
            className="
              absolute
              bottom-5
              right-3
              z-[4]
              flex
              flex-col
              items-center
              gap-3
              text-white

              lg:right-4
            "
          >
            <a
              href={PUBLIC_SITE.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex
                size-9
                items-center
                justify-center
                rounded-full
                border
                border-white/20
                bg-white/10
                backdrop-blur

                lg:size-10
              "
              aria-label="Instagram"
            >
              <Instagram className="size-4" />
            </a>

            <button
              type="button"
              className="flex flex-col items-center gap-0.5"
              aria-label={
                isArabic
                  ? "إعجاب"
                  : "Like"
              }
            >
              <Heart className="size-6 fill-white" />
              <span className="text-[9px]">
                {activeTikTokReel
                  ? formatSocialCount(
                      activeTikTokReel.like_count,
                    )
                  : "—"}
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-0.5"
              aria-label={
                isArabic
                  ? "تعليق"
                  : "Comment"
              }
            >
              <MessageCircle className="size-6 fill-white" />
              <span className="text-[9px]">
                {activeTikTokReel
                  ? formatSocialCount(
                      activeTikTokReel.comment_count,
                    )
                  : "—"}
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-0.5"
              aria-label={
                isArabic
                  ? "مشاركة"
                  : "Share"
              }
            >
              <Share2 className="size-6 fill-white" />
              <span className="text-[9px]">
                {activeTikTokReel
                  ? formatSocialCount(
                      activeTikTokReel.share_count,
                    )
                  : "—"}
              </span>
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-2.5 left-1/2 z-[4] flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: Math.max(reels.length, 1) }, (_, item) => item).map((item) => (
              <span
                key={item}
                className={
                  item === activeIndex
                    ? "size-1.5 rounded-full bg-white"
                    : "size-1.5 rounded-full bg-white/35"
                }
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default HeroSocialReel;