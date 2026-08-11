/* ============================================================
   Marilyn Clinics — Public Website Locale
============================================================ */

export type PublicLocale = "ar" | "en";

export const PUBLIC_LOCALE_STORAGE_KEY = "marilyn-locale";
export const PUBLIC_LOCALE_CHANGE_EVENT = "marilyn-locale-changed";

export function normalizePublicLocale(
  value?: string | null,
): PublicLocale {
  const normalized = (value || "").trim().toLowerCase();

  if (
    normalized === "ar" ||
    normalized.startsWith("ar-") ||
    normalized.startsWith("ar_")
  ) {
    return "ar";
  }

  return "en";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split("=")[1] || "");
}

export function readPublicLocale(
  fallback: PublicLocale = "ar",
): PublicLocale {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedLocale =
    window.localStorage.getItem(PUBLIC_LOCALE_STORAGE_KEY);

  const cookieLocale =
    readCookie("lang") ||
    readCookie("locale") ||
    readCookie("NEXT_LOCALE");

  return normalizePublicLocale(
    storedLocale || cookieLocale || fallback,
  );
}

export function persistPublicLocale(locale: PublicLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  const oneYear = 60 * 60 * 24 * 365;

  window.localStorage.setItem(
    PUBLIC_LOCALE_STORAGE_KEY,
    locale,
  );

  document.cookie =
    `lang=${locale}; path=/; max-age=${oneYear}; samesite=lax`;

  document.cookie =
    `locale=${locale}; path=/; max-age=${oneYear}; samesite=lax`;

  document.cookie =
    `NEXT_LOCALE=${locale}; path=/; max-age=${oneYear}; samesite=lax`;

  document.documentElement.lang = locale;
  document.documentElement.dir =
    locale === "ar" ? "rtl" : "ltr";

  document.body.setAttribute(
    "dir",
    locale === "ar" ? "rtl" : "ltr",
  );

  window.dispatchEvent(
    new Event(PUBLIC_LOCALE_CHANGE_EVENT),
  );
}