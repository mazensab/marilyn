"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { ActiveThemeProvider } from "@/components/active-theme"
import Notifications from "@/components/layout/header/notifications"
import Search from "@/components/layout/header/search"
import ThemeSwitch from "@/components/layout/header/theme-switch"
import UserMenu from "@/components/layout/header/user-menu"
import { NavMain } from "@/components/layout/sidebar/nav-main"
import { ThemeCustomizerPanel } from "@/components/theme-customizer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppLocale = "ar" | "en"

type SiteHeaderProps = {
  sidebarType?: "system" | "company"
}

function getLocale(): AppLocale {
  try {
    if (typeof window === "undefined") return "ar"

    return window.localStorage.getItem("primey-locale") === "en"
      ? "en"
      : "ar"
  } catch (error) {
    console.error("Header locale read error:", error)
    return "ar"
  }
}

function applyLocale(locale: AppLocale) {
  if (typeof document === "undefined") return

  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  document.body.dir = locale === "ar" ? "rtl" : "ltr"
}

function FrostedGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-0.5 rounded-full p-1",
        "border border-white/80 bg-[rgba(255,255,255,0.50)]",
        "shadow-[0_10px_34px_rgba(112,91,64,0.10)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "supports-[backdrop-filter]:bg-[rgba(255,255,255,0.42)]",
        "dark:border-white/10 dark:bg-white/[0.055]",
        "dark:shadow-[0_10px_34px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SiteHeader({
  sidebarType = "system",
}: SiteHeaderProps) {
  const { toggleSidebar, open } = useSidebar()
  const [locale, setLocale] = useState<AppLocale>("ar")

  useEffect(() => {
    const syncLocale = () => {
      const nextLocale = getLocale()

      setLocale(nextLocale)
      applyLocale(nextLocale)
    }

    syncLocale()

    window.addEventListener("primey-locale-changed", syncLocale)
    window.addEventListener("storage", syncLocale)

    return () => {
      window.removeEventListener(
        "primey-locale-changed",
        syncLocale,
      )
      window.removeEventListener("storage", syncLocale)
    }
  }, [])

  const isArabic = locale === "ar"

  const rowDirection = useMemo(
    () => (isArabic ? "flex-row-reverse" : "flex-row"),
    [isArabic],
  )

  const toggleLanguage = () => {
    try {
      const nextLocale: AppLocale =
        isArabic ? "en" : "ar"

      window.localStorage.setItem(
        "primey-locale",
        nextLocale,
      )
      window.dispatchEvent(
        new Event("primey-locale-changed"),
      )

      setLocale(nextLocale)
      applyLocale(nextLocale)
    } catch (error) {
      console.error("Language toggle error:", error)
    }
  }

  if (sidebarType === "system") {
    return (
      <header className="relative z-40 w-full">
        <div
          dir="ltr"
          className={cn(
            "grid w-full items-center gap-x-2 gap-y-2",
            "grid-cols-[auto_minmax(0,1fr)_auto]",
            "grid-rows-[auto_auto]",
            "sm:gap-x-4",
            "md:grid-rows-1 md:gap-x-5",
            "xl:gap-x-8",
          )}
        >
          <Link
            href="/system"
            className={cn(
              "col-start-1 row-start-1 flex min-w-0",
              "shrink-0 justify-self-start rounded-2xl",
              "outline-none focus-visible:ring-2",
              "focus-visible:ring-primary/30",
            )}
            aria-label={
              isArabic
                ? "\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0644\u0648\u062d\u0629 \u0627\u0644\u0646\u0638\u0627\u0645"
                : "Open system dashboard"
            }
          >
            <Image
              src="/logo/marilyn.svg"
              alt="Marilyn Clinics"
              width={190}
              height={64}
              priority
              className={cn(
                "h-11 w-auto max-w-[92px]",
                "object-contain object-left",
                "sm:h-[52px] sm:max-w-[150px]",
                "lg:max-w-[180px]",
              )}
            />
          </Link>

          <div
            className={cn(
              "col-span-3 col-start-1 row-start-2",
              "flex min-w-0 justify-center",
              "md:col-span-1 md:col-start-2 md:row-start-1",
            )}
          >
            <FrostedGroup className="max-w-full overflow-hidden">
              <NavMain type="system" variant="header" />
            </FrostedGroup>
          </div>

          <div
            className={cn(
              "col-start-3 row-start-1 min-w-0",
              "justify-self-end",
            )}
          >
            <FrostedGroup>
              <Search compact />
              <Notifications />
              <ThemeSwitch />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleLanguage}
                className={cn(
                  "h-10 w-10 rounded-full border",
                  "border-[#cbbda9]/65 bg-white/55 text-[#a57b3d]",
                  "shadow-[0_4px_14px_rgba(112,91,64,0.08)]",
                  "backdrop-blur-xl transition-all duration-200",
                  "hover:border-[#b58c4d]/40",
                  "hover:bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]",
                  "hover:text-white hover:shadow-[0_12px_28px_rgba(168,121,56,0.28)]",
                  "dark:border-white/10 dark:bg-white/[0.055]",
                  "dark:text-[#d9b979] dark:hover:text-white",
                )}
                aria-label={
                  isArabic
                    ? "Switch to English"
                    : "\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064a\u0629"
                }
                title={
                  isArabic
                    ? "English"
                    : "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"
                }
              >
                <Globe className="size-4" />
              </Button>
              <UserMenu />
            </FrostedGroup>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="relative z-40 w-full overflow-hidden rounded-[inherit] bg-transparent text-foreground">
      <div
        className={cn(
          "flex min-h-14 w-full items-center gap-3",
          "rounded-[inherit] px-2 py-2",
          "bg-gradient-to-b from-white/78 to-white/42",
          "backdrop-blur-xl",
          "dark:from-white/[0.07]",
          "dark:to-white/[0.025]",
          rowDirection,
        )}
      >
        <Button
          type="button"
          onClick={toggleSidebar}
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-2xl"
          aria-label={
            open
              ? "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629"
              : "\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629"
          }
        >
          {open ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="w-full max-w-[820px]">
            <Search />
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-2xl",
            "border border-white/70 bg-white/72",
            "p-1 shadow-sm",
            "dark:border-white/10",
            "dark:bg-white/[0.055]",
            rowDirection,
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleLanguage}
            className="h-9 w-9 rounded-xl"
            aria-label={
              isArabic
                ? "Switch to English"
                : "\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064a\u0629"
            }
          >
            <Globe className="size-4" />
          </Button>

          <Notifications />
          <ThemeSwitch />

          <ActiveThemeProvider>
            <ThemeCustomizerPanel />
          </ActiveThemeProvider>

          <Separator
            orientation="vertical"
            className="mx-1 hidden h-5 sm:flex"
          />

          <div className="hidden sm:block">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
