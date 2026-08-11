import {
  Activity,
  HeartPulse,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";

export const PUBLIC_MEDICAL_SERVICES = [
  {
    id: "dermatology",
    slug: "dermatology",
    title: {
      ar: "الجلدية والعناية بالبشرة",
      en: "Dermatology & Skin Care",
    },
    description: {
      ar: "رعاية متخصصة للبشرة تبدأ بالتقييم الطبي وتصل إلى خطة مناسبة لاحتياجك.",
      en: "Specialized skin care that starts with a medical assessment and leads to a plan tailored to your needs.",
    },
    shortDescription: {
      ar: "جلسات تنظيف وتقشير وعلاج مشكلات البشرة.",
      en: "Cleansing, peeling, and skin treatment sessions.",
    },
    badge: {
      ar: "بشرة",
      en: "Skin",
    },
    imageSrc:
      "/landing/services/dermatology.webp",
    icon: Stethoscope,
  },
  {
    id: "laser",
    slug: "laser",
    title: {
      ar: "إزالة الشعر بالليزر",
      en: "Laser Hair Removal",
    },
    description: {
      ar: "تقنيات ليزر حديثة بخيارات علاجية مريحة وآمنة تناسب احتياجك ومواعيدك.",
      en: "Modern laser technologies with comfortable and safe treatment options tailored to your needs and schedule.",
    },
    shortDescription: {
      ar: "أحدث تقنيات الليزر لإزالة الشعر بدون ألم أو عناء.",
      en: "Advanced laser hair removal with a comfortable experience.",
    },
    badge: {
      ar: "ليزر",
      en: "Laser",
    },
    imageSrc:
      "/landing/services/laser.webp",
    icon: Zap,
  },
  {
    id: "aesthetics",
    slug: "aesthetics",
    title: {
      ar: "الحقن والتجميل",
      en: "Injectables & Aesthetics",
    },
    description: {
      ar: "حلول تجميلية غير جراحية تُختار بعد التقييم بما يناسب ملامحك واحتياجك.",
      en: "Non-surgical aesthetic solutions selected after assessment to suit your features and needs.",
    },
    shortDescription: {
      ar: "بوتوكس، فيلر، نضارة الوجه وتحسين الملامح.",
      en: "Botox, fillers, facial glow, and feature enhancement.",
    },
    badge: {
      ar: "تجميل",
      en: "Aesthetics",
    },
    imageSrc:
      "/landing/services/aesthetics.webp",
    icon: Sparkles,
  },
  {
    id: "hair",
    slug: "hair",
    title: {
      ar: "علاج الشعر",
      en: "Hair Treatment",
    },
    description: {
      ar: "تقييم وعناية بالشعر وفروة الرأس ضمن رحلة علاجية واضحة ومتابعة منظمة.",
      en: "Hair and scalp assessment with a clear treatment journey and organized follow-up.",
    },
    shortDescription: {
      ar: "علاج التساقط وتقوية الشعر والعناية بفروة الرأس.",
      en: "Hair loss care, strengthening, and scalp treatment.",
    },
    badge: {
      ar: "شعر",
      en: "Hair",
    },
    imageSrc:
      "/landing/services/hair.webp",
    icon: HeartPulse,
  },
  {
    id: "body",
    slug: "body",
    title: {
      ar: "جلسات الجسم",
      en: "Body Sessions",
    },
    description: {
      ar: "جلسات عناية بالجسم تُختار حسب احتياجك ضمن تجربة مريحة وخطة واضحة.",
      en: "Body care sessions selected according to your needs within a comfortable and clear treatment plan.",
    },
    shortDescription: {
      ar: "نحت الجسم، شد الجلد وعلاجات السيلوليت.",
      en: "Body contouring, skin tightening, and cellulite care.",
    },
    badge: {
      ar: "جسم",
      en: "Body",
    },
    imageSrc:
      "/landing/services/body.webp",
    icon: Activity,
  },
] as const;

export type PublicSocialReel = {
  id: string;
  videoSrc: string;
  posterSrc?: string;
  platform: "instagram" | "tiktok" | "local";
  externalUrl?: string;
  title: {
    ar: string;
    en: string;
  };
  caption?: {
    ar: string;
    en: string;
  };
};

/*
 * Real Marilyn social videos will be added here.
 *
 * Keep this array defined even when it is empty because
 * HeroSocialReel relies on a stable array contract.
 */
export const PUBLIC_SOCIAL_REELS: PublicSocialReel[] = [];