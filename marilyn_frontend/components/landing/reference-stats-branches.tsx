"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  MapPin,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";

import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

const careSignals = [
  {
    icon: MapPin,
    ar: "اختيار الفرع الأنسب",
    en: "Choose your branch",
  },
  {
    icon: Stethoscope,
    ar: "اختيار الطبيب",
    en: "Choose your doctor",
  },
  {
    icon: CalendarClock,
    ar: "اختيار الموعد",
    en: "Choose your time",
  },
  {
    icon: UserRoundCheck,
    ar: "تجربة منظمة للمراجع",
    en: "Organized patient journey",
  },
];

export function ReferenceStatsBranches() {
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

  const ArrowIcon =
    ar
      ? ArrowLeft
      : ArrowRight;

  return (
    <section
      id="branches"
      dir={ar ? "rtl" : "ltr"}
      className="container py-4 sm:py-5 lg:py-6"
    >
      <div
        dir="ltr"
        className="
          grid
          gap-4

          lg:grid-cols-[1.6fr_0.9fr]
          lg:items-stretch
        "
      >
        <div
          dir={ar ? "rtl" : "ltr"}
          className="
            relative
            order-2
            grid
            grid-cols-2
            overflow-hidden
            rounded-[26px]
            border border-white/80
            bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
            shadow-[0_16px_42px_rgba(72,52,30,0.065),inset_0_1px_0_rgba(255,255,255,0.78)]
            before:pointer-events-none
            before:absolute
            before:-left-12
            before:-top-12
            before:size-40
            before:rounded-full
            before:border
            before:border-white/55
            before:content-['']
            after:pointer-events-none
            after:absolute
            after:-bottom-16
            after:-right-10
            after:size-44
            after:rounded-full
            after:border
            after:border-[#b48745]/15
            after:content-['']

            lg:order-1
            lg:grid-cols-4
          "
        >
          {careSignals.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.en}
                className="
                  relative
                  z-[1]
                  flex
                  min-h-[104px]
                  flex-col
                  items-center
                  justify-center
                  border-b
                  border-[#cbbda9]/35
                  px-3
                  py-4
                  text-center
                  text-[#10213b]

                  odd:border-e

                  lg:min-h-[126px]
                  lg:border-b-0
                  lg:border-e
                  lg:last:border-e-0
                "
              >
                <span
                  className="
                    mb-2.5
                    flex
                    size-9
                    items-center
                    justify-center
                    rounded-[12px]
                    border
                    border-[#cbbda9]/55
                    bg-white/65
                    text-[#a57b3d]
                    shadow-sm backdrop-blur
                  "
                >
                  <Icon className="size-[18px]" />
                </span>

                <p className="max-w-[145px] text-xs font-semibold leading-5 text-[#10213b]/85 sm:text-sm">
                  {ar
                    ? item.ar
                    : item.en}
                </p>
              </div>
            );
          })}
        </div>

        <div
          dir={ar ? "rtl" : "ltr"}
          className="
            relative
            order-1
            overflow-hidden
            rounded-[26px]
            border
            border-white/80
            bg-[linear-gradient(115deg,rgba(255,255,255,0.42)_0%,rgba(255,249,240,0.30)_100%)]
            px-6
            py-5
            shadow-[0_16px_42px_rgba(72,52,30,0.06),inset_0_1px_0_rgba(255,255,255,0.72)]
            backdrop-blur-2xl

            sm:px-8

            lg:order-2
            lg:min-h-[126px]
          "
        >
          <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full border border-[#b48745]/10" />

          <div className="pointer-events-none absolute -bottom-20 -right-16 size-52 rounded-full bg-[#d9b979]/12 blur-2xl" />

          <div className="relative flex h-full flex-col justify-between gap-5">
            <div>
              <div
                className="
                  mb-2.5
                  flex
                  size-9
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
                <Building2 className="size-[18px]" />
              </div>

              <p className="text-sm font-semibold text-[#b48745]">
                {ar
                  ? "فروع Marilyn Clinics"
                  : "Marilyn Clinics Branches"}
              </p>

              <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-[#10213b] sm:text-2xl">
                {ar
                  ? "رعاية أقرب إليك"
                  : "Care closer to you"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#667184]">
                {ar
                  ? "يمكنك اختيار الفرع الأنسب لك ضمن رحلة الحجز مع تجربة موحدة وواضحة في كل خطوة."
                  : "Choose the branch that suits you during booking, with one consistent and clear experience at every step."}
              </p>
            </div>

            <Link
              href="/branches"
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#a57b3d]
                transition-colors
                hover:text-[#7e5925]
              "
            >
              {ar
                ? "عرض جميع الفروع"
                : "View all branches"}

              <ArrowIcon className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
