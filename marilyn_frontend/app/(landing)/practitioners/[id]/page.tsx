import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
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
  getPublicPractitioner,
  localizedPractitionerName,
  localizedPractitionerRelatedName,
  practitionerInitials,
  practitionerTypeLabel,
} from "@/lib/public-practitioners";
import { normalizePublicLocale } from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
async function getLocale() {
  const cookieStore = await cookies();
  return normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
}
function parsePractitionerId(value: string) {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }
  return parsed;
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const resolvedParams = await params;
  const id = parsePractitionerId(
    resolvedParams.id,
  );
  const practitioner = id
    ? await getPublicPractitioner(id)
    : null;
  const title = practitioner
    ? `${localizedPractitionerName(
        practitioner,
        isArabic,
      )} | Marilyn Clinics`
    : isArabic
      ? "الفريق الطبي | Marilyn Clinics"
      : "Medical Team | Marilyn Clinics";
  return {
    title,
    description: isArabic
      ? "ملف الممارس الطبي المتاح للحجز في Marilyn Clinics."
      : "Profile of a practitioner available for booking at Marilyn Clinics.",
    metadataBase: new URL(
      PUBLIC_SITE.url,
    ),
    alternates: {
      canonical: id
        ? `/practitioners/${id}`
        : "/practitioners",
    },
  };
}
export default async function PractitionerDetailPage({
  params,
}: PageProps) {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const resolvedParams = await params;
  const id = parsePractitionerId(
    resolvedParams.id,
  );
  if (!id) {
    notFound();
  }
  const practitioner =
    await getPublicPractitioner(id);
  if (!practitioner) {
    notFound();
  }
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
  const title =
    practitioner.professional_title ||
    specialty ||
    practitionerTypeLabel(
      practitioner.practitioner_type,
      isArabic,
    );
  const BackIcon = isArabic
    ? ArrowRight
    : ArrowLeft;
  const copy = isArabic
    ? {
        back: "العودة للفريق الطبي",
        eyebrow: "الفريق الطبي",
        available: "متاح للحجز",
        specialty: "التخصص الطبي",
        branch: "الفرع",
        type: "نوع الممارس",
        book: "احجزي موعدًا",
      }
    : {
        back: "Back to medical team",
        eyebrow: "Medical team",
        available: "Available to book",
        specialty: "Medical specialty",
        branch: "Branch",
        type: "Practitioner type",
        book: "Book appointment",
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
        <div className="container relative py-8 sm:py-12 lg:py-14">
          <Link
            href="/practitioners"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-[#80643d]
              hover:text-[#a57b3d]
            "
          >
            <BackIcon className="size-4" />
            {copy.back}
          </Link>
          <article
            className="
              mt-6
              grid
              overflow-hidden
              rounded-[32px]
              border
              border-[#cbbda9]/45
              bg-white/72
              shadow-[0_24px_68px_rgba(83,61,35,0.09)]
              backdrop-blur-xl
              lg:grid-cols-[0.88fr_1.12fr]
            "
          >
            <div
              className="
                relative
                flex
                min-h-[300px]
                items-center
                justify-center
                overflow-hidden
                border-b
                border-[#d6c3a8]/40
                bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
                lg:min-h-[500px]
                lg:border-b-0
                lg:border-e
              "
            >
              <div
                aria-hidden="true"
                className="
                  absolute
                  -start-16
                  -top-20
                  size-64
                  rounded-full
                  border
                  border-white/60
                  bg-white/18
                "
              />
              <div
                className="
                  relative
                  flex
                  size-32
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/80
                  bg-white/70
                  text-3xl
                  font-semibold
                  text-[#a57b3d]
                  shadow-[0_16px_38px_rgba(112,79,40,0.12)]
                  backdrop-blur-xl
                "
                aria-label={name}
              >
                {practitionerInitials(name)}
              </div>
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#cbb58f]/45
                  bg-[#f6ead9]/65
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-[#9a7138]
                "
              >
                <Sparkles className="size-3.5" />
                {copy.eyebrow}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {name}
              </h1>
              {title ? (
                <p className="mt-2 text-base font-medium text-[#9a7138]">
                  {title}
                </p>
              ) : null}
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#8d6939]">
                <BadgeCheck className="size-4" />
                {copy.available}
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {specialty ? (
                  <DetailItem
                    icon={<Stethoscope className="size-4" />}
                    label={copy.specialty}
                    value={specialty}
                  />
                ) : null}
                {branch ? (
                  <DetailItem
                    icon={<MapPin className="size-4" />}
                    label={copy.branch}
                    value={branch}
                  />
                ) : null}
                {practitioner.practitioner_type ? (
                  <DetailItem
                    icon={<Stethoscope className="size-4" />}
                    label={copy.type}
                    value={
                      practitionerTypeLabel(
                        practitioner.practitioner_type,
                        isArabic,
                      ) ||
                      practitioner.practitioner_type
                    }
                  />
                ) : null}
              </div>
              <Button
                asChild
                className="
                  mt-8
                  h-11
                  rounded-full
                  border
                  border-[#b58c4d]/40
                  bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                  px-7
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
        </div>
      </section>
      <FooterSection />
      <MobileBottomNav />
      <ChatWidget />
    </main>
  );
}
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#d8c6ad]/45
        bg-white/58
        px-4
        py-3
      "
    >
      <div className="flex items-center gap-2 text-xs font-medium text-[#9a7138]">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[#313a49]">
        {value}
      </div>
    </div>
  );
}
