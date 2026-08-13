"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Facebook,
  Ghost,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";

const navigation = [
  {
    href: "/#services",
    ar: "الخدمات",
    en: "Services",
  },
  {
    href: "/#practitioners",
    ar: "الأطباء",
    en: "Doctors",
  },
  {
    href: "/#offers",
    ar: "العروض",
    en: "Offers",
  },
  {
    href: "/#branches",
    ar: "الفروع",
    en: "Branches",
  },
  {
    href: "/contact",
    ar: "تواصل معنا",
    en: "Contact",
  },
];

export function FooterSection() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  React.useEffect(() => {
    const syncLocale = () => {
      setLocale(readPublicLocale());
    };

    syncLocale();

    window.addEventListener(
      PUBLIC_LOCALE_CHANGE_EVENT,
      syncLocale,
    );

    window.addEventListener(
      "storage",
      syncLocale,
    );

    return () => {
      window.removeEventListener(
        PUBLIC_LOCALE_CHANGE_EVENT,
        syncLocale,
      );

      window.removeEventListener(
        "storage",
        syncLocale,
      );
    };
  }, []);

  const ar = locale === "ar";

  const copy = ar
    ? {
        description:
          "Marilyn Clinics للعناية بالجلدية والتجميل والليزر بتجربة تبدأ من اكتشاف الخدمة وحتى تأكيد الموعد.",
        explore:
          "استكشف",
        contact:
          "تواصل معنا",
        book:
          "احجزي موعدك",
        whatsapp:
          "WhatsApp",
        follow:
          "تابعينا على",
        unavailable:
          "سيتم إضافة الرابط قريبًا",
        rights:
          "جميع الحقوق محفوظة",
      }
    : {
        description:
          "Marilyn Clinics for dermatology, aesthetics, and laser care, from discovering your service to confirming your appointment.",
        explore:
          "Explore",
        contact:
          "Contact",
        book:
          "Book appointment",
        whatsapp:
          "WhatsApp",
        follow:
          "Follow us",
        unavailable:
          "Link will be added soon",
        rights:
          "All rights reserved",
      };

  const whatsappHref = "https://wa.me/966115444888";
  const socialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/marilyn.clinics/",
      icon: (
        <Instagram
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@marilyn.clinics?_t=ZS-8slrGHSvDEO&_r=1",
      icon: (
        <Music2
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "snapchat",
      label: "Snapchat",
      href: "https://www.snapchat.com/@marilyn.clinics",
      icon: (
        <Ghost
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: "https://wa.me/966115444888",
      icon: (
        <MessageCircle
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/@marilyn.clinics",
      icon: (
        <Youtube
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/marilynclinics",
      icon: (
        <Linkedin
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/p/%D8%B9%D9%8A%D8%A7%D8%AF%D8%A7%D8%AA-%D9%85%D8%A7%D8%B1%D9%84%D9%8A%D9%86-61570908132270/",
      icon: (
        <Facebook
          className="size-[18px]"
          aria-hidden="true"
        />
      ),
    },
  ] as const;

  return (
    <footer
      id="footer"
      dir={ar ? "rtl" : "ltr"}
      className="container pb-5 pt-3 sm:pb-6 sm:pt-4 lg:pb-7"
    >
      <div
        className="
          overflow-hidden
          rounded-[30px]
          border
          border-[#cbbda9]/45
          bg-white/70
          px-5
          py-7
          shadow-[0_14px_42px_rgba(86,65,42,0.06)]
          backdrop-blur-xl

          sm:px-7
          sm:py-8

          lg:px-9
          lg:py-9
        "
      >
        <div
          className="
            grid
            gap-8

            sm:grid-cols-2

            lg:grid-cols-[1.25fr_0.7fr_0.85fr]
            lg:gap-10
          "
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label={PUBLIC_SITE.name}
              className="inline-flex"
            >
              <Image
                src="/logo/marilyn.svg"
                alt={PUBLIC_SITE.name}
                width={190}
                height={60}
                unoptimized
                className="h-auto w-[135px] object-contain sm:w-[145px]"
              />
            </Link>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#667184] sm:text-[15px]">
              {copy.description}
            </p>

            <Button
              asChild
              className="
                mt-5
                h-10
                rounded-full
                border
                border-[#b58c4d]/40
                bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                px-5
                font-semibold
                text-[#2e251a]
                shadow-[0_12px_28px_rgba(168,121,56,0.20),inset_0_1px_0_rgba(255,255,255,0.38)]
                transition
                hover:brightness-[1.03]
              "
            >
              <Link href="/book">
                <CalendarDays className="size-4" />
                {copy.book}
              </Link>
            </Button>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#10213b] sm:text-base">
              {copy.explore}
            </h3>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#667184] transition-colors hover:text-[#a57b3d]"
                >
                  {ar
                    ? item.ar
                    : item.en}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#10213b] sm:text-base">
              {copy.contact}
            </h3>

            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${PUBLIC_SITE.email}`}
                className="flex items-center gap-2 text-sm text-[#667184] transition-colors hover:text-[#a57b3d]"
              >
                <Mail className="size-4 shrink-0 text-[#a57b3d]" />

                <span dir="ltr">
                  {PUBLIC_SITE.email}
                </span>
              </a>

              <a
                href="tel:+966115444888"
                className="flex items-center gap-2 text-sm text-[#667184] transition-colors hover:text-[#a57b3d]"
              >
                <Phone className="size-4 shrink-0 text-[#a57b3d]" />
                <span dir="ltr">
                  011 544 4888
                </span>
              </a>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#667184] transition-colors hover:text-[#a57b3d]"
                >
                  <MessageCircle className="size-4 shrink-0 text-[#a57b3d]" />
                  {copy.whatsapp}
                </a>
              ) : null}
            </div>
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold text-[#10213b]/75">
                {copy.follow}
              </p>
              <div
                className="
                  grid
                  grid-cols-4
                  gap-2
                  sm:grid-cols-7
                "
                aria-label={copy.follow}
              >
                {socialLinks.map((social) => {
                  const baseClassName = `
                    inline-flex
                    size-9
                    items-center
                    justify-center
                    rounded-[13px]
                    border
                    text-white
                    shadow-[0_7px_18px_rgba(168,121,56,0.18)]
                    backdrop-blur
                    transition
                  `;
                  return (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className={`
                        ${baseClassName}
                        border-[#b89561]/55
                        bg-[#c89e58]
                        hover:-translate-y-0.5
                        hover:border-[#a57b3d]/75
                        hover:bg-[#b7853f]
                        hover:text-white
                        hover:shadow-[0_10px_24px_rgba(168,121,56,0.24)]
                      `}
                    >
                      {social.icon}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="
          flex
          flex-col
          gap-2
          px-2
          pt-4
          text-center
          text-xs
          text-[#7b8593]

          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:text-start
        "
      >
        <span>
          © {new Date().getFullYear()}{" "}
          {PUBLIC_SITE.name}.{" "}
          {copy.rights}.
        </span>

        <span dir="ltr">
          {PUBLIC_SITE.domain}
        </span>
      </div>
    </footer>
  );
}