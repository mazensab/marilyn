"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Globe2,
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
        className="mx-auto flex w-full min-h-[76px] max-w-[1480px] items-center justify-between gap-6 rounded-[28px] border border-white/80 bg-[linear-gradient(115deg,rgba(255,255,255,0.42)_0%,rgba(255,249,240,0.30)_100%)] px-5 shadow-[0_22px_60px_rgba(72,52,30,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl sm:min-h-[82px] sm:px-7 lg:min-h-[88px] lg:px-8"
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
            className="h-[52px] w-auto max-w-[128px] object-contain sm:h-[58px] sm:max-w-[150px] lg:h-[64px] lg:max-w-[182px]"
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
                  ? "h-11 rounded-none border-b-2 border-[#b7853f] bg-transparent px-4 text-[15px] font-semibold text-[#a57b3d] shadow-none hover:bg-transparent hover:text-[#7e5925]"
                  : "h-11 rounded-none px-4 text-[15px] font-medium text-[#26354a] hover:bg-transparent hover:text-[#9b7033]"
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
            <Globe2 className="size-4" />
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
            <Globe2 className="size-5" />
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