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
    <section
      className="
        container
        py-4
        pb-7

        sm:py-5
        sm:pb-8

        lg:py-6
        lg:pb-8
      "
    >
      <div
        dir={ar ? "rtl" : "ltr"}
        className="
          relative
          overflow-hidden
          rounded-[26px]
          border
          border-[#c9871d]/12
          bg-[#fff8ee]
          shadow-[0_14px_40px_rgba(15,23,42,0.035)]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -left-20
            -top-24
            size-72
            rounded-full
            border
            border-[#c9871d]/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-28
            right-[18%]
            size-72
            rounded-full
            bg-[#d8b16e]/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            grid
            items-center
            gap-7
            px-5
            py-7

            sm:px-8
            sm:py-8

            lg:grid-cols-[1fr_260px]
            lg:gap-8
            lg:px-10
            lg:py-8

            xl:grid-cols-[1fr_300px]
            xl:px-12
          "
        >
          <div
            className="
              text-center

              lg:text-start
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-bold
                text-[#c9871d]
              "
            >
              <Sparkles className="size-4" />
              Marilyn Clinics
            </div>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                leading-tight
                text-[#10213b]

                sm:text-3xl

                xl:text-[34px]
              "
            >
              {ar
                ? "جاهزة لتجربة أفضل؟"
                : "Ready for a better experience?"}
            </h2>

            <p
              className="
                mx-auto
                mt-3
                max-w-2xl
                text-sm
                leading-7
                text-[#526070]

                sm:text-base

                lg:mx-0
              "
            >
              {ar
                ? "ابدئي رحلة العناية باختيار الخدمة والفرع والطبيب والموعد المناسب لك بخطوات واضحة وسهلة."
                : "Start your care journey by choosing your service, branch, doctor, and the appointment that suits you in a simple experience."}
            </p>

            <div
              className="
                mt-5
                flex
                flex-wrap
                justify-center
                gap-x-5
                gap-y-2

                lg:justify-start
              "
            >
              {features.map((feature) => (
                <span
                  key={feature}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-xs
                    font-medium
                    text-[#6a604f]

                    sm:text-sm
                  "
                >
                  <span
                    className="
                      flex
                      size-5
                      items-center
                      justify-center
                      rounded-full
                      bg-[#c9871d]/10
                      text-[#b87515]
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
                mt-6
                h-11
                rounded-full
                bg-[#c9871d]
                px-6
                text-white
                shadow-[0_10px_24px_rgba(201,135,29,0.18)]
                hover:bg-[#b87917]

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

          <div
            className="
              relative
              mx-auto
              hidden
              h-[190px]
              w-full
              max-w-[300px]
              items-center
              justify-center

              lg:flex
            "
          >
            <div
              className="
                absolute
                inset-x-4
                bottom-2
                h-16
                rounded-[50%]
                bg-[#c9871d]/8
                blur-2xl
              "
            />

            <div
              className="
                relative
                flex
                h-[165px]
                w-[240px]
                items-center
                justify-center
                overflow-hidden
                rounded-[40px_40px_24px_24px]
                border
                border-white/80
                bg-white/60
                shadow-[0_18px_50px_rgba(83,63,29,0.08)]
                backdrop-blur
              "
            >
              <div
                className="
                  absolute
                  -right-10
                  -top-12
                  size-36
                  rounded-full
                  border
                  border-[#c9871d]/10
                "
              />

              <div
                className="
                  absolute
                  -bottom-16
                  -left-12
                  size-40
                  rounded-full
                  bg-[#e8c98e]/15
                "
              />

              <Image
                src="/hero logo.png"
                alt="Marilyn Clinics"
                width={1200}
                height={420}
                unoptimized
                className="
                  relative
                  h-auto
                  w-[155px]
                  object-contain
                "
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}