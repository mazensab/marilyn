import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { FooterSection } from "@/components/layout/sections/footer";
import { Button } from "@/components/ui/button";
import {
  branchAddress,
  branchTypeLabel,
  getPublicBranch,
  localizedBranchName,
} from "@/lib/public-branches";
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
function parseBranchId(
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
  const id = parseBranchId(
    resolvedParams.id,
  );
  const branch = id
    ? await getPublicBranch(id)
    : null;
  const title = branch
    ? `${localizedBranchName(
        branch,
        isArabic,
      )} | Marilyn Clinics`
    : isArabic
      ? "الفروع | Marilyn Clinics"
      : "Branches | Marilyn Clinics";
  return {
    title,
    description: isArabic
      ? "تفاصيل فرع Marilyn Clinics المتاح للحجز."
      : "Details for a Marilyn Clinics location available for booking.",
    metadataBase: new URL(
      PUBLIC_SITE.url,
    ),
    alternates: {
      canonical: id
        ? `/branches/${id}`
        : "/branches",
    },
  };
}
export default async function BranchDetailPage({
  params,
}: PageProps) {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const resolvedParams = await params;
  const id = parseBranchId(
    resolvedParams.id,
  );
  if (!id) {
    notFound();
  }
  const branch =
    await getPublicBranch(id);
  if (!branch) {
    notFound();
  }
  const name =
    localizedBranchName(
      branch,
      isArabic,
    );
  const type =
    branchTypeLabel(
      branch.branch_type,
      isArabic,
    );
  const address =
    branchAddress(branch);
  const BackIcon = isArabic
    ? ArrowRight
    : ArrowLeft;
  const copy = isArabic
    ? {
        back: "العودة للفروع",
        eyebrow: "فروع Marilyn Clinics",
        main: "الفرع الرئيسي",
        type: "نوع الفرع",
        city: "المدينة",
        region: "المنطقة",
        district: "الحي",
        address: "العنوان",
        hours: "ساعات العمل",
        book: "احجزي في هذا الفرع",
      }
    : {
        back: "Back to branches",
        eyebrow: "Marilyn Clinics branches",
        main: "Main branch",
        type: "Location type",
        city: "City",
        region: "Region",
        district: "District",
        address: "Address",
        hours: "Opening hours",
        book: "Book at this branch",
      };
  const hours =
    branch.opening_time &&
    branch.closing_time
      ? `${branch.opening_time} — ${branch.closing_time}`
      : "";
  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="
        min-h-screen
        bg-[#f8f2e9]
        pt-12
        text-[#172238]
        sm:pt-14
      "
    >
      <section className="relative overflow-hidden">
        <div className="container relative py-8 sm:py-12 lg:py-14">
          <Link
            href="/branches"
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
                  size-28
                  items-center
                  justify-center
                  rounded-[30px]
                  border
                  border-white/80
                  bg-white/70
                  text-[#a57b3d]
                  shadow-[0_16px_38px_rgba(112,79,40,0.12)]
                  backdrop-blur-xl
                "
              >
                <Building2 className="size-11" />
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
              {type ? (
                <p className="mt-2 text-base font-medium text-[#9a7138]">
                  {type}
                </p>
              ) : null}
              {branch.is_default ? (
                <div className="mt-4 inline-flex rounded-full border border-[#cbb58f]/45 bg-[#f5e9d8]/70 px-3 py-1.5 text-xs font-semibold text-[#8d6939]">
                  {copy.main}
                </div>
              ) : null}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {type ? (
                  <DetailItem
                    icon={<Building2 className="size-4" />}
                    label={copy.type}
                    value={type}
                  />
                ) : null}
                {branch.city ? (
                  <DetailItem
                    icon={<MapPin className="size-4" />}
                    label={copy.city}
                    value={branch.city}
                  />
                ) : null}
                {branch.region ? (
                  <DetailItem
                    icon={<MapPin className="size-4" />}
                    label={copy.region}
                    value={branch.region}
                  />
                ) : null}
                {branch.district ? (
                  <DetailItem
                    icon={<MapPin className="size-4" />}
                    label={copy.district}
                    value={branch.district}
                  />
                ) : null}
                {hours ? (
                  <DetailItem
                    icon={<Clock3 className="size-4" />}
                    label={copy.hours}
                    value={hours}
                    ltr
                  />
                ) : null}
              </div>
              {address ? (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-[#d8c6ad]/45
                    bg-white/58
                    p-4
                  "
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-[#9a7138]">
                    <MapPin className="size-4" />
                    {copy.address}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#596372]">
                    {address}
                  </p>
                </div>
              ) : null}
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
                  href={`/book?branch=${branch.id}`}
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
  ltr = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
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
      <div
        dir={ltr ? "ltr" : undefined}
        className="mt-1.5 text-sm font-semibold text-[#313a49]"
      >
        {value}
      </div>
    </div>
  );
}
