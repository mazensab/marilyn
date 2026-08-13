import type {
  Metadata,
} from "next";
import type {
  ReactNode,
} from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { FooterSection } from "@/components/layout/sections/footer";
import { Button } from "@/components/ui/button";
import {
  formatPublicPrice,
  getPublicMedicalService,
  localizedRelatedName,
  localizedServiceName,
} from "@/lib/public-medical-services";
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
function parseServiceId(
  value: string,
) {
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
  const id = parseServiceId(
    resolvedParams.id,
  );
  const service = id
    ? await getPublicMedicalService(id)
    : null;
  const title = service
    ? `${localizedServiceName(
        service,
        isArabic,
      )} | Marilyn Clinics`
    : isArabic
      ? "الخدمة الطبية | Marilyn Clinics"
      : "Medical Service | Marilyn Clinics";
  const description =
    service?.description ||
    (isArabic
      ? "تفاصيل الخدمة الطبية في Marilyn Clinics."
      : "Medical service details at Marilyn Clinics.");
  return {
    title,
    description,
    metadataBase: new URL(
      PUBLIC_SITE.url,
    ),
    alternates: {
      canonical: id
        ? `/services/${id}`
        : "/services",
    },
  };
}
export default async function ServiceDetailPage({
  params,
}: PageProps) {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const resolvedParams = await params;
  const id = parseServiceId(
    resolvedParams.id,
  );
  if (!id) {
    notFound();
  }
  const service =
    await getPublicMedicalService(id);
  if (!service) {
    notFound();
  }
  const name =
    localizedServiceName(
      service,
      isArabic,
    );
  const specialty =
    localizedRelatedName(
      service.specialty,
      isArabic,
    );
  const branch =
    localizedRelatedName(
      service.branch,
      isArabic,
    );
  const department =
    localizedRelatedName(
      service.department,
      isArabic,
    );
  const clinic =
    localizedRelatedName(
      service.clinic,
      isArabic,
    );
  const price =
    formatPublicPrice(
      service.effective_sale_price,
    );
  const BackIcon = isArabic
    ? ArrowRight
    : ArrowLeft;
  const copy = isArabic
    ? {
        back: "العودة للخدمات",
        eyebrow: "تفاصيل الخدمة",
        duration: "مدة الخدمة",
        minute: "دقيقة",
        specialty: "التخصص",
        branch: "الفرع",
        department: "القسم",
        clinic: "العيادة",
        sessions: "عدد الجلسات",
        approval:
          "الحجز يتطلب تأكيد العيادة",
        preparation:
          "تعليمات ما قبل الخدمة",
        book: "احجزي هذه الخدمة",
        available:
          "متاحة للحجز الإلكتروني",
        currency: "ر.س",
      }
    : {
        back: "Back to services",
        eyebrow: "Service details",
        duration: "Duration",
        minute: "min",
        specialty: "Specialty",
        branch: "Branch",
        department: "Department",
        clinic: "Clinic",
        sessions: "Sessions",
        approval:
          "Booking requires clinic confirmation",
        preparation:
          "Before your appointment",
        book: "Book this service",
        available:
          "Available for online booking",
        currency: "SAR",
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
            -start-24
            top-10
            size-72
            rounded-full
            border
            border-white/50
            bg-white/20
          "
        />
        <div
          className="
            container
            relative
            py-8
            sm:py-12
            lg:py-14
          "
        >
          <Link
            href="/services"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-[#80643d]
              transition
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
                min-h-[280px]
                items-center
                justify-center
                overflow-hidden
                border-b
                border-[#d6c3a8]/40
                bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
                lg:min-h-[520px]
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
                aria-hidden="true"
                className="
                  absolute
                  -bottom-24
                  -end-16
                  size-72
                  rounded-full
                  border
                  border-[#c5a779]/30
                  bg-[#e4caa8]/28
                "
              />
              <div
                className="
                  relative
                  flex
                  size-24
                  items-center
                  justify-center
                  rounded-[28px]
                  border
                  border-white/80
                  bg-white/68
                  text-[#a57b3d]
                  shadow-[0_16px_38px_rgba(112,79,40,0.12)]
                  backdrop-blur-xl
                "
              >
                <Stethoscope className="size-10" />
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
              <h1
                className="
                  mt-4
                  text-3xl
                  font-semibold
                  tracking-[-0.035em]
                  text-[#172238]
                  sm:text-4xl
                "
              >
                {name}
              </h1>
              <div
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-medium
                  text-[#8d6939]
                "
              >
                <BadgeCheck className="size-4" />
                {copy.available}
              </div>
              {service.description ? (
                <p
                  className="
                    mt-5
                    max-w-2xl
                    text-sm
                    leading-8
                    text-[#66707c]
                    sm:text-base
                  "
                >
                  {service.description}
                </p>
              ) : null}
              <div
                className="
                  mt-7
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                {service.duration_minutes > 0 ? (
                  <DetailItem
                    icon={
                      <Clock3 className="size-4" />
                    }
                    label={copy.duration}
                    value={`${service.duration_minutes} ${copy.minute}`}
                  />
                ) : null}
                {specialty ? (
                  <DetailItem
                    icon={
                      <Stethoscope className="size-4" />
                    }
                    label={copy.specialty}
                    value={specialty}
                  />
                ) : null}
                {branch ? (
                  <DetailItem
                    icon={
                      <MapPin className="size-4" />
                    }
                    label={copy.branch}
                    value={branch}
                  />
                ) : null}
                {department ? (
                  <DetailItem
                    icon={
                      <ShieldCheck className="size-4" />
                    }
                    label={copy.department}
                    value={department}
                  />
                ) : null}
                {clinic ? (
                  <DetailItem
                    icon={
                      <MapPin className="size-4" />
                    }
                    label={copy.clinic}
                    value={clinic}
                  />
                ) : null}
                {service.default_session_count > 1 ? (
                  <DetailItem
                    icon={
                      <CalendarDays className="size-4" />
                    }
                    label={copy.sessions}
                    value={String(
                      service.default_session_count,
                    )}
                  />
                ) : null}
              </div>
              {service.requires_approval ? (
                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-[#d1b78e]/45
                    bg-[#f5e9d8]/65
                    px-4
                    py-3
                    text-sm
                    text-[#72583a]
                  "
                >
                  {copy.approval}
                </div>
              ) : null}
              {service.requires_preparation &&
              service.preparation_instructions ? (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-[#d6c3a8]/45
                    bg-white/60
                    p-4
                  "
                >
                  <div
                    className="
                      text-sm
                      font-semibold
                      text-[#313a49]
                    "
                  >
                    {copy.preparation}
                  </div>
                  <p
                    className="
                      mt-2
                      whitespace-pre-line
                      text-sm
                      leading-7
                      text-[#68717d]
                    "
                  >
                    {
                      service.preparation_instructions
                    }
                  </p>
                </div>
              ) : null}
              <div
                className="
                  mt-8
                  flex
                  flex-col
                  gap-4
                  border-t
                  border-[#d9c8b2]/45
                  pt-6
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                {price ? (
                  <div
                    className="
                      inline-flex
                      items-baseline
                      gap-1.5
                      text-2xl
                      font-semibold
                      text-[#9a7138]
                    "
                  >
                    <span
                      dir="ltr"
                      className="tabular-nums"
                    >
                      {price}
                    </span>
                    <span>
                      {copy.currency}
                    </span>
                  </div>
                ) : (
                  <div />
                )}
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
                    shadow-[0_10px_24px_rgba(168,121,56,0.20)]
                    hover:brightness-[1.03]
                  "
                >
                  <Link
                    href={`/book?service=${service.id}`}
                  >
                    <CalendarDays className="size-4" />
                    {copy.book}
                  </Link>
                </Button>
              </div>
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
  icon: ReactNode;
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
      <div
        className="
          flex
          items-center
          gap-2
          text-xs
          font-medium
          text-[#9a7138]
        "
      >
        {icon}
        {label}
      </div>
      <div
        className="
          mt-1.5
          text-sm
          font-semibold
          text-[#313a49]
        "
      >
        {value}
      </div>
    </div>
  );
}
