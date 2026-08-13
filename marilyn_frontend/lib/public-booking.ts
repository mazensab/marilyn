export type PublicBookingBranch = {
  id: number;
  name_ar: string;
  name_en: string;
  display_name: string;
  city: string;
  region: string;
  is_default: boolean;
};
export type PublicBookingService = {
  id: number;
  name_ar: string;
  name_en: string;
  display_name: string;
  duration_minutes: number;
  total_slot_minutes: number;
  effective_sale_price: string;
};
export type PublicBookingSpecialty = {
  id: number | null;
  name_ar: string;
  name_en: string;
  display_name: string;
};
export type PublicBookingPractitioner = {
  id: number;
  full_name_ar: string;
  full_name_en: string;
  display_name: string;
  professional_title: string;
  primary_specialty: PublicBookingSpecialty | null;
};
export type PublicBookingAssignment = {
  id: number;
  branch: PublicBookingBranch;
  service: PublicBookingService;
  practitioner: PublicBookingPractitioner;
};
export type PublicBookingOptions = {
  success: boolean;
  branches: PublicBookingBranch[];
  assignments: PublicBookingAssignment[];
};
export type PublicBookingSlot = {
  start: string;
  end: string;
  duration_minutes: number;
  total_slot_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
};
export type PublicBookingAvailability = {
  success: boolean;
  date: string;
  timezone: string;
  practitioner_service_assignment_id: number;
  count: number;
  slots: PublicBookingSlot[];
  available_slots: PublicBookingSlot[];
};
function apiBaseUrl() {
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
async function responseJson<T>(
  response: Response,
): Promise<T> {
  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const record =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    const message =
      typeof record.message === "string"
        ? record.message
        : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}
export async function fetchPublicBookingOptions():
  Promise<PublicBookingOptions> {
  const base = apiBaseUrl();
  if (!base) {
    return {
      success: false,
      branches: [],
      assignments: [],
    };
  }
  const response = await fetch(
    `${base}/api/public/booking/options/`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  return responseJson<PublicBookingOptions>(
    response,
  );
}
export async function fetchPublicAvailability(
  assignmentId: number,
  bookingDate: string,
): Promise<PublicBookingAvailability> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }
  const query = new URLSearchParams({
    practitioner_service_assignment_id:
      String(assignmentId),
    date: bookingDate,
  });
  const response = await fetch(
    `${base}/api/public/booking/availability/?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  return responseJson<PublicBookingAvailability>(
    response,
  );
}
export function localizedBookingBranch(
  branch: PublicBookingBranch,
  isArabic: boolean,
) {
  return (
    (isArabic
      ? branch.name_ar
      : branch.name_en) ||
    branch.display_name ||
    branch.name_ar ||
    branch.name_en
  );
}
export function localizedBookingService(
  service: PublicBookingService,
  isArabic: boolean,
) {
  return (
    (isArabic
      ? service.name_ar
      : service.name_en) ||
    service.display_name ||
    service.name_ar ||
    service.name_en
  );
}
export function localizedBookingPractitioner(
  practitioner: PublicBookingPractitioner,
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
export function localizedBookingSpecialty(
  specialty: PublicBookingSpecialty | null,
  isArabic: boolean,
) {
  if (!specialty) {
    return "";
  }
  return (
    (isArabic
      ? specialty.name_ar
      : specialty.name_en) ||
    specialty.display_name ||
    specialty.name_ar ||
    specialty.name_en
  );
}
export function formatBookingPrice(
  value: string,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    },
  ).format(numeric);
}

export type PublicBookingIdentifierType = {
  value: string;
};
export type PublicBookingRequirements = {
  success: boolean;
  patient: {
    require_identifier: boolean;
    identifier_types: PublicBookingIdentifierType[];
  };
};
export type PublicBookingPatientInput = {
  full_name: string;
  mobile: string;
  email: string;
  identifier_type: string;
  identifier_number: string;
};
export type PublicBookingConfirmationAppointment = {
  appointment_number: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
  branch: PublicBookingBranch;
  service: PublicBookingService;
  practitioner: PublicBookingPractitioner;
};
export type PublicBookingConfirmation = {
  success: boolean;
  patient_reused: boolean;
  appointment: PublicBookingConfirmationAppointment;
};
export type PublicBookingConfirmInput = {
  practitioner_service_assignment_id: number;
  scheduled_start: string;
  patient: PublicBookingPatientInput;
};
export async function fetchPublicBookingRequirements():
  Promise<PublicBookingRequirements> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }
  const response = await fetch(
    `${base}/api/public/booking/requirements/`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  return responseJson<PublicBookingRequirements>(
    response,
  );
}
export async function confirmPublicBooking(
  input: PublicBookingConfirmInput,
): Promise<PublicBookingConfirmation> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }
  const response = await fetch(
    `${base}/api/public/booking/confirm/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    },
  );
  return responseJson<PublicBookingConfirmation>(
    response,
  );
}
