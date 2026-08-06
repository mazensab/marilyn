"use client";

// practitioner_schedules_hr_spirit=true

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Clock3,
  Coffee,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  TimerOff,
  TriangleAlert,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { openPrintReport } from "@/lib/print-report";
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
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { PractitionerManagementTabs } from "@/components/system/practitioner-management-tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type RegisterTab = "schedules" | "breaks" | "timeOff" | "availability";

type Practitioner = {
  id: string;
  number: string;
  nameAr: string;
  nameEn: string;
  status: string;
};

type PractitionerAssignment = {
  id: string;
  practitionerId: string;
  branch: string;
  department: string;
  clinic: string;
  isPrimary: boolean;
  isActive: boolean;
};

type WeeklySchedule = {
  id: string;
  practitionerAssignmentId: string;
  practitionerId: string;
  practitioner: Practitioner;
  assignment: PractitionerAssignment;
  weekday: number;
  weekdayLabel: string;
  startTime: string;
  endTime: string;
  interval: number;
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  notes: string;
};

type ScheduleBreak = {
  id: string;
  weeklyScheduleId: string;
  practitionerAssignmentId: string;
  practitionerId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  notes: string;
};

type TimeOff = {
  id: string;
  practitionerAssignmentId: string;
  practitionerId: string;
  practitioner: Practitioner;
  startsAt: string;
  endsAt: string;
  status: string;
  reason: string;
  isEffective: boolean;
  notes: string;
};

type ServiceAssignment = {
  id: string;
  practitionerId: string;
  practitionerName: string;
  serviceName: string;
  status: string;
};

type AvailabilitySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};

type ScheduleForm = {
  id: string;
  practitionerId: string;
  practitionerAssignmentId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  interval: string;
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  notes: string;
};

type BreakForm = {
  id: string;
  weeklyScheduleId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  notes: string;
};

type TimeOffForm = {
  id: string;
  practitionerId: string;
  practitionerAssignmentId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reason: string;
  notes: string;
};

type PendingAction =
  | { kind: "schedule"; item: WeeklySchedule; next: boolean }
  | { kind: "break"; item: ScheduleBreak; next: boolean }
  | { kind: "timeOff"; item: TimeOff; next: "APPROVED" | "CANCELLED" };

const API = {
  practitioners: "/api/company/medical/practitioners/",
  schedules: "/api/company/medical/practitioner-schedules/",
  breaks: "/api/company/medical/practitioner-schedule-breaks/",
  timeOff: "/api/company/medical/practitioner-time-offs/",
  availability: "/api/company/medical/availability/",
  serviceAssignments: "/api/company/medical/practitioner-service-assignments/",
} as const;

const EMPTY_SCHEDULE_FORM: ScheduleForm = {
  id: "",
  practitionerId: "",
  practitionerAssignmentId: "",
  weekday: "0",
  startTime: "09:00",
  endTime: "17:00",
  interval: "30",
  effectiveFrom: "",
  effectiveUntil: "",
  isActive: true,
  notes: "",
};

const EMPTY_BREAK_FORM: BreakForm = {
  id: "",
  weeklyScheduleId: "",
  startTime: "13:00",
  endTime: "14:00",
  isActive: true,
  notes: "",
};

const EMPTY_TIME_OFF_FORM: TimeOffForm = {
  id: "",
  practitionerId: "",
  practitionerAssignmentId: "",
  startsAt: "",
  endsAt: "",
  status: "APPROVED",
  reason: "",
  notes: "",
};

const WEEKDAYS = [
  { value: "0", ar: "الاثنين", en: "Monday" },
  { value: "1", ar: "الثلاثاء", en: "Tuesday" },
  { value: "2", ar: "الأربعاء", en: "Wednesday" },
  { value: "3", ar: "الخميس", en: "Thursday" },
  { value: "4", ar: "الجمعة", en: "Friday" },
  { value: "5", ar: "السبت", en: "Saturday" },
  { value: "6", ar: "الأحد", en: "Sunday" },
] as const;

const translations = {
  ar: {
    badge: "العمليات الطبية",
    title: "الجداول والتوفر",
    subtitle: "إدارة جداول عمل الممارسين وفترات الاستراحة والإجازات والتحقق من التوفر الفعلي.",
    tabs: {
      directory: "ملفات الممارسين",
      assignments: "التخصصات والتعيينات",
      licenses: "التراخيص",
      schedules: "الجداول والتوفر",
    },
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    addSchedule: "إضافة جدول",
    addBreak: "إضافة استراحة",
    addTimeOff: "إضافة إجازة",
    totalSchedules: "إجمالي الجداول",
    activeSchedules: "الجداول النشطة",
    activeBreaks: "فترات الاستراحة",
    approvedTimeOff: "الإجازات المعتمدة",
    totalSchedulesDescription: "كل جداول العمل الأسبوعية المسجلة",
    activeSchedulesDescription: "جداول فعالة ضمن التشغيل الحالي",
    activeBreaksDescription: "فترات استراحة فعالة داخل الجداول",
    approvedTimeOffDescription: "إجازات معتمدة تؤثر في التوفر",
    registerTitle: "سجل الجداول والتوفر",
    registerDescription: "سجل موحد لإدارة الجداول الأسبوعية والاستراحات والإجازات وفحص المواعيد المتاحة.",
    schedules: "الجداول",
    breaks: "الاستراحات",
    timeOff: "الإجازات",
    availability: "فحص التوفر",
    searchPlaceholder: "ابحث باسم الممارس أو الفرع أو الملاحظات...",
    allPractitioners: "كل الممارسين",
    allStatuses: "كل الحالات",
    allWeekdays: "كل الأيام",
    active: "نشط",
    inactive: "غير نشط",
    approved: "معتمد",
    cancelled: "ملغي",
    reset: "إعادة ضبط",
    practitioner: "الممارس",
    assignment: "التعيين",
    weekday: "اليوم",
    workingHours: "ساعات العمل",
    interval: "مدة الموعد",
    effectivePeriod: "فترة السريان",
    status: "الحالة",
    actions: "الإجراءات",
    schedule: "الجدول",
    breakTime: "وقت الاستراحة",
    period: "الفترة",
    reason: "السبب",
    notes: "ملاحظات",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    approve: "اعتماد",
    cancelTimeOff: "إلغاء الإجازة",
    noPractitioners: "لا توجد ملفات ممارسين لإدارة الجداول.",
    noAssignments: "لا توجد تعيينات تشغيلية للممارس المحدد.",
    noSchedules: "لا توجد جداول أسبوعية مسجلة.",
    noBreaks: "لا توجد فترات استراحة مسجلة.",
    noTimeOff: "لا توجد إجازات مسجلة.",
    noResults: "لا توجد نتائج مطابقة للفلاتر الحالية.",
    addPractitioner: "إضافة ممارس",
    openAssignments: "فتح التخصصات والتعيينات",
    createScheduleTitle: "إضافة جدول أسبوعي",
    editScheduleTitle: "تعديل الجدول الأسبوعي",
    scheduleDialogDescription: "حدد تعيين الممارس واليوم وساعات العمل ومدة الموعد.",
    createBreakTitle: "إضافة فترة استراحة",
    editBreakTitle: "تعديل فترة الاستراحة",
    breakDialogDescription: "اربط فترة الاستراحة بجدول أسبوعي وحدد بدايتها ونهايتها.",
    createTimeOffTitle: "إضافة إجازة",
    editTimeOffTitle: "تعديل الإجازة",
    timeOffDialogDescription: "حدد تعيين الممارس والفترة والحالة والسبب.",
    choosePractitioner: "اختر الممارس",
    chooseAssignment: "اختر التعيين",
    chooseSchedule: "اختر الجدول",
    startTime: "وقت البداية",
    endTime: "وقت النهاية",
    slotInterval: "مدة الموعد بالدقائق",
    effectiveFrom: "ساري من",
    effectiveUntil: "ساري حتى",
    startsAt: "يبدأ في",
    endsAt: "ينتهي في",
    save: "حفظ التعديلات",
    create: "إضافة",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    confirmTitle: "تأكيد تحديث الحالة",
    confirmDescription: "سيتم تحديث السجل التشغيلي فورًا وفق الإجراء المحدد.",
    confirm: "تأكيد",
    loadingErrorTitle: "تعذر تحميل الجداول والتوفر",
    loadingErrorDescription: "تأكد من تسجيل الدخول وتشغيل الباكند ثم أعد المحاولة.",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل الصفحة مع نقص في بعض البيانات",
    partialDescription: "تعذر تحميل بعض السجلات المرجعية، وما زالت البيانات المتاحة معروضة.",
    created: "تم إنشاء السجل بنجاح.",
    updated: "تم تحديث السجل بنجاح.",
    statusUpdated: "تم تحديث الحالة بنجاح.",
    exported: "تم تجهيز ملف Excel.",
    printReady: "تم تجهيز صفحة الطباعة.",
    printBlocked: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تقرير جداول وتوفر الممارسين",
    availabilityTitle: "التحقق من التوفر الفعلي",
    availabilityDescription: "اختر تكليف الخدمة وتاريخ العمل لعرض الفترات المتاحة من محرك التوفر.",
    serviceAssignment: "تكليف الخدمة",
    chooseServiceAssignment: "اختر تكليف الخدمة",
    date: "التاريخ",
    checkAvailability: "فحص التوفر",
    checking: "جارٍ الفحص...",
    availableSlots: "الفترات المتاحة",
    noSlots: "لا توجد فترات متاحة في التاريخ المحدد.",
    slotStart: "البداية",
    slotEnd: "النهاية",
    availabilityState: "التوفر",
    available: "متاح",
    unavailable: "غير متاح",
    minutes: "دقيقة",
  },
  en: {
    badge: "Medical operations",
    title: "Schedules and Availability",
    subtitle: "Manage practitioner working schedules, breaks, time off, and real availability checks.",
    tabs: {
      directory: "Practitioner files",
      assignments: "Specialties and assignments",
      licenses: "Licenses",
      schedules: "Schedules and availability",
    },
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    addSchedule: "Add schedule",
    addBreak: "Add break",
    addTimeOff: "Add time off",
    totalSchedules: "Total schedules",
    activeSchedules: "Active schedules",
    activeBreaks: "Schedule breaks",
    approvedTimeOff: "Approved time off",
    totalSchedulesDescription: "All registered weekly working schedules",
    activeSchedulesDescription: "Schedules active in current operations",
    activeBreaksDescription: "Active breaks within weekly schedules",
    approvedTimeOffDescription: "Approved time off affecting availability",
    registerTitle: "Schedules and availability register",
    registerDescription: "Unified register for weekly schedules, breaks, time off, and appointment availability.",
    schedules: "Schedules",
    breaks: "Breaks",
    timeOff: "Time off",
    availability: "Availability check",
    searchPlaceholder: "Search by practitioner, branch, or notes...",
    allPractitioners: "All practitioners",
    allStatuses: "All statuses",
    allWeekdays: "All weekdays",
    active: "Active",
    inactive: "Inactive",
    approved: "Approved",
    cancelled: "Cancelled",
    reset: "Reset",
    practitioner: "Practitioner",
    assignment: "Assignment",
    weekday: "Weekday",
    workingHours: "Working hours",
    interval: "Slot length",
    effectivePeriod: "Effective period",
    status: "Status",
    actions: "Actions",
    schedule: "Schedule",
    breakTime: "Break time",
    period: "Period",
    reason: "Reason",
    notes: "Notes",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    approve: "Approve",
    cancelTimeOff: "Cancel time off",
    noPractitioners: "No practitioner files are available for scheduling.",
    noAssignments: "The selected practitioner has no operational assignments.",
    noSchedules: "No weekly schedules are registered.",
    noBreaks: "No schedule breaks are registered.",
    noTimeOff: "No time-off records are registered.",
    noResults: "No records match the current filters.",
    addPractitioner: "Add practitioner",
    openAssignments: "Open specialties and assignments",
    createScheduleTitle: "Add weekly schedule",
    editScheduleTitle: "Edit weekly schedule",
    scheduleDialogDescription: "Choose the practitioner assignment, weekday, working hours, and slot length.",
    createBreakTitle: "Add schedule break",
    editBreakTitle: "Edit schedule break",
    breakDialogDescription: "Link the break to a weekly schedule and define its start and end time.",
    createTimeOffTitle: "Add time off",
    editTimeOffTitle: "Edit time off",
    timeOffDialogDescription: "Choose the practitioner assignment, period, status, and reason.",
    choosePractitioner: "Choose practitioner",
    chooseAssignment: "Choose assignment",
    chooseSchedule: "Choose schedule",
    startTime: "Start time",
    endTime: "End time",
    slotInterval: "Slot length in minutes",
    effectiveFrom: "Effective from",
    effectiveUntil: "Effective until",
    startsAt: "Starts at",
    endsAt: "Ends at",
    save: "Save changes",
    create: "Create",
    cancel: "Cancel",
    saving: "Saving...",
    confirmTitle: "Confirm status update",
    confirmDescription: "The operational record will be updated immediately.",
    confirm: "Confirm",
    loadingErrorTitle: "Unable to load schedules and availability",
    loadingErrorDescription: "Check your session and backend service, then try again.",
    retry: "Retry",
    partialTitle: "The page loaded with partial data",
    partialDescription: "Some reference records could not be loaded. Available data is still shown.",
    created: "Record created successfully.",
    updated: "Record updated successfully.",
    statusUpdated: "Status updated successfully.",
    exported: "Excel file is ready.",
    printReady: "Print page is ready.",
    printBlocked: "The print window was blocked. Allow pop-ups and try again.",
    reportTitle: "Practitioner schedules and availability report",
    availabilityTitle: "Check real availability",
    availabilityDescription: "Choose a service assignment and working date to view slots returned by the availability engine.",
    serviceAssignment: "Service assignment",
    chooseServiceAssignment: "Choose service assignment",
    date: "Date",
    checkAvailability: "Check availability",
    checking: "Checking...",
    availableSlots: "Available slots",
    noSlots: "No slots are available on the selected date.",
    slotStart: "Start",
    slotEnd: "End",
    availabilityState: "Availability",
    available: "Available",
    unavailable: "Unavailable",
    minutes: "minutes",
  },
} as const;

function useLocale(): Locale {
  const [locale, setLocale] = React.useState<Locale>("ar");

  React.useEffect(() => {
    const read = () => {
      const stored = window.localStorage.getItem("primey-locale");
      setLocale(stored === "en" ? "en" : "ar");
    };

    read();
    window.addEventListener("storage", read);
    window.addEventListener("primey-locale-change", read as EventListener);

    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("primey-locale-change", read as EventListener);
    };
  }, []);

  return locale;
}

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}

function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = text(value).toLowerCase();
  if (["true", "1", "yes", "active", "approved"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive", "cancelled"].includes(normalized)) return false;
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractItems(payload: unknown, aliases: string[] = []): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  const keys = ["items", "results", "data", ...aliases];
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function nestedName(value: unknown, locale: Locale): string {
  const record = asRecord(value);
  return text(
    locale === "ar"
      ? record.name_ar || record.full_name_ar || record.name || record.title_ar || record.title
      : record.name_en || record.full_name_en || record.name || record.title_en || record.title,
  );
}

function normalizePractitioner(value: unknown): Practitioner {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk || record.uuid),
    number: text(record.practitioner_number || record.code || record.number),
    nameAr: text(record.full_name_ar || record.name_ar || record.full_name || record.name),
    nameEn: text(record.full_name_en || record.name_en || record.full_name || record.name),
    status: text(record.status, "ACTIVE").toUpperCase(),
  };
}

function normalizeAssignment(value: unknown, locale: Locale): PractitionerAssignment {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk),
    practitionerId: text(record.practitioner_id || asRecord(record.practitioner).id),
    branch: nestedName(record.branch, locale) || text(record.branch_name || record.branch_id),
    department: nestedName(record.department, locale) || text(record.department_name || record.department_id),
    clinic: nestedName(record.clinic, locale) || text(record.clinic_name || record.clinic_id),
    isPrimary: bool(record.is_primary),
    isActive: bool(record.is_active, true),
  };
}

function normalizeSchedule(value: unknown, locale: Locale): WeeklySchedule {
  const record = asRecord(value);
  const practitioner = normalizePractitioner(record.practitioner);
  return {
    id: text(record.id || record.pk),
    practitionerAssignmentId: text(record.practitioner_assignment_id),
    practitionerId: text(record.practitioner_id || practitioner.id),
    practitioner,
    assignment: normalizeAssignment(record.practitioner_assignment, locale),
    weekday: numberValue(record.weekday),
    weekdayLabel: text(record.weekday_label),
    startTime: text(record.start_time).slice(0, 5),
    endTime: text(record.end_time).slice(0, 5),
    interval: numberValue(record.slot_interval_minutes, 30),
    effectiveFrom: text(record.effective_from).slice(0, 10),
    effectiveUntil: text(record.effective_until).slice(0, 10),
    isActive: bool(record.is_active, true),
    notes: text(record.notes),
  };
}

function normalizeBreak(value: unknown): ScheduleBreak {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk),
    weeklyScheduleId: text(record.weekly_schedule_id),
    practitionerAssignmentId: text(record.practitioner_assignment_id),
    practitionerId: text(record.practitioner_id),
    startTime: text(record.start_time).slice(0, 5),
    endTime: text(record.end_time).slice(0, 5),
    isActive: bool(record.is_active, true),
    notes: text(record.notes),
  };
}

function normalizeTimeOff(value: unknown): TimeOff {
  const record = asRecord(value);
  const practitioner = normalizePractitioner(record.practitioner);
  return {
    id: text(record.id || record.pk),
    practitionerAssignmentId: text(record.practitioner_assignment_id),
    practitionerId: text(record.practitioner_id || practitioner.id),
    practitioner,
    startsAt: text(record.starts_at),
    endsAt: text(record.ends_at),
    status: text(record.status, "APPROVED").toUpperCase(),
    reason: text(record.reason),
    isEffective: bool(record.is_effective),
    notes: text(record.notes),
  };
}

function normalizeServiceAssignment(value: unknown, locale: Locale): ServiceAssignment {
  const record = asRecord(value);
  const practitionerRecord = asRecord(record.practitioner);
  const locationAssignment = asRecord(record.practitioner_assignment);
  const offering = asRecord(record.service_offering);
  const catalogItem = asRecord(offering.catalog_item || record.catalog_item);
  return {
    id: text(record.id || record.pk),
    practitionerId: text(
      record.practitioner_id ||
        practitionerRecord.id ||
        locationAssignment.practitioner_id ||
        asRecord(locationAssignment.practitioner).id,
    ),
    practitionerName:
      nestedName(record.practitioner, locale) ||
      nestedName(locationAssignment.practitioner, locale) ||
      text(record.practitioner_name),
    serviceName:
      nestedName(record.service_offering, locale) ||
      nestedName(offering.catalog_item, locale) ||
      nestedName(record.catalog_item, locale) ||
      text(catalogItem.code || record.service_offering_id),
    status: text(record.status, "ACTIVE").toUpperCase(),
  };
}

function normalizeSlot(value: unknown, index: number): AvailabilitySlot {
  const record = asRecord(value);
  return {
    id: text(record.id || record.key || record.starts_at || record.start_time, `slot-${index + 1}`),
    startsAt: text(record.starts_at || record.start_at || record.start_time || record.start),
    endsAt: text(record.ends_at || record.end_at || record.end_time || record.end),
    available: bool(record.available ?? record.is_available, true),
  };
}

function practitionerName(item: Practitioner, locale: Locale): string {
  return (locale === "ar" ? item.nameAr || item.nameEn : item.nameEn || item.nameAr) || item.number || "—";
}

function weekdayName(value: number, locale: Locale, fallback = ""): string {
  const option = WEEKDAYS.find((item) => Number(item.value) === value);
  return option ? option[locale] : fallback || "—";
}

function assignmentLabel(item: PractitionerAssignment): string {
  return [item.branch, item.department, item.clinic].filter(Boolean).join(" — ") || `#${item.id}`;
}

function formatDate(value: string): string {
  return value ? value.slice(0, 10) : "—";
}

function formatDateTime(value: string): string {
  if (!value) return "—";
  return value.replace("T", " ").slice(0, 16);
}

function toLocalInput(value: string): string {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getApiBaseUrl() {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");

  return envBase.endsWith("/api") ? envBase.slice(0, -4) : envBase;
}

function makeApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(makeApiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(text(record.message || record.detail, `HTTP ${response.status}`));
  }
  return payload;
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      {label}
    </Badge>
  );
}

export default function PractitionerSchedulesClient() {
  const locale = useLocale();
  const t = translations[locale];
  const direction = locale === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [practitioners, setPractitioners] = React.useState<Practitioner[]>([]);
  const [assignments, setAssignments] = React.useState<PractitionerAssignment[]>([]);
  const [assignmentsPractitionerId, setAssignmentsPractitionerId] = React.useState("");
  const [schedules, setSchedules] = React.useState<WeeklySchedule[]>([]);
  const [breaks, setBreaks] = React.useState<ScheduleBreak[]>([]);
  const [timeOff, setTimeOff] = React.useState<TimeOff[]>([]);
  const [serviceAssignments, setServiceAssignments] = React.useState<ServiceAssignment[]>([]);
  const [tab, setTab] = React.useState<RegisterTab>("schedules");
  const [search, setSearch] = React.useState("");
  const [practitionerFilter, setPractitionerFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [weekdayFilter, setWeekdayFilter] = React.useState("all");
  const [scheduleDialog, setScheduleDialog] = React.useState(false);
  const [breakDialog, setBreakDialog] = React.useState(false);
  const [timeOffDialog, setTimeOffDialog] = React.useState(false);
  const [scheduleForm, setScheduleForm] = React.useState<ScheduleForm>(EMPTY_SCHEDULE_FORM);
  const [breakForm, setBreakForm] = React.useState<BreakForm>(EMPTY_BREAK_FORM);
  const [timeOffForm, setTimeOffForm] = React.useState<TimeOffForm>(EMPTY_TIME_OFF_FORM);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [availabilityServiceId, setAvailabilityServiceId] = React.useState("");
  const [availabilityDate, setAvailabilityDate] = React.useState("");
  const [checkingAvailability, setCheckingAvailability] = React.useState(false);
  const [availabilitySlots, setAvailabilitySlots] = React.useState<AvailabilitySlot[]>([]);
  const [availabilityChecked, setAvailabilityChecked] = React.useState(false);

  const loadAssignments = React.useCallback(
    async (practitionerId: string) => {
      if (!practitionerId) {
        setAssignments([]);
        setAssignmentsPractitionerId("");
        return [];
      }
      if (assignmentsPractitionerId === practitionerId) return assignments;
      const payload = await fetchJson(`${API.practitioners}${practitionerId}/assignments/?page_size=500`);
      const rows = extractItems(payload, ["assignments"])
        .map((item) => normalizeAssignment(item, locale))
        .filter((item) => item.id && item.isActive);
      setAssignments(rows);
      setAssignmentsPractitionerId(practitionerId);
      return rows;
    },
    [assignments, assignmentsPractitionerId, locale],
  );

  const loadAll = React.useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        fetchJson(`${API.practitioners}?page_size=500`),
        fetchJson(`${API.schedules}?page_size=500`),
        fetchJson(`${API.breaks}?page_size=500`),
        fetchJson(`${API.timeOff}?page_size=500`),
        fetchJson(`${API.serviceAssignments}?page_size=500&is_active=true`),
      ]);

      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

      if (failures.length === results.length) {
        setError(failures[0] || t.loadingErrorDescription);
      } else {
        const valueAt = (index: number): unknown =>
          results[index]?.status === "fulfilled" ? (results[index] as PromiseFulfilledResult<unknown>).value : {};

        setPractitioners(extractItems(valueAt(0), ["practitioners"]).map(normalizePractitioner).filter((item) => item.id));
        setSchedules(extractItems(valueAt(1), ["schedules"]).map((item) => normalizeSchedule(item, locale)).filter((item) => item.id));
        setBreaks(extractItems(valueAt(2), ["schedule_breaks"]).map(normalizeBreak).filter((item) => item.id));
        setTimeOff(extractItems(valueAt(3), ["time_off_periods"]).map(normalizeTimeOff).filter((item) => item.id));
        setServiceAssignments(
          extractItems(valueAt(4), ["practitioner_service_assignments"])
            .map((item) => normalizeServiceAssignment(item, locale))
            .filter((item) => item.id && item.status !== "ARCHIVED"),
        );
        setWarnings(failures);
        if (silent) toast.success(t.refresh);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [locale, t.loadingErrorDescription, t.refresh],
  );

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const practitionerById = React.useMemo(
    () => new Map(practitioners.map((item) => [item.id, item])),
    [practitioners],
  );
  const scheduleById = React.useMemo(() => new Map(schedules.map((item) => [item.id, item])), [schedules]);

  const normalizedSearch = search.trim().toLowerCase();
  const scheduleRows = React.useMemo(
    () =>
      schedules.filter((item) => {
        const name = practitionerName(item.practitioner, locale).toLowerCase();
        const assignment = assignmentLabel(item.assignment).toLowerCase();
        const matchesSearch = !normalizedSearch || [name, assignment, item.notes.toLowerCase()].some((value) => value.includes(normalizedSearch));
        const matchesPractitioner = practitionerFilter === "all" || item.practitionerId === practitionerFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);
        const matchesWeekday = weekdayFilter === "all" || item.weekday === Number(weekdayFilter);
        return matchesSearch && matchesPractitioner && matchesStatus && matchesWeekday;
      }),
    [locale, normalizedSearch, practitionerFilter, schedules, statusFilter, weekdayFilter],
  );

  const breakRows = React.useMemo(
    () =>
      breaks.filter((item) => {
        const schedule = scheduleById.get(item.weeklyScheduleId);
        const practitioner = practitionerById.get(item.practitionerId) || schedule?.practitioner;
        const name = practitioner ? practitionerName(practitioner, locale).toLowerCase() : "";
        const matchesSearch = !normalizedSearch || [name, item.notes.toLowerCase()].some((value) => value.includes(normalizedSearch));
        const matchesPractitioner = practitionerFilter === "all" || item.practitionerId === practitionerFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);
        return matchesSearch && matchesPractitioner && matchesStatus;
      }),
    [breaks, locale, normalizedSearch, practitionerById, practitionerFilter, scheduleById, statusFilter],
  );

  const timeOffRows = React.useMemo(
    () =>
      timeOff.filter((item) => {
        const name = practitionerName(item.practitioner, locale).toLowerCase();
        const matchesSearch = !normalizedSearch || [name, item.reason.toLowerCase(), item.notes.toLowerCase()].some((value) => value.includes(normalizedSearch));
        const matchesPractitioner = practitionerFilter === "all" || item.practitionerId === practitionerFilter;
        const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesPractitioner && matchesStatus;
      }),
    [locale, normalizedSearch, practitionerFilter, statusFilter, timeOff],
  );

  const activeRowsCount = tab === "schedules" ? scheduleRows.length : tab === "breaks" ? breakRows.length : tab === "timeOff" ? timeOffRows.length : availabilitySlots.length;
  const hasFilters = Boolean(search) || practitionerFilter !== "all" || statusFilter !== "all" || weekdayFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setPractitionerFilter("all");
    setStatusFilter("all");
    setWeekdayFilter("all");
  };

  const openNewSchedule = async () => {
    const practitionerId = practitionerFilter !== "all" ? practitionerFilter : practitioners[0]?.id || "";
    const rows = await loadAssignments(practitionerId).catch((caught) => {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
      return [];
    });
    setScheduleForm({
      ...EMPTY_SCHEDULE_FORM,
      practitionerId,
      practitionerAssignmentId: rows[0]?.id || "",
    });
    setScheduleDialog(true);
  };

  const openEditSchedule = async (item: WeeklySchedule) => {
    await loadAssignments(item.practitionerId).catch(() => []);
    setScheduleForm({
      id: item.id,
      practitionerId: item.practitionerId,
      practitionerAssignmentId: item.practitionerAssignmentId,
      weekday: String(item.weekday),
      startTime: item.startTime,
      endTime: item.endTime,
      interval: String(item.interval),
      effectiveFrom: item.effectiveFrom,
      effectiveUntil: item.effectiveUntil,
      isActive: item.isActive,
      notes: item.notes,
    });
    setScheduleDialog(true);
  };

  const openNewBreak = () => {
    setBreakForm({ ...EMPTY_BREAK_FORM, weeklyScheduleId: scheduleRows[0]?.id || schedules[0]?.id || "" });
    setBreakDialog(true);
  };

  const openEditBreak = (item: ScheduleBreak) => {
    setBreakForm({
      id: item.id,
      weeklyScheduleId: item.weeklyScheduleId,
      startTime: item.startTime,
      endTime: item.endTime,
      isActive: item.isActive,
      notes: item.notes,
    });
    setBreakDialog(true);
  };

  const openNewTimeOff = async () => {
    const practitionerId = practitionerFilter !== "all" ? practitionerFilter : practitioners[0]?.id || "";
    const rows = await loadAssignments(practitionerId).catch((caught) => {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
      return [];
    });
    setTimeOffForm({
      ...EMPTY_TIME_OFF_FORM,
      practitionerId,
      practitionerAssignmentId: rows[0]?.id || "",
    });
    setTimeOffDialog(true);
  };

  const openEditTimeOff = async (item: TimeOff) => {
    await loadAssignments(item.practitionerId).catch(() => []);
    setTimeOffForm({
      id: item.id,
      practitionerId: item.practitionerId,
      practitionerAssignmentId: item.practitionerAssignmentId,
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
      status: item.status,
      reason: item.reason,
      notes: item.notes,
    });
    setTimeOffDialog(true);
  };

  const saveSchedule = async () => {
    if (!scheduleForm.practitionerAssignmentId || !scheduleForm.startTime || !scheduleForm.endTime) return;
    setSaving(true);
    try {
      const path = scheduleForm.id ? `${API.schedules}${scheduleForm.id}/` : API.schedules;
      await fetchJson(path, {
        method: scheduleForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          practitioner_assignment_id: scheduleForm.practitionerAssignmentId,
          weekday: Number(scheduleForm.weekday),
          start_time: scheduleForm.startTime,
          end_time: scheduleForm.endTime,
          slot_interval_minutes: Number(scheduleForm.interval),
          effective_from: scheduleForm.effectiveFrom || null,
          effective_until: scheduleForm.effectiveUntil || null,
          is_active: scheduleForm.isActive,
          notes: scheduleForm.notes,
        }),
      });
      toast.success(scheduleForm.id ? t.updated : t.created);
      setScheduleDialog(false);
      await loadAll(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
    } finally {
      setSaving(false);
    }
  };

  const saveBreak = async () => {
    if (!breakForm.weeklyScheduleId || !breakForm.startTime || !breakForm.endTime) return;
    setSaving(true);
    try {
      const path = breakForm.id ? `${API.breaks}${breakForm.id}/` : API.breaks;
      await fetchJson(path, {
        method: breakForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          weekly_schedule_id: breakForm.weeklyScheduleId,
          start_time: breakForm.startTime,
          end_time: breakForm.endTime,
          is_active: breakForm.isActive,
          notes: breakForm.notes,
        }),
      });
      toast.success(breakForm.id ? t.updated : t.created);
      setBreakDialog(false);
      await loadAll(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
    } finally {
      setSaving(false);
    }
  };

  const saveTimeOff = async () => {
    if (!timeOffForm.practitionerAssignmentId || !timeOffForm.startsAt || !timeOffForm.endsAt) return;
    setSaving(true);
    try {
      const path = timeOffForm.id ? `${API.timeOff}${timeOffForm.id}/` : API.timeOff;
      await fetchJson(path, {
        method: timeOffForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          practitioner_assignment_id: timeOffForm.practitionerAssignmentId,
          starts_at: timeOffForm.startsAt,
          ends_at: timeOffForm.endsAt,
          status: timeOffForm.status,
          reason: timeOffForm.reason,
          notes: timeOffForm.notes,
        }),
      });
      toast.success(timeOffForm.id ? t.updated : t.created);
      setTimeOffDialog(false);
      await loadAll(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
    } finally {
      setSaving(false);
    }
  };

  const applyPendingAction = async () => {
    if (!pendingAction) return;
    setSaving(true);
    try {
      if (pendingAction.kind === "schedule") {
        await fetchJson(`${API.schedules}${pendingAction.item.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: pendingAction.next }),
        });
      } else if (pendingAction.kind === "break") {
        await fetchJson(`${API.breaks}${pendingAction.item.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: pendingAction.next }),
        });
      } else {
        await fetchJson(`${API.timeOff}${pendingAction.item.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ status: pendingAction.next }),
        });
      }
      toast.success(t.statusUpdated);
      setPendingAction(null);
      await loadAll(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
    } finally {
      setSaving(false);
    }
  };

  const checkAvailability = async () => {
    if (!availabilityServiceId || !availabilityDate) return;
    setCheckingAvailability(true);
    setAvailabilityChecked(false);
    try {
      const params = new URLSearchParams({
        practitioner_service_assignment_id: availabilityServiceId,
        date: availabilityDate,
      });
      const payload = await fetchJson(`${API.availability}?${params.toString()}`);
      const slots = extractItems(payload, ["slots", "availability_slots"])
        .map(normalizeSlot)
        .filter((item) => item.startsAt || item.endsAt);
      setAvailabilitySlots(slots);
      setAvailabilityChecked(true);
    } catch (caught) {
      setAvailabilitySlots([]);
      setAvailabilityChecked(true);
      toast.error(caught instanceof Error ? caught.message : t.loadingErrorDescription);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const reportRows = React.useMemo(() => {
    if (tab === "schedules") {
      return scheduleRows.map((item) => [
        practitionerName(item.practitioner, locale),
        weekdayName(item.weekday, locale, item.weekdayLabel),
        `${item.startTime} - ${item.endTime}`,
        `${item.interval} ${t.minutes}`,
        `${formatDate(item.effectiveFrom)} - ${formatDate(item.effectiveUntil)}`,
        item.isActive ? t.active : t.inactive,
      ]);
    }
    if (tab === "breaks") {
      return breakRows.map((item) => {
        const schedule = scheduleById.get(item.weeklyScheduleId);
        const practitioner = practitionerById.get(item.practitionerId) || schedule?.practitioner;
        return [
          practitioner ? practitionerName(practitioner, locale) : "—",
          schedule ? weekdayName(schedule.weekday, locale, schedule.weekdayLabel) : `#${item.weeklyScheduleId}`,
          `${item.startTime} - ${item.endTime}`,
          item.isActive ? t.active : t.inactive,
          item.notes || "—",
        ];
      });
    }
    if (tab === "timeOff") {
      return timeOffRows.map((item) => [
        practitionerName(item.practitioner, locale),
        formatDateTime(item.startsAt),
        formatDateTime(item.endsAt),
        item.status === "APPROVED" ? t.approved : t.cancelled,
        item.reason || "—",
      ]);
    }
    return availabilitySlots.map((item) => [
      formatDateTime(item.startsAt),
      formatDateTime(item.endsAt),
      item.available ? t.available : t.unavailable,
    ]);
  }, [availabilitySlots, breakRows, locale, practitionerById, scheduleById, scheduleRows, t, tab, timeOffRows]);

  const reportHeaders =
    tab === "schedules"
      ? [t.practitioner, t.weekday, t.workingHours, t.interval, t.effectivePeriod, t.status]
      : tab === "breaks"
        ? [t.practitioner, t.schedule, t.breakTime, t.status, t.notes]
        : tab === "timeOff"
          ? [t.practitioner, t.startsAt, t.endsAt, t.status, t.reason]
          : [t.slotStart, t.slotEnd, t.availabilityState];

  const tableHtml = React.useMemo(() => {
    const head = reportHeaders.map((item) => `<th>${escapeHtml(item)}</th>`).join("");
    const body = reportRows.length
      ? reportRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${reportHeaders.length}">${escapeHtml(t.noResults)}</td></tr>`;
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }, [reportHeaders, reportRows, t.noResults]);

  const exportExcel = () => {
    const html = `<!doctype html><html dir="${direction}"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:6px;text-align:${locale === "ar" ? "right" : "left"}}th{background:#e5e7eb}</style></head><body><h1>${escapeHtml(t.reportTitle)}</h1>${tableHtml}</body></html>`;
    const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-practitioner-${tab}-${new Date().toISOString().slice(0, 10)}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(t.exported);
  };

  const printRegister = async () => {
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: t.registerDescription,
      tableHtml,
      recordsCount: reportRows.length,
    });
    toast[opened ? "success" : "error"](opened ? t.printReady : t.printBlocked);
  };

  const openPrimaryAction = () => {
    if (tab === "breaks") openNewBreak();
    else if (tab === "timeOff") void openNewTimeOff();
    else void openNewSchedule();
  };

  const primaryLabel = tab === "breaks" ? t.addBreak : tab === "timeOff" ? t.addTimeOff : t.addSchedule;
  const primaryDisabled =
    tab === "availability" ||
    !practitioners.length ||
    (tab === "breaks" && !schedules.length);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"><div className="w-full space-y-5">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)}
        </div>
        <Skeleton className="h-[520px] w-full rounded-lg" />
      </div></main>
    );
  }

  return (
    <main
      dir={direction}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="text-start lg:max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
            <Stethoscope className="h-3.5 w-3.5 text-[#a57b3d]" />
                        {t.badge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-emerald-500" />
            {locale === "ar"
              ? "متصل بواجهات الجداول والاستراحات والإجازات والتوفر الحقيقية"
              : "Connected to live schedules, breaks, time-off, and availability APIs"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={() => void loadAll(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t.refresh}
          </Button>
          <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={exportExcel} disabled={!activeRowsCount || tab === "availability"}>
            <FileSpreadsheet className="h-4 w-4" />
            {t.excel}
          </Button>
          <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={() => void printRegister()} disabled={!activeRowsCount}>
            <Printer className="h-4 w-4" />
            {t.print}
          </Button>
          <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={openPrimaryAction} disabled={primaryDisabled}>
            <Plus className="h-4 w-4" />
            {primaryLabel}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SystemKpiCard title={t.totalSchedules} value={schedules.length} description={t.totalSchedulesDescription} icon={CalendarClock} />
        <SystemKpiCard title={t.activeSchedules} value={schedules.filter((item) => item.isActive).length} description={t.activeSchedulesDescription} icon={CheckCircle2} />
        <SystemKpiCard title={t.activeBreaks} value={breaks.filter((item) => item.isActive).length} description={t.activeBreaksDescription} icon={Coffee} />
        <SystemKpiCard title={t.approvedTimeOff} value={timeOff.filter((item) => item.status === "APPROVED").length} description={t.approvedTimeOffDescription} icon={TimerOff} />
      </section>

        <PractitionerManagementTabs
          active="schedules"
          locale={locale}
          counts={{
            schedules:
              schedules.length,
          }}
        />

      {warnings.length ? (
        <Card className="border-amber-200 bg-amber-50/70 shadow-none">
          <CardContent className="flex gap-3 p-4 text-amber-800">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div><p className="font-semibold">{t.partialTitle}</p><p className="mt-1 text-sm">{t.partialDescription}</p></div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-rose-200 shadow-none">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <TriangleAlert className="h-8 w-8 text-rose-600" />
            <div><h3 className="font-semibold">{t.loadingErrorTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{error || t.loadingErrorDescription}</p></div>
            <Button variant="outline" onClick={() => void loadAll()}>{t.retry}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <CalendarClock className="h-4 w-4 text-[#a57b3d]" />{t.registerTitle}</CardTitle>
                <CardDescription className="mt-1">{t.registerDescription}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ["schedules", t.schedules, CalendarDays],
                  ["breaks", t.breaks, Coffee],
                  ["timeOff", t.timeOff, TimerOff],
                  ["availability", t.availability, Clock3],
                ] as const).map(([value, label, Icon]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={tab === value ? "brand" : "outline"}
                    className={tab === value ? registerBrandButtonClass : registerOutlineButtonClass}
                    onClick={() => { setTab(value); resetFilters(); }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            {tab === "availability" ? (
              <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
                <div>
                  <h3 className="font-semibold">{t.availabilityTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.availabilityDescription}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>{t.serviceAssignment}</Label>
                    <Select value={availabilityServiceId} onValueChange={setAvailabilityServiceId}>
                      <SelectTrigger><SelectValue placeholder={t.chooseServiceAssignment} /></SelectTrigger>
                      <SelectContent className="max-h-[320px]">
                        {serviceAssignments.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {[item.practitionerName, item.serviceName].filter(Boolean).join(" — ") || `#${item.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.date}</Label>
                    <Input type="date" value={availabilityDate} onChange={(event) => setAvailabilityDate(event.target.value)} />
                  </div>
                  <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={() => void checkAvailability()} disabled={!availabilityServiceId || !availabilityDate || checkingAvailability}>
                    {checkingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {checkingAvailability ? t.checking : t.checkAvailability}
                  </Button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-background"><div className="overflow-x-auto">
                  <Table variant="register" layout="fixed" minWidth="720px">
                    <TableHeader><TableRow><TableHead>{t.slotStart}</TableHead><TableHead>{t.slotEnd}</TableHead><TableHead>{t.availabilityState}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {availabilitySlots.map((item) => (
                        <TableRow key={item.id} className="h-[58px] hover:bg-muted/35">
                          <TableCell dir="ltr" className="tabular-nums">{formatDateTime(item.startsAt)}</TableCell>
                          <TableCell dir="ltr" className="tabular-nums">{formatDateTime(item.endsAt)}</TableCell>
                          <TableCell><StatusBadge active={item.available} label={item.available ? t.available : t.unavailable} /></TableCell>
                        </TableRow>
                      ))}
                      {availabilityChecked && !availabilitySlots.length ? (
                        <TableRow><TableCell colSpan={3} className="h-48 text-center text-sm text-muted-foreground">{t.noSlots}</TableCell></TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div></div>
              </div>
            ) : (
              <>
                <DataRegisterToolbar className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_180px_160px_160px_auto]">
                  <DataRegisterSearch
                    value={search}
                    onChange={setSearch}
                    placeholder={t.searchPlaceholder}
                  />
                  <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
                    <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[320px]"><SelectItem value="all">{t.allPractitioners}</SelectItem>{practitioners.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item, locale)}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allStatuses}</SelectItem>
                      {tab === "timeOff" ? <><SelectItem value="approved">{t.approved}</SelectItem><SelectItem value="cancelled">{t.cancelled}</SelectItem></> : <><SelectItem value="active">{t.active}</SelectItem><SelectItem value="inactive">{t.inactive}</SelectItem></>}
                    </SelectContent>
                  </Select>
                  {tab === "schedules" ? (
                    <Select value={weekdayFilter} onValueChange={setWeekdayFilter}>
                      <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">{t.allWeekdays}</SelectItem>{WEEKDAYS.map((item) => <SelectItem key={item.value} value={item.value}>{item[locale]}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <div />}
                  <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={resetFilters} disabled={!hasFilters}>
                    <RotateCcw className="h-4 w-4" />
                    {t.reset}
                  </Button>
                </DataRegisterToolbar>

                <div className="overflow-hidden rounded-lg border bg-background"><div className="overflow-x-auto">
                  {tab === "schedules" ? (
                    <Table variant="register" layout="fixed" minWidth="1180px">
                      <TableHeader><TableRow><TableHead className="sticky start-0 z-20 w-[220px] bg-muted/40">{t.practitioner}</TableHead><TableHead className="w-[150px]">{t.weekday}</TableHead><TableHead className="w-[180px]">{t.workingHours}</TableHead><TableHead className="w-[140px]">{t.interval}</TableHead><TableHead className="w-[220px]">{t.assignment}</TableHead><TableHead className="w-[200px]">{t.effectivePeriod}</TableHead><TableHead className="w-[120px]">{t.status}</TableHead><TableHead className="sticky end-0 z-20 w-[90px] bg-muted/40 text-center">{t.actions}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {scheduleRows.map((item) => (
                          <TableRow key={item.id} className="group h-[62px] hover:bg-muted/35">
                            <TableCell className="sticky start-0 z-10 bg-background font-semibold group-hover:bg-muted/35">{practitionerName(item.practitioner, locale)}</TableCell>
                            <TableCell>{weekdayName(item.weekday, locale, item.weekdayLabel)}</TableCell>
                            <TableCell dir="ltr" className="tabular-nums">{item.startTime} - {item.endTime}</TableCell>
                            <TableCell>{item.interval} {t.minutes}</TableCell>
                            <TableCell className="truncate">{assignmentLabel(item.assignment)}</TableCell>
                            <TableCell dir="ltr" className="tabular-nums">{formatDate(item.effectiveFrom)} — {formatDate(item.effectiveUntil)}</TableCell>
                            <TableCell><StatusBadge active={item.isActive} label={item.isActive ? t.active : t.inactive} /></TableCell>
                            <TableCell className="sticky end-0 z-10 bg-background text-center group-hover:bg-muted/35"><RowActions onEdit={() => void openEditSchedule(item)} onToggle={() => setPendingAction({ kind: "schedule", item, next: !item.isActive })} active={item.isActive} t={t} /></TableCell>
                          </TableRow>
                        ))}
                        {!scheduleRows.length ? <EmptyRow colSpan={8} message={!practitioners.length ? t.noPractitioners : hasFilters ? t.noResults : t.noSchedules} practitioners={practitioners.length} assignmentsHref t={t} /> : null}
                      </TableBody>
                    </Table>
                  ) : null}

                  {tab === "breaks" ? (
                    <Table variant="register" layout="fixed" minWidth="980px">
                      <TableHeader><TableRow><TableHead className="sticky start-0 z-20 w-[220px] bg-muted/40">{t.practitioner}</TableHead><TableHead className="w-[220px]">{t.schedule}</TableHead><TableHead className="w-[180px]">{t.breakTime}</TableHead><TableHead>{t.notes}</TableHead><TableHead className="w-[120px]">{t.status}</TableHead><TableHead className="sticky end-0 z-20 w-[90px] bg-muted/40 text-center">{t.actions}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {breakRows.map((item) => {
                          const schedule = scheduleById.get(item.weeklyScheduleId);
                          const practitioner = practitionerById.get(item.practitionerId) || schedule?.practitioner;
                          return (
                            <TableRow key={item.id} className="group h-[62px] hover:bg-muted/35">
                              <TableCell className="sticky start-0 z-10 bg-background font-semibold group-hover:bg-muted/35">{practitioner ? practitionerName(practitioner, locale) : "—"}</TableCell>
                              <TableCell>{schedule ? weekdayName(schedule.weekday, locale, schedule.weekdayLabel) : `#${item.weeklyScheduleId}`}</TableCell>
                              <TableCell dir="ltr" className="tabular-nums">{item.startTime} - {item.endTime}</TableCell>
                              <TableCell className="truncate">{item.notes || "—"}</TableCell>
                              <TableCell><StatusBadge active={item.isActive} label={item.isActive ? t.active : t.inactive} /></TableCell>
                              <TableCell className="sticky end-0 z-10 bg-background text-center group-hover:bg-muted/35"><RowActions onEdit={() => openEditBreak(item)} onToggle={() => setPendingAction({ kind: "break", item, next: !item.isActive })} active={item.isActive} t={t} /></TableCell>
                            </TableRow>
                          );
                        })}
                        {!breakRows.length ? <EmptyRow colSpan={6} message={!practitioners.length ? t.noPractitioners : hasFilters ? t.noResults : t.noBreaks} practitioners={practitioners.length} assignmentsHref={false} t={t} /> : null}
                      </TableBody>
                    </Table>
                  ) : null}

                  {tab === "timeOff" ? (
                    <Table variant="register" layout="fixed" minWidth="1080px">
                      <TableHeader><TableRow><TableHead className="sticky start-0 z-20 w-[220px] bg-muted/40">{t.practitioner}</TableHead><TableHead className="w-[190px]">{t.startsAt}</TableHead><TableHead className="w-[190px]">{t.endsAt}</TableHead><TableHead>{t.reason}</TableHead><TableHead className="w-[130px]">{t.status}</TableHead><TableHead className="sticky end-0 z-20 w-[90px] bg-muted/40 text-center">{t.actions}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {timeOffRows.map((item) => (
                          <TableRow key={item.id} className="group h-[62px] hover:bg-muted/35">
                            <TableCell className="sticky start-0 z-10 bg-background font-semibold group-hover:bg-muted/35">{practitionerName(item.practitioner, locale)}</TableCell>
                            <TableCell dir="ltr" className="tabular-nums">{formatDateTime(item.startsAt)}</TableCell>
                            <TableCell dir="ltr" className="tabular-nums">{formatDateTime(item.endsAt)}</TableCell>
                            <TableCell className="truncate">{item.reason || "—"}</TableCell>
                            <TableCell><StatusBadge active={item.status === "APPROVED"} label={item.status === "APPROVED" ? t.approved : t.cancelled} /></TableCell>
                            <TableCell className="sticky end-0 z-10 bg-background text-center group-hover:bg-muted/35">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
                                  <DropdownMenuItem onSelect={() => void openEditTimeOff(item)}><Pencil className="h-4 w-4" />{t.edit}</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => setPendingAction({ kind: "timeOff", item, next: item.status === "APPROVED" ? "CANCELLED" : "APPROVED" })}>
                                    {item.status === "APPROVED" ? <CirclePause className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                                    {item.status === "APPROVED" ? t.cancelTimeOff : t.approve}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!timeOffRows.length ? <EmptyRow colSpan={6} message={!practitioners.length ? t.noPractitioners : hasFilters ? t.noResults : t.noTimeOff} practitioners={practitioners.length} assignmentsHref t={t} /> : null}
                      </TableBody>
                    </Table>
                  ) : null}
                </div></div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ScheduleDialog open={scheduleDialog} setOpen={setScheduleDialog} form={scheduleForm} setForm={setScheduleForm} practitioners={practitioners} assignments={assignments} loadAssignments={loadAssignments} locale={locale} t={t} saving={saving} onSave={saveSchedule} />
      <BreakDialog open={breakDialog} setOpen={setBreakDialog} form={breakForm} setForm={setBreakForm} schedules={schedules} locale={locale} t={t} saving={saving} onSave={saveBreak} />
      <TimeOffDialog open={timeOffDialog} setOpen={setTimeOffDialog} form={timeOffForm} setForm={setTimeOffForm} practitioners={practitioners} assignments={assignments} loadAssignments={loadAssignments} locale={locale} t={t} saving={saving} onSave={saveTimeOff} />

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle><AlertDialogDescription>{t.confirmDescription}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={saving}>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void applyPendingAction(); }} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t.confirm}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </main>
  );
}

function RowActions({ onEdit, onToggle, active, t }: { onEdit: () => void; onToggle: () => void; active: boolean; t: (typeof translations)[Locale] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onEdit}><Pencil className="h-4 w-4" />{t.edit}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onToggle}>{active ? <CirclePause className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{active ? t.deactivate : t.activate}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyRow({ colSpan, message, practitioners, assignmentsHref, t }: { colSpan: number; message: string; practitioners: number; assignmentsHref: boolean; t: (typeof translations)[Locale] }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-72">
        <DataRegisterEmptyState
          title={message}
          description={message}
          showReset={false}
          onReset={() => undefined}
          resetLabel={t.reset}
          action={!practitioners ? (
            <Button asChild type="button" variant="brand" className={registerBrandButtonClass}>
              <Link href="/system/practitioners"><UserRoundPlus className="h-4 w-4" />{t.addPractitioner}</Link>
            </Button>
          ) : assignmentsHref ? (
            <Button asChild type="button" variant="outline" className={registerOutlineButtonClass}>
              <Link href="/system/practitioners/assignments"><UsersRound className="h-4 w-4" />{t.openAssignments}</Link>
            </Button>
          ) : undefined}
        />
      </TableCell>
    </TableRow>
  );
}
function ScheduleDialog({ open, setOpen, form, setForm, practitioners, assignments, loadAssignments, locale, t, saving, onSave }: { open: boolean; setOpen: (open: boolean) => void; form: ScheduleForm; setForm: React.Dispatch<React.SetStateAction<ScheduleForm>>; practitioners: Practitioner[]; assignments: PractitionerAssignment[]; loadAssignments: (id: string) => Promise<PractitionerAssignment[]>; locale: Locale; t: (typeof translations)[Locale]; saving: boolean; onSave: () => Promise<void> }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{form.id ? t.editScheduleTitle : t.createScheduleTitle}</DialogTitle><DialogDescription>{t.scheduleDialogDescription}</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>{t.practitioner} *</Label><Select value={form.practitionerId} onValueChange={(value) => { setForm((current) => ({ ...current, practitionerId: value, practitionerAssignmentId: "" })); void loadAssignments(value); }} disabled={Boolean(form.id)}><SelectTrigger><SelectValue placeholder={t.choosePractitioner} /></SelectTrigger><SelectContent>{practitioners.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item, locale)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.assignment} *</Label><Select value={form.practitionerAssignmentId} onValueChange={(value) => setForm((current) => ({ ...current, practitionerAssignmentId: value }))}><SelectTrigger><SelectValue placeholder={t.chooseAssignment} /></SelectTrigger><SelectContent>{assignments.map((item) => <SelectItem key={item.id} value={item.id}>{assignmentLabel(item)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.weekday} *</Label><Select value={form.weekday} onValueChange={(value) => setForm((current) => ({ ...current, weekday: value }))}><SelectTrigger className="h-9 bg-background shadow-none"><SelectValue /></SelectTrigger><SelectContent>{WEEKDAYS.map((item) => <SelectItem key={item.value} value={item.value}>{item[locale]}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.slotInterval} *</Label><Input type="number" min="5" step="5" value={form.interval} onChange={(event) => setForm((current) => ({ ...current, interval: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.startTime} *</Label><Input type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.endTime} *</Label><Input type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.effectiveFrom}</Label><Input type="date" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.effectiveUntil}</Label><Input type="date" value={form.effectiveUntil} onChange={(event) => setForm((current) => ({ ...current, effectiveUntil: event.target.value }))} /></div>
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><Label>{t.active}</Label><Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>{t.notes}</Label><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t.cancel}</Button><Button variant="brand" onClick={() => void onSave()} disabled={saving || !form.practitionerAssignmentId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{form.id ? t.save : t.create}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BreakDialog({ open, setOpen, form, setForm, schedules, locale, t, saving, onSave }: { open: boolean; setOpen: (open: boolean) => void; form: BreakForm; setForm: React.Dispatch<React.SetStateAction<BreakForm>>; schedules: WeeklySchedule[]; locale: Locale; t: (typeof translations)[Locale]; saving: boolean; onSave: () => Promise<void> }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{form.id ? t.editBreakTitle : t.createBreakTitle}</DialogTitle><DialogDescription>{t.breakDialogDescription}</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2"><Label>{t.schedule} *</Label><Select value={form.weeklyScheduleId} onValueChange={(value) => setForm((current) => ({ ...current, weeklyScheduleId: value }))} disabled={Boolean(form.id)}><SelectTrigger><SelectValue placeholder={t.chooseSchedule} /></SelectTrigger><SelectContent className="max-h-[320px]">{schedules.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item.practitioner, locale)} — {weekdayName(item.weekday, locale, item.weekdayLabel)} — {item.startTime}-{item.endTime}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.startTime} *</Label><Input type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.endTime} *</Label><Input type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} /></div>
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><Label>{t.active}</Label><Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>{t.notes}</Label><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t.cancel}</Button><Button variant="brand" onClick={() => void onSave()} disabled={saving || !form.weeklyScheduleId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{form.id ? t.save : t.create}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeOffDialog({ open, setOpen, form, setForm, practitioners, assignments, loadAssignments, locale, t, saving, onSave }: { open: boolean; setOpen: (open: boolean) => void; form: TimeOffForm; setForm: React.Dispatch<React.SetStateAction<TimeOffForm>>; practitioners: Practitioner[]; assignments: PractitionerAssignment[]; loadAssignments: (id: string) => Promise<PractitionerAssignment[]>; locale: Locale; t: (typeof translations)[Locale]; saving: boolean; onSave: () => Promise<void> }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{form.id ? t.editTimeOffTitle : t.createTimeOffTitle}</DialogTitle><DialogDescription>{t.timeOffDialogDescription}</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>{t.practitioner} *</Label><Select value={form.practitionerId} onValueChange={(value) => { setForm((current) => ({ ...current, practitionerId: value, practitionerAssignmentId: "" })); void loadAssignments(value); }} disabled={Boolean(form.id)}><SelectTrigger><SelectValue placeholder={t.choosePractitioner} /></SelectTrigger><SelectContent>{practitioners.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item, locale)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.assignment} *</Label><Select value={form.practitionerAssignmentId} onValueChange={(value) => setForm((current) => ({ ...current, practitionerAssignmentId: value }))}><SelectTrigger><SelectValue placeholder={t.chooseAssignment} /></SelectTrigger><SelectContent>{assignments.map((item) => <SelectItem key={item.id} value={item.id}>{assignmentLabel(item)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.startsAt} *</Label><Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.endsAt} *</Label><Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} /></div>
          <div className="space-y-2"><Label>{t.status}</Label><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}><SelectTrigger className="h-9 bg-background shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="APPROVED">{t.approved}</SelectItem><SelectItem value="CANCELLED">{t.cancelled}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>{t.reason}</Label><Input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>{t.notes}</Label><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t.cancel}</Button><Button variant="brand" onClick={() => void onSave()} disabled={saving || !form.practitionerAssignmentId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{form.id ? t.save : t.create}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
