"use client";
// communications_surfaces_hr_practitioner_spirit_v2=true
/* ============================================================
   📂 marilyn_frontend/app/system/whatsapp/templates/page.tsx
   💬 Marilyn Clinics — System WhatsApp Templates Page
   ------------------------------------------------------------
   ✅ Standalone route page, no internal tabs
   ✅ Approved Premium system page pattern
   ✅ Real API only: /api/system/whatsapp/templates/
   ✅ Template status management only
   ✅ No company WhatsApp mutation
   ✅ Arabic/English via primey-locale
============================================================ */
import * as React from "react";
import {
  Activity,
  Archive,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Inbox,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  Tag,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  printCurrentPage,
} from "@/lib/managed-print-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { CommunicationsCenterTabs } from "@/components/system/communications-center-tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type StatusFilter = "all" | "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
type CategoryFilter = "all" | "GENERAL" | "SALES" | "PURCHASES" | "TREASURY" | "ACCOUNTING" | "INVENTORY" | "CUSTOMER_SERVICE";
type SortKey = "newest" | "oldest" | "name" | "code" | "status";
type TemplateRow = {
  id: string;
  companyName: string;
  companyCode: string;
  name: string;
  code: string;
  category: string;
  status: string;
  language: string;
  body: string;
  variables: string[];
  metadata: ApiRecord;
  updatedAt: string | null;
};
const ENDPOINT = "/api/system/whatsapp/templates/?limit=100";
const API_ROOT = "/api/system/whatsapp/";
const tr = {
  ar: {
    title: "قوالب واتساب",
    subtitle: "صفحة مستقلة لمراجعة قوالب واتساب المسجلة في النظام مع الفلاتر والتصدير وتغيير الحالة.",
    badge: "التواصل والإشعارات",
    refresh: "تحديث",
    excel: "تصدير Excel",
    print: "طباعة",
    pdf: "PDF",
    reset: "إعادة ضبط",
    total: "إجمالي القوالب",
    active: "قوالب نشطة",
    draft: "قوالب مسودة",
    archived: "قوالب مؤرشفة",
    live: "من واجهات النظام الحقيقية",
    pagesTitle: "صفحات واتساب النظام",
    pagesDesc: "تنقل بين صفحات واتساب المستقلة بنفس نمط إدارة المنصة.",
    settings: "إعدادات واتساب النظام",
    settingsDesc: "إعداد الرقم الرسمي وQR وWebhook.",
    messages: "سجل الرسائل",
    messagesDesc: "متابعة رسائل واتساب المسجلة.",
    overview: "مركز واتساب",
    overviewDesc: "نظرة عامة على واتساب النظام.",
    dashboard: "لوحة النظام",
    dashboardDesc: "العودة إلى لوحة النظام.",
    tableTitle: "بيانات قوالب واتساب",
    tableDesc: "جدول القوالب مع البحث والتصفية وتحديث الحالة.",
    search: "ابحث باسم القالب أو الكود أو الشركة أو النص...",
    statusFilter: "الحالة",
    categoryFilter: "الفئة",
    sort: "الترتيب",
    all: "الكل",
    newest: "الأحدث",
    oldest: "الأقدم",
    nameSort: "الاسم",
    codeSort: "الكود",
    statusSort: "الحالة",
    company: "الشركة",
    template: "القالب",
    category: "الفئة",
    status: "الحالة",
    language: "اللغة",
    body: "النص",
    updatedAt: "آخر تحديث",
    actions: "الإجراءات",
    activate: "تفعيل",
    deactivate: "تعطيل",
    archive: "أرشفة",
    DRAFT: "مسودة",
    ACTIVE: "نشط",
    INACTIVE: "غير نشط",
    ARCHIVED: "مؤرشف",
    GENERAL: "عام",
    SALES: "المبيعات",
    PURCHASES: "المشتريات",
    TREASURY: "الخزينة",
    ACCOUNTING: "المحاسبة",
    INVENTORY: "المخزون",
    CUSTOMER_SERVICE: "خدمة العملاء",
    noData: "لا توجد بيانات",
    noDataDesc: "ستظهر القوالب هنا عند توفرها من API.",
    noResults: "لا توجد نتائج",
    noResultsDesc: "غيّر البحث أو الفلاتر.",
    errorTitle: "تعذر تحميل قوالب واتساب",
    errorDesc: "تأكد من تسجيل الدخول بصلاحية نظام ومن تشغيل الباكند.",
    tryAgain: "إعادة المحاولة",
    exportEmpty: "لا توجد بيانات للتصدير.",
    printEmpty: "لا توجد بيانات للطباعة.",
    pdfHint: "اختر حفظ كـ PDF من نافذة الطباعة.",
    statusUpdated: "تم تحديث حالة القالب.",
    showing: "عرض",
    of: "من",
    rows: "صف",
    unknown: "غير معروف",
  },
  en: {
    title: "WhatsApp Templates",
    subtitle: "Standalone page for reviewing system WhatsApp templates with filters, export, and status updates.",
    badge: "Communication",
    refresh: "Refresh",
    excel: "Export Excel",
    print: "Print",
    pdf: "PDF",
    reset: "Reset",
    total: "Total templates",
    active: "Active templates",
    draft: "Draft templates",
    archived: "Archived templates",
    live: "From real system APIs",
    pagesTitle: "System WhatsApp pages",
    pagesDesc: "Navigate between standalone WhatsApp system pages.",
    settings: "System WhatsApp settings",
    settingsDesc: "Configure official number, QR, and webhook.",
    messages: "Message logs",
    messagesDesc: "Monitor registered WhatsApp messages.",
    overview: "WhatsApp center",
    overviewDesc: "System WhatsApp overview.",
    dashboard: "System dashboard",
    dashboardDesc: "Return to system dashboard.",
    tableTitle: "WhatsApp templates data",
    tableDesc: "Templates table with search, filters, and status updates.",
    search: "Search template name, code, company, or body...",
    statusFilter: "Status",
    categoryFilter: "Category",
    sort: "Sort",
    all: "All",
    newest: "Newest",
    oldest: "Oldest",
    nameSort: "Name",
    codeSort: "Code",
    statusSort: "Status",
    company: "Company",
    template: "Template",
    category: "Category",
    status: "Status",
    language: "Language",
    body: "Body",
    updatedAt: "Updated at",
    actions: "Actions",
    activate: "Activate",
    deactivate: "Deactivate",
    archive: "Archive",
    DRAFT: "Draft",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    ARCHIVED: "Archived",
    GENERAL: "General",
    SALES: "Sales",
    PURCHASES: "Purchases",
    TREASURY: "Treasury",
    ACCOUNTING: "Accounting",
    INVENTORY: "Inventory",
    CUSTOMER_SERVICE: "Customer service",
    noData: "No data",
    noDataDesc: "Templates will appear here when returned by the API.",
    noResults: "No results",
    noResultsDesc: "Change the search or filters.",
    errorTitle: "Failed to load WhatsApp templates",
    errorDesc: "Make sure you are signed in with system permissions and the backend is running.",
    tryAgain: "Try again",
    exportEmpty: "There is no data to export.",
    printEmpty: "There is no data to print.",
    pdfHint: "Choose Save as PDF from the print dialog.",
    statusUpdated: "Template status updated.",
    showing: "Showing",
    of: "of",
    rows: "rows",
    unknown: "Unknown",
  },
} as const;
function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}
function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem("primey-locale") || window.localStorage.getItem("locale") || window.localStorage.getItem("lang");
  if (stored?.toLowerCase().startsWith("en")) return "en";
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ar";
}
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const found = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : "";
}
async function getCsrfToken(): Promise<string> {
  let token = getCookie("csrftoken");
  if (token) return token;
  await fetch("/api/auth/csrf/", { method: "GET", credentials: "include", headers: { Accept: "application/json" } }).catch(() => undefined);
  token = getCookie("csrftoken");
  return token;
}
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    throw new Error(toStringValue(asRecord(payload).message) || `Request failed: ${response.status}`);
  }
  return payload;
}
async function postJson<T>(url: string, body: ApiRecord): Promise<T> {
  const csrfToken = await getCsrfToken();
  return fetchJson<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
  });
}
function extractResults(payload: unknown): unknown[] {
  const record = asRecord(payload);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  return Array.isArray(payload) ? payload : [];
}
function normalizeTemplate(value: unknown): TemplateRow {
  const record = asRecord(value);
  const company = asRecord(record.company);
  const variables = record.variables;
  return {
    id: toStringValue(record.id),
    companyName: toStringValue(company.name || company.company_name || company.title),
    companyCode: toStringValue(company.company_code || company.companyCode || company.code),
    name: toStringValue(record.name),
    code: toStringValue(record.code),
    category: toStringValue(record.category, "GENERAL").toUpperCase(),
    status: toStringValue(record.status, "DRAFT").toUpperCase(),
    language: toStringValue(record.language || record.language_code || record.default_language_code, "ar"),
    body: toStringValue(record.body || record.content || record.message_body),
    variables: Array.isArray(variables) ? variables.map((item) => toStringValue(item)).filter(Boolean) : [],
    metadata: asRecord(record.metadata),
    updatedAt: toStringValue(record.updated_at || record.updatedAt) || null,
  };
}
function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}
function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function labelFor(value: string, locale: Locale): string {
  const dictionary = tr[locale] as Record<string, string>;
  return dictionary[value.toUpperCase()] || value || "—";
}

function localizedTemplateField(item: TemplateRow, locale: Locale, field: "name" | "body"): string {
  const metadata = asRecord(item.metadata);
  const i18n = asRecord(metadata.i18n);
  const current = asRecord(i18n[locale]);
  const fallback = asRecord(i18n.ar);
  const localized = toStringValue(current[field]) || toStringValue(fallback[field]);
  if (localized) return localized;
  return field === "name" ? item.name : item.body;
}

function statusBadgeClass(value: string): string {
  const status = value.toUpperCase();
  if (status === "ACTIVE") return "border-emerald-500/30 text-emerald-700";
  if (status === "INACTIVE") return "border-amber-500/30 text-amber-700";
  if (status === "ARCHIVED") return "border-slate-500/30 text-slate-700";
  return "border-muted-foreground/30 text-muted-foreground";
}
function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
function TemplatesSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <main dir={dir} className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
export default function SystemWhatsAppTemplatesPage() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [templates, setTemplates] = React.useState<TemplateRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const t = tr[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const alignClass = locale === "ar" ? "text-right" : "text-left";
  const lowerSearch = search.trim().toLowerCase();
  React.useEffect(() => {
    const applyLocale = () => {
      const nextLocale = getInitialLocale();
      setLocale(nextLocale);
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
      document.body.dir = nextLocale === "ar" ? "rtl" : "ltr";
    };
    applyLocale();
    window.addEventListener("storage", applyLocale);
    window.addEventListener("primey-locale-changed", applyLocale);
    return () => {
      window.removeEventListener("storage", applyLocale);
      window.removeEventListener("primey-locale-changed", applyLocale);
    };
  }, []);
  const loadTemplates = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) setLoading(true);
        setRefreshing(true);
        setError("");
        const payload = await fetchJson<unknown>(ENDPOINT);
        setTemplates(extractResults(payload).map(normalizeTemplate));
        if (silent) toast.success(t.refresh);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : t.errorDesc;
        setError(message);
        if (silent) toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t.errorDesc, t.refresh],
  );
  React.useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);
  const filteredTemplates = React.useMemo(() => {
    const filtered = templates.filter((item) => {
      if (lowerSearch) {
        const haystack = [localizedTemplateField(item, locale, "name"), item.name, item.code, item.category, item.status, item.language, localizedTemplateField(item, locale, "body"), item.body, item.companyName, item.companyCode, ...item.variables]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(lowerSearch)) return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sortKey === "oldest") return String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""));
      if (sortKey === "name") return localizedTemplateField(a, locale, "name").localeCompare(localizedTemplateField(b, locale, "name"));
      if (sortKey === "code") return a.code.localeCompare(b.code);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }, [categoryFilter, locale, lowerSearch, sortKey, statusFilter, templates]);
  const hasFilters = Boolean(search || statusFilter !== "all" || categoryFilter !== "all" || sortKey !== "newest");
  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortKey("newest");
  }
  function exportExcel() {
    if (!filteredTemplates.length) {
      toast.error(t.exportEmpty);
      return;
    }
    const headers = [t.company, t.template, t.category, t.status, t.language, t.updatedAt];
    const rows = filteredTemplates.map((item) => [
      item.companyName || t.unknown,
      item.name || "—",
      labelFor(item.category, locale),
      labelFor(item.status, locale),
      item.language || "—",
      formatDate(item.updatedAt, locale),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marilyn-system-whatsapp-templates.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function printPage(mode: "print" | "pdf") {
    if (!filteredTemplates.length) {
      toast.error(t.printEmpty);
      return;
    }
    if (mode === "pdf") toast.info(t.pdfHint);
    printCurrentPage();
  }
  async function updateTemplateStatus(template: TemplateRow, nextStatus: "ACTIVE" | "INACTIVE" | "ARCHIVED") {
    try {
      setSavingId(template.id);
      await postJson<unknown>(`${API_ROOT}templates/${template.id}/status/`, {
        status: nextStatus,
      });
      setTemplates((current) =>
        current.map((item) =>
          item.id === template.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );
      toast.success(t.statusUpdated);
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : t.errorDesc);
    } finally {
      setSavingId(null);
    }
  }
  const activeCount = templates.filter((item) => item.status === "ACTIVE").length;
  const draftCount = templates.filter((item) => item.status === "DRAFT").length;
  const archivedCount = templates.filter((item) => item.status === "ARCHIVED").length;
  if (loading) return <TemplatesSkeleton dir={dir} />;
  if (error) {
    return (
      <main dir={dir} className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-3xl rounded-3xl border-destructive/30 bg-card shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <CardTitle>{t.errorTitle}</CardTitle>
            <CardDescription>{t.errorDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => void loadTemplates({ silent: true })} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  return (
    <main dir={dir} className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <FileText className="h-3.5 w-3.5 text-[#a57b3d]" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              {t.live}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={
                registerOutlineButtonClass
              }
              onClick={() =>
                void loadTemplates({
                  silent: true,
                })
              }
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t.refresh}
            </Button>
            <Button
              variant="outline"
              className={
                registerOutlineButtonClass
              }
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={() =>
                printPage("print")
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              variant="outline"
              className={
                registerOutlineButtonClass
              }
              onClick={() =>
                printPage("pdf")
              }
            >
              <FileText className="h-4 w-4" />
              {t.pdf}
            </Button>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.total}
            value={templates.length}
            description={t.live}
            icon={FileText}
          />
          <SystemKpiCard
            title={t.active}
            value={activeCount}
            description={t.live}
            icon={CheckCircle2}
          />
          <SystemKpiCard
            title={t.draft}
            value={draftCount}
            description={t.live}
            icon={Tag}
          />
          <SystemKpiCard
            title={t.archived}
            value={archivedCount}
            description={t.live}
            icon={Archive}
          />
        </div>
        <CommunicationsCenterTabs
          active="templates"
          locale={locale}
          counts={{
            templates:
              templates.length,
          }}
        />
        <Card className="w-full overflow-hidden rounded-lg bg-card shadow-none">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-[#a57b3d]" />
                  {t.tableTitle}
                </CardTitle>
                <CardDescription className="mt-2">{t.tableDesc}</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                <Inbox className="h-3.5 w-3.5" />
                {t.showing} {formatInteger(filteredTemplates.length)} {t.of} {formatInteger(templates.length)} {t.rows}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataRegisterToolbar>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <div className="min-w-[280px] flex-1">
                  <DataRegisterSearch
                    value={search}
                    onChange={setSearch}
                    placeholder={t.search}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm sm:w-[145px]"
                >
                  <option value="all">
                    {t.all}
                  </option>
                  <option value="DRAFT">
                    {t.DRAFT}
                  </option>
                  <option value="ACTIVE">
                    {t.ACTIVE}
                  </option>
                  <option value="INACTIVE">
                    {t.INACTIVE}
                  </option>
                  <option value="ARCHIVED">
                    {t.ARCHIVED}
                  </option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as CategoryFilter,
                    )
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm sm:w-[165px]"
                >
                  <option value="all">
                    {t.all}
                  </option>
                  <option value="GENERAL">
                    {t.GENERAL}
                  </option>
                  <option value="SALES">
                    {t.SALES}
                  </option>
                  <option value="PURCHASES">
                    {t.PURCHASES}
                  </option>
                  <option value="TREASURY">
                    {t.TREASURY}
                  </option>
                  <option value="ACCOUNTING">
                    {t.ACCOUNTING}
                  </option>
                  <option value="INVENTORY">
                    {t.INVENTORY}
                  </option>
                  <option value="CUSTOMER_SERVICE">
                    {t.CUSTOMER_SERVICE}
                  </option>
                </select>
                <select
                  value={sortKey}
                  onChange={(event) =>
                    setSortKey(
                      event.target.value as SortKey,
                    )
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm sm:w-[145px]"
                >
                  <option value="newest">
                    {t.newest}
                  </option>
                  <option value="oldest">
                    {t.oldest}
                  </option>
                  <option value="name">
                    {t.nameSort}
                  </option>
                  <option value="code">
                    {t.codeSort}
                  </option>
                  <option value="status">
                    {t.statusSort}
                  </option>
                </select>
                <Button
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.reset}
                </Button>
              </div>
            </DataRegisterToolbar>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="w-full overflow-x-auto">
                <Table variant="register" layout="fixed" minWidth="1100px">
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
                      <TableHead className={cn("h-11 w-[220px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.company}</TableHead>
                      <TableHead className={cn("h-11 w-[220px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.template}</TableHead>
                      <TableHead className={cn("h-11 w-[135px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.category}</TableHead>
                      <TableHead className={cn("h-11 w-[120px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.status}</TableHead>
                      <TableHead className={cn("h-11 w-[90px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.language}</TableHead>
                      <TableHead className={cn("h-11 w-[270px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.body}</TableHead>
                      <TableHead className={cn("h-11 w-[120px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>{t.updatedAt}</TableHead>
                      <TableHead className="sticky left-0 z-10 h-11 w-[220px] bg-muted/40 px-3 text-center text-xs font-semibold text-muted-foreground">
                        {t.actions}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.length ? (
                      filteredTemplates.map((item) => (
                        <TableRow key={item.id || item.code || item.name} className="h-[74px]">
                          <TableCell className={cn("h-[74px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm font-semibold">{item.companyName || t.unknown}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">{item.companyCode || "—"}</span>
                          </TableCell>
                          <TableCell className={cn("h-[74px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm font-semibold">{item.name || "—"}</span>
                            <span className="mt-1 block truncate text-xs tabular-nums text-muted-foreground">{item.code || "—"}</span>
                          </TableCell>
                          <TableCell className={cn("h-[74px] px-4 align-middle", alignClass)}>{labelFor(item.category, locale)}</TableCell>
                          <TableCell className={cn("h-[74px] px-4 align-middle", alignClass)}>
                            <Badge variant="outline" className={cn("rounded-full", statusBadgeClass(item.status))}>{labelFor(item.status, locale)}</Badge>
                          </TableCell>
                          <TableCell className={cn("h-[74px] px-4 align-middle", alignClass)}>{item.language || "—"}</TableCell>
                          <TableCell className={cn("h-[74px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.body || "—"}</span>
                          </TableCell>
                          <TableCell className={cn("h-[74px] px-4 align-middle", alignClass)}>
                            <span className="text-sm tabular-nums text-muted-foreground">{formatDate(item.updatedAt, locale)}</span>
                          </TableCell>
                          <TableCell className="sticky left-0 z-10 h-[74px] bg-background px-3 text-center align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg bg-background px-3"
                                disabled={savingId === item.id || item.status === "ARCHIVED"}
                                onClick={() => void updateTemplateStatus(item, item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                              >
                                {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : item.status === "ACTIVE" ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                {item.status === "ACTIVE" ? t.deactivate : t.activate}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg bg-background px-3"
                                disabled={savingId === item.id || item.status === "ARCHIVED"}
                                onClick={() => void updateTemplateStatus(item, "ARCHIVED")}
                              >
                                <Archive className="h-3.5 w-3.5" />
                                {t.archive}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <DataRegisterEmptyState
                            icon={Inbox}
                            title={
                              hasFilters
                                ? t.noResults
                                : t.noData
                            }
                            description={
                              hasFilters
                                ? t.noResultsDesc
                                : t.noDataDesc
                            }
                            showReset={hasFilters}
                            onReset={resetFilters}
                            resetLabel={t.reset}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{t.showing} {formatInteger(filteredTemplates.length)} {t.of} {formatInteger(templates.length)} {t.rows}</span>
              <span>{t.live}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
