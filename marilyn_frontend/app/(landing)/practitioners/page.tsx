import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { FooterSection } from "@/components/layout/sections/footer";
import { Button } from "@/components/ui/button";
import {
  getPublicPractitioners,
  localizedPractitionerName,
  localizedPractitionerRelatedName,
  practitionerInitials,
  practitionerTypeLabel,
} from "@/lib/public-practitioners";
import { normalizePublicLocale } from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";
async function getLocale() {
  const cookieStore = await cookies();
  return normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
}
export async function generateMetadata():
  Promise<Metadata> {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  return {
    title: isArabic
      ? "الفريق الطبي | Marilyn Clinics"
      : "Medical Team | Marilyn Clinics",
    description: isArabic
      ? "تعرّفي على الممارسين المتاحين فعليًا للحجز في Marilyn Clinics."
      : "Meet practitioners currently available for booking at Marilyn Clinics.",
    metadataBase: new URL(
      PUBLIC_SITE.url,
    ),
    alternates: {
      canonical: "/practitioners",
    },
  };
}
export default async function PractitionersPage() {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const practitioners =
    await getPublicPractitioners();
  const ArrowIcon = isArabic
    ? ArrowLeft
    : ArrowRight;
  const copy = isArabic
    ? {
        eyebrow: "الفريق الطبي",
        title: "خبرات طبية ترافق رحلتك",
        description:
          "استعرضي الممارسين المتاحين فعليًا للحجز واختاري من يناسب احتياجك.",
        available: "متاح للحجز",
        details: "عرض الملف",
        book: "احجزي موعدًا",
        emptyTitle:
          "لا يوجد ممارسون متاحون للحجز حاليًا",
        emptyDescription:
          "سيظهر الفريق الطبي هنا تلقائيًا عند تفعيل الممارسين وقبولهم للحجوزات من النظام.",
      }
    : {
        eyebrow: "Medical team",
        title: "Clinical expertise for your journey",
        description:
          "Explore practitioners currently available for booking and choose the right care for your needs.",
        available: "Available to book",
        details: "View profile",
        book: "Book appointment",
        emptyTitle:
          "No practitioners are currently available for booking",
        emptyDescription:
          "The medical team will appear here automatically once practitioners are active and accepting bookings in the system.",
      };
  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="
        min-h-screen
        bg-[#f8f2e9]
        pt-24
        text-[#172238]
        sm:pt-28
      "
    >
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -start-20
            top-6
            size-64
            rounded-full
            border
            border-white/50
            bg-white/20
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -end-20
            top-40
            size-72
            rounded-full
            border
            border-[#d3b98f]/25
            bg-[#e9d9c2]/25
          "
        />
        <div className="container relative py-10 sm:py-14 lg:py-16">
          <header className="mx-auto max-w-3xl text-center">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#cbb58f]/45
                bg-white/65
                px-3.5
                py-1.5
                text-xs
                font-semibold
                text-[#9a7138]
                shadow-[0_6px_18px_rgba(92,67,38,0.05)]
                backdrop-blur-xl
              "
            >
              <Sparkles className="size-3.5" />
              {copy.eyebrow}
            </div>
            <h1
              className="
                mt-4
                text-3xl
                font-semibold
                tracking-[-0.035em]
                sm:text-4xl
                lg:text-[2.8rem]
              "
            >
              {copy.title}
            </h1>
            <p
              className="
                mx-auto
                mt-4
                max-w-2xl
                text-sm
                leading-7
                text-[#68717f]
                sm:text-base
              "
            >
              {copy.description}
            </p>
          </header>
          {practitioners.length > 0 ? (
            <div
              className="
                mt-10
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {practitioners.map((practitioner) => {
                const name =
                  localizedPractitionerName(
                    practitioner,
                    isArabic,
                  );
                const specialty =
                  localizedPractitionerRelatedName(
                    practitioner.primary_specialty,
                    isArabic,
                  );
                const branch =
                  localizedPractitionerRelatedName(
                    practitioner.default_branch,
                    isArabic,
                  );
                const subtitle =
                  practitioner.professional_title ||
                  specialty ||
                  practitionerTypeLabel(
                    practitioner.practitioner_type,
                    isArabic,
                  );
                return (
                  <article
                    key={practitioner.id}
                    className="
                      group
                      overflow-hidden
                      rounded-[28px]
                      border
                      border-[#cbbda9]/45
                      bg-white/72
                      p-4
                      shadow-[0_18px_48px_rgba(83,61,35,0.07)]
                      backdrop-blur-xl
                      transition
                      duration-300
                      hover:-translate-y-1
                      hover:border-[#bea071]/60
                      hover:shadow-[0_24px_58px_rgba(83,61,35,0.11)]
                    "
                  >
                    <div
                      className="
                        relative
                        flex
                        min-h-[175px]
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-[22px]
                        border
                        border-white/70
                        bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
                      "
                    >
                      <div
                        aria-hidden="true"
                        className="
                          absolute
                          -start-10
                          -top-12
                          size-36
                          rounded-full
                          border
                          border-white/55
                          bg-white/20
                        "
                      />
                      <div
                        className="
                          relative
                          flex
                          size-24
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-white/80
                          bg-white/70
                          text-2xl
                          font-semibold
                          text-[#a57b3d]
                          shadow-[0_12px_30px_rgba(112,79,40,0.12)]
                          backdrop-blur-xl
                        "
                        aria-label={name}
                      >
                        {practitionerInitials(name)}
                      </div>
                      <div
                        className="
                          absolute
                          end-3
                          top-3
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          border-white/75
                          bg-white/72
                          px-2.5
                          py-1
                          text-[11px]
                          font-semibold
                          text-[#8d6836]
                        "
                      >
                        <span className="size-1.5 rounded-full bg-[#b68a4a]" />
                        {copy.available}
                      </div>
                    </div>
                    <div className="px-1 pb-1 pt-5">
                      <h2 className="text-xl font-semibold tracking-[-0.025em]">
                        {name}
                      </h2>
                      {subtitle ? (
                        <p className="mt-1 text-sm font-medium text-[#9a7138]">
                          {subtitle}
                        </p>
                      ) : null}
                      <div className="mt-4 space-y-2">
                        {specialty ? (
                          <div className="flex items-center gap-2 text-xs text-[#69717d]">
                            <Stethoscope className="size-4 shrink-0 text-[#b48745]" />
                            <span>{specialty}</span>
                          </div>
                        ) : null}
                        {branch ? (
                          <div className="flex items-center gap-2 text-xs text-[#69717d]">
                            <MapPin className="size-4 shrink-0 text-[#b48745]" />
                            <span>{branch}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-5 border-t border-[#d9c8b2]/45 pt-4">
                        <Link
                          href={`/practitioners/${practitioner.id}`}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            text-sm
                            font-semibold
                            text-[#8e6936]
                            transition
                            hover:text-[#a57b3d]
                          "
                        >
                          {copy.details}
                          <ArrowIcon className="size-4" />
                        </Link>
                      </div>
                      <Button
                        asChild
                        className="
                          mt-4
                          h-10
                          w-full
                          rounded-full
                          border
                          border-[#b58c4d]/40
                          bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                          font-semibold
                          text-[#2e251a]
                          shadow-[0_10px_24px_rgba(168,121,56,0.20)]
                          hover:brightness-[1.03]
                        "
                      >
                        <Link
                          href={`/book?practitioner=${practitioner.id}`}
                        >
                          <CalendarDays className="size-4" />
                          {copy.book}
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className="
                mx-auto
                mt-10
                max-w-2xl
                rounded-[28px]
                border
                border-[#cbbda9]/45
                bg-white/68
                px-6
                py-12
                text-center
                shadow-[0_18px_48px_rgba(83,61,35,0.06)]
                backdrop-blur-xl
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  size-14
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-[#ccb48d]/45
                  bg-[#f3e6d4]
                  text-[#a57b3d]
                "
              >
                <Stethoscope className="size-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                {copy.emptyTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#6c7480]">
                {copy.emptyDescription}
              </p>
            </div>
          )}
        </div>
      </section>
      <FooterSection />
      <MobileBottomNav />
      <ChatWidget />
    </main>
  );
}
