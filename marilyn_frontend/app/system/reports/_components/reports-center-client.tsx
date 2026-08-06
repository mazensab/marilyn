"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpDown,
  Banknote,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  ExternalLink,
  FileBarChart,
  FileSpreadsheet,
  HeartPulse,
  Landmark,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  TableProperties,
  TriangleAlert,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openPrintReport } from "@/lib/print-report";
import { cn } from "@/lib/utils";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type Category = "medical" | "financial" | "treasury" | "hr";
type StatusFilter = "all" | "ready" | "unavailable";
type SortKey = "default" | "title" | "category" | "status";
type EndpointKey =
  | "medicalSummary"
  | "appointments"
  | "patients"
  | "encounters"
  | "billing"
  | "payments"
  | "treasury"
  | "employees"
  | "reportsOverview"
  | "trialBalance"
  | "ledger"
  | "profitLoss"
  | "balanceSheet"
  | "cashFlow";

type ReportDefinition = {
  id: string;
  endpointKey: EndpointKey;
  category: Category;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  endpoint: string;
  href: string;
};

type ReportRow = ReportDefinition & {
  status: "ready" | "unavailable";
};

type Stats = {
  appointments: number;
  patients: number;
  encounters: number;
  readyReports: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  cashFlow: number;
};

const REPORTS: ReportDefinition[] = [
  {
    id: "medical-overview",
    endpointKey: "medicalSummary",
    category: "medical",
    titleAr: "التقرير الطبي التشغيلي",
    titleEn: "Medical operations report",
    descriptionAr: "ملخص الفروع والعيادات والممارسين والنشاط الطبي.",
    descriptionEn: "Summary of branches, clinics, practitioners, and medical operations.",
    endpoint: "/api/company/medical/summary/",
    href: "/system",
  },
  {
    id: "appointments",
    endpointKey: "appointments",
    category: "medical",
    titleAr: "تقرير المواعيد",
    titleEn: "Appointments report",
    descriptionAr: "متابعة المواعيد وحالاتها وتقويمها وقائمة الانتظار.",
    descriptionEn: "Appointments, statuses, calendar, and waiting-list monitoring.",
    endpoint: "/api/company/medical/appointments/",
    href: "/system/appointments",
  },
  {
    id: "patients",
    endpointKey: "patients",
    category: "medical",
    titleAr: "تقرير المرضى",
    titleEn: "Patients report",
    descriptionAr: "سجل المرضى والملفات الطبية وحالات الوصول.",
    descriptionEn: "Patient registry, medical records, and record-access status.",
    endpoint: "/api/company/medical/patients/",
    href: "/system/patients",
  },
  {
    id: "clinical-operations",
    endpointKey: "encounters",
    category: "medical",
    titleAr: "تقرير العمليات السريرية",
    titleEn: "Clinical operations report",
    descriptionAr: "الزيارات والتشخيصات والإجراءات والإحالات الطبية.",
    descriptionEn: "Encounters, diagnoses, procedures, and referrals.",
    endpoint: "/api/company/medical/encounters/",
    href: "/system/clinical-operations",
  },
  {
    id: "billing",
    endpointKey: "billing",
    category: "financial",
    titleAr: "تقرير فواتير المرضى",
    titleEn: "Patient billing report",
    descriptionAr: "الفواتير والإجماليات وحالات السداد.",
    descriptionEn: "Invoices, totals, and payment status.",
    endpoint: "/api/company/sales/invoices/summary/",
    href: "/system/billing",
  },
  {
    id: "payments",
    endpointKey: "payments",
    category: "treasury",
    titleAr: "تقرير مدفوعات المرضى",
    titleEn: "Patient payments report",
    descriptionAr: "المدفوعات المؤكدة والمعلقة والملغاة.",
    descriptionEn: "Confirmed, pending, and cancelled patient payments.",
    endpoint: "/api/company/treasury/customer-payments/",
    href: "/system/payments",
  },
  {
    id: "treasury",
    endpointKey: "treasury",
    category: "treasury",
    titleAr: "تقرير الخزينة",
    titleEn: "Treasury report",
    descriptionAr: "أرصدة الصناديق والبنوك والحركات النقدية.",
    descriptionEn: "Cashbox, bank, and treasury transaction balances.",
    endpoint: "/api/company/treasury/summary/",
    href: "/system/treasury",
  },
  {
    id: "hr",
    endpointKey: "employees",
    category: "hr",
    titleAr: "تقرير الموارد البشرية",
    titleEn: "Human resources report",
    descriptionAr: "الموظفون والحضور والإجازات والرواتب والأداء.",
    descriptionEn: "Employees, attendance, leave, payroll, and performance.",
    endpoint: "/api/company/hr/employees/",
    href: "/system/hr",
  },
  {
    id: "trial-balance",
    endpointKey: "trialBalance",
    category: "financial",
    titleAr: "ميزان المراجعة",
    titleEn: "Trial balance",
    descriptionAr: "مقارنة الأرصدة المدينة والدائنة خلال الفترة.",
    descriptionEn: "Debit and credit balances for the selected period.",
    endpoint: "/api/company/accounting/reports/trial-balance/",
    href: "/company/accounting/trial-balance",
  },
  {
    id: "ledger",
    endpointKey: "ledger",
    category: "financial",
    titleAr: "دفتر الأستاذ",
    titleEn: "General ledger",
    descriptionAr: "حركات الحسابات والأرصدة الافتتاحية والختامية.",
    descriptionEn: "Account movements with opening and closing balances.",
    endpoint: "/api/company/accounting/reports/ledger/",
    href: "/company/accounting/ledger",
  },
  {
    id: "profit-loss",
    endpointKey: "profitLoss",
    category: "financial",
    titleAr: "قائمة الدخل",
    titleEn: "Income statement",
    descriptionAr: "الإيرادات والمصروفات وصافي نتيجة الفترة.",
    descriptionEn: "Revenue, expenses, and net result for the period.",
    endpoint: "/api/company/accounting/reports/income-statement/",
    href: "/company/accounting/profit-loss",
  },
  {
    id: "balance-sheet",
    endpointKey: "balanceSheet",
    category: "financial",
    titleAr: "المركز المالي",
    titleEn: "Financial position",
    descriptionAr: "الأصول والالتزامات وحقوق الملكية.",
    descriptionEn: "Assets, liabilities, and equity.",
    endpoint: "/api/company/accounting/reports/financial-position/",
    href: "/company/accounting/balance-sheet",
  },
  {
    id: "cash-flow",
    endpointKey: "cashFlow",
    category: "financial",
    titleAr: "قائمة التدفقات النقدية",
    titleEn: "Cash flow statement",
    descriptionAr: "التدفقات التشغيلية والاستثمارية والتمويلية.",
    descriptionEn: "Operating, investing, and financing cash flows.",
    endpoint: "/api/company/accounting/reports/cash-flow/",
    href: "/company/accounting/cash-flow",
  },
];

const ENDPOINTS: Record<EndpointKey, string> = {
  medicalSummary: "/api/company/medical/summary/",
  appointments: "/api/company/medical/appointments/?page=1&page_size=1",
  patients: "/api/company/medical/patients/?page=1&page_size=1",
  encounters: "/api/company/medical/encounters/?page=1&page_size=1",
  billing: "/api/company/sales/invoices/summary/",
  payments: "/api/company/treasury/customer-payments/?page=1&page_size=1",
  treasury: "/api/company/treasury/summary/",
  employees: "/api/company/hr/employees/?page=1&page_size=1",
  reportsOverview: "/api/company/reports/",
  trialBalance: "/api/company/accounting/reports/trial-balance/",
  ledger: "/api/company/accounting/reports/ledger/?page=1&page_size=1",
  profitLoss: "/api/company/accounting/reports/income-statement/",
  balanceSheet: "/api/company/accounting/reports/financial-position/",
  cashFlow: "/api/company/accounting/reports/cash-flow/",
};

const FINANCIAL_ENDPOINTS = new Set<EndpointKey>([
  "trialBalance",
  "ledger",
  "profitLoss",
  "balanceSheet",
  "cashFlow",
]);

const translations = {
  ar: {
    module: "الإدارة المركزية",
    title: "مركز التقارير",
    subtitle:
      "مركز موحد للتقارير الطبية والتشغيلية والمالية والخزينة والموارد البشرية من واجهات النظام الفعلية.",
    connected: "متصل بواجهات التقارير والعمليات",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    excel: "Excel",
    print: "طباعة",
    totalAppointments: "إجمالي المواعيد",
    totalPatients: "إجمالي المرضى",
    totalEncounters: "الزيارات السريرية",
    readyReports: "التقارير المتاحة",
    revenue: "الإيرادات",
    expenses: "المصروفات",
    netIncome: "صافي الربح / الخسارة",
    cashFlow: "صافي التدفق النقدي",
    appointmentsDesc: "السجلات المعادة من واجهة المواعيد",
    patientsDesc: "المرضى المسجلون في المنشأة",
    encountersDesc: "الزيارات السريرية المسجلة",
    readyReportsDesc: "مصادر تقارير استجابت بنجاح",
    revenueDesc: "إيرادات الفترة المحددة",
    expensesDesc: "مصروفات الفترة المحددة",
    netIncomeDesc: "صافي نتيجة الفترة المحددة",
    cashFlowDesc: "صافي حركة النقد خلال الفترة",
    all: "جميع التقارير",
    medical: "طبية وتشغيلية",
    financial: "مالية ومحاسبية",
    treasury: "الخزينة والمدفوعات",
    hr: "الموارد البشرية",
    registerTitle: "دليل التقارير",
    registerDesc:
      "التقارير المتاحة وتصنيفاتها ومصادرها التشغيلية وحالة الاتصال الحالية.",
    search: "بحث باسم التقرير أو الوصف أو المصدر...",
    status: "الحالة",
    category: "الفئة",
    source: "المصدر التشغيلي",
    route: "فتح",
    report: "التقرير",
    ready: "متاح",
    unavailable: "غير متاح",
    allStatuses: "جميع الحالات",
    sort: "الترتيب",
    defaultSort: "الترتيب الافتراضي",
    titleSort: "اسم التقرير",
    categorySort: "الفئة",
    statusSort: "الحالة",
    from: "من تاريخ",
    to: "إلى تاريخ",
    reset: "إعادة ضبط",
    noData: "لا توجد تقارير",
    noDataDesc: "لم يتم تعريف تقارير في المركز.",
    noResults: "لا توجد نتائج مطابقة",
    noResultsDesc: "غيّر البحث أو الفلاتر لإظهار تقارير أخرى.",
    loading: "جارٍ تحميل مركز التقارير...",
    errorTitle: "تعذر تحميل مركز التقارير",
    errorDesc:
      "تأكد من تسجيل الدخول ووجود سياق منشأة فعال وتشغيل الخادم الخلفي.",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل التقارير جزئيًا",
    partialDesc:
      "تعذر الاتصال ببعض مصادر التقارير، لذلك تظهر المصادر المتاحة فقط.",
    showing: "عرض",
    of: "من",
    rows: "تقرير",
    refreshed: "تم تحديث مركز التقارير.",
    excelReady: "تم تجهيز ملف Excel.",
    excelEmpty: "لا توجد تقارير لتصديرها.",
    printReady: "تم تجهيز تقرير الطباعة.",
    printEmpty: "لا توجد تقارير لطباعتها.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    sar: "ريال سعودي",
  },
  en: {
    module: "Central administration",
    title: "Reports Center",
    subtitle:
      "A unified center for medical, operational, financial, treasury, and HR reports from live system APIs.",
    connected: "Connected to reports and operations APIs",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    excel: "Excel",
    print: "Print",
    totalAppointments: "Total appointments",
    totalPatients: "Total patients",
    totalEncounters: "Clinical encounters",
    readyReports: "Available reports",
    revenue: "Revenue",
    expenses: "Expenses",
    netIncome: "Net profit / loss",
    cashFlow: "Net cash flow",
    appointmentsDesc: "Records returned by the appointments API",
    patientsDesc: "Patients registered in the facility",
    encountersDesc: "Recorded clinical encounters",
    readyReportsDesc: "Report sources responding successfully",
    revenueDesc: "Revenue for the selected period",
    expensesDesc: "Expenses for the selected period",
    netIncomeDesc: "Net result for the selected period",
    cashFlowDesc: "Net cash movement for the period",
    all: "All reports",
    medical: "Medical & operational",
    financial: "Financial & accounting",
    treasury: "Treasury & payments",
    hr: "Human resources",
    registerTitle: "Reports directory",
    registerDesc:
      "Available reports, categories, operational sources, and current connection status.",
    search: "Search report name, description, or source...",
    status: "Status",
    category: "Category",
    source: "Operational source",
    route: "Open",
    report: "Report",
    ready: "Available",
    unavailable: "Unavailable",
    allStatuses: "All statuses",
    sort: "Sort",
    defaultSort: "Default order",
    titleSort: "Report name",
    categorySort: "Category",
    statusSort: "Status",
    from: "From date",
    to: "To date",
    reset: "Reset",
    noData: "No reports",
    noDataDesc: "No reports are defined in the center.",
    noResults: "No matching results",
    noResultsDesc: "Change the search or filters to show other reports.",
    loading: "Loading reports center...",
    errorTitle: "Could not load reports center",
    errorDesc:
      "Make sure you are signed in, a facility context is active, and the backend is running.",
    retry: "Try again",
    partialTitle: "Reports partially loaded",
    partialDesc:
      "Some report sources could not be reached, so only available sources are shown.",
    showing: "Showing",
    of: "of",
    rows: "reports",
    refreshed: "Reports center refreshed.",
    excelReady: "Excel file prepared.",
    excelEmpty: "There are no reports to export.",
    printReady: "Print report prepared.",
    printEmpty: "There are no reports to print.",
    printBlocked: "The print window could not be opened.",
    sar: "Saudi riyal",
  },
} as const;

function readLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const htmlLocale = document.documentElement.lang;
  if (htmlLocale.toLowerCase().startsWith("en")) return "en";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function toEnglishDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
    )
    .replaceAll("٫", ".")
    .replaceAll("٬", ",");
}

function normalizeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return toEnglishDigits(value).trim() || fallback;
}

function toNumber(value: unknown, fallback = Number.NaN) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = toEnglishDigits(value).replaceAll(",", "");
    const parsed = Number(normalized.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function findValue(
  value: unknown,
  keys: string[],
  depth = 0,
  visited = new Set<unknown>(),
): unknown {
  if (depth > 7 || visited.has(value)) return undefined;
  if (!isRecord(value) && !Array.isArray(value)) return undefined;
  visited.add(value);

  if (isRecord(value)) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        return value[key];
      }
    }
    for (const nested of Object.values(value)) {
      const result = findValue(nested, keys, depth + 1, visited);
      if (result !== undefined) return result;
    }
  } else {
    for (const nested of value) {
      const result = findValue(nested, keys, depth + 1, visited);
      if (result !== undefined) return result;
    }
  }

  return undefined;
}

function firstNumber(payload: unknown, keys: string[], fallback = 0) {
  const value = findValue(payload, keys);
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const visited = new Set<unknown>();

  const walk = (value: unknown, depth = 0): unknown[] => {
    if (Array.isArray(value)) return value;
    if (!isRecord(value) || depth > 7 || visited.has(value)) return [];
    visited.add(value);

    for (const key of [
      "results",
      "items",
      "records",
      "rows",
      "data",
      "payload",
      "response",
      "lines",
      "sections",
    ]) {
      const candidate = value[key];
      if (Array.isArray(candidate)) return candidate;
    }

    for (const nested of Object.values(value)) {
      const result = walk(nested, depth + 1);
      if (result.length) return result;
    }

    return [];
  };

  return walk(payload);
}

function extractCount(payload: unknown) {
  const value = findValue(payload, [
    "count",
    "total_count",
    "records_count",
    "total",
    "rows_count",
  ]);
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : extractArray(payload).length;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function isoToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoYearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

function getApiBaseUrl() {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  return envBase.endsWith("/api") ? envBase.slice(0, -4) : envBase;
}

function makeApiUrl(path: string, params?: URLSearchParams) {
  const questionIndex = path.indexOf("?");
  const pathname = questionIndex >= 0 ? path.slice(0, questionIndex) : path;
  const existingQuery = questionIndex >= 0 ? path.slice(questionIndex + 1) : "";
  const query = new URLSearchParams(existingQuery);

  params?.forEach((value, key) => {
    query.set(key, value);
  });

  const suffix = `${pathname}${query.toString() ? `?${query.toString()}` : ""}`;
  const base = getApiBaseUrl();
  return base ? `${base}${suffix}` : suffix;
}

async function fetchJson(
  path: string,
  params: URLSearchParams | undefined,
  signal: AbortSignal,
) {
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

  const rawText = await response.text();
  let payload: unknown = {};

  if (rawText) {
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

  return payload;
}

function categoryLabel(category: Category, locale: Locale) {
  const t = translations[locale];
  if (category === "medical") return t.medical;
  if (category === "financial") return t.financial;
  if (category === "treasury") return t.treasury;
  return t.hr;
}

function reportIcon(endpointKey: EndpointKey): LucideIcon {
  if (endpointKey === "medicalSummary") return HeartPulse;
  if (endpointKey === "appointments") return CalendarDays;
  if (endpointKey === "patients") return UserRound;
  if (endpointKey === "encounters") return Stethoscope;
  if (endpointKey === "billing") return ReceiptText;
  if (endpointKey === "payments") return WalletCards;
  if (endpointKey === "treasury") return Landmark;
  if (endpointKey === "employees") return Users;
  if (endpointKey === "reportsOverview") return FileBarChart;
  if (endpointKey === "trialBalance") return BarChart3;
  if (endpointKey === "ledger") return TableProperties;
  if (endpointKey === "profitLoss") return ChartNoAxesCombined;
  if (endpointKey === "balanceSheet") return Landmark;
  return Banknote;
}
function sourceLabel(endpointKey: EndpointKey, locale: Locale) {
  const labels: Record<EndpointKey, { ar: string; en: string }> = {
    medicalSummary: {
      ar: "ملخص التشغيل الطبي",
      en: "Medical operations summary",
    },
    appointments: {
      ar: "مركز المواعيد",
      en: "Appointments center",
    },
    patients: {
      ar: "سجل المرضى",
      en: "Patients registry",
    },
    encounters: {
      ar: "العمليات السريرية",
      en: "Clinical operations",
    },
    billing: {
      ar: "فواتير المرضى",
      en: "Patient billing",
    },
    payments: {
      ar: "مدفوعات المرضى",
      en: "Patient payments",
    },
    treasury: {
      ar: "الخزينة والمدفوعات",
      en: "Treasury and payments",
    },
    employees: {
      ar: "الموارد البشرية",
      en: "Human resources",
    },
    reportsOverview: {
      ar: "ملخص التقارير",
      en: "Reports overview",
    },
    trialBalance: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
    ledger: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
    profitLoss: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
    balanceSheet: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
    cashFlow: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
  };
  return labels[endpointKey][locale];
}
function titleFor(report: ReportDefinition, locale: Locale) {
  return locale === "ar" ? report.titleAr : report.titleEn;
}

function descriptionFor(report: ReportDefinition, locale: Locale) {
  return locale === "ar" ? report.descriptionAr : report.descriptionEn;
}

function escapeHtml(value: unknown) {
  return normalizeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function reportTableHtml(
  rows: ReportRow[],
  locale: Locale,
) {
  const t = translations[locale];

  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.report)}</th>
          <th>${escapeHtml(t.category)}</th>
          <th>${escapeHtml(t.status)}</th>
          <th>${escapeHtml(t.source)}</th>
          <th>${escapeHtml(t.route)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>
                  <strong>${escapeHtml(titleFor(row, locale))}</strong>
                  <div>${escapeHtml(descriptionFor(row, locale))}</div>
                </td>
                <td>${escapeHtml(categoryLabel(row.category, locale))}</td>
                <td>${escapeHtml(row.status === "ready" ? t.ready : t.unavailable)}</td>
                <td>${escapeHtml(sourceLabel(row.endpointKey, locale))}</td>
                <td>${escapeHtml(titleFor(row, locale))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function downloadExcel(rows: ReportRow[], locale: Locale) {
  const t = translations[locale];
  const html = `<!doctype html>
<html dir="${locale === "ar" ? "rtl" : "ltr"}">
<head><meta charset="utf-8" /></head>
<body>
  <h1>${escapeHtml(t.title)}</h1>
  <p>${escapeHtml(t.registerDesc)}</p>
  ${reportTableHtml(rows, locale)}
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "marilyn-reports-center.xls";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DashboardSkeleton() {
  return (
    <main className="text-foreground">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-[420px] max-w-full" />
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[126px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-lg" />
      </div>
    </main>
  );
}

export default function ReportsCenterClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [dateFrom, setDateFrom] = React.useState(isoYearStart);
  const [dateTo, setDateTo] = React.useState(isoToday);
  const [payloads, setPayloads] = React.useState<
    Partial<Record<EndpointKey, unknown>>
  >({});
  const [failedKeys, setFailedKeys] = React.useState<Set<EndpointKey>>(
    new Set(),
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<"all" | Category>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("default");

  React.useEffect(() => {
    const updateLocale = () => setLocale(readLocale());
    updateLocale();

    const observer = new MutationObserver(updateLocale);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });
    window.addEventListener("storage", updateLocale);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", updateLocale);
    };
  }, []);

  const load = React.useCallback(
    async (manual = false) => {
      const controller = new AbortController();

      if (manual) setRefreshing(true);
      else setLoading(true);
      setError("");

      const periodParams = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
        include_zero: "false",
      });

      const entries = Object.entries(ENDPOINTS) as Array<
        [EndpointKey, string]
      >;

      const results = await Promise.allSettled(
        entries.map(([key, path]) =>
          fetchJson(
            path,
            FINANCIAL_ENDPOINTS.has(key) ? periodParams : undefined,
            controller.signal,
          ),
        ),
      );

      const nextPayloads: Partial<Record<EndpointKey, unknown>> = {};
      const nextFailed = new Set<EndpointKey>();

      results.forEach((result, index) => {
        const key = entries[index][0];
        if (result.status === "fulfilled") {
          nextPayloads[key] = result.value;
        } else {
          nextFailed.add(key);
        }
      });

      setPayloads(nextPayloads);
      setFailedKeys(nextFailed);

      if (nextFailed.size === entries.length) {
        setError(translations[readLocale()].errorDesc);
      } else if (manual) {
        toast.success(translations[readLocale()].refreshed);
      }

      setLoading(false);
      setRefreshing(false);

      return () => controller.abort();
    },
    [dateFrom, dateTo],
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const alignClass = locale === "ar" ? "text-right" : "text-left";

  const rows = React.useMemo<ReportRow[]>(
    () =>
      REPORTS.map((report) => ({
        ...report,
        status: failedKeys.has(report.endpointKey)
          ? "unavailable"
          : "ready",
      })),
    [failedKeys],
  );

  const stats = React.useMemo<Stats>(() => {
    const revenue = firstNumber(payloads.profitLoss, [
      "total_revenue",
      "revenue",
      "revenues",
      "income_total",
    ]);
    const expenses = firstNumber(payloads.profitLoss, [
      "total_expenses",
      "expenses",
      "expense_total",
    ]);

    return {
      appointments:
        extractCount(payloads.appointments) ||
        firstNumber(payloads.medicalSummary, [
          "appointments_count",
          "total_appointments",
          "appointments",
        ]),
      patients:
        extractCount(payloads.patients) ||
        firstNumber(payloads.medicalSummary, [
          "patients_count",
          "total_patients",
          "patients",
        ]),
      encounters:
        extractCount(payloads.encounters) ||
        firstNumber(payloads.medicalSummary, [
          "encounters_count",
          "total_encounters",
          "encounters",
        ]),
      readyReports: rows.filter((row) => row.status === "ready").length,
      revenue,
      expenses,
      netIncome: firstNumber(
        payloads.profitLoss,
        ["net_income", "net_profit", "profit", "net_result"],
        revenue - expenses,
      ),
      cashFlow: firstNumber(payloads.cashFlow, [
        "net_cash_flow",
        "cash_flow",
        "net_change",
        "closing_cash_change",
        "ending_cash",
        "closing_cash",
      ]),
    };
  }, [payloads, rows]);

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (status !== "all" && row.status !== status) return false;
      if (!query) return true;

      const haystack = [
        titleFor(row, locale),
        descriptionFor(row, locale),
        categoryLabel(row.category, locale),
        row.endpoint,
        row.href,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...result].sort((left, right) => {
      if (sort === "title") {
        return titleFor(left, locale).localeCompare(
          titleFor(right, locale),
          locale,
        );
      }
      if (sort === "category") {
        return categoryLabel(left.category, locale).localeCompare(
          categoryLabel(right.category, locale),
          locale,
        );
      }
      if (sort === "status") {
        return left.status.localeCompare(right.status);
      }
      return REPORTS.findIndex((item) => item.id === left.id) -
        REPORTS.findIndex((item) => item.id === right.id);
    });
  }, [category, locale, rows, search, sort, status]);

  const hasFilters =
    Boolean(search.trim()) ||
    category !== "all" ||
    status !== "all" ||
    sort !== "default";

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setSort("default");
    setDateFrom(isoYearStart());
    setDateTo(isoToday());
  };

  const exportRows = React.useCallback(() => {
    if (!filteredRows.length) {
      toast.error(t.excelEmpty);
      return;
    }
    downloadExcel(filteredRows, locale);
    toast.success(t.excelReady);
  }, [filteredRows, locale, t.excelEmpty, t.excelReady]);

  const printRows = React.useCallback(async () => {
    if (!filteredRows.length) {
      toast.error(t.printEmpty);
      return;
    }

    const opened = await openPrintReport({
      locale,
      title: t.title,
      subtitle: `${t.registerDesc} — ${dateFrom} / ${dateTo}`,
      tableHtml: reportTableHtml(filteredRows, locale),
      recordsCount: filteredRows.length,
    });

    if (opened) toast.success(t.printReady);
    else toast.error(t.printBlocked);
  }, [
    dateFrom,
    dateTo,
    filteredRows,
    locale,
    t.printBlocked,
    t.printEmpty,
    t.printReady,
    t.registerDesc,
    t.title,
  ]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <main dir={dir} className="text-foreground">
        <Card className="rounded-lg border-destructive/30 shadow-none">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
            <TriangleAlert className="h-10 w-10 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">{t.errorTitle}</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {error}
              </p>
            </div>
            <Button onClick={() => void load(true)}>
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const categories: Array<"all" | Category> = [
    "all",
    "medical",
    "financial",
    "treasury",
    "hr",
  ];

  return (
    <main dir={dir} className="text-foreground">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-[#a57b3d]">
              <Sparkles className="h-4 w-4" />
              {t.module}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t.connected}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={refreshing}
              onClick={() => void load(true)}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? t.refreshing : t.refresh}
            </Button>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={exportRows}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void printRows()}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>

        {failedKeys.size > 0 ? (
          <Card className="rounded-lg border-amber-300/70 bg-amber-50/60 shadow-none dark:bg-amber-950/15">
            <CardContent className="flex items-start gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <div className="font-semibold">{t.partialTitle}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.partialDesc}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.totalAppointments}
            value={formatInteger(stats.appointments)}
            description={t.appointmentsDesc}
            href="/system/appointments"
            icon={CalendarDays}
          />
          <SystemKpiCard
            title={t.totalPatients}
            value={formatInteger(stats.patients)}
            description={t.patientsDesc}
            href="/system/patients"
            icon={Users}
          />
          <SystemKpiCard
            title={t.totalEncounters}
            value={formatInteger(stats.encounters)}
            description={t.encountersDesc}
            href="/system/clinical-operations"
            icon={Stethoscope}
          />
          <SystemKpiCard
            title={t.readyReports}
            value={formatInteger(stats.readyReports)}
            description={t.readyReportsDesc}
            icon={FileBarChart}
          />
          <SystemKpiCard
            title={t.revenue}
            value={formatMoney(stats.revenue)}
            description={t.revenueDesc}
            href="/company/accounting/profit-loss"
            icon={ChartNoAxesCombined}
            currencyIcon
            currencyAlt={t.sar}
          />
          <SystemKpiCard
            title={t.expenses}
            value={formatMoney(stats.expenses)}
            description={t.expensesDesc}
            href="/company/accounting/profit-loss"
            icon={ReceiptText}
            currencyIcon
            currencyAlt={t.sar}
          />
          <SystemKpiCard
            title={t.netIncome}
            value={formatMoney(stats.netIncome)}
            description={t.netIncomeDesc}
            href="/company/accounting/profit-loss"
            icon={Banknote}
            currencyIcon
            currencyAlt={t.sar}
          />
          <SystemKpiCard
            title={t.cashFlow}
            value={formatMoney(stats.cashFlow)}
            description={t.cashFlowDesc}
            href="/company/accounting/cash-flow"
            icon={WalletCards}
            currencyIcon
            currencyAlt={t.sar}
          />
        </section>

        <div className="flex flex-wrap gap-2">
          {categories.map((item) => {
            const active = category === item;
            const label =
              item === "all" ? t.all : categoryLabel(item, locale);
            const count =
              item === "all"
                ? rows.length
                : rows.filter((row) => row.category === item).length;
            return (
              <Button
                key={item}
                type="button"
                variant={active ? "brand" : "outline"}
                className={cn(
                  "h-9 shadow-none",
                  !active && registerOutlineButtonClass,
                )}
                aria-current={active ? "page" : undefined}
                onClick={() => setCategory(item)}
              >
                {item === "medical" ? (
                  <HeartPulse className="h-4 w-4" />
                ) : item === "financial" ? (
                  <BarChart3 className="h-4 w-4" />
                ) : item === "treasury" ? (
                  <Landmark className="h-4 w-4" />
                ) : item === "hr" ? (
                  <UserRound className="h-4 w-4" />
                ) : (
                  <TableProperties className="h-4 w-4" />
                )}
                {label}
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                  {formatInteger(count)}
                </span>
              </Button>
            );
          })}
        </div>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle}
                </CardTitle>
                <CardDescription className="mt-2">
                  {t.registerDesc}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={exportRows}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.excel}
                </Button>
                <Button
                  variant="brand"
                  className={registerBrandButtonClass}
                  onClick={() => void printRows()}
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DataRegisterSearch
                value={search}
                onChange={setSearch}
                placeholder={t.search}
                className="min-w-0 flex-1"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as "all" | Category)
                  }
                >
                  <SelectTrigger className="h-9 w-[180px] bg-background shadow-none">
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="medical">{t.medical}</SelectItem>
                    <SelectItem value="financial">{t.financial}</SelectItem>
                    <SelectItem value="treasury">{t.treasury}</SelectItem>
                    <SelectItem value="hr">{t.hr}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as StatusFilter)
                  }
                >
                  <SelectTrigger className="h-9 w-[150px] bg-background shadow-none">
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="ready">{t.ready}</SelectItem>
                    <SelectItem value="unavailable">
                      {t.unavailable}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <DataRegisterDatePicker
                  label={t.from}
                  value={dateFrom}
                  onChange={setDateFrom}
                  locale={locale}
                />
                <DataRegisterDatePicker
                  label={t.to}
                  value={dateTo}
                  onChange={setDateTo}
                  locale={locale}
                />

                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as SortKey)}
                >
                  <SelectTrigger className="h-9 w-[160px] bg-background shadow-none">
                    <ArrowUpDown className="h-4 w-4 text-[#a57b3d]" />
                    <SelectValue placeholder={t.sort} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t.defaultSort}</SelectItem>
                    <SelectItem value="title">{t.titleSort}</SelectItem>
                    <SelectItem value="category">{t.categorySort}</SelectItem>
                    <SelectItem value="status">{t.statusSort}</SelectItem>
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
              </div>
            </DataRegisterToolbar>

            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table variant="register" className="min-w-[1040px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn("w-[390px]", alignClass)}>
                        {t.report}
                      </TableHead>
                      <TableHead className={cn("w-[170px]", alignClass)}>
                        {t.category}
                      </TableHead>
                      <TableHead className={cn("w-[145px]", alignClass)}>
                        {t.status}
                      </TableHead>
                      <TableHead className={cn("w-[245px]", alignClass)}>
                        {t.source}
                      </TableHead>
                      <TableHead className="w-[90px] text-center">
                        {t.route}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const ReportIcon = reportIcon(row.endpointKey);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Link
                              href={row.href}
                              className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d7bd98]/60 bg-[#a57b3d]/5 text-[#a57b3d] shadow-sm transition-colors group-hover:bg-[#a57b3d]/10">
                                <ReportIcon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold transition-colors group-hover:text-[#8b642f]">
                                  {titleFor(row, locale)}
                                </span>
                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                                  {descriptionFor(row, locale)}
                                </span>
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-background"
                            >
                              {categoryLabel(row.category, locale)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                row.status === "ready"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                                  : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
                              }
                            >
                              {row.status === "ready"
                                ? t.ready
                                : t.unavailable}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground"
                              title={sourceLabel(row.endpointKey, locale)}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c99a52]" />
                              <span className="truncate font-medium text-foreground/75">
                                {sourceLabel(row.endpointKey, locale)}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full border border-[#d7bd98]/60 bg-background text-[#a57b3d] shadow-none hover:bg-[#a57b3d]/10 hover:text-[#8b642f]"
                            >
                              <Link
                                href={row.href}
                                aria-label={`${t.route}: ${titleFor(row, locale)}`}
                                title={`${t.route}: ${titleFor(row, locale)}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">{t.route}</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {!rows.length ? (
                <DataRegisterEmptyState
                  icon={FileBarChart}
                  title={t.noData}
                  description={t.noDataDesc}
                />
              ) : !filteredRows.length ? (
                <DataRegisterEmptyState
                  icon={Search}
                  title={t.noResults}
                  description={t.noResultsDesc}
                  action={
                    <Button
                      variant="outline"
                      className={registerOutlineButtonClass}
                      onClick={resetFilters}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t.reset}
                    </Button>
                  }
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {t.showing} {formatInteger(filteredRows.length)} {t.of}{" "}
                {formatInteger(rows.length)} {t.rows}
              </span>
              <span dir="ltr">
                {dateFrom} — {dateTo}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
