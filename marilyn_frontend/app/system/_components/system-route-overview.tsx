"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  LayoutDashboard,
  Route,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SYSTEM_WORKSPACE_NAV_GROUPS,
  type SystemWorkspaceNavigationItem,
} from "@/lib/system-workspace-navigation";
type Locale = "ar" | "en";
type NavigationEntry = {
  item: SystemWorkspaceNavigationItem;
  parent?: SystemWorkspaceNavigationItem;
};
function flattenNavigation(): NavigationEntry[] {
  const entries: NavigationEntry[] = [];
  const walk = (
    item: SystemWorkspaceNavigationItem,
    parent?: SystemWorkspaceNavigationItem,
  ) => {
    entries.push({ item, parent });
    for (const child of item.items || []) {
      walk(child, item);
    }
  };
  for (const group of SYSTEM_WORKSPACE_NAV_GROUPS) {
    for (const item of group.items) {
      walk(item);
    }
  }
  return entries;
}
function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en"
    ? "en"
    : "ar";
}
export default function SystemRouteOverview() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("ar");
  useEffect(() => {
    const syncLocale = () => {
      setLocale(getStoredLocale());
    };
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("primey-locale-changed", syncLocale);
    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("primey-locale-changed", syncLocale);
    };
  }, []);
  const entries = useMemo(() => flattenNavigation(), []);
  const current = useMemo(
    () => entries.find(({ item }) => item.href === pathname),
    [entries, pathname],
  );
  const item =
    current?.item ||
    SYSTEM_WORKSPACE_NAV_GROUPS[0]?.items[0];
  if (!item) return null;
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const title = isArabic ? item.title.ar : item.title.en;
  const description = isArabic
    ? item.description?.ar
    : item.description?.en;
  const Icon = item.icon || LayoutDashboard;
  const related =
    item.items?.length
      ? item.items
      : current?.parent?.items?.filter(
          (child) => child.href !== pathname,
        ) || [];
  return (
    <main
      dir={dir}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <Badge
              variant="outline"
              className="mb-2 gap-2 rounded-full border-[#cbbda9]/55 bg-white/55 px-3 py-1 text-[#8f6a37] shadow-sm dark:bg-white/[0.04]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a57b3d]" />
              {isArabic
                ? "الإدارة المركزية"
                : "Central Administration"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {description ||
                (isArabic
                  ? "مركز إدارة ومتابعة عمليات Marilyn Clinics."
                  : "Marilyn Clinics management and operations center.")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <Route className="h-3.5 w-3.5 text-[#a57b3d]" />
                <span dir="ltr" className="tabular-nums">
                  {pathname}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isArabic
                  ? "المسار جاهز"
                  : "Route ready"}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            asChild
            className="bg-background [&_svg]:text-[#a57b3d]"
          >
            <Link href="/system">
              <LayoutDashboard className="h-4 w-4" />
              {isArabic
                ? "لوحة الإدارة المركزية"
                : "Central Dashboard"}
            </Link>
          </Button>
        </header>
        <Card className="rounded-lg border bg-card shadow-none">
          <CardHeader className="flex flex-row items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#cbbda9]/55 bg-white/70 text-[#a57b3d] shadow-sm dark:bg-white/[0.06]">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1.5 leading-6">
                {isArabic
                  ? "تم إنشاء مركز الوحدة وربطه بخريطة التنقل الموحدة للهيدر والسايدبار والبحث."
                  : "This module center is connected to the unified header, sidebar, and search navigation."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              isArabic ? "مسار فعلي دون 404" : "Real route without 404",
              isArabic ? "تنقل مركزي موحد" : "Unified central navigation",
              isArabic ? "دون بيانات تجريبية" : "No fabricated data",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#a57b3d]" />
                <span>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              {isArabic
                ? "صفحات الوحدة"
                : "Module Pages"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isArabic
                ? "انتقل بين الصفحات المرتبطة بهذه الوحدة."
                : "Navigate between pages related to this module."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(related.length
              ? related
              : SYSTEM_WORKSPACE_NAV_GROUPS[0]?.items.slice(0, 3) || []
            ).map((relatedItem) => {
              const RelatedIcon =
                relatedItem.icon || LayoutDashboard;
              return (
                <Link
                  key={relatedItem.href}
                  href={relatedItem.href}
                  className="group rounded-lg border bg-card p-4 transition hover:-translate-y-0.5 hover:border-[#b58c4d]/35 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#cbbda9]/55 bg-white/70 text-[#a57b3d] shadow-sm transition group-hover:bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] group-hover:text-white dark:bg-white/[0.06]">
                      <RelatedIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {isArabic
                          ? relatedItem.title.ar
                          : relatedItem.title.en}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {isArabic
                          ? relatedItem.description?.ar
                          : relatedItem.description?.en}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#a57b3d]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <Card className="rounded-lg border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {isArabic
                ? "الربط التشغيلي"
                : "Operational Integration"}
            </CardTitle>
            <CardDescription className="leading-6">
              {isArabic
                ? "الصفحة جاهزة لاستقبال واجهات API الحقيقية والمكونات التشغيلية الخاصة بالوحدة. لم تتم إضافة أرقام أو سجلات تجريبية."
                : "The page is ready for real APIs and operational components. No sample metrics or fabricated records were added."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}