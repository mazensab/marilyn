export type PublicPractitionerRelatedName = {
  id: number | null;
  name_ar: string;
  name_en: string;
  display_name: string;
};
export type PublicPractitioner = {
  id: number;
  full_name_ar: string;
  full_name_en: string;
  display_name: string;
  professional_title: string;
  practitioner_type: string;
  primary_specialty: PublicPractitionerRelatedName | null;
  default_branch: PublicPractitionerRelatedName | null;
  is_accepting_appointments: boolean;
};
type PublicPractitionersPayload = {
  success: boolean;
  count: number;
  results: PublicPractitioner[];
};
type PublicPractitionerPayload = {
  success: boolean;
  item: PublicPractitioner;
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
  if (!raw) {
    return "";
  }
  return raw.endsWith("/api")
    ? raw.slice(0, -4)
    : raw;
}
export function localizedPractitionerName(
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
export function localizedPractitionerRelatedName(
  value: PublicPractitionerRelatedName | null,
  isArabic: boolean,
) {
  if (!value) {
    return "";
  }
  return (
    (isArabic
      ? value.name_ar
      : value.name_en) ||
    value.display_name ||
    value.name_ar ||
    value.name_en
  );
}
export function practitionerTypeLabel(
  type: string,
  isArabic: boolean,
) {
  const labels: Record<
    string,
    {
      ar: string;
      en: string;
    }
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
  const value = labels[type];
  if (!value) {
    return "";
  }
  return isArabic
    ? value.ar
    : value.en;
}
export function practitionerInitials(
  value: string,
) {
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
export async function getPublicPractitioners():
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
    if (!Array.isArray(payload.results)) {
      return [];
    }
    return payload.results.filter(
      (item) =>
        Boolean(item) &&
        typeof item.id === "number" &&
        item.id > 0 &&
        Boolean(item.display_name),
    );
  } catch {
    return [];
  }
}
export async function getPublicPractitioner(
  id: number,
): Promise<PublicPractitioner | null> {
  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }
  try {
    const response = await fetch(
      `${baseUrl}/api/public/practitioners/${id}/`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return null;
    }
    const payload =
      (await response.json()) as PublicPractitionerPayload;
    if (
      !payload.item ||
      typeof payload.item.id !== "number"
    ) {
      return null;
    }
    return payload.item;
  } catch {
    return null;
  }
}
