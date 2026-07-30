"use client";
/* ============================================================
   📂 company-appointment-booking-dialogs.tsx
   🩺 Marilyn Clinics — Booking and Rescheduling Forms
   ------------------------------------------------------------
   ✅ Internal @/components/ui components only
   ✅ Real patients and practitioner-service APIs
   ✅ Real practitioner availability slots
   ✅ Appointment creation
   ✅ Appointment rescheduling
   ✅ Arabic / English
   ✅ English digits
   ✅ No external UI dependency
============================================================ */
import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Clock3,
  Loader2,
  RefreshCw,
  Stethoscope,
  UserRound,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type PatientOption = {
  id: string;
  label: string;
  patientNumber: string;
  phone: string;
  status: string;
};
type ServiceAssignmentOption = {
  id: string;
  label: string;
  practitionerName: string;
  serviceName: string;
  location: string;
  durationMinutes: number;
  status: string;
  isActive: boolean;
};
type SlotOption = {
  key: string;
  start: string;
  end: string;
  totalMinutes: number;
};
type SearchOption = {
  id: string;
  label: string;
  secondary?: string;
};
export type AppointmentRescheduleTarget = {
  id: string;
  appointmentNumber: string;
  practitionerServiceAssignmentId: string;
  scheduledStart: string;
  canReschedule: boolean;
};
type BookingDialogProps = {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: (
    appointmentId?: string,
  ) => void | Promise<void>;
};
type RescheduleDialogProps = {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment:
    | AppointmentRescheduleTarget
    | null;
  onCompleted?: () => void | Promise<void>;
};
const PATIENTS_ENDPOINT =
  "/api/company/medical/patients/";
const SERVICE_ASSIGNMENTS_ENDPOINT =
  "/api/company/medical/practitioner-service-assignments/";
const AVAILABILITY_ENDPOINT =
  "/api/company/medical/availability/";
const APPOINTMENTS_ENDPOINT =
  "/api/company/medical/appointments/";
const translations = {
  ar: {
    createTitle: "إضافة موعد جديد",
    createDescription:
      "اختر المريض وخدمة الممارس والتاريخ ثم حدد أحد الأوقات المتاحة.",
    rescheduleTitle: "إعادة جدولة الموعد",
    rescheduleDescription:
      "اختر تاريخًا ووقتًا جديدين من الأوقات المتاحة للممارس.",
    patientPanel: "المريض",
    patientPanelDescription:
      "اختر المريض المسجل الذي سيُنشأ له الموعد.",
    servicePanel: "الممارس والخدمة",
    servicePanelDescription:
      "اختر تكليف الخدمة الذي يحدد الممارس والخدمة والموقع والمدة.",
    schedulePanel: "التاريخ والوقت",
    schedulePanelDescription:
      "الأوقات المعروضة مأخوذة مباشرة من جدول الممارس وفترات التوقف والحجوزات الحالية.",
    detailsPanel: "تفاصيل الزيارة",
    detailsPanelDescription:
      "أضف سبب الزيارة والملاحظات التشغيلية عند الحاجة.",
    patient: "المريض",
    choosePatient: "اختر المريض",
    searchPatient: "ابحث باسم المريض أو رقمه...",
    noPatients: "لا يوجد مرضى مطابقون.",
    serviceAssignment: "خدمة الممارس",
    chooseService: "اختر الممارس والخدمة",
    searchService:
      "ابحث باسم الممارس أو الخدمة أو الموقع...",
    noServices: "لا توجد خدمات ممارسين مطابقة.",
    date: "تاريخ الموعد",
    chooseDate: "اختر التاريخ",
    status: "حالة الإنشاء",
    draft: "مسودة",
    scheduled: "مجدول",
    availableTimes: "الأوقات المتاحة",
    selectServiceAndDate:
      "اختر خدمة الممارس وتاريخ الموعد لعرض الأوقات المتاحة.",
    loadingTimes: "جاري تحميل الأوقات المتاحة...",
    noSlots:
      "لا توجد أوقات متاحة في هذا التاريخ. اختر تاريخًا آخر.",
    reloadSlots: "إعادة تحميل الأوقات",
    visitReason: "سبب الزيارة",
    visitReasonPlaceholder:
      "اكتب سبب الزيارة أو الطلب الأساسي...",
    notes: "ملاحظات",
    notesPlaceholder:
      "أضف أي ملاحظات تشغيلية لفريق الاستقبال...",
    currentSchedule: "الموعد الحالي",
    newSchedule: "الموعد الجديد",
    duration: "المدة",
    minutes: "دقيقة",
    create: "إنشاء الموعد",
    reschedule: "حفظ إعادة الجدولة",
    cancel: "إلغاء",
    loadingReferences:
      "جاري تحميل المرضى وخدمات الممارسين...",
    referencesFailed:
      "تعذر تحميل المرضى أو خدمات الممارسين.",
    availabilityFailed:
      "تعذر تحميل الأوقات المتاحة.",
    patientRequired: "اختر المريض.",
    serviceRequired: "اختر خدمة الممارس.",
    dateRequired: "اختر تاريخ الموعد.",
    slotRequired: "اختر أحد الأوقات المتاحة.",
    invalidAssignment:
      "لا يحتوي الموعد على تكليف خدمة ممارس صالح.",
    cannotReschedule:
      "هذا الموعد غير قابل لإعادة الجدولة في حالته الحالية.",
    createSuccess: "تم إنشاء الموعد بنجاح.",
    createFailed: "تعذر إنشاء الموعد.",
    rescheduleSuccess:
      "تمت إعادة جدولة الموعد بنجاح.",
    rescheduleFailed:
      "تعذر إعادة جدولة الموعد.",
    loadError: "تعذر تحميل البيانات.",
    patientNumber: "رقم المريض",
    active: "نشط",
  },
  en: {
    createTitle: "New Appointment",
    createDescription:
      "Select a patient, practitioner service, date, and one of the available time slots.",
    rescheduleTitle: "Reschedule Appointment",
    rescheduleDescription:
      "Select a new date and an available practitioner time slot.",
    patientPanel: "Patient",
    patientPanelDescription:
      "Select the registered patient for this appointment.",
    servicePanel: "Practitioner & Service",
    servicePanelDescription:
      "Select the service assignment that determines the practitioner, service, location, and duration.",
    schedulePanel: "Date & Time",
    schedulePanelDescription:
      "Available times come directly from the practitioner schedule, breaks, time off, and existing bookings.",
    detailsPanel: "Visit Details",
    detailsPanelDescription:
      "Add the visit reason and operational notes when needed.",
    patient: "Patient",
    choosePatient: "Select patient",
    searchPatient: "Search by patient name or number...",
    noPatients: "No matching patients.",
    serviceAssignment: "Practitioner service",
    chooseService: "Select practitioner and service",
    searchService:
      "Search by practitioner, service, or location...",
    noServices: "No matching practitioner services.",
    date: "Appointment date",
    chooseDate: "Select date",
    status: "Creation status",
    draft: "Draft",
    scheduled: "Scheduled",
    availableTimes: "Available times",
    selectServiceAndDate:
      "Select a practitioner service and date to load available times.",
    loadingTimes: "Loading available times...",
    noSlots:
      "No times are available on this date. Select another date.",
    reloadSlots: "Reload times",
    visitReason: "Visit reason",
    visitReasonPlaceholder:
      "Enter the main visit reason or request...",
    notes: "Notes",
    notesPlaceholder:
      "Add operational notes for the reception team...",
    currentSchedule: "Current appointment",
    newSchedule: "New appointment",
    duration: "Duration",
    minutes: "minutes",
    create: "Create appointment",
    reschedule: "Save reschedule",
    cancel: "Cancel",
    loadingReferences:
      "Loading patients and practitioner services...",
    referencesFailed:
      "Patients or practitioner services could not be loaded.",
    availabilityFailed:
      "Available times could not be loaded.",
    patientRequired: "Select a patient.",
    serviceRequired:
      "Select a practitioner service.",
    dateRequired:
      "Select the appointment date.",
    slotRequired:
      "Select an available time.",
    invalidAssignment:
      "The appointment does not contain a valid practitioner service assignment.",
    cannotReschedule:
      "This appointment cannot be rescheduled in its current status.",
    createSuccess:
      "Appointment created successfully.",
    createFailed:
      "Appointment could not be created.",
    rescheduleSuccess:
      "Appointment rescheduled successfully.",
    rescheduleFailed:
      "Appointment could not be rescheduled.",
    loadError: "Data could not be loaded.",
    patientNumber: "Patient number",
    active: "Active",
  },
} as const;
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
function text(value: unknown) {
  return String(value ?? "").trim();
}
function numberValue(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);
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
    ["true", "1", "yes", "active"].includes(
      normalized,
    )
  ) {
    return true;
  }
  if (
    ["false", "0", "no", "inactive"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return fallback;
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
    const candidate = text(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return "";
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
    const candidate = text(value);
    if (candidate) {
      return candidate;
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
  headers.set("Accept", "application/json");
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
  const rawText =
    await response.text();
  let payload: unknown = {};
  if (rawText) {
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
  const record = asRecord(payload);
  for (const key of [
    "items",
    "results",
    "records",
    "rows",
    "appointments",
  ]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }
  for (const key of [
    "data",
    "result",
    "item",
  ]) {
    const candidate = record[key];
    if (
      candidate === undefined ||
      candidate === null ||
      candidate === payload
    ) {
      continue;
    }
    const nested = extractArray(
      candidate,
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
function tomorrowDate() {
  const value = new Date();
  value.setDate(
    value.getDate() + 1,
  );
  return isoDate(value);
}
function dateFromDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return tomorrowDate();
  }
  return isoDate(parsed);
}
function normalizeDateTime(
  value: unknown,
  date: string,
) {
  const raw = text(value);
  if (!raw) {
    return "";
  }
  if (
    raw.includes("T") ||
    /^\d{4}-\d{2}-\d{2}/.test(raw)
  ) {
    return raw;
  }
  if (/^\d{1,2}:\d{2}/.test(raw)) {
    const parsed = new Date(
      `${date}T${raw}`,
    );
    return Number.isNaN(
      parsed.getTime(),
    )
      ? ""
      : parsed.toISOString();
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString();
}
function formatDateTime(value: string) {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(parsed);
}
function formatTime(value: string) {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(parsed);
}
function normalizePatient(
  value: unknown,
): PatientOption | null {
  const record = asRecord(value);
  const id = text(record.id);
  if (!id) {
    return null;
  }
  const label =
    text(record.full_name) ||
    text(record.display_name) ||
    text(record.name);
  if (!label) {
    return null;
  }
  return {
    id,
    label,
    patientNumber:
      text(record.patient_number) ||
      text(record.number) ||
      text(record.code),
    phone:
      text(record.mobile_number) ||
      text(record.phone_number) ||
      text(record.mobile) ||
      text(record.phone),
    status:
      text(record.status).toUpperCase(),
  };
}
function normalizeServiceAssignment(
  value: unknown,
): ServiceAssignmentOption | null {
  const record = asRecord(value);
  const id = text(record.id);
  if (!id) {
    return null;
  }
  const practitionerAssignment =
    asRecord(
      record.practitioner_assignment,
    );
  const practitioner =
    asRecord(
      practitionerAssignment.practitioner,
    );
  const serviceOffering =
    asRecord(record.service_offering);
  const practitionerName =
    relatedLabel(practitioner) ||
    text(record.practitioner_name) ||
    relatedLabel(
      record.practitioner,
    );
  const serviceName =
    relatedLabel(serviceOffering) ||
    text(record.service_name);
  if (
    !practitionerName &&
    !serviceName
  ) {
    return null;
  }
  const branchName =
    relatedLabel(record.branch) ||
    relatedLabel(
      practitionerAssignment.branch,
    );
  const departmentName =
    relatedLabel(record.department) ||
    relatedLabel(
      practitionerAssignment.department,
    );
  const clinicName =
    relatedLabel(record.clinic) ||
    relatedLabel(
      practitionerAssignment.clinic,
    );
  const location = [
    branchName,
    departmentName,
    clinicName,
  ]
    .filter(Boolean)
    .join(" / ");
  const status =
    text(record.status).toUpperCase();
  const isEffective =
    boolValue(
      record.is_effective,
      true,
    );
  const isActive =
    boolValue(
      record.is_active,
      status
        ? status === "ACTIVE"
        : true,
    ) &&
    isEffective &&
    !["INACTIVE", "SUSPENDED"].includes(
      status,
    );
  return {
    id,
    practitionerName:
      practitionerName || "—",
    serviceName:
      serviceName || "—",
    label:
      `${practitionerName || "—"} — ${
        serviceName || "—"
      }`,
    location,
    durationMinutes:
      numberValue(
        record.effective_duration_minutes ??
          record.duration_minutes ??
          serviceOffering.duration_minutes ??
          serviceOffering.default_duration_minutes,
      ),
    status,
    isActive,
  };
}
function extractSlotArray(
  payload: unknown,
): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  const record = asRecord(payload);
  if (
    Array.isArray(
      record.available_slots,
    )
  ) {
    return record.available_slots as unknown[];
  }
  if (Array.isArray(record.slots)) {
    return record.slots as unknown[];
  }
  for (const key of [
    "item",
    "data",
    "result",
  ]) {
    const candidate = record[key];
    if (
      candidate === undefined ||
      candidate === null ||
      candidate === payload
    ) {
      continue;
    }
    const nested =
      extractSlotArray(candidate);
    if (nested.length) {
      return nested;
    }
  }
  return [];
}
function normalizeSlot(
  value: unknown,
  date: string,
  index: number,
): SlotOption | null {
  const record = asRecord(value);
  if (
    "is_available" in record &&
    !boolValue(
      record.is_available,
      true,
    )
  ) {
    return null;
  }
  const start = normalizeDateTime(
    record.scheduled_start ??
      record.start ??
      record.starts_at ??
      record.start_at ??
      record.start_time,
    date,
  );
  const end = normalizeDateTime(
    record.scheduled_end ??
      record.end ??
      record.ends_at ??
      record.end_at ??
      record.end_time,
    date,
  );
  if (!start) {
    return null;
  }
  return {
    key:
      text(record.id) ||
      `${start}-${index}`,
    start,
    end,
    totalMinutes:
      numberValue(
        record.total_slot_minutes ??
          record.duration_minutes ??
          record.duration,
      ),
  };
}
function SearchCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
}) {
  const [open, setOpen] =
    React.useState(false);
  const selected = options.find(
    (option) =>
      option.id === value,
  );
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-auto min-h-10 w-full justify-between bg-background px-3 py-2 text-start font-normal shadow-none"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              {selected?.label ||
                placeholder}
            </span>
            {selected?.secondary ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {selected.secondary}
              </span>
            ) : null}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
          />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>
              {emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.label} ${option.secondary || ""} ${option.id}`}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      value === option.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {option.label}
                    </span>
                    {option.secondary ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {option.secondary}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
function DateField({
  value,
  onChange,
  label,
  locale,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  locale: Locale;
  disabled?: boolean;
}) {
  const [open, setOpen] =
    React.useState(false);
  const selected = value
    ? new Date(`${value}T12:00:00`)
    : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-10 w-full justify-start bg-background px-3 text-start font-normal shadow-none"
        >
          <CalendarDays className="me-2 h-4 w-4 text-muted-foreground" />
          <span
            dir="ltr"
            lang="en"
            className="tabular-nums"
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
          disabled={{
            before: today,
          }}
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
function FormPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg border bg-background shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border bg-muted/30 p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">
              {title}
            </CardTitle>
            <CardDescription className="mt-1 leading-6">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
function SlotsField({
  slots,
  value,
  onChange,
  loading,
  error,
  ready,
  locale,
  onReload,
}: {
  slots: SlotOption[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error: string;
  ready: boolean;
  locale: Locale;
  onReload: () => void;
}) {
  const t = translations[locale];
  if (!ready) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t.selectServiceAndDate}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-28 items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.loadingTimes}
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReload}
        >
          <RefreshCw className="h-4 w-4" />
          {t.reloadSlots}
        </Button>
      </div>
    );
  }
  if (!slots.length) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t.noSlots}
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => {
        const selected =
          value === slot.start;
        return (
          <Button
            key={slot.key}
            type="button"
            variant={
              selected
                ? "default"
                : "outline"
            }
            className="h-auto min-h-[68px] justify-start px-3 py-2 text-start"
            onClick={() =>
              onChange(slot.start)
            }
          >
            <Clock3 className="me-2 h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span
                dir="ltr"
                lang="en"
                className="block font-semibold tabular-nums"
              >
                {formatTime(slot.start)}
                {slot.end
                  ? ` – ${formatTime(
                      slot.end,
                    )}`
                  : ""}
              </span>
              {slot.totalMinutes ? (
                <span
                  dir="ltr"
                  lang="en"
                  className={cn(
                    "mt-1 block text-xs tabular-nums",
                    selected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {slot.totalMinutes}
                  {" "}
                  {t.minutes}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
function useAvailability({
  open,
  assignmentId,
  date,
}: {
  open: boolean;
  assignmentId: string;
  date: string;
}) {
  const [slots, setSlots] =
    React.useState<SlotOption[]>([]);
  const [loading, setLoading] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const requestId =
    React.useRef(0);
  const load = React.useCallback(
    async () => {
      if (
        !open ||
        !assignmentId ||
        !date
      ) {
        requestId.current += 1;
        setSlots([]);
        setError("");
        setLoading(false);
        return;
      }
      const currentRequest =
        requestId.current + 1;
      requestId.current =
        currentRequest;
      setLoading(true);
      setError("");
      try {
        const params =
          new URLSearchParams({
            practitioner_service_assignment_id:
              assignmentId,
            date,
          });
        const payload =
          await requestJson<unknown>(
            AVAILABILITY_ENDPOINT,
            {
              method: "GET",
            },
            params,
          );
        if (
          requestId.current !==
          currentRequest
        ) {
          return;
        }
        const normalized =
          extractSlotArray(payload)
            .map((item, index) =>
              normalizeSlot(
                item,
                date,
                index,
              ),
            )
            .filter(
              (
                item,
              ): item is SlotOption =>
                item !== null,
            )
            .sort((left, right) =>
              left.start.localeCompare(
                right.start,
              ),
            );
        setSlots(normalized);
      } catch (caughtError) {
        if (
          requestId.current !==
          currentRequest
        ) {
          return;
        }
        setSlots([]);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "",
        );
      } finally {
        if (
          requestId.current ===
          currentRequest
        ) {
          setLoading(false);
        }
      }
    },
    [
      assignmentId,
      date,
      open,
    ],
  );
  React.useEffect(() => {
    void load();
  }, [load]);
  return {
    slots,
    loading,
    error,
    reload: load,
  };
}
export function AppointmentBookingDialog({
  locale,
  open,
  onOpenChange,
  onCompleted,
}: BookingDialogProps) {
  const t = translations[locale];
  const [patients, setPatients] =
    React.useState<PatientOption[]>([]);
  const [assignments, setAssignments] =
    React.useState<
      ServiceAssignmentOption[]
    >([]);
  const [
    referencesLoading,
    setReferencesLoading,
  ] = React.useState(false);
  const [
    referencesError,
    setReferencesError,
  ] = React.useState("");
  const [patientId, setPatientId] =
    React.useState("");
  const [
    assignmentId,
    setAssignmentId,
  ] = React.useState("");
  const [date, setDate] =
    React.useState(
      tomorrowDate(),
    );
  const [slotStart, setSlotStart] =
    React.useState("");
  const [status, setStatus] =
    React.useState("SCHEDULED");
  const [reason, setReason] =
    React.useState("");
  const [notes, setNotes] =
    React.useState("");
  const [saving, setSaving] =
    React.useState(false);
  const referencesRequestId =
    React.useRef(0);
  const availability =
    useAvailability({
      open,
      assignmentId,
      date,
    });
  const reset = React.useCallback(() => {
    setPatientId("");
    setAssignmentId("");
    setDate(tomorrowDate());
    setSlotStart("");
    setStatus("SCHEDULED");
    setReason("");
    setNotes("");
    setReferencesError("");
  }, []);
  const loadReferences =
    React.useCallback(async () => {
      const currentRequest =
        referencesRequestId.current + 1;
      referencesRequestId.current =
        currentRequest;
      setReferencesLoading(true);
      setReferencesError("");
      try {
        const commonParams =
          new URLSearchParams({
            page: "1",
            page_size: "200",
          });
        const [
          patientsPayload,
          assignmentsPayload,
        ] = await Promise.all([
          requestJson<unknown>(
            PATIENTS_ENDPOINT,
            {
              method: "GET",
            },
            commonParams,
          ),
          requestJson<unknown>(
            SERVICE_ASSIGNMENTS_ENDPOINT,
            {
              method: "GET",
            },
            commonParams,
          ),
        ]);
        if (
          referencesRequestId.current !==
          currentRequest
        ) {
          return;
        }
        const normalizedPatients =
          extractArray(patientsPayload)
            .map(normalizePatient)
            .filter(
              (
                item,
              ): item is PatientOption =>
                item !== null &&
                ![
                  "INACTIVE",
                  "ARCHIVED",
                ].includes(
                  item.status,
                ),
            );
        const normalizedAssignments =
          extractArray(
            assignmentsPayload,
          )
            .map(
              normalizeServiceAssignment,
            )
            .filter(
              (
                item,
              ): item is ServiceAssignmentOption =>
                item !== null &&
                item.isActive,
            );
        setPatients(
          normalizedPatients,
        );
        setAssignments(
          normalizedAssignments,
        );
      } catch (caughtError) {
        if (
          referencesRequestId.current !==
          currentRequest
        ) {
          return;
        }
        setPatients([]);
        setAssignments([]);
        setReferencesError(
          caughtError instanceof Error
            ? caughtError.message
            : t.referencesFailed,
        );
      } finally {
        if (
          referencesRequestId.current ===
          currentRequest
        ) {
          setReferencesLoading(false);
        }
      }
    }, [t.referencesFailed]);
  React.useEffect(() => {
    if (!open) {
      referencesRequestId.current += 1;
      setReferencesLoading(false);
      return;
    }
    reset();
    void loadReferences();
  }, [
    loadReferences,
    open,
    reset,
  ]);
  React.useEffect(() => {
    setSlotStart("");
  }, [
    assignmentId,
    date,
  ]);
  const patientOptions =
    React.useMemo<SearchOption[]>(
      () =>
        patients.map((patient) => ({
          id: patient.id,
          label: patient.label,
          secondary: [
            patient.patientNumber
              ? `${t.patientNumber}: ${patient.patientNumber}`
              : "",
            patient.phone,
          ]
            .filter(Boolean)
            .join(" • "),
        })),
      [
        patients,
        t.patientNumber,
      ],
    );
  const assignmentOptions =
    React.useMemo<SearchOption[]>(
      () =>
        assignments.map(
          (assignment) => ({
            id: assignment.id,
            label: assignment.label,
            secondary: [
              assignment.location,
              assignment.durationMinutes
                ? `${assignment.durationMinutes} ${t.minutes}`
                : "",
            ]
              .filter(Boolean)
              .join(" • "),
          }),
        ),
      [
        assignments,
        t.minutes,
      ],
    );
  const selectedSlotIsAvailable =
    React.useMemo(
      () =>
        Boolean(
          slotStart &&
            availability.slots.some(
              (slot) =>
                slot.start === slotStart,
            ),
        ),
      [
        availability.slots,
        slotStart,
      ],
    );
  async function submit() {
    if (!patientId) {
      toast.warning(
        t.patientRequired,
      );
      return;
    }
    if (!assignmentId) {
      toast.warning(
        t.serviceRequired,
      );
      return;
    }
    if (!date) {
      toast.warning(
        t.dateRequired,
      );
      return;
    }
    if (!selectedSlotIsAvailable) {
      toast.warning(
        t.slotRequired,
      );
      return;
    }
    setSaving(true);
    try {
      const body: ApiRecord = {
        patient_id:
          Number(patientId),
        practitioner_service_assignment_id:
          Number(assignmentId),
        scheduled_start:
          slotStart,
        status,
      };
      if (reason.trim()) {
        body.reason =
          reason.trim();
      }
      if (notes.trim()) {
        body.notes =
          notes.trim();
      }
      const payload =
        await requestJson<unknown>(
          APPOINTMENTS_ENDPOINT,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        );
      const created =
        asRecord(
          extractItem(payload),
        );
      const appointmentId =
        text(created.id);
      toast.success(
        t.createSuccess,
      );
      onOpenChange(false);
      await onCompleted?.(
        appointmentId || undefined,
      );
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : t.createFailed,
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        dir={
          locale === "ar"
            ? "rtl"
            : "ltr"
        }
        className="max-h-[92vh] max-w-4xl overflow-y-auto"
      >
        <DialogHeader className="text-start">
          <DialogTitle>
            {t.createTitle}
          </DialogTitle>
          <DialogDescription>
            {t.createDescription}
          </DialogDescription>
        </DialogHeader>
        {referencesLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.loadingReferences}
          </div>
        ) : referencesError ? (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {referencesError}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void loadReferences()
              }
            >
              <RefreshCw className="h-4 w-4" />
              {t.reloadSlots}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <FormPanel
              icon={UserRound}
              title={t.patientPanel}
              description={
                t.patientPanelDescription
              }
            >
              <div className="space-y-2">
                <Label>
                  {t.patient}
                </Label>
                <SearchCombobox
                  value={patientId}
                  onChange={setPatientId}
                  options={patientOptions}
                  placeholder={
                    t.choosePatient
                  }
                  searchPlaceholder={
                    t.searchPatient
                  }
                  emptyLabel={
                    t.noPatients
                  }
                  disabled={saving}
                />
              </div>
            </FormPanel>
            <FormPanel
              icon={Stethoscope}
              title={t.servicePanel}
              description={
                t.servicePanelDescription
              }
            >
              <div className="space-y-2">
                <Label>
                  {t.serviceAssignment}
                </Label>
                <SearchCombobox
                  value={assignmentId}
                  onChange={
                    setAssignmentId
                  }
                  options={
                    assignmentOptions
                  }
                  placeholder={
                    t.chooseService
                  }
                  searchPlaceholder={
                    t.searchService
                  }
                  emptyLabel={
                    t.noServices
                  }
                  disabled={saving}
                />
              </div>
            </FormPanel>
            <FormPanel
              icon={CalendarDays}
              title={t.schedulePanel}
              description={
                t.schedulePanelDescription
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {t.date}
                  </Label>
                  <DateField
                    value={date}
                    onChange={setDate}
                    label={t.chooseDate}
                    locale={locale}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.status}
                  </Label>
                  <Select
                    value={status}
                    onValueChange={
                      setStatus
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-10 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">
                        {t.scheduled}
                      </SelectItem>
                      <SelectItem value="DRAFT">
                        {t.draft}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>
                    {t.availableTimes}
                  </Label>
                  {assignmentId &&
                  date ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        availability.loading
                      }
                      onClick={() =>
                        void availability.reload()
                      }
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          availability.loading &&
                            "animate-spin",
                        )}
                      />
                      {t.reloadSlots}
                    </Button>
                  ) : null}
                </div>
                <SlotsField
                  slots={
                    availability.slots
                  }
                  value={slotStart}
                  onChange={
                    setSlotStart
                  }
                  loading={
                    availability.loading
                  }
                  error={
                    availability.error
                  }
                  ready={Boolean(
                    assignmentId &&
                      date,
                  )}
                  locale={locale}
                  onReload={() =>
                    void availability.reload()
                  }
                />
              </div>
            </FormPanel>
            <FormPanel
              icon={Clock3}
              title={t.detailsPanel}
              description={
                t.detailsPanelDescription
              }
            >
              <div className="space-y-2">
                <Label htmlFor="appointment-visit-reason">
                  {t.visitReason}
                </Label>
                <Input
                  id="appointment-visit-reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value,
                    )
                  }
                  placeholder={
                    t.visitReasonPlaceholder
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-booking-notes">
                  {t.notes}
                </Label>
                <Textarea
                  id="appointment-booking-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  placeholder={
                    t.notesPlaceholder
                  }
                  rows={4}
                  disabled={saving}
                />
              </div>
            </FormPanel>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() =>
              onOpenChange(false)
            }
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            disabled={
              saving ||
              referencesLoading ||
              Boolean(referencesError) ||
              availability.loading ||
              Boolean(availability.error) ||
              !selectedSlotIsAvailable
            }
            onClick={() =>
              void submit()
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
            {t.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function AppointmentRescheduleDialog({
  locale,
  open,
  onOpenChange,
  appointment,
  onCompleted,
}: RescheduleDialogProps) {
  const t = translations[locale];
  const [date, setDate] =
    React.useState(
      tomorrowDate(),
    );
  const [slotStart, setSlotStart] =
    React.useState("");
  const [saving, setSaving] =
    React.useState(false);
  React.useEffect(() => {
    if (!open) {
      return;
    }
    setDate(
      appointment?.scheduledStart
        ? dateFromDateTime(
            appointment.scheduledStart,
          )
        : tomorrowDate(),
    );
    setSlotStart("");
  }, [
    appointment?.scheduledStart,
    open,
  ]);
  React.useEffect(() => {
    setSlotStart("");
  }, [date]);
  const availability =
    useAvailability({
      open,
      assignmentId:
        appointment
          ?.practitionerServiceAssignmentId ||
        "",
      date,
    });
  const selectedSlotIsAvailable =
    React.useMemo(
      () =>
        Boolean(
          slotStart &&
            availability.slots.some(
              (slot) =>
                slot.start === slotStart,
            ),
        ),
      [
        availability.slots,
        slotStart,
      ],
    );
  async function submit() {
    if (!appointment) {
      return;
    }
    if (!appointment.canReschedule) {
      toast.warning(
        t.cannotReschedule,
      );
      return;
    }
    if (
      !appointment
        .practitionerServiceAssignmentId
    ) {
      toast.warning(
        t.invalidAssignment,
      );
      return;
    }
    if (!date) {
      toast.warning(
        t.dateRequired,
      );
      return;
    }
    if (!selectedSlotIsAvailable) {
      toast.warning(
        t.slotRequired,
      );
      return;
    }
    setSaving(true);
    try {
      await requestJson<unknown>(
        `${APPOINTMENTS_ENDPOINT}${encodeURIComponent(
          appointment.id,
        )}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            scheduled_start:
              slotStart,
          }),
        },
      );
      toast.success(
        t.rescheduleSuccess,
      );
      onOpenChange(false);
      await onCompleted?.();
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : t.rescheduleFailed,
      );
    } finally {
      setSaving(false);
    }
  }
  const ready = Boolean(
    appointment
      ?.practitionerServiceAssignmentId &&
      date,
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        dir={
          locale === "ar"
            ? "rtl"
            : "ltr"
        }
        className="max-h-[92vh] max-w-3xl overflow-y-auto"
      >
        <DialogHeader className="text-start">
          <DialogTitle>
            {t.rescheduleTitle}
          </DialogTitle>
          <DialogDescription>
            {t.rescheduleDescription}
          </DialogDescription>
        </DialogHeader>
        {appointment ? (
          <div className="space-y-4">
            <Card className="rounded-lg border bg-muted/20 shadow-none">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.currentSchedule}
                  </p>
                  <p
                    dir="ltr"
                    lang="en"
                    className="mt-1 font-mono text-sm font-semibold tabular-nums"
                  >
                    {
                      appointment.appointmentNumber
                    }
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit bg-background"
                >
                  <Clock3 className="me-1.5 h-3.5 w-3.5" />
                  <span
                    dir="ltr"
                    lang="en"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      appointment.scheduledStart,
                    )}
                  </span>
                </Badge>
              </CardContent>
            </Card>
            {!appointment.canReschedule ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">
                  {t.cannotReschedule}
                </p>
              </div>
            ) : !appointment
                .practitionerServiceAssignmentId ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">
                  {t.invalidAssignment}
                </p>
              </div>
            ) : (
              <FormPanel
                icon={CalendarDays}
                title={t.newSchedule}
                description={
                  t.schedulePanelDescription
                }
              >
                <div className="space-y-2">
                  <Label>
                    {t.date}
                  </Label>
                  <DateField
                    value={date}
                    onChange={setDate}
                    label={t.chooseDate}
                    locale={locale}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>
                      {t.availableTimes}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        availability.loading
                      }
                      onClick={() =>
                        void availability.reload()
                      }
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          availability.loading &&
                            "animate-spin",
                        )}
                      />
                      {t.reloadSlots}
                    </Button>
                  </div>
                  <SlotsField
                    slots={
                      availability.slots
                    }
                    value={slotStart}
                    onChange={
                      setSlotStart
                    }
                    loading={
                      availability.loading
                    }
                    error={
                      availability.error
                    }
                    ready={ready}
                    locale={locale}
                    onReload={() =>
                      void availability.reload()
                    }
                  />
                </div>
              </FormPanel>
            )}
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() =>
              onOpenChange(false)
            }
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            disabled={
              saving ||
              !appointment ||
              !appointment.canReschedule ||
              !appointment
                .practitionerServiceAssignmentId ||
              availability.loading ||
              Boolean(availability.error) ||
              !selectedSlotIsAvailable
            }
            onClick={() =>
              void submit()
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
            {t.reschedule}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
