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
import { PUBLIC_SOCIAL_REELS } from "@/lib/public-content";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";

export function HeroSocialReel() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  const [activeIndex, setActiveIndex] =
    React.useState(0);

  const [muted, setMuted] =
    React.useState(true);

  const touchStartY =
    React.useRef<number | null>(null);

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

  const isArabic = locale === "ar";
  const reels = PUBLIC_SOCIAL_REELS;

  const activeReel =
    reels.length > 0
      ? reels[activeIndex]
      : null;

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
        max-w-[252px]

        lg:max-w-[258px]
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
            rounded-[38px]
            border-[6px] border-[#202124] bg-[#101216] ring-1 ring-black/20
            shadow-[0_26px_58px_rgba(55,40,24,0.22),0_9px_22px_rgba(0,0,0,0.16)]

            sm:aspect-[9/19.5]

            lg:aspect-[9/19.5]
            lg:rounded-[39px]

            xl:aspect-[9/19.5]

            2xl:rounded-[39px]
          "
        >
          {activeReel ? (
            <video
              key={activeReel.id}
              src={activeReel.videoSrc}
              poster={activeReel.posterSrc}
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/20" />

          <div
            className="
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

          <div className="absolute left-3 top-7">
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
              absolute
              bottom-5
              left-4
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
              {activeReel
                ? isArabic
                  ? activeReel.title.ar
                  : activeReel.title.en
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
                —
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
                —
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
                —
              </span>
            </button>
          </div>

          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: Math.max(reels.length, 1) }, (_, item) => item).map((item) => (
              <span
                key={item}
                className={
                  item === 0
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