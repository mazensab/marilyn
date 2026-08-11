"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Instagram,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import {
  PUBLIC_SITE,
  buildPublicWhatsAppUrl,
} from "@/lib/public-site-config";

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
    href: "/#faq",
    ar: "الأسئلة الشائعة",
    en: "FAQ",
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
          "Marilyn Clinics للعناية بالجلدية والتجميل والليزر، بتجربة تبدأ من اكتشاف الخدمة وحتى تأكيد الموعد.",
        explore:
          "استكشف",
        contact:
          "تواصل معنا",
        book:
          "احجزي موعدك",
        whatsapp:
          "WhatsApp",
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
        rights:
          "All rights reserved",
      };

  const whatsappHref =
    buildPublicWhatsAppUrl(
      ar
        ? "مرحبًا Marilyn Clinics، أود الاستفسار عن الخدمات والحجز."
        : "Hello Marilyn Clinics, I would like to ask about services and booking.",
    );

  return (
    <footer
      id="footer"
      dir={ar ? "rtl" : "ltr"}
      className="
        container
        pb-5
        pt-3

        sm:pb-6
        sm:pt-4

        lg:pb-7
      "
    >
      <div
        className="
          overflow-hidden
          rounded-[26px]
          border
          border-black/[0.055]
          bg-white
          px-5
          py-7
          shadow-[0_10px_34px_rgba(15,23,42,0.035)]

          sm:px-7
          sm:py-8

          lg:px-9
          lg:py-8
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
          <div
            className="
              sm:col-span-2

              lg:col-span-1
            "
          >
            <Link
              href="/"
              aria-label={PUBLIC_SITE.name}
              className="inline-flex"
            >
              <Image
                src="/hero logo.png"
                alt={PUBLIC_SITE.name}
                width={1200}
                height={420}
                unoptimized
                className="
                  h-auto
                  w-[145px]
                  object-contain

                  sm:w-[155px]
                "
              />
            </Link>

            <p
              className="
                mt-4
                max-w-xl
                text-sm
                leading-7
                text-[#637083]

                sm:text-[15px]
              "
            >
              {copy.description}
            </p>

            <Button
              asChild
              className="
                mt-5
                h-10
                rounded-full
                bg-[#c9871d]
                px-5
                text-white
                hover:bg-[#b87917]
              "
            >
              <Link href="/book">
                <CalendarDays className="size-4" />
                {copy.book}
              </Link>
            </Button>
          </div>

          <div>
            <h3
              className="
                mb-4
                text-sm
                font-bold
                text-[#10213b]

                sm:text-base
              "
            >
              {copy.explore}
            </h3>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="
                    text-sm
                    text-[#667184]
                    transition-colors
                    hover:text-[#b87515]
                  "
                >
                  {ar
                    ? item.ar
                    : item.en}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3
              className="
                mb-4
                text-sm
                font-bold
                text-[#10213b]

                sm:text-base
              "
            >
              {copy.contact}
            </h3>

            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${PUBLIC_SITE.email}`}
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-[#667184]
                  transition-colors
                  hover:text-[#b87515]
                "
              >
                <Mail className="size-4 shrink-0" />

                <span dir="ltr">
                  {PUBLIC_SITE.email}
                </span>
              </a>

              <a
                href={PUBLIC_SITE.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-[#667184]
                  transition-colors
                  hover:text-[#b87515]
                "
              >
                <Instagram className="size-4 shrink-0" />

                <span dir="ltr">
                  {PUBLIC_SITE.instagram.handle}
                </span>
              </a>

              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-[#667184]
                    transition-colors
                    hover:text-[#b87515]
                  "
                >
                  <MessageCircle className="size-4 shrink-0" />
                  {copy.whatsapp}
                </a>
              ) : null}
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