import React from "react";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import {
  Inter,
  Bricolage_Grotesque,
} from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bricolageGrotesque =
  Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--bricolage-grotesque",
  });

type AppLocale = "ar" | "en";

function normalizeLocale(
  value?: string | null,
): AppLocale {
  const normalized =
    (value || "").trim().toLowerCase();

  return normalized.startsWith("ar")
    ? "ar"
    : "en";
}

function getMetadataBase(): URL {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://marilynclinics.com";

  try {
    return new URL(rawUrl);
  } catch {
    return new URL(
      "https://marilynclinics.com",
    );
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Marilyn Clinics",
    template: "%s | Marilyn Clinics",
  },
  description:
    "Marilyn Clinics for dermatology, aesthetics, laser services, and online appointment booking.",
  applicationName: "Marilyn Clinics",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const locale = normalizeLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );

  const dir =
    locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body
        dir={dir}
        className={cn(
          "from-muted to-primary/5 min-h-screen bg-gradient-to-tl antialiased",
          inter.variable,
          inter.className,
          bricolageGrotesque.variable,
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <Toaster
            position="top-right"
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}