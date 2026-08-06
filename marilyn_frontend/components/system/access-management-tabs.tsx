"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileClock,
  KeyRound,
  ShieldCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerOutlineButtonClass } from "@/components/ui/data-register";
import { cn } from "@/lib/utils";
type Locale = "ar" | "en";
export type AccessManagementTabKey =
  | "accounts"
  | "organization"
  | "roles"
  | "permissions"
  | "userPermissions"
  | "reports"
  | "audit";
type Tab = {
  key: AccessManagementTabKey;
  href: string;
  icon: LucideIcon;
  ar: string;
  en: string;
};
const tabs: Tab[] = [
  { key: "accounts", href: "/system/users", icon: UserCog, ar: "حسابات الدخول", en: "Login accounts" },
  { key: "organization", href: "/system/users/organization", icon: Building2, ar: "مستخدمو المنشأة والفروع", en: "Organization users" },
  { key: "roles", href: "/system/roles", icon: KeyRound, ar: "الأدوار", en: "Roles" },
  { key: "permissions", href: "/system/permissions", icon: ShieldCheck, ar: "الصلاحيات", en: "Permissions" },
  { key: "userPermissions", href: "/system/users/permissions", icon: UsersRound, ar: "صلاحيات المستخدمين", en: "User access" },
  { key: "reports", href: "/system/users/reports", icon: BarChart3, ar: "التقارير", en: "Reports" },
  { key: "audit", href: "/system/audit-log", icon: FileClock, ar: "سجل التدقيق", en: "Audit log" },
];
function useLocale(): Locale {
  const [locale, setLocale] = React.useState<Locale>("ar");
  React.useEffect(() => {
    const sync = () => {
      const html = document.documentElement;
      setLocale(
        window.localStorage.getItem("primey-locale") === "en" ||
          html.lang.toLowerCase().startsWith("en") ||
          html.dir.toLowerCase() === "ltr"
          ? "en"
          : "ar",
      );
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });
    window.addEventListener("storage", sync);
    window.addEventListener("primey-locale-changed", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
      window.removeEventListener("primey-locale-changed", sync);
    };
  }, []);
  return locale;
}
function inferActive(pathname: string): AccessManagementTabKey {
  if (pathname.startsWith("/system/users/organization")) return "organization";
  if (pathname.startsWith("/system/users/permissions")) return "userPermissions";
  if (pathname.startsWith("/system/users/reports")) return "reports";
  if (pathname.startsWith("/system/roles")) return "roles";
  if (pathname.startsWith("/system/permissions")) return "permissions";
  if (pathname.startsWith("/system/audit-log")) return "audit";
  return "accounts";
}
export function AccessManagementTabs({
  active,
  counts,
}: {
  active?: AccessManagementTabKey;
  counts?: Partial<Record<AccessManagementTabKey, number>>;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const current = active ?? inferActive(pathname || "");
  return (
    <nav aria-label={locale === "ar" ? "التنقل بين الإدارة والصلاحيات" : "Access management navigation"}>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = current === tab.key;
          const count = counts?.[tab.key];
          return (
            <Button
              key={tab.key}
              asChild
              variant={selected ? "brand" : "outline"}
              className={cn("h-9 shadow-none", !selected && registerOutlineButtonClass)}
              aria-current={selected ? "page" : undefined}
            >
              <Link href={tab.href}>
                <Icon className="h-4 w-4" />
                {locale === "ar" ? tab.ar : tab.en}
                {typeof count === "number" ? (
                  <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                    {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(count)}
                  </span>
                ) : null}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
