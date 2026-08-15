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
      ? "شروط الاستخدام | Marilyn Clinics"
      : "Terms of Use | Marilyn Clinics",
    description: isArabic
      ? "الشروط المنظمة لاستخدام موقع Marilyn Clinics وخدمات الحجز الإلكتروني."
      : "Terms governing the use of the Marilyn Clinics website and online booking services.",
    metadataBase: new URL(PUBLIC_SITE.url),
    alternates: {
      canonical: "/terms",
    },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  const content = isArabic
    ? {
        eyebrow: "الشروط والسياسات",
        title: "شروط الاستخدام",
        description:
          "تنظم هذه الشروط استخدام موقع Marilyn Clinics وخدمات الحجز والتواصل المتاحة من خلاله.",
        sections: [
          {
            title: "1. قبول الشروط",
            paragraphs: [
              "باستخدام موقع Marilyn Clinics أو خدماته الإلكترونية فإنك توافق على الالتزام بهذه الشروط وسياسة الخصوصية والسياسات الأخرى المنشورة على الموقع.",
            ],
          },
          {
            title: "2. طبيعة الموقع",
            paragraphs: [
              "يوفر الموقع معلومات عامة عن Marilyn Clinics وخدماتها وفروعها وممارسيها، كما يتيح خدمات إلكترونية مثل الاستعلام والحجز والتواصل.",
              "لا تُعد المعلومات العامة المنشورة عبر الموقع تشخيصًا طبيًا أو بديلًا عن التقييم السريري المباشر.",
            ],
          },
          {
            title: "3. دقة البيانات",
            paragraphs: [
              "يتحمل المستخدم مسؤولية تقديم معلومات صحيحة ومحدثة عند التسجيل أو الحجز أو التواصل، بما في ذلك بيانات الاتصال والبيانات الصحية المطلوبة للخدمة.",
            ],
          },
          {
            title: "4. الحجوزات والمواعيد",
            items: [
              "يعتمد تأكيد الموعد على توفر الفرع والخدمة والممارس والوقت المختار.",
              "قد تتواصل Marilyn Clinics معك لتأكيد الموعد أو طلب بيانات إضافية لازمة للخدمة.",
              "قد تتم إعادة جدولة الموعد عند وجود ظروف تشغيلية أو طبية تستدعي ذلك، مع التواصل مع العميل قدر الإمكان.",
              "تخضع عمليات الإلغاء والاسترجاع لسياسة الإلغاء والاسترجاع المنشورة بالموقع.",
            ],
          },
          {
            title: "5. الأسعار والمدفوعات",
            paragraphs: [
              "تظهر الأسعار والمبالغ المستحقة عند توفرها وفق الخدمة والحجز المختار. وقد تختلف تكلفة العلاج النهائية عندما تتطلب الخدمة تقييمًا سريريًا أو إجراءات إضافية يتم توضيحها قبل تنفيذها.",
              "تتم عمليات الدفع الإلكتروني من خلال وسائل الدفع المتاحة والمعتمدة، وقد تخضع لمتطلبات مزود خدمة الدفع.",
            ],
          },
          {
            title: "6. النتائج الطبية والتجميلية",
            paragraphs: [
              "تختلف الاستجابة والنتائج الطبية والتجميلية من شخص لآخر بحسب الحالة الصحية وطبيعة الإجراء وعوامل أخرى. ولا تشكل الصور أو المعلومات العامة بالموقع ضمانًا لنتيجة محددة.",
            ],
          },
          {
            title: "7. الاستخدام المقبول",
            items: [
              "عدم إساءة استخدام الموقع أو محاولة الوصول غير المصرح به إلى الأنظمة أو البيانات.",
              "عدم تقديم بيانات مزيفة أو استخدام هوية شخص آخر دون صلاحية.",
              "عدم استخدام المحتوى أو الخدمات لأغراض غير مشروعة أو للإضرار بالموقع أو مستخدميه.",
            ],
          },
          {
            title: "8. الملكية الفكرية",
            paragraphs: [
              "تعود حقوق الهوية والعلامات والمحتوى والتصميمات والمواد الخاصة بـMarilyn Clinics إلى أصحابها أو مرخصيها بحسب الأحوال، ولا يجوز إعادة استخدامها خارج الحدود المسموح بها نظامًا دون إذن.",
            ],
          },
          {
            title: "9. الروابط والخدمات الخارجية",
            paragraphs: [
              "قد يحتوي الموقع على روابط أو تكاملات مع خدمات خارجية مثل منصات التواصل أو الدفع أو الخرائط. تخضع هذه الخدمات لشروط وسياسات مقدميها عند الانتقال إليها أو استخدامها.",
            ],
          },
          {
            title: "10. توافر الموقع",
            paragraphs: [
              "نسعى إلى توفير الموقع والخدمات الإلكترونية بصورة مستقرة، إلا أن الخدمة قد تتوقف مؤقتًا للصيانة أو التحديث أو لأسباب تقنية أو خارجة عن السيطرة.",
            ],
          },
          {
            title: "11. تعديل الشروط",
            paragraphs: [
              "يجوز تحديث هذه الشروط عند الحاجة. تصبح النسخة المنشورة على الموقع هي النسخة الحالية من تاريخ نشرها، مع مراعاة الحقوق والالتزامات التي نشأت قبل التعديل وفق الأنظمة المعمول بها.",
            ],
          },
          {
            title: "12. الأنظمة المطبقة",
            paragraphs: [
              "تخضع هذه الشروط للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، دون الإخلال بأي حقوق إلزامية مقررة للمستهلك أو المريض بموجب الأنظمة.",
            ],
          },
        ],
      }
    : {
        eyebrow: "Terms & policies",
        title: "Terms of Use",
        description:
          "These terms govern the use of the Marilyn Clinics website and its online booking and communication services.",
        sections: [
          {
            title: "1. Acceptance",
            paragraphs: [
              "By using the Marilyn Clinics website or its online services, you agree to these Terms of Use, the Privacy Policy, and other policies published on the website.",
            ],
          },
          {
            title: "2. Nature of the website",
            paragraphs: [
              "The website provides general information about Marilyn Clinics, services, branches, and practitioners and enables online functions including inquiries, booking, and communication.",
              "General website information is not a medical diagnosis and does not replace direct clinical assessment.",
            ],
          },
          {
            title: "3. Accuracy of information",
            paragraphs: [
              "Users are responsible for providing accurate and current information when registering, booking, or communicating, including relevant contact and health information required for a service.",
            ],
          },
          {
            title: "4. Appointments",
            items: [
              "Appointment confirmation depends on availability of the selected branch, service, practitioner, and time.",
              "Marilyn Clinics may contact you to confirm a booking or request information required for the service.",
              "Appointments may be rescheduled where operational or clinical circumstances require it, with reasonable efforts to contact the client.",
              "Cancellation and refunds are governed by the Cancellation & Refund Policy published on this website.",
            ],
          },
          {
            title: "5. Prices and payments",
            paragraphs: [
              "Prices and payable amounts are displayed where available for the selected booking. Final treatment cost may differ where clinical assessment or additional procedures are required and will be explained before delivery.",
              "Online payments are processed using available approved payment methods and may also be subject to the payment provider's requirements.",
            ],
          },
          {
            title: "6. Medical and aesthetic outcomes",
            paragraphs: [
              "Medical and aesthetic responses and outcomes vary between individuals according to health condition, treatment type, and other factors. Website images and general information do not guarantee a specific outcome.",
            ],
          },
          {
            title: "7. Acceptable use",
            items: [
              "Do not misuse the website or attempt unauthorized access to systems or information.",
              "Do not submit false information or impersonate another person without authority.",
              "Do not use the website or its content for unlawful or harmful purposes.",
            ],
          },
          {
            title: "8. Intellectual property",
            paragraphs: [
              "Marilyn Clinics branding, content, designs, and materials belong to their respective owners or licensors and may not be reused beyond what is legally permitted without authorization.",
            ],
          },
          {
            title: "9. Third-party services",
            paragraphs: [
              "The website may link to or integrate third-party services such as social networks, payment providers, and maps. Their own terms and policies apply when those services are used.",
            ],
          },
          {
            title: "10. Availability",
            paragraphs: [
              "We aim to keep the website and online services available, but temporary interruptions may occur for maintenance, updates, technical reasons, or circumstances beyond our control.",
            ],
          },
          {
            title: "11. Changes to the terms",
            paragraphs: [
              "These terms may be updated when necessary. The version published on the website is the current version from its publication date, subject to rights and obligations already established under applicable law.",
            ],
          },
          {
            title: "12. Governing requirements",
            paragraphs: [
              "These terms are governed by applicable laws and regulations in the Kingdom of Saudi Arabia without limiting mandatory consumer or patient rights.",
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
