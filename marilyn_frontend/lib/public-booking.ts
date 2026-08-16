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
  payment_token: string;
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
export type PublicBookingPaymentMethod = {
  id: number;
  name: string;
  code: string;
  method_type: string;
  gateway_type: string;
  provider: string;
  requires_redirect: boolean;
  is_cash_at_clinic: boolean;
};

export type PublicBookingPaymentOptions = {
  success: boolean;
  payment_required: boolean;
  payment_available: boolean;
  amount: string;
  currency_code: string;
  methods: PublicBookingPaymentMethod[];
};

export type PublicBookingPaymentCheckoutSession = {
  id: number;
  status: string;
  amount: string;
  currency_code: string;
  checkout_url: string;
  external_checkout_id: string;
  external_payment_id: string;
};

export type PublicBookingPaymentCheckoutInput = {
  token: string;
  payment_method_id: number;
};

export type PublicBookingPaymentCheckout = {
  success: boolean;
  provider: string;
  requires_redirect: boolean;
  payment_mode?: string;
  checkout_ready?: boolean;
  checkout_url?: string;
  publishable_key?: string;
  amount_minor?: number;
  currency_code?: string;
  callback_reference?: string;
  callback_url?: string;
  provider_payment_id?: string;
  provider_status?: string;
  message?: string;
  detail?: string;
  checkout_session: PublicBookingPaymentCheckoutSession | null;
};

export type PublicBookingPaymentVerifyInput = {
  token: string;
  checkout_session_id: number;
  payment_id: string;
};

export type PublicBookingPaymentVerification = {
  success: boolean;
  provider: string;
  verified: boolean;
  already_verified: boolean;
  payment_status: string;
  payment_id: string;
  provider_status: string;
  checkout_session: PublicBookingPaymentCheckoutSession;
};

export async function fetchPublicBookingPaymentOptions(
  token: string,
): Promise<PublicBookingPaymentOptions> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }

  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error(
      "Payment access token is required.",
    );
  }

  const query = new URLSearchParams({
    token: normalizedToken,
  });

  const response = await fetch(
    `${base}/api/public/booking/payment/options/?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  return responseJson<PublicBookingPaymentOptions>(
    response,
  );
}

export async function createPublicBookingPaymentCheckout(
  input: PublicBookingPaymentCheckoutInput,
): Promise<PublicBookingPaymentCheckout> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }

  const token = input.token.trim();
  if (!token) {
    throw new Error(
      "Payment access token is required.",
    );
  }

  if (
    !Number.isInteger(input.payment_method_id) ||
    input.payment_method_id <= 0
  ) {
    throw new Error(
      "A valid payment method is required.",
    );
  }

  const response = await fetch(
    `${base}/api/public/booking/payment/checkout/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        token,
        payment_method_id:
          input.payment_method_id,
      }),
    },
  );

  return responseJson<PublicBookingPaymentCheckout>(
    response,
  );
}

export async function verifyPublicBookingPayment(
  input: PublicBookingPaymentVerifyInput,
): Promise<PublicBookingPaymentVerification> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }

  const token = input.token.trim();
  const paymentId = input.payment_id.trim();

  if (!token) {
    throw new Error(
      "Payment access token is required.",
    );
  }

  if (
    !Number.isInteger(input.checkout_session_id) ||
    input.checkout_session_id <= 0
  ) {
    throw new Error(
      "A valid checkout session is required.",
    );
  }

  if (!paymentId) {
    throw new Error(
      "Payment identifier is required.",
    );
  }

  const response = await fetch(
    `${base}/api/public/booking/payment/verify/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        token,
        checkout_session_id:
          input.checkout_session_id,
        payment_id: paymentId,
      }),
    },
  );

  return responseJson<PublicBookingPaymentVerification>(
    response,
  );
}

export type PublicBookingPaymentStatus = {
  success: boolean;
  provider: string;
  payment_status: string;
  paid: boolean;
  checkout_session: PublicBookingPaymentCheckoutSession;
};

export async function fetchPublicBookingPaymentStatus(
  token: string,
  sessionId: number,
): Promise<PublicBookingPaymentStatus> {
  const base = apiBaseUrl();

  if (!base) {
    throw new Error(
      "Public API base URL is not configured.",
    );
  }

  const normalizedToken = token.trim();

  if (
    !normalizedToken ||
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    throw new Error(
      "Payment status request is invalid.",
    );
  }

  const query = new URLSearchParams({
    token: normalizedToken,
    session: String(sessionId),
  });

  const response = await fetch(
    `${base}/api/public/booking/payment/status/?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  return responseJson<PublicBookingPaymentStatus>(
    response,
  );
}
