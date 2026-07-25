"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type FooterContent = {
  description: string;
  disclaimer: string;
  groups: { explore: string; programs: string; support: string };
  links: {
    benefits: string; features: string; pricing: string; register: string;
    patientManagement: string; appointments: string; medicalRecords: string;
    billingPayments: string; contactUs: string; faq: string;
    practitioners: string; branchesReports: string;
  };
  copyright: string;
  logoAlt: string;
};

/* =========================================================
   🍪 Cookie Helpers
========================================================= */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function getCurrentLang(): AppLang {
  const storedLang = typeof window !== "undefined"
    ? window.localStorage.getItem("marilyn-locale") ||
      window.localStorage.getItem("Mhamcloud-locale") ||
      window.localStorage.getItem("primey-locale") || ""
    : "";
  const cookieLang = getCookie("lang") || getCookie("locale") || getCookie("NEXT_LOCALE") || "";
  return (storedLang || cookieLang).toLowerCase().startsWith("ar") ? "ar" : "en";
}

/* =========================================================
   📝 Localized Content
========================================================= */
const content: Record<AppLang, FooterContent> = {
  ar: {
    description: "Marilyn Clinics منصة سحابية متكاملة لإدارة المرضى والمواعيد والسجلات الطبية والأطباء والفوترة والمدفوعات والفروع والتقارير من مكان واحد.",
    disclaimer: "تساعد المنصة المنشآت الطبية على تنظيم عملياتها، وتبقى إعدادات الصلاحيات والخصوصية وجودة البيانات تحت إدارة الجهة المشغلة.",
    groups: { explore: "استكشف", programs: "حلول المنصة", support: "الدعم" },
    links: {
      benefits: "لماذا Marilyn", features: "المزايا", pricing: "الباقات", register: "ابدأ الآن",
      patientManagement: "إدارة المرضى", appointments: "المواعيد والجداول",
      medicalRecords: "السجل الطبي الموحد", billingPayments: "الفوترة والمدفوعات",
      contactUs: "تواصل معنا", faq: "الأسئلة الشائعة",
      practitioners: "الأطباء والممارسون", branchesReports: "الفروع والتقارير",
    },
    copyright: "جميع الحقوق محفوظة", logoAlt: "شعار Marilyn Clinics",
  },
  en: {
    description: "Marilyn Clinics is an integrated cloud platform for managing patients, appointments, medical records, practitioners, billing, payments, branches, and clinic reporting from one place.",
    disclaimer: "The platform helps medical organizations organize their operations. Access, privacy, and data-quality settings remain under the operating organization's management.",
    groups: { explore: "Explore", programs: "Platform Solutions", support: "Support" },
    links: {
      benefits: "Why Marilyn", features: "Features", pricing: "Plans", register: "Get Started",
      patientManagement: "Patient Management", appointments: "Appointments & Scheduling",
      medicalRecords: "Unified Medical Records", billingPayments: "Billing & Payments",
      contactUs: "Contact Us", faq: "FAQ",
      practitioners: "Practitioners & Clinics", branchesReports: "Branches & Reports",
    },
    copyright: "All rights reserved", logoAlt: "Marilyn Clinics logo",
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const FooterSection = () => {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    const updateLang = () => {
      setLang(getCurrentLang());
    };

    updateLang();

    const observer = new MutationObserver(() => {
      updateLang();
    });

    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang", "dir"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const isArabic = lang === "ar";
  const t = content[lang];

  return (
    <footer
      id="footer"
      className="container space-y-4 pb-4 lg:pb-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="bg-muted rounded-2xl border p-10">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:grid-cols-4 xl:grid-cols-5">
          <div className="col-span-full space-y-4 xl:col-span-2">
            <Link
              href="/"
              className={cn(
                "inline-flex w-full",
                isArabic ? "justify-start xl:justify-start" : "justify-start"
              )}
              aria-label={t.logoAlt}
            >
              <Image
                src="/hero logo.png"
                alt={t.logoAlt}
                width={1200}
                height={420}
                priority
                unoptimized
                className="
                  h-auto
                  w-full
                  max-w-[180px]
                  object-contain
                  sm:max-w-[220px]
                  md:max-w-[240px]
                  lg:max-w-[260px]
                "
              />
            </Link>

            <p
              className={cn(
                "text-muted-foreground leading-7",
                isArabic && "text-right"
              )}
            >
              {t.description}
            </p>

            <p
              className={cn(
                "text-muted-foreground/80 rounded-xl border bg-background/60 p-3 text-xs leading-6",
                isArabic && "text-right"
              )}
            >
              {t.disclaimer}
            </p>
          </div>

          <div className={cn("flex flex-col gap-2", isArabic && "text-right")}>
            <h3 className="mb-2 text-lg font-bold">{t.groups.explore}</h3>

            <div>
              <Link href="/#benefits" className="opacity-60 hover:opacity-100">
                {t.links.benefits}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.features}
              </Link>
            </div>

            <div>
              <Link href="/pricing" className="opacity-60 hover:opacity-100">
                {t.links.pricing}
              </Link>
            </div>

            <div>
              <Link href="/register" className="opacity-60 hover:opacity-100">
                {t.links.register}
              </Link>
            </div>
          </div>

          <div className={cn("flex flex-col gap-2", isArabic && "text-right")}>
            <h3 className="mb-2 text-lg font-bold">{t.groups.programs}</h3>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.patientManagement}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.appointments}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.medicalRecords}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.billingPayments}
              </Link>
            </div>
          </div>

          <div className={cn("flex flex-col gap-2", isArabic && "text-right")}>
            <h3 className="mb-2 text-lg font-bold">{t.groups.support}</h3>

            <div>
              <Link href="/contact" className="opacity-60 hover:opacity-100">
                {t.links.contactUs}
              </Link>
            </div>

            <div>
              <Link href="/#faq" className="opacity-60 hover:opacity-100">
                {t.links.faq}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.practitioners}
              </Link>
            </div>

            <div>
              <Link href="/#features" className="opacity-60 hover:opacity-100">
                {t.links.branchesReports}
              </Link>
            </div>
          </div>

        </div>
      </div>

      <div
        className={cn(
          "flex flex-col justify-between gap-4 sm:flex-row!",
          isArabic && "sm:flex-row-reverse!"
        )}
      >
        <div className={cn("flex flex-col justify-between gap-4 sm:flex-row!", isArabic && "sm:flex-row-reverse!")}>
        <div className={cn("text-muted-foreground flex items-center justify-center gap-1 text-sm sm:justify-start", isArabic && "sm:justify-end")}>
          <span>&copy; {new Date().getFullYear()}</span><span>|</span>
          <span className="font-medium">Marilyn Clinics</span><span>|</span>
          <span>{t.copyright}</span>
        </div>
      </div>
      </div>
    </footer>
  );
};
