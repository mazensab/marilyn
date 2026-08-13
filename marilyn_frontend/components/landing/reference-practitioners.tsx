import { cookies } from "next/headers";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePublicLocale } from "@/lib/public-locale";
type PublicRelatedName = {
  id: number | null;
  name_ar: string;
  name_en: string;
  display_name: string;
};
type PublicPractitioner = {
  id: number;
  full_name_ar: string;
  full_name_en: string;
  display_name: string;
  professional_title: string;
  practitioner_type: string;
  primary_specialty: PublicRelatedName | null;
  default_branch: PublicRelatedName | null;
  is_accepting_appointments: boolean;
};
type PublicPractitionersPayload = {
  success: boolean;
  count: number;
  results: PublicPractitioner[];
};
function getApiBaseUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "";
  return raw.endsWith("/api")
    ? raw.slice(0, -4)
    : raw;
}
function localizedRelatedName(
  value: PublicRelatedName | null,
  isArabic: boolean,
) {
  if (!value) return "";
  return (
    (isArabic ? value.name_ar : value.name_en) ||
    value.display_name ||
    value.name_ar ||
    value.name_en
  );
}
function practitionerName(
  practitioner: PublicPractitioner,
  isArabic: boolean,
) {
  return (
    (isArabic
      ? practitioner.full_name_ar
      : practitioner.full_name_en) ||
    practitioner.display_name ||
    practitioner.full_name_ar ||
    practitioner.full_name_en
  );
}
function practitionerTypeLabel(
  type: string,
  isArabic: boolean,
) {
  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    PHYSICIAN: {
      ar: "طبيب",
      en: "Physician",
    },
    DENTIST: {
      ar: "طبيب أسنان",
      en: "Dentist",
    },
    NURSE: {
      ar: "تمريض",
      en: "Nursing",
    },
    PHARMACIST: {
      ar: "صيدلي",
      en: "Pharmacist",
    },
    TECHNICIAN: {
      ar: "أخصائي تقني",
      en: "Technician",
    },
    THERAPIST: {
      ar: "معالج",
      en: "Therapist",
    },
    OTHER: {
      ar: "ممارس صحي",
      en: "Healthcare practitioner",
    },
  };
  const label = labels[type];
  if (!label) return "";
  return isArabic
    ? label.ar
    : label.en;
}
function initials(value: string) {
  const parts = value
    .replace(/^د\.\s*/u, "")
    .replace(/^Dr\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) {
    return "M";
  }
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
async function getPublicPractitioners():
  Promise<PublicPractitioner[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return [];
  }
  try {
    const response = await fetch(
      `${baseUrl}/api/public/practitioners/`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return [];
    }
    const payload =
      (await response.json()) as PublicPractitionersPayload;
    if (
      !payload ||
      !Array.isArray(payload.results)
    ) {
      return [];
    }
    return payload.results.filter(
      (item) =>
        item &&
        typeof item.id === "number" &&
        Boolean(item.display_name),
    );
  } catch {
    return [];
  }
}
export async function ReferencePractitioners() {
  const cookieStore = await cookies();
  const locale = normalizePublicLocale(
    cookieStore.get("lang")?.value ||
      cookieStore.get("locale")?.value ||
      cookieStore.get("NEXT_LOCALE")?.value,
  );
  const isArabic = locale === "ar";
  const practitioners =
    await getPublicPractitioners();
  // No fabricated doctors or placeholder profiles.
  // The entire section disappears when no real public
  // practitioner records are available.
  if (!practitioners.length) {
    return null;
  }
  const copy = isArabic
    ? {
        eyebrow: "الفريق الطبي",
        title: "خبرات طبية ترافق رحلتك",
        description:
          "تعرّفي على الممارسين المتاحين للحجز في Marilyn Clinics واختاري الموعد الأنسب لرحلتك.",
        available: "متاح للحجز",
        book: "احجزي موعدًا",
      }
    : {
        eyebrow: "Medical team",
        title: "Clinical expertise for your care journey",
        description:
          "Meet the practitioners currently available for booking at Marilyn Clinics and choose the appointment that suits you.",
        available: "Available to book",
        book: "Book appointment",
      };
  return (
    <section
      id="practitioners"
      dir={isArabic ? "rtl" : "ltr"}
      className="
        relative
        scroll-mt-28
        overflow-hidden
        bg-[#f8f2e9]
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -start-20
          top-10
          size-56
          rounded-full
          border
          border-white/45
          bg-white/18
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-28
          end-4
          size-64
          rounded-full
          border
          border-[#d4bea0]/25
          bg-[#ead9c2]/20
        "
      />
      <div className="container relative py-12 sm:py-14 lg:py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div
            className="
              mb-3
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#cbb58f]/45
              bg-white/60
              px-3.5
              py-1.5
              text-xs
              font-semibold
              text-[#9a7138]
              shadow-[0_5px_16px_rgba(92,67,38,0.05)]
              backdrop-blur-xl
            "
          >
            <Sparkles className="size-3.5" />
            {copy.eyebrow}
          </div>
          <h2
            className="
              text-2xl
              font-semibold
              tracking-[-0.025em]
              text-[#172238]
              sm:text-3xl
              lg:text-[2.15rem]
            "
          >
            {copy.title}
          </h2>
          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-7
              text-[#6c7480]
              sm:text-[15px]
            "
          >
            {copy.description}
          </p>
        </div>
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {practitioners.map(
            (practitioner) => {
              const name = practitionerName(
                practitioner,
                isArabic,
              );
              const specialty =
                localizedRelatedName(
                  practitioner.primary_specialty,
                  isArabic,
                );
              const branch =
                localizedRelatedName(
                  practitioner.default_branch,
                  isArabic,
                );
              const subtitle =
                practitioner.professional_title ||
                specialty ||
                practitionerTypeLabel(
                  practitioner.practitioner_type,
                  isArabic,
                );
              return (
                <article
                  key={practitioner.id}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[26px]
                    border
                    border-[#cbbda9]/45
                    bg-white/70
                    p-4
                    shadow-[0_16px_44px_rgba(83,61,35,0.065)]
                    backdrop-blur-xl
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:border-[#bea071]/60
                    hover:shadow-[0_22px_54px_rgba(83,61,35,0.10)]
                  "
                >
                  <div
                    className="
                      relative
                      flex
                      min-h-[170px]
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-[20px]
                      border
                      border-white/65
                      bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_52%,#dec6a8_100%)]
                    "
                  >
                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        -start-10
                        -top-14
                        size-36
                        rounded-full
                        border
                        border-white/50
                        bg-white/20
                      "
                    />
                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        -bottom-16
                        -end-8
                        size-40
                        rounded-full
                        border
                        border-[#c8aa7c]/30
                        bg-[#e7d1b4]/30
                      "
                    />
                    <div
                      className="
                        relative
                        flex
                        size-[92px]
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/80
                        bg-white/72
                        text-2xl
                        font-semibold
                        tracking-wide
                        text-[#a57b3d]
                        shadow-[0_12px_30px_rgba(112,79,40,0.12)]
                        backdrop-blur-xl
                      "
                      aria-label={name}
                    >
                      {initials(name)}
                    </div>
                    <div
                      className="
                        absolute
                        end-3
                        top-3
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-white/75
                        bg-white/72
                        px-2.5
                        py-1
                        text-[11px]
                        font-semibold
                        text-[#8d6836]
                        shadow-sm
                        backdrop-blur-xl
                      "
                    >
                      <span
                        className="
                          size-1.5
                          rounded-full
                          bg-[#b68a4a]
                        "
                      />
                      {copy.available}
                    </div>
                  </div>
                  <div className="px-1 pb-1 pt-4">
                    <h3
                      className="
                        text-lg
                        font-semibold
                        tracking-[-0.02em]
                        text-[#172238]
                      "
                    >
                      {name}
                    </h3>
                    {subtitle ? (
                      <p
                        className="
                          mt-1
                          text-sm
                          font-medium
                          text-[#9a7138]
                        "
                      >
                        {subtitle}
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-2">
                      {specialty ? (
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-[#69717d]
                          "
                        >
                          <Stethoscope
                            className="
                              size-4
                              shrink-0
                              text-[#b48745]
                            "
                          />
                          <span>
                            {specialty}
                          </span>
                        </div>
                      ) : null}
                      {branch ? (
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-[#69717d]
                          "
                        >
                          <MapPin
                            className="
                              size-4
                              shrink-0
                              text-[#b48745]
                            "
                          />
                          <span>
                            {branch}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <Button
                      asChild
                      className="
                        mt-5
                        h-10
                        w-full
                        rounded-full
                        border
                        border-[#b58c4d]/40
                        bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)]
                        font-semibold
                        text-[#2e251a]
                        shadow-[0_10px_24px_rgba(168,121,56,0.20)]
                        transition
                        hover:brightness-[1.03]
                      "
                    >
                      <Link href="/book">
                        <CalendarDays className="size-4" />
                        {copy.book}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
export default ReferencePractitioners;
