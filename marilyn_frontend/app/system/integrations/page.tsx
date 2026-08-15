"use client";
/* ============================================================
   📂 marilyn_frontend/app/system/integrations/page.tsx
   🔗 Marilyn Clinics — System Integrations Center
   ------------------------------------------------------------
   ✅ Approved system workspace visual pattern
   ✅ Real API only: GET /api/system/integration-api-keys/
   ✅ Shared KPI cards + approved navigation + recent API keys register
   ✅ Search, status filter, environment filter, sorting, reset
   ✅ Excel .xls export
   ✅ Web print + PDF through browser print dialog
   ✅ Skeleton loading
   ✅ Error / Empty / No results states
   ✅ sonner toast
   ✅ Arabic/English via primey-locale
   ✅ No localhost hardcoding
   ✅ No fake demo data
============================================================ */
import * as React from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  CircleCheck,
  CircleX,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutDashboard,
  Loader2,
  PlugZap,
  Printer,
  RefreshCcw,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { API_PATHS } from "@/lib/api/endpoints";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type SortKey = "newest" | "oldest" | "name" | "environment";
type StatusFilter = "all" | "active" | "disabled" | "revoked" | "expired";
type EnvironmentFilter = "all" | "live" | "test";
type IntegrationKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  environment: string;
  company: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string | null;
  expiresAt: string | null;
};
type TikTokConnection = {
  id: number | string;
  open_id: string;
  display_name: string;
  avatar_url: string;
  scopes: string[];
  is_active: boolean;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  last_synced_at: string | null;
  last_error: string;
  video_count: number;
  created_at: string | null;
  updated_at: string | null;
};

type TikTokStatusPayload = {
  configured: boolean;
  connected: boolean;
  connection: TikTokConnection | null;
};

type TikTokConnectPayload = {
  authorization_url: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};
const statusFilters: StatusFilter[] = ["all", "active", "disabled", "revoked", "expired"];
const environmentFilters: EnvironmentFilter[] = ["all", "live", "test"];
const translations = {
  ar: {
    title: "مركز التكاملات",
    subtitle:
      "مركز إدارة تكاملات Marilyn Clinics لمتابعة مفاتيح API وعقود الربط وجاهزية التكاملات من مكان واحد.",
    badge: "التكاملات",
    refresh: "تحديث",
    exportExcel: "تصدير Excel",
    print: "طباعة",
    pdf: "PDF",
    apiKeys: "مفاتيح API",
    contracts: "عقود API",
    readiness: "جاهزية الإصدار",
    dashboard: "لوحة النظام",
    reset: "إعادة ضبط",
    searchPlaceholder: "ابحث باسم المفتاح أو المنشأة أو البادئة أو الصلاحيات...",
    all: "الكل",
    sort: "الترتيب",
    newest: "الأحدث",
    oldest: "الأقدم",
    nameSort: "الاسم",
    environmentSort: "البيئة",
    open: "فتح",
    totalKeys: "إجمالي المفاتيح",
    activeKeys: "المفاتيح النشطة",
    liveKeys: "مفاتيح Live",
    testKeys: "مفاتيح Test",
    fromLiveApi: "من واجهات النظام الحقيقية",
    actionsTitle: "اختصارات وحدة التكاملات",
    actionsDesc: "تنقل سريع بين صفحات التكاملات الأساسية بنفس نمط إدارة المنصة.",
    keysTitle: "إدارة مفاتيح API",
    keysDesc: "عرض مفاتيح الربط وحالاتها والبيئة والصلاحيات.",
    contractsTitle: "عقود API",
    contractsDesc: "مراجعة عقود الواجهات ونقاط الربط المتاحة.",
    readinessTitle: "جاهزية الإصدار",
    readinessDesc: "فحص جاهزية النظام والعقود قبل الإطلاق.",
    dashboardTitle: "لوحة النظام",
    dashboardDesc: "العودة إلى لوحة تحكم النظام الرئيسية.",
    tableTitle: "أحدث مفاتيح API",
    tableDesc:
      "نظرة سريعة على أحدث مفاتيح التكامل المسجلة في Marilyn Clinics مع البيئة والحالة والصلاحيات.",
    keyName: "المفتاح",
    prefix: "البادئة",
    company: "المنشأة",
    environment: "البيئة",
    scopes: "الصلاحيات",
    status: "الحالة",
    lastUsedAt: "آخر استخدام",
    createdAt: "تاريخ الإنشاء",
    expiresAt: "تاريخ الانتهاء",
    active: "نشط",
    disabled: "معطل",
    revoked: "ملغي",
    expired: "منتهي",
    live: "Live",
    test: "Test",
    unknown: "غير محدد",
    noDataTitle: "لا توجد مفاتيح API",
    noDataDesc: "ستظهر مفاتيح التكامل هنا عند توفرها من API.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDesc: "غير البحث أو الفلاتر لعرض نتائج أخرى.",
    errorTitle: "تعذر تحميل مركز التكاملات",
    errorDesc:
      "تأكد من تسجيل الدخول بصلاحية نظام ومن تشغيل الباكند ثم أعد المحاولة.",
    tryAgain: "إعادة المحاولة",
    exportEmpty: "لا توجد بيانات للتصدير.",
    printEmpty: "لا توجد بيانات للطباعة.",
    pdfHint: "اختر حفظ كـ PDF من نافذة الطباعة.",
    reportTitle: "تقرير مركز تكاملات Marilyn Clinics",
    generatedAt: "تاريخ الإنشاء",
    showing: "عرض",
    of: "من",
    rows: "صفوف",
    refreshed: "تم تحديث مركز التكاملات.",
  },
  en: {
    title: "Integrations Center",
    subtitle:
      "Marilyn Clinics integrations center for API keys, API contracts, and integration readiness in one place.",
    badge: "Integrations",
    refresh: "Refresh",
    exportExcel: "Export Excel",
    print: "Print",
    pdf: "PDF",
    apiKeys: "API Keys",
    contracts: "API Contracts",
    readiness: "Release Readiness",
    dashboard: "System dashboard",
    reset: "Reset",
    searchPlaceholder: "Search by key name, facility, prefix, or scopes...",
    all: "All",
    sort: "Sort",
    newest: "Newest",
    oldest: "Oldest",
    nameSort: "Name",
    environmentSort: "Environment",
    open: "Open",
    totalKeys: "Total keys",
    activeKeys: "Active keys",
    liveKeys: "Live keys",
    testKeys: "Test keys",
    fromLiveApi: "From real system APIs",
    actionsTitle: "Integrations module shortcuts",
    actionsDesc: "Quick navigation between integrations pages using the platform management pattern.",
    keysTitle: "Manage API keys",
    keysDesc: "View integration keys, status, environment, and scopes.",
    contractsTitle: "API contracts",
    contractsDesc: "Review API contracts and available integration endpoints.",
    readinessTitle: "Release readiness",
    readinessDesc: "Check system and contract readiness before launch.",
    dashboardTitle: "System dashboard",
    dashboardDesc: "Return to the main system dashboard.",
    tableTitle: "Latest API keys",
    tableDesc:
      "A quick view of the newest integration keys registered in Marilyn Clinics with environment, status, and scopes.",
    keyName: "Key",
    prefix: "Prefix",
    company: "Facility",
    environment: "Environment",
    scopes: "Scopes",
    status: "Status",
    lastUsedAt: "Last used",
    createdAt: "Created at",
    expiresAt: "Expires at",
    active: "Active",
    disabled: "Disabled",
    revoked: "Revoked",
    expired: "Expired",
    live: "Live",
    test: "Test",
    unknown: "Unknown",
    noDataTitle: "No API keys",
    noDataDesc: "Integration keys will appear here when returned by the API.",
    noResultsTitle: "No matching results",
    noResultsDesc: "Change the search or filters to show other results.",
    errorTitle: "Could not load integrations center",
    errorDesc:
      "Make sure you are signed in as a system user and the backend is running, then try again.",
    tryAgain: "Try again",
    exportEmpty: "There is no data to export.",
    printEmpty: "There is no data to print.",
    pdfHint: "Choose Save as PDF from the print dialog.",
    reportTitle: "Marilyn Clinics Integrations Center Report",
    generatedAt: "Generated at",
    showing: "Showing",
    of: "of",
    rows: "rows",
    refreshed: "Integrations center refreshed.",
  },
} as const;
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function normalizeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}
function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
function formatInteger(value: unknown) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(toNumber(value)),
  );
}
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}
function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}
function getApiBaseUrl() {
  const envBase =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(
          /\/+$/,
          "",
        )
      : "";
  if (envBase.endsWith("/api")) return envBase.slice(0, -4);
  return envBase;
}
function makeApiUrl(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  return `${getApiBaseUrl()}${path}${query ? `?${query}` : ""}`;
}
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const record = asRecord(payload);
    const message =
      normalizeText(record.message) ||
      normalizeText(record.detail) ||
      normalizeText(record.error) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return (payload || {}) as T;
}
function readBrowserCookie(name: string) {
  if (typeof document === "undefined") return "";

  const prefix = `${encodeURIComponent(name)}=`;

  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();

    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return "";
}

async function ensureCsrfToken() {
  await fetch(makeApiUrl(API_PATHS.auth.csrf), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  return readBrowserCookie("csrftoken");
}

async function postJson<T>(url: string): Promise<T> {
  const csrfToken = await ensureCsrfToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    headers,
    body: JSON.stringify({}),
  });

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  let payload: unknown = null;

  if (rawText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = asRecord(payload);

    const message =
      normalizeText(record.message) ||
      normalizeText(record.detail) ||
      normalizeText(record.error) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return (payload || {}) as T;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  const dataRecord = asRecord(record.data);
  const metaRecord = asRecord(record.meta);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.records)) return record.records;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(dataRecord.results)) return dataRecord.results;
  if (Array.isArray(dataRecord.items)) return dataRecord.items;
  if (Array.isArray(dataRecord.records)) return dataRecord.records;
  if (Array.isArray(metaRecord.results)) return metaRecord.results;
  return [];
}
function extractCount(payload: unknown) {
  const record = asRecord(payload);
  const dataRecord = asRecord(record.data);
  const metaRecord = asRecord(record.meta);
  const arrayCount = extractArray(payload).length;
  return toNumber(
    record.count ??
      record.total ??
      record.total_count ??
      dataRecord.count ??
      dataRecord.total ??
      dataRecord.total_count ??
      metaRecord.count ??
      metaRecord.total ??
      metaRecord.total_count,
    arrayCount,
  );
}
function normalizeNestedName(value: unknown, keys: string[] = ["name", "title", "full_name"]) {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  for (const key of keys) {
    const text = normalizeText(record[key]);
    if (text) return text;
  }
  return "";
}
function normalizeStatus(value: unknown) {
  if (typeof value === "boolean") return value ? "active" : "disabled";
  const text = normalizeText(value, "active").toLowerCase();
  if (text === "true" || text === "enabled") return "active";
  if (text === "false") return "disabled";
  if (text === "inactive") return "disabled";
  if (text === "disable") return "disabled";
  if (text === "revoke") return "revoked";
  if (text === "expire") return "expired";
  return text;
}
function normalizeEnvironment(value: unknown) {
  const text = normalizeText(value, "test").toLowerCase();
  if (text === "production") return "live";
  if (text === "prod") return "live";
  if (text === "sandbox") return "test";
  return text === "live" ? "live" : "test";
}
function normalizeScopes(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
function normalizeApiKey(value: unknown): IntegrationKeyRecord {
  const record = asRecord(value);
  const company = record.company || record.company_ref || record.company_detail || record.owner_company;
  return {
    id: normalizeText(record.id || record.uuid || record.pk),
    name: normalizeText(record.name || record.key_name || record.label || record.description, "—"),
    keyPrefix: normalizeText(record.key_prefix || record.prefix || record.public_prefix || record.masked_key, "—"),
    status: normalizeStatus(record.effective_status ?? record.status ?? record.state ?? record.is_active),
    environment: normalizeEnvironment(record.environment ?? record.env ?? record.mode),
    company:
      normalizeText(record.company_name) ||
      normalizeNestedName(company, ["name", "company_name", "title", "code"]) ||
      "—",
    scopes: normalizeScopes(record.scopes || record.permissions || record.allowed_scopes),
    lastUsedAt: normalizeText(record.last_used_at || record.last_used || record.used_at) || null,
    createdAt: normalizeText(record.created_at || record.created || record.inserted_at) || null,
    expiresAt: normalizeText(record.expires_at || record.expired_at || record.valid_until) || null,
  };
}
function getStatusLabel(value: string, locale: Locale) {
  const normalized = value.toLowerCase().replace(/[^a-z_]/g, "") as keyof (typeof translations)["ar"];
  const fallback = normalizeText(value, translations[locale].unknown);
  return normalizeText(translations[locale][normalized], fallback);
}
function getEnvironmentLabel(value: string, locale: Locale) {
  const normalized = value.toLowerCase().replace(/[^a-z_]/g, "") as keyof (typeof translations)["ar"];
  const fallback = normalizeText(value, translations[locale].unknown);
  return normalizeText(translations[locale][normalized], fallback);
}
function getStatusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "disabled" || normalized === "expired") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized === "revoked") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
function getEnvironmentClass(value: string) {
  return value.toLowerCase() === "live"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}
function rowDateValue(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
function PillBadge({
  value,
  locale,
  type,
}: {
  value: string;
  locale: Locale;
  type: "status" | "environment";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs",
        type === "status" ? getStatusClass(value) : getEnvironmentClass(value),
      )}
    >
      {type === "status" ? getStatusLabel(value, locale) : getEnvironmentLabel(value, locale)}
    </Badge>
  );
}
function IntegrationsOverviewSkeleton() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-[560px] max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-24" />
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="min-h-[126px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-full max-w-3xl rounded-lg" />
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    </main>
  );
}
export default function SystemIntegrationsPage() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [keys, setKeys] = React.useState<IntegrationKeyRecord[]>([]);
  const [apiTotal, setApiTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [apiWarning, setApiWarning] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [environment, setEnvironment] = React.useState<EnvironmentFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");

  const [tiktokStatus, setTikTokStatus] =
    React.useState<TikTokStatusPayload | null>(null);

  const [tiktokLoading, setTikTokLoading] = React.useState(true);

  const [tiktokAction, setTikTokAction] = React.useState<
    "connect" | "sync" | "disconnect" | null
  >(null);

  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const alignClass = locale === "ar" ? "text-right" : "text-left";
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
  const loadIntegrations = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) setLoading(true);
        setRefreshing(true);
        setApiWarning("");
        const payload = await fetchJson<unknown>(makeApiUrl(API_PATHS.systemIntegrationApiKeys.list));
        const rows = extractArray(payload).map(normalizeApiKey);
        setKeys(rows);
        setApiTotal(extractCount(payload));
        if (silent) toast.success(t.refreshed);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : t.errorDesc;
        setApiWarning(message);
        setKeys([]);
        setApiTotal(0);
        if (silent) toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t.errorDesc, t.refreshed],
  );
  const loadTikTokStatus = React.useCallback(async () => {
    try {
      setTikTokLoading(true);

      const payload = await fetchJson<TikTokStatusPayload>(
        makeApiUrl(API_PATHS.systemTikTok.status),
      );

      setTikTokStatus(payload);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : locale === "ar"
            ? "تعذر تحميل حالة TikTok."
            : "Could not load TikTok status.";

      setTikTokStatus(null);
      toast.error(message);
    } finally {
      setTikTokLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void loadIntegrations();
    void loadTikTokStatus();
  }, [loadIntegrations, loadTikTokStatus]);

  const connectTikTok = React.useCallback(async () => {
    try {
      setTikTokAction("connect");

      const payload = await fetchJson<TikTokConnectPayload>(
        makeApiUrl(API_PATHS.systemTikTok.connect),
      );

      const authorizationUrl = normalizeText(
        payload.authorization_url,
      );

      if (!authorizationUrl) {
        throw new Error(
          locale === "ar"
            ? "لم يُرجع TikTok رابط التفويض."
            : "TikTok authorization URL was not returned.",
        );
      }

      window.location.assign(authorizationUrl);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : locale === "ar"
            ? "تعذر بدء ربط TikTok."
            : "Could not start TikTok connection.",
      );

      setTikTokAction(null);
    }
  }, [locale]);

  const syncTikTok = React.useCallback(async () => {
    try {
      setTikTokAction("sync");

      await postJson(
        makeApiUrl(API_PATHS.systemTikTok.sync),
      );

      toast.success(
        locale === "ar"
          ? "تمت مزامنة حساب TikTok."
          : "TikTok account synchronized.",
      );

      await loadTikTokStatus();
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : locale === "ar"
            ? "تعذرت مزامنة TikTok."
            : "Could not synchronize TikTok.",
      );
    } finally {
      setTikTokAction(null);
    }
  }, [loadTikTokStatus, locale]);

  const disconnectTikTok = React.useCallback(async () => {
    try {
      setTikTokAction("disconnect");

      await postJson(
        makeApiUrl(API_PATHS.systemTikTok.disconnect),
      );

      toast.success(
        locale === "ar"
          ? "تم فصل حساب TikTok."
          : "TikTok account disconnected.",
      );

      await loadTikTokStatus();
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : locale === "ar"
            ? "تعذر فصل TikTok."
            : "Could not disconnect TikTok.",
      );
    } finally {
      setTikTokAction(null);
    }
  }, [loadTikTokStatus, locale]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("tiktok");
    const message = params.get("message");

    if (result === "connected") {
      toast.success(
        locale === "ar"
          ? "تم ربط حساب TikTok بنجاح."
          : "TikTok account connected successfully.",
      );

      void loadTikTokStatus();
    }

    if (result === "error") {
      toast.error(
        message ||
          (locale === "ar"
            ? "تعذر إكمال ربط TikTok."
            : "TikTok connection could not be completed."),
      );
    }

    if (result) {
      const cleanUrl = new URL(window.location.href);

      cleanUrl.searchParams.delete("tiktok");
      cleanUrl.searchParams.delete("message");

      window.history.replaceState(
        {},
        "",
        `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
      );
    }
  }, [loadTikTokStatus, locale]);
  const resetFilters = React.useCallback(() => {
    setSearch("");
    setStatus("all");
    setEnvironment("all");
    setSort("newest");
  }, []);
  const filteredKeys = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = keys.filter((key) => {
      const haystack = [
        key.name,
        key.keyPrefix,
        key.company,
        key.environment,
        key.status,
        key.scopes.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && key.status !== status) return false;
      if (environment !== "all" && key.environment !== environment) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "oldest") return rowDateValue(a.createdAt) - rowDateValue(b.createdAt);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "environment") return a.environment.localeCompare(b.environment);
      return rowDateValue(b.createdAt) - rowDateValue(a.createdAt);
    });
  }, [environment, keys, search, sort, status]);
  const stats = React.useMemo(() => {
    return {
      total: apiTotal || keys.length,
      active: keys.filter((key) => key.status === "active").length,
      live: keys.filter((key) => key.environment === "live").length,
      test: keys.filter((key) => key.environment === "test").length,
    };
  }, [apiTotal, keys]);
  const quickActions: QuickAction[] = [
    {
      title: t.keysTitle,
      description: t.keysDesc,
      href: "/system/integrations/api-keys",
      icon: KeyRound,
    },
    {
      title: t.contractsTitle,
      description: t.contractsDesc,
      href: "/system/integrations/api-contracts",
      icon: FileText,
    },
    {
      title: t.readinessTitle,
      description: t.readinessDesc,
      href: "/system/release-readiness",
      icon: ShieldCheck,
    },
    {
      title: t.dashboardTitle,
      description: t.dashboardDesc,
      href: "/system",
      icon: LayoutDashboard,
    },
  ];
  const hasFilters = Boolean(search || status !== "all" || environment !== "all" || sort !== "newest");
  const previewRows = filteredKeys.slice(0, 8);
  function buildExportRows() {
    return filteredKeys.map((key) => [
      key.name,
      key.keyPrefix,
      key.company,
      getEnvironmentLabel(key.environment, locale),
      getStatusLabel(key.status, locale),
      key.scopes.length ? key.scopes.join(", ") : "—",
      formatDate(key.lastUsedAt),
      formatDate(key.createdAt),
      formatDate(key.expiresAt),
    ]);
  }
  function buildTableHtml() {
    const headers = [
      t.keyName,
      t.prefix,
      t.company,
      t.environment,
      t.status,
      t.scopes,
      t.lastUsedAt,
      t.createdAt,
      t.expiresAt,
    ];
    const rows = buildExportRows();
    return `
      <table border="1" cellspacing="0" cellpadding="6">
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    `;
  }
  function exportExcel() {
    const rows = buildExportRows();
    if (!rows.length) {
      toast.error(t.exportEmpty);
      return;
    }
    const html = `
      <html dir="${dir}" lang="${locale}">
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>${escapeHtml(t.reportTitle)}</h1>
          <p>${escapeHtml(t.generatedAt)}: ${escapeHtml(new Date().toLocaleString())}</p>
          ${buildTableHtml()}
        </body>
      </html>
    `;
    const blob = new Blob([`\ufeff${html}`], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marilyn-system-integrations-overview-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  async function openPrintWindow() {
    const rows = buildExportRows();
    if (!rows.length) {
      toast.error(t.printEmpty);
      return;
    }
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      tableHtml: buildTableHtml(),
      recordsCount: rows.length,
    });
    if (!opened) {
      toast.error(
        locale === "ar"
          ? "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."
          : "The print window could not be opened. Allow pop-ups and try again.",
      );
    }
  }
  if (loading) return <IntegrationsOverviewSkeleton />;
  return (
    <main dir={dir} className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 text-start">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#a57b3d]">
              <Sparkles className="h-4 w-4" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <PlugZap className="h-4 w-4 text-emerald-600" />
              {t.fromLiveApi}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() => void loadIntegrations({ silent: true })}
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
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.exportExcel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void openPrintWindow()}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              asChild
              variant="outline"
              className={registerOutlineButtonClass}
            >
              <Link href="/system/integrations/api-keys">
                <KeyRound className="h-4 w-4" />
                {t.apiKeys}
              </Link>
            </Button>
          </div>
        </header>
        {apiWarning ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50/70 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-amber-100 p-2">
                  <TriangleAlert className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.errorTitle}</p>
                  <p className="mt-1 text-xs text-amber-700">{apiWarning}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={registerOutlineButtonClass}
                onClick={() => void loadIntegrations({ silent: true })}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t.tryAgain}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.totalKeys}
            value={stats.total}
            description={t.fromLiveApi}
            icon={KeyRound}
            href="/system/integrations/api-keys"
          />
          <SystemKpiCard
            title={t.activeKeys}
            value={stats.active}
            description={t.fromLiveApi}
            icon={ShieldCheck}
            href="/system/integrations/api-keys"
          />
          <SystemKpiCard
            title={t.liveKeys}
            value={stats.live}
            description={t.fromLiveApi}
            icon={PlugZap}
            href="/system/integrations/api-keys"
          />
          <SystemKpiCard
            title={t.testKeys}
            value={stats.test}
            description={t.fromLiveApi}
            icon={FileText}
            href="/system/integrations/api-keys"
          />
        </div>
        <nav
          aria-label={t.actionsTitle}
          className="flex flex-wrap gap-2"
        >
          <Button
            asChild
            variant="brand"
            className={registerBrandButtonClass}
          >
            <Link href="/system/integrations" aria-current="page">
              <PlugZap className="h-4 w-4" />
              {t.title}
            </Link>
          </Button>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant="outline"
                className={registerOutlineButtonClass}
              >
                <Link href={action.href}>
                  <Icon className="h-4 w-4" />
                  {action.title}
                </Link>
              </Button>
            );
          })}
        </nav>
        <Card className="w-full rounded-lg border bg-card shadow-none">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm">
                  <Video className="h-5 w-5 text-[#a57b3d]" />
                </span>

                <div className="space-y-1">
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    TikTok

                    {!tiktokLoading && tiktokStatus?.connected ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <CircleCheck className="me-1 h-3.5 w-3.5" />
                        {locale === "ar" ? "متصل" : "Connected"}
                      </Badge>
                    ) : !tiktokLoading ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-slate-600"
                      >
                        <CircleX className="me-1 h-3.5 w-3.5" />
                        {locale === "ar" ? "غير متصل" : "Not connected"}
                      </Badge>
                    ) : null}
                  </CardTitle>

                  <CardDescription>
                    {locale === "ar"
                      ? "ربط حساب TikTok الرسمي ومزامنة الفيديوهات العامة لعرضها تلقائيًا في الموقع."
                      : "Connect the official TikTok account and synchronize public videos for the website."}
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tiktokStatus?.connected ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={registerOutlineButtonClass}
                      disabled={tiktokAction !== null}
                      onClick={() => void syncTikTok()}
                    >
                      {tiktokAction === "sync" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {locale === "ar" ? "مزامنة" : "Sync"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className={registerOutlineButtonClass}
                      disabled={tiktokAction !== null}
                      onClick={() => void disconnectTikTok()}
                    >
                      {tiktokAction === "disconnect" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CircleX className="h-4 w-4" />
                      )}
                      {locale === "ar"
                        ? "فصل الحساب"
                        : "Disconnect"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="brand"
                    className={registerBrandButtonClass}
                    disabled={
                      tiktokLoading ||
                      tiktokAction !== null ||
                      !tiktokStatus?.configured
                    }
                    onClick={() => void connectTikTok()}
                  >
                    {tiktokAction === "connect" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlugZap className="h-4 w-4" />
                    )}
                    {locale === "ar"
                      ? "ربط حساب TikTok"
                      : "Connect TikTok"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {tiktokLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
            ) : !tiktokStatus?.configured ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {locale === "ar"
                        ? "إعداد TikTok غير مكتمل"
                        : "TikTok is not configured"}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      {locale === "ar"
                        ? "تحقق من Client Key وClient Secret وRedirect URI في إعدادات الخادم."
                        : "Check the server Client Key, Client Secret, and Redirect URI."}
                    </p>
                  </div>
                </div>
              </div>
            ) : tiktokStatus.connected &&
              tiktokStatus.connection ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "الحساب" : "Account"}
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold">
                    {tiktokStatus.connection.display_name || "TikTok"}
                  </p>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "الفيديوهات" : "Videos"}
                  </p>
                  <p className="mt-2 text-xl font-bold tabular-nums">
                    {formatInteger(
                      tiktokStatus.connection.video_count,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar"
                      ? "آخر مزامنة"
                      : "Last sync"}
                  </p>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatDate(
                      tiktokStatus.connection.last_synced_at,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "الصلاحيات" : "Scopes"}
                  </p>
                  <p className="mt-2 truncate text-sm">
                    {tiktokStatus.connection.scopes?.length
                      ? tiktokStatus.connection.scopes.join(", ")
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold">
                  {locale === "ar"
                    ? "TikTok جاهز للربط"
                    : "TikTok is ready to connect"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "إعدادات الخادم موجودة. اربط الحساب لبدء مزامنة الفيديوهات."
                    : "Server configuration is available. Connect the account to start video synchronization."}
                </p>
              </div>
            )}

            {tiktokStatus?.connection?.last_error ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-700">
                {tiktokStatus.connection.last_error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{t.tableTitle}</CardTitle>
                <CardDescription className="mt-1">{t.tableDesc}</CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.exportExcel}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className={registerBrandButtonClass}
                  onClick={() => void openPrintWindow()}
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataRegisterToolbar className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <DataRegisterSearch
                value={search}
                onChange={setSearch}
                placeholder={t.searchPlaceholder}
                className="min-w-0 flex-1"
              />
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as StatusFilter)
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[165px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "all"
                        ? t.all
                        : getStatusLabel(item, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={environment}
                onValueChange={(value) =>
                  setEnvironment(value as EnvironmentFilter)
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environmentFilters.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "all"
                        ? t.all
                        : getEnvironmentLabel(item, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sort}
                onValueChange={(value) =>
                  setSort(value as SortKey)
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[160px]">
                  <ArrowUpDown className="me-2 h-4 w-4 text-[#a57b3d]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.newest}</SelectItem>
                  <SelectItem value="oldest">{t.oldest}</SelectItem>
                  <SelectItem value="name">{t.nameSort}</SelectItem>
                  <SelectItem value="environment">
                    {t.environmentSort}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </Button>
            </DataRegisterToolbar>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="w-full overflow-x-auto">
                <Table variant="register" className="w-full min-w-[980px] table-fixed">
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
                      <TableHead className={cn("h-11 w-[220px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.keyName}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[135px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.prefix}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[150px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.company}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[110px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.environment}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[110px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.status}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[190px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.scopes}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[115px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.lastUsedAt}
                      </TableHead>
                      <TableHead className={cn("h-11 w-[115px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.createdAt}
                      </TableHead>
                      <TableHead className="sticky left-0 z-10 h-11 w-[76px] bg-muted/40 px-3 text-center text-xs font-semibold text-muted-foreground">
                        {t.open}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.length ? (
                      previewRows.map((key) => (
                        <TableRow key={key.id || key.keyPrefix || key.name} className="h-[64px]">
                          <TableCell className={cn("h-[64px] overflow-hidden px-4 align-middle", alignClass)}>
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {key.name || t.unknown}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                #{key.id || key.keyPrefix || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("h-[64px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm tabular-nums text-muted-foreground">
                              {key.keyPrefix || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("h-[64px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {key.company || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("h-[64px] px-4 align-middle", alignClass)}>
                            <PillBadge value={key.environment} locale={locale} type="environment" />
                          </TableCell>
                          <TableCell className={cn("h-[64px] px-4 align-middle", alignClass)}>
                            <PillBadge value={key.status} locale={locale} type="status" />
                          </TableCell>
                          <TableCell className={cn("h-[64px] overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {key.scopes.length ? key.scopes.join(", ") : "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("h-[64px] px-4 align-middle", alignClass)}>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {formatDate(key.lastUsedAt)}
                            </span>
                          </TableCell>
                          <TableCell className={cn("h-[64px] px-4 align-middle", alignClass)}>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {formatDate(key.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="sticky left-0 z-10 h-[64px] bg-background px-3 text-center align-middle">
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="size-9 rounded-full bg-background shadow-none [&_svg]:text-[#a57b3d]"
                            >
                              <Link
                                href="/system/integrations/api-keys"
                                aria-label={t.open}
                                title={t.open}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <DataRegisterEmptyState
                            title={
                              hasFilters
                                ? t.noResultsTitle
                                : t.noDataTitle
                            }
                            description={
                              hasFilters
                                ? t.noResultsDesc
                                : t.noDataDesc
                            }
                            showReset={hasFilters}
                            resetLabel={t.reset}
                            onReset={resetFilters}
                            icon={KeyRound}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t.showing}{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatInteger(previewRows.length)}
                </span>{" "}
                {t.of}{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatInteger(apiTotal || keys.length)}
                </span>{" "}
                {t.rows}
              </p>
              <Button asChild variant="outline" className={registerOutlineButtonClass}>
                <Link href="/system/integrations/api-keys">
                  <KeyRound className="h-4 w-4" />
                  {t.apiKeys}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
