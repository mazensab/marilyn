"use client";
// financial_center_shared_tabs=true
// financial_center_tabs_internal_ui_only=true
// financial_center_tabs_inline_svg_icons=true
// financial_center_tabs_hr_brand_colors=true
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type FinancialCenterTab =
  | "billing"
  | "payments"
  | "treasury"
  | "accounting";
type FinancialCenterTabsProps = {
  active: FinancialCenterTab;
  locale: "ar" | "en";
  counts?: Partial<
    Record<FinancialCenterTab, number>
  >;
};
type FinancialTabDefinition = {
  key: FinancialCenterTab;
  href: string;
  ar: string;
  en: string;
};
const TABS: FinancialTabDefinition[] = [
  {
    key: "billing",
    href: "/system/billing",
    ar: "فواتير المرضى",
    en: "Patient billing",
  },
  {
    key: "payments",
    href: "/system/payments",
    ar: "مدفوعات المرضى",
    en: "Patient payments",
  },
  {
    key: "treasury",
    href: "/system/treasury",
    ar: "الخزينة",
    en: "Treasury",
  },
  {
    key: "accounting",
    href: "/system/accounting",
    ar: "الحسابات",
    en: "Accounting",
  },
];
type TabIconProps = {
  tab: FinancialCenterTab;
};
function TabIcon({
  tab,
}: TabIconProps) {
  const commonProps = {
    className:
      "h-4 w-4 shrink-0",
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
  if (tab === "payments") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="M3 10h18" />
        <path d="M16 15h2" />
      </svg>
    );
  }
  if (tab === "treasury") {
    return (
      <svg {...commonProps}>
        <path d="M3 10h18" />
        <path d="M5 10v8" />
        <path d="M9 10v8" />
        <path d="M15 10v8" />
        <path d="M19 10v8" />
        <path d="M2 20h20" />
        <path d="m12 3 9 5H3z" />
      </svg>
    );
  }
  if (tab === "accounting") {
    return (
      <svg {...commonProps}>
        <path d="M5 3h14v18H5z" />
        <path d="M8 7h8" />
        <path d="M8 11h3" />
        <path d="M13 11h3" />
        <path d="M8 15h3" />
        <path d="M13 15h3" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M6 3h12v18H6z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>
  );
}
export function FinancialCenterTabs({
  active,
  locale,
  counts = {},
}: FinancialCenterTabsProps) {
  const navigationLabel =
    locale === "ar"
      ? "التنقل في المركز المالي"
      : "Financial center navigation";
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
