export type PublicRelatedMedicalName = {
  id: number | null;
  code: string;
  name_ar: string;
  name_en: string;
  display_name: string;
};
export type PublicMedicalService = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  display_name: string;
  description: string;
  branch: PublicRelatedMedicalName | null;
  department: PublicRelatedMedicalName | null;
  specialty: PublicRelatedMedicalName | null;
  clinic: PublicRelatedMedicalName | null;
  duration_minutes: number;
  effective_sale_price: string;
  default_session_count: number;
  requires_approval: boolean;
  requires_preparation: boolean;
  preparation_instructions: string;
  online_booking_enabled: boolean;
};
type PublicServicesPayload = {
  success: boolean;
  count: number;
  results: PublicMedicalService[];
};
type PublicServiceDetailPayload = {
  success: boolean;
  item: PublicMedicalService;
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
export function localizedServiceName(
  service: PublicMedicalService,
  isArabic: boolean,
) {
  return (
    (isArabic
      ? service.name_ar
      : service.name_en) ||
    service.display_name ||
    service.name_ar ||
    service.name_en ||
    service.code
  );
}
export function localizedRelatedName(
  value: PublicRelatedMedicalName | null,
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
    value.name_en ||
    value.code
  );
}
export function formatPublicPrice(
  value: string,
) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "";
  }
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(numericValue);
}
export async function getPublicMedicalServices():
  Promise<PublicMedicalService[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return [];
  }
  try {
    const response = await fetch(
      `${baseUrl}/api/public/services/`,
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
      (await response.json()) as PublicServicesPayload;
    if (!Array.isArray(payload.results)) {
      return [];
    }
    return payload.results.filter(
      (service) =>
        Boolean(service) &&
        typeof service.id === "number" &&
        service.id > 0 &&
        Boolean(service.display_name),
    );
  } catch {
    return [];
  }
}
export async function getPublicMedicalService(
  id: number,
): Promise<PublicMedicalService | null> {
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
      `${baseUrl}/api/public/services/${id}/`,
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
      (await response.json()) as PublicServiceDetailPayload;
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
