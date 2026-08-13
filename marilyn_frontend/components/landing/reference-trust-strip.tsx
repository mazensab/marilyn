"use client";

import * as React from "react";
import {
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

const trustItems = [
  {
    icon: Sparkles,
    ar: "نتائج مدروسة",
    en: "Thoughtful Results",
  },
  {
    icon: BadgeCheck,
    ar: "تقنيات حديثة",
    en: "Modern Technology",
  },
  {
    icon: HeartHandshake,
    ar: "رعاية متخصصة",
    en: "Specialized Care",
  },
  {
    icon: ShieldCheck,
    ar: "أمان وخصوصية",
    en: "Safety & Privacy",
  },
];

export function ReferenceTrustStrip() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  React.useEffect(() => {
    const sync = () =>
      setLocale(readPublicLocale());

    sync();

    window.addEventListener(
      PUBLIC_LOCALE_CHANGE_EVENT,
      sync,
    );

    window.addEventListener(
      "storage",
      sync,
    );

    return () => {
      window.removeEventListener(
        PUBLIC_LOCALE_CHANGE_EVENT,
        sync,
      );

      window.removeEventListener(
        "storage",
        sync,
      );
    };
  }, []);

  const ar = locale === "ar";

  return (
    <section className="container py-3 sm:py-4 lg:py-5">
      <div
        dir={ar ? "rtl" : "ltr"}
        className="
          grid
          grid-cols-2
          overflow-hidden
          rounded-[24px]
          border
          border-white/80
          bg-[linear-gradient(115deg,rgba(255,255,255,0.42)_0%,rgba(255,249,240,0.30)_100%)]
          shadow-[0_16px_42px_rgba(72,52,30,0.06),inset_0_1px_0_rgba(255,255,255,0.72)]
          backdrop-blur-2xl

          lg:grid-cols-4
        "
      >
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.en}
              className="
                flex
                min-h-[80px]
                items-center
                justify-center
                gap-2.5
                border-b
                border-[#cbbda9]/35
                px-4
                py-3

                odd:border-e

                lg:min-h-[88px]
                lg:border-b-0
                lg:border-e
                lg:last:border-e-0
              "
            >
              <span
                className="
                  flex
                  size-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-[12px]
                  border
                  border-[#cbbda9]/55
                  bg-white/60
                  text-[#a57b3d]
                  shadow-sm
                "
              >
                <Icon className="size-[18px]" />
              </span>

              <p className="text-center text-sm font-semibold text-[#10213b] sm:text-base">
                {ar ? item.ar : item.en}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}