"use client";
// patient_center_shared_tabs=true
import Link from "next/link";
import type {
  LucideIcon,
} from "lucide-react";
import {
  FileKey2,
  FileText,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type PatientCenterTab =
  | "patients"
  | "medical-records"
  | "record-access";
type PatientCenterCounts =
  Partial<
    Record<
      PatientCenterTab,
      number
    >
  >;
type PatientCenterTabsProps = {
  active: PatientCenterTab;
  locale: "ar" | "en";
  counts?: PatientCenterCounts;
};
type TabDefinition = {
  key: PatientCenterTab;
  href: string;
  icon: LucideIcon;
  ar: string;
  en: string;
};
const TABS: TabDefinition[] = [
  {
    key: "patients",
    href: "/system/patients",
    icon: UsersRound,
    ar: "ملفات المرضى",
    en: "Patient files",
  },
  {
    key: "medical-records",
    href:
      "/system/patients/medical-records",
    icon: FileText,
    ar: "الملفات الطبية",
    en: "Medical records",
  },
  {
    key: "record-access",
    href:
      "/system/patients/record-access",
    icon: FileKey2,
    ar: "الوصول إلى السجلات",
    en: "Record access",
  },
];
export function PatientCenterTabs({
  active,
  locale,
  counts = {},
}: PatientCenterTabsProps) {
  const navigationLabel =
    locale === "ar"
      ? "التنقل في مركز المرضى"
      : "Patient center navigation";
  return (
    <nav
      aria-label={navigationLabel}
      className="flex flex-wrap gap-2"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          active === tab.key;
        const count =
          counts[tab.key];
        const hasCount =
          typeof count === "number" &&
          Number.isFinite(count);
        return (
          <Button
            key={tab.key}
            type="button"
            variant={
              isActive
                ? "brand"
                : "outline"
            }
            className={cn(
              "h-9 shadow-none",
              isActive
                ? registerBrandButtonClass
                : registerOutlineButtonClass,
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
              <Icon className="h-4 w-4" />
              {locale === "ar"
                ? tab.ar
                : tab.en}
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
