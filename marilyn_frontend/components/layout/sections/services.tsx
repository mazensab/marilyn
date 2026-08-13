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
        className="-mt-2 py-7 sm:-mt-3 sm:py-9 lg:-mt-4 lg:py-10"
      >
        <div className="mx-auto mb-7 max-w-2xl text-center sm:mb-8 lg:mb-9">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#b48745] sm:text-base">
            <Sparkles className="size-4" />

            <span>
              {isArabic
                ? "خدماتنا المميزة"
                : "Our Featured Services"}
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-semibold leading-[1.18] tracking-[-0.035em] text-[#10213b] sm:text-4xl lg:text-[42px]">
            {isArabic
              ? "رعاية متكاملة صممت حولك"
              : "Complete care designed around you"}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#667184] sm:text-[15px]">
            {isArabic
              ? "اختاري الخدمة المناسبة لك ضمن تجربة طبية هادئة تبدأ بالتقييم وتستمر بخطة واضحة."
              : "Discover care that starts with assessment and continues through a clear, considered treatment journey."}
          </p>

          <div className="mx-auto mt-5 h-px w-24 bg-[linear-gradient(90deg,transparent,#bd9250,transparent)]" />
        </div>

        <div
          className="
            -mx-4
            flex
            snap-x
            snap-mandatory
            gap-5
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
                    rounded-[26px]
                    border
                    border-white/80
                    bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,250,244,0.68)_100%)]
                    shadow-[0_16px_42px_rgba(72,52,30,0.065),inset_0_1px_0_rgba(255,255,255,0.78)]
                    backdrop-blur-2xl
                    transition
                    duration-300

                    hover:-translate-y-1
                    hover:border-[#c4a46f]/60
                    hover:shadow-[0_22px_52px_rgba(72,52,30,0.105)]

                    sm:w-auto
                    sm:max-w-none
                  "
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-[#eee2d2]">
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
                            group-hover:scale-[1.035]
                          "
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#342719]/25 via-transparent to-white/5" />
                      </>
                    ) : (
                      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]">
                        <div className="absolute -left-12 -top-12 size-40 rounded-full border border-white/55" />

                        <div className="absolute -bottom-16 -right-10 size-44 rounded-full border border-[#b48745]/15" />

                        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-[#a57b3d]">
                          <div
                            className="
                              flex
                              size-14
                              items-center
                              justify-center
                              rounded-[18px]
                              border
                              border-[#cbbda9]/55
                              bg-white/65
                              shadow-sm
                              backdrop-blur
                            "
                          >
                            <Icon className="size-6" />
                          </div>

                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#78664e]">
                            Marilyn Clinics
                          </span>
                        </div>

                        <Sparkles className="absolute bottom-4 left-4 size-4 text-white/65" />
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
                        rounded-[14px]
                        border
                        border-[#cbbda9]/55
                        bg-white/90
                        text-[#a57b3d]
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
                        border-[#b89561]/35
                        bg-white/90
                        px-3
                        py-1
                        text-[11px]
                        font-semibold
                        text-[#8b6938]
                        shadow-sm
                        backdrop-blur
                      "
                    >
                      {isArabic
                        ? service.badge.ar
                        : service.badge.en}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
                    <h3 className="text-base font-semibold leading-6 text-[#10213b] sm:text-[17px]">
                      {isArabic
                        ? service.title.ar
                        : service.title.en}
                    </h3>

                    <p className="mt-2 flex-1 text-[13px] leading-6 text-[#667184] sm:text-sm">
                      {isArabic
                        ? service.shortDescription.ar
                        : service.shortDescription.en}
                    </p>

                    <Link
                      href={`/services/${service.slug}`}
                      className="
                        mt-3.5
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-[#a57b3d]
                        transition
                        hover:text-[#7e5925]
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