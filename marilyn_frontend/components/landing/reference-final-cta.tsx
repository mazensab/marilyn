"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

export function ReferenceFinalCta() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  React.useEffect(() => {
    const sync = () => {
      setLocale(readPublicLocale());
    };

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

  const features = ar
    ? [
        "اختيار الخدمة بسهولة",
        "اختيار الفرع والطبيب",
        "موعد مناسب لك",
      ]
    : [
        "Choose your service",
        "Select branch and doctor",
        "Find a suitable time",
      ];

  return (
    <section className="container py-5 pb-8 sm:py-6 sm:pb-9">
      <div
        dir={ar ? "rtl" : "ltr"}
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-white/80
          bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
          shadow-[0_16px_42px_rgba(72,52,30,0.065),inset_0_1px_0_rgba(255,255,255,0.72)]
        "
      >
        <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full border border-white/55" />

        <div className="pointer-events-none absolute -bottom-16 -right-10 size-44 rounded-full border border-[#b48745]/15" />

        <div
          className="
            relative
            grid
            items-center
            gap-7
            px-5
            py-6

            sm:px-8
            sm:py-7

            lg:grid-cols-[1fr_260px]
            lg:gap-8
            lg:px-10
            lg:py-7

            xl:grid-cols-[1fr_300px]
            xl:px-12
          "
        >
          <div className="text-center lg:text-start">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#b48745]">
              <Sparkles className="size-4" />
              Marilyn Clinics
            </div>

            <h2 className="mt-2.5 text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#10213b] sm:text-3xl xl:text-[34px]">
              {ar
                ? "جاهزة لبدء رحلة العناية"
                : "Ready to begin your care journey?"}
            </h2>

            <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-6 text-[#667184] sm:text-base lg:mx-0">
              {ar
                ? "ابدئي باختيار الخدمة ثم الفرع والطبيب والموعد المناسب لك ضمن تجربة حجز واضحة وسهلة."
                : "Start by choosing your service, then your branch, doctor, and preferred time through a clear and simple booking experience."}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#6d6154] sm:text-sm"
                >
                  <span
                    className="
                      flex
                      size-5
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#b89561]/30
                      bg-[#d9b979]/20
                      text-[#9d743b]
                    "
                  >
                    <Check className="size-3" />
                  </span>

                  {feature}
                </span>
              ))}
            </div>

            <Button
              asChild
              className="
                mt-5
                h-11
                rounded-full
                border
                border-[#b58c4d]/40
                bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                px-6
                font-semibold
                text-[#2e251a]
                shadow-[0_15px_34px_rgba(168,121,56,0.24),inset_0_1px_0_rgba(255,255,255,0.4)]
                transition
                hover:brightness-[1.03]
                hover:shadow-[0_18px_42px_rgba(168,121,56,0.30)]

                sm:h-12
                sm:px-7
              "
            >
              <Link href="/book">
                <CalendarDays className="size-4" />

                {ar
                  ? "احجزي موعدك الآن"
                  : "Book your appointment"}
              </Link>
            </Button>
          </div>

          <div className="relative mx-auto hidden h-[165px] w-full max-w-[300px] items-center justify-center lg:flex">
            <div className="absolute inset-x-4 bottom-2 h-16 rounded-[50%] bg-[#b48745]/10 blur-2xl" />

            <div
              className="
                relative
                flex
                h-[145px]
                w-[225px]
                items-center
                justify-center
                overflow-hidden
                rounded-[34px_34px_22px_22px]
                border
                border-white/80
                bg-white/62
                shadow-[0_14px_38px_rgba(72,52,30,0.085)]
                backdrop-blur
              "
            >
              <div className="absolute -right-10 -top-12 size-36 rounded-full border border-[#b48745]/12" />

              <div className="absolute -bottom-16 -left-12 size-40 rounded-full bg-[#d9b979]/16" />

              <Image
                src="/logo/marilyn.svg"
                alt="Marilyn Clinics"
                width={190}
                height={60}
                unoptimized
                className="relative h-auto w-[132px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}