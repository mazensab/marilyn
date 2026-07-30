import { cookies } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import SectionContainer from "@/components/layout/section-container";
import SectionHeader from "@/components/layout/section-header";

type AppLang = "ar" | "en";

async function getPageLang(): Promise<AppLang> {
  const cookieStore = await cookies();
  const cookieLang =
    cookieStore.get("lang")?.value ||
    cookieStore.get("locale")?.value ||
    cookieStore.get("NEXT_LOCALE")?.value ||
    "";
  return cookieLang.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export async function NewsletterSection() {
  const lang = await getPageLang();
  const isArabic = lang === "ar";

  return (
    <SectionContainer>
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader
          title={
            isArabic
              ? "ابدأ تهيئة Marilyn Clinics لمنشأتك"
              : "Start configuring Marilyn Clinics for your organization"
          }
          description={
            isArabic
              ? "شاركنا احتياج المنشأة والفروع والمستخدمين لنحدد نطاق التهيئة والوحدات المناسبة دون أسعار أو وعود غير معتمدة."
              : "Share your organization, branch, and user requirements so the setup scope and suitable modules can be defined without unapproved pricing or promises."
          }
        />

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/register">
              {isArabic ? "إرسال طلب البدء" : "Submit a request"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">
              {isArabic ? "التواصل معنا" : "Contact us"}
            </Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
}
