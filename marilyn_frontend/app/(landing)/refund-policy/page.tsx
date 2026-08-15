import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LegalPage } from "@/components/landing/legal-page";
import { FooterSection } from "@/components/layout/sections/footer";
import { normalizePublicLocale } from "@/lib/public-locale";
import { PUBLIC_SITE } from "@/lib/public-site-config";

async function getLocale() {
  const cookieStore = await cookies();

  return normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  return {
    title: isArabic
      ? "سياسة الإلغاء والاسترجاع | Marilyn Clinics"
      : "Cancellation & Refund Policy | Marilyn Clinics",
    description: isArabic
      ? "سياسة Marilyn Clinics الخاصة بإلغاء المواعيد واسترداد المدفوعات."
      : "Marilyn Clinics policy for appointment cancellations and payment refunds.",
    metadataBase: new URL(PUBLIC_SITE.url),
    alternates: {
      canonical: "/refund-policy",
    },
  };
}

export default async function RefundPolicyPage() {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  const content = isArabic
    ? {
        eyebrow: "الحجوزات والمدفوعات",
        title: "سياسة الإلغاء والاسترجاع",
        description:
          "توضح هذه السياسة الحالات العامة لإلغاء المواعيد واسترداد المبالغ المدفوعة لدى Marilyn Clinics.",
        sections: [
          {
            title: "1. الإلغاء قبل الموعد",
            paragraphs: [
              "يمكن للعميل طلب إلغاء الموعد واسترداد المبلغ المؤهل للاسترداد عندما يتم تقديم طلب الإلغاء قبل 24 ساعة على الأقل من موعد الخدمة.",
            ],
          },
          {
            title: "2. الإلغاء خلال أقل من 24 ساعة",
            paragraphs: [
              "عند إلغاء الموعد قبل أقل من 24 ساعة من موعد الخدمة، لا يكون المبلغ المدفوع مستحقًا للاسترداد كقاعدة عامة، وذلك بسبب حجز وقت الخدمة والموارد المخصصة للموعد.",
              "لا يمنع ذلك Marilyn Clinics من دراسة الحالات الاستثنائية وفق ظروف كل حالة أو أي حقوق إلزامية تقررها الأنظمة المعمول بها.",
            ],
          },
          {
            title: "3. عدم الحضور",
            paragraphs: [
              "يُعامل عدم حضور العميل للموعد دون إلغاء مسبق ضمن المدة المحددة معاملة الإلغاء المتأخر، وقد لا يكون المبلغ المدفوع مستحقًا للاسترداد.",
            ],
          },
          {
            title: "4. إلغاء الموعد من Marilyn Clinics",
            paragraphs: [
              "إذا تعذر تقديم الخدمة واضطرت Marilyn Clinics إلى إلغاء الموعد، فسيتم التواصل مع العميل لعرض إعادة الجدولة أو معالجة المبلغ المدفوع وفق الحالة وطريقة الدفع.",
            ],
          },
          {
            title: "5. الخدمات التي تم تنفيذها",
            paragraphs: [
              "بعد تنفيذ الخدمة أو الإجراء الطبي أو التجميلي، لا ينشأ حق تلقائي في الاسترداد لمجرد اختلاف التوقعات أو النتيجة، إذ تختلف النتائج والاستجابة بين الأشخاص. ولا يؤثر ذلك على أي حقوق نظامية تتعلق بسلامة الخدمة أو الالتزامات المهنية.",
            ],
          },
          {
            title: "6. طريقة طلب الاسترجاع",
            paragraphs: [
              "يتم تقديم طلب الإلغاء أو الاسترجاع من خلال قنوات التواصل المعتمدة لدى Marilyn Clinics مع تزويدنا بالبيانات التي تساعد على التحقق من الحجز.",
            ],
            items: [
              "اسم صاحب الحجز.",
              "رقم الهاتف المستخدم في الحجز.",
              "رقم أو بيانات الحجز إن وجدت.",
              "تاريخ ووقت الموعد.",
              "سبب طلب الإلغاء أو الاسترجاع.",
            ],
          },
          {
            title: "7. معالجة المبالغ المستردة",
            paragraphs: [
              "بعد قبول طلب الاسترداد، تتم إعادة المبلغ المؤهل للاسترداد إلى وسيلة الدفع الأصلية متى كان ذلك ممكنًا، أو بطريقة أخرى تعتمدها Marilyn Clinics عند الحاجة.",
              "قد تختلف مدة ظهور المبلغ بحسب البنك أو شبكة الدفع أو مزود خدمة الدفع، وهي مدة قد تكون خارج السيطرة المباشرة لـMarilyn Clinics بعد تنفيذ عملية الاسترداد.",
            ],
          },
          {
            title: "8. العروض والباقات",
            paragraphs: [
              "قد تكون بعض العروض أو الباقات أو الحجوزات الترويجية خاضعة لشروط إضافية يتم توضيحها عند الشراء أو الحجز، على ألا تنتقص من الحقوق الإلزامية المقررة بموجب الأنظمة المعمول بها.",
            ],
          },
          {
            title: "9. التعديلات",
            paragraphs: [
              "قد يتم تحديث هذه السياسة عند الحاجة. تطبق النسخة المعروضة وقت الحجز على ذلك الحجز ما لم تتطلب الأنظمة خلاف ذلك.",
            ],
          },
          {
            title: "10. الأنظمة المطبقة",
            paragraphs: [
              "تخضع هذه السياسة للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، ولا تهدف إلى تقييد أي حق إلزامي مقرر نظامًا.",
            ],
          },
        ],
      }
    : {
        eyebrow: "Bookings & payments",
        title: "Cancellation & Refund Policy",
        description:
          "This policy explains the general rules for appointment cancellation and refunds at Marilyn Clinics.",
        sections: [
          {
            title: "1. Cancellation before the appointment",
            paragraphs: [
              "A client may request cancellation and a refund of the eligible amount when the cancellation request is submitted at least 24 hours before the scheduled service time.",
            ],
          },
          {
            title: "2. Cancellation within 24 hours",
            paragraphs: [
              "Where an appointment is cancelled less than 24 hours before the scheduled service, the payment is generally non-refundable because appointment time and resources have already been reserved.",
              "Marilyn Clinics may still review exceptional circumstances on a case-by-case basis, and this does not limit any mandatory rights provided by applicable law.",
            ],
          },
          {
            title: "3. No-show",
            paragraphs: [
              "Failure to attend an appointment without timely cancellation is generally treated as a late cancellation and the paid amount may be non-refundable.",
            ],
          },
          {
            title: "4. Cancellation by Marilyn Clinics",
            paragraphs: [
              "If Marilyn Clinics is unable to provide the scheduled service and cancels the appointment, the client will be contacted to arrange rescheduling or appropriate handling of the payment according to the circumstances and payment method.",
            ],
          },
          {
            title: "5. Services already provided",
            paragraphs: [
              "Once a medical or aesthetic service has been delivered, a refund does not arise automatically solely because expectations or outcomes differ. Results and responses vary between individuals. This does not limit applicable rights relating to service safety or professional obligations.",
            ],
          },
          {
            title: "6. How to request a refund",
            items: [
              "Name of the booking holder.",
              "Telephone number used for the booking.",
              "Booking number or booking details where available.",
              "Appointment date and time.",
              "Reason for the cancellation or refund request.",
            ],
          },
          {
            title: "7. Refund processing",
            paragraphs: [
              "Once approved, the eligible refund will normally be returned to the original payment method where possible, or through another method approved by Marilyn Clinics where necessary.",
              "The time required for the refund to appear may vary depending on the bank, card network, or payment provider and may be outside Marilyn Clinics' direct control after the refund has been processed.",
            ],
          },
          {
            title: "8. Offers and packages",
            paragraphs: [
              "Certain promotional offers, packages, or bookings may have additional terms disclosed at purchase or booking, without limiting mandatory rights under applicable law.",
            ],
          },
          {
            title: "9. Changes",
            paragraphs: [
              "This policy may be updated when necessary. The version displayed at the time of booking generally applies to that booking unless applicable law requires otherwise.",
            ],
          },
          {
            title: "10. Applicable requirements",
            paragraphs: [
              "This policy is subject to applicable laws and regulations in the Kingdom of Saudi Arabia and is not intended to restrict any mandatory legal right.",
            ],
          },
        ],
      };

  return (
    <>
      <LegalPage
        isArabic={isArabic}
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        sections={content.sections}
        lastUpdated="15 August 2026"
      />

      <FooterSection />
    </>
  );
}
