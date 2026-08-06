"use client";
// practitioner_management_shared_tabs=true
// practitioner_tabs_runtime_undefined_fix=true
// practitioner_tabs_inline_svg_icons=true
// practitioner_tabs_hr_brand_colors=true
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { registerOutlineButtonClass } from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type PractitionerManagementTab =
  | "directory"
  | "assignments"
  | "licenses"
  | "schedules";
type PractitionerManagementTabsProps = {
  active: PractitionerManagementTab;
  locale: "ar" | "en";
  counts?: Partial<
    Record<
      PractitionerManagementTab,
      number
    >
  >;
};
type TabDefinition = {
  key: PractitionerManagementTab;
  href: string;
  ar: string;
  en: string;
};
const TABS: TabDefinition[] = [
  {
    key: "directory",
    href: "/system/practitioners",
    ar: "ملفات الممارسين",
    en: "Practitioner files",
  },
  {
    key: "assignments",
    href:
      "/system/practitioners/assignments",
    ar: "التخصصات والتعيينات",
    en: "Specialties & assignments",
  },
  {
    key: "licenses",
    href:
      "/system/practitioners/licenses",
    ar: "التراخيص",
    en: "Licenses",
  },
  {
    key: "schedules",
    href:
      "/system/practitioners/schedules",
    ar: "الجداول والتوفر",
    en: "Schedules & availability",
  },
];
type TabIconProps = {
  tab: PractitionerManagementTab;
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
  if (tab === "assignments") {
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
  if (tab === "licenses") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4" />
        <path d="m9 14 2 2 4-5" />
      </svg>
    );
  }
  if (tab === "schedules") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
        <path d="M12 14v3l2 1" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.5-4 2.8-6 6-6s5.5 2 6 6" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 15c2.8-.4 5 1.3 5.5 4" />
    </svg>
  );
}
export function PractitionerManagementTabs({
  active,
  locale,
  counts = {},
}: PractitionerManagementTabsProps) {
  const navigationLabel =
    locale === "ar"
      ? "التنقل في إدارة الممارسين"
      : "Practitioner management navigation";
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
