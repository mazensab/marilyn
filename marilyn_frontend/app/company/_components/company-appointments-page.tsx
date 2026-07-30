"use client";
/* ============================================================
   📂 marilyn_frontend/app/company/_components/company-appointments-page.tsx
   🩺 Marilyn Clinics — Company Appointments Center
   ------------------------------------------------------------
   ✅ Approved company list/detail design
   ✅ Internal @/components/ui only
   ✅ Real appointment APIs only
   ✅ Lifecycle status actions
   ✅ Cancellation reason confirmation
   ✅ Excel and web print
   ✅ RTL/LTR through primey-locale
   ✅ English digits and dates
   ✅ No external UI dependencies
============================================================ */
import * as React from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
  History,
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  TriangleAlert,
  UserRound,
  XCircle,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type ApiResponse = ApiRecord | ApiRecord[];
type SortKey = "newest" | "oldest";
type StatusFilter =
  | "all"
  | "DRAFT"
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
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
  status: string;
  allowedStatuses: string[];
  canReschedule: boolean;
  isTerminal: boolean;
  rescheduleCount: number;
  bookingMode: string;
  totalSlotMinutes: number;
  priceSnapshot: number;
  source: string;
  reason: string;
  notes: string;
  cancellationReason: string;
  confirmedAt: string;
  checkedInAt: string;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  noShowAt: string;
  createdAt: string;
  updatedAt: string;
};
type TransitionTarget = {
  appointment: AppointmentRecord;
  status: string;
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
const APPOINTMENTS_ENDPOINT =
  "/api/company/medical/appointments/";
const STATUS_VALUES = [
  "DRAFT",
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
const translations = {
  ar: {
    badge: "العمليات الطبية",
    title: "المواعيد والحجوزات",
    subtitle:
      "مركز تشغيل مواعيد المرضى ومتابعة الحجز من الجدولة والتأكيد حتى الحضور والإكمال أو الإلغاء.",
    detailTitle: "تفاصيل الموعد",
    detailSubtitle:
      "عرض بيانات الحجز والمريض والممارس والخدمة ودورة حياة الموعد.",
    back: "العودة إلى المواعيد",
    refresh: "تحديث",
    export: "تصدير Excel",
    print: "طباعة",
    reset: "إعادة ضبط",
    search: "بحث",
    searchPlaceholder:
      "ابحث برقم الموعد أو المريض أو الممارس أو الخدمة...",
    all: "الكل",
    from: "من تاريخ",
    to: "إلى تاريخ",
    newest: "الأحدث",
    oldest: "الأقدم",
    total: "إجمالي المواعيد",
    today: "مواعيد اليوم",
    upcoming: "المواعيد القادمة",
    awaiting: "بانتظار الإجراء",
    totalDesc: "جميع المواعيد المسجلة",
    todayDesc: "المواعيد المجدولة لليوم",
    upcomingDesc: "المواعيد القادمة غير النهائية",
    awaitingDesc: "مسودة أو مجدولة أو مؤكدة",
    tableTitle: "سجل المواعيد",
    tableDesc:
      "سجل تشغيلي لمتابعة المريض والممارس والخدمة والموعد والحالة.",
    appointment: "الموعد",
    patient: "المريض",
    practitioner: "الممارس",
    service: "الخدمة",
    schedule: "التاريخ والوقت",
    location: "الموقع",
    status: "الحالة",
    actions: "الإجراءات",
    openDetails: "فتح التفاصيل",
    moveTo: "نقل إلى",
    showing: "عرض",
    of: "من",
    rows: "صفوف",
    noDataTitle: "لا توجد مواعيد",
    noDataDesc:
      "لم يتم تسجيل مواعيد طبية للشركة حتى الآن.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDesc:
      "غيّر البحث أو الحالة أو الفترة الزمنية لعرض نتائج أخرى.",
    errorTitle: "تعذر تحميل المواعيد",
    errorDesc:
      "تأكد من تسجيل الدخول داخل مساحة الشركة وتشغيل الباكند ثم أعد المحاولة.",
    tryAgain: "إعادة المحاولة",
    partialTitle: "تم تحميل الصفحة جزئيًا",
    partialDesc:
      "تم تجاهل بعض السجلات التي لم تحتوِ على بيانات صالحة.",
    refreshed: "تم تحديث المواعيد.",
    exportEmpty: "لا توجد بيانات للتصدير.",
    exportSuccess: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد بيانات للطباعة.",
    printReady: "تم تجهيز صفحة الطباعة.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    generatedAt: "تم الإنشاء في",
    reportRows: "عدد السجلات",
    confirmTransition: "تأكيد انتقال الحالة",
    transitionDesc:
      "سيتم تحديث حالة الموعد وفق دورة الحياة الطبية المعتمدة.",
    currentStatus: "الحالة الحالية",
    nextStatus: "الحالة الجديدة",
    confirm: "تأكيد",
    cancel: "إلغاء",
    cancellationTitle: "إلغاء الموعد",
    cancellationDesc:
      "أدخل سبب الإلغاء ليتم حفظه مع وقت الإلغاء داخل سجل الموعد.",
    cancellationReason: "سبب الإلغاء",
    cancellationPlaceholder:
      "اكتب سبب إلغاء الموعد...",
    cancellationRequired: "سبب الإلغاء مطلوب.",
    statusUpdated: "تم تحديث حالة الموعد.",
    statusFailed: "تعذر تحديث حالة الموعد.",
    appointmentNumber: "رقم الموعد",
    start: "البداية",
    end: "النهاية",
    branch: "الفرع",
    department: "القسم",
    clinic: "العيادة",
    bookingMode: "نوع الحجز",
    slotDuration: "مدة الحجز",
    minutes: "دقيقة",
    rescheduleCount: "مرات إعادة الجدولة",
    canReschedule: "قابل لإعادة الجدولة",
    terminal: "حالة نهائية",
    yes: "نعم",
    no: "لا",
    visitReason: "سبب الزيارة",
    notes: "الملاحظات",
    lifecycle: "دورة حياة الموعد",
    lifecycleDesc:
      "الحالة الحالية والتوقيتات التشغيلية المسجلة.",
    availableActions: "الإجراءات المتاحة",
    availableActionsDesc:
      "الانتقالات المسموح بها من الحالة الحالية.",
    noActions: "لا توجد انتقالات أخرى متاحة.",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    confirmedAt: "وقت التأكيد",
    checkedInAt: "وقت الحضور",
    startedAt: "وقت بدء الجلسة",
    completedAt: "وقت الإكمال",
    cancelledAt: "وقت الإلغاء",
    noShowAt: "وقت عدم الحضور",
    price: "السعر المسجل",
    source: "مصدر الحجز",
    unknown: "غير محدد",
    loading: "جاري تحميل المواعيد...",
  },
  en: {
    badge: "Medical Operations",
    title: "Appointments & Reservations",
    subtitle:
      "Operate patient appointments and follow each booking from scheduling and confirmation through attendance, completion, or cancellation.",
    detailTitle: "Appointment Details",
    detailSubtitle:
      "View booking, patient, practitioner, service, and lifecycle information.",
    back: "Back to appointments",
    refresh: "Refresh",
    export: "Export Excel",
    print: "Print",
    reset: "Reset",
    search: "Search",
    searchPlaceholder:
      "Search by appointment, patient, practitioner, or service...",
    all: "All",
    from: "From date",
    to: "To date",
    newest: "Newest",
    oldest: "Oldest",
    total: "Total appointments",
    today: "Today's appointments",
    upcoming: "Upcoming appointments",
    awaiting: "Awaiting action",
    totalDesc: "All registered appointments",
    todayDesc: "Appointments scheduled today",
    upcomingDesc: "Upcoming non-terminal appointments",
    awaitingDesc: "Draft, scheduled, or confirmed",
    tableTitle: "Appointments Register",
    tableDesc:
      "Operational register for patients, practitioners, services, schedules, and statuses.",
    appointment: "Appointment",
    patient: "Patient",
    practitioner: "Practitioner",
    service: "Service",
    schedule: "Date & time",
    location: "Location",
    status: "Status",
    actions: "Actions",
    openDetails: "Open details",
    moveTo: "Move to",
    showing: "Showing",
    of: "of",
    rows: "rows",
    noDataTitle: "No appointments",
    noDataDesc:
      "No medical appointments have been registered yet.",
    noResultsTitle: "No matching results",
    noResultsDesc:
      "Change the search, status, or date range to show other results.",
    errorTitle: "Could not load appointments",
    errorDesc:
      "Make sure you are signed in to the company workspace and the backend is running, then try again.",
    tryAgain: "Try again",
    partialTitle: "Page loaded partially",
    partialDesc:
      "Some records without valid appointment data were skipped.",
    refreshed: "Appointments refreshed.",
    exportEmpty: "There is no data to export.",
    exportSuccess: "Excel file prepared.",
    printEmpty: "There is no data to print.",
    printReady: "Print page prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    generatedAt: "Generated at",
    reportRows: "Records",
    confirmTransition: "Confirm status transition",
    transitionDesc:
      "The appointment will move according to the approved medical lifecycle.",
    currentStatus: "Current status",
    nextStatus: "New status",
    confirm: "Confirm",
    cancel: "Cancel",
    cancellationTitle: "Cancel appointment",
    cancellationDesc:
      "Enter the cancellation reason. It will be stored with the cancellation time.",
    cancellationReason: "Cancellation reason",
    cancellationPlaceholder:
      "Enter the cancellation reason...",
    cancellationRequired: "Cancellation reason is required.",
    statusUpdated: "Appointment status updated.",
    statusFailed: "Appointment status could not be updated.",
    appointmentNumber: "Appointment number",
    start: "Start",
    end: "End",
    branch: "Branch",
    department: "Department",
    clinic: "Clinic",
    bookingMode: "Booking mode",
    slotDuration: "Slot duration",
    minutes: "minutes",
    rescheduleCount: "Reschedule count",
    canReschedule: "Can reschedule",
    terminal: "Terminal status",
    yes: "Yes",
    no: "No",
    visitReason: "Visit reason",
    notes: "Notes",
    lifecycle: "Appointment lifecycle",
    lifecycleDesc:
      "Current status and recorded operational timestamps.",
    availableActions: "Available actions",
    availableActionsDesc:
      "Transitions permitted from the current status.",
    noActions: "No further transitions are available.",
    createdAt: "Created at",
    updatedAt: "Updated at",
    confirmedAt: "Confirmed at",
    checkedInAt: "Checked in at",
    startedAt: "Started at",
    completedAt: "Completed at",
    cancelledAt: "Cancelled at",
    noShowAt: "No-show at",
    price: "Recorded price",
    source: "Booking source",
    unknown: "Unknown",
    loading: "Loading appointments...",
  },
} as const;
function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "ar";
  }
  return (
    window.localStorage.getItem(
      "primey-locale",
    ) === "en"
      ? "en"
      : "ar"
  );
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
function toEnglishDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String(
        digit.charCodeAt(0) -
          "٠".charCodeAt(0),
      ),
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(
        digit.charCodeAt(0) -
          "۰".charCodeAt(0),
      ),
    )
    .replaceAll("٫", ".")
    .replaceAll("٬", ",");
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
  return (
    toEnglishDigits(value).trim() ||
    fallback
  );
}
function numberValue(
  value: unknown,
  fallback = 0,
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }
  const parsed = Number(
    toEnglishDigits(value)
      .replaceAll(",", "")
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}
function boolValue(
  value: unknown,
  fallback = false,
) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  const normalized = text(value)
    .toLowerCase();
  if (
    [
      "true",
      "1",
      "yes",
      "active",
      "enabled",
    ].includes(normalized)
  ) {
    return true;
  }
  if (
    [
      "false",
      "0",
      "no",
      "inactive",
      "disabled",
    ].includes(normalized)
  ) {
    return false;
  }
  return fallback;
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
function extractError(
  payload: unknown,
  fallback: string,
) {
  const record = asRecord(payload);
  const direct =
    text(record.message) ||
    text(record.detail) ||
    text(record.error);
  if (direct) {
    return direct;
  }
  const errors = asRecord(record.errors);
  for (const value of Object.values(errors)) {
    if (
      Array.isArray(value) &&
      value.length
    ) {
      const first = text(value[0]);
      if (first) {
        return first;
      }
    }
    const nested = text(value);
    if (nested) {
      return nested;
    }
  }
  return fallback;
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
      payload = JSON.parse(
        rawText,
      ) as unknown;
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
function extractArray(
  payload: unknown,
): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  const visited = new Set<unknown>();
  const walk = (
    value: unknown,
    depth = 0,
  ): unknown[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (
      !isRecord(value) ||
      depth > 6 ||
      visited.has(value)
    ) {
      return [];
    }
    visited.add(value);
    for (const key of [
      "results",
      "items",
      "records",
      "rows",
      "data",
      "result",
      "appointments",
    ]) {
      const candidate = value[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
    for (const key of [
      "results",
      "items",
      "records",
      "rows",
      "data",
      "result",
    ]) {
      const nested = walk(
        value[key],
        depth + 1,
      );
      if (nested.length) {
        return nested;
      }
    }
    return [];
  };
  return walk(payload);
}
function extractItem(
  payload: unknown,
): unknown {
  const record = asRecord(payload);
  for (const key of [
    "item",
    "data",
    "result",
    "appointment",
  ]) {
    if (isRecord(record[key])) {
      return record[key];
    }
  }
  return payload;
}
function relatedLabel(value: unknown) {
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
    const valueText = text(record[key]);
    if (valueText) {
      return valueText;
    }
  }
  return "";
}
function formatInteger(value: unknown) {
  return toEnglishDigits(
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(
      Math.round(numberValue(value)),
    ),
  );
}
function formatMoney(value: unknown) {
  return toEnglishDigits(
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue(value)),
  );
}
function parseDate(value: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}
function isoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDate(value: string) {
  const parsed = parseDate(value);
  return parsed
    ? isoDate(parsed)
    : "—";
}
function formatDateTime(value: string) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "—";
  }
  return toEnglishDigits(
    new Intl.DateTimeFormat(
      "en-GB",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    ).format(parsed),
  );
}
function formatTime(value: string) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "—";
  }
  return toEnglishDigits(
    new Intl.DateTimeFormat(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    ).format(parsed),
  );
}
function reportDateTime() {
  const now = new Date();
  return (
    `${isoDate(now)} ` +
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}`
  );
}
function escapeHtml(value: unknown) {
  return toEnglishDigits(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    DRAFT: {
      ar: "مسودة",
      en: "Draft",
    },
    SCHEDULED: {
      ar: "مجدول",
      en: "Scheduled",
    },
    CONFIRMED: {
      ar: "مؤكد",
      en: "Confirmed",
    },
    CHECKED_IN: {
      ar: "تم الحضور",
      en: "Checked in",
    },
    IN_PROGRESS: {
      ar: "قيد التنفيذ",
      en: "In progress",
    },
    COMPLETED: {
      ar: "مكتمل",
      en: "Completed",
    },
    CANCELLED: {
      ar: "ملغى",
      en: "Cancelled",
    },
    NO_SHOW: {
      ar: "لم يحضر",
      en: "No show",
    },
  };
  return (
    labels[status]?.[locale] ||
    status ||
    "—"
  );
}
function statusBadgeClass(status: string) {
  if (status === "CONFIRMED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "CHECKED_IN") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
  if (status === "IN_PROGRESS") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (
    status === "CANCELLED" ||
    status === "NO_SHOW"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "SCHEDULED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function normalizeAppointment(
  value: unknown,
  locale: Locale,
): AppointmentRecord | null {
  const record = asRecord(value);
  const id = text(record.id);
  if (!id) {
    return null;
  }
  const patient = asRecord(record.patient);
  const practitioner = asRecord(
    record.practitioner,
  );
  const serviceAssignment = asRecord(
    record.practitioner_service_assignment,
  );
  const serviceOffering = asRecord(
    serviceAssignment.service_offering,
  );
  const patientName =
    relatedLabel(patient) ||
    text(record.patient_name);
  const practitionerName =
    relatedLabel(practitioner) ||
    text(
      record.practitioner_name_snapshot,
    );
  const serviceName =
    text(record.service_name_snapshot) ||
    relatedLabel(serviceOffering) ||
    relatedLabel(serviceAssignment);
  const allowedStatuses =
    Array.isArray(
      record.allowed_statuses,
    )
      ? record.allowed_statuses
          .map((item) =>
            text(item).toUpperCase(),
          )
          .filter(Boolean)
      : [];
  return {
    id,
    appointmentNumber:
      text(record.appointment_number) ||
      `#${id}`,
    patientId:
      text(record.patient_id),
    patientName:
      patientName ||
      translations[locale].unknown,
    practitionerName:
      practitionerName ||
      translations[locale].unknown,
    serviceName:
      serviceName ||
      translations[locale].unknown,
    branchName:
      relatedLabel(record.branch),
    departmentName:
      relatedLabel(record.department),
    clinicName:
      relatedLabel(record.clinic),
    scheduledStart:
      text(record.scheduled_start),
    scheduledEnd:
      text(record.scheduled_end),
    status:
      text(
        record.status,
        "SCHEDULED",
      ).toUpperCase(),
    allowedStatuses,
    canReschedule:
      boolValue(
        record.can_reschedule,
      ),
    isTerminal:
      boolValue(
        record.is_terminal,
      ),
    rescheduleCount:
      numberValue(
        record.reschedule_count,
      ),
    bookingMode:
      text(record.booking_mode),
    totalSlotMinutes:
      numberValue(
        record.total_slot_minutes,
      ),
    priceSnapshot:
      numberValue(
        record.price_snapshot,
      ),
    source:
      text(record.source),
    reason:
      text(record.reason),
    notes:
      text(record.notes),
    cancellationReason:
      text(
        record.cancellation_reason,
      ),
    confirmedAt:
      text(record.confirmed_at),
    checkedInAt:
      text(record.checked_in_at),
    startedAt:
      text(record.started_at),
    completedAt:
      text(record.completed_at),
    cancelledAt:
      text(record.cancelled_at),
    noShowAt:
      text(record.no_show_at),
    createdAt:
      text(record.created_at),
    updatedAt:
      text(record.updated_at),
  };
}
function appointmentHref(
  appointment: AppointmentRecord,
) {
  return `/company/appointments/${encodeURIComponent(
    appointment.id,
  )}`;
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
  const [open, setOpen] =
    React.useState(false);
  const selected = value
    ? new Date(`${value}T12:00:00`)
    : undefined;
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          title={label}
          className="h-9 w-full justify-start bg-background px-3 text-start font-normal shadow-none sm:w-[150px]"
        >
          <CalendarDays className="me-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span
            dir="ltr"
            lang="en"
            className="truncate tabular-nums"
          >
            {value || label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={
          locale === "ar"
            ? "end"
            : "start"
        }
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(
              date
                ? isoDate(date)
                : "",
            );
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
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
function KpiCard({
  title,
  value,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <Card className="group overflow-hidden rounded-lg border bg-card shadow-none transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="min-w-0">
            <CardDescription className="truncate text-sm">
              {title}
            </CardDescription>
            <CardTitle className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {formatInteger(value)}
            </CardTitle>
          </div>
          <span className="rounded-lg border bg-background p-2.5 text-muted-foreground transition group-hover:border-foreground/20 group-hover:text-foreground">
            <Icon className="h-5 w-5" />
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Card
            key={index}
            className="rounded-lg border bg-card shadow-none"
          >
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
      <Card className="rounded-lg border bg-card shadow-none">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
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
  showReset: boolean;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-muted p-4 text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {showReset ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}
function DataTable<T extends { id: string }>({
  rows,
  allRowsCount,
  columns,
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
  rowHref: (row: T) => string;
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
                {columns.map(
                  (column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        "h-11 whitespace-nowrap px-4 text-start text-xs font-semibold text-muted-foreground",
                        column.className,
                      )}
                    >
                      {column.label}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => {
                  const href =
                    rowHref(row);
                  return (
                    <TableRow
                      key={row.id}
                      className="h-[64px] cursor-pointer transition-colors hover:bg-muted/35"
                      onClick={(event) => {
                        const target =
                          event.target as HTMLElement;
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
                      {columns.map(
                        (column) => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              "h-[64px] overflow-hidden px-4 text-start align-middle",
                              column.className,
                            )}
                          >
                            {column.render(row)}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-72"
                  >
                    <EmptyTableState
                      title={
                        hasFilters
                          ? noResultsTitle
                          : emptyTitle
                      }
                      description={
                        hasFilters
                          ? noResultsDescription
                          : emptyDescription
                      }
                      showReset={
                        hasFilters
                      }
                      onReset={onReset}
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
          {formatInteger(rows.length)}
        </span>
        {" "}
        {t.of}
        {" "}
        <span
          dir="ltr"
          lang="en"
          className="font-medium text-foreground tabular-nums"
        >
          {formatInteger(allRowsCount)}
        </span>
        {" "}
        {t.rows}
      </div>
    </div>
  );
}
function buildTableHtml<T>(
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const head = columns
    .map(
      (column) =>
        `<th>${escapeHtml(
          column.label,
        )}</th>`,
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (column) =>
              `<td>${escapeHtml(
                column.value(row),
              )}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `
    <table class="data-table">
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
function downloadExcel(
  filename: string,
  title: string,
  subtitle: string,
  html: string,
  locale: Locale,
) {
  const direction =
    locale === "ar" ? "rtl" : "ltr";
  const alignment =
    locale === "ar" ? "right" : "left";
  const documentHtml = `
    <!doctype html>
    <html
      dir="${direction}"
      lang="${locale}"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
    >
      <head>
        <meta charset="UTF-8" />
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 12px;
            color: #111827;
            direction: ${direction};
            font-family: Tahoma, Arial, sans-serif;
            font-size: 11px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 22px;
            text-align: ${alignment};
          }
          p {
            margin: 0 0 16px;
            color: #4b5563;
            text-align: ${alignment};
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #000000;
            padding: 7px;
            text-align: ${alignment};
            vertical-align: middle;
            mso-number-format: "\\@";
          }
          .data-table th {
            background: #e5e7eb;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        ${html}
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
    `${filename}-${isoDate(new Date())}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
function openPrintWindow(
  title: string,
  subtitle: string,
  html: string,
  locale: Locale,
) {
  const win = window.open(
    "",
    "_blank",
    "width=1400,height=900",
  );
  if (!win) {
    return false;
  }
  win.opener = null;
  const direction =
    locale === "ar" ? "rtl" : "ltr";
  const alignment =
    locale === "ar" ? "right" : "left";
  win.document.open();
  win.document.write(`
    <!doctype html>
    <html
      dir="${direction}"
      lang="${locale}"
    >
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            color: #000000;
            direction: ${direction};
            font-family: Tahoma, Arial, sans-serif;
            font-size: 10px;
          }
          h1 {
            margin: 0 0 5px;
            font-size: 22px;
            text-align: ${alignment};
          }
          p {
            margin: 0 0 14px;
            color: #4b5563;
            text-align: ${alignment};
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .data-table thead {
            display: table-header-group;
          }
          .data-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #000000;
            padding: 6px;
            text-align: ${alignment};
            vertical-align: middle;
            overflow-wrap: anywhere;
          }
          .data-table th {
            background: #e5e7eb !important;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        ${html}
      </body>
    </html>
  `);
  win.document.close();
  win.onafterprint = () => {
    win.close();
  };
  win.setTimeout(() => {
    win.focus();
    win.print();
  }, 350);
  return true;
}
function LifecycleDialogs({
  locale,
  transitionTarget,
  setTransitionTarget,
  cancellationTarget,
  setCancellationTarget,
  cancellationReason,
  setCancellationReason,
  onTransition,
  busy,
}: {
  locale: Locale;
  transitionTarget:
    | TransitionTarget
    | null;
  setTransitionTarget:
    React.Dispatch<
      React.SetStateAction<
        TransitionTarget | null
      >
    >;
  cancellationTarget:
    | AppointmentRecord
    | null;
  setCancellationTarget:
    React.Dispatch<
      React.SetStateAction<
        AppointmentRecord | null
      >
    >;
  cancellationReason: string;
  setCancellationReason:
    React.Dispatch<
      React.SetStateAction<string>
    >;
  onTransition: (
    appointment: AppointmentRecord,
    status: string,
    reason?: string,
  ) => Promise<void>;
  busy: boolean;
}) {
  const t = translations[locale];
  return (
    <>
      <AlertDialog
        open={Boolean(transitionTarget)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setTransitionTarget(null);
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
              {t.confirmTransition}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.transitionDesc}
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
                        .appointment.status
                    }
                    locale={locale}
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
                      transitionTarget.status
                    }
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={busy}
            >
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                !transitionTarget ||
                busy
              }
              onClick={(event) => {
                event.preventDefault();
                if (!transitionTarget) {
                  return;
                }
                void onTransition(
                  transitionTarget.appointment,
                  transitionTarget.status,
                );
              }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={Boolean(cancellationTarget)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setCancellationTarget(null);
            setCancellationReason("");
          }
        }}
      >
        <DialogContent
          dir={
            locale === "ar"
              ? "rtl"
              : "ltr"
          }
          className="sm:max-w-[520px]"
        >
          <DialogHeader className="text-start">
            <DialogTitle>
              {t.cancellationTitle}
            </DialogTitle>
            <DialogDescription>
              {t.cancellationDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="medical-appointment-cancellation-reason"
              className="text-sm font-medium"
            >
              {t.cancellationReason}
            </label>
            <Textarea
              id="medical-appointment-cancellation-reason"
              value={cancellationReason}
              onChange={(event) =>
                setCancellationReason(
                  event.target.value,
                )
              }
              placeholder={
                t.cancellationPlaceholder
              }
              rows={4}
              disabled={busy}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setCancellationTarget(
                  null,
                );
                setCancellationReason("");
              }}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                const reason =
                  cancellationReason.trim();
                if (!reason) {
                  toast.warning(
                    t.cancellationRequired,
                  );
                  return;
                }
                if (!cancellationTarget) {
                  return;
                }
                void onTransition(
                  cancellationTarget,
                  "CANCELLED",
                  reason,
                );
              }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function CompanyAppointmentsPage() {
  const router = useRouter();
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [rows, setRows] =
    React.useState<
      AppointmentRecord[]
    >([]);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const [warningCount, setWarningCount] =
    React.useState(0);
  const [search, setSearch] =
    React.useState("");
  const [status, setStatus] =
    React.useState<StatusFilter>("all");
  const [sort, setSort] =
    React.useState<SortKey>("newest");
  const [dateFrom, setDateFrom] =
    React.useState("");
  const [dateTo, setDateTo] =
    React.useState("");
  const [
    transitionTarget,
    setTransitionTarget,
  ] = React.useState<
    TransitionTarget | null
  >(null);
  const [
    cancellationTarget,
    setCancellationTarget,
  ] = React.useState<
    AppointmentRecord | null
  >(null);
  const [
    cancellationReason,
    setCancellationReason,
  ] = React.useState("");
  const [actionId, setActionId] =
    React.useState("");
  const t = translations[locale];
  const dir =
    locale === "ar" ? "rtl" : "ltr";
  React.useEffect(() => {
    const applyLocale = () => {
      const next =
        getInitialLocale();
      setLocale(next);
      document.documentElement.lang =
        next;
      document.documentElement.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
      document.body.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
    };
    applyLocale();
    window.addEventListener(
      "storage",
      applyLocale,
    );
    window.addEventListener(
      "primey-locale-changed",
      applyLocale,
    );
    return () => {
      window.removeEventListener(
        "storage",
        applyLocale,
      );
      window.removeEventListener(
        "primey-locale-changed",
        applyLocale,
      );
    };
  }, []);
  const loadAppointments =
    React.useCallback(
      async ({
        silent = false,
        notify = false,
      }: {
        silent?: boolean;
        notify?: boolean;
      } = {}) => {
        try {
          if (!silent) {
            setLoading(true);
          }
          setRefreshing(true);
          setError("");
          setWarningCount(0);
          const params =
            new URLSearchParams({
              page: "1",
              page_size: "200",
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
              .map((item) =>
                normalizeAppointment(
                  item,
                  locale,
                ),
              )
              .filter(
                (
                  item,
                ): item is AppointmentRecord =>
                  item !== null,
              );
          setRows(normalizedRows);
          setWarningCount(
            Math.max(
              rawRows.length -
                normalizedRows.length,
              0,
            ),
          );
          if (notify) {
            toast.success(t.refreshed);
          }
        } catch (caughtError) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : t.errorDesc;
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
        locale,
        t.errorDesc,
        t.refreshed,
      ],
    );
  React.useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);
  const resetFilters =
    React.useCallback(() => {
      setSearch("");
      setStatus("all");
      setSort("newest");
      setDateFrom("");
      setDateTo("");
    }, []);
  const filteredRows =
    React.useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();
      const nextRows = rows.filter(
        (row) => {
          const haystack = [
            row.appointmentNumber,
            row.patientName,
            row.patientId,
            row.practitionerName,
            row.serviceName,
            row.branchName,
            row.departmentName,
            row.clinicName,
            row.status,
          ]
            .join(" ")
            .toLowerCase();
          if (
            query &&
            !haystack.includes(query)
          ) {
            return false;
          }
          if (
            status !== "all" &&
            row.status !== status
          ) {
            return false;
          }
          const rowDate =
            formatDate(
              row.scheduledStart,
            );
          if (
            dateFrom &&
            (
              rowDate === "—" ||
              rowDate < dateFrom
            )
          ) {
            return false;
          }
          if (
            dateTo &&
            (
              rowDate === "—" ||
              rowDate > dateTo
            )
          ) {
            return false;
          }
          return true;
        },
      );
      return [...nextRows].sort(
        (left, right) => {
          const leftTime =
            parseDate(
              left.scheduledStart,
            )?.getTime() || 0;
          const rightTime =
            parseDate(
              right.scheduledStart,
            )?.getTime() || 0;
          return sort === "newest"
            ? rightTime - leftTime
            : leftTime - rightTime;
        },
      );
    }, [
      dateFrom,
      dateTo,
      rows,
      search,
      sort,
      status,
    ]);
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = isoDate(now);
    const awaitingStatuses =
      new Set([
        "DRAFT",
        "SCHEDULED",
        "CONFIRMED",
      ]);
    return {
      total: rows.length,
      today: rows.filter(
        (row) =>
          formatDate(
            row.scheduledStart,
          ) === today,
      ).length,
      upcoming: rows.filter(
        (row) => {
          const start = parseDate(
            row.scheduledStart,
          );
          return Boolean(
            start &&
              start.getTime() >
                now.getTime() &&
              !row.isTerminal,
          );
        },
      ).length,
      awaiting: rows.filter(
        (row) =>
          awaitingStatuses.has(
            row.status,
          ),
      ).length,
    };
  }, [rows]);
  const hasFilters = Boolean(
    search ||
      status !== "all" ||
      sort !== "newest" ||
      dateFrom ||
      dateTo,
  );
  const requestTransition =
    React.useCallback(
      (
        appointment:
          AppointmentRecord,
        nextStatus: string,
      ) => {
        if (
          nextStatus === "CANCELLED"
        ) {
          setCancellationReason("");
          setCancellationTarget(
            appointment,
          );
          return;
        }
        setTransitionTarget({
          appointment,
          status: nextStatus,
        });
      },
      [],
    );
  const updateStatus =
    React.useCallback(
      async (
        appointment:
          AppointmentRecord,
        nextStatus: string,
        reason = "",
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
                  cancellation_reason:
                    reason,
                }),
              },
            );
          const normalized =
            normalizeAppointment(
              extractItem(payload),
              locale,
            );
          if (normalized) {
            setRows((current) =>
              current.map((row) =>
                row.id ===
                normalized.id
                  ? normalized
                  : row,
              ),
            );
          } else {
            await loadAppointments({
              silent: true,
            });
          }
          setTransitionTarget(null);
          setCancellationTarget(null);
          setCancellationReason("");
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
        loadAppointments,
        locale,
        t.statusFailed,
        t.statusUpdated,
      ],
    );
  const exportColumns =
    React.useMemo<
      ExportColumn<AppointmentRecord>[]
    >(
      () => [
        {
          label:
            t.appointmentNumber,
          value: (row) =>
            row.appointmentNumber,
        },
        {
          label: t.patient,
          value: (row) =>
            row.patientName,
        },
        {
          label: t.practitioner,
          value: (row) =>
            row.practitionerName,
        },
        {
          label: t.service,
          value: (row) =>
            row.serviceName,
        },
        {
          label: t.start,
          value: (row) =>
            formatDateTime(
              row.scheduledStart,
            ),
        },
        {
          label: t.end,
          value: (row) =>
            formatDateTime(
              row.scheduledEnd,
            ),
        },
        {
          label: t.location,
          value: (row) =>
            [
              row.branchName,
              row.departmentName,
              row.clinicName,
            ]
              .filter(Boolean)
              .join(" / ") || "—",
        },
        {
          label: t.status,
          value: (row) =>
            statusLabel(
              row.status,
              locale,
            ),
        },
      ],
      [
        locale,
        t.appointmentNumber,
        t.end,
        t.location,
        t.patient,
        t.practitioner,
        t.service,
        t.start,
        t.status,
      ],
    );
  const exportExcel =
    React.useCallback(() => {
      if (!filteredRows.length) {
        toast.warning(
          t.exportEmpty,
        );
        return;
      }
      downloadExcel(
        "medical-appointments",
        t.title,
        `${t.generatedAt}: ${reportDateTime()} — ${t.reportRows}: ${formatInteger(
          filteredRows.length,
        )}`,
        buildTableHtml(
          exportColumns,
          filteredRows,
        ),
        locale,
      );
      toast.success(
        t.exportSuccess,
      );
    }, [
      exportColumns,
      filteredRows,
      locale,
      t.exportEmpty,
      t.exportSuccess,
      t.generatedAt,
      t.reportRows,
      t.title,
    ]);
  const printPage =
    React.useCallback(() => {
      if (!filteredRows.length) {
        toast.warning(
          t.printEmpty,
        );
        return;
      }
      const opened =
        openPrintWindow(
          t.title,
          `${t.generatedAt}: ${reportDateTime()} — ${t.reportRows}: ${formatInteger(
            filteredRows.length,
          )}`,
          buildTableHtml(
            exportColumns,
            filteredRows,
          ),
          locale,
        );
      if (!opened) {
        toast.error(
          t.printBlocked,
        );
        return;
      }
      toast.success(
        t.printReady,
      );
    }, [
      exportColumns,
      filteredRows,
      locale,
      t.generatedAt,
      t.printBlocked,
      t.printEmpty,
      t.printReady,
      t.reportRows,
      t.title,
    ]);
  const columns =
    React.useMemo<
      DataColumn<AppointmentRecord>[]
    >(
      () => [
        {
          key: "appointment",
          label: t.appointment,
          className: "w-[190px]",
          render: (row) => (
            <div className="min-w-0">
              <span
                dir="ltr"
                lang="en"
                className="block truncate font-mono text-sm font-semibold tabular-nums"
              >
                {
                  row.appointmentNumber
                }
              </span>
              <span
                dir="ltr"
                lang="en"
                className="mt-0.5 block truncate text-xs text-muted-foreground tabular-nums"
              >
                #{row.id}
              </span>
            </div>
          ),
        },
        {
          key: "patient",
          label: t.patient,
          className: "w-[230px]",
          render: (row) => (
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {row.patientName}
              </span>
              <span
                dir="ltr"
                lang="en"
                className="mt-0.5 block truncate text-xs text-muted-foreground tabular-nums"
              >
                {row.patientId
                  ? `#${row.patientId}`
                  : "—"}
              </span>
            </div>
          ),
        },
        {
          key: "service",
          label:
            `${t.practitioner} / ${t.service}`,
          className: "w-[280px]",
          render: (row) => (
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {
                  row.practitionerName
                }
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {row.serviceName}
              </span>
            </div>
          ),
        },
        {
          key: "schedule",
          label: t.schedule,
          className: "w-[210px]",
          render: (row) => (
            <div className="min-w-0">
              <span
                dir="ltr"
                lang="en"
                className="block truncate text-sm font-medium tabular-nums"
              >
                {formatDate(
                  row.scheduledStart,
                )}
              </span>
              <span
                dir="ltr"
                lang="en"
                className="mt-0.5 block truncate text-xs text-muted-foreground tabular-nums"
              >
                {formatTime(
                  row.scheduledStart,
                )}
                {" – "}
                {formatTime(
                  row.scheduledEnd,
                )}
              </span>
            </div>
          ),
        },
        {
          key: "location",
          label: t.location,
          className: "w-[230px]",
          render: (row) => (
            <span className="block truncate text-sm text-muted-foreground">
              {[
                row.branchName,
                row.departmentName,
                row.clinicName,
              ]
                .filter(Boolean)
                .join(" / ") ||
                t.unknown}
            </span>
          ),
        },
        {
          key: "status",
          label: t.status,
          className: "w-[150px]",
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
          className:
            "sticky left-0 z-10 w-[92px] bg-background",
          render: (row) => (
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
                    aria-label={t.actions}
                    disabled={
                      actionId === row.id
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
                        appointmentHref(
                          row,
                        ),
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t.openDetails}
                  </DropdownMenuItem>
                  {row.allowedStatuses
                    .length ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  {row.allowedStatuses.map(
                    (nextStatus) => (
                      <DropdownMenuItem
                        key={nextStatus}
                        className={cn(
                          "flex items-center gap-2",
                          nextStatus ===
                            "CANCELLED" &&
                            "text-red-600 focus:bg-red-50 focus:text-red-700",
                        )}
                        onSelect={() =>
                          requestTransition(
                            row,
                            nextStatus,
                          )
                        }
                      >
                        {nextStatus ===
                        "CANCELLED" ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {t.moveTo}
                        {" "}
                        {statusLabel(
                          nextStatus,
                          locale,
                        )}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        },
      ],
      [
        actionId,
        locale,
        requestTransition,
        router,
        t.actions,
        t.appointment,
        t.location,
        t.moveTo,
        t.openDetails,
        t.patient,
        t.practitioner,
        t.schedule,
        t.service,
        t.status,
        t.unknown,
      ],
    );
  const kpis = [
    {
      title: t.total,
      value: stats.total,
      description: t.totalDesc,
      href: "/company/appointments",
      icon: CalendarClock,
    },
    {
      title: t.today,
      value: stats.today,
      description: t.todayDesc,
      href: "/company/appointments",
      icon: CalendarDays,
    },
    {
      title: t.upcoming,
      value: stats.upcoming,
      description: t.upcomingDesc,
      href: "/company/appointments",
      icon: Clock3,
    },
    {
      title: t.awaiting,
      value: stats.awaiting,
      description: t.awaitingDesc,
      href: "/company/appointments",
      icon: CircleDot,
    },
  ];
  if (loading) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <PageSkeleton />
      </main>
    );
  }
  if (error) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <Card className="mx-auto max-w-[900px] rounded-lg border-destructive/30 bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-7 w-7" />
            </div>
            <CardTitle className="mt-3 text-2xl">
              {t.errorTitle}
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              {error || t.errorDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              type="button"
              onClick={() =>
                void loadAppointments({
                  silent: true,
                  notify: true,
                })
              }
            >
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
      className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1 text-start">
            <Badge
              variant="outline"
              className="mb-2 rounded-full bg-background px-3 py-1 text-xs"
            >
              <Stethoscope className="me-1.5 h-3.5 w-3.5" />
              {t.badge}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {t.title}
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void loadAppointments({
                  silent: true,
                  notify: true,
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
              type="button"
              variant="outline"
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.export}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={printPage}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>
        {warningCount ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-900 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {t.partialTitle}
                </p>
                <p className="mt-1 text-xs leading-6">
                  {t.partialDesc}
                  {" "}
                  (
                  <span
                    dir="ltr"
                    lang="en"
                    className="tabular-nums"
                  >
                    {formatInteger(
                      warningCount,
                    )}
                  </span>
                  )
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((card) => (
            <KpiCard
              key={card.title}
              {...card}
            />
          ))}
        </div>
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle>
                  {t.tableTitle}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.tableDesc}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.export}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={printPage}
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-[330px]">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder={
                      t.searchPlaceholder
                    }
                    className="h-9 bg-background ps-9 shadow-none"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(
                      value as StatusFilter,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[165px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.all}
                    </SelectItem>
                    {STATUS_VALUES.map(
                      (value) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {statusLabel(
                            value,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <DatePickerField
                  label={t.from}
                  value={dateFrom}
                  onChange={setDateFrom}
                  locale={locale}
                />
                <DatePickerField
                  label={t.to}
                  value={dateTo}
                  onChange={setDateTo}
                  locale={locale}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sort}
                  onValueChange={(value) =>
                    setSort(
                      value as SortKey,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[160px]">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="newest">
                      {t.newest}
                    </SelectItem>
                    <SelectItem value="oldest">
                      {t.oldest}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.reset}
                </Button>
              </div>
            </div>
            <DataTable
              rows={filteredRows}
              allRowsCount={rows.length}
              columns={columns}
              rowHref={appointmentHref}
              emptyTitle={t.noDataTitle}
              emptyDescription={
                t.noDataDesc
              }
              noResultsTitle={
                t.noResultsTitle
              }
              noResultsDescription={
                t.noResultsDesc
              }
              hasFilters={hasFilters}
              onReset={resetFilters}
              locale={locale}
            />
          </CardContent>
        </Card>
        <LifecycleDialogs
          locale={locale}
          transitionTarget={
            transitionTarget
          }
          setTransitionTarget={
            setTransitionTarget
          }
          cancellationTarget={
            cancellationTarget
          }
          setCancellationTarget={
            setCancellationTarget
          }
          cancellationReason={
            cancellationReason
          }
          setCancellationReason={
            setCancellationReason
          }
          onTransition={updateStatus}
          busy={Boolean(actionId)}
        />
      </div>
    </main>
  );
}
export function CompanyAppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const appointmentId =
    Array.isArray(rawId)
      ? rawId[0]
      : text(rawId);
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [
    appointment,
    setAppointment,
  ] = React.useState<
    AppointmentRecord | null
  >(null);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const [
    transitionTarget,
    setTransitionTarget,
  ] = React.useState<
    TransitionTarget | null
  >(null);
  const [
    cancellationTarget,
    setCancellationTarget,
  ] = React.useState<
    AppointmentRecord | null
  >(null);
  const [
    cancellationReason,
    setCancellationReason,
  ] = React.useState("");
  const [actionBusy, setActionBusy] =
    React.useState(false);
  const t = translations[locale];
  const dir =
    locale === "ar" ? "rtl" : "ltr";
  React.useEffect(() => {
    const applyLocale = () => {
      const next =
        getInitialLocale();
      setLocale(next);
      document.documentElement.lang =
        next;
      document.documentElement.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
      document.body.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
    };
    applyLocale();
    window.addEventListener(
      "storage",
      applyLocale,
    );
    window.addEventListener(
      "primey-locale-changed",
      applyLocale,
    );
    return () => {
      window.removeEventListener(
        "storage",
        applyLocale,
      );
      window.removeEventListener(
        "primey-locale-changed",
        applyLocale,
      );
    };
  }, []);
  const loadAppointment =
    React.useCallback(
      async ({
        silent = false,
        notify = false,
      }: {
        silent?: boolean;
        notify?: boolean;
      } = {}) => {
        if (!appointmentId) {
          setError(t.errorDesc);
          setLoading(false);
          return;
        }
        try {
          if (!silent) {
            setLoading(true);
          }
          setRefreshing(true);
          setError("");
          const payload =
            await requestJson<ApiResponse>(
              `${APPOINTMENTS_ENDPOINT}${encodeURIComponent(
                appointmentId,
              )}/`,
            );
          const normalized =
            normalizeAppointment(
              extractItem(payload),
              locale,
            );
          if (!normalized) {
            throw new Error(
              t.errorDesc,
            );
          }
          setAppointment(normalized);
          if (notify) {
            toast.success(
              t.refreshed,
            );
          }
        } catch (caughtError) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : t.errorDesc;
          setAppointment(null);
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
        appointmentId,
        locale,
        t.errorDesc,
        t.refreshed,
      ],
    );
  React.useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);
  const requestTransition =
    React.useCallback(
      (
        row: AppointmentRecord,
        status: string,
      ) => {
        if (status === "CANCELLED") {
          setCancellationReason("");
          setCancellationTarget(row);
          return;
        }
        setTransitionTarget({
          appointment: row,
          status,
        });
      },
      [],
    );
  const updateStatus =
    React.useCallback(
      async (
        row: AppointmentRecord,
        nextStatus: string,
        reason = "",
      ) => {
        try {
          setActionBusy(true);
          const payload =
            await requestJson<ApiResponse>(
              `${APPOINTMENTS_ENDPOINT}${encodeURIComponent(
                row.id,
              )}/status/`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  status: nextStatus,
                  cancellation_reason:
                    reason,
                }),
              },
            );
          const normalized =
            normalizeAppointment(
              extractItem(payload),
              locale,
            );
          if (!normalized) {
            await loadAppointment({
              silent: true,
            });
          } else {
            setAppointment(normalized);
          }
          setTransitionTarget(null);
          setCancellationTarget(null);
          setCancellationReason("");
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
          setActionBusy(false);
        }
      },
      [
        loadAppointment,
        locale,
        t.statusFailed,
        t.statusUpdated,
      ],
    );
  const printDetail =
    React.useCallback(() => {
      if (!appointment) {
        toast.warning(
          t.printEmpty,
        );
        return;
      }
      const columns: ExportColumn<
        {
          label: string;
          value: string;
        }
      >[] = [
        {
          label: t.appointment,
          value: (row) =>
            row.label,
        },
        {
          label: t.detailTitle,
          value: (row) =>
            row.value,
        },
      ];
      const detailRows = [
        {
          label:
            t.appointmentNumber,
          value:
            appointment.appointmentNumber,
        },
        {
          label: t.patient,
          value:
            appointment.patientName,
        },
        {
          label: t.practitioner,
          value:
            appointment.practitionerName,
        },
        {
          label: t.service,
          value:
            appointment.serviceName,
        },
        {
          label: t.start,
          value:
            formatDateTime(
              appointment.scheduledStart,
            ),
        },
        {
          label: t.end,
          value:
            formatDateTime(
              appointment.scheduledEnd,
            ),
        },
        {
          label: t.status,
          value:
            statusLabel(
              appointment.status,
              locale,
            ),
        },
        {
          label: t.branch,
          value:
            appointment.branchName ||
            "—",
        },
        {
          label: t.department,
          value:
            appointment.departmentName ||
            "—",
        },
        {
          label: t.clinic,
          value:
            appointment.clinicName ||
            "—",
        },
      ];
      const opened =
        openPrintWindow(
          t.detailTitle,
          appointment.appointmentNumber,
          buildTableHtml(
            columns,
            detailRows,
          ),
          locale,
        );
      if (!opened) {
        toast.error(
          t.printBlocked,
        );
        return;
      }
      toast.success(
        t.printReady,
      );
    }, [
      appointment,
      locale,
      t.appointment,
      t.appointmentNumber,
      t.branch,
      t.clinic,
      t.department,
      t.detailTitle,
      t.end,
      t.patient,
      t.practitioner,
      t.printBlocked,
      t.printEmpty,
      t.printReady,
      t.service,
      t.start,
      t.status,
    ]);
  if (loading) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <PageSkeleton />
      </main>
    );
  }
  if (error || !appointment) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <Card className="mx-auto max-w-[900px] rounded-lg border-destructive/30 bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-7 w-7" />
            </div>
            <CardTitle className="mt-3 text-2xl">
              {t.errorTitle}
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              {error || t.errorDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-2 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  "/company/appointments",
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
            <Button
              type="button"
              onClick={() =>
                void loadAppointment({
                  silent: true,
                  notify: true,
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  const location = [
    appointment.branchName,
    appointment.departmentName,
    appointment.clinicName,
  ]
    .filter(Boolean)
    .join(" / ");
  const lifecycleRows = [
    {
      label: t.createdAt,
      value: appointment.createdAt,
    },
    {
      label: t.updatedAt,
      value: appointment.updatedAt,
    },
    {
      label: t.confirmedAt,
      value: appointment.confirmedAt,
    },
    {
      label: t.checkedInAt,
      value: appointment.checkedInAt,
    },
    {
      label: t.startedAt,
      value: appointment.startedAt,
    },
    {
      label: t.completedAt,
      value: appointment.completedAt,
    },
    {
      label: t.cancelledAt,
      value: appointment.cancelledAt,
    },
    {
      label: t.noShowAt,
      value: appointment.noShowAt,
    },
  ];
  return (
    <main
      dir={dir}
      className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2 text-start">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ms-2"
              onClick={() =>
                router.push(
                  "/company/appointments",
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
            <Badge
              variant="outline"
              className="rounded-full bg-background px-3 py-1 text-xs"
            >
              <Stethoscope className="me-1.5 h-3.5 w-3.5" />
              {t.badge}
            </Badge>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {t.detailTitle}
              </h1>
              <StatusBadge
                status={
                  appointment.status
                }
                locale={locale}
              />
            </div>
            <p
              dir="ltr"
              lang="en"
              className="font-mono text-sm font-semibold tabular-nums text-muted-foreground"
            >
              {
                appointment.appointmentNumber
              }
            </p>
            <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
              {t.detailSubtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() =>
                void loadAppointment({
                  silent: true,
                  notify: true,
                })
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
              onClick={printDetail}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-lg border bg-card shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>
                {t.patient}
              </CardDescription>
              <CardTitle className="mt-2 truncate text-lg">
                {
                  appointment.patientName
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p
                dir="ltr"
                lang="en"
                className="text-xs text-muted-foreground tabular-nums"
              >
                {appointment.patientId
                  ? `#${appointment.patientId}`
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>
                {t.practitioner}
              </CardDescription>
              <CardTitle className="mt-2 truncate text-lg">
                {
                  appointment.practitionerName
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="truncate text-xs text-muted-foreground">
                {
                  appointment.serviceName
                }
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>
                {t.start}
              </CardDescription>
              <CardTitle
                dir="ltr"
                lang="en"
                className="mt-2 text-lg tabular-nums"
              >
                {formatDate(
                  appointment.scheduledStart,
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p
                dir="ltr"
                lang="en"
                className="text-xs text-muted-foreground tabular-nums"
              >
                {formatTime(
                  appointment.scheduledStart,
                )}
                {" – "}
                {formatTime(
                  appointment.scheduledEnd,
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>
                {t.location}
              </CardDescription>
              <CardTitle className="mt-2 truncate text-lg">
                {location || t.unknown}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {t.rescheduleCount}
                {": "}
                <span
                  dir="ltr"
                  lang="en"
                  className="tabular-nums"
                >
                  {formatInteger(
                    appointment.rescheduleCount,
                  )}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-lg border bg-card shadow-none">
            <CardHeader>
              <CardTitle>
                {t.detailTitle}
              </CardTitle>
              <CardDescription>
                {
                  appointment.appointmentNumber
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label:
                    t.appointmentNumber,
                  value:
                    appointment.appointmentNumber,
                  icon: CalendarClock,
                  ltr: true,
                },
                {
                  label: t.patient,
                  value:
                    appointment.patientName,
                  icon: UserRound,
                },
                {
                  label: t.practitioner,
                  value:
                    appointment.practitionerName,
                  icon: Stethoscope,
                },
                {
                  label: t.service,
                  value:
                    appointment.serviceName,
                  icon: CircleDot,
                },
                {
                  label: t.start,
                  value:
                    formatDateTime(
                      appointment.scheduledStart,
                    ),
                  icon: CalendarDays,
                  ltr: true,
                },
                {
                  label: t.end,
                  value:
                    formatDateTime(
                      appointment.scheduledEnd,
                    ),
                  icon: Clock3,
                  ltr: true,
                },
                {
                  label: t.branch,
                  value:
                    appointment.branchName ||
                    "—",
                  icon: CalendarClock,
                },
                {
                  label: t.department,
                  value:
                    appointment.departmentName ||
                    "—",
                  icon: Stethoscope,
                },
                {
                  label: t.clinic,
                  value:
                    appointment.clinicName ||
                    "—",
                  icon: Stethoscope,
                },
                {
                  label: t.bookingMode,
                  value:
                    appointment.bookingMode ||
                    "—",
                  icon: CircleDot,
                  ltr: true,
                },
                {
                  label: t.slotDuration,
                  value:
                    `${formatInteger(
                      appointment.totalSlotMinutes,
                    )} ${t.minutes}`,
                  icon: Clock3,
                  ltr: true,
                },
                {
                  label: t.price,
                  value:
                    formatMoney(
                      appointment.priceSnapshot,
                    ),
                  icon: CircleDot,
                  ltr: true,
                },
                {
                  label:
                    t.canReschedule,
                  value:
                    appointment.canReschedule
                      ? t.yes
                      : t.no,
                  icon: History,
                },
                {
                  label: t.source,
                  value:
                    appointment.source ||
                    "—",
                  icon: ExternalLink,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border bg-background p-4"
                >
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </p>
                  <p
                    dir={
                      item.ltr
                        ? "ltr"
                        : undefined
                    }
                    lang={
                      item.ltr
                        ? "en"
                        : undefined
                    }
                    className={cn(
                      "mt-2 break-words text-sm font-semibold",
                      item.ltr &&
                        "tabular-nums",
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
              {appointment.reason ? (
                <div className="rounded-lg border bg-background p-4 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t.visitReason}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {appointment.reason}
                  </p>
                </div>
              ) : null}
              {appointment.notes ? (
                <div className="rounded-lg border bg-background p-4 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t.notes}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {appointment.notes}
                  </p>
                </div>
              ) : null}
              {appointment.cancellationReason ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:col-span-2">
                  <p className="text-xs font-semibold">
                    {
                      t.cancellationReason
                    }
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {
                      appointment.cancellationReason
                    }
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <div className="space-y-5">
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader>
                <CardTitle>
                  {t.availableActions}
                </CardTitle>
                <CardDescription>
                  {
                    t.availableActionsDesc
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointment.allowedStatuses
                  .length ? (
                  <div className="flex flex-wrap gap-2">
                    {appointment.allowedStatuses.map(
                      (nextStatus) => (
                        <Button
                          key={nextStatus}
                          type="button"
                          variant={
                            nextStatus ===
                            "CANCELLED"
                              ? "destructive"
                              : "outline"
                          }
                          disabled={
                            actionBusy
                          }
                          onClick={() =>
                            requestTransition(
                              appointment,
                              nextStatus,
                            )
                          }
                        >
                          {nextStatus ===
                          "CANCELLED" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {statusLabel(
                            nextStatus,
                            locale,
                          )}
                        </Button>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {appointment.isTerminal
                      ? t.terminal
                      : t.noActions}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader>
                <CardTitle>
                  {t.lifecycle}
                </CardTitle>
                <CardDescription>
                  {t.lifecycleDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-background">
                  <Table>
                    <TableBody>
                      {lifecycleRows.map(
                        (row) => (
                          <TableRow
                            key={row.label}
                          >
                            <TableCell className="w-[48%] text-sm text-muted-foreground">
                              {row.label}
                            </TableCell>
                            <TableCell
                              dir="ltr"
                              lang="en"
                              className="text-end text-sm font-medium tabular-nums"
                            >
                              {formatDateTime(
                                row.value,
                              )}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <LifecycleDialogs
          locale={locale}
          transitionTarget={
            transitionTarget
          }
          setTransitionTarget={
            setTransitionTarget
          }
          cancellationTarget={
            cancellationTarget
          }
          setCancellationTarget={
            setCancellationTarget
          }
          cancellationReason={
            cancellationReason
          }
          setCancellationReason={
            setCancellationReason
          }
          onTransition={updateStatus}
          busy={actionBusy}
        />
      </div>
    </main>
  );
}
