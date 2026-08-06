"use client";
/* ============================================================
   📂 marilyn_frontend/app/system/page.tsx
   🧠 Marilyn Clinics — Central Administration Dashboard
   ------------------------------------------------------------
   ✅ Single medical establishment with multiple branches
   ✅ Real medical APIs only
   ✅ No companies, plans, subscriptions, or platform payments
   ✅ Unified gold / frosted Marilyn design
   ✅ Arabic / English
   ✅ English digits
   ✅ Partial API loading
   ✅ Excel / print
============================================================ */
import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSpreadsheet,
  HeartPulse,
  Loader2,
  Printer,
  RefreshCw,
  Route,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
type AppointmentRecord = {
  id: string;
  number: string;
  patient: string;
  practitioner: string;
  branch: string;
  clinic: string;
  scheduledStart: string | null;
  status: string;
};
type PatientRecord = {
  id: string;
  createdAt: string | null;
};
type PractitionerRecord = {
  id: string;
  status: string;
};
type EncounterRecord = {
  id: string;
  status: string;
};
type ReferralRecord = {
  id: string;
  status: string;
};
type EndpointState = {
  key: string;
  titleAr: string;
  titleEn: string;
  path: string;
  ok: boolean;
  message: string;
};
type KpiItem = {
  title: string;
  value: number | null;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};
const ENDPOINTS = {
  summary: "/api/company/medical/summary/",
  appointments: "/api/company/medical/appointments/",
  patients: "/api/company/medical/patients/",
  practitioners: "/api/company/medical/practitioners/",
  encounters: "/api/company/medical/encounters/",
  referrals: "/api/company/medical/referrals/",
} as const;
const translations = {
  ar: {
    badge: "الإدارة المركزية",
    title: "لوحة الإدارة المركزية",
    subtitle:
      "مركز الإشراف على عمليات Marilyn Clinics الطبية والتشغيلية عبر جميع الفروع.",
    selectedDate: "تاريخ المتابعة",
    refresh: "تحديث",
    export: "تصدير Excel",
    print: "طباعة الكل",
    partialTitle: "تم تحميل بعض بيانات اللوحة فقط",
    partialDescription:
      "تعذر الوصول إلى بعض واجهات النظام، لذلك تعرض اللوحة البيانات المتاحة دون إنشاء أرقام بديلة.",
    loadErrorTitle: "تعذر تحميل لوحة الإدارة المركزية",
    loadErrorDescription:
      "تأكد من تسجيل الدخول واختيار المنشأة وتشغيل الباكند ثم أعد المحاولة.",
    tryAgain: "إعادة المحاولة",
    branches: "الفروع",
    departments: "الأقسام الطبية",
    clinics: "العيادات",
    appointments: "مواعيد اليوم",
    waiting: "في الانتظار",
    completed: "مكتملة اليوم",
    practitioners: "الممارسون النشطون",
    patients: "إجمالي المرضى",
    branchesDescription: "فروع المنشأة المتاحة من ملخص البنية الطبية",
    departmentsDescription: "الأقسام الطبية المسجلة",
    clinicsDescription: "العيادات المسجلة",
    appointmentsDescription: "المواعيد المسجلة في التاريخ المحدد",
    waitingDescription: "مرضى وصلوا أو ينتظرون الخدمة",
    completedDescription: "المواعيد المكتملة في التاريخ المحدد",
    practitionersDescription: "الممارسون المتاحون للتشغيل",
    patientsDescription: "إجمالي ملفات المرضى المتاحة",
    todayOperations: "تشغيل المواعيد",
    todayOperationsDescription:
      "المواعيد المرتبطة بالتاريخ المحدد مع المريض والممارس والفرع والحالة.",
    openAppointments: "فتح مركز المواعيد",
    noAppointments: "لا توجد مواعيد في التاريخ المحدد.",
    number: "رقم الموعد",
    patient: "المريض",
    time: "الوقت",
    practitioner: "الممارس",
    branch: "الفرع",
    clinic: "العيادة",
    status: "الحالة",
    alerts: "التنبيهات التشغيلية",
    alertsDescription:
      "مؤشرات تحتاج متابعة إدارية أو طبية من البيانات المتاحة.",
    cancelledNoShow: "الإلغاء وعدم الحضور",
    openEncounters: "اللقاءات الطبية المفتوحة",
    pendingReferrals: "الإحالات المعلقة",
    newPatients: "المرضى الجدد",
    structure: "ملخص البنية الطبية",
    structureDescription:
      "حالة البنية الأساسية المتاحة من واجهة الملخص الطبي.",
    specialties: "التخصصات",
    systemSpecialties: "تخصصات النظام",
    activeDepartments: "الأقسام النشطة",
    activeClinics: "العيادات النشطة",
    health: "صحة الربط",
    healthDescription:
      "حالة اتصال لوحة الإدارة بواجهات النظام الطبية.",
    connected: "متصل",
    unavailable: "غير متاح",
    routeReady: "المسار يعمل",
    routeFailed: "تعذر الاتصال",
    refreshed: "تم تحديث لوحة الإدارة المركزية.",
    exportReady: "تم تجهيز ملف Excel.",
    printReady: "تم تجهيز صفحة الطباعة.",
    noExportData: "لا توجد بيانات مواعيد لتصديرها.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    unknown: "غير محدد",
    reportTitle: "تقرير لوحة الإدارة المركزية — Marilyn Clinics",
    generatedAt: "تم الإنشاء في",
  },
  en: {
    badge: "Central Administration",
    title: "Central Administration Dashboard",
    subtitle:
      "Central oversight of Marilyn Clinics medical and operational activity across all branches.",
    selectedDate: "Tracking date",
    refresh: "Refresh",
    export: "Export Excel",
    print: "Print all",
    partialTitle: "Some dashboard data could not be loaded",
    partialDescription:
      "Some APIs were unavailable, so the dashboard shows only real available data without fallback metrics.",
    loadErrorTitle: "Could not load the central dashboard",
    loadErrorDescription:
      "Make sure you are signed in, the organization is selected, and the backend is running.",
    tryAgain: "Try again",
    branches: "Branches",
    departments: "Medical departments",
    clinics: "Clinics",
    appointments: "Appointments today",
    waiting: "Waiting",
    completed: "Completed today",
    practitioners: "Active practitioners",
    patients: "Total patients",
    branchesDescription: "Organization branches returned by the medical summary",
    departmentsDescription: "Registered medical departments",
    clinicsDescription: "Registered clinics",
    appointmentsDescription: "Appointments on the selected date",
    waitingDescription: "Patients who arrived or are waiting",
    completedDescription: "Appointments completed on the selected date",
    practitionersDescription: "Practitioners available for operation",
    patientsDescription: "Total available patient records",
    todayOperations: "Appointment Operations",
    todayOperationsDescription:
      "Appointments on the selected date with patient, practitioner, branch, and status.",
    openAppointments: "Open appointments center",
    noAppointments: "No appointments exist on the selected date.",
    number: "Appointment",
    patient: "Patient",
    time: "Time",
    practitioner: "Practitioner",
    branch: "Branch",
    clinic: "Clinic",
    status: "Status",
    alerts: "Operational Alerts",
    alertsDescription:
      "Indicators that require administrative or medical attention.",
    cancelledNoShow: "Cancelled and no-show",
    openEncounters: "Open encounters",
    pendingReferrals: "Pending referrals",
    newPatients: "New patients",
    structure: "Medical Structure Summary",
    structureDescription:
      "Core medical structure returned by the medical summary API.",
    specialties: "Specialties",
    systemSpecialties: "System specialties",
    activeDepartments: "Active departments",
    activeClinics: "Active clinics",
    health: "Integration Health",
    healthDescription:
      "Connection status between the dashboard and medical APIs.",
    connected: "Connected",
    unavailable: "Unavailable",
    routeReady: "Route available",
    routeFailed: "Connection failed",
    refreshed: "Central dashboard refreshed.",
    exportReady: "Excel file prepared.",
    printReady: "Print page prepared.",
    noExportData: "There are no appointment records to export.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    unknown: "Unknown",
    reportTitle: "Marilyn Clinics Central Administration Report",
    generatedAt: "Generated at",
  },
} as const;
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
}
function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(
    text(value)
      .replace(/[٠-٩]/g, (digit) =>
        String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
      )
      .replace(/[۰-۹]/g, (digit) =>
        String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
      )
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : fallback;
}
function formatInteger(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}
function dateKey(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  const direct = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (direct) return direct[0];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayKey(): string {
  return dateKey(new Date().toISOString());
}
function formatTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const match = value.match(/\d{2}:\d{2}/);
    return match?.[0] || "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}
function reportDateTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
function normalizeStatus(value: unknown): string {
  return text(value, "UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}
function nestedName(
  value: unknown,
  keys = [
    "name",
    "full_name",
    "full_name_ar",
    "full_name_en",
    "display_name",
    "title",
  ],
): string {
  if (typeof value === "string") return text(value);
  const record = asRecord(value);
  for (const key of keys) {
    const candidate = text(record[key]);
    if (candidate) return candidate;
  }
  return "";
}
function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const visited = new Set<unknown>();
  const walk = (value: unknown, depth = 0): unknown[] => {
    if (Array.isArray(value)) return value;
    if (!isRecord(value) || depth > 7 || visited.has(value)) return [];
    visited.add(value);
    const record = value as ApiRecord;
    const candidates = [
      record.results,
      record.items,
      record.records,
      record.rows,
      record.data,
      record.result,
      record.payload,
      record.response,
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
  const root = asRecord(payload);
  const data = asRecord(root.data);
  return {
    ...asRecord(root.summary),
    ...asRecord(data.summary),
    ...data,
    ...root,
  };
}
function extractCount(payload: unknown): number {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const candidates = [
    root.count,
    root.total,
    root.total_count,
    data.count,
    data.total,
    data.total_count,
  ];
  for (const candidate of candidates) {
    const result = numberValue(candidate, Number.NaN);
    if (Number.isFinite(result)) return result;
  }
  return extractArray(payload).length;
}
function getApiBaseUrl(): string {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}
function makeApiUrl(path: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `${getApiBaseUrl()}${path}${query ? `?${query}` : ""}`;
}
async function fetchJson(
  path: string,
  params?: URLSearchParams,
  signal?: AbortSignal,
): Promise<unknown> {
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
  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(
      text(record.message) ||
        text(record.detail) ||
        text(record.error) ||
        `HTTP ${response.status}`,
    );
  }
  return payload;
}
function normalizeAppointment(value: unknown): AppointmentRecord {
  const record = asRecord(value);
  const start =
    text(
      record.scheduled_start ||
        record.appointment_start ||
        record.starts_at ||
        record.start_at ||
        record.datetime ||
        record.appointment_date,
    ) || null;
  return {
    id: text(record.id || record.pk || record.uuid),
    number: text(
      record.appointment_number ||
        record.number ||
        record.code ||
        record.reference ||
        record.id,
    ),
    patient:
      text(record.patient_name) ||
      nestedName(record.patient, [
        "full_name",
        "name",
        "full_name_ar",
        "full_name_en",
        "patient_number",
      ]),
    practitioner:
      text(record.practitioner_name_snapshot || record.practitioner_name) ||
      nestedName(record.practitioner),
    branch:
      text(record.branch_name) ||
      nestedName(record.branch, ["name", "branch_name", "display_name", "code"]),
    clinic:
      text(record.clinic_name) ||
      nestedName(record.clinic, ["name", "name_ar", "name_en", "code"]),
    scheduledStart: start,
    status: normalizeStatus(record.status || record.state),
  };
}
function normalizePatient(value: unknown): PatientRecord {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk || record.uuid),
    createdAt:
      text(record.created_at || record.created || record.registered_at) || null,
  };
}
function normalizePractitioner(value: unknown): PractitionerRecord {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk || record.uuid),
    status: normalizeStatus(
      record.status ?? record.state ?? record.is_active ?? "ACTIVE",
    ),
  };
}
function normalizeEncounter(value: unknown): EncounterRecord {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk || record.uuid),
    status: normalizeStatus(record.status || record.state),
  };
}
function normalizeReferral(value: unknown): ReferralRecord {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk || record.uuid),
    status: normalizeStatus(record.status || record.state),
  };
}
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en"
    ? "en"
    : "ar";
}
function parseDate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const result = new Date(year, month - 1, day);
  return Number.isNaN(result.getTime()) ? undefined : result;
}
function dateToKey(value?: Date): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function DateSelector({
  value,
  onChange,
  locale,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-[168px] justify-start bg-background shadow-none"
        >
          <CalendarDays className="h-4 w-4 text-[#a57b3d]" />
          <span className="text-xs text-muted-foreground">{label}</span>
          <span dir="ltr" className="tabular-nums">
            {value}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={locale === "ar" ? "end" : "start"}
      >
        <Calendar
          mode="single"
          selected={parseDate(value)}
          onSelect={(date: Date | undefined) => {
            const next = dateToKey(date);
            if (next) onChange(next);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
function statusLabel(status: string, locale: Locale): string {
  const labels: Record<string, { ar: string; en: string }> = {
    DRAFT: { ar: "مسودة", en: "Draft" },
    PENDING: { ar: "معلق", en: "Pending" },
    BOOKED: { ar: "محجوز", en: "Booked" },
    CONFIRMED: { ar: "مؤكد", en: "Confirmed" },
    ARRIVED: { ar: "وصل", en: "Arrived" },
    CHECKED_IN: { ar: "تم الاستقبال", en: "Checked in" },
    WAITING: { ar: "في الانتظار", en: "Waiting" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In progress" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
    DONE: { ar: "مكتمل", en: "Completed" },
    CANCELLED: { ar: "ملغي", en: "Cancelled" },
    CANCELED: { ar: "ملغي", en: "Cancelled" },
    NO_SHOW: { ar: "لم يحضر", en: "No show" },
    ACTIVE: { ar: "نشط", en: "Active" },
    INACTIVE: { ar: "غير نشط", en: "Inactive" },
    CLOSED: { ar: "مغلق", en: "Closed" },
  };
  const match = labels[status];
  if (match) return locale === "ar" ? match.ar : match.en;
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
function badgeClass(status: string): string {
  if (["COMPLETED", "DONE", "ACTIVE", "CONFIRMED"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "PENDING",
      "WAITING",
      "ARRIVED",
      "CHECKED_IN",
      "IN_PROGRESS",
      "BOOKED",
    ].includes(status)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (
    ["CANCELLED", "CANCELED", "NO_SHOW", "INACTIVE", "FAILED"].includes(
      status,
    )
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}
function StatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: Locale;
}) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap rounded-full ${badgeClass(status)}`}
    >
      {statusLabel(status, locale)}
    </Badge>
  );
}
function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon;
  return (
    <Card className="group overflow-hidden rounded-lg border bg-card shadow-none transition hover:-translate-y-0.5 hover:border-[#b58c4d]/35 hover:shadow-sm">
      <Link href={item.href} className="block h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="min-w-0">
            <CardDescription className="truncate text-sm">
              {item.title}
            </CardDescription>
            <CardTitle className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {formatInteger(item.value)}
            </CardTitle>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#cbbda9]/55 bg-white/70 text-[#a57b3d] shadow-sm transition group-hover:border-[#b58c4d]/40 group-hover:bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] group-hover:text-white dark:bg-white/[0.06]">
            <Icon className="h-5 w-5" />
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
function DashboardSkeleton() {
  return (
    <main className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="rounded-lg shadow-none">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <Skeleton className="h-[430px] w-full rounded-lg" />
          <Skeleton className="h-[430px] w-full rounded-lg" />
        </div>
      </div>
    </main>
  );
}
function escapeHtml(value: unknown): string {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
export default function SystemDashboardPage() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [selectedDate, setSelectedDate] = React.useState(todayKey());
  const [summaryPayload, setSummaryPayload] = React.useState<unknown>({});
  const [appointmentsPayload, setAppointmentsPayload] =
    React.useState<unknown>({});
  const [patientsPayload, setPatientsPayload] = React.useState<unknown>({});
  const [practitionersPayload, setPractitionersPayload] =
    React.useState<unknown>({});
  const [encountersPayload, setEncountersPayload] =
    React.useState<unknown>({});
  const [referralsPayload, setReferralsPayload] =
    React.useState<unknown>({});
  const [endpointStates, setEndpointStates] = React.useState<EndpointState[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  React.useEffect(() => {
    const syncLocale = () => {
      const next = getInitialLocale();
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.body.dir = next === "ar" ? "rtl" : "ltr";
    };
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("primey-locale-changed", syncLocale);
    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("primey-locale-changed", syncLocale);
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
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError("");
      const rowsParams = new URLSearchParams({
        page: "1",
        page_size: "500",
        ordering: "-created_at",
      });
      const sources = [
        {
          key: "summary",
          titleAr: "الملخص الطبي",
          titleEn: "Medical summary",
          path: ENDPOINTS.summary,
          params: undefined,
        },
        {
          key: "appointments",
          titleAr: "المواعيد",
          titleEn: "Appointments",
          path: ENDPOINTS.appointments,
          params: rowsParams,
        },
        {
          key: "patients",
          titleAr: "المرضى",
          titleEn: "Patients",
          path: ENDPOINTS.patients,
          params: rowsParams,
        },
        {
          key: "practitioners",
          titleAr: "الممارسون",
          titleEn: "Practitioners",
          path: ENDPOINTS.practitioners,
          params: rowsParams,
        },
        {
          key: "encounters",
          titleAr: "اللقاءات الطبية",
          titleEn: "Encounters",
          path: ENDPOINTS.encounters,
          params: rowsParams,
        },
        {
          key: "referrals",
          titleAr: "الإحالات",
          titleEn: "Referrals",
          path: ENDPOINTS.referrals,
          params: rowsParams,
        },
      ];
      try {
        const results = await Promise.allSettled(
          sources.map((source) =>
            fetchJson(source.path, source.params, signal),
          ),
        );
        if (signal?.aborted) return;
        const fulfilledCount = results.filter(
          (result) => result.status === "fulfilled",
        ).length;
        if (!fulfilledCount) {
          const firstError = results.find(
            (result): result is PromiseRejectedResult =>
              result.status === "rejected",
          );
          throw new Error(
            firstError?.reason instanceof Error
              ? firstError.reason.message
              : t.loadErrorDescription,
          );
        }
        const payload = (index: number): unknown =>
          results[index]?.status === "fulfilled"
            ? (results[index] as PromiseFulfilledResult<unknown>).value
            : {};
        setSummaryPayload(payload(0));
        setAppointmentsPayload(payload(1));
        setPatientsPayload(payload(2));
        setPractitionersPayload(payload(3));
        setEncountersPayload(payload(4));
        setReferralsPayload(payload(5));
        const states = sources.map((source, index): EndpointState => {
          const result = results[index];
          return {
            key: source.key,
            titleAr: source.titleAr,
            titleEn: source.titleEn,
            path: source.path,
            ok: result?.status === "fulfilled",
            message:
              result?.status === "rejected"
                ? result.reason instanceof Error
                  ? result.reason.message
                  : t.routeFailed
                : t.routeReady,
          };
        });
        setEndpointStates(states);
        if (states.some((state) => !state.ok)) {
          toast.warning(t.partialTitle);
        } else if (silent) {
          toast.success(t.refreshed);
        }
      } catch (caughtError) {
        if (signal?.aborted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : t.loadErrorDescription,
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      t.loadErrorDescription,
      t.partialTitle,
      t.refreshed,
      t.routeFailed,
      t.routeReady,
    ],
  );
  React.useEffect(() => {
    const controller = new AbortController();
    void loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboard]);
  const summary = React.useMemo(
    () => extractSummary(summaryPayload),
    [summaryPayload],
  );
  const appointments = React.useMemo(
    () => extractArray(appointmentsPayload).map(normalizeAppointment),
    [appointmentsPayload],
  );
  const patients = React.useMemo(
    () => extractArray(patientsPayload).map(normalizePatient),
    [patientsPayload],
  );
  const practitioners = React.useMemo(
    () =>
      extractArray(practitionersPayload).map(normalizePractitioner),
    [practitionersPayload],
  );
  const encounters = React.useMemo(
    () => extractArray(encountersPayload).map(normalizeEncounter),
    [encountersPayload],
  );
  const referrals = React.useMemo(
    () => extractArray(referralsPayload).map(normalizeReferral),
    [referralsPayload],
  );
  const dayAppointments = React.useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            dateKey(appointment.scheduledStart) === selectedDate,
        )
        .sort((a, b) =>
          text(a.scheduledStart).localeCompare(text(b.scheduledStart)),
        ),
    [appointments, selectedDate],
  );
  const waitingStatuses = new Set([
    "WAITING",
    "ARRIVED",
    "CHECKED_IN",
  ]);
  const completedStatuses = new Set(["COMPLETED", "DONE"]);
  const cancelledStatuses = new Set([
    "CANCELLED",
    "CANCELED",
    "NO_SHOW",
    "NOSHOW",
  ]);
  const closedEncounterStatuses = new Set([
    "COMPLETED",
    "CLOSED",
    "CANCELLED",
    "CANCELED",
  ]);
  const pendingReferralStatuses = new Set([
    "PENDING",
    "DRAFT",
    "REQUESTED",
  ]);
  const branches = (() => {
    const candidates = [
      summary.active_branches,
      summary.branches,
      summary.branch_count,
      summary.total_branches,
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null) {
        return numberValue(candidate);
      }
    }
    return null;
  })();
  const departments = (() => {
    const candidates = [
      summary.departments,
      summary.active_departments,
      summary.department_count,
      summary.total_departments,
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null) {
        return numberValue(candidate);
      }
    }
    return null;
  })();
  const clinics = (() => {
    const candidates = [
      summary.clinics,
      summary.active_clinics,
      summary.clinic_count,
      summary.total_clinics,
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null) {
        return numberValue(candidate);
      }
    }
    return null;
  })();
  const activePractitioners = practitioners.filter(
    (item) => !["INACTIVE", "SUSPENDED", "ARCHIVED"].includes(item.status),
  ).length;
  const waitingAppointments = dayAppointments.filter((item) =>
    waitingStatuses.has(item.status),
  ).length;
  const completedAppointments = dayAppointments.filter((item) =>
    completedStatuses.has(item.status),
  ).length;
  const cancelledAppointments = dayAppointments.filter((item) =>
    cancelledStatuses.has(item.status),
  ).length;
  const openEncounters = encounters.filter(
    (item) => !closedEncounterStatuses.has(item.status),
  ).length;
  const pendingReferrals = referrals.filter((item) =>
    pendingReferralStatuses.has(item.status),
  ).length;
  const newPatients = patients.filter(
    (item) => dateKey(item.createdAt) === selectedDate,
  ).length;
  const totalPatients =
    extractCount(patientsPayload) || patients.length;
  const kpis: KpiItem[] = [
    {
      title: t.branches,
      value: branches,
      description: t.branchesDescription,
      href: "/system/branches",
      icon: Building2,
    },
    {
      title: t.departments,
      value: departments,
      description: t.departmentsDescription,
      href: "/system/medical-structure",
      icon: HeartPulse,
    },
    {
      title: t.clinics,
      value: clinics,
      description: t.clinicsDescription,
      href: "/system/medical-structure",
      icon: Stethoscope,
    },
    {
      title: t.appointments,
      value: dayAppointments.length,
      description: t.appointmentsDescription,
      href: "/system/appointments",
      icon: CalendarDays,
    },
    {
      title: t.waiting,
      value: waitingAppointments,
      description: t.waitingDescription,
      href: "/system/appointments/waiting-list",
      icon: Clock3,
    },
    {
      title: t.completed,
      value: completedAppointments,
      description: t.completedDescription,
      href: "/system/appointments",
      icon: CheckCircle2,
    },
    {
      title: t.practitioners,
      value: activePractitioners,
      description: t.practitionersDescription,
      href: "/system/practitioners",
      icon: Stethoscope,
    },
    {
      title: t.patients,
      value: totalPatients,
      description: t.patientsDescription,
      href: "/system/patients",
      icon: Users,
    },
  ];
  const exportAppointments = React.useCallback(() => {
    if (!dayAppointments.length) {
      toast.error(t.noExportData);
      return;
    }
    const rows = dayAppointments
      .map(
        (appointment) => `
          <tr>
            <td>${escapeHtml(appointment.number || "—")}</td>
            <td>${escapeHtml(appointment.patient || t.unknown)}</td>
            <td>${escapeHtml(formatTime(appointment.scheduledStart))}</td>
            <td>${escapeHtml(appointment.practitioner || "—")}</td>
            <td>${escapeHtml(appointment.branch || "—")}</td>
            <td>${escapeHtml(appointment.clinic || "—")}</td>
            <td>${escapeHtml(statusLabel(appointment.status, locale))}</td>
          </tr>
        `,
      )
      .join("");
    const html = `
      <!doctype html>
      <html dir="${dir}" lang="${locale}">
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Tahoma, Arial, sans-serif;
              direction: ${dir};
              padding: 12px;
            }
            h1, p {
              text-align: ${locale === "ar" ? "right" : "left"};
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #000;
              padding: 7px;
              text-align: ${locale === "ar" ? "right" : "left"};
              mso-number-format: "\\@";
            }
            th {
              background: #e5e7eb;
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(t.reportTitle)}</h1>
          <p>${escapeHtml(t.selectedDate)}: ${escapeHtml(selectedDate)}</p>
          <p>${escapeHtml(t.generatedAt)}: ${escapeHtml(reportDateTime())}</p>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t.number)}</th>
                <th>${escapeHtml(t.patient)}</th>
                <th>${escapeHtml(t.time)}</th>
                <th>${escapeHtml(t.practitioner)}</th>
                <th>${escapeHtml(t.branch)}</th>
                <th>${escapeHtml(t.clinic)}</th>
                <th>${escapeHtml(t.status)}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob(["\uFEFF", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-central-dashboard-${selectedDate}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t.exportReady);
  }, [dayAppointments, dir, locale, selectedDate, t]);
  const printDashboard = React.useCallback(async () => {
    const appointmentRows = dayAppointments.length
      ? dayAppointments
          .map(
            (appointment) => `
              <tr>
                <td>${escapeHtml(appointment.number || "—")}</td>
                <td>${escapeHtml(appointment.patient || t.unknown)}</td>
                <td>${escapeHtml(formatTime(appointment.scheduledStart))}</td>
                <td>${escapeHtml(appointment.practitioner || "—")}</td>
                <td>${escapeHtml(appointment.branch || "—")}</td>
                <td>${escapeHtml(statusLabel(appointment.status, locale))}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="6">${escapeHtml(t.noAppointments)}</td>
          </tr>
        `;
    const summaryRows = kpis
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(formatInteger(item.value))}</td>
            <td>${escapeHtml(item.description)}</td>
          </tr>
        `,
      )
      .join("");
    const tableHtml = `
      <section>
        <table>
          <tbody>
            ${summaryRows}
          </tbody>
        </table>
        <h2 style="margin: 18px 0 8px;">
          ${escapeHtml(t.todayOperations)}
        </h2>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(t.number)}</th>
              <th>${escapeHtml(t.patient)}</th>
              <th>${escapeHtml(t.time)}</th>
              <th>${escapeHtml(t.practitioner)}</th>
              <th>${escapeHtml(t.branch)}</th>
              <th>${escapeHtml(t.status)}</th>
            </tr>
          </thead>
          <tbody>
            ${appointmentRows}
          </tbody>
        </table>
      </section>
    `;
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: `${t.selectedDate}: ${selectedDate}`,
      tableHtml,
      recordsCount: dayAppointments.length,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  }, [dayAppointments, kpis, locale, selectedDate, t]);

  if (loading) {
    return <DashboardSkeleton />;
  }
  if (error) {
    return (
      <main
        dir={dir}
        className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
      >
        <Card className="mx-auto max-w-3xl rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <TriangleAlert className="h-7 w-7" />
            </span>
            <CardTitle>{t.loadErrorTitle}</CardTitle>
            <CardDescription>{t.loadErrorDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => void loadDashboard()}>
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  const hasWarnings = endpointStates.some((state) => !state.ok);
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
              {t.badge}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <Route className="h-3.5 w-3.5 text-[#a57b3d]" />
                <span>/system</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-[#a57b3d]" />
                {endpointStates.filter((state) => state.ok).length}
                /
                {endpointStates.length}
                {" "}
                {t.connected}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateSelector
              value={selectedDate}
              onChange={setSelectedDate}
              locale={locale}
              label={t.selectedDate}
            />
            <Button
              variant="outline"
              className="bg-background [&_svg]:text-[#a57b3d]"
              disabled={refreshing}
              onClick={() => void loadDashboard({ silent: true })}
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
              onClick={exportAppointments}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.export}
            </Button>
            <Button variant="brand" onClick={printDashboard}>
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>
        {hasWarnings ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {t.partialTitle}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {t.partialDescription}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <KpiCard key={item.title} item={item} />
          ))}
        </section>
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <Card className="min-w-0 rounded-lg border bg-card shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{t.todayOperations}</CardTitle>
                <CardDescription className="mt-1.5">
                  {t.todayOperationsDescription}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/system/appointments">
                  <CalendarDays className="h-4 w-4 text-[#a57b3d]" />
                  {t.openAppointments}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[940px] table-fixed">
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[125px] text-start">
                          {t.number}
                        </TableHead>
                        <TableHead className="w-[190px] text-start">
                          {t.patient}
                        </TableHead>
                        <TableHead className="w-[90px] text-start">
                          {t.time}
                        </TableHead>
                        <TableHead className="w-[175px] text-start">
                          {t.practitioner}
                        </TableHead>
                        <TableHead className="w-[145px] text-start">
                          {t.branch}
                        </TableHead>
                        <TableHead className="w-[145px] text-start">
                          {t.clinic}
                        </TableHead>
                        <TableHead className="w-[130px] text-start">
                          {t.status}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayAppointments.length ? (
                        dayAppointments.slice(0, 12).map((appointment) => (
                          <TableRow key={appointment.id || appointment.number}>
                            <TableCell
                              dir="ltr"
                              className="text-start font-medium tabular-nums"
                            >
                              {appointment.number || "—"}
                            </TableCell>
                            <TableCell className="truncate text-start font-medium">
                              {appointment.patient || t.unknown}
                            </TableCell>
                            <TableCell
                              dir="ltr"
                              className="text-start tabular-nums text-muted-foreground"
                            >
                              {formatTime(appointment.scheduledStart)}
                            </TableCell>
                            <TableCell className="truncate text-start text-muted-foreground">
                              {appointment.practitioner || "—"}
                            </TableCell>
                            <TableCell className="truncate text-start text-muted-foreground">
                              {appointment.branch || "—"}
                            </TableCell>
                            <TableCell className="truncate text-start text-muted-foreground">
                              {appointment.clinic || "—"}
                            </TableCell>
                            <TableCell className="text-start">
                              <StatusBadge
                                status={appointment.status}
                                locale={locale}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-56 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <CalendarDays className="h-5 w-5" />
                              </span>
                              <span>{t.noAppointments}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-5">
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader>
                <CardTitle>{t.alerts}</CardTitle>
                <CardDescription>
                  {t.alertsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    label: t.cancelledNoShow,
                    value: cancelledAppointments,
                    icon: CircleAlert,
                    href: "/system/appointments",
                  },
                  {
                    label: t.openEncounters,
                    value: openEncounters,
                    icon: HeartPulse,
                    href: "/system/clinical-operations",
                  },
                  {
                    label: t.pendingReferrals,
                    value: pendingReferrals,
                    icon: Activity,
                    href: "/system/clinical-operations",
                  },
                  {
                    label: t.newPatients,
                    value: newPatients,
                    icon: UserPlus,
                    href: "/system/patients",
                  },
                ].map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <Link
                      key={alert.label}
                      href={alert.href}
                      className="flex items-center gap-3 rounded-lg border bg-muted/15 px-3 py-3 transition hover:border-[#b58c4d]/30 hover:bg-[#f9f5ed]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#cbbda9]/55 bg-white text-[#a57b3d]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {alert.label}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {formatInteger(alert.value)}
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader>
                <CardTitle>{t.structure}</CardTitle>
                <CardDescription>
                  {t.structureDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: t.specialties,
                    value:
                      summary.specialties ??
                      summary.specialty_count ??
                      summary.total_specialties,
                  },
                  {
                    label: t.systemSpecialties,
                    value: summary.system_specialties,
                  },
                  {
                    label: t.activeDepartments,
                    value:
                      summary.active_departments ??
                      summary.departments,
                  },
                  {
                    label: t.activeClinics,
                    value: summary.active_clinics ?? summary.clinics,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border bg-muted/15 px-3 py-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {item.value === undefined || item.value === null
                        ? "—"
                        : formatInteger(numberValue(item.value))}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
        <Card className="rounded-lg border bg-card shadow-none">
          <CardHeader>
            <CardTitle>{t.health}</CardTitle>
            <CardDescription>{t.healthDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {endpointStates.map((state) => (
              <div
                key={state.key}
                className="flex items-center gap-3 rounded-lg border bg-muted/15 px-3 py-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    state.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {state.ok ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <TriangleAlert className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {locale === "ar" ? state.titleAr : state.titleEn}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {state.ok ? t.connected : t.unavailable}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    state.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }
                >
                  {state.ok ? t.connected : t.unavailable}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}