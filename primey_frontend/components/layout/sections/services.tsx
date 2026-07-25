import { cookies } from "next/headers";

import { ProService, serviceList } from "@/@data/services";
import SectionContainer from "@/components/layout/section-container";
import SectionHeader from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type ServiceItemTranslation = {
  title: string;
  description: string;
};

type ServicesContent = {
  subTitle: string;
  title: string;
  description: string;
  proLabel: string;
  items: ServiceItemTranslation[];
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
const content: Record<AppLang, ServicesContent> = {
  ar: {
    subTitle: "حلول المنصة",
    title: "وحدات مترابطة حسب رحلة العمل الطبية",
    description:
      "ابدأ بالوحدات الأساسية ثم وسّع التشغيل حسب الفروع والتخصصات واحتياج المنشأة.",
    proLabel: "متكامل",
    items: [
      {
        title: "إدارة المرضى والاستقبال",
        description:
          "تسجيل المرضى وتنظيم بياناتهم ومتابعة حالتهم منذ التواصل الأول.",
      },
      {
        title: "المواعيد وتشغيل العيادات",
        description:
          "جداول مرنة للممارسين والعيادات مع الحضور والانتظار وإعادة الجدولة.",
      },
      {
        title: "السجل الطبي والزيارات",
        description:
          "توثيق الزيارات والملاحظات والخطط العلاجية داخل سجل موحد.",
      },
      {
        title: "الفوترة والتحصيل",
        description:
          "ربط الخدمات بالفواتير والمدفوعات والخزينة والتقارير المالية.",
      },
      {
        title: "الفروع والإدارة المركزية",
        description:
          "إدارة الفروع والأقسام والصلاحيات ومتابعة الأداء من مركز واحد.",
      },
      {
        title: "التقارير والتواصل",
        description:
          "لوحات متابعة وإشعارات وواتساب لدعم التشغيل واتخاذ القرار.",
      },
    ],
  },
  en: {
    subTitle: "Platform Solutions",
    title: "Connected modules for the complete clinical workflow",
    description:
      "Start with core modules and expand based on branches, specialties, and organization needs.",
    proLabel: "Integrated",
    items: [
      {
        title: "Patients and reception",
        description:
          "Register patients, organize their information, and follow their journey from first contact.",
      },
      {
        title: "Appointments and clinic operations",
        description:
          "Flexible practitioner and clinic schedules with attendance, waiting, and rescheduling.",
      },
      {
        title: "Medical records and visits",
        description:
          "Document visits, clinical notes, and care plans in one connected record.",
      },
      {
        title: "Billing and collection",
        description:
          "Connect services to invoices, payments, treasury, and financial reporting.",
      },
      {
        title: "Branches and central administration",
        description:
          "Manage branches, departments, permissions, and performance centrally.",
      },
      {
        title: "Reporting and communication",
        description:
          "Dashboards, notifications, and WhatsApp workflows that support daily operations.",
      },
    ],
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const ServicesSection = async () => {
  const lang = await getPageLang();
  const isArabic = lang === "ar";
  const t = content[lang];

  return (
    <SectionContainer id="solutions">
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader
          subTitle={t.subTitle}
          title={t.title}
          description={t.description}
        />

        <div className="mx-auto grid w-full max-w-(--breakpoint-lg) gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {serviceList.map(({ title, description, pro }, index) => {
            const translatedItem = t.items[index];

            return (
              <Card key={title} className="bg-muted relative h-full gap-2">
                <CardHeader>
                  <CardTitle
                    className={cn("text-lg", isArabic && "text-right")}
                  >
                    {translatedItem?.title || title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p
                    className={cn(
                      "text-muted-foreground leading-7",
                      isArabic && "text-right"
                    )}
                  >
                    {translatedItem?.description || description}
                  </p>
                </CardContent>

                <Badge
                  data-pro={ProService.YES === pro}
                  variant="secondary"
                  className={cn(
                    "absolute data-[pro=false]:hidden",
                    isArabic ? "-top-2 -left-3" : "-top-2 -right-3"
                  )}
                >
                  {t.proLabel}
                </Badge>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
};
