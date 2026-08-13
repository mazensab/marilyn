import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Heart,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
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
        titlePrimary: "جمالك الطبيعي",
        titleGold: "رعايتنا رسالة",
        description:
          "تجربة عناية متكاملة تجمع بين أحدث التقنيات والخبرة الطبية لتمنحك أفضل النتائج.",
        booking: "احجزي موعدك الآن",
        video: "شاهد الفيديو",
        featureDoctors: "أطباء متخصصون",
        featureTechnology: "تقنيات حديثة",
        featureCare: "عناية مخصصة",
      }
    : {
        titlePrimary: "Your natural beauty",
        titleGold: "Our care is a commitment",
        description:
          "A complete care experience combining modern technology with medical expertise to help you achieve the best results.",
        booking: "Book your appointment",
        video: "Watch video",
        featureDoctors: "Specialist doctors",
        featureTechnology: "Modern technology",
        featureCare: "Personalized care",
      };

  const proofItems = isArabic
    ? [
        {
          icon: Stethoscope,
          value: "نخبة",
          label: "أطباء متخصصون",
        },
        {
          icon: Sparkles,
          value: "حديثة",
          label: "تقنيات متطورة",
        },
        {
          icon: MapPin,
          value: "أقرب",
          label: "رعاية عبر الفروع",
        },
        {
          icon: CalendarDays,
          value: "منظمة",
          label: "رحلة عناية واضحة",
        },
      ]
    : [
        {
          icon: Stethoscope,
          value: "Expert",
          label: "Specialist doctors",
        },
        {
          icon: Sparkles,
          value: "Modern",
          label: "Advanced technology",
        },
        {
          icon: MapPin,
          value: "Closer",
          label: "Branch-based care",
        },
        {
          icon: CalendarDays,
          value: "Clear",
          label: "Organized care journey",
        },
      ];

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="
relative
        -mt-[96px]
        min-h-[900px]
        overflow-hidden
        pt-[96px]

        lg:min-h-[820px]

        xl:min-h-[850px]
      "
    >
      <Image
        src="/landing/hero/marilyn-hero-bg.png"
        alt=""
        fill
        priority
        unoptimized
        aria-hidden="true"
        sizes="100vw"
        className="
          pointer-events-none
          absolute
          inset-0
          size-full
          object-cover
          object-center
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[linear-gradient(90deg,rgba(255,250,244,0.10)_0%,rgba(255,250,244,0.03)_45%,rgba(239,220,195,0.03)_100%)]
        "
      />

      <div
        className="
w-full max-w-[1460px]
          relative
          mx-auto
          flex
          min-h-[804px]
          flex-col
          px-5
          pb-8
          pt-12

          sm:px-7
          sm:pt-14

          lg:min-h-[724px]
          lg:px-8
          lg:pb-[118px]
          lg:pt-[86px]

          xl:min-h-[754px]
          xl:px-10
          xl:pt-[92px]
        "
      >
        <div
          dir="ltr"
          className="
grid
            flex-1
            items-center
            gap-8

            lg:grid-cols-[1.02fr_0.98fr]
            lg:gap-6

            xl:grid-cols-[1fr_1fr]
            xl:gap-8
          "
        >
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="
              order-1
              mx-auto
              w-full
              max-w-[650px]
              text-center

              lg:mx-0
              lg:max-w-[660px]
              lg:-translate-x-20
              lg:-translate-y-14
              lg:text-start

              xl:-translate-x-24
              xl:-translate-y-16
            "
          >
            <h1
              className="
                text-[42px]
                font-semibold
                leading-[1.07]
                tracking-[-0.045em]
                text-[#10213b]

                min-[390px]:text-[46px]

                sm:text-[54px]

                lg:text-[68px]

                xl:text-[76px]

                2xl:text-[80px]
              "
            >
              <span className="block">
                {copy.titlePrimary}
              </span>

              <span
                className="
                  mt-2
                  block
                  text-[#b7853f]

                  sm:mt-3
                "
              >
                {copy.titleGold}
              </span>
            </h1>

            <p
              className="
                mx-auto
                mt-6
                max-w-[520px]
                text-[15px]
                leading-8
                text-[#3f3b36]

                sm:text-base

                lg:mx-0
                lg:mt-7
                lg:text-[20px]
                lg:leading-9
              "
            >
              {copy.description}
            </p>

            <div
              className="
                mt-6
                flex
                flex-wrap
                justify-center
                gap-3

                lg:justify-start

                xl:mt-7
              "
            >
              <span
                className="
                  inline-flex
                  min-h-[48px]
                  items-center
                  gap-2.5
                  rounded-[15px]
                  border
                  border-white/65
                  bg-white/48
                  px-4
                  text-sm
                  font-medium
                  text-[#48413a]
                  shadow-[0_8px_24px_rgba(83,63,29,0.045)]
                  backdrop-blur-xl
                "
              >
                <UserRoundCheck className="size-[20px] text-[#b7853f]" />
                {copy.featureDoctors}
              </span>

              <span
                className="
                  inline-flex
                  min-h-[48px]
                  items-center
                  gap-2.5
                  rounded-[15px]
                  border
                  border-white/65
                  bg-white/48
                  px-4
                  text-sm
                  font-medium
                  text-[#48413a]
                  shadow-[0_8px_24px_rgba(83,63,29,0.045)]
                  backdrop-blur-xl
                "
              >
                <ShieldCheck className="size-[20px] text-[#b7853f]" />
                {copy.featureTechnology}
              </span>

              <span
                className="
                  inline-flex
                  min-h-[48px]
                  items-center
                  gap-2.5
                  rounded-[15px]
                  border
                  border-white/65
                  bg-white/48
                  px-4
                  text-sm
                  font-medium
                  text-[#48413a]
                  shadow-[0_8px_24px_rgba(83,63,29,0.045)]
                  backdrop-blur-xl
                "
              >
                <Heart className="size-[20px] text-[#b7853f]" />
                {copy.featureCare}
              </span>
            </div>

            <div
              className="
                mt-7
                flex
                flex-col
                items-center
                justify-center
                gap-4

                min-[480px]:flex-row

                lg:justify-start

                xl:mt-8
              "
            >
              <Button
                asChild
                className="
                  h-[54px]
                  rounded-[16px]
                  border
                  border-[#b58c4d]/40
                  bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                  px-7
                  text-base
                  font-semibold
                  text-[#2e251a]
                  shadow-[0_16px_36px_rgba(168,121,56,0.25),inset_0_1px_0_rgba(255,255,255,0.45)]
                  transition
                  hover:brightness-[1.03]
                  hover:shadow-[0_20px_44px_rgba(168,121,56,0.31)]

                  sm:px-8

                  lg:h-[58px]
                  lg:min-w-[230px] lg:px-9
                "
              >
                <Link href="/book">
                  <CalendarDays className="size-[19px]" />
                  {copy.booking}
                </Link>
              </Button>

              <Link
                href="/#social-reel"
                className="
                  inline-flex
                  h-[58px]
                  items-center
                  gap-3
                  rounded-full
                  px-1
                  text-sm
                  font-semibold
                  text-[#403b35]
                  transition
                  hover:text-[#7e5925]
                "
              >
                <span
                  className="
                    flex
                    size-[54px]
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/75
                    bg-white/50
                    text-[#10213b]
                    shadow-[0_10px_28px_rgba(83,63,29,0.08)]
                    backdrop-blur-xl
                  "
                >
                  <Play className="size-[18px] fill-current" />
                </span>

                {copy.video}
              </Link>
            </div>
          </div>

          <div
            id="social-reel"
            dir={isArabic ? "rtl" : "ltr"}
            className="
              order-2
              relative
              mx-auto
              flex
              w-full
              max-w-[410px]
              items-end
              justify-center
              self-end
              pt-4

              lg:max-w-[470px]
              lg:-translate-x-10
              lg:-translate-y-12
              lg:pb-1

              xl:max-w-[490px]
              xl:-translate-x-12
              xl:-translate-y-14
            "
          >
            <div
              aria-hidden="true"
              className="
                absolute
                bottom-[-10px]
                left-1/2
                h-[68px]
                w-[300px]
                -translate-x-1/2
                rounded-[50%]
                bg-[#70593f]/16
                blur-2xl

                lg:w-[350px]
              "
            />

            <div
              className="
                relative
                z-30
                w-[260px]

                sm:w-[286px]

                lg:w-[328px]

                xl:w-[354px]
              "
            >
              <HeroSocialReel />
            </div>
          </div>
        </div>

        <div
          className="
mt-9
            grid
            grid-cols-2
            overflow-hidden
            rounded-[24px]
            border
            border-white/80
            bg-[linear-gradient(115deg,rgba(255,255,255,0.42)_0%,rgba(255,249,240,0.30)_100%)]
            shadow-[0_22px_60px_rgba(72,52,30,0.10),inset_0_1px_0_rgba(255,255,255,0.72)]
            backdrop-blur-2xl

            lg:absolute
            lg:bottom-[52px]
            lg:left-1/2
            lg:z-20
            lg:mt-0
            lg:w-[min(1120px,calc(100%-72px))]
            lg:-translate-x-1/2
            lg:grid-cols-4
            lg:rounded-[28px]

            xl:bottom-[56px]
          "
        >
          {proofItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  flex
                  min-h-[116px]
                  flex-col
                  items-center
                  justify-center
                  border-b
                  border-e
                  border-[#cbbda9]/28
                  px-3
                  py-5
                  text-center

                  even:border-e-0

                  lg:min-h-[84px]
                  lg:border-b-0
                  lg:border-e
                  lg:last:border-e-0
                "
              >
                <Icon className="mb-1 size-6 text-[#b7853f] lg:size-7" />

                <strong
                  className="
                    text-xl
                    font-semibold
                    tracking-[-0.025em]
                    text-[#10213b]

                    lg:text-[28px]
                  "
                >
                  {item.value}
                </strong>

                <span
                  className="
                    mt-2
                    text-xs
                    font-semibold
                    text-[#403b35]

                    sm:text-sm
                  "
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}