"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, Network, Stethoscope } from "lucide-react";

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

const plans = [
  {
    id: "core",
    icon: Stethoscope,
    ar: {
      title: "التشغيل الأساسي",
      description: "لعيادة أو مركز يبدأ بإدارة المرضى والمواعيد والتشغيل اليومي.",
      features: [
        "إدارة المرضى",
        "المواعيد والجداول",
        "المستخدمون والصلاحيات",
        "التقارير الأساسية",
      ],
    },
    en: {
      title: "Core Operations",
      description: "For a clinic or center starting with patients, appointments, and daily operations.",
      features: [
        "Patient management",
        "Appointments and schedules",
        "Users and permissions",
        "Core reporting",
      ],
    },
  },
  {
    id: "clinical",
    icon: Building2,
    ar: {
      title: "التشغيل الطبي المتكامل",
      description: "للمنشآت التي تحتاج السجل الطبي والفوترة والمدفوعات وربط الأقسام.",
      features: [
        "السجل الطبي والزيارات",
        "الأطباء والممارسون",
        "الفوترة والمدفوعات",
        "الخزينة والحسابات",
      ],
    },
    en: {
      title: "Integrated Clinical Operations",
      description: "For organizations needing medical records, billing, payments, and connected departments.",
      features: [
        "Medical records and visits",
        "Doctors and practitioners",
        "Billing and payments",
        "Treasury and accounting",
      ],
    },
  },
  {
    id: "network",
    icon: Network,
    ar: {
      title: "الإدارة متعددة الفروع",
      description: "للمجموعات الطبية التي تحتاج إدارة مركزية وتقارير وصلاحيات متقدمة.",
      features: [
        "فروع وأقسام متعددة",
        "إدارة مركزية",
        "تقارير موحدة",
        "تهيئة حسب نطاق المنشأة",
      ],
    },
    en: {
      title: "Multi-Branch Management",
      description: "For medical groups requiring central administration, reporting, and advanced access control.",
      features: [
        "Multiple branches and departments",
        "Central administration",
        "Unified reporting",
        "Organization-specific setup",
      ],
    },
  },
] as const;

export function PricingSection() {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    setLang(getCurrentLang());
  }, []);

  const isArabic = lang === "ar";

  return (
    <SectionContainer id="pricing">
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader
          subTitle={isArabic ? "خيارات التشغيل" : "Deployment Options"}
          title={
            isArabic
              ? "نطاق مرن حسب حجم المنشأة واحتياجها"
              : "A flexible scope based on organization size and needs"
          }
          description={
            isArabic
              ? "لا نعرض أسعارًا أو حدود استخدام غير معتمدة. يتم تحديد النطاق بعد معرفة الفروع والمستخدمين والوحدات المطلوبة."
              : "No unapproved prices or usage limits are shown. Scope is defined after reviewing branches, users, and required modules."
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const content = plan[lang];

            return (
              <Card key={plan.id} className="flex h-full flex-col">
                <CardHeader>
                  <Icon className="text-primary mb-4 size-8" />
                  <CardTitle className={cn(isArabic && "text-right")}>
                    {content.title}
                  </CardTitle>
                  <p className={cn("text-muted-foreground leading-7", isArabic && "text-right")}>
                    {content.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-3">
                    {content.features.map((feature) => (
                      <li
                        key={feature}
                        className={cn(
                          "flex items-start",
                          isArabic && "flex-row-reverse text-right"
                        )}
                      >
                        <Check
                          className={cn(
                            "text-primary mt-1 size-4 shrink-0",
                            isArabic ? "ml-2" : "mr-2"
                          )}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex-1" />
                  <Button asChild>
                    <Link href="/register">
                      {isArabic ? "طلب تفاصيل التهيئة" : "Request setup details"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
