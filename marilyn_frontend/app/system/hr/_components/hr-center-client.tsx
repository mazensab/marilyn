"use client";

import * as React from "react";
import Image from "next/image";
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  UserCheck,
  Users,
  WalletCards,
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
  registerOutlineButtonClass,
  registerBrandButtonClass,
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
type Resource =
  | "employees"
  | "attendance"
  | "leave"
  | "payroll"
  | "performance";
type SortKey = "newest" | "oldest" | "name" | "status";
type ApiRecord = Record<string, unknown>;

type HrRow = {
  id: string;
  resource: Resource;
  number: string;
  title: string;
  subtitle: string;
  scope: string;
  status: string;
  date: string | null;
  metric: string;
  amount: number | null;
};

type Stats = {
  employees: number;
  active: number;
  openAttendance: number;
  pendingLeave: number;
};

const ENDPOINTS: Record<Resource, string> = {
  employees: "/api/company/hr/employees/?page=1&page_size=200",
  attendance: "/api/company/hr/attendance/?page=1&page_size=100",
  leave: "/api/company/hr/leave-requests/?page=1&page_size=100",
  payroll: "/api/company/hr/payroll/runs/?page=1&page_size=200",
  performance: "/api/company/hr/performance/reviews/",
};

const RESOURCES: Resource[] = [
  "employees",
  "attendance",
  "leave",
  "payroll",
  "performance",
];

const TERMINAL_LEAVE = new Set([
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CANCELED",
]);

const i18n = {
  ar: {
    module: "الإدارة المركزية",
    title: "مركز الموارد البشرية",
    subtitle:
      "متابعة الموظفين والحضور والإجازات والرواتب وتقييم الأداء من واجهات الموارد البشرية الفعلية.",
    connected: "متصل بواجهات الموارد البشرية",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    excel: "Excel",
    print: "طباعة",
    reset: "إعادة ضبط",
    search: "بحث داخل السجل الحالي...",
    all: "جميع الحالات",
    from: "من تاريخ",
    to: "إلى تاريخ",
    newest: "الأحدث",
    oldest: "الأقدم",
    nameSort: "الاسم",
    statusSort: "الحالة",
    totalEmployees: "إجمالي الموظفين",
    activeEmployees: "الموظفون النشطون",
    openAttendance: "حضور مفتوح",
    pendingLeave: "طلبات إجازة معلقة",
    totalEmployeesDesc: "جميع الموظفين المسجلين",
    activeEmployeesDesc: "المتاحون حاليًا للعمل",
    openAttendanceDesc: "سجلات بلا تسجيل انصراف",
    pendingLeaveDesc: "طلبات لم تصل إلى حالة نهائية",
    employees: "الموظفون",
    attendance: "الحضور والانصراف",
    leave: "طلبات الإجازة",
    payroll: "مسيرات الرواتب",
    performance: "تقييمات الأداء",
    employeesDesc: "دليل الموظفين والمسمى والقسم والفرع ونوع التوظيف.",
    attendanceDesc: "سجلات الحضور والانصراف وساعات العمل ومصدر التسجيل.",
    leaveDesc: "طلبات الإجازة والفترة والوحدات المطلوبة وحالة الاعتماد.",
    payrollDesc: "مسيرات الرواتب وإجمالي الموظفين وصافي الرواتب.",
    performanceDesc: "دورات تقييم الأداء والنتيجة والتصنيف النهائي.",
    number: "الرقم",
    record: "السجل",
    details: "التفاصيل",
    scope: "النطاق",
    status: "الحالة",
    date: "التاريخ",
    value: "القيمة",
    noData: "لا توجد سجلات",
    noDataDesc: "لا توجد بيانات متاحة في هذا السجل حاليًا.",
    noResults: "لا توجد نتائج مطابقة",
    noResultsDesc: "غيّر البحث أو الفلاتر لإظهار نتائج أخرى.",
    loading: "جارٍ تحميل مركز الموارد البشرية...",
    errorTitle: "تعذر تحميل مركز الموارد البشرية",
    errorDesc:
      "تأكد من تسجيل الدخول ووجود سياق منشأة فعال وتشغيل الخادم الخلفي.",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل البيانات جزئيًا",
    partialDesc: "تعذر تحميل بعض السجلات، لذلك تظهر البيانات المتاحة فقط.",
    showing: "عرض",
    of: "من",
    rows: "سجل",
    refreshed: "تم تحديث مركز الموارد البشرية.",
    excelReady: "تم تجهيز ملف Excel.",
    excelEmpty: "لا توجد سجلات لتصديرها.",
    printReady: "تم تجهيز تقرير الطباعة.",
    printEmpty: "لا توجد سجلات لطباعتها.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    report: "تقرير",
    unknown: "غير محدد",
  },
  en: {
    module: "Central administration",
    title: "Human Resources Center",
    subtitle:
      "Monitor employees, attendance, leave, payroll, and performance through live HR APIs.",
    connected: "Connected to HR APIs",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    excel: "Excel",
    print: "Print",
    reset: "Reset",
    search: "Search the current register...",
    all: "All statuses",
    from: "From date",
    to: "To date",
    newest: "Newest",
    oldest: "Oldest",
    nameSort: "Name",
    statusSort: "Status",
    totalEmployees: "Total employees",
    activeEmployees: "Active employees",
    openAttendance: "Open attendance",
    pendingLeave: "Pending leave requests",
    totalEmployeesDesc: "All registered employees",
    activeEmployeesDesc: "Currently available for work",
    openAttendanceDesc: "Records without check-out",
    pendingLeaveDesc: "Requests not in a terminal state",
    employees: "Employees",
    attendance: "Attendance",
    leave: "Leave requests",
    payroll: "Payroll runs",
    performance: "Performance reviews",
    employeesDesc: "Employee directory with title, department, branch, and type.",
    attendanceDesc: "Attendance records, worked hours, and check-in source.",
    leaveDesc: "Leave periods, requested units, and approval status.",
    payrollDesc: "Payroll runs, employee totals, and net pay.",
    performanceDesc: "Performance cycles, scores, and final ratings.",
    number: "Number",
    record: "Record",
    details: "Details",
    scope: "Scope",
    status: "Status",
    date: "Date",
    value: "Value",
    noData: "No records",
    noDataDesc: "No data is currently available in this register.",
    noResults: "No matching results",
    noResultsDesc: "Change the search or filters to show other results.",
    loading: "Loading the Human Resources Center...",
    errorTitle: "Could not load the Human Resources Center",
    errorDesc:
      "Make sure you are signed in, an active facility context exists, and the backend is running.",
    retry: "Try again",
    partialTitle: "Partially loaded",
    partialDesc: "Some registers could not be loaded, so only available data is shown.",
    showing: "Showing",
    of: "of",
    rows: "rows",
    refreshed: "Human Resources Center refreshed.",
    excelReady: "Excel file prepared.",
    excelEmpty: "There are no records to export.",
    printReady: "Print report prepared.",
    printEmpty: "There are no records to print.",
    printBlocked: "The print window could not be opened.",
    report: "Report",
    unknown: "Unknown",
  },
} as const;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function digits(value: unknown): string {
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

function text(value: unknown, fallback = ""): string {
  const normalized = digits(value).trim();
  return normalized || fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(
    digits(value).replaceAll(",", "").replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = text(value).toLowerCase();
  if (["true", "1", "yes", "active", "enabled"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "inactive", "disabled"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function status(value: unknown, fallback = "UNKNOWN"): string {
  return text(value, fallback).toUpperCase().replace(/[\s-]+/g, "_");
}

function nestedName(value: unknown): string {
  if (typeof value === "string") return text(value);
  const source = record(value);
  return text(
    source.display_name ??
      source.name ??
      source.title ??
      source.label ??
      source.username,
  );
}

function list(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const source = record(payload);
  for (const key of ["results", "items", "records", "rows"]) {
    if (Array.isArray(source[key])) return source[key] as unknown[];
  }
  const data = record(source.data);
  for (const key of ["results", "items", "records", "rows"]) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }
  return [];
}

function summary(payload: unknown): ApiRecord {
  const source = record(payload);
  const data = record(source.data);
  return {
    ...record(source.summary),
    ...record(data.summary),
    ...data,
    ...source,
  };
}

function count(payload: unknown): number {
  const source = summary(payload);
  for (const key of ["count", "total", "total_count", "total_records"]) {
    const parsed = numberValue(source[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return list(payload).length;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function getApiBaseUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return base.endsWith("/api") ? base.slice(0, -4) : base;
}

async function requestJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  const raw = await response.text();
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  const source = record(payload);
  if (!response.ok || source.ok === false || source.success === false) {
    throw new Error(
      text(source.message) ||
        text(source.detail) ||
        text(source.error) ||
        `HTTP ${response.status}`,
    );
  }
  return payload;
}

function normalize(resource: Resource, value: unknown): HrRow {
  const source = record(value);

  if (resource === "employees") {
    const branch = record(source.branch);
    const active = boolValue(source.is_active, status(source.status) === "ACTIVE");
    return {
      id: text(source.id ?? source.pk),
      resource,
      number: text(source.employee_number ?? source.number, "—"),
      title: text(source.display_name ?? source.name, "—"),
      subtitle: text(
        [source.job_title, source.department_name]
          .map((item) => text(item))
          .filter(Boolean)
          .join(" · "),
        "—",
      ),
      scope: text(branch.name ?? branch.display_name, "—"),
      status: status(source.status, active ? "ACTIVE" : "INACTIVE"),
      date: text(source.hire_date ?? source.created_at) || null,
      metric: status(source.employment_type, "UNKNOWN").replaceAll("_", " "),
      amount: null,
    };
  }

  if (resource === "attendance") {
    const employee = record(source.employee);
    const branch = record(source.branch);
    const minutes = numberValue(source.total_minutes);
    return {
      id: text(source.id ?? source.pk),
      resource,
      number: text(employee.employee_number, "—"),
      title: text(employee.display_name ?? employee.name, "—"),
      subtitle: `${text(source.check_in_at, "—")} · ${text(source.check_out_at, "—")}`,
      scope: text(branch.name ?? branch.display_name, "—"),
      status: status(source.status),
      date: text(source.work_date ?? source.created_at) || null,
      metric: `${formatDecimal(minutes / 60)} h · ${status(source.source).replaceAll("_", " ")}`,
      amount: null,
    };
  }

  if (resource === "leave") {
    const employee = record(source.employee);
    const leaveType = record(source.leave_type);
    return {
      id: text(source.id ?? source.pk),
      resource,
      number: text(source.employee_number ?? employee.employee_number, "—"),
      title: text(
        source.employee_name ?? employee.display_name ?? employee.name,
        "—",
      ),
      subtitle: text(
        source.leave_type_name ?? leaveType.name ?? leaveType.title,
        "—",
      ),
      scope: `${formatDate(text(source.start_date) || null)} — ${formatDate(
        text(source.end_date) || null,
      )}`,
      status: status(source.status),
      date: text(source.start_date ?? source.created_at) || null,
      metric: formatDecimal(
        numberValue(
          source.requested_units ?? source.requested_days ?? source.days,
        ),
      ),
      amount: null,
    };
  }

  if (resource === "payroll") {
    const period = record(source.period);
    return {
      id: text(source.id ?? source.pk),
      resource,
      number: text(source.run_number ?? source.number, "—"),
      title: text(source.name ?? source.title, "—"),
      subtitle: text(period.name ?? source.period_name, "—"),
      scope: `${formatDate(text(period.start_date) || null)} — ${formatDate(
        text(period.end_date) || null,
      )}`,
      status: status(source.status),
      date: text(period.start_date ?? source.created_at) || null,
      metric: formatInteger(source.total_employees),
      amount: numberValue(source.net_pay),
    };
  }

  return {
    id: text(source.id ?? source.pk),
    resource,
    number: text(source.employee_number, "—"),
    title: text(source.employee_name ?? nestedName(source.employee), "—"),
    subtitle: text(source.cycle_name ?? nestedName(source.cycle), "—"),
    scope: text(source.final_rating, "—"),
    status: status(source.status),
    date: text(source.review_date ?? source.created_at) || null,
    metric: formatDecimal(source.overall_score),
    amount: null,
  };
}

function formatInteger(value: unknown): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(numberValue(value)));
}

function formatDecimal(value: unknown): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue(value));
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(digits(value));
  if (Number.isNaN(parsed.getTime())) return digits(value).slice(0, 10) || "—";
  return parsed.toISOString().slice(0, 10);
}

function dateValue(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(digits(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value: unknown): string {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resourceTitle(resource: Resource, locale: Locale): string {
  return i18n[locale][resource];
}

function resourceDescription(resource: Resource, locale: Locale): string {
  const t = i18n[locale];
  return {
    employees: t.employeesDesc,
    attendance: t.attendanceDesc,
    leave: t.leaveDesc,
    payroll: t.payrollDesc,
    performance: t.performanceDesc,
  }[resource];
}

function resourceIcon(resource: Resource) {
  return {
    employees: Users,
    attendance: CalendarClock,
    leave: ClipboardList,
    payroll: WalletCards,
    performance: ChartNoAxesColumnIncreasing,
  }[resource];
}

function statusLabel(value: string, locale: Locale): string {
  const labels: Record<string, { ar: string; en: string }> = {
    ACTIVE: { ar: "نشط", en: "Active" },
    INACTIVE: { ar: "غير نشط", en: "Inactive" },
    ON_LEAVE: { ar: "في إجازة", en: "On leave" },
    TERMINATED: { ar: "منتهي", en: "Terminated" },
    OPEN: { ar: "مفتوح", en: "Open" },
    CLOSED: { ar: "مغلق", en: "Closed" },
    MISSING_CHECK_OUT: { ar: "انصراف مفقود", en: "Missing check-out" },
    DRAFT: { ar: "مسودة", en: "Draft" },
    SUBMITTED: { ar: "مقدم", en: "Submitted" },
    PENDING: { ar: "معلق", en: "Pending" },
    UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under review" },
    APPROVED: { ar: "معتمد", en: "Approved" },
    REJECTED: { ar: "مرفوض", en: "Rejected" },
    CALCULATED: { ar: "محسوب", en: "Calculated" },
    POSTED: { ar: "مرحل", en: "Posted" },
    PAID: { ar: "مدفوع", en: "Paid" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
    CANCELLED: { ar: "ملغي", en: "Cancelled" },
    CANCELED: { ar: "ملغي", en: "Cancelled" },
  };
  return labels[value]?.[locale] || value.replaceAll("_", " ") || i18n[locale].unknown;
}

function badgeClass(value: string): string {
  if (["ACTIVE", "APPROVED", "PAID", "POSTED", "COMPLETED", "CLOSED"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "OPEN",
      "DRAFT",
      "SUBMITTED",
      "PENDING",
      "UNDER_REVIEW",
      "CALCULATED",
      "ON_LEAVE",
      "MISSING_CHECK_OUT",
    ].includes(value)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["INACTIVE", "TERMINATED", "REJECTED", "CANCELLED", "CANCELED"].includes(value)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

function Money({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span dir="ltr" lang="en" className="font-semibold tabular-nums">
        {formatDecimal(value)}
      </span>
      <Image src="/currency/sar.svg" alt="SAR" width={14} height={14} className="size-3.5" />
    </span>
  );
}

function LoadingPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <Skeleton className="h-28 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[126px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    </main>
  );
}

export default function HrCenterClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [resource, setResource] = React.useState<Resource>("employees");
  const [rows, setRows] = React.useState<Record<Resource, HrRow[]>>({
    employees: [],
    attendance: [],
    leave: [],
    payroll: [],
    performance: [],
  });
  const [stats, setStats] = React.useState<Stats>({
    employees: 0,
    active: 0,
    openAttendance: 0,
    pendingLeave: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");

  const t = i18n[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  React.useEffect(() => {
    const apply = () => {
      const next = getInitialLocale();
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.body.dir = next === "ar" ? "rtl" : "ltr";
    };
    apply();
    window.addEventListener("storage", apply);
    window.addEventListener("primey-locale-changed", apply);
    return () => {
      window.removeEventListener("storage", apply);
      window.removeEventListener("primey-locale-changed", apply);
    };
  }, []);

  React.useEffect(() => {
    const view =
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("view") || "";
    if (RESOURCES.includes(view as Resource)) setResource(view as Resource);
  }, []);

  const load = React.useCallback(
    async (silent = false, signal?: AbortSignal) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError("");
      setWarnings([]);

      try {
        const results = await Promise.allSettled(
          RESOURCES.map((key) => requestJson(ENDPOINTS[key], signal)),
        );
        const failed = results
          .map((result, index) =>
            result.status === "rejected"
              ? `${resourceTitle(RESOURCES[index], locale)}: ${
                  result.reason instanceof Error
                    ? result.reason.message
                    : text(result.reason)
                }`
              : "",
          )
          .filter(Boolean);

        if (failed.length === results.length) {
          throw new Error(failed[0] || t.errorDesc);
        }

        const payload = (index: number): unknown =>
          results[index]?.status === "fulfilled"
            ? (results[index] as PromiseFulfilledResult<unknown>).value
            : {};

        const employeePayload = payload(0);
        const attendancePayload = payload(1);
        const leavePayload = payload(2);

        const nextRows = Object.fromEntries(
          RESOURCES.map((key, index) => [
            key,
            list(payload(index))
              .map((item) => normalize(key, item))
              .filter((item) => item.id),
          ]),
        ) as Record<Resource, HrRow[]>;

        const employeeSummary = summary(employeePayload);
        const attendanceSummary = summary(attendancePayload);

        setRows(nextRows);
        setStats({
          employees: count(employeePayload),
          active: numberValue(
            employeeSummary.active ?? employeeSummary.active_count,
            nextRows.employees.filter((row) => row.status === "ACTIVE").length,
          ),
          openAttendance: numberValue(
            attendanceSummary.open_records ?? attendanceSummary.open_count,
            nextRows.attendance.filter(
              (row) =>
                row.status === "OPEN" || row.status === "MISSING_CHECK_OUT",
            ).length,
          ),
          pendingLeave: nextRows.leave.filter(
            (row) => !TERMINAL_LEAVE.has(row.status),
          ).length,
        });
        setWarnings(failed);

        if (silent) {
          if (failed.length) {
            toast.warning(t.partialTitle);
          } else {
            toast.success(t.refreshed);
          }
        }
      } catch (caught) {
        if (signal?.aborted) return;
        const message = caught instanceof Error ? caught.message : t.errorDesc;
        setError(message);
        if (silent) toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [locale, t.errorDesc, t.partialTitle, t.refreshed],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  const reset = React.useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setFrom("");
    setTo("");
    setSortKey("newest");
  }, []);

  const currentRows = rows[resource];
  const statusOptions = React.useMemo(
    () => Array.from(new Set(currentRows.map((row) => row.status))).sort(),
    [currentRows],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return currentRows
      .filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        const rowDate = formatDate(row.date);
        if (from && (rowDate === "—" || rowDate < from)) return false;
        if (to && (rowDate === "—" || rowDate > to)) return false;
        if (!needle) return true;
        return Object.values(row).join(" ").toLowerCase().includes(needle);
      })
      .sort((left, right) => {
        if (sortKey === "oldest") return dateValue(left.date) - dateValue(right.date);
        if (sortKey === "name") return left.title.localeCompare(right.title, locale);
        if (sortKey === "status") {
          return statusLabel(left.status, locale).localeCompare(
            statusLabel(right.status, locale),
            locale,
          );
        }
        return dateValue(right.date) - dateValue(left.date);
      });
  }, [currentRows, from, locale, search, sortKey, statusFilter, to]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    Boolean(from) ||
    Boolean(to) ||
    sortKey !== "newest";

  const exportExcel = React.useCallback(() => {
    if (!filtered.length) {
      toast.warning(t.excelEmpty);
      return;
    }
    const body = filtered
      .map(
        (row) => `<tr>
<td>${escapeHtml(row.number)}</td>
<td>${escapeHtml(row.title)}</td>
<td>${escapeHtml(row.subtitle)}</td>
<td>${escapeHtml(row.scope)}</td>
<td>${escapeHtml(statusLabel(row.status, locale))}</td>
<td>${escapeHtml(formatDate(row.date))}</td>
<td>${escapeHtml(row.amount === null ? row.metric : formatDecimal(row.amount))}</td>
</tr>`,
      )
      .join("");
    const html = `<!doctype html><html dir="${dir}" lang="${locale}"><head>
<meta charset="UTF-8"><style>body{font-family:Tahoma,Arial;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:7px;text-align:${locale === "ar" ? "right" : "left"}}th{background:#ececec}</style>
</head><body><h1>${escapeHtml(`${t.report} ${resourceTitle(resource, locale)}`)}</h1>
<table><thead><tr><th>${t.number}</th><th>${t.record}</th><th>${t.details}</th><th>${t.scope}</th><th>${t.status}</th><th>${t.date}</th><th>${t.value}</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
    const blob = new Blob(["\uFEFF", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hr-${resource}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t.excelReady);
  }, [dir, filtered, locale, resource, t]);

  const print = React.useCallback(async () => {
    if (!filtered.length) {
      toast.warning(t.printEmpty);
      return;
    }
    const rowsHtml = filtered
      .map(
        (row) => `<tr>
<td>${escapeHtml(row.number)}</td>
<td>${escapeHtml(row.title)}</td>
<td>${escapeHtml(row.subtitle)}</td>
<td>${escapeHtml(row.scope)}</td>
<td>${escapeHtml(statusLabel(row.status, locale))}</td>
<td>${escapeHtml(formatDate(row.date))}</td>
<td>${escapeHtml(row.amount === null ? row.metric : formatDecimal(row.amount))}</td>
</tr>`,
      )
      .join("");
    const opened = await openPrintReport({
      locale,
      title: `${t.report} ${resourceTitle(resource, locale)}`,
      subtitle: resourceDescription(resource, locale),
      recordsCount: filtered.length,
      tableHtml: `<table><thead><tr><th>${t.number}</th><th>${t.record}</th><th>${t.details}</th><th>${t.scope}</th><th>${t.status}</th><th>${t.date}</th><th>${t.value}</th></tr></thead><tbody>${rowsHtml}</tbody></table>`,
    });
    if (opened) {
      toast.success(t.printReady);
    } else {
      toast.error(t.printBlocked);
    }
  }, [filtered, locale, resource, t]);

  if (loading) return <LoadingPage />;

  if (error && !RESOURCES.some((key) => rows[key].length)) {
    return (
      <main dir={dir} className="min-h-screen bg-transparent px-4 py-6">
        <Card className="mx-auto max-w-3xl rounded-lg shadow-none">
          <CardHeader className="text-center">
            <CardTitle>{t.errorTitle}</CardTitle>
            <CardDescription>{t.errorDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => void load(true)}>
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const ResourceIcon = resourceIcon(resource);

  return (
    <main
      dir={dir}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#9a7139]">
              <Sparkles className="h-4 w-4" />
              {t.module}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
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
              onClick={exportExcel}
             variant="outline" className={registerOutlineButtonClass}>
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button onClick={() => void print()} variant="brand" className={registerBrandButtonClass}>
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>

        {warnings.length ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t.partialTitle}</p>
                <p className="mt-1 text-sm opacity-80">{t.partialDesc}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.totalEmployees}
            value={stats.employees}
            description={t.totalEmployeesDesc}
            icon={Users}
            href="/system/hr?view=employees"
          />
          <SystemKpiCard
            title={t.activeEmployees}
            value={stats.active}
            description={t.activeEmployeesDesc}
            icon={UserCheck}
            href="/system/hr?view=employees"
          />
          <SystemKpiCard
            title={t.openAttendance}
            value={stats.openAttendance}
            description={t.openAttendanceDesc}
            icon={Clock3}
            href="/system/hr?view=attendance"
          />
          <SystemKpiCard
            title={t.pendingLeave}
            value={stats.pendingLeave}
            description={t.pendingLeaveDesc}
            icon={ClipboardList}
            href="/system/hr?view=leave"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {RESOURCES.map((item) => {
            const Icon = resourceIcon(item);
            const active = item === resource;
            return (
              <Button
                key={item}
                variant={active ? "brand" : "outline"}
                className={cn("h-9 shadow-none", !active && registerOutlineButtonClass)}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setResource(item);
                  reset();
                  const url = new URL(window.location.href);
                  url.searchParams.set("view", item);
                  window.history.replaceState({}, "", url);
                }}
              >
                <Icon className="h-4 w-4" />
                {resourceTitle(item, locale)}
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                  {formatInteger(rows[item].length)}
                </span>
              </Button>
            );
          })}
        </div>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ResourceIcon className="h-4 w-4 text-[#a57b3d]" />
                      {resourceTitle(resource, locale)}
                    </CardTitle>
                    <CardDescription className="mt-1 leading-6">
                      {resourceDescription(resource, locale)}
                    </CardDescription>
                  </div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={exportExcel}
                   variant="outline" className={registerOutlineButtonClass}>
                    <FileSpreadsheet className="h-4 w-4" />
                    {t.excel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void print()}
                   variant="brand" className={registerBrandButtonClass}>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {statusOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {statusLabel(item, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DataRegisterDatePicker
                label={t.from}
                value={from}
                onChange={setFrom}
                locale={locale}
              />
              <DataRegisterDatePicker
                label={t.to}
                value={to}
                onChange={setTo}
                locale={locale}
              />
              <Select
                value={sortKey}
                onValueChange={(value: string) => setSortKey(value as SortKey)}
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[155px]">
                  <ArrowUpDown className="me-2 h-4 w-4 text-[#a57b3d]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.newest}</SelectItem>
                  <SelectItem value="oldest">{t.oldest}</SelectItem>
                  <SelectItem value="name">{t.nameSort}</SelectItem>
                  <SelectItem value="status">{t.statusSort}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </Button>
            </DataRegisterToolbar>

            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <Table variant="register" className="min-w-[1050px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[135px]">{t.number}</TableHead>
                      <TableHead className="w-[220px]">{t.record}</TableHead>
                      <TableHead className="w-[220px]">{t.details}</TableHead>
                      <TableHead className="w-[185px]">{t.scope}</TableHead>
                      <TableHead className="w-[135px]">{t.status}</TableHead>
                      <TableHead className="w-[135px]">{t.date}</TableHead>
                      <TableHead className="w-[145px]">{t.value}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length ? (
                      filtered.map((row) => (
                        <TableRow key={`${row.resource}-${row.id}`}>
                          <TableCell className="font-medium">{row.number}</TableCell>
                          <TableCell>
                            <span className="block truncate font-semibold">
                              {row.title}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block truncate text-muted-foreground">
                              {row.subtitle}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block truncate">{row.scope}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={badgeClass(row.status)}
                            >
                              {statusLabel(row.status, locale)}
                            </Badge>
                          </TableCell>
                          <TableCell dir="ltr" className="tabular-nums">
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell>
                            {row.amount === null ? (
                              <span dir="ltr" className="tabular-nums">
                                {row.metric}
                              </span>
                            ) : (
                              <Money value={row.amount} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <DataRegisterEmptyState
                            title={currentRows.length ? t.noResults : t.noData}
                            description={
                              currentRows.length ? t.noResultsDesc : t.noDataDesc
                            }
                            showReset={currentRows.length > 0 && hasFilters}
                            onReset={reset}
                            resetLabel={t.reset}
                            icon={resourceIcon(resource)}
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
                {t.showing} <strong>{formatInteger(filtered.length)}</strong>{" "}
                {t.of} <strong>{formatInteger(currentRows.length)}</strong>{" "}
                {t.rows}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                {t.connected}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
