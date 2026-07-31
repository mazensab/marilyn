"use client";

/* ============================================================
   📂 marilyn_frontend/app/system/page.tsx
   🧠 Marilyn Clinics — System Dashboard
   ------------------------------------------------------------
   ✅ Approved Marilyn system workspace design
   ✅ Direct page heading compatible with the unified header
   ✅ Real system APIs only; no fabricated payment endpoint
   ✅ Clickable KPI cards and record rows
   ✅ Table-level Excel and print actions
   ✅ Shared Calendar / Popover date filters
   ✅ Contextual status filters per register
   ✅ English digits and SAR icon after the amount
   ✅ Skeleton / error / empty / partial states
   ✅ sonner toast
   ✅ RTL/LTR through primey-locale
   ✅ No localhost hardcoding
============================================================ */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpDown,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Gauge,
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
type ApiResponse = ApiRecord | ApiRecord[];
type SortKey = "newest" | "oldest" | "amount_high" | "amount_low" | "name";
type StatusFilter = string;

type DashboardStats = {
  companies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  subscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  apiContracts: number;
  readinessScore: number;
};

type CompanyRecord = {
  id: string;
  name: string;
  code: string;
  status: string;
  owner: string;
  activity: string;
  subscription: string;
  created_at: string | null;
};

type SubscriptionRecord = {
  id: string;
  company_name: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
};

type ReadinessCheckRecord = {
  id: string;
  name: string;
  category: string;
  status: string;
  message: string;
  updated_at: string | null;
};

type DataColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type ExportColumn<T> = {
  label: string;
  value: (row: T) => string | number;
};

type ExportSection = {
  title: string;
  subtitle: string;
  html: string;
  rowCount: number;
};

const API_ENDPOINTS = {
  companies: "/api/system/companies/",
  subscriptions: "/api/system/subscriptions/",
  releaseReadiness: "/api/system/release-readiness/",
} as const;

const COMPANY_STATUS_OPTIONS = ["all", "active", "inactive", "suspended"] as const;
const SUBSCRIPTION_STATUS_OPTIONS = [
  "all",
  "active",
  "trial",
  "pending",
  "expired",
  "suspended",
  "cancelled",
] as const;
const READINESS_STATUS_OPTIONS = ["all", "passed", "pending", "failed"] as const;

const translations = {
  ar: {
    badge: "مساحة النظام",
    title: "لوحة تحكم النظام",
    subtitle:
      "مركز متابعة Marilyn Clinics لإدارة الشركات والاشتراكات وجاهزية الإصدار وعقود واجهات API من مكان واحد.",
    refresh: "تحديث",
    export: "تصدير Excel",
    print: "طباعة",
    printAll: "طباعة الكل",
    reset: "إعادة ضبط",
    all: "الكل",
    from: "من تاريخ",
    to: "إلى تاريخ",
    newest: "الأحدث",
    oldest: "الأقدم",
    amountHigh: "الأعلى مبلغًا",
    amountLow: "الأقل مبلغًا",
    nameSort: "الاسم",
    showing: "عرض",
    rows: "صفوف",
    of: "من",
    sar: "ر.س",
    unknown: "غير محدد",
    systemHealth: "حالة النظام",
    connectedToLiveApis: "متصل بواجهات النظام الحقيقية",
    partialWarningTitle: "تم تحميل الصفحة جزئيًا",
    partialWarningDesc:
      "تعذر تحميل بعض بيانات النظام، لذلك تم عرض السجلات والمؤشرات المتاحة فقط.",

    totalCompanies: "إجمالي الشركات",
    activeCompanies: "الشركات النشطة",
    inactiveCompanies: "الشركات غير النشطة",
    totalSubscriptions: "إجمالي الاشتراكات",
    activeSubscriptions: "الاشتراكات النشطة",
    trialSubscriptions: "الاشتراكات التجريبية",
    apiContracts: "عقود API",
    readinessScore: "جاهزية الإصدار",

    companiesDesc: "جميع الشركات المسجلة في النظام",
    activeCompaniesDesc: "الشركات المتاحة للتشغيل حاليًا",
    inactiveCompaniesDesc: "الشركات غير المتاحة للتشغيل",
    subscriptionsDesc: "جميع اشتراكات الشركات",
    activeSubscriptionsDesc: "الاشتراكات النشطة حاليًا",
    trialSubscriptionsDesc: "الاشتراكات ضمن الفترة التجريبية",
    apiContractsDesc: "عقود واجهات النظام المتحققة",
    readinessScoreDesc: "نسبة اجتياز فحوصات جاهزية الإصدار",

    latestCompanies: "آخر الشركات",
    latestCompaniesDesc:
      "أحدث الشركات المسجلة في Marilyn Clinics مع الحالة والنشاط والاشتراك.",
    latestSubscriptions: "آخر الاشتراكات",
    latestSubscriptionsDesc:
      "أحدث اشتراكات الشركات مع الخطة ودورة الفوترة وفترة الاشتراك.",
    readinessChecks: "فحوصات جاهزية الإصدار",
    readinessChecksDesc:
      "الفحوصات التشغيلية والتقنية المتاحة من واجهة جاهزية الإصدار.",

    companySearchPlaceholder: "ابحث باسم الشركة أو الكود أو المالك أو النشاط...",
    subscriptionSearchPlaceholder: "ابحث باسم الشركة أو الخطة أو دورة الفوترة...",
    readinessSearchPlaceholder: "ابحث باسم الفحص أو التصنيف أو الرسالة...",

    company: "الشركة",
    code: "الكود",
    owner: "المالك",
    activity: "النشاط",
    subscription: "الاشتراك",
    status: "الحالة",
    createdAt: "تاريخ الإنشاء",
    plan: "الخطة",
    billingCycle: "دورة الفوترة",
    amount: "المبلغ",
    startsAt: "البداية",
    endsAt: "النهاية",
    check: "الفحص",
    category: "التصنيف",
    message: "التفاصيل",
    updatedAt: "آخر تحديث",
    actions: "الإجراءات",
    openDetails: "فتح التفاصيل",

    active: "نشط",
    inactive: "غير نشط",
    trial: "تجريبي",
    pending: "معلق",
    paid: "مدفوع",
    confirmed: "مؤكد",
    failed: "فشل",
    cancelled: "ملغي",
    expired: "منتهي",
    suspended: "موقوف",
    refunded: "مسترد",
    passed: "ناجح",
    ready: "جاهز",
    success: "ناجح",
    draft: "مسودة",

    noDataTitle: "لا توجد بيانات",
    noDataDesc: "لا توجد سجلات متاحة حاليًا.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDesc: "غيّر البحث أو الفلاتر لعرض نتائج أخرى.",
    errorTitle: "تعذر تحميل لوحة النظام",
    errorDesc:
      "تأكد من تسجيل الدخول بصلاحية نظام ومن تشغيل الباكند ثم أعد المحاولة.",
    tryAgain: "إعادة المحاولة",
    exportEmpty: "لا توجد بيانات للتصدير.",
    printEmpty: "لا توجد بيانات للطباعة.",
    exportReady: "تم تجهيز ملف Excel.",
    printReady: "تم تجهيز صفحة الطباعة.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تقرير لوحة تحكم Marilyn Clinics",
    generatedAt: "تم الإنشاء في",
    recordsCount: "عدد السجلات",
    refreshed: "تم تحديث لوحة النظام.",
  },
  en: {
    badge: "System workspace",
    title: "System Dashboard",
    subtitle:
      "Marilyn Clinics operations center for companies, subscriptions, release readiness, and API contracts.",
    refresh: "Refresh",
    export: "Export Excel",
    print: "Print",
    printAll: "Print all",
    reset: "Reset",
    all: "All",
    from: "From date",
    to: "To date",
    newest: "Newest",
    oldest: "Oldest",
    amountHigh: "Highest amount",
    amountLow: "Lowest amount",
    nameSort: "Name",
    showing: "Showing",
    rows: "rows",
    of: "of",
    sar: "SAR",
    unknown: "Unknown",
    systemHealth: "System health",
    connectedToLiveApis: "Connected to real system APIs",
    partialWarningTitle: "Partially loaded",
    partialWarningDesc:
      "Some system data could not be loaded, so only available records and metrics are shown.",

    totalCompanies: "Total companies",
    activeCompanies: "Active companies",
    inactiveCompanies: "Inactive companies",
    totalSubscriptions: "Total subscriptions",
    activeSubscriptions: "Active subscriptions",
    trialSubscriptions: "Trial subscriptions",
    apiContracts: "API contracts",
    readinessScore: "Release readiness",

    companiesDesc: "All companies registered in the system",
    activeCompaniesDesc: "Companies currently available for operation",
    inactiveCompaniesDesc: "Companies unavailable for operation",
    subscriptionsDesc: "All company subscriptions",
    activeSubscriptionsDesc: "Currently active subscriptions",
    trialSubscriptionsDesc: "Subscriptions in the trial period",
    apiContractsDesc: "Verified system API contracts",
    readinessScoreDesc: "Percentage of passed release-readiness checks",

    latestCompanies: "Latest companies",
    latestCompaniesDesc:
      "Newest companies registered in Marilyn Clinics with status, activity, and subscription.",
    latestSubscriptions: "Latest subscriptions",
    latestSubscriptionsDesc:
      "Newest company subscriptions with plan, billing cycle, and subscription period.",
    readinessChecks: "Release-readiness checks",
    readinessChecksDesc:
      "Operational and technical checks returned by the release-readiness API.",

    companySearchPlaceholder: "Search by company, code, owner, or activity...",
    subscriptionSearchPlaceholder: "Search by company, plan, or billing cycle...",
    readinessSearchPlaceholder: "Search by check, category, or message...",

    company: "Company",
    code: "Code",
    owner: "Owner",
    activity: "Activity",
    subscription: "Subscription",
    status: "Status",
    createdAt: "Created at",
    plan: "Plan",
    billingCycle: "Billing cycle",
    amount: "Amount",
    startsAt: "Starts",
    endsAt: "Ends",
    check: "Check",
    category: "Category",
    message: "Details",
    updatedAt: "Updated at",
    actions: "Actions",
    openDetails: "Open details",

    active: "Active",
    inactive: "Inactive",
    trial: "Trial",
    pending: "Pending",
    paid: "Paid",
    confirmed: "Confirmed",
    failed: "Failed",
    cancelled: "Cancelled",
    expired: "Expired",
    suspended: "Suspended",
    refunded: "Refunded",
    passed: "Passed",
    ready: "Ready",
    success: "Success",
    draft: "Draft",

    noDataTitle: "No data",
    noDataDesc: "No records are currently available.",
    noResultsTitle: "No matching results",
    noResultsDesc: "Change the search or filters to show other results.",
    errorTitle: "Could not load system dashboard",
    errorDesc:
      "Make sure you are signed in as a system user and the backend is running, then try again.",
    tryAgain: "Try again",
    exportEmpty: "There is no data to export.",
    printEmpty: "There is no data to print.",
    exportReady: "Excel file prepared.",
    printReady: "Print page prepared.",
    printBlocked: "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Marilyn Clinics System Dashboard Report",
    generatedAt: "Generated at",
    recordsCount: "Records",
    refreshed: "System dashboard refreshed.",
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

function toEnglishDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - "٠".charCodeAt(0)))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - "۰".charCodeAt(0)))
    .replaceAll("٫", ".")
    .replaceAll("٬", ",");
}

function normalizeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return toEnglishDigits(value).trim() || fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = toEnglishDigits(value).replaceAll(",", "");
    const parsed = Number(normalized.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function boolValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeText(value).toLowerCase();
  if (["true", "1", "yes", "active", "enabled", "passed", "ready", "success"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "inactive", "disabled", "failed", "blocked"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function formatInteger(value: unknown) {
  return toEnglishDigits(
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Math.round(toNumber(value)),
    ),
  );
}

function formatMoney(value: unknown) {
  return toEnglishDigits(
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toNumber(value)),
  );
}

function formatPercent(value: unknown) {
  const nextValue = Math.max(0, Math.min(100, toNumber(value)));
  return `${formatInteger(nextValue)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const normalized = toEnglishDigits(value);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized.slice(0, 10) || "—";
  return parsed.toISOString().slice(0, 10);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const normalized = toEnglishDigits(value);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized.replace("T", " ").slice(0, 16) || "—";
  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function reportDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function escapeHtml(value: unknown) {
  return toEnglishDigits(value)
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
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return envBase.endsWith("/api") ? envBase.slice(0, -4) : envBase;
}

function makeApiUrl(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  return `${getApiBaseUrl()}${path}${query ? `?${query}` : ""}`;
}

async function fetchJson<T>(
  path: string,
  params?: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(makeApiUrl(path, params), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();
  let payload: unknown = {};

  if (rawText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(
      normalizeText(record.message) ||
        normalizeText(record.detail) ||
        normalizeText(record.error) ||
        `HTTP ${response.status}`,
    );
  }

  return payload as T;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const visited = new Set<unknown>();
  const walk = (value: unknown, depth = 0): unknown[] => {
    if (Array.isArray(value)) return value;
    if (!isRecord(value) || depth > 6 || visited.has(value)) return [];
    visited.add(value);

    const candidates = [
      value.results,
      value.items,
      value.records,
      value.rows,
      value.checks,
      value.data,
      value.result,
      value.payload,
      value.response,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

    for (const candidate of candidates) {
      const nested = walk(candidate, depth + 1);
      if (nested.length) return nested;
    }

    return [];
  };

  return walk(payload);
}

function extractSummary(payload: unknown): ApiRecord {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  const meta = asRecord(record.meta);
  return {
    ...asRecord(record.summary),
    ...asRecord(data.summary),
    ...asRecord(meta.summary),
    ...record,
    ...data,
  };
}

function extractCount(payload: unknown) {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  const meta = asRecord(record.meta);
  const candidates = [
    record.count,
    record.total,
    record.total_count,
    data.count,
    data.total,
    data.total_count,
    meta.count,
    meta.total,
    meta.total_count,
  ];

  for (const candidate of candidates) {
    const parsed = toNumber(candidate, Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }

  return extractArray(payload).length;
}

function normalizeNestedName(
  value: unknown,
  keys: string[] = ["name", "title", "full_name"],
) {
  if (typeof value === "string") return normalizeText(value);
  const record = asRecord(value);
  for (const key of keys) {
    const next = normalizeText(record[key]);
    if (next) return next;
  }
  return "";
}

function normalizeStatus(value: unknown, fallback = "active") {
  if (typeof value === "boolean") return value ? "active" : "inactive";
  const normalized = normalizeText(value, fallback).toLowerCase().replace(/[^a-z_]/g, "");
  if (["true", "enabled"].includes(normalized)) return "active";
  if (["false", "disabled", "blocked"].includes(normalized)) return "inactive";
  if (["ok", "ready", "success"].includes(normalized)) return "passed";
  return normalized || fallback;
}

function normalizeCompany(value: unknown): CompanyRecord {
  const record = asRecord(value);
  const owner = record.owner || record.user || record.created_by || record.account_owner;
  const activity = record.activity_profile || record.activity || record.activity_profile_ref;
  const subscription = record.subscription || record.current_subscription || record.plan;
  const statusSource =
    record.status ?? record.state ?? record.is_active ?? record.active ?? "active";

  return {
    id: normalizeText(record.id || record.uuid || record.pk || record.slug),
    name: normalizeText(record.name || record.company_name || record.title),
    code: normalizeText(
      record.code || record.company_code || record.slug || record.registration_number,
    ),
    status: normalizeStatus(statusSource),
    owner: normalizeNestedName(owner, ["name", "full_name", "email", "username"]),
    activity: normalizeNestedName(activity, ["name", "code", "title"]),
    subscription: normalizeNestedName(subscription, ["plan_name", "name", "title", "status"]),
    created_at: normalizeText(record.created_at || record.created || record.inserted_at) || null,
  };
}

function normalizeSubscription(value: unknown): SubscriptionRecord {
  const record = asRecord(value);
  const company = record.company || record.company_ref || record.tenant;
  const plan = record.plan || record.subscription_plan;

  return {
    id: normalizeText(record.id || record.uuid || record.pk),
    company_name: normalizeText(record.company_name) || normalizeNestedName(company),
    plan_name: normalizeText(record.plan_name) || normalizeNestedName(plan),
    status: normalizeStatus(record.status || record.state || "active"),
    billing_cycle: normalizeText(record.billing_cycle || record.cycle || record.interval),
    amount: toNumber(record.amount || record.total_amount || record.price || record.grand_total),
    starts_at:
      normalizeText(record.starts_at || record.start_date || record.current_period_start) || null,
    ends_at:
      normalizeText(
        record.ends_at || record.end_date || record.current_period_end || record.expires_at,
      ) || null,
    created_at: normalizeText(record.created_at || record.created || record.inserted_at) || null,
  };
}

function normalizeReadinessCheck(value: unknown, index: number): ReadinessCheckRecord {
  const record = asRecord(value);
  const passed = boolValue(record.passed ?? record.is_ready ?? record.ok, false);
  const explicitStatus = normalizeText(record.status || record.state || record.result);
  const status = explicitStatus ? normalizeStatus(explicitStatus, "pending") : passed ? "passed" : "pending";

  return {
    id: normalizeText(record.id || record.uuid || record.pk || record.code, `check-${index + 1}`),
    name: normalizeText(
      record.name || record.title || record.label || record.check || record.code,
      `Check ${index + 1}`,
    ),
    category: normalizeText(record.category || record.group || record.section || record.module),
    status,
    message: normalizeText(
      record.message || record.description || record.details || record.reason || record.notes,
    ),
    updated_at:
      normalizeText(
        record.updated_at || record.checked_at || record.created_at || record.timestamp,
      ) || null,
  };
}

function normalizeReadinessScore(payload: unknown) {
  const summary = extractSummary(payload);
  const checks = extractArray(payload);
  const rawScore =
    summary.readiness_score ??
    summary.score ??
    summary.percentage ??
    summary.percent ??
    summary.completion_percentage;

  if (rawScore !== undefined && rawScore !== null) {
    return Math.max(0, Math.min(100, toNumber(rawScore)));
  }

  if (checks.length) {
    const passed = checks.filter((item) => {
      const record = asRecord(item);
      const status = normalizeStatus(record.status || record.state || record.result, "");
      return boolValue(record.passed ?? record.is_ready ?? record.ok, false) || status === "passed";
    }).length;
    return Math.round((passed / checks.length) * 100);
  }

  return 0;
}

function getStatusLabel(value: string, locale: Locale) {
  const key = normalizeStatus(value, "unknown") as keyof (typeof translations)["ar"];
  const fallback = normalizeText(value, translations[locale].unknown);
  const translated = translations[locale][key];
  return typeof translated === "string" ? translated : fallback;
}

function getBadgeClass(value: string) {
  const normalized = normalizeStatus(value, "");

  if (["active", "paid", "confirmed", "passed", "ready", "success"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["pending", "trial", "processing", "draft"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (["failed", "cancelled", "expired", "suspended", "blocked", "refunded", "inactive"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-border bg-muted/30 text-muted-foreground";
}

function rowDateValue(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isWithinDate(dateValue: string | null, from: string, to: string) {
  const normalized = formatDate(dateValue);
  if (normalized === "—") return !from && !to;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
}

function sortRows<T>(
  rows: T[],
  sort: SortKey,
  getDate: (row: T) => string | null,
  getAmount: (row: T) => number,
  getName: (row: T) => string,
) {
  return [...rows].sort((a, b) => {
    if (sort === "oldest") return rowDateValue(getDate(a)) - rowDateValue(getDate(b));
    if (sort === "amount_high") return getAmount(b) - getAmount(a);
    if (sort === "amount_low") return getAmount(a) - getAmount(b);
    if (sort === "name") return getName(a).localeCompare(getName(b));
    return rowDateValue(getDate(b)) - rowDateValue(getDate(a));
  });
}

function parseIsoDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = toEnglishDigits(value)
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!year || !month || !day) return undefined;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateToIso(value?: Date) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DatePickerField({
  label,
  value,
  onChange,
  locale,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start bg-background px-3 text-start font-normal shadow-none sm:w-[150px]"
        >
          <CalendarDays className="me-2 h-4 w-4 shrink-0 text-[#a57b3d]" />
          <span dir="ltr" lang="en" className="truncate tabular-nums">
            {value || label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={locale === "ar" ? "end" : "start"}
      >
        <Calendar
          mode="single"
          selected={parseIsoDate(value)}
          onSelect={(date: Date | undefined) => {
            onChange(dateToIso(date));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function MoneyValue({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold">
      <span dir="ltr" lang="en" className="tabular-nums">
        {formatMoney(value)}
      </span>
      <Image
        src="/currency/sar.svg"
        alt={label}
        width={14}
        height={14}
        className="h-3.5 w-3.5 shrink-0"
      />
    </span>
  );
}

function StatusBadge({ value, label }: { value: string; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs",
        getBadgeClass(value),
      )}
    >
      {label}
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  money,
  percent,
  currencyLabel,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  money?: boolean;
  percent?: boolean;
  currencyLabel: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-lg border bg-card shadow-none transition hover:-translate-y-0.5 hover:border-[#b58c4d]/35 hover:shadow-sm">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="min-w-0">
            <CardDescription className="truncate text-sm">{title}</CardDescription>
            <CardTitle className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {money ? (
                <MoneyValue value={value} label={currencyLabel} />
              ) : percent ? (
                formatPercent(value)
              ) : (
                formatInteger(value)
              )}
            </CardTitle>
          </div>
          <span className="rounded-full border border-[#cbbda9]/55 bg-white/70 p-2.5 text-[#a57b3d] shadow-sm transition group-hover:border-[#b58c4d]/40 group-hover:bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] group-hover:text-white dark:bg-white/[0.06]">
            <Icon className="h-5 w-5" />
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Link>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="rounded-lg border shadow-none">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="rounded-lg border shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyTableState({
  title,
  description,
  showReset,
  onReset,
  resetLabel,
}: {
  title: string;
  description: string;
  showReset?: boolean;
  onReset?: () => void;
  resetLabel: string;
}) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-muted p-4 text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {showReset && onReset ? (
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 text-[#a57b3d]" />
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}

function FiltersBar({
  search,
  onSearchChange,
  searchPlaceholder,
  status,
  onStatusChange,
  statusOptions,
  sort,
  onSortChange,
  showAmountSort,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onReset,
  locale,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  statusOptions: readonly string[];
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  showAmountSort?: boolean;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onReset: () => void;
  locale: Locale;
}) {
  const t = translations[locale];

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-2 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a57b3d]" />
        <Input
          value={search}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(event.target.value)
          }
          placeholder={searchPlaceholder}
          className="h-9 bg-background ps-9 shadow-none"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[145px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item === "all" ? t.all : getStatusLabel(item, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DatePickerField
        label={t.from}
        value={dateFrom}
        onChange={onDateFromChange}
        locale={locale}
      />
      <DatePickerField
        label={t.to}
        value={dateTo}
        onChange={onDateToChange}
        locale={locale}
      />

      <Select
        value={sort}
        onValueChange={(value: string) => onSortChange(value as SortKey)}
      >
        <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[155px]">
          <ArrowUpDown className="me-2 h-4 w-4 text-[#a57b3d]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t.newest}</SelectItem>
          <SelectItem value="oldest">{t.oldest}</SelectItem>
          {showAmountSort ? (
            <>
              <SelectItem value="amount_high">{t.amountHigh}</SelectItem>
              <SelectItem value="amount_low">{t.amountLow}</SelectItem>
            </>
          ) : null}
          <SelectItem value="name">{t.nameSort}</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="h-9 bg-background"
      >
        <RotateCcw className="h-4 w-4 text-[#a57b3d]" />
        {t.reset}
      </Button>
    </div>
  );
}

function DataTable<T extends { id: string }>({
  rows,
  allRowsCount,
  columns,
  rowKey,
  rowHref,
  emptyTitle,
  emptyDescription,
  noResultsTitle,
  noResultsDescription,
  hasFilters,
  onReset,
  locale,
}: {
  rows: T[];
  allRowsCount: number;
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  noResultsTitle: string;
  noResultsDescription: string;
  hasFilters: boolean;
  onReset: () => void;
  locale: Locale;
}) {
  const router = useRouter();
  const t = translations[locale];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="overflow-x-auto">
          <Table className="min-w-[1120px] table-fixed">
            <TableHeader>
              <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-11 whitespace-nowrap px-4 text-start text-xs font-semibold text-muted-foreground",
                      column.className,
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => {
                  const href = rowHref?.(row) || "";
                  return (
                    <TableRow
                      key={rowKey(row)}
                      className={cn(
                        "h-[62px] transition-colors",
                        href ? "cursor-pointer hover:bg-muted/35" : "",
                      )}
                      onClick={(event: React.MouseEvent<HTMLTableRowElement>) => {
                        if (!href) return;
                        const target = event.target as HTMLElement;
                        if (
                          target.closest(
                            "button, a, input, select, textarea, [role='menuitem']",
                          )
                        ) {
                          return;
                        }
                        router.push(href);
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            "h-[62px] overflow-hidden px-4 text-start align-middle",
                            column.className,
                          )}
                        >
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-72">
                    <EmptyTableState
                      title={hasFilters ? noResultsTitle : emptyTitle}
                      description={hasFilters ? noResultsDescription : emptyDescription}
                      showReset={hasFilters}
                      onReset={onReset}
                      resetLabel={t.reset}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {t.showing}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatInteger(rows.length)}
        </span>{" "}
        {t.of}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatInteger(allRowsCount)}
        </span>{" "}
        {t.rows}
      </div>
    </div>
  );
}

function buildTableHtml<T>(columns: ExportColumn<T>[], rows: T[], locale: Locale) {
  const emptyLabel = locale === "ar" ? "لا توجد بيانات" : "No data";
  const head = columns
    .map(
      (column) =>
        `<th class="excel-text" style="mso-number-format:'\\@';">${escapeHtml(
          column.label,
        )}</th>`,
    )
    .join("");

  const body = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${columns
              .map(
                (column) =>
                  `<td class="excel-text" style="mso-number-format:'\\@';">${escapeHtml(
                    column.value(row),
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")
    : `<tr><td class="empty-row excel-text" style="mso-number-format:'\\@';" colspan="${Math.max(
        columns.length,
        1,
      )}">${escapeHtml(emptyLabel)}</td></tr>`;

  return `
    <table class="data-table">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function downloadExcelFile({
  filename,
  title,
  subtitle,
  sections,
  locale,
}: {
  filename: string;
  title: string;
  subtitle: string;
  sections: ExportSection[];
  locale: Locale;
}) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  const alignment = locale === "ar" ? "right" : "left";
  const sheetName =
    title.replace(/[\\/:?*\[\]]/g, " ").trim().slice(0, 31) ||
    (locale === "ar" ? "التقرير" : "Report");
  const rightToLeftWorksheet = locale === "ar" ? "<x:DisplayRightToLeft />" : "";

  const sectionsHtml = sections
    .map(
      (section) => `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.subtitle)}</p>
          ${section.html}
        </section>
      `,
    )
    .join("");

  const documentHtml = `
    <!doctype html>
    <html dir="${direction}" lang="${locale}" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${escapeHtml(sheetName)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines />
                  ${rightToLeftWorksheet}
                  <x:Selected />
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 10px; color: #111827; direction: ${direction}; font-family: Tahoma, Arial, sans-serif; font-size: 11px; }
          h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; text-align: ${alignment}; }
          h2 { margin: 18px 0 5px; font-size: 16px; font-weight: 700; text-align: ${alignment}; }
          p { margin: 0 0 10px; color: #4b5563; text-align: ${alignment}; }
          .meta { margin-bottom: 16px; }
          .section { margin-top: 18px; }
          .data-table { width: 100%; margin-bottom: 22px; border-collapse: collapse; table-layout: auto; }
          .data-table th, .data-table td { border: 1px solid #000000; padding: 7px 6px; text-align: ${alignment}; vertical-align: middle; white-space: normal; mso-number-format: "\\@"; }
          .data-table th { background: #e5e7eb; font-weight: 700; }
          .excel-text { mso-number-format: "\\@"; }
          .empty-row { padding: 14px !important; color: #6b7280; text-align: center !important; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <p class="meta">${escapeHtml(
          locale === "ar" ? "تم الإنشاء في" : "Generated at",
        )}: ${escapeHtml(reportDateTime())}</p>
        ${sectionsHtml}
      </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF", documentHtml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openPrintWindow({
  title,
  subtitle,
  sections,
  locale,
}: {
  title: string;
  subtitle: string;
  sections: ExportSection[];
  locale: Locale;
}) {
  const win = window.open("", "_blank", "width=1400,height=900");
  if (!win) return false;
  win.opener = null;

  const direction = locale === "ar" ? "rtl" : "ltr";
  const alignment = locale === "ar" ? "right" : "left";
  const sectionsHtml = sections
    .map(
      (section) => `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.subtitle)}</p>
          ${section.html}
        </section>
      `,
    )
    .join("");

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html dir="${direction}" lang="${locale}">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #000; direction: ${direction}; font-family: Tahoma, Arial, sans-serif; font-size: 11px; }
          h1 { margin: 0 0 5px; font-size: 22px; font-weight: 700; text-align: ${alignment}; }
          h2 { margin: 16px 0 5px; font-size: 15px; font-weight: 700; text-align: ${alignment}; break-after: avoid; page-break-after: avoid; }
          p { margin: 0 0 10px; color: #4b5563; font-size: 10px; text-align: ${alignment}; }
          .meta { margin-bottom: 12px; }
          .section { margin-top: 16px; }
          .data-table { width: 100%; margin-bottom: 16px; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
          .data-table thead { display: table-header-group; }
          .data-table tr { break-inside: avoid; page-break-inside: avoid; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 5px; text-align: ${alignment}; vertical-align: middle; overflow-wrap: anywhere; }
          .data-table th { background: #e5e7eb !important; font-weight: 700; }
          .empty-row { padding: 14px !important; color: #6b7280; text-align: center !important; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <p class="meta">${escapeHtml(
          locale === "ar" ? "تم الإنشاء في" : "Generated at",
        )}: ${escapeHtml(reportDateTime())}</p>
        ${sectionsHtml}
      </body>
    </html>
  `);
  win.document.close();
  win.onafterprint = () => win.close();
  win.setTimeout(() => {
    win.focus();
    win.print();
  }, 350);
  return true;
}

function TableSection({
  title,
  description,
  onExport,
  onPrint,
  exportLabel,
  printLabel,
  children,
}: {
  title: string;
  description: string;
  onExport: () => void;
  onPrint: () => void;
  exportLabel: string;
  printLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full rounded-lg border bg-card shadow-none">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1.5">{description}</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          <Button
            variant="outline"
            onClick={onExport}
            className="h-9 bg-background px-3 shadow-none [&_svg]:text-[#a57b3d]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportLabel}
          </Button>
          <Button variant="brand" onClick={onPrint} className="h-9 px-3">
            <Printer className="h-4 w-4" />
            {printLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function SystemDashboardPage() {
  const router = useRouter();
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [stats, setStats] = React.useState<DashboardStats>({
    companies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    subscriptions: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    apiContracts: 0,
    readinessScore: 0,
  });
  const [companies, setCompanies] = React.useState<CompanyRecord[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionRecord[]>([]);
  const [readinessChecks, setReadinessChecks] = React.useState<ReadinessCheckRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const [companySearch, setCompanySearch] = React.useState("");
  const [companyStatus, setCompanyStatus] = React.useState<StatusFilter>("all");
  const [companySort, setCompanySort] = React.useState<SortKey>("newest");
  const [companyDateFrom, setCompanyDateFrom] = React.useState("");
  const [companyDateTo, setCompanyDateTo] = React.useState("");

  const [subscriptionSearch, setSubscriptionSearch] = React.useState("");
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<StatusFilter>("all");
  const [subscriptionSort, setSubscriptionSort] = React.useState<SortKey>("newest");
  const [subscriptionDateFrom, setSubscriptionDateFrom] = React.useState("");
  const [subscriptionDateTo, setSubscriptionDateTo] = React.useState("");

  const [readinessSearch, setReadinessSearch] = React.useState("");
  const [readinessStatus, setReadinessStatus] = React.useState<StatusFilter>("all");
  const [readinessSort, setReadinessSort] = React.useState<SortKey>("newest");
  const [readinessDateFrom, setReadinessDateFrom] = React.useState("");
  const [readinessDateTo, setReadinessDateTo] = React.useState("");

  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

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

  const loadDashboard = React.useCallback(
    async ({
      silent = false,
      signal,
    }: {
      silent?: boolean;
      signal?: AbortSignal;
    } = {}) => {
      try {
        if (!silent) setLoading(true);
        setRefreshing(true);
        setError("");
        setWarnings([]);

        const rowsParams = new URLSearchParams({
          page: "1",
          page_size: "200",
          ordering: "-created_at",
        });

        const results = await Promise.allSettled([
          fetchJson<ApiResponse>(API_ENDPOINTS.companies, rowsParams, signal),
          fetchJson<ApiResponse>(API_ENDPOINTS.subscriptions, rowsParams, signal),
          fetchJson<ApiResponse>(API_ENDPOINTS.releaseReadiness, undefined, signal),
        ]);

        const failedMessages = results
          .filter((result): result is PromiseRejectedResult => result.status === "rejected")
          .map((result) =>
            normalizeText(result.reason instanceof Error ? result.reason.message : result.reason),
          )
          .filter(Boolean);

        if (failedMessages.length === results.length) {
          throw new Error(failedMessages[0] || t.errorDesc);
        }

        const valueAt = (index: number): ApiResponse =>
          results[index]?.status === "fulfilled"
            ? (results[index] as PromiseFulfilledResult<ApiResponse>).value
            : {};

        const companiesPayload = valueAt(0);
        const subscriptionsPayload = valueAt(1);
        const readinessPayload = valueAt(2);

        const companyRows = extractArray(companiesPayload).map(normalizeCompany);
        const subscriptionRows = extractArray(subscriptionsPayload).map(normalizeSubscription);
        const readinessRows = extractArray(readinessPayload).map(normalizeReadinessCheck);

        const companiesSummary = extractSummary(companiesPayload);
        const subscriptionsSummary = extractSummary(subscriptionsPayload);
        const readinessSummary = extractSummary(readinessPayload);

        const activeCompanies = toNumber(
          companiesSummary.active_count ??
            companiesSummary.active ??
            companiesSummary.active_companies,
          companyRows.filter((item) => item.status === "active").length,
        );
        const inactiveCompanies = toNumber(
          companiesSummary.inactive_count ??
            companiesSummary.inactive ??
            companiesSummary.inactive_companies,
          companyRows.filter((item) => item.status !== "active").length,
        );
        const activeSubscriptions = toNumber(
          subscriptionsSummary.active_count ??
            subscriptionsSummary.active ??
            subscriptionsSummary.active_subscriptions,
          subscriptionRows.filter((item) => item.status === "active").length,
        );
        const trialSubscriptions = toNumber(
          subscriptionsSummary.trial_count ??
            subscriptionsSummary.trial ??
            subscriptionsSummary.trial_subscriptions,
          subscriptionRows.filter((item) => item.status === "trial").length,
        );

        setCompanies(companyRows);
        setSubscriptions(subscriptionRows);
        setReadinessChecks(readinessRows);
        setStats({
          companies: extractCount(companiesPayload),
          activeCompanies,
          inactiveCompanies,
          subscriptions: extractCount(subscriptionsPayload),
          activeSubscriptions,
          trialSubscriptions,
          apiContracts: toNumber(
            readinessSummary.api_contracts_count ??
              readinessSummary.api_contracts ??
              readinessSummary.contracts_count ??
              readinessSummary.total_contracts,
            0,
          ),
          readinessScore: normalizeReadinessScore(readinessPayload),
        });
        setWarnings(failedMessages);

        if (silent && failedMessages.length) toast.warning(t.partialWarningTitle);
        else if (silent) toast.success(t.refreshed);
        else if (failedMessages.length) toast.warning(t.partialWarningTitle);
      } catch (caughtError) {
        if (signal?.aborted) return;
        const message = caughtError instanceof Error ? caughtError.message : t.errorDesc;
        setError(message);
        if (silent) toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [t.errorDesc, t.partialWarningTitle, t.refreshed],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboard]);

  const resetCompanyFilters = React.useCallback(() => {
    setCompanySearch("");
    setCompanyStatus("all");
    setCompanySort("newest");
    setCompanyDateFrom("");
    setCompanyDateTo("");
  }, []);

  const resetSubscriptionFilters = React.useCallback(() => {
    setSubscriptionSearch("");
    setSubscriptionStatus("all");
    setSubscriptionSort("newest");
    setSubscriptionDateFrom("");
    setSubscriptionDateTo("");
  }, []);

  const resetReadinessFilters = React.useCallback(() => {
    setReadinessSearch("");
    setReadinessStatus("all");
    setReadinessSort("newest");
    setReadinessDateFrom("");
    setReadinessDateTo("");
  }, []);

  const filteredCompanies = React.useMemo(() => {
    const needle = companySearch.trim().toLowerCase();
    const rows = companies.filter((company) => {
      const haystack = [
        company.name,
        company.code,
        company.owner,
        company.activity,
        company.subscription,
        company.status,
      ]
        .join(" ")
        .toLowerCase();

      if (needle && !haystack.includes(needle)) return false;
      if (companyStatus !== "all" && company.status !== companyStatus) return false;
      return isWithinDate(company.created_at, companyDateFrom, companyDateTo);
    });

    return sortRows(
      rows,
      companySort,
      (row) => row.created_at,
      () => 0,
      (row) => row.name,
    );
  }, [companies, companyDateFrom, companyDateTo, companySearch, companySort, companyStatus]);

  const filteredSubscriptions = React.useMemo(() => {
    const needle = subscriptionSearch.trim().toLowerCase();
    const rows = subscriptions.filter((subscription) => {
      const haystack = [
        subscription.company_name,
        subscription.plan_name,
        subscription.billing_cycle,
        subscription.status,
        subscription.amount,
      ]
        .join(" ")
        .toLowerCase();

      if (needle && !haystack.includes(needle)) return false;
      if (subscriptionStatus !== "all" && subscription.status !== subscriptionStatus) {
        return false;
      }
      return isWithinDate(
        subscription.created_at || subscription.starts_at,
        subscriptionDateFrom,
        subscriptionDateTo,
      );
    });

    return sortRows(
      rows,
      subscriptionSort,
      (row) => row.created_at || row.starts_at,
      (row) => row.amount,
      (row) => row.company_name,
    );
  }, [
    subscriptionDateFrom,
    subscriptionDateTo,
    subscriptionSearch,
    subscriptionSort,
    subscriptionStatus,
    subscriptions,
  ]);

  const filteredReadinessChecks = React.useMemo(() => {
    const needle = readinessSearch.trim().toLowerCase();
    const rows = readinessChecks.filter((check) => {
      const haystack = [check.name, check.category, check.status, check.message]
        .join(" ")
        .toLowerCase();

      if (needle && !haystack.includes(needle)) return false;
      if (readinessStatus !== "all" && check.status !== readinessStatus) return false;
      return isWithinDate(check.updated_at, readinessDateFrom, readinessDateTo);
    });

    return sortRows(
      rows,
      readinessSort,
      (row) => row.updated_at,
      () => 0,
      (row) => row.name,
    );
  }, [
    readinessChecks,
    readinessDateFrom,
    readinessDateTo,
    readinessSearch,
    readinessSort,
    readinessStatus,
  ]);

  const hasCompanyFilters = Boolean(
    companySearch ||
      companyStatus !== "all" ||
      companyDateFrom ||
      companyDateTo ||
      companySort !== "newest",
  );
  const hasSubscriptionFilters = Boolean(
    subscriptionSearch ||
      subscriptionStatus !== "all" ||
      subscriptionDateFrom ||
      subscriptionDateTo ||
      subscriptionSort !== "newest",
  );
  const hasReadinessFilters = Boolean(
    readinessSearch ||
      readinessStatus !== "all" ||
      readinessDateFrom ||
      readinessDateTo ||
      readinessSort !== "newest",
  );

  const companyExportColumns = React.useMemo<ExportColumn<CompanyRecord>[]>(
    () => [
      { label: t.company, value: (row) => row.name || t.unknown },
      { label: t.code, value: (row) => row.code || "—" },
      { label: t.owner, value: (row) => row.owner || "—" },
      { label: t.activity, value: (row) => row.activity || "—" },
      { label: t.subscription, value: (row) => row.subscription || "—" },
      { label: t.status, value: (row) => getStatusLabel(row.status, locale) },
      { label: t.createdAt, value: (row) => formatDateTime(row.created_at) },
    ],
    [locale, t.activity, t.code, t.company, t.createdAt, t.owner, t.status, t.subscription, t.unknown],
  );

  const subscriptionExportColumns = React.useMemo<ExportColumn<SubscriptionRecord>[]>(
    () => [
      { label: t.company, value: (row) => row.company_name || t.unknown },
      { label: t.plan, value: (row) => row.plan_name || "—" },
      { label: t.status, value: (row) => getStatusLabel(row.status, locale) },
      { label: t.billingCycle, value: (row) => row.billing_cycle || "—" },
      { label: t.amount, value: (row) => formatMoney(row.amount) },
      { label: t.startsAt, value: (row) => formatDate(row.starts_at) },
      { label: t.endsAt, value: (row) => formatDate(row.ends_at) },
    ],
    [locale, t.amount, t.billingCycle, t.company, t.endsAt, t.plan, t.startsAt, t.status, t.unknown],
  );

  const readinessExportColumns = React.useMemo<ExportColumn<ReadinessCheckRecord>[]>(
    () => [
      { label: t.check, value: (row) => row.name || t.unknown },
      { label: t.category, value: (row) => row.category || "—" },
      { label: t.status, value: (row) => getStatusLabel(row.status, locale) },
      { label: t.message, value: (row) => row.message || "—" },
      { label: t.updatedAt, value: (row) => formatDateTime(row.updated_at) },
    ],
    [locale, t.category, t.check, t.message, t.status, t.unknown, t.updatedAt],
  );

  const companyColumns = React.useMemo<DataColumn<CompanyRecord>[]>(
    () => [
      {
        key: "company",
        label: t.company,
        className: "w-[250px]",
        render: (company) => (
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {company.name || t.unknown}
            </span>
            <span className="block truncate text-xs text-muted-foreground tabular-nums">
              #{company.id || company.code || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "code",
        label: t.code,
        className: "w-[130px]",
        render: (company) => (
          <span className="truncate text-sm tabular-nums text-muted-foreground">
            {company.code || "—"}
          </span>
        ),
      },
      {
        key: "owner",
        label: t.owner,
        className: "w-[190px]",
        render: (company) => (
          <span className="truncate text-sm text-muted-foreground">
            {company.owner || "—"}
          </span>
        ),
      },
      {
        key: "activity",
        label: t.activity,
        className: "w-[180px]",
        render: (company) => (
          <span className="truncate text-sm text-muted-foreground">
            {company.activity || "—"}
          </span>
        ),
      },
      {
        key: "subscription",
        label: t.subscription,
        className: "w-[180px]",
        render: (company) => (
          <span className="truncate text-sm text-muted-foreground">
            {company.subscription || "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: t.status,
        className: "w-[135px]",
        render: (company) => (
          <StatusBadge
            value={company.status}
            label={getStatusLabel(company.status, locale)}
          />
        ),
      },
      {
        key: "created",
        label: t.createdAt,
        className: "w-[155px]",
        render: (company) => (
          <span dir="ltr" lang="en" className="text-sm tabular-nums text-muted-foreground">
            {formatDateTime(company.created_at)}
          </span>
        ),
      },
      {
        key: "actions",
        label: t.actions,
        className: "w-[90px]",
        render: (company) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#a57b3d] hover:bg-[#f7f1e7] hover:text-[#8f6a37]"
                aria-label={t.actions}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuItem
                onSelect={() => router.push(`/system/companies/${company.id}`)}
              >
                <ExternalLink className="h-4 w-4 text-[#a57b3d]" />
                {t.openDetails}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      locale,
      router,
      t.actions,
      t.activity,
      t.code,
      t.company,
      t.createdAt,
      t.openDetails,
      t.owner,
      t.status,
      t.subscription,
      t.unknown,
    ],
  );

  const subscriptionColumns = React.useMemo<DataColumn<SubscriptionRecord>[]>(
    () => [
      {
        key: "company",
        label: t.company,
        className: "w-[240px]",
        render: (subscription) => (
          <span className="block truncate text-sm font-semibold text-foreground">
            {subscription.company_name || t.unknown}
          </span>
        ),
      },
      {
        key: "plan",
        label: t.plan,
        className: "w-[180px]",
        render: (subscription) => (
          <span className="truncate text-sm text-muted-foreground">
            {subscription.plan_name || "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: t.status,
        className: "w-[135px]",
        render: (subscription) => (
          <StatusBadge
            value={subscription.status}
            label={getStatusLabel(subscription.status, locale)}
          />
        ),
      },
      {
        key: "cycle",
        label: t.billingCycle,
        className: "w-[150px]",
        render: (subscription) => (
          <span className="truncate text-sm text-muted-foreground">
            {subscription.billing_cycle || "—"}
          </span>
        ),
      },
      {
        key: "amount",
        label: t.amount,
        className: "w-[160px]",
        render: (subscription) => (
          <MoneyValue value={subscription.amount} label={t.sar} />
        ),
      },
      {
        key: "starts",
        label: t.startsAt,
        className: "w-[135px]",
        render: (subscription) => (
          <span dir="ltr" lang="en" className="text-sm tabular-nums text-muted-foreground">
            {formatDate(subscription.starts_at)}
          </span>
        ),
      },
      {
        key: "ends",
        label: t.endsAt,
        className: "w-[135px]",
        render: (subscription) => (
          <span dir="ltr" lang="en" className="text-sm tabular-nums text-muted-foreground">
            {formatDate(subscription.ends_at)}
          </span>
        ),
      },
      {
        key: "actions",
        label: t.actions,
        className: "w-[90px]",
        render: (subscription) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#a57b3d] hover:bg-[#f7f1e7] hover:text-[#8f6a37]"
                aria-label={t.actions}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuItem
                onSelect={() => router.push(`/system/subscriptions/${subscription.id}`)}
              >
                <ExternalLink className="h-4 w-4 text-[#a57b3d]" />
                {t.openDetails}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      locale,
      router,
      t.actions,
      t.amount,
      t.billingCycle,
      t.company,
      t.endsAt,
      t.openDetails,
      t.plan,
      t.sar,
      t.startsAt,
      t.status,
      t.unknown,
    ],
  );

  const readinessColumns = React.useMemo<DataColumn<ReadinessCheckRecord>[]>(
    () => [
      {
        key: "check",
        label: t.check,
        className: "w-[270px]",
        render: (check) => (
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {check.name || t.unknown}
            </span>
            <span className="block truncate text-xs text-muted-foreground tabular-nums">
              {check.id}
            </span>
          </div>
        ),
      },
      {
        key: "category",
        label: t.category,
        className: "w-[180px]",
        render: (check) => (
          <span className="truncate text-sm text-muted-foreground">
            {check.category || "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: t.status,
        className: "w-[135px]",
        render: (check) => (
          <StatusBadge value={check.status} label={getStatusLabel(check.status, locale)} />
        ),
      },
      {
        key: "message",
        label: t.message,
        className: "w-[410px]",
        render: (check) => (
          <span className="block truncate text-sm text-muted-foreground">
            {check.message || "—"}
          </span>
        ),
      },
      {
        key: "updated",
        label: t.updatedAt,
        className: "w-[160px]",
        render: (check) => (
          <span dir="ltr" lang="en" className="text-sm tabular-nums text-muted-foreground">
            {formatDateTime(check.updated_at)}
          </span>
        ),
      },
      {
        key: "actions",
        label: t.actions,
        className: "w-[90px]",
        render: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#a57b3d] hover:bg-[#f7f1e7] hover:text-[#8f6a37]"
                aria-label={t.actions}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuItem onSelect={() => router.push("/system/release-readiness")}>
                <ExternalLink className="h-4 w-4 text-[#a57b3d]" />
                {t.openDetails}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      locale,
      router,
      t.actions,
      t.category,
      t.check,
      t.message,
      t.openDetails,
      t.status,
      t.unknown,
      t.updatedAt,
    ],
  );

  const companySection = React.useCallback(
    (): ExportSection => ({
      title: t.latestCompanies,
      subtitle: `${t.latestCompaniesDesc} — ${t.recordsCount}: ${formatInteger(
        filteredCompanies.length,
      )}`,
      html: buildTableHtml(companyExportColumns, filteredCompanies, locale),
      rowCount: filteredCompanies.length,
    }),
    [companyExportColumns, filteredCompanies, locale, t.latestCompanies, t.latestCompaniesDesc, t.recordsCount],
  );

  const subscriptionSection = React.useCallback(
    (): ExportSection => ({
      title: t.latestSubscriptions,
      subtitle: `${t.latestSubscriptionsDesc} — ${t.recordsCount}: ${formatInteger(
        filteredSubscriptions.length,
      )}`,
      html: buildTableHtml(subscriptionExportColumns, filteredSubscriptions, locale),
      rowCount: filteredSubscriptions.length,
    }),
    [
      filteredSubscriptions,
      locale,
      subscriptionExportColumns,
      t.latestSubscriptions,
      t.latestSubscriptionsDesc,
      t.recordsCount,
    ],
  );

  const readinessSection = React.useCallback(
    (): ExportSection => ({
      title: t.readinessChecks,
      subtitle: `${t.readinessChecksDesc} — ${t.recordsCount}: ${formatInteger(
        filteredReadinessChecks.length,
      )}`,
      html: buildTableHtml(readinessExportColumns, filteredReadinessChecks, locale),
      rowCount: filteredReadinessChecks.length,
    }),
    [
      filteredReadinessChecks,
      locale,
      readinessExportColumns,
      t.readinessChecks,
      t.readinessChecksDesc,
      t.recordsCount,
    ],
  );

  const exportSections = React.useCallback(
    (sections: ExportSection[], filename: string, title: string, subtitle: string) => {
      const available = sections.filter((section) => section.rowCount > 0);
      if (!available.length) {
        toast.error(t.exportEmpty);
        return;
      }
      downloadExcelFile({ filename, title, subtitle, sections: available, locale });
      toast.success(t.exportReady);
    },
    [locale, t.exportEmpty, t.exportReady],
  );

  const printSections = React.useCallback(
    (sections: ExportSection[], title: string, subtitle: string) => {
      const available = sections.filter((section) => section.rowCount > 0);
      if (!available.length) {
        toast.error(t.printEmpty);
        return;
      }
      const opened = openPrintWindow({ title, subtitle, sections: available, locale });
      if (!opened) {
        toast.error(t.printBlocked);
        return;
      }
      toast.success(t.printReady);
    },
    [locale, t.printBlocked, t.printEmpty, t.printReady],
  );

  const exportFullReport = React.useCallback(() => {
    exportSections(
      [companySection(), subscriptionSection(), readinessSection()],
      "marilyn-system-dashboard",
      t.reportTitle,
      t.subtitle,
    );
  }, [companySection, exportSections, readinessSection, subscriptionSection, t.reportTitle, t.subtitle]);

  const printFullReport = React.useCallback(() => {
    printSections(
      [companySection(), subscriptionSection(), readinessSection()],
      t.reportTitle,
      t.subtitle,
    );
  }, [companySection, printSections, readinessSection, subscriptionSection, t.reportTitle, t.subtitle]);

  if (loading) {
    return (
      <main
        dir={dir}
        className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
      >
        <DashboardSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main
        dir={dir}
        className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
      >
        <Card className="mx-auto max-w-3xl rounded-lg border-destructive/30 bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <CardTitle>{t.errorTitle}</CardTitle>
            <CardDescription>{t.errorDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => void loadDashboard({ silent: true })}>
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      dir={dir}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#cbbda9]/55 bg-white/55 px-3 py-1 text-xs font-medium text-[#8f6a37] shadow-sm dark:bg-white/[0.04]">
              <Sparkles className="h-3.5 w-3.5 text-[#a57b3d]" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-[#a57b3d]" />
              <span className="font-medium text-foreground">{t.systemHealth}</span>
              <span>•</span>
              <span>{t.connectedToLiveApis}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="bg-background [&_svg]:text-[#a57b3d]"
              onClick={() => void loadDashboard({ silent: true })}
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
              className="bg-background [&_svg]:text-[#a57b3d]"
              onClick={exportFullReport}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.export}
            </Button>
            <Button variant="brand" onClick={printFullReport}>
              <Printer className="h-4 w-4" />
              {t.printAll}
            </Button>
          </div>
        </header>

        {warnings.length ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t.partialWarningTitle}</p>
                <p className="mt-1 text-sm opacity-80">{t.partialWarningDesc}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title={t.totalCompanies}
            value={stats.companies}
            description={t.companiesDesc}
            href="/system/companies/list"
            icon={Building2}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.activeCompanies}
            value={stats.activeCompanies}
            description={t.activeCompaniesDesc}
            href="/system/companies/list"
            icon={CheckCircle2}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.inactiveCompanies}
            value={stats.inactiveCompanies}
            description={t.inactiveCompaniesDesc}
            href="/system/companies/list"
            icon={Users}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.totalSubscriptions}
            value={stats.subscriptions}
            description={t.subscriptionsDesc}
            href="/system/subscriptions/list"
            icon={ShieldCheck}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.activeSubscriptions}
            value={stats.activeSubscriptions}
            description={t.activeSubscriptionsDesc}
            href="/system/subscriptions/list"
            icon={Activity}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.trialSubscriptions}
            value={stats.trialSubscriptions}
            description={t.trialSubscriptionsDesc}
            href="/system/subscriptions/list"
            icon={Gauge}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.apiContracts}
            value={stats.apiContracts}
            description={t.apiContractsDesc}
            href="/system/api-contracts"
            icon={ServerCog}
            currencyLabel={t.sar}
          />
          <KpiCard
            title={t.readinessScore}
            value={stats.readinessScore}
            description={t.readinessScoreDesc}
            href="/system/release-readiness"
            icon={ShieldCheck}
            percent
            currencyLabel={t.sar}
          />
        </div>

        <TableSection
          title={t.latestCompanies}
          description={t.latestCompaniesDesc}
          onExport={() =>
            exportSections(
              [companySection()],
              "marilyn-system-companies",
              t.latestCompanies,
              t.latestCompaniesDesc,
            )
          }
          onPrint={() =>
            printSections([companySection()], t.latestCompanies, t.latestCompaniesDesc)
          }
          exportLabel={t.export}
          printLabel={t.print}
        >
          <FiltersBar
            search={companySearch}
            onSearchChange={setCompanySearch}
            searchPlaceholder={t.companySearchPlaceholder}
            status={companyStatus}
            onStatusChange={setCompanyStatus}
            statusOptions={COMPANY_STATUS_OPTIONS}
            sort={companySort}
            onSortChange={setCompanySort}
            dateFrom={companyDateFrom}
            onDateFromChange={setCompanyDateFrom}
            dateTo={companyDateTo}
            onDateToChange={setCompanyDateTo}
            onReset={resetCompanyFilters}
            locale={locale}
          />
          <DataTable
            rows={filteredCompanies}
            allRowsCount={companies.length}
            columns={companyColumns}
            rowKey={(row) => row.id || row.code || row.name}
            rowHref={(row) => (row.id ? `/system/companies/${row.id}` : "")}
            emptyTitle={t.noDataTitle}
            emptyDescription={t.noDataDesc}
            noResultsTitle={t.noResultsTitle}
            noResultsDescription={t.noResultsDesc}
            hasFilters={hasCompanyFilters}
            onReset={resetCompanyFilters}
            locale={locale}
          />
        </TableSection>

        <TableSection
          title={t.latestSubscriptions}
          description={t.latestSubscriptionsDesc}
          onExport={() =>
            exportSections(
              [subscriptionSection()],
              "marilyn-system-subscriptions",
              t.latestSubscriptions,
              t.latestSubscriptionsDesc,
            )
          }
          onPrint={() =>
            printSections(
              [subscriptionSection()],
              t.latestSubscriptions,
              t.latestSubscriptionsDesc,
            )
          }
          exportLabel={t.export}
          printLabel={t.print}
        >
          <FiltersBar
            search={subscriptionSearch}
            onSearchChange={setSubscriptionSearch}
            searchPlaceholder={t.subscriptionSearchPlaceholder}
            status={subscriptionStatus}
            onStatusChange={setSubscriptionStatus}
            statusOptions={SUBSCRIPTION_STATUS_OPTIONS}
            sort={subscriptionSort}
            onSortChange={setSubscriptionSort}
            showAmountSort
            dateFrom={subscriptionDateFrom}
            onDateFromChange={setSubscriptionDateFrom}
            dateTo={subscriptionDateTo}
            onDateToChange={setSubscriptionDateTo}
            onReset={resetSubscriptionFilters}
            locale={locale}
          />
          <DataTable
            rows={filteredSubscriptions}
            allRowsCount={subscriptions.length}
            columns={subscriptionColumns}
            rowKey={(row) => row.id || `${row.company_name}-${row.plan_name}`}
            rowHref={(row) => (row.id ? `/system/subscriptions/${row.id}` : "")}
            emptyTitle={t.noDataTitle}
            emptyDescription={t.noDataDesc}
            noResultsTitle={t.noResultsTitle}
            noResultsDescription={t.noResultsDesc}
            hasFilters={hasSubscriptionFilters}
            onReset={resetSubscriptionFilters}
            locale={locale}
          />
        </TableSection>

        <TableSection
          title={t.readinessChecks}
          description={t.readinessChecksDesc}
          onExport={() =>
            exportSections(
              [readinessSection()],
              "marilyn-system-readiness",
              t.readinessChecks,
              t.readinessChecksDesc,
            )
          }
          onPrint={() =>
            printSections([readinessSection()], t.readinessChecks, t.readinessChecksDesc)
          }
          exportLabel={t.export}
          printLabel={t.print}
        >
          <FiltersBar
            search={readinessSearch}
            onSearchChange={setReadinessSearch}
            searchPlaceholder={t.readinessSearchPlaceholder}
            status={readinessStatus}
            onStatusChange={setReadinessStatus}
            statusOptions={READINESS_STATUS_OPTIONS}
            sort={readinessSort}
            onSortChange={setReadinessSort}
            dateFrom={readinessDateFrom}
            onDateFromChange={setReadinessDateFrom}
            dateTo={readinessDateTo}
            onDateToChange={setReadinessDateTo}
            onReset={resetReadinessFilters}
            locale={locale}
          />
          <DataTable
            rows={filteredReadinessChecks}
            allRowsCount={readinessChecks.length}
            columns={readinessColumns}
            rowKey={(row) => row.id || row.name}
            rowHref={() => "/system/release-readiness"}
            emptyTitle={t.noDataTitle}
            emptyDescription={t.noDataDesc}
            noResultsTitle={t.noResultsTitle}
            noResultsDescription={t.noResultsDesc}
            hasFilters={hasReadinessFilters}
            onReset={resetReadinessFilters}
            locale={locale}
          />
        </TableSection>
      </div>
    </main>
  );
}
