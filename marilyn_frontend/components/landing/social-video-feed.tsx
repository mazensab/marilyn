"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Instagram,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_PATHS } from "@/lib/api/endpoints";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import { PUBLIC_SOCIAL_REELS } from "@/lib/public-content";
import { PUBLIC_SITE } from "@/lib/public-site-config";
import { cn } from "@/lib/utils";


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


export function SocialVideoFeed() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  const [activeIndex, setActiveIndex] =
    React.useState(0);

  const [muted, setMuted] =
    React.useState(true);

  const [tiktokVideos, setTikTokVideos] =
    React.useState<PublicTikTokVideo[]>([]);

  const touchStartY = React.useRef<number | null>(null);
  const wheelLocked = React.useRef(false);

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

  const hasReels = reels.length > 0;

  const activeReel = hasReels
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

  const copy = isArabic
    ? {
        eyebrow: "Marilyn Social",
        title: "شاهدي التجربة كما هي",
        description:
          "فيديو واحد في كل مرة، بتجربة عمودية مريحة مثل Reels. اسحبي داخل الفيديو للانتقال إلى المحتوى التالي.",
        follow: "تابعي Marilyn على Instagram",
        emptyTitle: "فيديوهات Marilyn قريبًا هنا",
        emptyDescription:
          "القسم جاهز للفيديو العمودي 9:16 وسيتم ربطه بمحتوى Marilyn الحقيقي بدون استخدام فيديوهات أو تقييمات وهمية.",
        next: "الفيديو التالي",
        previous: "الفيديو السابق",
        mute: "كتم الصوت",
        unmute: "تشغيل الصوت",
      }
    : {
        eyebrow: "Marilyn Social",
        title: "Experience Marilyn in motion",
        description:
          "One vertical video at a time, with a Reels-style experience. Swipe inside the player to move between videos.",
        follow: "Follow Marilyn on Instagram",
        emptyTitle: "Marilyn videos are coming here",
        emptyDescription:
          "The 9:16 vertical experience is ready and will be connected to real Marilyn content without fake videos or testimonials.",
        next: "Next video",
        previous: "Previous video",
        mute: "Mute",
        unmute: "Unmute",
      };

  const goNext = React.useCallback(() => {
    if (reels.length < 2) {
      return;
    }

    setActiveIndex((current) =>
      current >= reels.length - 1
        ? 0
        : current + 1,
    );
  }, [reels.length]);

  const goPrevious = React.useCallback(() => {
    if (reels.length < 2) {
      return;
    }

    setActiveIndex((current) =>
      current <= 0
        ? reels.length - 1
        : current - 1,
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

    if (Math.abs(delta) < 45) {
      return;
    }

    if (delta > 0) {
      goNext();
    } else {
      goPrevious();
    }
  };

  const handleWheel = (
    event: React.WheelEvent<HTMLDivElement>,
  ) => {
    if (
      reels.length < 2 ||
      Math.abs(event.deltaY) < 35 ||
      wheelLocked.current
    ) {
      return;
    }

    event.preventDefault();
    wheelLocked.current = true;

    if (event.deltaY > 0) {
      goNext();
    } else {
      goPrevious();
    }

    window.setTimeout(() => {
      wheelLocked.current = false;
    }, 500);
  };

  return (
    <section
      id="social"
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 size-[300px] rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-[360px] rounded-full bg-amber-100/35 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="order-2 flex justify-center lg:order-1">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className="
                relative
                aspect-[9/16]
                w-full
                max-w-[320px]
                overflow-hidden
                rounded-[34px]
                border-[6px]
                border-slate-950
                bg-slate-950
                shadow-[0_28px_80px_rgba(15,23,42,0.22)]
                sm:max-w-[350px]
              "
            >
              {activeReel ? (
                <>
                  {activeTikTokReel ? (
                    <>
                      {activeTikTokReel.cover_image_url ? (
                        <img
                          src={activeTikTokReel.cover_image_url}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : null}

                      <iframe
                        key={activeTikTokReel.id}
                        src={activeTikTokReel.embed_link}
                        title={
                          activeTikTokReel.title ||
                          activeTikTokReel.description ||
                          "Marilyn Clinics TikTok video"
                        }
                        loading="lazy"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="absolute inset-0 z-[1] size-full border-0 bg-black"
                      />
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
                  ) : null}

                  <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-transparent to-black/15" />

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] p-5 text-white">
                    <p className="text-sm font-semibold">
                      {activeTikTokReel
                        ? activeTikTokReel.title ||
                          activeTikTokReel.description ||
                          (isArabic
                            ? "فيديو من Marilyn Clinics"
                            : "A Marilyn Clinics video")
                        : activeLocalReel
                          ? isArabic
                            ? activeLocalReel.title.ar
                            : activeLocalReel.title.en
                          : ""}
                    </p>

                    {activeTikTokReel?.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-white/80">
                        {activeTikTokReel.description}
                      </p>
                    ) : activeLocalReel?.caption ? (
                      <p className="mt-2 text-xs leading-6 text-white/80">
                        {isArabic
                          ? activeLocalReel.caption.ar
                          : activeLocalReel.caption.en}
                      </p>
                    ) : null}
                  </div>

                  <div className="absolute left-3 top-3 z-[4] flex flex-col gap-2">
                    {!activeTikTokReel ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          setMuted((value) => !value)
                        }
                        className="size-9 rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/50"
                        aria-label={
                          muted
                            ? copy.unmute
                            : copy.mute
                        }
                      >
                        {muted ? (
                          <VolumeX className="size-4" />
                        ) : (
                          <Volume2 className="size-4" />
                        )}
                      </Button>
                    ) : null}

                    {reels.length > 1 ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={goPrevious}
                          className="size-9 rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/50"
                          aria-label={copy.previous}
                        >
                          <ArrowUp className="size-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={goNext}
                          className="size-9 rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/50"
                          aria-label={copy.next}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-7 text-center text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(202,157,73,0.38),_transparent_38%),linear-gradient(160deg,#101827_0%,#111827_52%,#241c16_100%)]" />

                  <div className="absolute -right-16 top-10 size-44 rounded-full border border-white/10" />
                  <div className="absolute -left-20 bottom-24 size-52 rounded-full border border-white/10" />

                  <div className="relative">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                      <Play className="size-6 fill-white" />
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                      <Sparkles className="size-4" />
                      Marilyn Reels
                    </div>

                    <h3 className="mt-4 text-2xl font-bold leading-tight">
                      {copy.emptyTitle}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {copy.emptyDescription}
                    </p>

                    <Button
                      asChild
                      variant="secondary"
                      className="mt-6 h-11 rounded-xl bg-white text-slate-950 hover:bg-white/90"
                    >
                      <a
                        href={PUBLIC_SITE.instagram.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="size-4" />
                        {copy.follow}
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/25" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur">
              <Instagram className="size-4 text-amber-700" />
              {copy.eyebrow}
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.25] tracking-tight sm:text-4xl lg:text-5xl">
              {copy.title}
            </h2>

            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-8 sm:text-lg">
              {copy.description}
            </p>

            <a
              href={PUBLIC_SITE.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground mt-6 inline-flex items-center gap-2 text-sm font-semibold transition hover:text-foreground"
            >
              <Instagram className="size-4" />
              {copy.follow}
              <span dir="ltr">
                {PUBLIC_SITE.instagram.handle}
              </span>
            </a>

            {hasReels ? (
              <div className="mt-6 flex items-center gap-2">
                {reels.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveIndex(index)
                    }
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeIndex
                        ? "w-8 bg-amber-600"
                        : "w-3 bg-muted-foreground/25",
                    )}
                    aria-label={`${index + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SocialVideoFeed;