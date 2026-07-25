/* ============================================================
   📂 primey_frontend/app/(landing)/page.tsx
   🧠 Marilyn Clinics — Landing Home Page
   ------------------------------------------------------------
   ✅ Approved Premium landing pattern
   ✅ Approved landing layout/style preserved
   ✅ Marilyn Clinics medical platform content
   ✅ Arabic/English metadata and structured data
   ✅ Approved SEO image preserved and unapproved social links removed
   ✅ No localhost / no fake data
   ✅ No className/design/section-order changes
============================================================ */

import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ChatWidget } from "@/components/chat-widget";
import { BenefitsSection } from "@/components/layout/sections/benefits";
import { ContactSection } from "@/components/layout/sections/contact";
import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { NewsletterSection } from "@/components/layout/sections/newsletter";
import { PricingSection } from "@/components/layout/sections/pricing";
import { ServicesSection } from "@/components/layout/sections/services";
import { SponsorsSection } from "@/components/layout/sections/sponsors";
import { TestimonialSection } from "@/components/layout/sections/testimonial";

/* =========================================================
   🌐 Language Helpers
========================================================= */
type AppLang = "ar" | "en";

function normalizeLang(value?: string | null): AppLang {
  const normalized = (value || "").trim().toLowerCase();

  if (
    normalized === "ar" ||
    normalized.startsWith("ar-") ||
    normalized.startsWith("ar_")
  ) {
    return "ar";
  }

  return "en";
}

async function getPageLang(): Promise<AppLang> {
  const cookieStore = await cookies();

  const cookieLang =
    cookieStore.get("lang")?.value ||
    cookieStore.get("locale")?.value ||
    cookieStore.get("NEXT_LOCALE")?.value;

  return normalizeLang(cookieLang);
}

function getPageDirection(lang: AppLang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

/* =========================================================
   🧾 Dynamic Metadata
========================================================= */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getPageLang();
  const isArabic = lang === "ar";

  const title = isArabic
    ? "Marilyn Clinics | منصة إدارة العيادات والمراكز الطبية"
    : "Marilyn Clinics | Clinic Management Platform";

  const description = isArabic
    ? "Marilyn Clinics منصة سحابية متكاملة لإدارة المرضى والمواعيد والسجلات الطبية والأطباء والفوترة والمدفوعات والفروع والتقارير من مكان واحد."
    : "Marilyn Clinics is an integrated cloud platform for managing patients, appointments, medical records, practitioners, billing, payments, branches, and clinic reporting from one place.";

  const imageAlt = isArabic
    ? "Marilyn Clinics منصة إدارة العيادات والمراكز الطبية"
    : "Marilyn Clinics clinic management platform";

  return {
    title,
    description,
    keywords: isArabic
      ? [
          "Marilyn Clinics",
          "نظام إدارة عيادات",
          "برنامج إدارة عيادات",
          "إدارة المرضى",
          "إدارة المواعيد الطبية",
          "السجل الطبي الإلكتروني",
          "إدارة الأطباء والممارسين",
          "فوترة العيادات",
          "مدفوعات العيادات",
          "إدارة فروع العيادات",
          "تقارير العيادات",
        ]
      : [
          "Marilyn Clinics",
          "clinic management system",
          "medical practice management",
          "patient management",
          "appointment scheduling",
          "electronic medical records",
          "practitioner management",
          "clinic billing",
          "clinic payments",
          "multi-branch clinic management",
          "clinic reports",
        ],
    alternates: {
      canonical: "/",
      languages: {
        ar: "/",
        en: "/",
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Marilyn Clinics",
      locale: isArabic ? "ar_SA" : "en_US",
      images: [
        {
          url: "/seo.jpg",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/seo.jpg"],
    },
  };
}

/* =========================================================
   🧩 Structured Data
========================================================= */
function buildStructuredData(lang: AppLang) {
  const isArabic = lang === "ar";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Marilyn Clinics",
    url: "/",
    logo: "/hero logo.png",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: isArabic ? "ar-SA" : "en",
    description: isArabic
      ? "Marilyn Clinics منصة سحابية متكاملة لإدارة العيادات والمراكز الطبية والمرضى والمواعيد والسجلات الطبية والفوترة والتقارير."
      : "Marilyn Clinics is an integrated cloud platform for clinic management, patients, appointments, medical records, billing, branches, and reporting.",
  };
}

/* =========================================================
   🏠 Landing Home Page
========================================================= */
export default async function Home() {
  const lang = await getPageLang();
  const dir = getPageDirection(lang);
  const structuredData = buildStructuredData(lang);

  return (
    <main lang={lang} dir={dir} className="w-full" suppressHydrationWarning>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* الصفحة الرئيسية */}
      <HeroSection />

      {/* القطاعات والأنشطة */}
      <SponsorsSection />

      {/* لماذا Marilyn Clinics */}
      <BenefitsSection />

      {/* وحدات النظام والمزايا */}
      <FeaturesSection />

      {/* حلول Marilyn Clinics */}
      <ServicesSection />

      {/* الباقات والاشتراكات */}
      <PricingSection />

      {/* حالات الاستخدام */}
      <TestimonialSection />

      {/* التواصل */}
      <ContactSection />

      {/* الأسئلة الشائعة */}
      <FAQSection />

      {/* التحديثات والنشرة */}
      <NewsletterSection />

      {/* الفوتر */}
      <FooterSection />

      {/* الدعم العائم */}
      <ChatWidget />
    </main>
  );
}