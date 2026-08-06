"use client";
// appointments_waiting_list_hr_spirit=true
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
  ListOrdered,
  Loader2,
  MoreVertical,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { AppointmentCenterTabs } from "@/components/system/appointment-center-tabs";
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
type ApiResponse = ApiRecord | ApiRecord[];
type QueueStatus =
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS";
type StatusFilter = "all" | QueueStatus;
type SortKey = "queue" | "appointment";
type AppointmentRecord = {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  practitionerName: string;
  serviceName: string;
  branchName: string;
  departmentName: string;
  clinicName: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkedInAt: string;
  startedAt: string;
  status: string;
};
type QueueViewRow = AppointmentRecord & {
  queuePosition: number | null;
};
type TransitionTarget = {
  appointment: AppointmentRecord;
  nextStatus: QueueStatus | "COMPLETED";
};
type DataColumn<T> = {
  key: string;
  label: string;
  className?: string;
  sticky?: "start" | "end";
  align?: "start" | "center" | "end";
  render: (row: T) => React.ReactNode;
};
const APPOINTMENTS_ENDPOINT =
  "/api/company/medical/appointments/";
const QUEUE_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
] as const;
const translations = {
  ar: {
    badge: "الإدارة المركزية",
    title: "قائمة الانتظار",
    subtitle:
      "متابعة المرضى المتوقع وصولهم والحاضرين وقيد الجلسة عبر دورة المواعيد الطبية الحقيقية.",
    connected:
      "متصل بواجهات المواعيد وقائمة الانتظار الحقيقية",
    centerTab: "مركز المواعيد",
    calendarTab: "تقويم المواعيد",
    waitingTab: "قائمة الانتظار",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    addAppointment: "إضافة موعد",
    reset: "إعادة ضبط",
    total: "إجمالي القائمة",
    expected: "بانتظار الوصول",
    waiting: "في الانتظار",
    inProgress: "قيد الجلسة",
    totalDesc: "جميع الحالات التشغيلية لليوم المحدد",
    expectedDesc: "مواعيد مؤكدة لم يسجل أصحابها الوصول",
    waitingDesc: "مرضى سجلوا الوصول وينتظرون بدء الجلسة",
    inProgressDesc: "مرضى بدأت جلساتهم الطبية",
    registerTitle: "سجل قائمة الانتظار",
    registerDesc:
      "سجل تشغيلي لمتابعة ترتيب المرضى ووقت الموعد ومدة الانتظار وحالة الجلسة.",
    searchPlaceholder:
      "ابحث بالمريض أو رقم الموعد أو الممارس أو الخدمة...",
    allStatuses: "كل الحالات",
    queueOrder: "ترتيب قائمة الانتظار",
    appointmentOrder: "وقت الموعد",
    queueNumber: "الترتيب",
    patient: "المريض",
    appointment: "الموعد",
    practitionerService: "الممارس / الخدمة",
    location: "الموقع",
    waitingTime: "مدة الانتظار",
    status: "الحالة",
    actions: "الإجراءات",
    openDetails: "فتح التفاصيل",
    checkIn: "تسجيل الوصول",
    startSession: "بدء الجلسة",
    completeSession: "إكمال الجلسة",
    confirmAction: "تأكيد الإجراء",
    confirmActionDesc:
      "سيتم تحديث حالة الموعد وفق دورة التشغيل الطبية المعتمدة.",
    currentStatus: "الحالة الحالية",
    nextStatus: "الحالة الجديدة",
    cancel: "إلغاء",
    confirm: "تأكيد",
    confirmed: "بانتظار الوصول",
    checkedIn: "في الانتظار",
    inSession: "قيد الجلسة",
    completed: "مكتمل",
    notArrived: "لم يصل بعد",
    justNow: "أقل من دقيقة",
    minute: "دقيقة",
    minutes: "دقيقة",
    hour: "ساعة",
    hours: "ساعة",
    noDataTitle: "لا توجد حالات في قائمة الانتظار",
    noDataDesc:
      "لا توجد مواعيد مؤكدة أو مرضى مسجل وصولهم أو جلسات قيد التنفيذ في التاريخ المحدد.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDesc:
      "غيّر البحث أو الحالة أو التاريخ لعرض سجلات أخرى.",
    loadingError: "تعذر تحميل قائمة الانتظار",
    loadingErrorDesc:
      "تأكد من تسجيل الدخول وتشغيل الباكند ثم أعد المحاولة.",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل القائمة جزئيًا",
    partialDesc:
      "تم تجاهل بعض السجلات التي لا تحتوي على بيانات موعد صالحة.",
    refreshed: "تم تحديث قائمة الانتظار.",
    statusUpdated: "تم تحديث حالة الموعد.",
    statusFailed: "تعذر تحديث حالة الموعد.",
    excelEmpty: "لا توجد بيانات للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد بيانات للطباعة.",
    printReady: "تم تجهيز تقرير قائمة الانتظار.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    showing: "عرض",
    of: "من",
    rows: "سجلات",
    unknown: "غير محدد",
  },
  en: {
    badge: "Central administration",
    title: "Waiting List",
    subtitle:
      "Track expected, checked-in, and in-session patients through the real medical appointment lifecycle.",
    connected:
      "Connected to live appointment and waiting-list APIs",
    centerTab: "Appointments center",
    calendarTab: "Appointments calendar",
    waitingTab: "Waiting list",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    addAppointment: "Add appointment",
    reset: "Reset",
    total: "Total queue",
    expected: "Expected arrival",
    waiting: "Waiting",
    inProgress: "In session",
    totalDesc: "All operational cases for the selected day",
    expectedDesc: "Confirmed appointments not checked in yet",
    waitingDesc: "Checked-in patients waiting for their session",
    inProgressDesc: "Patients whose medical sessions have started",
    registerTitle: "Waiting List Register",
    registerDesc:
      "Operational register for queue order, appointment time, waiting duration, and session status.",
    searchPlaceholder:
      "Search by patient, appointment, practitioner, or service...",
    allStatuses: "All statuses",
    queueOrder: "Queue order",
    appointmentOrder: "Appointment time",
    queueNumber: "Queue",
    patient: "Patient",
    appointment: "Appointment",
    practitionerService: "Practitioner / service",
    location: "Location",
    waitingTime: "Waiting time",
    status: "Status",
    actions: "Actions",
    openDetails: "Open details",
    checkIn: "Check in",
    startSession: "Start session",
    completeSession: "Complete session",
    confirmAction: "Confirm action",
    confirmActionDesc:
      "The appointment status will be updated through the approved medical lifecycle.",
    currentStatus: "Current status",
    nextStatus: "New status",
    cancel: "Cancel",
    confirm: "Confirm",
    confirmed: "Expected arrival",
    checkedIn: "Waiting",
    inSession: "In session",
    completed: "Completed",
    notArrived: "Not arrived",
    justNow: "Less than a minute",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    noDataTitle: "No patients in the waiting list",
    noDataDesc:
      "There are no confirmed, checked-in, or in-progress appointments on the selected date.",
    noResultsTitle: "No matching results",
    noResultsDesc:
      "Change the search, status, or date to show other records.",
    loadingError: "Could not load the waiting list",
    loadingErrorDesc:
      "Make sure you are signed in and the backend is running, then try again.",
    retry: "Try again",
    partialTitle: "Waiting list loaded partially",
    partialDesc:
      "Some records without valid appointment data were skipped.",
    refreshed: "Waiting list refreshed.",
    statusUpdated: "Appointment status updated.",
    statusFailed: "Appointment status could not be updated.",
    excelEmpty: "There is no data to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There is no data to print.",
    printReady: "Waiting list report prepared.",
    printBlocked: "The print window could not be opened.",
    showing: "Showing",
    of: "of",
    rows: "records",
    unknown: "Unknown",
  },
} as const;
function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "ar";
  }
  return window.localStorage.getItem(
    "primey-locale",
  ) === "en"
    ? "en"
    : "ar";
}
function apiBase() {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api")
    ? value.slice(0, -4)
    : value;
}
function apiUrl(
  path: string,
  params?: URLSearchParams,
) {
  const query = params?.toString();
  return `${apiBase()}${path}${
    query ? `?${query}` : ""
  }`;
}
function isRecord(
  value: unknown,
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function text(
  value: unknown,
  fallback = "",
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }
  return String(value).trim() || fallback;
}
function relatedLabel(value: unknown) {
  if (typeof value === "string") {
    return text(value);
  }
  const record = asRecord(value);
  for (const key of [
    "full_name",
    "display_name",
    "name",
    "title",
    "label",
    "code",
    "number",
  ]) {
    const label = text(record[key]);
    if (label) {
      return label;
    }
  }
  return "";
}
function extractArray(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (
    !isRecord(payload) ||
    depth > 5
  ) {
    return [];
  }
  const candidates = [
    payload.appointments,
    payload.results,
    payload.items,
    payload.records,
    payload.rows,
    payload.data,
    payload.result,
    payload.payload,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    const nested = extractArray(
      candidate,
      depth + 1,
    );
    if (nested.length) {
      return nested;
    }
  }
  return [];
}
function extractItem(payload: unknown) {
  const record = asRecord(payload);
  for (const key of [
    "item",
    "appointment",
    "data",
    "result",
  ]) {
    if (isRecord(record[key])) {
      return record[key];
    }
  }
  return payload;
}
function extractError(
  payload: unknown,
  fallback: string,
) {
  const record = asRecord(payload);
  return (
    text(record.message) ||
    text(record.detail) ||
    text(record.error) ||
    fallback
  );
}
function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(
        /[.$?*|{}()[\]\\/+^]/g,
        "\\$&",
      )}=([^;]*)`,
    ),
  );
  return match
    ? decodeURIComponent(match[1] || "")
    : "";
}
async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  params?: URLSearchParams,
): Promise<T> {
  const method = String(
    init.method || "GET",
  ).toUpperCase();
  const headers = new Headers(
    init.headers || {},
  );
  headers.set(
    "Accept",
    "application/json",
  );
  headers.set(
    "X-Requested-With",
    "XMLHttpRequest",
  );
  if (
    method !== "GET" &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }
  if (method !== "GET") {
    const csrfToken =
      getCookie("csrftoken");
    if (csrfToken) {
      headers.set(
        "X-CSRFToken",
        csrfToken,
      );
    }
  }
  const response = await fetch(
    apiUrl(path, params),
    {
      ...init,
      method,
      credentials: "include",
      cache: "no-store",
      headers,
    },
  );
  const contentType =
    response.headers.get(
      "content-type",
    ) || "";
  const rawText =
    await response.text();
  let payload: unknown = {};
  if (
    rawText &&
    contentType.includes(
      "application/json",
    )
  ) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    throw new Error(
      extractError(
        payload,
        `HTTP ${response.status}`,
      ),
    );
  }
  return payload as T;
}
function isQueueStatus(
  value: string,
): value is QueueStatus {
  return (
    QUEUE_STATUSES as readonly string[]
  ).includes(value);
}
function normalizeAppointment(
  value: unknown,
): AppointmentRecord | null {
  const record = asRecord(value);
  const id = text(
    record.id ||
      record.pk ||
      record.uuid,
  );
  const scheduledStart = text(
    record.scheduled_start ||
      record.start_at ||
      record.starts_at,
  );
  const parsedStart = new Date(
    scheduledStart,
  );
  if (
    !id ||
    !scheduledStart ||
    Number.isNaN(
      parsedStart.getTime(),
    )
  ) {
    return null;
  }
  const patient = asRecord(
    record.patient,
  );
  const practitioner = asRecord(
    record.practitioner,
  );
  const branch = asRecord(
    record.branch,
  );
  const department = asRecord(
    record.department,
  );
  const clinic = asRecord(
    record.clinic,
  );
  const serviceAssignment = asRecord(
    record.practitioner_service_assignment,
  );
  const serviceOffering = asRecord(
    serviceAssignment.service_offering,
  );
  return {
    id,
    appointmentNumber:
      text(
        record.appointment_number ||
          record.number,
      ) || `#${id}`,
    patientId:
      text(record.patient_id) ||
      text(patient.id),
    patientName:
      text(record.patient_name) ||
      relatedLabel(patient),
    practitionerName:
      text(
        record.practitioner_name_snapshot,
      ) ||
      text(record.practitioner_name) ||
      relatedLabel(practitioner),
    serviceName:
      text(
        record.service_name_snapshot,
      ) ||
      text(record.service_name) ||
      relatedLabel(serviceOffering) ||
      relatedLabel(serviceAssignment),
    branchName:
      text(record.branch_name) ||
      relatedLabel(branch),
    departmentName:
      text(record.department_name) ||
      relatedLabel(department),
    clinicName:
      text(record.clinic_name) ||
      relatedLabel(clinic),
    scheduledStart,
    scheduledEnd: text(
      record.scheduled_end ||
        record.end_at ||
        record.ends_at,
    ),
    checkedInAt: text(
      record.checked_in_at,
    ),
    startedAt: text(
      record.started_at,
    ),
    status: text(
      record.status,
      "CONFIRMED",
    ).toUpperCase(),
  };
}
function parseDate(value: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
}
function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayKey() {
  return dateKey(new Date());
}
function parseDateKey(value: string) {
  const parts = value
    .split("-")
    .map(Number);
  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        !Number.isFinite(part),
    )
  ) {
    return new Date();
  }
  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    0,
    0,
    0,
    0,
  );
}
function dayRange(value: string) {
  const start = parseDateKey(value);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    23,
    59,
    59,
    999,
  );
  return {
    start,
    end,
  };
}
function localeCode(locale: Locale) {
  return locale === "ar"
    ? "ar-SA-u-nu-latn"
    : "en-GB";
}
function formatDate(
  value: string,
  locale: Locale,
) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "—";
  }
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(parsed);
}
function formatTime(
  value: string,
  locale: Locale,
) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "—";
  }
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(parsed);
}
function formatInteger(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(value);
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  const t = translations[locale];
  if (status === "CONFIRMED") {
    return t.confirmed;
  }
  if (status === "CHECKED_IN") {
    return t.checkedIn;
  }
  if (status === "IN_PROGRESS") {
    return t.inSession;
  }
  if (status === "COMPLETED") {
    return t.completed;
  }
  return status || "—";
}
function statusBadgeClass(
  status: string,
) {
  if (status === "CONFIRMED") {
    return (
      "border-blue-200 " +
      "bg-blue-50 text-blue-700"
    );
  }
  if (status === "CHECKED_IN") {
    return (
      "border-amber-200 " +
      "bg-amber-50 text-amber-700"
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      "border-violet-200 " +
      "bg-violet-50 text-violet-700"
    );
  }
  if (status === "COMPLETED") {
    return (
      "border-emerald-200 " +
      "bg-emerald-50 text-emerald-700"
    );
  }
  return (
    "border-slate-200 " +
    "bg-slate-50 text-slate-700"
  );
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
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs",
        statusBadgeClass(status),
      )}
    >
      {statusLabel(
        status,
        locale,
      )}
    </Badge>
  );
}
function locationLabel(
  row: AppointmentRecord,
  fallback: string,
) {
  return [
    row.branchName,
    row.departmentName,
    row.clinicName,
  ]
    .filter(Boolean)
    .join(" / ") || fallback;
}
function nextStatusFor(
  status: string,
): QueueStatus | "COMPLETED" | null {
  if (status === "CONFIRMED") {
    return "CHECKED_IN";
  }
  if (status === "CHECKED_IN") {
    return "IN_PROGRESS";
  }
  if (status === "IN_PROGRESS") {
    return "COMPLETED";
  }
  return null;
}
function transitionLabel(
  nextStatus: string,
  locale: Locale,
) {
  const t = translations[locale];
  if (nextStatus === "CHECKED_IN") {
    return t.checkIn;
  }
  if (nextStatus === "IN_PROGRESS") {
    return t.startSession;
  }
  if (nextStatus === "COMPLETED") {
    return t.completeSession;
  }
  return statusLabel(
    nextStatus,
    locale,
  );
}
function waitingMinutes(
  row: AppointmentRecord,
  now: Date,
) {
  if (row.status === "CONFIRMED") {
    return null;
  }
  const checkedIn =
    parseDate(row.checkedInAt) ||
    parseDate(row.scheduledStart);
  if (!checkedIn) {
    return null;
  }
  const end =
    row.status === "IN_PROGRESS"
      ? parseDate(row.startedAt) || now
      : now;
  return Math.max(
    0,
    Math.floor(
      (
        end.getTime() -
        checkedIn.getTime()
      ) /
        60000,
    ),
  );
}
function durationLabel(
  minutes: number | null,
  locale: Locale,
) {
  const t = translations[locale];
  if (minutes === null) {
    return t.notArrived;
  }
  if (minutes < 1) {
    return t.justNow;
  }
  if (minutes < 60) {
    return `${formatInteger(
      minutes,
    )} ${
      minutes === 1
        ? t.minute
        : t.minutes
    }`;
  }
  const hours = Math.floor(
    minutes / 60,
  );
  const remainder =
    minutes % 60;
  const hourText = `${formatInteger(
    hours,
  )} ${
    hours === 1
      ? t.hour
      : t.hours
  }`;
  if (!remainder) {
    return hourText;
  }
  return `${hourText} ${formatInteger(
    remainder,
  )} ${t.minutes}`;
}
function queueSortTime(
  row: AppointmentRecord,
) {
  return (
    parseDate(row.checkedInAt)?.getTime() ||
    parseDate(
      row.scheduledStart,
    )?.getTime() ||
    0
  );
}
function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function buildTableHtml(
  rows: QueueViewRow[],
  locale: Locale,
  now: Date,
) {
  const t = translations[locale];
  const body = rows
    .map(
      (row) => `
        <tr>
          <td>${
            row.queuePosition
              ? escapeHtml(
                  row.queuePosition,
                )
              : "—"
          }</td>
          <td>${escapeHtml(
            row.patientName ||
              t.unknown,
          )}</td>
          <td>${escapeHtml(
            row.appointmentNumber,
          )}</td>
          <td>${escapeHtml(
            `${formatDate(
              row.scheduledStart,
              locale,
            )} ${formatTime(
              row.scheduledStart,
              locale,
            )}`,
          )}</td>
          <td>${escapeHtml(
            row.practitionerName ||
              t.unknown,
          )}</td>
          <td>${escapeHtml(
            row.serviceName ||
              t.unknown,
          )}</td>
          <td>${escapeHtml(
            locationLabel(
              row,
              t.unknown,
            ),
          )}</td>
          <td>${escapeHtml(
            durationLabel(
              waitingMinutes(
                row,
                now,
              ),
              locale,
            ),
          )}</td>
          <td>${escapeHtml(
            statusLabel(
              row.status,
              locale,
            ),
          )}</td>
        </tr>
      `,
    )
    .join("");
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(
            t.queueNumber,
          )}</th>
          <th>${escapeHtml(
            t.patient,
          )}</th>
          <th>${escapeHtml(
            t.appointment,
          )}</th>
          <th>${escapeHtml(
            t.appointmentOrder,
          )}</th>
          <th>${escapeHtml(
            t.practitionerService,
          )}</th>
          <th>${escapeHtml(
            t.registerTitle,
          )}</th>
          <th>${escapeHtml(
            t.location,
          )}</th>
          <th>${escapeHtml(
            t.waitingTime,
          )}</th>
          <th>${escapeHtml(
            t.status,
          )}</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
function downloadExcel(
  rows: QueueViewRow[],
  locale: Locale,
  now: Date,
  selectedDate: string,
) {
  const t = translations[locale];
  const direction =
    locale === "ar"
      ? "rtl"
      : "ltr";
  const documentHtml = `
    <!doctype html>
    <html
      dir="${direction}"
      lang="${locale}"
    >
      <head>
        <meta charset="UTF-8" />
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 14px;
            color: #111827;
            direction: ${direction};
            font-family: Tahoma, Arial, sans-serif;
            font-size: 11px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 22px;
          }
          p {
            margin: 0 0 16px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #000000;
            padding: 7px;
            text-align: start;
            vertical-align: middle;
            mso-number-format: "\\@";
          }
          th {
            background: #e5e7eb;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(
          t.title,
        )}</h1>
        <p>${escapeHtml(
          selectedDate,
        )}</p>
        ${buildTableHtml(
          rows,
          locale,
          now,
        )}
      </body>
    </html>
  `;
  const blob = new Blob(
    ["\uFEFF", documentHtml],
    {
      type:
        "application/vnd.ms-excel;charset=utf-8;",
    },
  );
  const url =
    URL.createObjectURL(blob);
  const anchor =
    document.createElement("a");
  anchor.href = url;
  anchor.download =
    `marilyn-waiting-list-${selectedDate}.xls`;
  document.body.appendChild(
    anchor,
  );
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
export function AppointmentsWaitingListClient() {
  const router = useRouter();
  const [locale, setLocale] =
    React.useState<Locale>(
      getInitialLocale,
    );
  const [selectedDate, setSelectedDate] =
    React.useState(todayKey);
  const [rows, setRows] =
    React.useState<
      AppointmentRecord[]
    >([]);
  const [search, setSearch] =
    React.useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = React.useState<StatusFilter>(
    "all",
  );
  const [sort, setSort] =
    React.useState<SortKey>(
      "queue",
    );
  const [loading, setLoading] =
    React.useState(true);
  const [
    refreshing,
    setRefreshing,
  ] = React.useState(false);
  const [error, setError] =
    React.useState("");
  const [skipped, setSkipped] =
    React.useState(0);
  const [
    transitionTarget,
    setTransitionTarget,
  ] = React.useState<
    TransitionTarget | null
  >(null);
  const [actionId, setActionId] =
    React.useState("");
  const [now, setNow] =
    React.useState(
      () => new Date(),
    );
  const t = translations[locale];
  React.useEffect(() => {
    const updateLocale = () => {
      setLocale(
        getInitialLocale(),
      );
    };
    updateLocale();
    window.addEventListener(
      "primey-locale-changed",
      updateLocale,
    );
    window.addEventListener(
      "storage",
      updateLocale,
    );
    return () => {
      window.removeEventListener(
        "primey-locale-changed",
        updateLocale,
      );
      window.removeEventListener(
        "storage",
        updateLocale,
      );
    };
  }, []);
  React.useEffect(() => {
    const interval =
      window.setInterval(() => {
        setNow(new Date());
      }, 60000);
    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);
  const loadQueue =
    React.useCallback(
      async (
        notify = false,
      ) => {
        if (notify) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        setSkipped(0);
        try {
          const range =
            dayRange(
              selectedDate,
            );
          const params =
            new URLSearchParams({
              page: "1",
              page_size: "250",
              scheduled_from:
                range.start.toISOString(),
              scheduled_to:
                range.end.toISOString(),
            });
          const payload =
            await requestJson<ApiResponse>(
              APPOINTMENTS_ENDPOINT,
              {
                method: "GET",
              },
              params,
            );
          const rawRows =
            extractArray(payload);
          const normalizedRows =
            rawRows
              .map(
                normalizeAppointment,
              )
              .filter(
                (
                  item,
                ): item is AppointmentRecord =>
                  item !== null,
              );
          const queueRows =
            normalizedRows.filter(
              (row) =>
                isQueueStatus(
                  row.status,
                ),
            );
          setRows(queueRows);
          setSkipped(
            Math.max(
              rawRows.length -
                normalizedRows.length,
              0,
            ),
          );
          setNow(new Date());
          if (notify) {
            toast.success(
              t.refreshed,
            );
          }
        } catch (caughtError) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : t.loadingErrorDesc;
          setRows([]);
          setError(message);
          if (notify) {
            toast.error(message);
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        selectedDate,
        t.loadingErrorDesc,
        t.refreshed,
      ],
    );
  React.useEffect(() => {
    void loadQueue();
  }, [loadQueue]);
  const stats =
    React.useMemo(
      () => ({
        total: rows.length,
        expected: rows.filter(
          (row) =>
            row.status ===
            "CONFIRMED",
        ).length,
        waiting: rows.filter(
          (row) =>
            row.status ===
            "CHECKED_IN",
        ).length,
        inProgress: rows.filter(
          (row) =>
            row.status ===
            "IN_PROGRESS",
        ).length,
      }),
      [rows],
    );
  const queuePositions =
    React.useMemo(() => {
      const map = new Map<
        string,
        number
      >();
      rows
        .filter(
          (row) =>
            row.status ===
            "CHECKED_IN",
        )
        .sort(
          (left, right) =>
            queueSortTime(left) -
            queueSortTime(right),
        )
        .forEach(
          (row, index) => {
            map.set(
              row.id,
              index + 1,
            );
          },
        );
      return map;
    }, [rows]);
  const filteredRows =
    React.useMemo<
      QueueViewRow[]
    >(() => {
      const query = search
        .trim()
        .toLowerCase();
      const nextRows =
        rows.filter((row) => {
          if (
            statusFilter !==
              "all" &&
            row.status !==
              statusFilter
          ) {
            return false;
          }
          if (!query) {
            return true;
          }
          return [
            row.appointmentNumber,
            row.patientId,
            row.patientName,
            row.practitionerName,
            row.serviceName,
            row.branchName,
            row.departmentName,
            row.clinicName,
            row.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
      const sortedRows = [
        ...nextRows,
      ].sort(
        (left, right) => {
          if (
            sort ===
            "appointment"
          ) {
            return (
              (
                parseDate(
                  left.scheduledStart,
                )?.getTime() || 0
              ) -
              (
                parseDate(
                  right.scheduledStart,
                )?.getTime() || 0
              )
            );
          }
          const priorities:
            Record<string, number> =
              {
                CHECKED_IN: 0,
                IN_PROGRESS: 1,
                CONFIRMED: 2,
              };
          const priorityDifference =
            (
              priorities[
                left.status
              ] ?? 9
            ) -
            (
              priorities[
                right.status
              ] ?? 9
            );
          if (
            priorityDifference
          ) {
            return (
              priorityDifference
            );
          }
          return (
            queueSortTime(left) -
            queueSortTime(right)
          );
        },
      );
      return sortedRows.map(
        (row) => ({
          ...row,
          queuePosition:
            queuePositions.get(
              row.id,
            ) || null,
        }),
      );
    }, [
      queuePositions,
      rows,
      search,
      sort,
      statusFilter,
    ]);
  const hasFilters = Boolean(
    search ||
      statusFilter !==
        "all" ||
      sort !== "queue" ||
      selectedDate !==
        todayKey(),
  );
  const resetFilters =
    React.useCallback(() => {
      setSearch("");
      setStatusFilter("all");
      setSort("queue");
      setSelectedDate(
        todayKey(),
      );
    }, []);
  const updateStatus =
    React.useCallback(
      async (
        appointment:
          AppointmentRecord,
        nextStatus:
          QueueStatus |
          "COMPLETED",
      ) => {
        try {
          setActionId(
            appointment.id,
          );
          const payload =
            await requestJson<ApiResponse>(
              `${APPOINTMENTS_ENDPOINT}${encodeURIComponent(
                appointment.id,
              )}/status/`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  status: nextStatus,
                }),
              },
            );
          const normalized =
            normalizeAppointment(
              extractItem(payload),
            );
          if (!normalized) {
            await loadQueue();
          } else {
            setRows(
              (current) => {
                if (
                  !isQueueStatus(
                    normalized.status,
                  )
                ) {
                  return current.filter(
                    (row) =>
                      row.id !==
                      appointment.id,
                  );
                }
                const exists =
                  current.some(
                    (row) =>
                      row.id ===
                      normalized.id,
                  );
                if (!exists) {
                  return [
                    ...current,
                    normalized,
                  ];
                }
                return current.map(
                  (row) =>
                    row.id ===
                    normalized.id
                      ? normalized
                      : row,
                );
              },
            );
          }
          setNow(new Date());
          setTransitionTarget(null);
          toast.success(
            t.statusUpdated,
          );
        } catch (caughtError) {
          toast.error(
            caughtError instanceof Error
              ? caughtError.message
              : t.statusFailed,
          );
        } finally {
          setActionId("");
        }
      },
      [
        loadQueue,
        t.statusFailed,
        t.statusUpdated,
      ],
    );
  const exportExcel =
    React.useCallback(() => {
      if (!filteredRows.length) {
        toast.warning(
          t.excelEmpty,
        );
        return;
      }
      downloadExcel(
        filteredRows,
        locale,
        now,
        selectedDate,
      );
      toast.success(
        t.excelReady,
      );
    }, [
      filteredRows,
      locale,
      now,
      selectedDate,
      t.excelEmpty,
      t.excelReady,
    ]);
  const printQueue =
    React.useCallback(
      async () => {
        if (
          !filteredRows.length
        ) {
          toast.warning(
            t.printEmpty,
          );
          return;
        }
        const opened =
          await openPrintReport({
            locale,
            title: t.title,
            subtitle:
              selectedDate,
            tableHtml:
              buildTableHtml(
                filteredRows,
                locale,
                now,
              ),
            recordsCount:
              filteredRows.length,
          });
        if (!opened) {
          toast.error(
            t.printBlocked,
          );
          return;
        }
        toast.success(
          t.printReady,
        );
      },
      [
        filteredRows,
        locale,
        now,
        selectedDate,
        t.printBlocked,
        t.printEmpty,
        t.printReady,
        t.title,
      ],
    );
  const columns =
    React.useMemo<
      DataColumn<QueueViewRow>[]
    >(
      () => [
        {
          key: "queue",
          label: t.queueNumber,
          className: "w-[110px]",
          sticky: "start",
          align: "center",
          render: (row) => (
            <span
              dir="ltr"
              lang="en"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border font-semibold tabular-nums",
                row.queuePosition
                  ? "border-[#cbbda9]/55 bg-[#fbf8f2] text-[#9a7139]"
                  : "border-muted bg-muted/30 text-muted-foreground",
              )}
            >
              {row.queuePosition
                ? formatInteger(
                    row.queuePosition,
                  )
                : "—"}
            </span>
          ),
        },
        {
          key: "patient",
          label: t.patient,
          className: "w-[230px]",
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {row.patientName ||
                  t.unknown}
              </p>
              <p
                dir="ltr"
                lang="en"
                className="mt-1 truncate text-xs text-muted-foreground tabular-nums"
              >
                {row.patientId
                  ? `#${row.patientId}`
                  : "—"}
              </p>
            </div>
          ),
        },
        {
          key: "appointment",
          label: t.appointment,
          className: "w-[200px]",
          render: (row) => (
            <div className="min-w-0">
              <p
                dir="ltr"
                lang="en"
                className="truncate font-mono text-sm font-semibold tabular-nums"
              >
                {row.appointmentNumber}
              </p>
              <p
                dir="ltr"
                lang="en"
                className="mt-1 truncate text-xs text-muted-foreground tabular-nums"
              >
                {formatDate(
                  row.scheduledStart,
                  locale,
                )}
                {" • "}
                {formatTime(
                  row.scheduledStart,
                  locale,
                )}
              </p>
            </div>
          ),
        },
        {
          key: "service",
          label:
            t.practitionerService,
          className: "w-[280px]",
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.practitionerName ||
                  t.unknown}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {row.serviceName ||
                  t.unknown}
              </p>
            </div>
          ),
        },
        {
          key: "location",
          label: t.location,
          className: "w-[230px]",
          render: (row) => (
            <span className="block truncate text-sm text-muted-foreground">
              {locationLabel(
                row,
                t.unknown,
              )}
            </span>
          ),
        },
        {
          key: "waiting",
          label: t.waitingTime,
          className: "w-[170px]",
          render: (row) => (
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 shrink-0 text-[#a57b3d]" />
              <span
                dir="ltr"
                lang={
                  locale === "ar"
                    ? "ar"
                    : "en"
                }
                className="text-sm font-medium tabular-nums"
              >
                {durationLabel(
                  waitingMinutes(
                    row,
                    now,
                  ),
                  locale,
                )}
              </span>
            </div>
          ),
        },
        {
          key: "status",
          label: t.status,
          className: "w-[160px]",
          render: (row) => (
            <StatusBadge
              status={row.status}
              locale={locale}
            />
          ),
        },
        {
          key: "actions",
          label: t.actions,
          className: "w-[92px]",
          sticky: "end",
          align: "center",
          render: (row) => {
            const nextStatus =
              nextStatusFor(
                row.status,
              );
            return (
              <div
                className="flex items-center justify-center"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={
                        t.actions
                      }
                      disabled={
                        actionId ===
                        row.id
                      }
                    >
                      {actionId ===
                      row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={
                      locale === "ar"
                        ? "start"
                        : "end"
                    }
                    className="w-52"
                  >
                    <DropdownMenuItem
                      onSelect={() =>
                        router.push(
                          `/system/appointments/${encodeURIComponent(
                            row.id,
                          )}`,
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t.openDetails}
                    </DropdownMenuItem>
                    {nextStatus ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            setTransitionTarget(
                              {
                                appointment:
                                  row,
                                nextStatus,
                              },
                            )
                          }
                        >
                          {nextStatus ===
                          "CHECKED_IN" ? (
                            <UserRound className="h-4 w-4" />
                          ) : nextStatus ===
                            "IN_PROGRESS" ? (
                            <CircleDot className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {transitionLabel(
                            nextStatus,
                            locale,
                          )}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          },
        },
      ],
      [
        actionId,
        locale,
        now,
        router,
        t.actions,
        t.appointment,
        t.location,
        t.openDetails,
        t.patient,
        t.practitionerService,
        t.queueNumber,
        t.status,
        t.unknown,
        t.waitingTime,
      ],
    );
  return (
    <main
      dir={
        locale === "ar"
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <Sparkles className="h-3.5 w-3.5" />
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
              {t.connected}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={
                registerOutlineButtonClass
              }
              disabled={refreshing}
              onClick={() =>
                void loadQueue(true)
              }
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
              className={
                registerOutlineButtonClass
              }
              onClick={
                exportExcel
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={() =>
                void printQueue()
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={() =>
                router.push(
                  "/system/appointments",
                )
              }
            >
              <Plus className="h-4 w-4" />
              {t.addAppointment}
            </Button>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.total}
            value={
              loading
                ? "—"
                : stats.total
            }
            description={
              t.totalDesc
            }
            icon={UsersRound}
          />
          <SystemKpiCard
            title={t.expected}
            value={
              loading
                ? "—"
                : stats.expected
            }
            description={
              t.expectedDesc
            }
            icon={CalendarClock}
          />
          <SystemKpiCard
            title={t.waiting}
            value={
              loading
                ? "—"
                : stats.waiting
            }
            description={
              t.waitingDesc
            }
            icon={Clock3}
          />
          <SystemKpiCard
            title={t.inProgress}
            value={
              loading
                ? "—"
                : stats.inProgress
            }
            description={
              t.inProgressDesc
            }
            icon={CircleDot}
          />
        </section>
        <AppointmentCenterTabs
          active="waiting-list"
          locale={locale}
          counts={{
            "waiting-list": stats.total,
          }}
        />
        {skipped > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {t.partialTitle}
              </p>
              <p className="mt-1 text-xs">
                {t.partialDesc}
                {" "}
                (
                <span
                  dir="ltr"
                  lang="en"
                  className="tabular-nums"
                >
                  {formatInteger(
                    skipped,
                  )}
                </span>
                )
              </p>
            </div>
          </div>
        ) : null}
        {error ? (
          <Card className="rounded-lg border-rose-200 bg-rose-50/70 shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="font-semibold text-rose-800">
                    {t.loadingError}
                  </p>
                  <p className="mt-1 text-sm text-rose-700">
                    {error}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void loadQueue()
                }
              >
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <ListOrdered className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.registerDesc}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={
                    exportExcel
                  }
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.excel}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className={
                    registerBrandButtonClass
                  }
                  onClick={() =>
                    void printQueue()
                  }
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <DataRegisterSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={
                    t.searchPlaceholder
                  }
                  className="w-full sm:w-[360px]"
                />
                <Select
                  value={
                    statusFilter
                  }
                  onValueChange={(
                    value,
                  ) =>
                    setStatusFilter(
                      value as StatusFilter,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.allStatuses}
                    </SelectItem>
                    <SelectItem value="CONFIRMED">
                      {t.confirmed}
                    </SelectItem>
                    <SelectItem value="CHECKED_IN">
                      {t.checkedIn}
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      {t.inSession}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <DataRegisterDatePicker
                  label={
                    t.appointmentOrder
                  }
                  value={
                    selectedDate
                  }
                  onChange={
                    setSelectedDate
                  }
                  locale={locale}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sort}
                  onValueChange={(
                    value,
                  ) =>
                    setSort(
                      value as SortKey,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[190px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queue">
                      {t.queueOrder}
                    </SelectItem>
                    <SelectItem value="appointment">
                      {t.appointmentOrder}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={
                    resetFilters
                  }
                  disabled={
                    !hasFilters
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.reset}
                </Button>
              </div>
            </DataRegisterToolbar>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <Table
                  variant="register"
                  layout="fixed"
                  minWidth="1470px"
                >
                  <TableHeader>
                    <TableRow>
                      {columns.map(
                        (column) => (
                          <TableHead
                            key={
                              column.key
                            }
                            sticky={
                              column.sticky
                            }
                            contentAlign={
                              column.align
                            }
                            className={
                              column.className
                            }
                          >
                            {column.label}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({
                        length: 6,
                      }).map(
                        (_, index) => (
                          <TableRow
                            key={
                              index
                            }
                          >
                            <TableCell
                              colSpan={
                                columns.length
                              }
                              className="h-16"
                            >
                              <Skeleton className="h-8 w-full rounded-md" />
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    ) : filteredRows.length ? (
                      filteredRows.map(
                        (row) => (
                          <TableRow
                            key={
                              row.id
                            }
                            interactive
                            onClick={(
                              event,
                            ) => {
                              const target =
                                event.target as HTMLElement;
                              if (
                                target.closest(
                                  "button, a, input, select, textarea, [role='menuitem']",
                                )
                              ) {
                                return;
                              }
                              router.push(
                                `/system/appointments/${encodeURIComponent(
                                  row.id,
                                )}`,
                              );
                            }}
                          >
                            {columns.map(
                              (
                                column,
                              ) => (
                                <TableCell
                                  key={
                                    column.key
                                  }
                                  sticky={
                                    column.sticky
                                  }
                                  contentAlign={
                                    column.align
                                  }
                                  className={cn(
                                    "overflow-hidden",
                                    column.className,
                                  )}
                                >
                                  {column.render(
                                    row,
                                  )}
                                </TableCell>
                              ),
                            )}
                          </TableRow>
                        ),
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={
                            columns.length
                          }
                          className="h-72"
                        >
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
                            showReset={
                              hasFilters
                            }
                            onReset={
                              resetFilters
                            }
                            resetLabel={
                              t.reset
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {t.showing}
              {" "}
              <span
                dir="ltr"
                lang="en"
                className="font-medium text-foreground tabular-nums"
              >
                {formatInteger(
                  filteredRows.length,
                )}
              </span>
              {" "}
              {t.of}
              {" "}
              <span
                dir="ltr"
                lang="en"
                className="font-medium text-foreground tabular-nums"
              >
                {formatInteger(
                  rows.length,
                )}
              </span>
              {" "}
              {t.rows}
            </div>
          </CardContent>
        </Card>
        <AlertDialog
          open={Boolean(
            transitionTarget,
          )}
          onOpenChange={(
            open,
          ) => {
            if (
              !open &&
              !actionId
            ) {
              setTransitionTarget(
                null,
              );
            }
          }}
        >
          <AlertDialogContent
            dir={
              locale === "ar"
                ? "rtl"
                : "ltr"
            }
          >
            <AlertDialogHeader className="text-start">
              <AlertDialogTitle>
                {t.confirmAction}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.confirmActionDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {transitionTarget ? (
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.currentStatus}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={
                        transitionTarget
                          .appointment
                          .status
                      }
                      locale={
                        locale
                      }
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.nextStatus}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={
                        transitionTarget
                          .nextStatus
                      }
                      locale={
                        locale
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                disabled={
                  Boolean(
                    actionId,
                  )
                }
              >
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={
                  !transitionTarget ||
                  Boolean(
                    actionId,
                  )
                }
                onClick={(
                  event,
                ) => {
                  event.preventDefault();
                  if (
                    !transitionTarget
                  ) {
                    return;
                  }
                  void updateStatus(
                    transitionTarget
                      .appointment,
                    transitionTarget
                      .nextStatus,
                  );
                }}
              >
                {actionId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {t.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
