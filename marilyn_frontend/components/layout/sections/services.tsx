import { existsSync } from "node:fs";
import path from "node:path";

import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import SectionContainer from "@/components/layout/section-container";
import { PUBLIC_MEDICAL_SERVICES } from "@/lib/public-content";
import { normalizePublicLocale } from "@/lib/public-locale";

function publicAssetExists(src: string) {
  if (!src.startsWith("/")) {
    return false;
  }

  const normalizedSrc = src
    .replace(/^\/+/, "")
    .replace(/\//g, path.sep);

  return existsSync(
    path.join(
      process.cwd(),
      "public",
      normalizedSrc,
    ),
  );
}

export async function ServicesSection() {
  const cookieStore = await cookies();

  const locale = normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );

  const isArabic = locale === "ar";

  const ArrowIcon =
    isArabic
      ? ArrowLeft
      : ArrowRight;

  return (
    <SectionContainer id="services">
      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="py-4 sm:py-6 lg:py-8"
      >
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-sm font-bold text-[#c9871d] sm:text-base">
            {isArabic
              ? "خدماتنا المميزة"
              : "Our Featured Services"}
          </p>

          <h2 className="mt-2 text-3xl font-bold leading-tight text-[#10213b] sm:text-4xl">
            {isArabic
              ? "خدمات متكاملة للعناية بك"
              : "Complete care designed for you"}
          </h2>

          <div className="mx-auto mt-4 h-px w-20 bg-[#c9871d]/60" />
        </div>

        <div
          className="
            -mx-4
            flex
            snap-x
            snap-mandatory
            gap-4
            overflow-x-auto
            px-4
            pb-3
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden

            sm:mx-0
            sm:grid
            sm:grid-cols-2
            sm:overflow-visible
            sm:px-0
            sm:pb-0

            lg:grid-cols-3

            xl:grid-cols-5
          "
        >
          {PUBLIC_MEDICAL_SERVICES.map(
            (service) => {
              const Icon = service.icon;

              const hasImage =
                publicAssetExists(
                  service.imageSrc,
                );

              return (
                <article
                  key={service.id}
                  className="
                    group
                    flex
                    w-[82vw]
                    max-w-[320px]
                    shrink-0
                    snap-center
                    flex-col
                    overflow-hidden
                    rounded-[18px]
                    border
                    border-black/[0.06]
                    bg-white
                    shadow-[0_8px_28px_rgba(15,23,42,0.045)]
                    transition
                    duration-300

                    hover:-translate-y-1
                    hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]

                    sm:w-auto
                    sm:max-w-none
                  "
                >
                  <div
                    className="
                      relative
                      aspect-[4/3]
                      overflow-hidden
                      bg-[#eee2d2]
                    "
                  >
                    {hasImage ? (
                      <>
                        <Image
                          src={service.imageSrc}
                          alt={
                            isArabic
                              ? service.title.ar
                              : service.title.en
                          }
                          fill
                          sizes="
                            (max-width: 639px) 82vw,
                            (max-width: 1023px) 50vw,
                            (max-width: 1279px) 33vw,
                            20vw
                          "
                          className="
                            object-cover
                            transition
                            duration-500
                            group-hover:scale-[1.03]
                          "
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#f5eadb_0%,#e7d5bb_52%,#d8c2a3_100%)]">
                        <div className="absolute -left-12 -top-12 size-40 rounded-full border border-white/45" />

                        <div className="absolute -bottom-16 -right-10 size-44 rounded-full border border-[#bd7b18]/10" />

                        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-[#b87515]">
                          <div
                            className="
                              flex
                              size-14
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-white/70
                              bg-white/65
                              shadow-sm
                              backdrop-blur
                            "
                          >
                            <Icon className="size-6" />
                          </div>

                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9d7951]">
                            Marilyn Clinics
                          </span>
                        </div>

                        <Sparkles className="absolute bottom-4 left-4 size-4 text-white/55" />
                      </div>
                    )}

                    <div
                      className="
                        absolute
                        left-3
                        top-3
                        flex
                        size-10
                        items-center
                        justify-center
                        rounded-full
                        bg-white/90
                        text-[#bd7b18]
                        shadow-sm
                        backdrop-blur
                      "
                    >
                      <Icon className="size-[18px]" />
                    </div>

                    <span
                      className="
                        absolute
                        right-3
                        top-3
                        rounded-full
                        border
                        border-[#d9a94e]/35
                        bg-white/90
                        px-3
                        py-1
                        text-[11px]
                        font-semibold
                        text-[#b87515]
                        backdrop-blur
                      "
                    >
                      {isArabic
                        ? service.badge.ar
                        : service.badge.en}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="text-base font-bold leading-6 text-[#10213b] sm:text-[17px]">
                      {isArabic
                        ? service.title.ar
                        : service.title.en}
                    </h3>

                    <p className="mt-2 flex-1 text-sm leading-6 text-[#596578]">
                      {isArabic
                        ? service.shortDescription.ar
                        : service.shortDescription.en}
                    </p>

                    <Link
                      href={`/services/${service.slug}`}
                      className="
                        mt-4
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-[#bd7b18]
                        transition
                        hover:text-[#9f6510]
                      "
                    >
                      {isArabic
                        ? "اعرف المزيد"
                        : "Learn more"}

                      <ArrowIcon className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>
    </SectionContainer>
  );
}