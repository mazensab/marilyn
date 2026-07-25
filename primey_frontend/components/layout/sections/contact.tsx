"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardList, MessageCircle } from "lucide-react";

import SectionContainer from "@/components/layout/section-container";
import SectionHeader from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
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

export function ContactSection() {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  const isArabic = lang === "ar";
  const cards = isArabic
    ? [
        {
          icon: Building2,
          title: "بيانات المنشأة",
          description: "حدد نوع المنشأة وعدد الفروع والعيادات والتخصصات.",
        },
        {
          icon: ClipboardList,
          title: "نطاق التشغيل",
          description: "حدد الوحدات والمستخدمين والصلاحيات المطلوبة للبدء.",
        },
        {
          icon: MessageCircle,
          title: "جلسة التهيئة",
          description: "تتم مراجعة الطلب وتحديد خطوات التهيئة والتشغيل.",
        },
      ]
    : [
        {
          icon: Building2,
          title: "Organization details",
          description: "Define organization type, branches, clinics, and specialties.",
        },
        {
          icon: ClipboardList,
          title: "Operational scope",
          description: "Define required modules, users, and permissions.",
        },
        {
          icon: MessageCircle,
          title: "Setup session",
          description: "The request is reviewed and setup steps are defined.",
        },
      ];

  return (
    <SectionContainer id="contact">
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader
          subTitle={isArabic ? "ابدأ معنا" : "Get Started"}
          title={
            isArabic
              ? "أرسل احتياج منشأتك الطبية"
              : "Share your medical organization requirements"
          }
          description={
            isArabic
              ? "لا نعرض بريدًا أو هاتفًا أو روابط غير معتمدة. استخدم نموذج البدء لإرسال بيانات المنشأة ونطاق التشغيل المطلوب."
              : "No unapproved email, phone number, or social links are displayed. Use the registration form to share organization and setup requirements."
          }
        />

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, description }) => (
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

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/register">
              {isArabic ? "إرسال طلب البدء" : "Submit a request"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">
              {isArabic ? "عرض خيارات التشغيل" : "View deployment options"}
            </Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
}
