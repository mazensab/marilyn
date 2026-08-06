"use client";
// appointments_calendar_hr_spirit=true
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarClock,
  CalendarDays,
  CalendarIcon,
  CalendarRange,
  CalendarX2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  FileSpreadsheet,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  UsersRound,
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
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { AppointmentCenterTabs } from "@/components/system/appointment-center-tabs";
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
import { openPrintReport } from "@/lib/print-report";
import { cn } from "@/lib/utils";
type Locale = "ar" | "en";
type ViewMode = "day" | "week";
type ApiRecord = Record<string, unknown>;
type AppointmentRecord = {
  id: string;
  appointmentNumber: string;
  patientName: string;
  practitionerName: string;
  serviceName: string;
  branchName: string;
  departmentName: string;
  clinicName: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  isTerminal: boolean;
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
    badge: "الإدارة المركزية",
    title: "تقويم المواعيد",
    subtitle:
      "عرض يومي وأسبوعي حقيقي لمواعيد المرضى والممارسين والخدمات عبر بيانات الحجز المسجلة.",
    connected:
      "متصل بواجهات المواعيد والتقويم الطبي الحقيقية",
    centerTab: "مركز المواعيد",
    calendarTab: "تقويم المواعيد",
    waitingTab: "قائمة الانتظار",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    add: "إضافة موعد",
    total: "مواعيد الفترة",
    today: "مواعيد اليوم",
    confirmed: "المواعيد المؤكدة",
    awaiting: "بانتظار الإجراء",
    totalDesc: "جميع مواعيد الفترة المحددة",
    todayDesc: "المواعيد المجدولة اليوم",
    confirmedDesc: "المواعيد المؤكدة في الفترة",
    awaitingDesc: "المسودة والمجدولة والمؤكدة",
    calendarTitle: "التقويم التشغيلي",
    calendarDesc:
      "تنقل بين الأيام والأسابيع وراجع أوقات المواعيد والمريض والممارس والخدمة والحالة.",
    day: "يومي",
    week: "أسبوعي",
    previous: "السابق",
    next: "التالي",
    currentDay: "اليوم",
    chooseDate: "اختر التاريخ",
    searchPlaceholder:
      "ابحث برقم الموعد أو المريض أو الممارس أو الخدمة...",
    allStatuses: "كل الحالات",
    reset: "إعادة ضبط",
    noAppointments: "لا توجد مواعيد في هذه الفترة",
    noAppointmentsDesc:
      "لم يتم تسجيل مواعيد مطابقة للتاريخ والفلاتر المحددة.",
    loadingError: "تعذر تحميل تقويم المواعيد",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل التقويم جزئيًا",
    partialDesc:
      "تم تجاهل بعض السجلات التي لا تحتوي على تاريخ موعد صالح.",
    refreshed: "تم تحديث تقويم المواعيد.",
    excelEmpty: "لا توجد مواعيد للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد مواعيد للطباعة.",
    printReady: "تم تجهيز تقرير تقويم المواعيد.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    appointment: "الموعد",
    patient: "المريض",
    practitioner: "الممارس",
    service: "الخدمة",
    start: "البداية",
    end: "النهاية",
    location: "الموقع",
    status: "الحالة",
    unknown: "غير محدد",
    appointments: "مواعيد",
    openDetails: "فتح تفاصيل الموعد",
    statuses: {
      DRAFT: "مسودة",
      SCHEDULED: "مجدول",
      CONFIRMED: "مؤكد",
      CHECKED_IN: "تم الحضور",
      IN_PROGRESS: "قيد الجلسة",
      COMPLETED: "مكتمل",
      CANCELLED: "ملغي",
      NO_SHOW: "لم يحضر",
    },
  },
  en: {
    badge: "Central administration",
    title: "Appointments Calendar",
    subtitle:
      "A real daily and weekly view of patient, practitioner, and service appointments from registered booking data.",
    connected:
      "Connected to live appointment and calendar APIs",
    centerTab: "Appointments center",
    calendarTab: "Appointments calendar",
    waitingTab: "Waiting list",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    add: "Add appointment",
    total: "Period appointments",
    today: "Today's appointments",
    confirmed: "Confirmed appointments",
    awaiting: "Awaiting action",
    totalDesc: "All appointments in the selected period",
    todayDesc: "Appointments scheduled today",
    confirmedDesc: "Confirmed appointments in the period",
    awaitingDesc: "Draft, scheduled, and confirmed",
    calendarTitle: "Operational calendar",
    calendarDesc:
      "Move between days and weeks and review appointment times, patients, practitioners, services, and statuses.",
    day: "Daily",
    week: "Weekly",
    previous: "Previous",
    next: "Next",
    currentDay: "Today",
    chooseDate: "Choose date",
    searchPlaceholder:
      "Search by appointment, patient, practitioner, or service...",
    allStatuses: "All statuses",
    reset: "Reset",
    noAppointments: "No appointments in this period",
    noAppointmentsDesc:
      "No appointments match the selected date and filters.",
    loadingError: "Could not load appointments calendar",
    retry: "Try again",
    partialTitle: "Calendar loaded partially",
    partialDesc:
      "Some records without a valid appointment date were skipped.",
    refreshed: "Appointments calendar refreshed.",
    excelEmpty: "There are no appointments to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There are no appointments to print.",
    printReady: "Appointments calendar report prepared.",
    printBlocked: "The print window could not be opened.",
    appointment: "Appointment",
    patient: "Patient",
    practitioner: "Practitioner",
    service: "Service",
    start: "Start",
    end: "End",
    location: "Location",
    status: "Status",
    unknown: "Unknown",
    appointments: "appointments",
    openDetails: "Open appointment details",
    statuses: {
      DRAFT: "Draft",
      SCHEDULED: "Scheduled",
      CONFIRMED: "Confirmed",
      CHECKED_IN: "Checked in",
      IN_PROGRESS: "In progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      NO_SHOW: "No show",
    },
  },
} as const;
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en"
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
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim() || fallback;
}
function boolValue(
  value: unknown,
  fallback = false,
) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = text(value).toLowerCase();
  if (
    ["true", "1", "yes", "active", "enabled"].includes(
      normalized,
    )
  ) {
    return true;
  }
  if (
    ["false", "0", "no", "inactive", "disabled"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return fallback;
}
function nestedName(value: unknown) {
  if (typeof value === "string") return text(value);
  const record = asRecord(value);
  return text(
    record.full_name ||
      record.name ||
      record.title ||
      record.label ||
      record.patient_name ||
      record.practitioner_name,
  );
}
function extractArray(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload) || depth > 3) return [];
  const candidates = [
    payload.appointments,
    payload.items,
    payload.results,
    payload.records,
    payload.rows,
    payload.data,
    payload.result,
    payload.payload,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  for (const candidate of candidates) {
    const nested = extractArray(candidate, depth + 1);
    if (nested.length) return nested;
  }
  return [];
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
  const scheduledEnd = text(
    record.scheduled_end ||
      record.end_at ||
      record.ends_at,
  );
  const parsedStart = new Date(scheduledStart);
  if (
    !id ||
    !scheduledStart ||
    Number.isNaN(parsedStart.getTime())
  ) {
    return null;
  }
  const patient = asRecord(record.patient);
  const practitioner = asRecord(record.practitioner);
  const service = asRecord(
    record.service ||
      record.service_offering ||
      record.catalog_item,
  );
  const branch = asRecord(record.branch);
  const department = asRecord(record.department);
  const clinic = asRecord(record.clinic);
  return {
    id,
    appointmentNumber: text(
      record.appointment_number ||
        record.number,
      id,
    ),
    patientName:
      text(record.patient_name) ||
      nestedName(patient) ||
      text(patient.patient_number),
    practitionerName:
      text(record.practitioner_name) ||
      text(record.practitioner_name_snapshot) ||
      nestedName(practitioner),
    serviceName:
      text(record.service_name) ||
      text(record.service_name_snapshot) ||
      nestedName(service),
    branchName:
      text(record.branch_name) ||
      nestedName(branch),
    departmentName:
      text(record.department_name) ||
      nestedName(department),
    clinicName:
      text(record.clinic_name) ||
      nestedName(clinic),
    scheduledStart,
    scheduledEnd,
    status: text(
      record.status,
      "SCHEDULED",
    ).toUpperCase(),
    isTerminal: boolValue(
      record.is_terminal,
      ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
        text(record.status).toUpperCase(),
      ),
    ),
  };
}
async function requestJson(
  path: string,
) {
  const response = await fetch(path, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });
  const payload: unknown = await response
    .json()
    .catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractError(
        payload,
        `HTTP ${response.status}`,
      ),
    );
  }
  return payload;
}
function startOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    0,
    0,
    0,
    0,
  );
}
function endOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}
function addDays(
  value: Date,
  amount: number,
) {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}
function startOfWeek(value: Date) {
  const result = startOfDay(value);
  result.setDate(result.getDate() - result.getDay());
  return result;
}
function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}
function localeCode(locale: Locale) {
  return locale === "ar"
    ? "ar-SA-u-nu-latn"
    : "en-GB";
}
function formatDate(
  value: Date,
  locale: Locale,
) {
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(value);
}
function formatLongDate(
  value: Date,
  locale: Locale,
) {
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(value);
}
function formatDayName(
  value: Date,
  locale: Locale,
) {
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      weekday: "short",
    },
  ).format(value);
}
function formatTime(
  value: string,
  locale: Locale,
) {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat(
    localeCode(locale),
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(parsed);
}
function rangeFor(
  selectedDate: Date,
  view: ViewMode,
) {
  if (view === "week") {
    const start = startOfWeek(selectedDate);
    return {
      start,
      end: endOfDay(addDays(start, 6)),
    };
  }
  return {
    start: startOfDay(selectedDate),
    end: endOfDay(selectedDate),
  };
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  const labels = translations[locale]
    .statuses as Record<string, string>;
  return labels[status] || status;
}
function statusClass(status: string) {
  if (status === "CONFIRMED") {
    return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
  }
  if (status === "CHECKED_IN") {
    return "border-cyan-200 bg-cyan-50/80 text-cyan-800";
  }
  if (status === "IN_PROGRESS") {
    return "border-violet-200 bg-violet-50/80 text-violet-800";
  }
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50/80 text-green-800";
  }
  if (status === "CANCELLED") {
    return "border-rose-200 bg-rose-50/80 text-rose-800";
  }
  if (status === "NO_SHOW") {
    return "border-orange-200 bg-orange-50/80 text-orange-800";
  }
  if (status === "DRAFT") {
    return "border-slate-200 bg-slate-50/80 text-slate-700";
  }
  return "border-amber-200 bg-amber-50/80 text-amber-800";
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
    .join(" • ") || fallback;
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
  rows: AppointmentRecord[],
  locale: Locale,
) {
  const t = translations[locale];
  const body = rows
    .map((row) => {
      const start = parseDate(row.scheduledStart);
      const end = parseDate(row.scheduledEnd);
      return `
        <tr>
          <td>${escapeHtml(row.appointmentNumber)}</td>
          <td>${escapeHtml(row.patientName || t.unknown)}</td>
          <td>${escapeHtml(row.practitionerName || t.unknown)}</td>
          <td>${escapeHtml(row.serviceName || t.unknown)}</td>
          <td>${escapeHtml(start ? `${formatDate(start, locale)} ${formatTime(row.scheduledStart, locale)}` : "—")}</td>
          <td>${escapeHtml(end ? formatTime(row.scheduledEnd, locale) : "—")}</td>
          <td>${escapeHtml(locationLabel(row, t.unknown))}</td>
          <td>${escapeHtml(statusLabel(row.status, locale))}</td>
        </tr>
      `;
    })
    .join("");
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.appointment)}</th>
          <th>${escapeHtml(t.patient)}</th>
          <th>${escapeHtml(t.practitioner)}</th>
          <th>${escapeHtml(t.service)}</th>
          <th>${escapeHtml(t.start)}</th>
          <th>${escapeHtml(t.end)}</th>
          <th>${escapeHtml(t.location)}</th>
          <th>${escapeHtml(t.status)}</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
export function AppointmentsCalendarClient() {
  const router = useRouter();
  const [locale, setLocale] =
    React.useState<Locale>(getInitialLocale);
  const [view, setView] =
    React.useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] =
    React.useState<Date>(() => startOfDay(new Date()));
  const [rows, setRows] =
    React.useState<AppointmentRecord[]>([]);
  const [search, setSearch] =
    React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState("all");
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const [skipped, setSkipped] =
    React.useState(0);
  const t = translations[locale];
  const range = React.useMemo(
    () => rangeFor(selectedDate, view),
    [selectedDate, view],
  );
  const rangeStartIso = range.start.toISOString();
  const rangeEndIso = range.end.toISOString();
  const loadAppointments =
    React.useCallback(
      async (notify = false) => {
        if (notify) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        try {
          const params = new URLSearchParams();
          params.set("scheduled_from", rangeStartIso);
          params.set("scheduled_to", rangeEndIso);
          const payload = await requestJson(
            apiUrl(
              APPOINTMENTS_ENDPOINT,
              params,
            ),
          );
          const rawRows = extractArray(payload);
          const normalizedRows = rawRows
            .map(normalizeAppointment)
            .filter(
              (
                item,
              ): item is AppointmentRecord =>
                item !== null,
            )
            .sort((left, right) => {
              const leftDate = parseDate(
                left.scheduledStart,
              );
              const rightDate = parseDate(
                right.scheduledStart,
              );
              return (
                (leftDate?.getTime() || 0) -
                (rightDate?.getTime() || 0)
              );
            });
          setRows(normalizedRows);
          setSkipped(
            Math.max(
              0,
              rawRows.length -
                normalizedRows.length,
            ),
          );
          if (notify) {
            toast.success(t.refreshed);
          }
        } catch (caughtError) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : t.loadingError;
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
        rangeEndIso,
        rangeStartIso,
        t.loadingError,
        t.refreshed,
      ],
    );
  React.useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);
  React.useEffect(() => {
    const updateLocale = () => {
      setLocale(getInitialLocale());
    };
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
  const filteredRows = React.useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();
    return rows.filter((row) => {
      if (
        statusFilter !== "all" &&
        row.status !== statusFilter
      ) {
        return false;
      }
      if (!query) return true;
      return [
        row.appointmentNumber,
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
  }, [
    rows,
    search,
    statusFilter,
  ]);
  const todayKey = dateKey(new Date());
  const stats = React.useMemo(() => {
    const awaitingStatuses = new Set([
      "DRAFT",
      "SCHEDULED",
      "CONFIRMED",
    ]);
    return {
      total: rows.length,
      today: rows.filter((row) => {
        const start = parseDate(row.scheduledStart);
        return start && dateKey(start) === todayKey;
      }).length,
      confirmed: rows.filter(
        (row) => row.status === "CONFIRMED",
      ).length,
      awaiting: rows.filter(
        (row) =>
          awaitingStatuses.has(row.status),
      ).length,
    };
  }, [
    rows,
    todayKey,
  ]);
  const groupedRows = React.useMemo(() => {
    const map = new Map<
      string,
      AppointmentRecord[]
    >();
    for (const row of filteredRows) {
      const start = parseDate(row.scheduledStart);
      if (!start) continue;
      const key = dateKey(start);
      const current = map.get(key) || [];
      current.push(row);
      map.set(key, current);
    }
    return map;
  }, [filteredRows]);
  const weekDays = React.useMemo(
    () =>
      Array.from(
        {
          length:
            view === "week"
              ? 7
              : 1,
        },
        (_, index) =>
          addDays(range.start, index),
      ),
    [
      range.start,
      view,
    ],
  );
  const dayHours = React.useMemo(() => {
    const hours = new Set<number>();
    for (let hour = 8; hour <= 20; hour += 1) {
      hours.add(hour);
    }
    for (const row of filteredRows) {
      const start = parseDate(row.scheduledStart);
      if (
        start &&
        dateKey(start) === dateKey(range.start)
      ) {
        hours.add(start.getHours());
      }
    }
    return Array.from(hours).sort(
      (left, right) => left - right,
    );
  }, [
    filteredRows,
    range.start,
  ]);
  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all";
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };
  const movePeriod = (direction: number) => {
    setSelectedDate((current) =>
      addDays(
        current,
        direction *
          (view === "week" ? 7 : 1),
      ),
    );
  };
  const periodLabel =
    view === "week"
      ? `${formatDate(range.start, locale)} — ${formatDate(range.end, locale)}`
      : formatLongDate(
          selectedDate,
          locale,
        );
  const exportExcel = () => {
    if (!filteredRows.length) {
      toast.error(t.excelEmpty);
      return;
    }
    const tableHtml = buildTableHtml(
      filteredRows,
      locale,
    );
    const documentHtml = `
      <html dir="${locale === "ar" ? "rtl" : "ltr"}">
        <head>
          <meta charset="utf-8" />
        </head>
        <body>${tableHtml}</body>
      </html>
    `;
    const blob = new Blob(
      ["\ufeff", documentHtml],
      {
        type:
          "application/vnd.ms-excel;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      `marilyn-appointments-calendar-${dateKey(range.start)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t.excelReady);
  };
  const printCalendar = async () => {
    if (!filteredRows.length) {
      toast.error(t.printEmpty);
      return;
    }
    const opened = await openPrintReport({
      locale,
      title: t.title,
      subtitle: periodLabel,
      tableHtml: buildTableHtml(
        filteredRows,
        locale,
      ),
      recordsCount: filteredRows.length,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  };
  const openAppointment = (
    row: AppointmentRecord,
  ) => {
    router.push(
      `/system/appointments/${encodeURIComponent(row.id)}`,
    );
  };
  const renderAppointmentCard = (
    row: AppointmentRecord,
    compact = false,
  ) => (
    <button
      key={row.id}
      type="button"
      onClick={() =>
        openAppointment(row)
      }
      title={t.openDetails}
      className={cn(
        "w-full rounded-lg border p-3 text-start shadow-none transition hover:-translate-y-0.5 hover:shadow-sm",
        statusClass(row.status),
        compact && "p-2.5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {row.patientName || t.unknown}
          </p>
          <p
            dir="ltr"
            lang="en"
            className="mt-1 text-xs tabular-nums opacity-75"
          >
            {formatTime(
              row.scheduledStart,
              locale,
            )}
            {" — "}
            {formatTime(
              row.scheduledEnd,
              locale,
            )}
          </p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-current/20 bg-white/50 text-[10px]"
        >
          {statusLabel(
            row.status,
            locale,
          )}
        </Badge>
      </div>
      <div className="mt-2 space-y-1 text-xs opacity-80">
        <p className="truncate">
          {row.practitionerName || t.unknown}
        </p>
        <p className="truncate">
          {row.serviceName || t.unknown}
        </p>
        {!compact ? (
          <p className="truncate">
            {locationLabel(
              row,
              t.unknown,
            )}
          </p>
        ) : null}
      </div>
    </button>
  );
  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
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
              className="bg-background [&_svg]:text-[#a57b3d]"
              onClick={() =>
                void loadAppointments(true)
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
              className="bg-background [&_svg]:text-[#a57b3d]"
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() =>
                void printCalendar()
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() =>
                router.push(
                  "/system/appointments",
                )
              }
            >
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.total}
            value={stats.total}
            description={t.totalDesc}
            icon={CalendarRange}
          />
          <SystemKpiCard
            title={t.today}
            value={stats.today}
            description={t.todayDesc}
            icon={CalendarDays}
          />
          <SystemKpiCard
            title={t.confirmed}
            value={stats.confirmed}
            description={t.confirmedDesc}
            icon={CheckCircle2}
          />
          <SystemKpiCard
            title={t.awaiting}
            value={stats.awaiting}
            description={t.awaitingDesc}
            icon={CircleDot}
          />
        </section>
        <AppointmentCenterTabs
          active="calendar"
          locale={locale}
          counts={{
            calendar: stats.total,
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
              </p>
            </div>
          </div>
        ) : null}
        {error ? (
          <Card className="rounded-lg border-rose-200 bg-rose-50/70 shadow-none">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-rose-600" />
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
                variant="outline"
                onClick={() =>
                  void loadAppointments()
                }
              >
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                <CalendarDays className="h-4 w-4 text-[#a57b3d]" />
                {t.calendarTitle}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {t.calendarDesc}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a57b3d]" />
                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder={t.searchPlaceholder}
                  className="h-9 bg-background ps-9 shadow-none"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[165px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allStatuses}
                  </SelectItem>
                  {STATUS_VALUES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                    >
                      {statusLabel(
                        status,
                        locale,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    view === "day"
                      ? "brand"
                      : "ghost"
                  }
                  className="h-7"
                  onClick={() =>
                    setView("day")
                  }
                >
                  <Clock3 className="h-4 w-4" />
                  {t.day}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    view === "week"
                      ? "brand"
                      : "ghost"
                  }
                  className="h-7"
                  onClick={() =>
                    setView("week")
                  }
                >
                  <CalendarRange className="h-4 w-4" />
                  {t.week}
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 min-w-[190px] justify-start bg-background font-normal shadow-none [&_svg]:text-[#a57b3d]"
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    <span
                      dir="ltr"
                      lang="en"
                      className="whitespace-nowrap tabular-nums"
                    >
                      {dateKey(selectedDate)}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align={
                    locale === "ar"
                      ? "start"
                      : "end"
                  }
                  className="w-auto p-0"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(
                          startOfDay(date),
                        );
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background [&_svg]:text-[#a57b3d]"
                  aria-label={t.previous}
                  onClick={() =>
                    movePeriod(-1)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 bg-background [&_svg]:text-[#a57b3d]"
                  onClick={() =>
                    setSelectedDate(
                      startOfDay(new Date()),
                    )
                  }
                >
                  <CalendarClock className="h-4 w-4" />
                  {t.currentDay}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background [&_svg]:text-[#a57b3d]"
                  aria-label={t.next}
                  onClick={() =>
                    movePeriod(1)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 bg-background [&_svg]:text-[#a57b3d]"
                onClick={resetFilters}
                disabled={!hasFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#a57b3d]" />
                <span className="font-semibold">
                  {periodLabel}
                </span>
              </div>
              <span
                dir="ltr"
                lang="en"
                className="text-sm tabular-nums text-muted-foreground"
              >
                {filteredRows.length} {t.appointments}
              </span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map(
                  (_, index) => (
                    <Skeleton
                      key={index}
                      className="h-20 w-full rounded-lg"
                    />
                  ),
                )}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[390px] flex-col items-center justify-center rounded-lg border text-center">
                <span className="flex size-12 items-center justify-center rounded-full border border-[#cbbda9]/55 bg-[#fbf8f2] text-[#a57b3d] shadow-sm">
                  <CalendarX2 className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">
                  {t.noAppointments}
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {t.noAppointmentsDesc}
                </p>
                {hasFilters ? (
                  <Button
                    type="button"
                    variant="brand"
                    className="mt-4"
                    onClick={resetFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t.reset}
                  </Button>
                ) : null}
              </div>
            ) : view === "week" ? (
              <div className="overflow-x-auto rounded-lg border">
                <div className="grid min-w-[1260px] grid-cols-7">
                  {weekDays.map((day) => {
                    const key = dateKey(day);
                    const dayRows =
                      groupedRows.get(key) || [];
                    return (
                      <section
                        key={key}
                        className="min-h-[520px] border-e last:border-e-0"
                      >
                        <div
                          className={cn(
                            "sticky top-0 z-10 border-b bg-muted/40 px-3 py-3",
                            key === todayKey &&
                              "bg-[#fbf5e9]",
                          )}
                        >
                          <p className="text-sm font-semibold">
                            {formatDayName(
                              day,
                              locale,
                            )}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span
                              dir="ltr"
                              lang="en"
                              className="text-xs tabular-nums text-muted-foreground"
                            >
                              {formatDate(
                                day,
                                locale,
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-background"
                            >
                              {dayRows.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2 p-2">
                          {dayRows.length ? (
                            dayRows.map((row) =>
                              renderAppointmentCard(
                                row,
                                true,
                              ),
                            )
                          ) : (
                            <div className="flex min-h-[160px] items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                {dayHours.map((hour) => {
                  const hourRows = filteredRows.filter(
                    (row) => {
                      const start = parseDate(
                        row.scheduledStart,
                      );
                      return Boolean(
                        start &&
                          dateKey(start) ===
                            dateKey(range.start) &&
                          start.getHours() === hour,
                      );
                    },
                  );
                  return (
                    <div
                      key={hour}
                      className="grid min-h-[86px] grid-cols-[84px_minmax(0,1fr)] border-b last:border-b-0"
                    >
                      <div className="flex items-start justify-center border-e bg-muted/30 px-2 py-4">
                        <span
                          dir="ltr"
                          lang="en"
                          className="text-sm font-semibold tabular-nums text-muted-foreground"
                        >
                          {String(hour).padStart(2, "0")}:00
                        </span>
                      </div>
                      <div className="grid gap-2 p-2 md:grid-cols-2 xl:grid-cols-3">
                        {hourRows.length ? (
                          hourRows.map((row) =>
                            renderAppointmentCard(row),
                          )
                        ) : (
                          <div className="col-span-full flex min-h-[68px] items-center px-2 text-xs text-muted-foreground">
                            —
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
