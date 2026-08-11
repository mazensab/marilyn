"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Languages,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  persistPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";

type NavbarProps = {
  initialLocale?: PublicLocale;
};

const navigation = [
  { href: "/", ar: "الرئيسية", en: "Home" },
  { href: "/#services", ar: "الخدمات", en: "Services" },
  { href: "/#practitioners", ar: "الأطباء", en: "Doctors" },
  { href: "/#branches", ar: "الفروع", en: "Branches" },
  { href: "/#offers", ar: "العروض", en: "Offers" },
  { href: "/#about", ar: "من نحن", en: "About" },
  { href: "/contact", ar: "تواصل معنا", en: "Contact" },
];

export function Navbar({
  initialLocale = "ar",
}: NavbarProps) {
  const router = useRouter();

  const [locale, setLocale] =
    React.useState<PublicLocale>(initialLocale);

  const [open, setOpen] =
    React.useState(false);

  React.useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const isArabic = locale === "ar";

  const toggleLocale = () => {
    const next: PublicLocale =
      locale === "ar" ? "en" : "ar";

    setLocale(next);
    persistPublicLocale(next);
    router.refresh();
  };

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:top-4 lg:px-8">
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="container mx-auto flex min-h-[60px] max-w-[1460px] items-center justify-between gap-4 rounded-[22px] border border-white/55 bg-white/46 px-4 shadow-[0_12px_34px_rgba(57,43,27,0.085)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/36 sm:min-h-[62px] sm:px-5 lg:min-h-[64px] lg:px-5"
      >
        <Link
          href="/"
          aria-label="Marilyn Clinics"
          className="shrink-0"
        >
          <Image
            src="/logo/marilyn.svg"
            alt="Marilyn Clinics"
            width={190}
            height={60}
            priority
            unoptimized
            className="h-11 w-auto max-w-[112px] object-contain sm:h-12 sm:max-w-[132px] lg:h-[50px] lg:max-w-[154px]"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {navigation.map((item, index) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={
                index === 0
                  ? "h-9 rounded-full bg-white/42 px-3.5 text-sm font-semibold text-[#a57b3d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] hover:bg-white/58"
                  : "h-9 rounded-full px-3.5 text-sm font-medium text-[#26354a] hover:bg-white/34 hover:text-[#9b7033]"
              }
            >
              <Link href={item.href}>
                {isArabic ? item.ar : item.en}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleLocale}
            className="h-9 rounded-full border border-[#cbbda9]/65 bg-white/55 px-3.5 text-[#6d6154] shadow-sm transition hover:border-[#b89b69] hover:bg-white/80 hover:text-[#3f382f] focus-visible:ring-2 focus-visible:ring-[#b99150]/35"
          >
            <Languages className="size-4" />
            {isArabic ? "العربية" : "English"}
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>

          <Button
            asChild
            className="h-10 rounded-full border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] px-5 font-semibold text-[#2e251a] shadow-[0_12px_28px_rgba(168,121,56,0.22),inset_0_1px_0_rgba(255,255,255,0.38)] transition hover:brightness-[1.03] hover:shadow-[0_15px_34px_rgba(168,121,56,0.28)]"
          >
            <Link href="/book">
              <CalendarDays className="size-4" />
              {isArabic
                ? "احجز موعدك"
                : "Book Appointment"}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            className="size-10 rounded-full border border-[#cbbda9]/55 bg-white/45 text-[#6d6154] shadow-sm transition hover:border-[#b89b69] hover:bg-white/75 hover:text-[#3f382f]"
          >
            <Languages className="size-5" />
          </Button>

          <Sheet
            open={open}
            onOpenChange={setOpen}
          >
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl border border-[#cbbda9]/55 bg-white/45 text-[#6d6154] shadow-sm transition hover:border-[#b89b69] hover:bg-white/75 hover:text-[#3f382f]"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side={isArabic ? "right" : "left"}
              dir={isArabic ? "rtl" : "ltr"}
              className="w-[88vw] max-w-sm"
            >
              <SheetHeader>
                <SheetTitle className="flex justify-start">
                  <Image
                    src="/logo/marilyn.svg"
                    alt="Marilyn Clinics"
                    width={190}
                    height={60}
                    unoptimized
                    className="h-12 w-auto max-w-[132px] object-contain"
                  />
                </SheetTitle>
              </SheetHeader>

              <div className="mt-7 flex flex-col gap-1">
                {navigation.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    asChild
                    onClick={() => setOpen(false)}
                    className="h-11 justify-start rounded-xl"
                  >
                    <Link href={item.href}>
                      {isArabic
                        ? item.ar
                        : item.en}
                    </Link>
                  </Button>
                ))}

                <Separator className="my-4" />

                <Button
                  asChild
                  onClick={() => setOpen(false)}
                  className="h-11 rounded-xl border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] font-semibold text-[#2e251a] shadow-[0_12px_28px_rgba(168,121,56,0.20),inset_0_1px_0_rgba(255,255,255,0.38)] transition hover:brightness-[1.03]"
                >
                  <Link href="/book">
                    <CalendarDays className="size-4" />
                    {isArabic
                      ? "احجز موعدك"
                      : "Book Appointment"}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}