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
    <section className="container py-5 sm:py-7">
      <div
        dir={ar ? "rtl" : "ltr"}
        className="
          grid
          overflow-hidden
          rounded-[20px]
          border
          border-black/[0.055]
          bg-white
          shadow-[0_8px_26px_rgba(15,23,42,0.035)]

          grid-cols-2
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
                min-h-[92px]
                items-center
                justify-center
                gap-3
                border-b
                border-black/[0.05]
                px-4
                py-5

                odd:border-e

                lg:min-h-[108px]
                lg:border-b-0
                lg:border-e
                lg:last:border-e-0
              "
            >
              <Icon className="size-6 shrink-0 text-[#c9871d] lg:size-7" />

              <p className="text-center text-sm font-bold text-[#10213b] sm:text-base">
                {ar ? item.ar : item.en}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}