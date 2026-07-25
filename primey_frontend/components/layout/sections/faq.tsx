import { cookies } from "next/headers";

import { FAQList } from "@/@data/faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import SectionHeader from "../section-header";
import SectionContainer from "../section-container";

/* =========================================================
   🌐 Language Types
========================================================= */
type AppLang = "ar" | "en";

type FAQItemTranslation = {
  question: string;
  answer: string;
};

type FAQContent = {
  subTitle: string;
  title: string;
  items: FAQItemTranslation[];
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
const faqContent: Record<AppLang, FAQContent> = {
  ar: {
    subTitle: "الأسئلة الشائعة",
    title: "ما تحتاج معرفته قبل بدء التشغيل",
    items: [
      {
        question: "ما هي Marilyn Clinics؟",
        answer:
          "منصة سحابية لإدارة العيادات والمراكز الطبية تربط المرضى والمواعيد والسجلات الطبية والممارسين والفوترة والفروع والتقارير.",
      },
      {
        question: "هل تدعم المنصة أكثر من فرع؟",
        answer:
          "نعم، صممت لإدارة عدة فروع وأقسام وعيادات مع صلاحيات وتقارير حسب المنشأة والفرع.",
      },
      {
        question: "كيف تتم حماية بيانات المنشأة؟",
        answer:
          "تعتمد المنصة على فصل بيانات المنشآت وصلاحيات حسب الدور وسياق الفرع، مع تتبع الإجراءات الحساسة.",
      },
      {
        question: "هل يمكن ربط الفوترة بالمواعيد والزيارات؟",
        answer:
          "نعم، تهدف الوحدات المترابطة إلى ربط الخدمات والزيارات بالفواتير والمدفوعات والخزينة والتقارير.",
      },
      {
        question: "هل تدعم العربية والإنجليزية؟",
        answer:
          "نعم، الواجهة تدعم العربية والإنجليزية واتجاهي RTL وLTR مع تجربة مناسبة للمنشآت في السعودية.",
      },
      {
        question: "كيف أبدأ؟",
        answer:
          "أرسل طلبك من صفحة البدء، ثم تحدد احتياجات المنشأة والفروع والمستخدمين والوحدات المطلوبة قبل التهيئة.",
      },
    ],
  },
  en: {
    subTitle: "FAQS",
    title: "What to know before getting started",
    items: [
      {
        question: "What is Marilyn Clinics?",
        answer:
          "A cloud platform for clinics and medical centers that connects patients, appointments, medical records, practitioners, billing, branches, and reporting.",
      },
      {
        question: "Does it support multiple branches?",
        answer:
          "Yes. It is designed for multiple branches, departments, and clinics with role- and branch-based permissions and reporting.",
      },
      {
        question: "How is organization data protected?",
        answer:
          "The platform uses organization data isolation, role-based access, branch context, and traceable sensitive actions.",
      },
      {
        question: "Can billing connect to appointments and visits?",
        answer:
          "Yes. Connected modules are designed to link services and visits with invoices, payments, treasury, and reporting.",
      },
      {
        question: "Does the platform support Arabic and English?",
        answer:
          "Yes. The interface supports Arabic and English, RTL and LTR, and workflows suitable for Saudi medical organizations.",
      },
      {
        question: "How do we get started?",
        answer:
          "Submit a request through the registration page, then define branches, users, required modules, and setup needs.",
      },
    ],
  },
};

/* =========================================================
   🧩 Section
========================================================= */
export const FAQSection = async () => {
  const lang = await getPageLang();
  const isArabic = lang === "ar";
  const t = faqContent[lang];

  return (
    <SectionContainer id="faq">
      <div dir={isArabic ? "rtl" : "ltr"}>
        <SectionHeader subTitle={t.subTitle} title={t.title} />

        <div className="max-w-(--breakpoint-sm) mx-auto">
          <Accordion type="single" collapsible className="AccordionRoot">
            {FAQList.map(({ question, answer, value }, index) => {
              const translatedItem = t.items[index];

              return (
                <AccordionItem key={value} value={value}>
                  <AccordionTrigger
                    className={cn(
                      "text-lg",
                      isArabic ? "text-right" : "text-left"
                    )}
                  >
                    {translatedItem?.question || question}
                  </AccordionTrigger>

                  <AccordionContent
                    className={cn(
                      "text-base text-muted-foreground leading-7",
                      isArabic && "text-right"
                    )}
                  >
                    {translatedItem?.answer || answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </SectionContainer>
  );
};
