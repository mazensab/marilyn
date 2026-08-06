"use client";
// medical_operations_shared_tabs=true
// medical_operations_tabs_match_practitioner_contract=true
// medical_operations_tabs_inline_svg_icons=true
// medical_operations_tabs_hr_brand_colors=true
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { registerOutlineButtonClass } from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type MedicalOperationsTab =
  | "services"
  | "encounters"
  | "diagnoses"
  | "procedures"
  | "referrals";
type MedicalOperationsTabsProps = {
  active: MedicalOperationsTab;
  locale: "ar" | "en";
  counts?: Partial<
    Record<
      MedicalOperationsTab,
      number
    >
  >;
};
type TabDefinition = {
  key: MedicalOperationsTab;
  href: string;
  ar: string;
  en: string;
};
const TABS: TabDefinition[] = [
  {
    key: "services",
    href: "/system/medical-services",
    ar: "الخدمات الطبية",
    en: "Medical services",
  },
  {
    key: "encounters",
    href:
      "/system/clinical-operations?view=encounters",
    ar: "الزيارات الطبية",
    en: "Medical encounters",
  },
  {
    key: "diagnoses",
    href:
      "/system/clinical-operations?view=diagnoses",
    ar: "التشخيصات",
    en: "Diagnoses",
  },
  {
    key: "procedures",
    href:
      "/system/clinical-operations?view=procedures",
    ar: "الإجراءات",
    en: "Procedures",
  },
  {
    key: "referrals",
    href:
      "/system/clinical-operations?view=referrals",
    ar: "الإحالات",
    en: "Referrals",
  },
];
type TabIconProps = {
  tab: MedicalOperationsTab;
};
function TabIcon({
  tab,
}: TabIconProps) {
  const commonProps = {
    className: "h-4 w-4 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
    "aria-hidden":
      true as const,
  };
  if (tab === "encounters") {
    return (
      <svg {...commonProps}>
        <path d="M3 12h4l2-5 4 10 2-5h6" />
        <path d="M5 20h14" />
      </svg>
    );
  }
  if (tab === "diagnoses") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4" />
        <path d="m9 14 2 2 4-5" />
      </svg>
    );
  }
  if (tab === "procedures") {
    return (
      <svg {...commonProps}>
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
        />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </svg>
    );
  }
  if (tab === "referrals") {
    return (
      <svg {...commonProps}>
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M8 7.5 11 16" />
        <path d="m16 7.5-3 8.5" />
        <path d="M8 6h8" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M6 3v6a6 6 0 0 0 12 0V3" />
      <path d="M6 5H4" />
      <path d="M18 5h2" />
      <path d="M12 15v3a3 3 0 0 0 3 3h1" />
      <circle cx="18" cy="21" r="1" />
    </svg>
  );
}
export function MedicalOperationsTabs({
  active,
  locale,
  counts = {},
}: MedicalOperationsTabsProps) {
  const navigationLabel =
    locale === "ar"
      ? "التنقل في الخدمات والتشغيل الطبي"
      : "Medical services and operations navigation";
  return (
    <nav
      aria-label={navigationLabel}
      className="flex flex-wrap gap-2"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.key === active;
        const count =
          counts[tab.key];
        const hasCount =
          typeof count === "number" &&
          Number.isFinite(count);
        return (
          <Button
            key={tab.key}
            variant={
              isActive
                ? "brand"
                : "outline"
            }
            className={cn(
              "h-9 shadow-none",
              !isActive &&
                registerOutlineButtonClass,
            )}
            asChild
          >
            <Link
              href={tab.href}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
            >
              <TabIcon tab={tab.key} />
              <span>
                {locale === "ar"
                  ? tab.ar
                  : tab.en}
              </span>
              {hasCount ? (
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                  {count.toLocaleString(
                    "en-US",
                  )}
                </span>
              ) : null}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
