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
  Users,
} from "lucide-react";

import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

const stats = [
  {
    icon: MapPin,
    value: "—",
    ar: "فروع",
    en: "Branches",
  },
  {
    icon: Stethoscope,
    value: "—",
    ar: "طبيب متخصص",
    en: "Specialist Doctors",
  },
  {
    icon: Users,
    value: "—",
    ar: "مراجع",
    en: "Patients",
  },
  {
    icon: CalendarClock,
    value: "—",
    ar: "سنوات من الخبرة",
    en: "Years of Experience",
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

  const statsPanel = (
    <div
      className="
        order-2
        grid
        grid-cols-2
        overflow-hidden
        rounded-[24px]
        bg-[#10213b]
        shadow-[0_18px_50px_rgba(16,33,59,0.16)]

        lg:order-1
        lg:grid-cols-4
      "
    >
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.en}
            className="
              relative
              flex
              min-h-[126px]
              flex-col
              items-center
              justify-center
              px-3
              py-5
              text-center
              text-white

              border-b
              border-white/10
              odd:border-e

              lg:min-h-[154px]
              lg:border-b-0
              lg:border-e
              lg:last:border-e-0
            "
          >
            <Icon
              className="
                mb-2
                size-6
                text-[#d89a35]
              "
            />

            <div
              className="
                text-3xl
                font-bold
                tabular-nums
                text-[#dda145]
              "
            >
              {item.value}
            </div>

            <p
              className="
                mt-1
                text-xs
                font-medium
                text-white/80

                sm:text-sm
              "
            >
              {ar
                ? item.ar
                : item.en}
            </p>
          </div>
        );
      })}
    </div>
  );

  const branchesPanel = (
    <div
      className="
        relative
        order-1
        overflow-hidden
        rounded-[24px]
        border
        border-black/[0.05]
        bg-[#fffaf3]
        px-6
        py-6
        shadow-[0_12px_34px_rgba(15,23,42,0.04)]

        sm:px-8
        lg:order-2
        lg:min-h-[154px]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -left-20
          -top-20
          size-56
          rounded-full
          border
          border-[#c9871d]/10
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          -right-16
          size-52
          rounded-full
          bg-[#d9b06d]/10
          blur-2xl
        "
      />

      <div
        className="
          relative
          flex
          h-full
          flex-col
          justify-between
          gap-5
        "
      >
        <div>
          <div
            className="
              mb-3
              flex
              size-10
              items-center
              justify-center
              rounded-full
              bg-white
              text-[#c9871d]
              shadow-sm
            "
          >
            <Building2 className="size-5" />
          </div>

          <p
            className="
              text-sm
              font-bold
              text-[#c9871d]
            "
          >
            {ar
              ? "فروع Marilyn Clinics"
              : "Marilyn Clinics Branches"}
          </p>

          <h3
            className="
              mt-1.5
              text-xl
              font-bold
              text-[#10213b]

              sm:text-2xl
            "
          >
            {ar
              ? "رعاية أقرب إليك"
              : "Care closer to you"}
          </h3>

          <p
            className="
              mt-2
              max-w-md
              text-sm
              leading-7
              text-[#5d6878]
            "
          >
            {ar
              ? "استعرضي مواقع الفروع واختاري الفرع الأنسب لك عند الحجز."
              : "Explore our locations and choose the branch that suits you best when booking."}
          </p>
        </div>

        <Link
          href="/#branches"
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            text-sm
            font-bold
            text-[#b87515]
            transition-colors
            hover:text-[#965f10]
          "
        >
          {ar
            ? "عرض جميع الفروع"
            : "View all branches"}

          <ArrowIcon className="size-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <section
      dir={ar ? "rtl" : "ltr"}
      className="
        container
        py-4

        sm:py-6
      "
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
        <div dir={ar ? "rtl" : "ltr"}>
          {statsPanel}
        </div>

        <div dir={ar ? "rtl" : "ltr"}>
          {branchesPanel}
        </div>
      </div>
    </section>
  );
}