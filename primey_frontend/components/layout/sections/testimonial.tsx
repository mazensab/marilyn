"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileHeart, WalletCards } from "lucide-react";

import SectionContainer from "@/components/layout/section-container";
import SectionHeader from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export function TestimonialSection() {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  const isArabic = lang === "ar";
  const items = isArabic
    ? [
        {
          icon: CalendarDays,
          title: "الاستقبال والمواعيد",
          description:
            "تنظيم المواعيد والحضور والانتظار مع رؤية موحدة للعيادات والممارسين.",
        },
        {
          icon: FileHeart,
          title: "الزيارة والسجل الطبي",
          description:
            "ربط كل زيارة بسجل المريض والملاحظات والخطة العلاجية والصلاحيات.",
        },
        {
          icon: WalletCards,
          title: "الفوترة والتحصيل",
          description:
            "تحويل الخدمات إلى فواتير ومدفوعات وتقارير مالية مترابطة.",
        },
      ]
    : [
        {
          icon: CalendarDays,
          title: "Reception and appointments",
          description:
            "Organize appointments, attendance, and waiting with a unified view of clinics and practitioners.",
        },
        {
          icon: FileHeart,
          title: "Visits and medical records",
          description:
            "Connect each visit to the patient record, clinical notes, care plan, and permissions.",
        },
        {
          icon: WalletCards,
          title: "Billing and collection",
          description:
            "Turn delivered services into connected invoices, payments, and financial reports.",
        },
      ];

  return (
    <SectionContainer>
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader
          subTitle={isArabic ? "حالات استخدام" : "Use Cases"}
          title={
            isArabic
              ? "مسارات تشغيل حقيقية بدل شهادات غير موثقة"
              : "Real operational workflows instead of unverified testimonials"
          }
          description={
            isArabic
              ? "تعرض هذه الأمثلة كيف ترتبط وحدات Marilyn Clinics خلال يوم العمل، دون نسب أقوال أو نتائج إلى عملاء غير معتمدين."
              : "These examples show how Marilyn Clinics modules connect during daily operations without attributing unapproved quotes or outcomes to customers."
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="text-primary size-7" />
                <CardTitle className={cn(isArabic && "text-right")}>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn(
                  "text-muted-foreground leading-7",
                  isArabic && "text-right"
                )}
              >
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
