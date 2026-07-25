import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundBeamsWithCollision } from "@/components/ui/extras/background-beams-with-collision";
import { cn } from "@/lib/utils";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type HeroContent = {
  badgeNew: string;
  badgeText: string;
  title: string;
  description: string;
  primaryButton: string;
  secondaryButton: string;
  benefits: [string, string, string];
  imageAlt: string;
  heroLogoAlt: string;
};

/* =========================================================
   🌐 Language Helper
========================================================= */
async function getPageLang(): Promise<AppLang> {
  const cookieStore = await cookies();

  const cookieLang =
    cookieStore.get("lang")?.value ||
    cookieStore.get("locale")?.value ||
    cookieStore.get("NEXT_LOCALE")?.value ||
    "";

  const normalizedLang = cookieLang.toLowerCase();

  return normalizedLang.startsWith("ar") ? "ar" : "en";
}

/* =========================================================
   📝 Localized Content
========================================================= */
const content: Record<AppLang, HeroContent> = {
  ar: {
    badgeNew: "Marilyn Clinics",
    badgeText: "منصة متكاملة لإدارة العيادات والمراكز الطبية",
    title: "إدارة متكاملة لعيادتك من المريض إلى التحصيل",
    description:
      "نظّم المرضى والمواعيد والسجلات الطبية والأطباء والفوترة والمدفوعات والفروع من منصة واحدة آمنة ومهيأة للمنشآت الطبية.",
    primaryButton: "ابدأ الآن",
    secondaryButton: "استعرض المنصة",
    benefits: ["سجل طبي موحد", "مواعيد وجداول", "فوترة ومدفوعات"],
    imageAlt: "واجهة منصة Marilyn Clinics لإدارة العيادات",
    heroLogoAlt: "شعار Marilyn Clinics الرئيسي",
  },
  en: {
    badgeNew: "Marilyn Clinics",
    badgeText: "An integrated platform for clinics and medical centers",
    title: "Manage your clinic from patient care to collection",
    description:
      "Manage patients, appointments, medical records, practitioners, billing, payments, and branches through one secure platform built for medical organizations.",
    primaryButton: "Get Started",
    secondaryButton: "Explore Platform",
    benefits: ["Unified medical records", "Appointments and schedules", "Billing and payments"],
    imageAlt: "Marilyn Clinics management platform interface",
    heroLogoAlt: "Marilyn Clinics main logo",
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const HeroSection = async () => {
  const lang = await getPageLang();
  const isArabic = lang === "ar";
  const t = content[lang];

  return (
    <section
      className="container w-full overflow-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto grid place-items-center py-16 pb-8 md:py-32 md:pb-14 lg:max-w-(--breakpoint-xl)">
        <BackgroundBeamsWithCollision>
          <div className="space-y-8 pb-8 text-center lg:pb-20">
            <Badge variant="outline" className="bg-muted py-2 text-sm">
              <span className={cn("text-primary", isArabic ? "ml-2" : "mr-2")}>
                <Badge className="bg-background text-foreground hover:bg-background">
                  {t.badgeNew}
                </Badge>
              </span>
              <span>{t.badgeText}</span>
            </Badge>

            {/* =========================================================
                🖼️ شعار Marilyn Clinics الرئيسي
            ========================================================= */}
            <div className="mx-auto flex max-w-(--breakpoint-md) justify-center">
              <h1 className="sr-only">{t.title}</h1>

              <Image
                src="/hero logo.png"
                alt={t.heroLogoAlt}
                width={1200}
                height={420}
                priority
                unoptimized
                className="
                  h-auto
                  w-full
                  max-w-[280px]
                  object-contain
                  sm:max-w-[360px]
                  md:max-w-[460px]
                  lg:max-w-[560px]
                  xl:max-w-[640px]
                "
              />
            </div>

            <div className="mx-auto max-w-(--breakpoint-md) space-y-4">
              <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t.title}
              </h2>

              <p className="text-muted-foreground mx-auto max-w-(--breakpoint-sm) text-lg leading-8 md:text-xl">
                {t.description}
              </p>
            </div>

            <div
              className={cn(
                "mt-8 flex flex-col justify-center gap-4 md:flex-row!",
                isArabic && "md:flex-row-reverse!"
              )}
            >
              <Button asChild className="h-12 px-10 text-base">
                <Link href="/register">
                  {t.primaryButton}
                  {isArabic ? <ChevronLeft /> : <ChevronRight />}
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 px-10 text-base">
                <Link href="#features">{t.secondaryButton}</Link>
              </Button>
            </div>

            <div
              className={cn(
                "text-muted-foreground mt-6 flex flex-col items-center justify-center gap-4 text-sm md:flex-row!",
                isArabic && "md:flex-row-reverse!"
              )}
            >
              {t.benefits.map((item) => (
                <div key={item} className="flex items-center gap-1">
                  <CheckIcon className="text-primary size-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </BackgroundBeamsWithCollision>

        <div className="group relative w-full">
          <div className="bg-primary/60 absolute top-2 left-1/2 mx-auto h-24 w-[90%] -translate-x-1/2 transform rounded-full blur-3xl lg:-top-8 lg:h-80" />

          <Image
            width={1240}
            height={1200}
            className="relative mx-auto flex w-full items-center rounded-lg mask-b-from-20% mask-b-to-90% leading-none"
            src="/hero.png"
            alt={t.imageAlt}
            priority
            unoptimized
          />
        </div>
      </div>
    </section>
  );
};