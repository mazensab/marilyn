"use client";
/*
 * MARILYN CLINICAL OPERATIONS CENTER
 * Unified operational view for encounters, diagnoses, procedures, and referrals.
 */
// clinical_operations_shared_tabs_hr_spirit=true
// clinical_operations_matches_medical_services=true
// clinical_operations_query_navigation=true
import * as React from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Activity,
  ArrowUpDown,
  CalendarIcon,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  HeartPulse,
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  TriangleAlert,
  Waypoints,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { MedicalOperationsTabs } from "@/components/system/medical-operations-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openPrintReport } from "@/lib/print-report";
type Locale = "ar" | "en";
type Resource =
  | "encounters"
  | "diagnoses"
  | "procedures"
  | "referrals";
function resourceFromQuery(
  value: string | null,
): Resource {
  if (
    value === "diagnoses" ||
    value === "procedures" ||
    value === "referrals"
  ) {
    return value;
  }
  return "encounters";
}
type SortKey = "date" | "name" | "status";
type ApiRecord = Record<string, unknown>;
type OperationRow = {
  id: string;
  resource: Resource;
  number: string;
  title: string;
  patientName: string;
  practitionerName: string;
  encounterId: string;
  encounterNumber: string;
  branchName: string;
  departmentName: string;
  clinicName: string;
  sourceName: string;
  destinationName: string;
  status: string;
  priority: string;
  date: string;
  notes: string;
};
type DataState = Record<Resource, OperationRow[]>;
const ENDPOINTS = {
  encounters:
    "/api/company/medical/encounters/?page_size=500",
  referrals:
    "/api/company/medical/referrals/?page_size=500",
} as const;
const NESTED_CONCURRENCY = 6;
const EMPTY_DATA: DataState = {
  encounters: [],
  diagnoses: [],
  procedures: [],
  referrals: [],
};
const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
  "CANCELED",
  "CLOSED",
  "RESOLVED",
  "REJECTED",
  "EXPIRED",
]);
const copy = {
  ar: {
    badge: "الإدارة المركزية",
    title: "التشغيل الطبي",
    description:
      "متابعة الزيارات والتشخيصات والإجراءات والإحالات الطبية من السجلات التشغيلية الحقيقية.",
    servicesTab: "الخدمات الطبية",
    encountersTab: "الزيارات الطبية",
    diagnosesTab: "التشخيصات",
    proceduresTab: "الإجراءات",
    referralsTab: "الإحالات",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    encountersKpi: "الزيارات الطبية",
    diagnosesKpi: "التشخيصات",
    proceduresKpi: "الإجراءات المعلقة",
    referralsKpi: "الإحالات المفتوحة",
    encountersDesc: "إجمالي الزيارات الطبية المسجلة",
    diagnosesDesc: "إجمالي التشخيصات المرتبطة بالزيارات",
    proceduresDesc: "الإجراءات التي لم تصل إلى حالة نهائية",
    referralsDesc: "الإحالات التي ما زالت قيد المتابعة",
    registerTitle: "سجل التشغيل الطبي",
    registerDescriptions: {
      encounters:
        "قائمة موحدة للزيارات الطبية والمرضى والممارسين ومواقع تقديم الرعاية.",
      diagnoses:
        "التشخيصات المسجلة وربطها بالزيارة والمريض والممارس.",
      procedures:
        "الإجراءات الطبية وحالتها التنفيذية وارتباطها بالزيارة.",
      referrals:
        "الإحالات الطبية ومصدرها ووجهتها وأولويتها وحالتها.",
    },
    search:
      "ابحث بالرقم أو المريض أو الممارس أو الوصف أو الموقع...",
    allStatuses: "كل الحالات",
    allBranches: "كل الفروع",
    sortDate: "الأحدث",
    sortName: "الاسم",
    sortStatus: "الحالة",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    reset: "إعادة ضبط",
    record: "السجل",
    patient: "المريض",
    practitioner: "الممارس",
    encounter: "الزيارة",
    location: "الموقع",
    sourceDestination: "المصدر والوجهة",
    priority: "الأولوية",
    date: "التاريخ",
    status: "الحالة",
    actions: "الإجراءات",
    details: "عرض التفاصيل",
    detailsTitle: "تفاصيل السجل الطبي",
    detailsDescription:
      "البيانات المتاحة من السجل التشغيلي دون إضافة بيانات تجريبية.",
    number: "الرقم",
    titleField: "الوصف",
    branch: "الفرع",
    department: "القسم",
    clinic: "العيادة",
    source: "المصدر",
    destination: "الوجهة",
    notes: "الملاحظات",
    noData: "لا توجد سجلات تشغيل طبي متاحة حاليًا.",
    noResults: "لا توجد سجلات مطابقة للبحث أو الفلاتر.",
    loadingError: "تعذر تحميل التشغيل الطبي",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل الصفحة جزئيًا",
    partialDescription:
      "تعذر تحميل بعض مصادر التشغيل، لذلك تظهر السجلات المتاحة فقط.",
    refreshed: "تم تحديث التشغيل الطبي.",
    excelEmpty: "لا توجد سجلات للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد سجلات للطباعة.",
    printReady: "تم تجهيز تقرير التشغيل الطبي.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    resultCount: "عدد النتائج",
    totalCount: "الإجمالي",
    unknown: "غير محدد",
    allBranchesPrint: "جميع الفروع",
    reportTitle: "تقرير التشغيل الطبي — Marilyn Clinics",
  },
  en: {
    badge: "Central administration",
    title: "Clinical Operations",
    description:
      "Monitor encounters, diagnoses, procedures, and referrals from live operational medical records.",
    servicesTab: "Medical services",
    encountersTab: "Medical encounters",
    diagnosesTab: "Diagnoses",
    proceduresTab: "Procedures",
    referralsTab: "Referrals",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    encountersKpi: "Medical encounters",
    diagnosesKpi: "Diagnoses",
    proceduresKpi: "Pending procedures",
    referralsKpi: "Open referrals",
    encountersDesc: "All registered medical encounters",
    diagnosesDesc: "Diagnoses linked to medical encounters",
    proceduresDesc: "Procedures that are not in a terminal state",
    referralsDesc: "Referrals that are still under follow-up",
    registerTitle: "Clinical operations register",
    registerDescriptions: {
      encounters:
        "A unified list of encounters, patients, practitioners, and care locations.",
      diagnoses:
        "Registered diagnoses linked to encounters, patients, and practitioners.",
      procedures:
        "Medical procedures, execution statuses, and encounter relationships.",
      referrals:
        "Medical referrals, sources, destinations, priorities, and statuses.",
    },
    search:
      "Search by number, patient, practitioner, description, or location...",
    allStatuses: "All statuses",
    allBranches: "All branches",
    sortDate: "Newest",
    sortName: "Name",
    sortStatus: "Status",
    fromDate: "From date",
    toDate: "To date",
    reset: "Reset",
    record: "Record",
    patient: "Patient",
    practitioner: "Practitioner",
    encounter: "Encounter",
    location: "Location",
    sourceDestination: "Source and destination",
    priority: "Priority",
    date: "Date",
    status: "Status",
    actions: "Actions",
    details: "View details",
    detailsTitle: "Medical record details",
    detailsDescription:
      "Available operational record data without fabricated information.",
    number: "Number",
    titleField: "Description",
    branch: "Branch",
    department: "Department",
    clinic: "Clinic",
    source: "Source",
    destination: "Destination",
    notes: "Notes",
    noData: "No clinical operation records are currently available.",
    noResults: "No records match the current search or filters.",
    loadingError: "Could not load clinical operations",
    retry: "Try again",
    partialTitle: "Partially loaded",
    partialDescription:
      "Some operational sources could not be loaded, so available records are shown.",
    refreshed: "Clinical operations refreshed.",
    excelEmpty: "There are no records to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There are no records to print.",
    printReady: "Clinical operations report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    resultCount: "Results",
    totalCount: "Total",
    unknown: "Unknown",
    allBranchesPrint: "All branches",
    reportTitle: "Clinical Operations Report — Marilyn Clinics",
  },
} as const;
const STATUS_LABELS: Record<
  Locale,
  Record<string, string>
> = {
  ar: {
    ACTIVE: "نشط",
    INACTIVE: "غير نشط",
    OPEN: "مفتوح",
    DRAFT: "مسودة",
    NEW: "جديد",
    PENDING: "معلق",
    REQUESTED: "مطلوب",
    SCHEDULED: "مجدول",
    CONFIRMED: "مؤكد",
    CHECKED_IN: "تم الحضور",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    CANCELED: "ملغي",
    CLOSED: "مغلق",
    RESOLVED: "تم الحل",
    APPROVED: "معتمد",
    ACCEPTED: "مقبول",
    REJECTED: "مرفوض",
    EXPIRED: "منتهي",
  },
  en: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    OPEN: "Open",
    DRAFT: "Draft",
    NEW: "New",
    PENDING: "Pending",
    REQUESTED: "Requested",
    SCHEDULED: "Scheduled",
    CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked in",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    CLOSED: "Closed",
    RESOLVED: "Resolved",
    APPROVED: "Approved",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
  },
};
const PRIORITY_LABELS: Record<
  Locale,
  Record<string, string>
> = {
  ar: {
    LOW: "منخفضة",
    ROUTINE: "اعتيادية",
    NORMAL: "عادية",
    MEDIUM: "متوسطة",
    HIGH: "عالية",
    URGENT: "عاجلة",
    EMERGENCY: "طارئة",
  },
  en: {
    LOW: "Low",
    ROUTINE: "Routine",
    NORMAL: "Normal",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
    EMERGENCY: "Emergency",
  },
};
function isRecord(
  value: unknown,
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function text(
  value: unknown,
  fallback = "",
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim() || fallback;
  }
  return fallback;
}
function extractArray(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (
    !isRecord(payload) ||
    depth > 3
  ) {
    return [];
  }
  const candidates = [
    payload.items,
    payload.results,
    payload.records,
    payload.rows,
    payload.encounters,
    payload.diagnoses,
    payload.procedures,
    payload.referrals,
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
function nestedName(value: unknown): string {
  if (typeof value === "string") {
    return text(value);
  }
  const source = record(value);
  return text(
    source.full_name_ar ||
      source.full_name_en ||
      source.full_name ||
      source.name_ar ||
      source.name_en ||
      source.name ||
      source.title ||
      source.display_name ||
      source.code ||
      source.number,
  );
}
function relationName(
  source: ApiRecord,
  directFields: unknown[],
  nestedValue: unknown,
) {
  for (const value of directFields) {
    const candidate = text(value);
    if (candidate) {
      return candidate;
    }
  }
  return nestedName(nestedValue);
}
function defaultStatus(
  resource: Resource,
) {
  if (resource === "encounters") {
    return "OPEN";
  }
  if (resource === "diagnoses") {
    return "ACTIVE";
  }
  if (resource === "procedures") {
    return "PENDING";
  }
  return "NEW";
}
function normalizeRow(
  resource: Resource,
  value: unknown,
): OperationRow {
  const source = record(value);
  const patient = record(source.patient);
  const practitioner = record(
    source.practitioner ||
      source.provider ||
      source.doctor,
  );
  const encounter = record(source.encounter);
  const branch = record(source.branch);
  const department = record(source.department);
  const clinic = record(source.clinic);
  const sourceRelation = record(
    source.source ||
      source.from_department ||
      source.referring_department ||
      source.referring_practitioner,
  );
  const destinationRelation = record(
    source.destination ||
      source.to_department ||
      source.referred_department ||
      source.referred_practitioner ||
      source.referred_specialty,
  );
  const id = text(
    source.id ||
      source.pk ||
      source.uuid,
  );
  const status = text(
    source.status ||
      source.encounter_status ||
      source.procedure_status ||
      source.referral_status,
    defaultStatus(resource),
  ).toUpperCase();
  let number = id;
  let title = "";
  let notes = "";
  if (resource === "encounters") {
    number = text(
      source.encounter_number ||
        source.number,
      id,
    );
    title = text(
      source.chief_complaint ||
        source.reason_for_visit ||
        source.encounter_type_name ||
        nestedName(source.encounter_type),
    );
    notes = text(
      source.clinical_notes ||
        source.notes,
    );
  }
  if (resource === "diagnoses") {
    number = text(
      source.diagnosis_code ||
        source.code ||
        source.number,
      id,
    );
    title = text(
      source.diagnosis_name ||
        source.name ||
        source.title ||
        source.description,
      number,
    );
    notes = text(
      source.notes ||
        source.description,
    );
  }
  if (resource === "procedures") {
    number = text(
      source.procedure_code ||
        source.code ||
        source.number,
      id,
    );
    title = text(
      source.procedure_name ||
        source.name ||
        source.title ||
        source.description,
      number,
    );
    notes = text(
      source.notes ||
        source.instructions ||
        source.description,
    );
  }
  if (resource === "referrals") {
    number = text(
      source.referral_number ||
        source.number ||
        source.code,
      id,
    );
    title = text(
      source.reason ||
        source.referral_reason ||
        source.clinical_reason ||
        source.notes,
      number,
    );
    notes = text(
      source.notes ||
        source.clinical_notes,
    );
  }
  return {
    id,
    resource,
    number,
    title,
    patientName:
      relationName(
        source,
        [
          source.patient_name,
          source.patient_full_name,
        ],
        patient,
      ) || text(patient.patient_number),
    practitionerName: relationName(
      source,
      [
        source.practitioner_name,
        source.provider_name,
        source.doctor_name,
      ],
      practitioner,
    ),
    encounterId: text(
      source.encounter_id ||
        encounter.id ||
        encounter.pk ||
        source.medical_encounter_id,
    ),
    encounterNumber: text(
      source.encounter_number ||
        encounter.encounter_number ||
        encounter.number ||
        source.medical_encounter_number,
    ),
    branchName: relationName(
      source,
      [source.branch_name],
      branch,
    ),
    departmentName: relationName(
      source,
      [source.department_name],
      department,
    ),
    clinicName: relationName(
      source,
      [source.clinic_name],
      clinic,
    ),
    sourceName: relationName(
      source,
      [
        source.source_name,
        source.from_name,
        source.referring_department_name,
        source.referring_practitioner_name,
      ],
      sourceRelation,
    ),
    destinationName: relationName(
      source,
      [
        source.destination_name,
        source.to_name,
        source.referred_department_name,
        source.referred_practitioner_name,
        source.referred_specialty_name,
      ],
      destinationRelation,
    ),
    status,
    priority: text(
      source.priority ||
        source.referral_priority,
    ).toUpperCase(),
    date: text(
      source.started_at ||
        source.encounter_date ||
        source.diagnosed_at ||
        source.diagnosis_date ||
        source.performed_at ||
        source.scheduled_at ||
        source.procedure_date ||
        source.referred_at ||
        source.referral_date ||
        source.created_at,
    ),
    notes,
  };
}
function getApiBaseUrl() {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api")
    ? value.slice(0, -4)
    : value;
}
async function apiRequest(
  path: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(
    `${getApiBaseUrl()}${path}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      signal,
      headers: {
        Accept: "application/json",
        "X-Requested-With":
          "XMLHttpRequest",
      },
    },
  );
  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(
        raw,
      ) as unknown;
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const source = record(payload);
    throw new Error(
      text(
        source.message ||
          source.detail ||
          source.error,
      ) || `HTTP ${response.status}`,
    );
  }
  return payload;
}
async function mapWithConcurrency<T, TResult>(
  items: readonly T[],
  limit: number,
  worker: (
    item: T,
    index: number,
  ) => Promise<TResult>,
): Promise<TResult[]> {
  if (!items.length) {
    return [];
  }
  const results = new Array<TResult>(
    items.length,
  );
  let cursor = 0;
  const workerCount = Math.min(
    Math.max(1, limit),
    items.length,
  );
  const runners = Array.from(
    { length: workerCount },
    async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) {
          return;
        }
        results[index] = await worker(
          items[index]!,
          index,
        );
      }
    },
  );
  await Promise.all(runners);
  return results;
}function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "ar";
  }
  return window.localStorage.getItem(
    "primey-locale",
  ) === "en"
    ? "en"
    : "ar";
}
function parseDate(
  value: string,
): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
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
function formatDateTime(
  value: string,
  locale: Locale,
) {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat(
    locale === "ar"
      ? "ar-SA-u-nu-latn"
      : "en-GB",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(parsed);
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  return (
    STATUS_LABELS[locale][status] ||
    status.replaceAll("_", " ")
  );
}
function priorityLabel(
  priority: string,
  locale: Locale,
) {
  if (!priority) return "—";
  return (
    PRIORITY_LABELS[locale][priority] ||
    priority.replaceAll("_", " ")
  );
}
function statusClass(status: string) {
  if (
    [
      "ACTIVE",
      "COMPLETED",
      "APPROVED",
      "ACCEPTED",
      "RESOLVED",
    ].includes(status)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "CANCELLED",
      "CANCELED",
      "REJECTED",
      "EXPIRED",
    ].includes(status)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (
    [
      "IN_PROGRESS",
      "CHECKED_IN",
    ].includes(status)
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  if (
    [
      "PENDING",
      "REQUESTED",
      "SCHEDULED",
      "CONFIRMED",
      "NEW",
      "OPEN",
    ].includes(status)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
function priorityClass(priority: string) {
  if (
    ["URGENT", "EMERGENCY"].includes(
      priority,
    )
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (priority === "HIGH") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (
    ["LOW", "ROUTINE"].includes(priority)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
function resourceLabel(
  resource: Resource,
  locale: Locale,
) {
  const t = copy[locale];
  if (resource === "encounters") {
    return t.encountersTab;
  }
  if (resource === "diagnoses") {
    return t.diagnosesTab;
  }
  if (resource === "procedures") {
    return t.proceduresTab;
  }
  return t.referralsTab;
}
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function locationLabel(
  row: OperationRow,
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
function buildReportHtml(
  rows: OperationRow[],
  resource: Resource,
  locale: Locale,
) {
  const t = copy[locale];
  const headers =
    resource === "encounters"
      ? [
          t.record,
          t.patient,
          t.practitioner,
          t.location,
          t.date,
          t.status,
        ]
      : resource === "referrals"
        ? [
            t.record,
            t.patient,
            t.source,
            t.destination,
            t.priority,
            t.date,
            t.status,
          ]
        : [
            t.record,
            t.patient,
            t.encounter,
            t.practitioner,
            t.date,
            t.status,
          ];
  const body = rows.map((row) => {
    if (resource === "encounters") {
      return [
        `${row.number}${
          row.title
            ? ` — ${row.title}`
            : ""
        }`,
        row.patientName || t.unknown,
        row.practitionerName ||
          t.unknown,
        locationLabel(row, t.unknown),
        formatDateTime(
          row.date,
          locale,
        ),
        statusLabel(
          row.status,
          locale,
        ),
      ];
    }
    if (resource === "referrals") {
      return [
        `${row.number}${
          row.title
            ? ` — ${row.title}`
            : ""
        }`,
        row.patientName || t.unknown,
        row.sourceName || t.unknown,
        row.destinationName ||
          t.unknown,
        priorityLabel(
          row.priority,
          locale,
        ),
        formatDateTime(
          row.date,
          locale,
        ),
        statusLabel(
          row.status,
          locale,
        ),
      ];
    }
    return [
      `${row.number}${
        row.title
          ? ` — ${row.title}`
          : ""
      }`,
      row.patientName || t.unknown,
      row.encounterNumber ||
        t.unknown,
      row.practitionerName ||
        t.unknown,
      formatDateTime(
        row.date,
        locale,
      ),
      statusLabel(
        row.status,
        locale,
      ),
    ];
  });
  return `
    <table>
      <thead>
        <tr>
          ${headers
            .map(
              (header) =>
                `<th>${escapeHtml(
                  header,
                )}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${body
          .map(
            (recordRow) => `
              <tr>
                ${recordRow
                  .map(
                    (cell) =>
                      `<td>${escapeHtml(
                        cell,
                      )}</td>`,
                  )
                  .join("")}
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}
function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">
        {value || "—"}
      </p>
    </div>
  );
}
export function ClinicalOperationsClient() {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [resource, setResource] =
    React.useState<Resource>("encounters");
  const [data, setData] =
    React.useState<DataState>(EMPTY_DATA);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const [warnings, setWarnings] =
    React.useState<string[]>([]);
  const [query, setQuery] =
    React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState("all");
  const [branchFilter, setBranchFilter] =
    React.useState("all");
  const [sortKey, setSortKey] =
    React.useState<SortKey>("date");
  const [dateFrom, setDateFrom] =
    React.useState<Date | undefined>();
  const [dateTo, setDateTo] =
    React.useState<Date | undefined>();
  const [selectedRow, setSelectedRow] =
    React.useState<OperationRow | null>(
      null,
    );
  const t = copy[locale];
  const rtl = locale === "ar";
  const router = useRouter();
  const searchParams =
    useSearchParams();
  const requestedResource =
    resourceFromQuery(
      searchParams.get("view"),
    );
  React.useEffect(() => {
    setResource(
      requestedResource,
    );
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("all");
    setSortKey("date");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, [requestedResource]);
  // CLINICAL RECORD DETAIL ROUTING
  const openRecordDetails = React.useCallback(
    (row: OperationRow) => {
      const encodedRecordId =
        encodeURIComponent(row.id);
      if (row.resource === "encounters") {
        router.push(
          `/system/clinical-operations/encounters/${encodedRecordId}`,
        );
        return;
      }
      if (
        row.resource === "diagnoses" &&
        row.encounterId
      ) {
        router.push(
          `/system/clinical-operations/encounters/${encodeURIComponent(
            row.encounterId,
          )}/diagnoses/${encodedRecordId}`,
        );
        return;
      }
      if (
        row.resource === "procedures" &&
        row.encounterId
      ) {
        router.push(
          `/system/clinical-operations/encounters/${encodeURIComponent(
            row.encounterId,
          )}/procedures/${encodedRecordId}`,
        );
        return;
      }
      // CLINICAL REFERRAL DETAIL ROUTING
      if (row.resource === "referrals") {
        router.push(
          `/system/clinical-operations/referrals/${encodedRecordId}`,
        );
        return;
      }
      setSelectedRow(row);
    },
    [router],
  );
  React.useEffect(() => {
    const syncLocale = () => {
      setLocale(getInitialLocale());
    };
    syncLocale();
    window.addEventListener(
      "storage",
      syncLocale,
    );
    window.addEventListener(
      "primey-locale-changed",
      syncLocale,
    );
    return () => {
      window.removeEventListener(
        "storage",
        syncLocale,
      );
      window.removeEventListener(
        "primey-locale-changed",
        syncLocale,
      );
    };
  }, []);
  const load = React.useCallback(
    async ({
      silent = false,
      signal,
    }: {
      silent?: boolean;
      signal?: AbortSignal;
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const [
          encountersResult,
          referralsResult,
        ] = await Promise.allSettled([
          apiRequest(
            ENDPOINTS.encounters,
            signal,
          ),
          apiRequest(
            ENDPOINTS.referrals,
            signal,
          ),
        ]);
        if (signal?.aborted) {
          return;
        }
        const failed: string[] = [];
        const errorMessage = (
          reason: unknown,
        ) =>
          reason instanceof Error
            ? reason.message
            : String(reason);
        if (
          encountersResult.status ===
          "rejected"
        ) {
          failed.push(
            errorMessage(
              encountersResult.reason,
            ),
          );
        }
        if (
          referralsResult.status ===
          "rejected"
        ) {
          failed.push(
            errorMessage(
              referralsResult.reason,
            ),
          );
        }
        if (
          encountersResult.status ===
            "rejected" &&
          referralsResult.status ===
            "rejected"
        ) {
          throw new Error(
            failed[0] || t.loadingError,
          );
        }
        const encounterRows =
          encountersResult.status ===
          "fulfilled"
            ? extractArray(
                encountersResult.value,
              )
                .map((value) =>
                  normalizeRow(
                    "encounters",
                    value,
                  ),
                )
                .filter(
                  (row) => row.id,
                )
            : [];
        const referralRows =
          referralsResult.status ===
          "fulfilled"
            ? extractArray(
                referralsResult.value,
              )
                .map((value) =>
                  normalizeRow(
                    "referrals",
                    value,
                  ),
                )
                .filter(
                  (row) => row.id,
                )
            : [];
        const nestedResults =
          await mapWithConcurrency(
            encounterRows,
            NESTED_CONCURRENCY,
            async (encounter) => {
              const encodedEncounterId =
                encodeURIComponent(
                  encounter.id,
                );
              const [
                diagnosesResult,
                proceduresResult,
              ] =
                await Promise.allSettled([
                  apiRequest(
                    `/api/company/medical/encounters/${encodedEncounterId}/diagnoses/`,
                    signal,
                  ),
                  apiRequest(
                    `/api/company/medical/encounters/${encodedEncounterId}/procedures/`,
                    signal,
                  ),
                ]);
              return {
                diagnosesResult,
                proceduresResult,
              };
            },
          );
        if (signal?.aborted) {
          return;
        }
        const diagnosisRows: OperationRow[] =
          [];
        const procedureRows: OperationRow[] =
          [];
        for (const result of nestedResults) {
          if (
            result.diagnosesResult.status ===
            "fulfilled"
          ) {
            diagnosisRows.push(
              ...extractArray(
                result.diagnosesResult.value,
              )
                .map((value) =>
                  normalizeRow(
                    "diagnoses",
                    value,
                  ),
                )
                .filter(
                  (row) => row.id,
                ),
            );
          } else {
            failed.push(
              errorMessage(
                result.diagnosesResult
                  .reason,
              ),
            );
          }
          if (
            result.proceduresResult.status ===
            "fulfilled"
          ) {
            procedureRows.push(
              ...extractArray(
                result.proceduresResult.value,
              )
                .map((value) =>
                  normalizeRow(
                    "procedures",
                    value,
                  ),
                )
                .filter(
                  (row) => row.id,
                ),
            );
          } else {
            failed.push(
              errorMessage(
                result.proceduresResult
                  .reason,
              ),
            );
          }
        }
        const uniqueWarnings =
          Array.from(
            new Set(
              failed.filter(Boolean),
            ),
          );
        setData({
          encounters: encounterRows,
          diagnoses: diagnosisRows,
          procedures: procedureRows,
          referrals: referralRows,
        });
        setWarnings(uniqueWarnings);
        if (silent) {
          if (uniqueWarnings.length) {
            toast.warning(
              t.partialTitle,
            );
          } else {
            toast.success(t.refreshed);
          }
        }
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }
        const message =
          caught instanceof Error
            ? caught.message
            : t.loadingError;
        setError(message);
        if (silent) {
          toast.error(message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      t.loadingError,
      t.partialTitle,
      t.refreshed,
    ],
  );  React.useEffect(() => {
    const controller =
      new AbortController();
    void load({
      signal: controller.signal,
    });
    return () =>
      controller.abort();
  }, [load]);
  const currentRows = data[resource];
  const statuses = React.useMemo(
    () =>
      Array.from(
        new Set(
          currentRows
            .map((row) => row.status)
            .filter(Boolean),
        ),
      ).sort(),
    [currentRows],
  );
  const branches = React.useMemo(
    () =>
      Array.from(
        new Set(
          currentRows
            .map(
              (row) => row.branchName,
            )
            .filter(Boolean),
        ),
      ).sort((left, right) =>
        left.localeCompare(
          right,
          locale,
        ),
      ),
    [currentRows, locale],
  );
  const filteredRows = React.useMemo(() => {
    const needle = query
      .trim()
      .toLowerCase();
    const fromTime = dateFrom
      ? new Date(
          dateFrom.getFullYear(),
          dateFrom.getMonth(),
          dateFrom.getDate(),
          0,
          0,
          0,
          0,
        ).getTime()
      : null;
    const toTime = dateTo
      ? new Date(
          dateTo.getFullYear(),
          dateTo.getMonth(),
          dateTo.getDate(),
          23,
          59,
          59,
          999,
        ).getTime()
      : null;
    return currentRows
      .filter((row) => {
        if (
          statusFilter !== "all" &&
          row.status !== statusFilter
        ) {
          return false;
        }
        if (
          branchFilter !== "all" &&
          row.branchName !== branchFilter
        ) {
          return false;
        }
        const parsedDate =
          parseDate(row.date);
        const rowTime =
          parsedDate?.getTime() || null;
        if (
          fromTime !== null &&
          (rowTime === null ||
            rowTime < fromTime)
        ) {
          return false;
        }
        if (
          toTime !== null &&
          (rowTime === null ||
            rowTime > toTime)
        ) {
          return false;
        }
        if (!needle) {
          return true;
        }
        return [
          row.number,
          row.title,
          row.patientName,
          row.practitionerName,
          row.encounterNumber,
          row.branchName,
          row.departmentName,
          row.clinicName,
          row.sourceName,
          row.destinationName,
          row.status,
          row.priority,
          row.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => {
        if (sortKey === "name") {
          return left.title.localeCompare(
            right.title,
            locale,
          );
        }
        if (sortKey === "status") {
          return left.status.localeCompare(
            right.status,
            locale,
          );
        }
        return (
          (parseDate(
            right.date,
          )?.getTime() || 0) -
          (parseDate(
            left.date,
          )?.getTime() || 0)
        );
      });
  }, [
    branchFilter,
    currentRows,
    dateFrom,
    dateTo,
    locale,
    query,
    sortKey,
    statusFilter,
  ]);
  const stats = React.useMemo(() => {
    return {
      encounters:
        data.encounters.length,
      diagnoses:
        data.diagnoses.length,
      procedures: data.procedures.filter(
        (row) =>
          !TERMINAL_STATUSES.has(
            row.status,
          ),
      ).length,
      referrals: data.referrals.filter(
        (row) =>
          !TERMINAL_STATUSES.has(
            row.status,
          ),
      ).length,
    };
  }, [data]);
  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== "all" ||
    branchFilter !== "all" ||
    sortKey !== "date" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("all");
    setSortKey("date");
    setDateFrom(undefined);
    setDateTo(undefined);
  };
  const exportExcel = () => {
    if (!filteredRows.length) {
      toast.warning(t.excelEmpty);
      return;
    }
    const html = `<!doctype html>
<html dir="${rtl ? "rtl" : "ltr"}" lang="${locale}">
<head>
<meta charset="UTF-8" />
<style>
body{font-family:Tahoma,Arial,sans-serif;padding:18px;color:#111}
h1{font-size:20px;margin:0 0 16px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:7px;text-align:${rtl ? "right" : "left"}}
th{background:#eee}
</style>
</head>
<body>
<h1>${escapeHtml(
      t.reportTitle,
    )} — ${escapeHtml(
      resourceLabel(
        resource,
        locale,
      ),
    )}</h1>
${buildReportHtml(
  filteredRows,
  resource,
  locale,
)}
</body>
</html>`;
    const blob = new Blob(
      ["\uFEFF", html],
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
      `marilyn-clinical-${resource}-${new Date()
        .toISOString()
        .slice(0, 10)}.xls`;
    document.body.appendChild(
      anchor,
    );
    anchor.click();
    anchor.remove();
    window.setTimeout(
      () =>
        URL.revokeObjectURL(url),
      1000,
    );
    toast.success(t.excelReady);
  };
  const printRows = async () => {
    if (!filteredRows.length) {
      toast.warning(t.printEmpty);
      return;
    }
    const branchName =
      branchFilter === "all"
        ? t.allBranchesPrint
        : branchFilter;
    const opened =
      await openPrintReport({
        locale,
        title: t.reportTitle,
        subtitle: resourceLabel(
          resource,
          locale,
        ),
        branchName,
        tableHtml: buildReportHtml(
          filteredRows,
          resource,
          locale,
        ),
        recordsCount:
          filteredRows.length,
        logoUrl:
          "/logo/marilyn.svg",
      });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  };
  const columnCount =
    resource === "encounters"
      ? 7
      : resource === "referrals"
        ? 8
        : 7;
  return (
    <main
      dir={rtl ? "rtl" : "ltr"}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-5xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <HeartPulse className="h-3.5 w-3.5 text-[#a57b3d]" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.description}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              {locale === "ar"
                ? "متصل بواجهات الزيارات والتشخيصات والإجراءات والإحالات الحقيقية"
                : "Connected to live encounter, diagnosis, procedure, and referral APIs"}
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
                void load({
                  silent: true,
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
              className={
                registerOutlineButtonClass
              }
              onClick={exportExcel}
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
                void printRows()
              }
            >
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
                <p className="text-sm font-semibold">
                  {t.partialTitle}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {
                    t.partialDescription
                  }
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {warnings.join(" • ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {error ? (
          <Card className="rounded-lg border-rose-200 bg-card shadow-none">
            <CardHeader className="items-center text-center">
              <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <HeartPulse className="h-7 w-7" />
              </span>
              <CardTitle>
                {t.loadingError}
              </CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                type="button"
                onClick={() => void load()}
              >
                <RefreshCw className="h-4 w-4" />
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({
              length: 4,
            }).map((_, index) => (
              <Card
                key={`clinical-kpi-${index}`}
                className="min-h-[126px] rounded-lg border bg-card shadow-none"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <SystemKpiCard
                title={t.encountersKpi}
                value={stats.encounters}
                description={
                  t.encountersDesc
                }
                icon={Activity}
              />
              <SystemKpiCard
                title={t.diagnosesKpi}
                value={stats.diagnoses}
                description={
                  t.diagnosesDesc
                }
                icon={Stethoscope}
              />
              <SystemKpiCard
                title={t.proceduresKpi}
                value={stats.procedures}
                description={
                  t.proceduresDesc
                }
                icon={ClipboardList}
              />
              <SystemKpiCard
                title={t.referralsKpi}
                value={stats.referrals}
                description={
                  t.referralsDesc
                }
                icon={Waypoints}
              />
            </>
          )}
        </section>

        <MedicalOperationsTabs
          active={resource}
          locale={locale}
          counts={{
            encounters:
              stats.encounters,
            diagnoses:
              stats.diagnoses,
            procedures:
              stats.procedures,
            referrals:
              stats.referrals,
          }}
        />
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <HeartPulse className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle} —{" "}
                  {resourceLabel(
                    resource,
                    locale,
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {
                    t
                      .registerDescriptions[
                      resource
                    ]
                  }
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={exportExcel}
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
                    void printRows()
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
                  value={query}
                  onChange={setQuery}
                  placeholder={t.search}
                  className="w-full sm:w-[340px]"
                />
                <Select
                  value={statusFilter}
                  onValueChange={
                    setStatusFilter
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[155px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.allStatuses}
                    </SelectItem>
                    {statuses.map(
                      (status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {statusLabel(
                            status,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={branchFilter}
                  onValueChange={
                    setBranchFilter
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[175px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.allBranches}
                    </SelectItem>
                    {branches.map(
                      (branch) => (
                        <SelectItem
                          key={branch}
                          value={branch}
                        >
                          {branch}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 min-w-[145px] justify-start bg-background font-normal shadow-none [&_svg]:text-[#a57b3d]"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span
                        dir="ltr"
                        lang="en"
                        className="tabular-nums"
                      >
                        {dateFrom
                          ? dateKey(
                              dateFrom,
                            )
                          : t.fromDate}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align={
                      rtl
                        ? "start"
                        : "end"
                    }
                    className="w-auto p-0"
                  >
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={
                        setDateFrom
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 min-w-[145px] justify-start bg-background font-normal shadow-none [&_svg]:text-[#a57b3d]"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span
                        dir="ltr"
                        lang="en"
                        className="tabular-nums"
                      >
                        {dateTo
                          ? dateKey(
                              dateTo,
                            )
                          : t.toDate}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align={
                      rtl
                        ? "start"
                        : "end"
                    }
                    className="w-auto p-0"
                  >
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sortKey}
                  onValueChange={(value) =>
                    setSortKey(
                      value as SortKey,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[155px]">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">
                      {t.sortDate}
                    </SelectItem>
                    <SelectItem value="name">
                      {t.sortName}
                    </SelectItem>
                    <SelectItem value="status">
                      {t.sortStatus}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={resetFilters}
                  disabled={!hasFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.reset}
                </Button>
              </div>
            </DataRegisterToolbar>
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                  <Table
                    variant="register"
                    layout="fixed"
                    minWidth="1180px"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={`sticky z-20 h-11 w-[260px] bg-muted/40 px-4 text-start text-xs font-semibold text-muted-foreground ${
                            rtl
                              ? "right-0"
                              : "left-0"
                          }`}
                        >
                          {t.record}
                        </TableHead>
                        <TableHead className="h-11 w-[190px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.patient}
                        </TableHead>
                        {resource ===
                        "encounters" ? (
                          <>
                            <TableHead className="h-11 w-[190px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.practitioner}
                            </TableHead>
                            <TableHead className="h-11 w-[245px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.location}
                            </TableHead>
                          </>
                        ) : null}
                        {resource ===
                          "diagnoses" ||
                        resource ===
                          "procedures" ? (
                          <>
                            <TableHead className="h-11 w-[150px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.encounter}
                            </TableHead>
                            <TableHead className="h-11 w-[190px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.practitioner}
                            </TableHead>
                          </>
                        ) : null}
                        {resource ===
                        "referrals" ? (
                          <>
                            <TableHead className="h-11 w-[250px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {
                                t.sourceDestination
                              }
                            </TableHead>
                            <TableHead className="h-11 w-[125px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.priority}
                            </TableHead>
                          </>
                        ) : null}
                        <TableHead className="h-11 w-[175px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.date}
                        </TableHead>
                        <TableHead className="h-11 w-[130px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.status}
                        </TableHead>
                        <TableHead
                          className={`sticky z-20 h-11 w-[84px] bg-muted/40 px-4 text-center text-xs font-semibold text-muted-foreground ${
                            rtl
                              ? "left-0"
                              : "right-0"
                          }`}
                        >
                          {t.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({
                          length: 6,
                        }).map((_, index) => (
                          <TableRow
                            key={`clinical-loading-${index}`}
                            className="h-[66px]"
                          >
                            <TableCell
                              colSpan={
                                columnCount
                              }
                              className="h-[66px] px-4"
                            >
                              <Skeleton className="h-9 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredRows.length ? (
                        filteredRows.map(
                          (row) => (
                            <TableRow
                              key={`${resource}-${row.id}`}
                              className="group h-[66px] cursor-pointer hover:bg-muted/35"
                              onClick={() =>
                                openRecordDetails(
                                  row,
                                )
                              }
                            >
                              <TableCell
                                className={`sticky z-10 h-[66px] overflow-hidden bg-background px-4 text-start align-middle group-hover:bg-muted/35 ${
                                  rtl
                                    ? "right-0"
                                    : "left-0"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">
                                    {row.title ||
                                      row.number ||
                                      t.unknown}
                                  </p>
                                  <p
                                    dir="ltr"
                                    lang="en"
                                    className="mt-1 truncate font-mono text-xs text-muted-foreground"
                                  >
                                    {row.number ||
                                      "—"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                <span className="block truncate">
                                  {row.patientName ||
                                    t.unknown}
                                </span>
                              </TableCell>
                              {resource ===
                              "encounters" ? (
                                <>
                                  <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                    <span className="block truncate">
                                      {row.practitionerName ||
                                        t.unknown}
                                    </span>
                                  </TableCell>
                                  <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                    <p className="truncate text-sm font-medium">
                                      {row.branchName ||
                                        t.unknown}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {[
                                        row.departmentName,
                                        row.clinicName,
                                      ]
                                        .filter(
                                          Boolean,
                                        )
                                        .join(
                                          " • ",
                                        ) ||
                                        t.unknown}
                                    </p>
                                  </TableCell>
                                </>
                              ) : null}
                              {resource ===
                                "diagnoses" ||
                              resource ===
                                "procedures" ? (
                                <>
                                  <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle font-mono text-xs">
                                    {row.encounterNumber ||
                                      "—"}
                                  </TableCell>
                                  <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                    <span className="block truncate">
                                      {row.practitionerName ||
                                        t.unknown}
                                    </span>
                                  </TableCell>
                                </>
                              ) : null}
                              {resource ===
                              "referrals" ? (
                                <>
                                  <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                    <p className="truncate text-sm">
                                      {row.sourceName ||
                                        t.unknown}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {row.destinationName ||
                                        t.unknown}
                                    </p>
                                  </TableCell>
                                  <TableCell className="h-[66px] px-4 text-start align-middle">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full ${priorityClass(
                                        row.priority,
                                      )}`}
                                    >
                                      {priorityLabel(
                                        row.priority,
                                        locale,
                                      )}
                                    </Badge>
                                  </TableCell>
                                </>
                              ) : null}
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <span
                                  dir="ltr"
                                  lang="en"
                                  className="whitespace-nowrap text-sm tabular-nums"
                                >
                                  {formatDateTime(
                                    row.date,
                                    locale,
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <Badge
                                  variant="outline"
                                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass(
                                    row.status,
                                  )}`}
                                >
                                  {statusLabel(
                                    row.status,
                                    locale,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`sticky z-10 h-[66px] bg-background px-4 text-center align-middle group-hover:bg-muted/35 ${
                                  rtl
                                    ? "left-0"
                                    : "right-0"
                                }`}
                                onClick={(
                                  event,
                                ) =>
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
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">
                                        {
                                          t.actions
                                        }
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align={
                                      rtl
                                        ? "start"
                                        : "end"
                                    }
                                  >
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        openRecordDetails(
                                          row,
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4 text-[#b58c4d]" />
                                      {t.details}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ),
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={
                              columnCount
                            }
                            className="h-72"
                          >
                            <DataRegisterEmptyState
                              title={
                                currentRows.length
                                  ? t.noResults
                                  : t.noData
                              }
                              description={
                                t
                                  .registerDescriptions[
                                  resource
                                ]
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
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {t.resultCount}:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {filteredRows.length.toLocaleString(
                      "en-US",
                    )}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {currentRows.length.toLocaleString(
                      "en-US",
                    )}
                  </span>
                </span>
                <span>
                  {resourceLabel(
                    resource,
                    locale,
                  )}{" "}
                  — {t.totalCount}:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {currentRows.length.toLocaleString(
                      "en-US",
                    )}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
          }
        }}
      >
        <DialogContent
          dir={rtl ? "rtl" : "ltr"}
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {t.detailsTitle}
            </DialogTitle>
            <DialogDescription>
              {t.detailsDescription}
            </DialogDescription>
          </DialogHeader>
          {selectedRow ? (
            <div className="grid gap-3 py-4 sm:grid-cols-2">
              <DetailField
                label={t.number}
                value={
                  selectedRow.number
                }
              />
              <DetailField
                label={t.titleField}
                value={
                  selectedRow.title
                }
              />
              <DetailField
                label={t.patient}
                value={
                  selectedRow.patientName
                }
              />
              <DetailField
                label={t.practitioner}
                value={
                  selectedRow.practitionerName
                }
              />
              <DetailField
                label={t.encounter}
                value={
                  selectedRow.encounterNumber
                }
              />
              <DetailField
                label={t.status}
                value={statusLabel(
                  selectedRow.status,
                  locale,
                )}
              />
              <DetailField
                label={t.priority}
                value={priorityLabel(
                  selectedRow.priority,
                  locale,
                )}
              />
              <DetailField
                label={t.date}
                value={formatDateTime(
                  selectedRow.date,
                  locale,
                )}
              />
              <DetailField
                label={t.branch}
                value={
                  selectedRow.branchName
                }
              />
              <DetailField
                label={t.department}
                value={
                  selectedRow.departmentName
                }
              />
              <DetailField
                label={t.clinic}
                value={
                  selectedRow.clinicName
                }
              />
              <DetailField
                label={t.source}
                value={
                  selectedRow.sourceName
                }
              />
              <DetailField
                label={t.destination}
                value={
                  selectedRow.destinationName
                }
              />
              <div className="sm:col-span-2">
                <DetailField
                  label={t.notes}
                  value={
                    selectedRow.notes
                  }
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
