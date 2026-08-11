import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ChatWidget } from "@/components/chat-widget";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { ReferenceFinalCta } from "@/components/landing/reference-final-cta";
import { ReferenceTrustStrip } from "@/components/landing/reference-trust-strip";
import { ReferenceStatsBranches } from "@/components/landing/reference-stats-branches";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { ServicesSection } from "@/components/layout/sections/services";
import { normalizePublicLocale } from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";

async function getPageLocale() {
  const cookieStore = await cookies();

  return normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPageLocale();
  const isArabic = locale === "ar";

  const title = isArabic
    ? "Marilyn Clinics | الجلدية والتجميل والليزر"
    : "Marilyn Clinics | Dermatology, Aesthetics & Laser";

  const description = isArabic
    ? "اكتشفي خدمات Marilyn Clinics في الجلدية والتجميل والليزر، وتعرّفي على الخدمات والأطباء والعروض والفروع واحجزي موعدك بسهولة."
    : "Explore Marilyn Clinics dermatology, aesthetic, and laser services, discover doctors, offers, branches, and book your appointment easily.";

  return {
    title,
    description,
    metadataBase: new URL(PUBLIC_SITE.url),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: PUBLIC_SITE.url,
      title,
      description,
      siteName: PUBLIC_SITE.name,
      locale: isArabic
        ? "ar_SA"
        : "en_US",
      images: [
        {
          url: "/seo.jpg",
          width: 1200,
          height: 630,
          alt: PUBLIC_SITE.name,
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

export default async function Home() {
  const locale = await getPageLocale();
  const isArabic = locale === "ar";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: PUBLIC_SITE.name,
    url: PUBLIC_SITE.url,
    email: PUBLIC_SITE.email,
    logo: `${PUBLIC_SITE.url}/hero%20logo.png`,
    sameAs: [
      PUBLIC_SITE.instagram.url,
    ],
    medicalSpecialty: [
      "Dermatology",
      "PlasticSurgery",
    ],
    description: isArabic
      ? "Marilyn Clinics لخدمات الجلدية والتجميل والليزر والعناية الطبية المتخصصة."
      : "Marilyn Clinics for dermatology, aesthetics, laser care, and specialized medical services.",
  };

  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full"
      suppressHydrationWarning
    >
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <HeroSection />

      <ServicesSection />

      <ReferenceTrustStrip />

      <ReferenceStatsBranches />

      <ReferenceFinalCta />

      <FooterSection />

      <MobileBottomNav />
      <ChatWidget />
    </main>
  );
}