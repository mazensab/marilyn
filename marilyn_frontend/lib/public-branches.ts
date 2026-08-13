export type PublicBranch = {
  id: number;
  branch_code: string;
  name_ar: string;
  name_en: string;
  display_name: string;
  branch_type: string;
  is_default: boolean;
  country: string;
  city: string;
  region: string;
  district: string;
  street_name: string;
  building_number: string;
  postal_code: string;
  short_address: string;
  national_address_line: string;
  address: string;
  latitude: string;
  longitude: string;
  opening_time: string;
  closing_time: string;
};
type PublicBranchesPayload = {
  success: boolean;
  count: number;
  results: PublicBranch[];
};
type PublicBranchPayload = {
  success: boolean;
  item: PublicBranch;
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
export function localizedBranchName(
  branch: PublicBranch,
  isArabic: boolean,
) {
  return (
    (isArabic
      ? branch.name_ar
      : branch.name_en) ||
    branch.display_name ||
    branch.name_ar ||
    branch.name_en ||
    branch.branch_code
  );
}
export function branchTypeLabel(
  value: string,
  isArabic: boolean,
) {
  const labels: Record<
    string,
    {
      ar: string;
      en: string;
    }
  > = {
    HEAD_OFFICE: {
      ar: "المقر الرئيسي",
      en: "Main location",
    },
    BRANCH: {
      ar: "فرع",
      en: "Branch",
    },
    SERVICE_CENTER: {
      ar: "مركز خدمات",
      en: "Service center",
    },
  };
  const label = labels[value];
  if (!label) {
    return "";
  }
  return isArabic
    ? label.ar
    : label.en;
}
export function branchAddress(
  branch: PublicBranch,
) {
  return (
    branch.national_address_line ||
    branch.short_address ||
    branch.address ||
    [
      branch.street_name,
      branch.district,
      branch.city,
      branch.region,
    ]
      .filter(Boolean)
      .join("، ")
  );
}
export async function getPublicBranches():
  Promise<PublicBranch[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return [];
  }
  try {
    const response = await fetch(
      `${baseUrl}/api/public/branches/`,
      {
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
      (await response.json()) as PublicBranchesPayload;
    if (!Array.isArray(payload.results)) {
      return [];
    }
    return payload.results.filter(
      (branch) =>
        Boolean(branch) &&
        typeof branch.id === "number" &&
        branch.id > 0 &&
        Boolean(branch.display_name),
    );
  } catch {
    return [];
  }
}
export async function getPublicBranch(
  id: number,
): Promise<PublicBranch | null> {
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
      `${baseUrl}/api/public/branches/${id}/`,
      {
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
      (await response.json()) as PublicBranchPayload;
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
