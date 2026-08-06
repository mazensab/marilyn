"use client";

// table_register_toolbar_inside=true

/* ============================================================
   📂 marilyn_frontend/app/system/users/permissions/page.tsx
   🏢 Marilyn Clinics — System Users Permissions
   ------------------------------------------------------------
   ✅ Marilyn Clinics system users permissions report
   ✅ Real API only: GET /api/users/
   ✅ Summary KPIs + status/role/access-type distributions
   ✅ Analytical full-width table
   ✅ Search, status, role, access-type, date filters
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
  Activity,
  ArrowUpDown,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  MapPin,
  PieChart,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TableProperties,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
import { AccessManagementTabs } from "@/components/system/access-management-tabs";

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
  DataRegisterDatePicker,
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
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

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "suspended"
  | "trial"
  | "pending"
  | "draft"
  | "cancelled"
  | "unknown";
type SortKey = "newest" | "oldest" | "name" | "code" | "status" | "activity" | "city";

type UserRecord = {
  id: string;
  name: string;
  code: string;
  status: string;
  owner: string;
  activity: string;
  subscription: string;
  email: string;
  phone: string;
  city: string;
  created_at: string | null;
  updated_at: string | null;
};

type DistributionRow = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

const API_ENDPOINT = "/api/users/";

const statusFilters: StatusFilter[] = [
  "all",
  "active",
  "inactive",
  "suspended",
  "trial",
  "pending",
  "draft",
  "cancelled",
  "unknown",
];

const translations = {
  ar: {
    title: "صلاحيات المستخدمين",
    subtitle:
      "مراجعة أدوار مستخدمي Marilyn Clinics وأنواع الوصول والحالة التشغيلية من بيانات API الحقيقية.",
    badge: "إدارة المنصة",
    refresh: "تحديث",
    exportExcel: "تصدير Excel",
    print: "طباعة",
    pdf: "PDF",
    pdfHint: "اختر حفظ كـ PDF من نافذة الطباعة.",
    addUser: "إضافة مستخدم",
    usersList: "قائمة المستخدمين",
    usersCenter: "مركز المستخدمين",
    systemDashboard: "لوحة النظام",
    reset: "إعادة ضبط",

    searchPlaceholder: "ابحث باسم المستخدم أو الكود أو اسم المستخدم أو الدور أو نوع الوصول...",
    statusFilter: "الحالة",
    activityFilter: "الدور",
    cityFilter: "نوع الوصول",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    sort: "الترتيب",
    all: "الكل",
    newest: "الأحدث",
    oldest: "الأقدم",
    nameSort: "الاسم",
    codeSort: "الكود",
    statusSort: "الحالة",
    activitySort: "الدور",
    citySort: "نوع الوصول",

    totalUsers: "إجمالي المستخدمين",
    activeUsers: "المستخدمين النشطة",
    inactiveUsers: "غير النشطة",
    subscribedUsers: "مستخدمون ببريد مسجل",
    uniqueActivities: "أدوار مختلفة",
    uniqueCities: "أنواع وصول",
    filteredRows: "نتائج الوصول",
    fromLiveApi: "من واجهات النظام الحقيقية",

    statusDistribution: "توزيع المستخدمين حسب الحالة",
    statusDistributionDesc: "عدد ونسبة المستخدمين في كل حالة تشغيلية.",
    activityDistribution: "توزيع المستخدمين حسب الدور",
    activityDistributionDesc: "أكثر الأدوار ظهورا ضمن المستخدمين الحاليين.",
    cityDistribution: "توزيع المستخدمين حسب نوع الوصول",
    cityDistributionDesc: "أكثر أنواع الوصول ظهورا ضمن المستخدمين الحاليين.",
    reportTable: "سجل وصول المستخدمين",
    reportTableDesc:
      "مراجعة المستخدم والدور ونوع الوصول والحالة بعد تطبيق الفلاتر الحالية.",

    user: "المستخدم",
    code: "الكود",
    owner: "اسم المستخدم",
    activity: "الدور",
    subscription: "البريد الإلكتروني",
    city: "نوع الوصول",
    status: "الحالة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    open: "فتح",

    active: "نشط",
    inactive: "غير نشط",
    suspended: "موقوف",
    trial: "تجريبي",
    pending: "معلق",
    draft: "مسودة",
    cancelled: "ملغي",
    unknown: "غير محدد",
    notAvailable: "غير متوفر",

    showing: "عرض",
    of: "من",
    rows: "صفوف",
    noDataTitle: "لا يوجد مستخدمون",
    noDataDesc: "ستظهر صلاحيات المستخدمين عند توفر بيانات من API.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDesc: "غير البحث أو الفلاتر لعرض نتائج أخرى.",
    errorTitle: "تعذر تحميل صلاحيات المستخدمين",
    errorDesc:
      "تأكد من تسجيل الدخول بصلاحية نظام ومن تشغيل الباكند ثم أعد المحاولة.",
    tryAgain: "إعادة المحاولة",
    exportEmpty: "لا توجد بيانات للتصدير.",
    printEmpty: "لا توجد بيانات للطباعة.",
    reportTitle: "تقرير وصول مستخدمي Marilyn Clinics",
    generatedAt: "تاريخ الإنشاء",
    refreshed: "تم تحديث صلاحيات المستخدمين.",
  },
  en: {
    title: "Users permissions",
    subtitle:
      "Review Marilyn Clinics user roles, access types, and operational status from real API data.",
    badge: "Platform management",
    refresh: "Refresh",
    exportExcel: "Export Excel",
    print: "Print",
    pdf: "PDF",
    pdfHint: "Choose Save as PDF from the print dialog.",
    addUser: "Add user",
    usersList: "Users list",
    usersCenter: "Users center",
    systemDashboard: "System dashboard",
    reset: "Reset",

    searchPlaceholder: "Search by user, username, email, role, or access type...",
    statusFilter: "Status",
    activityFilter: "Role",
    cityFilter: "Access type",
    fromDate: "From date",
    toDate: "To date",
    sort: "Sort",
    all: "All",
    newest: "Newest",
    oldest: "Oldest",
    nameSort: "Name",
    codeSort: "Code",
    statusSort: "Status",
    activitySort: "Role",
    citySort: "Access type",

    totalUsers: "Total users",
    activeUsers: "Active users",
    inactiveUsers: "Inactive",
    subscribedUsers: "With email",
    uniqueActivities: "Unique roles",
    uniqueCities: "Access types",
    filteredRows: "Access results",
    fromLiveApi: "From real system APIs",

    statusDistribution: "Users by status",
    statusDistributionDesc: "Count and ratio of users by operational status.",
    activityDistribution: "Users by role",
    activityDistributionDesc: "Top roles appearing among current users.",
    cityDistribution: "Users by access type",
    cityDistributionDesc: "Top access types appearing among current users.",
    reportTable: "User access register",
    reportTableDesc:
      "Review users, roles, access types, and status after applying the current filters.",

    user: "User",
    code: "Code",
    owner: "Username",
    activity: "Role",
    subscription: "Email",
    city: "Access type",
    status: "Status",
    createdAt: "Created at",
    updatedAt: "Updated at",
    open: "Open",

    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    trial: "Trial",
    pending: "Pending",
    draft: "Draft",
    cancelled: "Cancelled",
    unknown: "Unknown",
    notAvailable: "Not available",

    showing: "Showing",
    of: "of",
    rows: "rows",
    noDataTitle: "No users",
    noDataDesc: "User permissions will appear when the API returns data.",
    noResultsTitle: "No matching results",
    noResultsDesc: "Change the search or filters to show other results.",
    errorTitle: "Could not load users permissions",
    errorDesc:
      "Make sure you are signed in as a system user and the backend is running, then try again.",
    tryAgain: "Try again",
    exportEmpty: "There is no data to export.",
    printEmpty: "There is no data to print.",
    reportTitle: "Marilyn Clinics User Access Report",
    generatedAt: "Generated at",
    refreshed: "Users permissions refreshed.",
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

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function rowDateValue(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
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
      ? (
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          ""
        ).replace(/\/+$/, "")
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

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  const dataRecord = asRecord(record.data);
  const resultRecord = asRecord(record.result);

  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.records)) return record.records;
  if (Array.isArray(record.users)) return record.users;
  if (Array.isArray(record.data)) return record.data;

  if (Array.isArray(dataRecord.results)) return dataRecord.results;
  if (Array.isArray(dataRecord.items)) return dataRecord.items;
  if (Array.isArray(dataRecord.records)) return dataRecord.records;
  if (Array.isArray(dataRecord.users)) return dataRecord.users;

  if (Array.isArray(resultRecord.results)) return resultRecord.results;
  if (Array.isArray(resultRecord.items)) return resultRecord.items;
  if (Array.isArray(resultRecord.records)) return resultRecord.records;
  if (Array.isArray(resultRecord.users)) return resultRecord.users;

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
  if (value === null || value === undefined || value === "") return "unknown";
  if (typeof value === "boolean") return value ? "active" : "inactive";

  const text = normalizeText(value).toLowerCase();

  if (!text) return "unknown";
  if (text === "true") return "active";
  if (text === "false") return "inactive";
  if (text === "enabled") return "active";
  if (text === "disabled") return "inactive";

  return text;
}

function normalizeUser(value: unknown): UserRecord {
  const record = asRecord(value);
  const profile = asRecord(record.profile);
  const defaultWorkspace = asRecord(record.default_workspace);
  const membership = asRecord(
    record.default_membership || record.membership || record.company_membership
  );
  const rawId = normalizeText(record.id || record.pk || record.user_id);
  const userId = normalizeText(record.user_id || rawId);
  const username = normalizeText(
    record.username || profile.username || record.code || userId,
    "—"
  );
  const firstName = normalizeText(record.first_name || profile.first_name);
  const lastName = normalizeText(record.last_name || profile.last_name);
  const joinedName = `${firstName} ${lastName}`.trim();
  const displayName = normalizeText(
    record.display_name ||
      record.full_name ||
      record.name ||
      joinedName ||
      username ||
      record.email,
    "—"
  );
  const email = normalizeText(record.email || profile.email, "—");
  const phone = normalizeText(
    record.phone ||
      record.mobile ||
      record.whatsapp ||
      profile.phone ||
      profile.mobile,
    "—"
  );
  const role = normalizeText(
    record.system_role ||
      record.role ||
      record.access_role ||
      membership.role,
    "—"
  );
  const accessType = normalizeText(
    record.access_type ||
      record.default_workspace ||
      defaultWorkspace.type ||
      defaultWorkspace.code ||
      defaultWorkspace.name,
    "—"
  );
  const status = normalizeText(
    record.status || (record.is_active === false ? "inactive" : "active"),
    "unknown"
  ).toLowerCase();
  return {
    id: rawId || userId || username,
    name: displayName,
    code: username,
    status,
    owner: username,
    activity: role,
    subscription: email,
    email,
    phone,
    city: accessType,
    created_at:
      normalizeText(record.created_at || record.date_joined || profile.created_at) ||
      null,
    updated_at:
      normalizeText(record.updated_at || record.last_login || profile.updated_at) ||
      null,
  };
}

function getStatusLabel(value: string, locale: Locale) {
  const normalized = value.toLowerCase();

  const ar: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    suspended: "موقوف",
    trial: "تجريبي",
    pending: "معلق",
    draft: "مسودة",
    cancelled: "ملغي",
    unknown: "غير محدد",
  };

  const en: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    trial: "Trial",
    pending: "Pending",
    draft: "Draft",
    cancelled: "Cancelled",
    unknown: "Unknown",
  };

  return locale === "ar" ? ar[normalized] || value : en[normalized] || value;
}

function getStatusClass(value: string) {
  const normalized = value.toLowerCase();

  if (["active", "paid", "confirmed", "ready", "success"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["pending", "trial", "draft", "processing"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (["inactive", "failed", "cancelled", "expired", "suspended", "blocked"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({ value, locale }: { value: string; locale: Locale }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs", getStatusClass(value))}
    >
      {getStatusLabel(value, locale)}
    </Badge>
  );
}

function makeDistribution(
  rows: UserRecord[],
  pick: (row: UserRecord) => string,
  locale: Locale,
  options?: { status?: boolean; limit?: number },
): DistributionRow[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = normalizeText(pick(row), "—");
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const total = rows.length || 1;

  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: options?.status ? getStatusLabel(key, locale) : key,
      count,
      percent: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, options?.limit || 10);
}

function ReportSkeleton() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div className="rounded-lg border bg-card p-6 shadow-none">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-lg border shadow-none">
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
        <Card className="rounded-lg border shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DistributionCard({
  title,
  description,
  rows,
  locale,
}: {
  title: string;
  description: string;
  rows: DistributionRow[];
  locale: Locale;
}) {
  return (
    <Card className="rounded-lg border bg-card shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.key} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-foreground">{row.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatInteger(row.count)} · {formatPercent(row.percent)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    locale === "ar" ? "origin-right" : "origin-left",
                    "bg-primary",
                  )}
                  style={{ width: `${Math.max(3, Math.min(100, row.percent))}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
            —
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemUsersPermissionsPage() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [apiTotal, setApiTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [activity, setRole] = React.useState("all");
  const [city, setCity] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");

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

  const loadUsers = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) setLoading(true);
        setRefreshing(true);
        setError("");

        const params = new URLSearchParams({
          page: "1",
          page_size: "500",
          ordering: "-created_at",
        });

        const payload = await fetchJson<unknown>(makeApiUrl(API_ENDPOINT, params));
        const rows = extractArray(payload).map(normalizeUser);

        setUsers(rows);
        setApiTotal(extractCount(payload));

        if (silent) toast.success(t.refreshed);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : t.errorDesc;
        setError(message);
        if (silent) toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t.errorDesc, t.refreshed],
  );

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const activityOptions = React.useMemo(() => {
    return [...new Set(users.map((user) => user.activity).filter((value) => value && value !== "—"))].sort();
  }, [users]);

  const cityOptions = React.useMemo(() => {
    return [...new Set(users.map((user) => user.city).filter((value) => value && value !== "—"))].sort();
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : 0;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : 0;

    const rows = users.filter((user) => {
      const haystack = [
        user.name,
        user.code,
        user.owner,
        user.activity,
        user.subscription,
        user.city,
        user.status,
        user.email,
        user.phone,
      ]
        .join(" ")
        .toLowerCase();

      const createdTime = rowDateValue(user.created_at);

      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && user.status !== status) return false;
      if (activity !== "all" && user.activity !== activity) return false;
      if (city !== "all" && user.city !== city) return false;
      if (fromTime && createdTime && createdTime < fromTime) return false;
      if (toTime && createdTime && createdTime > toTime) return false;

      return true;
    });

    return [...rows].sort((a, b) => {
      if (sort === "oldest") return rowDateValue(a.created_at) - rowDateValue(b.created_at);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "code") return a.code.localeCompare(b.code);
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "activity") return a.activity.localeCompare(b.activity);
      if (sort === "city") return a.city.localeCompare(b.city);
      return rowDateValue(b.created_at) - rowDateValue(a.created_at);
    });
  }, [activity, city, users, fromDate, search, sort, status, toDate]);

  const stats = React.useMemo(() => {
    return {
      total: apiTotal || users.length,
      active: users.filter((user) => user.status === "active").length,
      inactive: users.filter((user) =>
        ["inactive", "suspended", "cancelled"].includes(user.status),
      ).length,
      subscribed: users.filter((user) => user.subscription && user.subscription !== "—").length,
      activities: activityOptions.length,
      cities: cityOptions.length,
      filtered: filteredUsers.length,
    };
  }, [activityOptions.length, apiTotal, cityOptions.length, users, filteredUsers.length]);

  const statusDistribution = React.useMemo(
    () => makeDistribution(filteredUsers, (row) => row.status, locale, { status: true, limit: 8 }),
    [filteredUsers, locale],
  );

  const activityDistribution = React.useMemo(
    () => makeDistribution(filteredUsers, (row) => row.activity, locale, { limit: 8 }),
    [filteredUsers, locale],
  );

  const cityDistribution = React.useMemo(
    () => makeDistribution(filteredUsers, (row) => row.city, locale, { limit: 8 }),
    [filteredUsers, locale],
  );

  const hasFilters = Boolean(
    search || status !== "all" || activity !== "all" || city !== "all" || fromDate || toDate || sort !== "newest",
  );

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setRole("all");
    setCity("all");
    setFromDate("");
    setToDate("");
    setSort("newest");
  }

  function buildExportRows() {
    return filteredUsers.map((user) => [
      user.name,
      user.code,
      user.owner,
      user.activity,
      user.subscription,
      user.city,
      getStatusLabel(user.status, locale),
      formatDate(user.created_at),
      formatDate(user.updated_at),
    ]);
  }

  function buildTableHtml() {
    const headers = [
      t.user,
      t.code,
      t.owner,
      t.activity,
      t.subscription,
      t.city,
      t.status,
      t.createdAt,
      t.updatedAt,
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
    link.download = `marilyn-system-users-permissions-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function openPrintWindow(
    mode: "print" | "pdf",
  ) {
    const rows = buildExportRows();
    if (!rows.length) {
      toast.error(t.printEmpty);
      return;
    }
    if (mode === "pdf") {
      toast.info(t.pdfHint);
    }
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: t.subtitle,
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
  if (loading) return <ReportSkeleton />;

  if (error) {
    return (
      <main dir={dir} className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-3xl rounded-lg border-destructive/30 bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <CardTitle>{t.errorTitle}</CardTitle>
            <CardDescription>{t.errorDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => void loadUsers({ silent: true })} className="rounded-xl">
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
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#9a7139]">
              <ShieldCheck className="h-4 w-4" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              {t.fromLiveApi}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() => void loadUsers({ silent: true })}
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
              className={registerOutlineButtonClass}
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.exportExcel}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void openPrintWindow("print")}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              asChild
              variant="brand"
              className={registerBrandButtonClass}
            >
              <Link href="/system/users/create">
                <Plus className="h-4 w-4" />
                {t.addUser}
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard title={t.totalUsers} value={stats.total} description={t.fromLiveApi} icon={Building2} />
          <SystemKpiCard title={t.activeUsers} value={stats.active} description={t.fromLiveApi} icon={CheckCircle2} />
          <SystemKpiCard title={t.inactiveUsers} value={stats.inactive} description={t.fromLiveApi} icon={ShieldCheck} />
          <SystemKpiCard title={t.subscribedUsers} value={stats.subscribed} description={t.fromLiveApi} icon={Activity} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SystemKpiCard title={t.uniqueActivities} value={stats.activities} description={t.fromLiveApi} icon={PieChart} />
          <SystemKpiCard title={t.uniqueCities} value={stats.cities} description={t.fromLiveApi} icon={MapPin} />
          <SystemKpiCard title={t.filteredRows} value={stats.filtered} description={t.fromLiveApi} icon={TableProperties} />
        </section>

        <AccessManagementTabs active="userPermissions" counts={{ userPermissions: stats.total }} />



        <div className="grid gap-4 xl:grid-cols-3">
          <DistributionCard
            title={t.statusDistribution}
            description={t.statusDistributionDesc}
            rows={statusDistribution}
            locale={locale}
          />
          <DistributionCard
            title={t.activityDistribution}
            description={t.activityDistributionDesc}
            rows={activityDistribution}
            locale={locale}
          />
          <DistributionCard
            title={t.cityDistribution}
            description={t.cityDistributionDesc}
            rows={cityDistribution}
            locale={locale}
          />
        </div>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight"><ShieldCheck className="h-4 w-4 text-[#a57b3d]" />{t.reportTable}</CardTitle>
                <CardDescription className="mt-2">{t.reportTableDesc}</CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.exportExcel}
                </Button>
                <Button
                  size="sm"
                  variant="brand"
                  className={registerBrandButtonClass}
                  onClick={() =>
                    void openPrintWindow("print")
                  }
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center">
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
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[145px]">
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
              <Select value={activity} onValueChange={setRole}>
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[155px]">
                  <SelectValue placeholder={t.activityFilter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {activityOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[155px]">
                  <SelectValue placeholder={t.cityFilter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {cityOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-full sm:w-[150px]">
                <DataRegisterDatePicker
                  label={t.fromDate}
                  value={fromDate}
                  onChange={setFromDate}
                  locale={locale}
                />
              </div>
              <div className="w-full sm:w-[150px]">
                <DataRegisterDatePicker
                  label={t.toDate}
                  value={toDate}
                  onChange={setToDate}
                  locale={locale}
                />
              </div>
              <Select
                value={sort}
                onValueChange={(value) =>
                  setSort(value as SortKey)
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[155px]">
                  <ArrowUpDown className="me-2 h-4 w-4 text-[#a57b3d]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {t.newest}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {t.oldest}
                  </SelectItem>
                  <SelectItem value="name">
                    {t.nameSort}
                  </SelectItem>
                  <SelectItem value="code">
                    {t.codeSort}
                  </SelectItem>
                  <SelectItem value="status">
                    {t.statusSort}
                  </SelectItem>
                  <SelectItem value="activity">
                    {t.activitySort}
                  </SelectItem>
                  <SelectItem value="city">
                    {t.citySort}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
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
                <Table variant="register" className="min-w-[1050px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn("w-[220px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.user}
                      </TableHead>
                      <TableHead className={cn("w-[130px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.code}
                      </TableHead>
                      <TableHead className={cn("w-[130px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.owner}
                      </TableHead>
                      <TableHead className={cn("w-[130px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.activity}
                      </TableHead>
                      <TableHead className={cn("w-[130px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.subscription}
                      </TableHead>
                      <TableHead className={cn("w-[120px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.city}
                      </TableHead>
                      <TableHead className={cn("w-[110px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.status}
                      </TableHead>
                      <TableHead className={cn("w-[115px] px-4 text-xs font-semibold text-muted-foreground", alignClass)}>
                        {t.createdAt}
                      </TableHead>
                      <TableHead className="sticky left-0 z-10 w-[76px] bg-muted/40 px-3 text-center text-xs font-semibold text-muted-foreground">
                        {t.open}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.length ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id || user.code || user.name} className="h-[64px]">
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {user.name || t.notAvailable}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                #{user.id || user.code || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm tabular-nums text-muted-foreground">
                              {user.code || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {user.owner || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {user.activity || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {user.subscription || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("overflow-hidden px-4 align-middle", alignClass)}>
                            <span className="block truncate text-sm text-muted-foreground">
                              {user.city || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={cn("px-4 align-middle", alignClass)}>
                            <StatusBadge value={user.status} locale={locale} />
                          </TableCell>
                          <TableCell className={cn("px-4 align-middle", alignClass)}>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {formatDate(user.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="sticky left-0 z-10 bg-background px-3 text-center align-middle">
                            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg bg-background px-3">
                              <Link href={user.id ? `/system/users/${user.id}` : "/system/users"}>
                                {t.open}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <DataRegisterEmptyState
                            title={hasFilters ? t.noResultsTitle : t.noDataTitle}
                            description={hasFilters ? t.noResultsDesc : t.noDataDesc}
                            showReset={hasFilters}
                            resetLabel={t.reset}
                            onReset={resetFilters}
                            icon={ShieldCheck}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {t.showing}{" "}
                <strong>{formatInteger(filteredUsers.length)}</strong>{" "}
                {t.of}{" "}
                <strong>
                  {formatInteger(apiTotal || users.length)}
                </strong>{" "}
                {t.rows}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                {t.fromLiveApi}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
