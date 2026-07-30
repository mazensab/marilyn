"use client";

import React, { useEffect, useState } from "react";

import { featureList } from "@/@data/features";
import Icon from "@/components/icon";
import SectionContainer from "@/components/layout/section-container";
import SectionHeader from "@/components/layout/section-header";
import { CardTitle } from "@/components/ui/card";
import { CardHover, CardsHover } from "@/components/ui/extras/cards-hover";
import { cn } from "@/lib/utils";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type FeatureItemTranslation = {
  title: string;
  description: string;
};

type FeaturesContent = {
  subTitle: string;
  title: string;
  description: string;
  items: FeatureItemTranslation[];
};

/* =========================================================
   🍪 Cookie Helper
========================================================= */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function getCurrentLang(): AppLang {
  const cookieLang =
    getCookie("lang") || getCookie("locale") || getCookie("NEXT_LOCALE");

  return cookieLang === "ar" ? "ar" : "en";
}

/* =========================================================
   📝 Localized Content
========================================================= */
const content: Record<AppLang, FeaturesContent> = {
  ar: {
    subTitle: "مزايا المنصة",
    title: "كل ما تحتاجه المنشأة الطبية في مساحة عمل واحدة",
    description:
      "وحدات مترابطة لإدارة المرضى والمواعيد والسجلات الطبية والممارسين والفوترة والفروع والتقارير.",
    items: [
      {
        title: "إدارة المرضى",
        description:
          "ملفات مرضى منظمة مع بيانات التواصل والحالة والزيارات والرصيد المرتبط.",
      },
      {
        title: "المواعيد والجداول",
        description:
          "جدولة العيادات والممارسين وإدارة قوائم الانتظار وحالة الحضور.",
      },
      {
        title: "السجل الطبي الموحد",
        description:
          "تاريخ طبي وزيارات وملاحظات وخطط علاج مرتبطة بالمريض وصلاحيات الوصول.",
      },
      {
        title: "الأطباء والممارسون",
        description:
          "إدارة التخصصات والجداول والعيادات والارتباط بالفروع والأقسام.",
      },
      {
        title: "الفوترة والمدفوعات",
        description:
          "إصدار الفواتير وتسجيل المدفوعات وربطها بالخزينة والحسابات.",
      },
      {
        title: "الفروع والصلاحيات",
        description:
          "تشغيل متعدد الفروع مع أدوار واضحة وفصل آمن للبيانات.",
      },
      {
        title: "التقارير التشغيلية",
        description:
          "مؤشرات عن المواعيد والمرضى والتحصيل والأداء حسب الفرع والفترة.",
      },
      {
        title: "التواصل والإشعارات",
        description:
          "رسائل وتنبيهات وواتساب مرتبطة بسياق المنشأة وسير العمل.",
      },
    ],
  },
  en: {
    subTitle: "Platform Features",
    title: "Everything a medical organization needs in one workspace",
    description:
      "Connected modules for patients, appointments, medical records, practitioners, billing, branches, and reporting.",
    items: [
      {
        title: "Patient management",
        description:
          "Organized patient profiles with contact details, visits, status, and linked balances.",
      },
      {
        title: "Appointments and schedules",
        description:
          "Schedule clinics and practitioners while managing waiting lists and attendance status.",
      },
      {
        title: "Unified medical records",
        description:
          "Medical history, visits, notes, and care plans with controlled access.",
      },
      {
        title: "Practitioners and specialties",
        description:
          "Manage specialties, schedules, clinics, branches, and departments.",
      },
      {
        title: "Billing and payments",
        description:
          "Issue invoices, record payments, and connect collections to treasury and accounting.",
      },
      {
        title: "Branches and permissions",
        description:
          "Multi-branch operations with clear roles and secure data isolation.",
      },
      {
        title: "Operational reporting",
        description:
          "Track appointments, patients, collections, and branch performance over time.",
      },
      {
        title: "Communication and alerts",
        description:
          "Notifications and WhatsApp workflows connected to organization operations.",
      },
    ],
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const FeaturesSection = () => {
  const [value, setValue] = React.useState<string | null>(null);
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    const updateLang = () => setLang(getCurrentLang());

    updateLang();

    const observer = new MutationObserver(() => {
      updateLang();
    });

    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang", "dir"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const isArabic = lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const t = content[lang];

  return (
    <SectionContainer id="features">
      <div dir={dir}>
        <SectionHeader
          subTitle={t.subTitle}
          title={t.title}
          description={t.description}
        />

        <CardsHover
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          value={value}
          onValueChange={setValue}
        >
          {featureList.map((card, index) => {
            const translatedItem = t.items[index];

            return (
              <CardHover
                key={card.icon}
                value={card.icon}
                className={cn(
                  "flex items-start gap-6",
                  isArabic && "flex-row-reverse text-right"
                )}
              >
                <div className="space-y-4">
                  <CardTitle
                    className={cn("text-lg", isArabic && "text-right")}
                  >
                    {translatedItem?.title || card.title}
                  </CardTitle>

                  <p
                    className={cn(
                      "text-muted-foreground font-normal leading-7",
                      isArabic && "text-right"
                    )}
                  >
                    {translatedItem?.description || card.description}
                  </p>
                </div>

                <div className="bg-primary/20 ring-primary/10 rounded-full p-2 ring-8">
                  <Icon name={card.icon} className="text-primary size-6" />
                </div>
              </CardHover>
            );
          })}
        </CardsHover>
      </div>
    </SectionContainer>
  );
};
