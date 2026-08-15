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
      ? "سياسة الخصوصية | Marilyn Clinics"
      : "Privacy Policy | Marilyn Clinics",
    description: isArabic
      ? "سياسة Marilyn Clinics بشأن جمع البيانات الشخصية والصحية واستخدامها وحمايتها."
      : "Marilyn Clinics policy regarding the collection, use, and protection of personal and health-related information.",
    metadataBase: new URL(PUBLIC_SITE.url),
    alternates: {
      canonical: "/privacy",
    },
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  const content = isArabic
    ? {
        eyebrow: "الخصوصية وحماية البيانات",
        title: "سياسة الخصوصية",
        description:
          "توضح هذه السياسة كيفية تعامل Marilyn Clinics مع البيانات الشخصية التي تقدمها عند استخدام الموقع أو خدمات الحجز والتواصل.",
        sections: [
          {
            title: "1. مقدمة",
            paragraphs: [
              "تحترم Marilyn Clinics خصوصية زوار الموقع والعملاء والمرضى، وتلتزم بالتعامل مع البيانات الشخصية بطريقة مسؤولة وآمنة وبما يتوافق مع الأنظمة واللوائح المعمول بها في المملكة العربية السعودية.",
              "يعني استخدامك للموقع أو تقديمك للبيانات عبر نماذج الحجز أو التسجيل أو التواصل أنك اطلعت على هذه السياسة وفهمت كيفية معالجة البيانات الموضحة فيها.",
            ],
          },
          {
            title: "2. البيانات التي قد نجمعها",
            paragraphs: [
              "نجمع البيانات بالقدر اللازم لتقديم الخدمات وإدارة رحلة الحجز والرعاية والتواصل معك.",
            ],
            items: [
              "الاسم وبيانات الهوية عند الحاجة للتحقق من المستخدم أو إنشاء الملف.",
              "رقم الهاتف والبريد الإلكتروني وبيانات التواصل.",
              "بيانات المواعيد والفروع والخدمات والممارسين المرتبطين بالحجز.",
              "البيانات الصحية أو الطبية التي تقدمها بصورة مباشرة عندما تكون ضرورية لتقديم الخدمة أو الرعاية المناسبة.",
              "بيانات المدفوعات والحالة المالية المرتبطة بالحجز، مع مراعاة أن معالجة بيانات البطاقات قد تتم بواسطة مزودي دفع متخصصين.",
              "البيانات التقنية مثل عنوان IP ونوع المتصفح والجهاز وسجلات الاستخدام وملفات الارتباط والتحليلات عند استخدامها.",
              "المراسلات والطلبات والملاحظات التي تقدمها عبر قنوات التواصل المعتمدة.",
            ],
          },
          {
            title: "3. أغراض استخدام البيانات",
            items: [
              "إنشاء وإدارة حساب المستخدم أو ملف المريض عند الحاجة.",
              "تنفيذ الحجوزات وتأكيد المواعيد وإعادة جدولتها أو إلغائها.",
              "تقديم الخدمات الطبية والتجميلية والمتابعة المرتبطة بها.",
              "التواصل معك بشأن المواعيد والطلبات والتنبيهات التشغيلية.",
              "معالجة المدفوعات والاستردادات والسجلات المالية المرتبطة بالخدمة.",
              "تحسين تجربة الموقع والخدمات وقياس الأداء والجودة.",
              "حماية الموقع والأنظمة والمستخدمين من الاستخدام غير المشروع أو الاحتيال.",
              "الوفاء بالالتزامات النظامية والتنظيمية أو الاستجابة لطلبات الجهات المختصة.",
            ],
          },
          {
            title: "4. البيانات الصحية",
            paragraphs: [
              "قد تتطلب بعض خدمات Marilyn Clinics جمع بيانات صحية أو طبية. يتم التعامل مع هذه البيانات باعتبارها بيانات حساسة، ولا يتم استخدامها إلا للأغراض المرتبطة بالرعاية والخدمة والأغراض النظامية ذات الصلة وبالقدر اللازم.",
            ],
          },
          {
            title: "5. مشاركة البيانات",
            paragraphs: [
              "لا تبيع Marilyn Clinics بياناتك الشخصية. وقد تتم مشاركة الحد الأدنى اللازم من البيانات عندما يكون ذلك ضروريًا لتقديم الخدمة أو بموجب متطلب نظامي.",
            ],
            items: [
              "الممارسون والموظفون المخولون داخل Marilyn Clinics بحسب الحاجة الوظيفية.",
              "مقدمو الخدمات التقنية والاستضافة والرسائل والدفع والخدمات التشغيلية المتعاقد معهم.",
              "الجهات الحكومية أو التنظيمية أو القضائية متى كان الإفصاح مطلوبًا نظامًا.",
              "أطراف أخرى بعد الحصول على الموافقة متى كانت الموافقة مطلوبة.",
            ],
          },
          {
            title: "6. حماية البيانات",
            paragraphs: [
              "تطبق Marilyn Clinics تدابير تنظيمية وتقنية مناسبة للمساعدة في حماية البيانات من الوصول أو الاستخدام أو التغيير أو الإفصاح غير المصرح به. ومع ذلك، لا يمكن ضمان انعدام المخاطر بصورة مطلقة في أي خدمة إلكترونية.",
            ],
          },
          {
            title: "7. الاحتفاظ بالبيانات",
            paragraphs: [
              "يتم الاحتفاظ بالبيانات للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها أو للمدة التي تتطلبها الأنظمة والالتزامات الطبية والمالية والتنظيمية، ثم يتم التعامل معها وفق متطلبات الاحتفاظ والإتلاف المعمول بها.",
            ],
          },
          {
            title: "8. ملفات الارتباط والتحليلات",
            paragraphs: [
              "قد يستخدم الموقع ملفات ارتباط وتقنيات تحليل لقياس الاستخدام وتحسين الأداء وتجربة الزائر. وعند استخدام خدمات تحليل خارجية، تتم معالجة البيانات وفق الإعدادات والسياسات المعتمدة لكل خدمة ومتطلبات الأنظمة ذات الصلة.",
            ],
          },
          {
            title: "9. حقوقك",
            paragraphs: [
              "يمكنك، وفق الأنظمة والضوابط المطبقة، طلب ممارسة الحقوق المتعلقة ببياناتك الشخصية.",
            ],
            items: [
              "الاستفسار عن أغراض جمع بياناتك وكيفية استخدامها.",
              "طلب الوصول إلى بياناتك الشخصية أو الحصول على نسخة منها متى كان ذلك متاحًا نظامًا.",
              "طلب تصحيح البيانات غير الدقيقة أو غير المكتملة أو تحديثها.",
              "طلب إتلاف البيانات أو حذفها في الحالات التي تسمح بها الأنظمة وبعد مراعاة متطلبات الاحتفاظ النظامية والطبية.",
              "سحب الموافقة في الحالات التي تكون فيها الموافقة أساس المعالجة، وذلك دون التأثير على المعالجة التي تمت بصورة مشروعة قبل السحب.",
            ],
          },
          {
            title: "10. حماية بيانات القاصرين",
            paragraphs: [
              "إذا كانت الخدمة تخص قاصرًا، فقد نطلب بيانات وموافقة ولي الأمر أو الممثل النظامي بحسب طبيعة الخدمة والمتطلبات النظامية ذات الصلة.",
            ],
          },
          {
            title: "11. التعديلات على السياسة",
            paragraphs: [
              "قد يتم تحديث هذه السياسة عند الحاجة لمواكبة التغييرات التشغيلية أو التقنية أو النظامية. وسيتم نشر النسخة المحدثة على هذه الصفحة مع توضيح تاريخ آخر تحديث.",
            ],
          },
          {
            title: "12. التواصل بشأن الخصوصية",
            paragraphs: [
              `لطلب الاستفسار أو ممارسة الحقوق المتعلقة بالبيانات، يمكنك التواصل مع Marilyn Clinics عبر ${PUBLIC_SITE.email} أو من خلال صفحة التواصل بالموقع.`,
            ],
          },
        ],
      }
    : {
        eyebrow: "Privacy & data protection",
        title: "Privacy Policy",
        description:
          "This policy explains how Marilyn Clinics handles personal information provided through the website, booking services, registration, and communications.",
        sections: [
          {
            title: "1. Introduction",
            paragraphs: [
              "Marilyn Clinics respects the privacy of website visitors, clients, and patients and handles personal data responsibly and securely in accordance with applicable laws and regulations in the Kingdom of Saudi Arabia.",
              "By using the website or submitting information through booking, registration, or contact forms, you acknowledge this policy and the processing activities described in it.",
            ],
          },
          {
            title: "2. Information we may collect",
            items: [
              "Name and identification information when required for verification or record creation.",
              "Telephone number, email address, and other contact information.",
              "Appointment, branch, service, and practitioner information.",
              "Health or medical information you directly provide when necessary for appropriate care or services.",
              "Payment and transaction status related to bookings; card data may be processed by specialized payment providers.",
              "Technical information including IP address, browser, device, usage records, cookies, and analytics where applicable.",
              "Messages, requests, and notes submitted through approved communication channels.",
            ],
          },
          {
            title: "3. How we use information",
            items: [
              "Create and manage user accounts or patient records where required.",
              "Book, confirm, reschedule, and cancel appointments.",
              "Provide medical and aesthetic services and related follow-up.",
              "Send appointment and operational communications.",
              "Process payments, refunds, and related financial records.",
              "Improve website experience, services, performance, and quality.",
              "Protect our systems and users against misuse and fraud.",
              "Meet legal and regulatory obligations and respond to competent authorities.",
            ],
          },
          {
            title: "4. Health information",
            paragraphs: [
              "Some Marilyn Clinics services may require health or medical information. Such information is treated as sensitive and is processed only as necessary for care, service delivery, and applicable legal or regulatory purposes.",
            ],
          },
          {
            title: "5. Sharing information",
            paragraphs: [
              "Marilyn Clinics does not sell personal information. We may share only the minimum information reasonably necessary to deliver services or satisfy applicable legal requirements.",
            ],
            items: [
              "Authorized Marilyn Clinics practitioners and staff on a need-to-know basis.",
              "Contracted technology, hosting, messaging, payment, and operational service providers.",
              "Governmental, regulatory, or judicial authorities where disclosure is legally required.",
              "Other parties where consent is obtained when consent is required.",
            ],
          },
          {
            title: "6. Data security",
            paragraphs: [
              "Marilyn Clinics applies appropriate organizational and technical measures designed to protect personal information against unauthorized access, use, alteration, or disclosure. No electronic service can guarantee complete elimination of all security risks.",
            ],
          },
          {
            title: "7. Data retention",
            paragraphs: [
              "Information is retained for as long as necessary for the purposes for which it was collected or as required by medical, financial, regulatory, and other applicable retention obligations.",
            ],
          },
          {
            title: "8. Cookies and analytics",
            paragraphs: [
              "The website may use cookies and analytics technologies to understand usage and improve performance. Where third-party analytics services are used, information is processed according to the relevant service configuration, policies, and applicable requirements.",
            ],
          },
          {
            title: "9. Your rights",
            items: [
              "Ask how and why your personal information is collected and used.",
              "Request access to personal information or a copy where available under applicable requirements.",
              "Request correction or updating of inaccurate or incomplete information.",
              "Request destruction or deletion where permitted, subject to medical, legal, and regulatory retention requirements.",
              "Withdraw consent where consent is the basis for processing, without affecting processing lawfully completed before withdrawal.",
            ],
          },
          {
            title: "10. Minors",
            paragraphs: [
              "Where a service relates to a minor, information or authorization from a parent or legal representative may be required depending on the nature of the service and applicable requirements.",
            ],
          },
          {
            title: "11. Changes to this policy",
            paragraphs: [
              "We may update this policy to reflect operational, technical, or regulatory changes. The latest version will be published on this page with an updated revision date.",
            ],
          },
          {
            title: "12. Privacy contact",
            paragraphs: [
              `For privacy inquiries or personal-data requests, contact Marilyn Clinics at ${PUBLIC_SITE.email} or through the website contact page.`,
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
