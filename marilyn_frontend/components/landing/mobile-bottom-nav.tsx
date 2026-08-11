"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ellipsis,
  Gift,
  Home,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

export function MobileBottomNav() {
  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  React.useEffect(() => {
    const sync = () =>
      setLocale(readPublicLocale());

    sync();

    window.addEventListener(
      PUBLIC_LOCALE_CHANGE_EVENT,
      sync,
    );

    return () => {
      window.removeEventListener(
        PUBLIC_LOCALE_CHANGE_EVENT,
        sync,
      );
    };
  }, []);

  const ar = locale === "ar";

  const items = [
    {
      href: "/",
      icon: Home,
      ar: "الرئيسية",
      en: "Home",
      active: true,
    },
    {
      href: "/#services",
      icon: Sparkles,
      ar: "الخدمات",
      en: "Services",
    },
    {
      href: "/#offers",
      icon: Gift,
      ar: "العروض",
      en: "Offers",
    },
    {
      href: "/#branches",
      icon: MapPin,
      ar: "الفروع",
      en: "Branches",
    },
    {
      href: "/#more",
      icon: Ellipsis,
      ar: "المزيد",
      en: "More",
    },
  ];

  return (
    <nav
      dir={ar ? "rtl" : "ltr"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.active
                  ? "flex flex-col items-center gap-1 text-[#c9871d]"
                  : "flex flex-col items-center gap-1 text-[#26364b]"
              }
            >
              <Icon className="size-5" />

              <span className="text-[11px] font-medium">
                {ar ? item.ar : item.en}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}