/* ============================================================
   Marilyn Clinics — Public Website Configuration
   ------------------------------------------------------------
   Central source for public-facing brand and contact data.
   Do not place internal system configuration in this file.
============================================================ */

export const PUBLIC_SITE = {
  name: "Marilyn Clinics",
  domain: "marilynclinics.com",
  url: "https://marilynclinics.com",
  email: "info@marilynclinics.com",

  instagram: {
    handle: "@marilyn.clinics",
    url: "https://www.instagram.com/marilyn.clinics/",
  },

  whatsappNumber: (
    process.env.NEXT_PUBLIC_SYSTEM_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    ""
  ).replace(/\D/g, ""),

  locale: {
    default: "ar",
    supported: ["ar", "en"],
  },
} as const;

export function buildPublicWhatsAppUrl(message?: string): string {
  const number = PUBLIC_SITE.whatsappNumber;

  if (!number) {
    return "";
  }

  const cleanMessage = message?.trim();

  if (!cleanMessage) {
    return `https://wa.me/${number}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(cleanMessage)}`;
}