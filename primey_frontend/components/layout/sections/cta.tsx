"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SectionContainer from "@/components/layout/section-container";
import { Button } from "@/components/ui/button";

type AppLang = "ar" | "en";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function getCurrentLang(): AppLang {
  const cookieLang =
    getCookie("lang") || getCookie("locale") || getCookie("NEXT_LOCALE") || "";
  return cookieLang.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function PricingCtaSection() {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  const isArabic = lang === "ar";

  return (
    <SectionContainer>
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="bg-muted/50 rounded-3xl border p-8 text-center md:p-12"
      >
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {isArabic
            ? "ابدأ بناء مساحة عمل منشأتك الطبية"
            : "Start building your medical organization workspace"}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl leading-8">
          {isArabic
            ? "حدد الفروع والمستخدمين والوحدات المطلوبة لنجهز نطاق تشغيل Marilyn Clinics المناسب."
            : "Define branches, users, and required modules so the suitable Marilyn Clinics setup scope can be prepared."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/register">
              {isArabic ? "إرسال طلب البدء" : "Submit a request"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">
              {isArabic ? "خيارات التشغيل" : "Deployment options"}
            </Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
}
