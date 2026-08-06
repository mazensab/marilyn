"use client";
// communications_center_tabs_hr_spirit=true
// communications_center_tabs_practitioner_pattern=true
// communications_center_tabs_inline_svg_icons=true
// communications_center_tabs_internal_ui_only=true
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
export type CommunicationsCenterTab =
  | "notifications"
  | "notification-list"
  | "unread"
  | "whatsapp"
  | "templates"
  | "messages"
  | "settings";
type Counts = Partial<
  Record<
    CommunicationsCenterTab,
    number
  >
>;
type TabDefinition = {
  key: CommunicationsCenterTab;
  href: string;
  labelAr: string;
  labelEn: string;
};
const TABS: TabDefinition[] = [
  {
    key: "notifications",
    href: "/system/notifications",
    labelAr: "مركز الإشعارات",
    labelEn: "Notifications",
  },
  {
    key: "notification-list",
    href: "/system/notifications/list",
    labelAr: "قائمة الإشعارات",
    labelEn: "Notification list",
  },
  {
    key: "unread",
    href: "/system/notifications/unread",
    labelAr: "غير المقروءة",
    labelEn: "Unread",
  },
  {
    key: "whatsapp",
    href: "/system/whatsapp",
    labelAr: "واتساب",
    labelEn: "WhatsApp",
  },
  {
    key: "templates",
    href: "/system/whatsapp/templates",
    labelAr: "القوالب",
    labelEn: "Templates",
  },
  {
    key: "messages",
    href: "/system/whatsapp/messages",
    labelAr: "سجل الرسائل",
    labelEn: "Message logs",
  },
  {
    key: "settings",
    href: "/system/whatsapp/settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
  },
];
type TabIconProps = {
  tab: CommunicationsCenterTab;
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
  if (tab === "notification-list") {
    return (
      <svg {...commonProps}>
        <path d="M9 6h11" />
        <path d="M9 12h11" />
        <path d="M9 18h11" />
        <path d="m3 6 1 1 2-2" />
        <path d="m3 12 1 1 2-2" />
        <path d="m3 18 1 1 2-2" />
      </svg>
    );
  }
  if (tab === "unread") {
    return (
      <svg {...commonProps}>
        <path d="M10.3 3.6 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }
  if (tab === "whatsapp") {
    return (
      <svg {...commonProps}>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.1 9.1 0 0 1-3.8-.9L3 21l1.8-5A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M8.6 8.3c.2-.4.5-.4.8-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.5.7c-.2.2-.2.4 0 .7.7 1.2 1.7 2.1 2.9 2.7.3.1.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.4.4.6 0 .7-.4 1.4-1 1.8-.6.4-1.4.6-2.2.4-1.4-.3-3.2-1.1-5-2.8-1.5-1.4-2.4-3.1-2.7-4.4-.2-.7-.1-1.3.2-1.7Z" />
      </svg>
    );
  }
  if (tab === "templates") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
      </svg>
    );
  }
  if (tab === "messages") {
    return (
      <svg {...commonProps}>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    );
  }
  if (tab === "settings") {
    return (
      <svg {...commonProps}>
        <path d="M4 6h8" />
        <path d="M16 6h4" />
        <path d="M14 4v4" />
        <path d="M4 12h3" />
        <path d="M11 12h9" />
        <path d="M9 10v4" />
        <path d="M4 18h10" />
        <path d="M18 18h2" />
        <path d="M16 16v4" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}
function formatCount(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Math.max(
      0,
      Number.isFinite(value)
        ? value
        : 0,
    ),
  );
}
export function CommunicationsCenterTabs({
  active,
  locale,
  counts = {},
}: {
  active: CommunicationsCenterTab;
  locale: "ar" | "en";
  counts?: Counts;
}) {
  return (
    <nav
      aria-label={
        locale === "ar"
          ? "التنقل بين صفحات التواصل والإشعارات"
          : "Communications and notifications navigation"
      }
      className="flex flex-wrap items-center gap-2"
    >
      {TABS.map((item) => {
        const isActive =
          item.key === active;
        const count =
          counts[item.key];
        return (
          <Button
            key={item.key}
            asChild
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
          >
            <Link
              href={item.href}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
            >
              <TabIcon
                tab={item.key}
              />
              <span>
                {locale === "ar"
                  ? item.labelAr
                  : item.labelEn}
              </span>
              {typeof count === "number" ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {formatCount(count)}
                </span>
              ) : null}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
