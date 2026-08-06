"use client";
// appointment_center_shared_tabs=true
import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type AppointmentCenterTab =
  | "appointments"
  | "calendar"
  | "waiting-list";
type AppointmentCenterTabsProps = {
  active: AppointmentCenterTab;
  locale: "ar" | "en";
  counts?: Partial<
    Record<AppointmentCenterTab, number>
  >;
};
type TabDefinition = {
  key: AppointmentCenterTab;
  href: string;
  icon: LucideIcon;
  ar: string;
  en: string;
};
const TABS: TabDefinition[] = [
  {
    key: "appointments",
    href: "/system/appointments",
    icon: CalendarClock,
    ar: "مركز المواعيد",
    en: "Appointments center",
  },
  {
    key: "calendar",
    href: "/system/appointments/calendar",
    icon: CalendarDays,
    ar: "تقويم المواعيد",
    en: "Appointments calendar",
  },
  {
    key: "waiting-list",
    href:
      "/system/appointments/waiting-list",
    icon: ListOrdered,
    ar: "قائمة الانتظار",
    en: "Waiting list",
  },
];
export function AppointmentCenterTabs({
  active,
  locale,
  counts = {},
}: AppointmentCenterTabsProps) {
  const navigationLabel =
    locale === "ar"
      ? "التنقل في مركز المواعيد"
      : "Appointment center navigation";
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
