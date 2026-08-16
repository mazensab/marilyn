import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChatWidget } from "@/components/chat-widget";
import { PublicBookingExperience } from "@/components/booking/public-booking-experience";
import { PublicBookingPayment } from "@/components/booking/public-booking-payment";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { FooterSection } from "@/components/layout/sections/footer";
import { normalizePublicLocale } from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";
type PageProps = {
  searchParams: Promise<{
    branch?: string;
    service?: string;
    practitioner?: string;
    payment_return?: string;
  }>;
};
function positiveInteger(
  value:
    string | undefined,
) {
  if (!value) {
    return undefined;
  }
  const parsed =
    Number(value);
  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed <= 0
  ) {
    return undefined;
  }
  return parsed;
}
async function getLocale() {
  const cookieStore =
    await cookies();
  return normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
}
export async function generateMetadata():
  Promise<Metadata> {
  const locale =
    await getLocale();
  const isArabic =
    locale === "ar";
  return {
    title: isArabic
      ? "حجز موعد | Marilyn Clinics"
      : "Book an Appointment | Marilyn Clinics",
    description: isArabic
      ? "احجزي موعدك في Marilyn Clinics عبر اختيار الخدمة والفرع والطبيب والوقت المتاح فعليًا."
      : "Book your Marilyn Clinics appointment by choosing a real service, branch, practitioner and available time.",
    metadataBase: new URL(
      PUBLIC_SITE.url,
    ),
    alternates: {
      canonical: "/book",
    },
  };
}
export default async function BookPage({
  searchParams,
}: PageProps) {
  const locale =
    await getLocale();
  const params =
    await searchParams;
  return (
    <main
      lang={locale}
      dir={
        locale === "ar"
          ? "rtl"
          : "ltr"
      }
      className="
        min-h-screen
        overflow-hidden
        bg-[#f8f2e9]
        pt-28
        text-[#172238]
        sm:pt-32
      "
    >
      <section className="relative">
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -start-28
            top-10
            size-72
            rounded-full
            border
            border-white/55
            bg-white/18
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -end-32
            top-56
            size-80
            rounded-full
            border
            border-[#d7bea0]/28
            bg-[#ead9c1]/20
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            start-[18%]
            top-[46%]
            size-44
            rounded-full
            bg-[#ead7bd]/15
            blur-3xl
          "
        />
        <div
          className="
            container
            relative
            py-10
            sm:py-14
            lg:py-16
          "
        >
          {params.payment_return === "1" ? (
            <PublicBookingPayment
              locale={locale}
              returnMode
            />
          ) : (
          <PublicBookingExperience
            locale={locale}
            initialBranchId={
              positiveInteger(
                params.branch,
              )
            }
            initialServiceId={
              positiveInteger(
                params.service,
              )
            }
            initialPractitionerId={
              positiveInteger(
                params.practitioner,
              )
            }
          />
          )}
        </div>
      </section>
      <FooterSection />
      <MobileBottomNav />
      <ChatWidget />
    </main>
  );
}
