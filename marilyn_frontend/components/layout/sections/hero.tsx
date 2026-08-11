import { cookies } from "next/headers";
import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
} from "lucide-react";

import { HeroSocialReel } from "@/components/landing/hero-social-reel";
import { Button } from "@/components/ui/button";
import { normalizePublicLocale } from "@/lib/public-locale";

export async function HeroSection() {
  const cookieStore = await cookies();

  const locale = normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );

  const isArabic = locale === "ar";

  const copy = isArabic
    ? {
        eyebrow:
          "جمالك .. هو اختيارك",
        title:
          "رعاية طبية متكاملة لجمال طبيعي واثق",
        description:
          "نقدم لك أحدث تقنيات العناية العلاجية والتجميلية بإشراف نخبة من الأطباء المتخصصين.",
        booking:
          "احجز موعدك الآن",
        services:
          "استكشف الخدمات",
      }
    : {
        eyebrow:
          "Your beauty. Your choice.",
        title:
          "Integrated medical care for naturally confident beauty",
        description:
          "We provide advanced therapeutic and aesthetic care under the supervision of specialized medical professionals.",
        booking:
          "Book now",
        services:
          "Explore services",
      };

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative -mt-[78px] min-h-[620px] overflow-x-clip bg-[radial-gradient(circle_at_77%_15%,rgba(255,255,255,0.92),transparent_27%),radial-gradient(circle_at_11%_42%,rgba(191,149,88,0.18),transparent_29%),radial-gradient(circle_at_89%_76%,rgba(153,126,95,0.12),transparent_25%),linear-gradient(120deg,#f7f0e8_0%,#eee2d3_49%,#e2d0b9_100%)] pt-[78px]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 bottom-[-150px] size-[400px] rounded-full bg-[#a98b63]/16 blur-3xl" />

        <div className="absolute right-[30%] top-[-120px] size-[340px] rounded-full bg-[#d9b979]/14 blur-3xl" />

        <div className="absolute left-[4%] top-[24%] h-[330px] w-[150px] -rotate-12 rounded-[50%] bg-[#8d7354]/[0.045] blur-2xl" />

        <div className="absolute bottom-[4%] right-[34%] size-[250px] rounded-full bg-white/14 blur-3xl" />

        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(to_top,rgba(137,108,76,0.055),transparent)]" />
      </div>

      <div
        className="
          container
          relative
          px-4
          py-7

          sm:px-6
          sm:py-9

          lg:px-8
          lg:py-2

          xl:py-3

          2xl:py-4
        "
      >
        <div
          className="
            grid
            min-w-0
            items-center
            gap-9

            lg:grid-cols-[0.86fr_1.14fr]
            lg:gap-9

            xl:grid-cols-[0.86fr_1.14fr]
            xl:gap-10

            2xl:gap-10
          "
        >
          <div
            className="
              order-2
              min-w-0

              lg:order-1
            "
          >
            <div className="relative mx-auto flex w-full max-w-[420px] justify-center pb-6 pt-1 lg:pt-4 xl:pt-3">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-[44%] size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b89561]/18 bg-white/[0.08]"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 h-[54px] w-[286px] -translate-x-1/2 rounded-[50%] bg-[#7f674e]/14 blur-xl"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-3 left-1/2 h-[36px] w-[248px] -translate-x-1/2 rounded-[50%] border border-white/40 bg-[linear-gradient(180deg,rgba(244,231,214,0.92),rgba(182,151,116,0.44))] shadow-[0_18px_36px_rgba(83,61,38,0.12)]"
              />

              <div className="relative z-10 w-full max-w-[258px] shrink-0">
                <HeroSocialReel />
              </div>
            </div>
          </div>

          <div
            className="
              order-1
              min-w-0
              text-center

              lg:order-2
              lg:-translate-y-8
              lg:text-start

              xl:-translate-y-10
            "
          >
            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#a57b3d]

                sm:text-base

                xl:text-lg
              "
            >
              <Sparkles className="size-4" />
              {copy.eyebrow}
            </div>

            <h1
              className="
                mx-auto
                max-w-[600px]
                text-[33px]
                font-semibold
                leading-[1.14]
                tracking-[-0.035em]
                text-[#10213b]

                min-[390px]:text-[36px]

                sm:text-[43px]

                lg:mx-0
                lg:max-w-[550px]
                lg:text-[39px]

                xl:max-w-[590px]
                xl:text-[43px]

                2xl:max-w-[610px]
                2xl:text-[47px]
              "
            >
              {copy.title}
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-[520px]
                text-[15px]
                leading-7
                text-[#48566a]

                sm:text-base
                sm:leading-8

                lg:mx-0
                lg:max-w-[500px]

                xl:max-w-[540px]
                xl:text-[17px]
              "
            >
              {copy.description}
            </p>

            <div
              className="
                mt-6
                flex
                flex-col
                items-stretch
                justify-center
                gap-3

                min-[430px]:flex-row
                min-[430px]:items-center

                lg:justify-start

                xl:mt-7
              "
            >
              <Button
                asChild
                className="
                  h-11
                  rounded-full
                  border
                  border-[#b58c4d]/40
                  bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                  px-6
                  font-semibold
                  text-[#2e251a]
                  shadow-[0_12px_28px_rgba(168,121,56,0.22),inset_0_1px_0_rgba(255,255,255,0.38)]
                  transition
                  hover:brightness-[1.03]
                  hover:shadow-[0_15px_34px_rgba(168,121,56,0.28)]

                  sm:h-12
                  sm:px-7
                "
              >
                <Link href="/book">
                  <CalendarDays className="size-4" />
                  {copy.booking}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="
                  h-11
                  rounded-full
                  border-[#cbbda9]/60
                  bg-white/70
                  px-6
                  font-semibold
                  text-[#4b443c]
                  shadow-sm
                  transition
                  hover:border-[#b89b69]
                  hover:bg-white/90
                  hover:text-[#7e5925]

                  sm:h-12
                  sm:px-7
                "
              >
                <Link href="/#services">
                  {copy.services}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}