import { cookies } from "next/headers";

import { benefitList } from "@/@data/benefits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import SectionContainer from "../section-container";
import SectionHeader from "../section-header";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type BenefitTranslation = {
  title: string;
  description: string;
};

type BenefitsContent = {
  subTitle: string;
  title: string;
  description: string;
  items: BenefitTranslation[];
};

/* =========================================================
   🌐 Language Helper
========================================================= */
async function getPageLang(): Promise<AppLang> {
  const cookieStore = await cookies();

  const cookieLang =
    cookieStore.get("lang")?.value ||
    cookieStore.get("locale")?.value ||
    cookieStore.get("NEXT_LOCALE")?.value ||
    "";

  const normalizedLang = cookieLang.toLowerCase();

  return normalizedLang.startsWith("ar") ? "ar" : "en";
}

/* =========================================================
   📝 Localized Content
========================================================= */
const benefitsContent: Record<AppLang, BenefitsContent> = {
  ar: {
    subTitle: "لماذا Marilyn Clinics؟",
    title: "تشغيل طبي موحّد من أول موعد حتى التحصيل",
    description:
      "تجمع Marilyn Clinics العمليات الطبية والإدارية والمالية في منصة واحدة تساعد المنشأة على خدمة المريض بكفاءة ومتابعة الأداء بوضوح.",
    items: [
      {
        title: "رحلة مريض مترابطة",
        description:
          "ملف موحّد يربط بيانات المريض والمواعيد والزيارات والمدفوعات دون تكرار أو تشتت.",
      },
      {
        title: "تشغيل يومي أسرع",
        description:
          "تنظيم الجداول وقوائم الانتظار والعيادات والممارسين مع رؤية واضحة لحالة كل موعد.",
      },
      {
        title: "تحكم وصلاحيات",
        description:
          "صلاحيات حسب الدور والفرع مع فصل بيانات المنشأة وتتبع الإجراءات المهمة.",
      },
      {
        title: "إدارة مالية متكاملة",
        description:
          "فواتير ومدفوعات وخزينة وتقارير مالية مرتبطة بالخدمات والزيارات.",
      },
      {
        title: "إدارة متعددة الفروع",
        description:
          "متابعة الفروع والأقسام والعيادات من إدارة مركزية مع تقارير موحدة.",
      },
      {
        title: "جاهزية للنمو",
        description:
          "بنية قابلة للتوسع لإضافة التخصصات والمستخدمين والخدمات دون تعطيل التشغيل.",
      },
    ],
  },
  en: {
    subTitle: "Why Marilyn Clinics?",
    title: "Connected clinical operations from appointment to collection",
    description:
      "Marilyn Clinics brings clinical, administrative, and financial workflows into one platform so medical organizations can serve patients efficiently and monitor performance clearly.",
    items: [
      {
        title: "Connected patient journey",
        description:
          "A unified record links patient data, appointments, visits, and payments without duplication.",
      },
      {
        title: "Faster daily operations",
        description:
          "Organize schedules, waiting lists, clinics, and practitioners with clear appointment status.",
      },
      {
        title: "Roles and access control",
        description:
          "Role- and branch-based access with organization isolation and traceable actions.",
      },
      {
        title: "Integrated finance",
        description:
          "Billing, payments, treasury, and financial reports connected to services and visits.",
      },
      {
        title: "Multi-branch management",
        description:
          "Manage branches, departments, and clinics centrally with unified reporting.",
      },
      {
        title: "Built to scale",
        description:
          "Expand specialties, users, and services without disrupting daily operations.",
      },
    ],
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const BenefitsSection = async () => {
  const lang = await getPageLang();
  const isArabic = lang === "ar";
  const t = benefitsContent[lang];

  return (
    <SectionContainer id="benefits">
      <div className="grid lg:grid-cols-2 lg:gap-24">
        <div>
          <SectionHeader
            className={cn(
              "sticky max-w-full text-center lg:top-[22rem]",
              isArabic ? "lg:text-right" : "lg:text-start"
            )}
            subTitle={t.subTitle}
            title={t.title}
            description={t.description}
          />
        </div>

        <div className="flex w-full flex-col gap-6 lg:gap-[14rem]">
          {benefitList.map(({ icon, title }, index) => {
            const translatedItem = t.items[index];

            return (
              <Card
                key={title}
                className={cn("group/number bg-background lg:sticky")}
                style={{ top: `${20 + index + 2}rem` }}
              >
                <CardHeader>
                  <div className="flex justify-between">
                    <Icon
                      name={icon}
                      className="text-primary bg-primary/20 ring-primary/10 mb-6 size-10 rounded-full p-2 ring-8"
                    />

                    <span className="text-muted-foreground/15 group-hover/number:text-muted-foreground/30 text-5xl font-bold transition-all delay-75">
                      0{index + 1}
                    </span>
                  </div>

                  <CardTitle
                    className={cn("text-lg", isArabic && "text-right")}
                  >
                    {translatedItem?.title || title}
                  </CardTitle>
                </CardHeader>

                <CardContent
                  className={cn(
                    "text-muted-foreground leading-7",
                    isArabic && "text-right"
                  )}
                >
                  {translatedItem?.description || ""}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
};
