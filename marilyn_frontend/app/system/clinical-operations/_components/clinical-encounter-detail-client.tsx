"use client";
/*
 * MARILYN CLINICAL ENCOUNTER DETAIL
 * Live encounter, diagnoses, and procedures.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  Sparkles,
  Stethoscope,
  UserRound,
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
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
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
import {
  ClinicalEncounterHeaderActions,
  ClinicalEncounterRegisterAction,
} from "@/app/system/clinical-operations/_components/clinical-operation-actions";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type RelatedRecord = {
  id: string;
  code: string;
  name: string;
};
type EncounterDetail = {
  id: string;
  number: string;
  appointment: RelatedRecord;
  patient: RelatedRecord;
  practitioner: RelatedRecord;
  branch: RelatedRecord;
  department: RelatedRecord;
  clinic: RelatedRecord;
  encounterType: string;
  status: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  clinicalNotes: string;
  treatmentPlan: string;
  followUpPlan: string;
  openedAt: string;
  closedAt: string;
  openedBy: string;
  closedBy: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
type DiagnosisRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  diagnosisType: string;
  isPrimary: boolean;
  diagnosedAt: string;
  notes: string;
};
type ProcedureRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  quantity: number;
  unitPrice: number | null;
  performedAt: string;
  cancellationReason: string;
  notes: string;
};
type Props = {
  encounterId: string;
};
const copy = {
  ar: {
    badge: "تفاصيل الزيارة الطبية",
    fallbackTitle: "الزيارة الطبية",
    description:
      "عرض بيانات الزيارة والمريض والممارس والسجل السريري والتشخيصات والإجراءات المرتبطة.",
    back: "العودة إلى التشغيل الطبي",
    refresh: "تحديث",
    print: "طباعة",
    diagnoses: "التشخيصات",
    procedures: "الإجراءات",
    activeProcedures: "الإجراءات المفتوحة",
    encounterStatus: "حالة الزيارة",
    diagnosesDesc: "التشخيصات المرتبطة بهذه الزيارة",
    proceduresDesc: "جميع الإجراءات الطبية المسجلة",
    activeProceduresDesc: "الإجراءات التي لم تُغلق أو تُلغَ",
    encounterStatusDesc: "الحالة التشغيلية الحالية للزيارة",
    identityTitle: "بيانات الزيارة",
    identityDescription:
      "رقم الزيارة ونوعها والموعد والمريض والممارس.",
    number: "رقم الزيارة",
    encounterType: "نوع الزيارة",
    appointment: "الموعد",
    patient: "المريض",
    practitioner: "الممارس",
    status: "الحالة",
    locationTitle: "موقع تقديم الرعاية",
    locationDescription:
      "الفرع والقسم والعيادة المرتبطة بالزيارة.",
    branch: "الفرع",
    department: "القسم",
    clinic: "العيادة",
    clinicalTitle: "السجل السريري",
    clinicalDescription:
      "الشكوى الرئيسية والتاريخ المرضي والملاحظات السريرية.",
    chiefComplaint: "الشكوى الرئيسية",
    history: "تاريخ الحالة الحالية",
    clinicalNotes: "الملاحظات السريرية",
    planTitle: "الخطة العلاجية والمتابعة",
    planDescription:
      "الخطة العلاجية وخطة المتابعة والملاحظات العامة.",
    treatmentPlan: "الخطة العلاجية",
    followUpPlan: "خطة المتابعة",
    notes: "ملاحظات عامة",
    timelineTitle: "التوقيت والتدقيق",
    timelineDescription:
      "أوقات فتح وإغلاق الزيارة وإنشاء السجل وآخر تحديث.",
    openedAt: "تاريخ الفتح",
    closedAt: "تاريخ الإغلاق",
    openedBy: "فتح بواسطة",
    closedBy: "أغلق بواسطة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    diagnosisRegister: "سجل التشخيصات",
    diagnosisRegisterDesc:
      "التشخيصات المرتبطة بالزيارة وحالتها ونوعها والتشخيص الأساسي.",
    diagnosis: "التشخيص",
    diagnosisType: "النوع",
    primary: "أساسي",
    diagnosedAt: "تاريخ التشخيص",
    procedureRegister: "سجل الإجراءات",
    procedureRegisterDesc:
      "الإجراءات الطبية وكمياتها وحالتها ووقت تنفيذها.",
    procedure: "الإجراء",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    performedAt: "وقت التنفيذ",
    cancellationReason: "سبب الإلغاء",
    yes: "نعم",
    no: "لا",
    unknown: "غير محدد",
    noDiagnoses: "لا توجد تشخيصات مرتبطة بهذه الزيارة.",
    noProcedures: "لا توجد إجراءات مرتبطة بهذه الزيارة.",
    loadingError: "تعذر تحميل تفاصيل الزيارة الطبية",
    retry: "إعادة المحاولة",
    refreshed: "تم تحديث تفاصيل الزيارة الطبية.",
    partial: "تم تحميل بعض بيانات الزيارة فقط.",
    printReady: "تم تجهيز تقرير الزيارة الطبية.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تفاصيل الزيارة الطبية — Marilyn Clinics",
  },
  en: {
    badge: "Clinical encounter details",
    fallbackTitle: "Medical encounter",
    description:
      "View encounter, patient, practitioner, clinical record, diagnoses, and procedures.",
    back: "Back to clinical operations",
    refresh: "Refresh",
    print: "Print",
    diagnoses: "Diagnoses",
    procedures: "Procedures",
    activeProcedures: "Open procedures",
    encounterStatus: "Encounter status",
    diagnosesDesc: "Diagnoses linked to this encounter",
    proceduresDesc: "All registered medical procedures",
    activeProceduresDesc: "Procedures not completed or cancelled",
    encounterStatusDesc: "Current operational encounter status",
    identityTitle: "Encounter information",
    identityDescription:
      "Encounter number, type, appointment, patient, and practitioner.",
    number: "Encounter number",
    encounterType: "Encounter type",
    appointment: "Appointment",
    patient: "Patient",
    practitioner: "Practitioner",
    status: "Status",
    locationTitle: "Care location",
    locationDescription:
      "Branch, department, and clinic linked to the encounter.",
    branch: "Branch",
    department: "Department",
    clinic: "Clinic",
    clinicalTitle: "Clinical record",
    clinicalDescription:
      "Chief complaint, present illness history, and clinical notes.",
    chiefComplaint: "Chief complaint",
    history: "History of present illness",
    clinicalNotes: "Clinical notes",
    planTitle: "Treatment and follow-up",
    planDescription:
      "Treatment plan, follow-up plan, and general notes.",
    treatmentPlan: "Treatment plan",
    followUpPlan: "Follow-up plan",
    notes: "General notes",
    timelineTitle: "Timeline and audit",
    timelineDescription:
      "Opening, closing, creation, and last-update timestamps.",
    openedAt: "Opened at",
    closedAt: "Closed at",
    openedBy: "Opened by",
    closedBy: "Closed by",
    createdAt: "Created at",
    updatedAt: "Updated at",
    diagnosisRegister: "Diagnoses register",
    diagnosisRegisterDesc:
      "Encounter diagnoses, statuses, types, and primary diagnosis.",
    diagnosis: "Diagnosis",
    diagnosisType: "Type",
    primary: "Primary",
    diagnosedAt: "Diagnosed at",
    procedureRegister: "Procedures register",
    procedureRegisterDesc:
      "Medical procedures, quantities, statuses, and performance times.",
    procedure: "Procedure",
    quantity: "Quantity",
    unitPrice: "Unit price",
    performedAt: "Performed at",
    cancellationReason: "Cancellation reason",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    noDiagnoses: "No diagnoses are linked to this encounter.",
    noProcedures: "No procedures are linked to this encounter.",
    loadingError: "Could not load medical encounter details",
    retry: "Try again",
    refreshed: "Medical encounter details refreshed.",
    partial: "Only part of the encounter data was loaded.",
    printReady: "Encounter report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Medical Encounter Details — Marilyn Clinics",
  },
} as const;
const TERMINAL_PROCEDURE_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
  "CANCELED",
]);
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
function numberValue(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}
function boolValue(
  value: unknown,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes"].includes(
    text(value).toLowerCase(),
  );
}
function extractArray(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload) || depth > 3) {
    return [];
  }
  const candidates = [
    payload.items,
    payload.results,
    payload.records,
    payload.diagnoses,
    payload.procedures,
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
function normalizeRelated(
  value: unknown,
): RelatedRecord {
  const source = record(value);
  return {
    id: text(source.id || source.pk),
    code: text(
      source.code ||
        source.number ||
        source.patient_number ||
        source.practitioner_number ||
        source.appointment_number,
    ),
    name: text(
      source.name ||
        source.full_name ||
        source.full_name_ar ||
        source.full_name_en ||
        source.display_name ||
        source.code,
    ),
  };
}
function normalizeEncounter(
  payload: unknown,
): EncounterDetail {
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  const openedBy = record(source.opened_by);
  const closedBy = record(source.closed_by);
  return {
    id: text(source.id || source.pk),
    number: text(
      source.encounter_number ||
        source.number,
    ),
    appointment: normalizeRelated(
      source.appointment,
    ),
    patient: normalizeRelated(
      source.patient,
    ),
    practitioner: normalizeRelated(
      source.practitioner,
    ),
    branch: normalizeRelated(source.branch),
    department: normalizeRelated(
      source.department,
    ),
    clinic: normalizeRelated(source.clinic),
    encounterType: text(
      source.encounter_type,
    ).toUpperCase(),
    status: text(
      source.status,
    ).toUpperCase(),
    chiefComplaint: text(
      source.chief_complaint,
    ),
    historyOfPresentIllness: text(
      source.history_of_present_illness,
    ),
    clinicalNotes: text(
      source.clinical_notes,
    ),
    treatmentPlan: text(
      source.treatment_plan,
    ),
    followUpPlan: text(
      source.follow_up_plan,
    ),
    openedAt: text(source.opened_at),
    closedAt: text(source.closed_at),
    openedBy: text(
      openedBy.name ||
        openedBy.username,
    ),
    closedBy: text(
      closedBy.name ||
        closedBy.username,
    ),
    notes: text(source.notes),
    createdAt: text(source.created_at),
    updatedAt: text(source.updated_at),
  };
}
function normalizeDiagnosis(
  value: unknown,
): DiagnosisRow {
  const source = record(value);
  const catalog = record(
    source.catalog_item ||
      source.diagnosis,
  );
  return {
    id: text(source.id || source.pk),
    code: text(
      source.diagnosis_code ||
        source.code ||
        source.code_snapshot ||
        catalog.code,
    ),
    name: text(
      source.diagnosis_name ||
        source.name ||
        source.name_snapshot ||
        source.description ||
        catalog.name,
    ),
    status: text(
      source.status,
      "ACTIVE",
    ).toUpperCase(),
    diagnosisType: text(
      source.diagnosis_type ||
        source.type,
    ).toUpperCase(),
    isPrimary: boolValue(
      source.is_primary ||
        source.primary,
    ),
    diagnosedAt: text(
      source.diagnosed_at ||
        source.created_at,
    ),
    notes: text(source.notes),
  };
}
function normalizeProcedure(
  value: unknown,
): ProcedureRow {
  const source = record(value);
  const catalog = record(source.catalog_item);
  const rawUnitPrice =
    source.unit_price_snapshot === null ||
    source.unit_price_snapshot === undefined ||
    source.unit_price_snapshot === ""
      ? null
      : numberValue(
          source.unit_price_snapshot,
        );
  return {
    id: text(source.id || source.pk),
    code: text(
      source.procedure_code_snapshot ||
        source.procedure_code ||
        source.code ||
        catalog.code,
    ),
    name: text(
      source.procedure_name_snapshot ||
        source.procedure_name ||
        source.name ||
        catalog.name,
    ),
    status: text(
      source.status,
      "PENDING",
    ).toUpperCase(),
    quantity: numberValue(
      source.quantity,
      1,
    ),
    unitPrice: rawUnitPrice,
    performedAt: text(
      source.performed_at ||
        source.created_at,
    ),
    cancellationReason: text(
      source.cancellation_reason,
    ),
    notes: text(source.notes),
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
      payload = JSON.parse(raw) as unknown;
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
function displayRelated(
  value: RelatedRecord,
  fallback: string,
) {
  return value.name || value.code || fallback;
}
function formatDateTime(
  value: string,
  locale: Locale,
) {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
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
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  const labels: Record<
    Locale,
    Record<string, string>
  > = {
    ar: {
      DRAFT: "مسودة",
      OPEN: "مفتوح",
      IN_PROGRESS: "قيد التنفيذ",
      COMPLETED: "مكتمل",
      CANCELLED: "ملغي",
      ACTIVE: "نشط",
      PENDING: "معلق",
      SCHEDULED: "مجدول",
    },
    en: {
      DRAFT: "Draft",
      OPEN: "Open",
      IN_PROGRESS: "In progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      ACTIVE: "Active",
      PENDING: "Pending",
      SCHEDULED: "Scheduled",
    },
  };
  return (
    labels[locale][status] ||
    status.replaceAll("_", " ") ||
    "—"
  );
}
function statusClass(status: string) {
  if (
    ["COMPLETED", "ACTIVE"].includes(status)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    ["CANCELLED", "CANCELED"].includes(status)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "IN_PROGRESS") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function DetailField({
  label,
  value,
  dir,
}: {
  label: string;
  value: React.ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-lg border bg-muted/15 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <div
        dir={dir}
        className="mt-1 break-words text-sm font-medium"
      >
        {value || "—"}
      </div>
    </div>
  );
}
type SectionHeadingProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
};
function SectionHeading({
  icon: Icon,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-[#a57b3d]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">
          {description}
        </CardDescription>
      </div>
    </div>
  );
}
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function buildReportHtml(
  encounter: EncounterDetail,
  diagnoses: DiagnosisRow[],
  procedures: ProcedureRow[],
  locale: Locale,
) {
  const t = copy[locale];
  const detailRows = [
    [t.number, encounter.number],
    [
      t.patient,
      displayRelated(
        encounter.patient,
        t.unknown,
      ),
    ],
    [
      t.practitioner,
      displayRelated(
        encounter.practitioner,
        t.unknown,
      ),
    ],
    [
      t.branch,
      displayRelated(
        encounter.branch,
        t.unknown,
      ),
    ],
    [t.status, statusLabel(encounter.status, locale)],
    [t.chiefComplaint, encounter.chiefComplaint],
    [t.clinicalNotes, encounter.clinicalNotes],
    [t.treatmentPlan, encounter.treatmentPlan],
    [t.followUpPlan, encounter.followUpPlan],
  ];
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(
            locale === "ar" ? "البيان" : "Field",
          )}</th>
          <th>${escapeHtml(
            locale === "ar" ? "القيمة" : "Value",
          )}</th>
        </tr>
      </thead>
      <tbody>
        ${detailRows
          .map(
            ([label, value]) => `
              <tr>
                <td>${escapeHtml(label)}</td>
                <td>${escapeHtml(value || "—")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
    <h3>${escapeHtml(t.diagnoses)}</h3>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.diagnosis)}</th>
          <th>${escapeHtml(t.status)}</th>
          <th>${escapeHtml(t.primary)}</th>
        </tr>
      </thead>
      <tbody>
        ${diagnoses
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(
                  `${item.name} ${item.code}`,
                )}</td>
                <td>${escapeHtml(
                  statusLabel(item.status, locale),
                )}</td>
                <td>${escapeHtml(
                  item.isPrimary ? t.yes : t.no,
                )}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
    <h3>${escapeHtml(t.procedures)}</h3>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.procedure)}</th>
          <th>${escapeHtml(t.quantity)}</th>
          <th>${escapeHtml(t.status)}</th>
        </tr>
      </thead>
      <tbody>
        ${procedures
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(
                  `${item.name} ${item.code}`,
                )}</td>
                <td>${escapeHtml(item.quantity)}</td>
                <td>${escapeHtml(
                  statusLabel(item.status, locale),
                )}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}
export function ClinicalEncounterDetailClient({
  encounterId,
}: Props) {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [encounter, setEncounter] =
    React.useState<EncounterDetail | null>(
      null,
    );
  const [diagnoses, setDiagnoses] =
    React.useState<DiagnosisRow[]>([]);
  const [procedures, setProcedures] =
    React.useState<ProcedureRow[]>([]);
  const [warnings, setWarnings] =
    React.useState<string[]>([]);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const t = copy[locale];
  const rtl = locale === "ar";
  const router = useRouter();
  // CLINICAL CHILD RECORD DETAIL ROUTING
  const openDiagnosisDetails =
    React.useCallback(
      (item: DiagnosisRow) => {
        router.push(
          `/system/clinical-operations/encounters/${encodeURIComponent(
            encounterId,
          )}/diagnoses/${encodeURIComponent(
            item.id,
          )}`,
        );
      },
      [encounterId, router],
    );
  const openProcedureDetails =
    React.useCallback(
      (item: ProcedureRow) => {
        router.push(
          `/system/clinical-operations/encounters/${encodeURIComponent(
            encounterId,
          )}/procedures/${encodeURIComponent(
            item.id,
          )}`,
        );
      },
      [encounterId, router],
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
      const encodedId =
        encodeURIComponent(encounterId);
      try {
        const results =
          await Promise.allSettled([
            apiRequest(
              `/api/company/medical/encounters/${encodedId}/`,
              signal,
            ),
            apiRequest(
              `/api/company/medical/encounters/${encodedId}/diagnoses/`,
              signal,
            ),
            apiRequest(
              `/api/company/medical/encounters/${encodedId}/procedures/`,
              signal,
            ),
          ]);
        if (signal?.aborted) {
          return;
        }
        const encounterResult = results[0];
        if (
          !encounterResult ||
          encounterResult.status === "rejected"
        ) {
          throw new Error(
            encounterResult?.status === "rejected" &&
            encounterResult.reason instanceof Error
              ? encounterResult.reason.message
              : t.loadingError,
          );
        }
        const nextEncounter =
          normalizeEncounter(
            encounterResult.value,
          );
        if (!nextEncounter.id) {
          throw new Error(
            "Invalid encounter response.",
          );
        }
        const nextWarnings: string[] = [];
        const diagnosisResult = results[1];
        const procedureResult = results[2];
        if (
          diagnosisResult?.status === "fulfilled"
        ) {
          setDiagnoses(
            extractArray(
              diagnosisResult.value,
            )
              .map(normalizeDiagnosis)
              .filter((item) => item.id),
          );
        } else if (
          diagnosisResult?.status === "rejected"
        ) {
          nextWarnings.push(
            diagnosisResult.reason instanceof Error
              ? diagnosisResult.reason.message
              : String(diagnosisResult.reason),
          );
          setDiagnoses([]);
        }
        if (
          procedureResult?.status === "fulfilled"
        ) {
          setProcedures(
            extractArray(
              procedureResult.value,
            )
              .map(normalizeProcedure)
              .filter((item) => item.id),
          );
        } else if (
          procedureResult?.status === "rejected"
        ) {
          nextWarnings.push(
            procedureResult.reason instanceof Error
              ? procedureResult.reason.message
              : String(procedureResult.reason),
          );
          setProcedures([]);
        }
        setEncounter(nextEncounter);
        setWarnings(
          Array.from(
            new Set(
              nextWarnings.filter(Boolean),
            ),
          ),
        );
        if (silent) {
          if (nextWarnings.length) {
            toast.warning(t.partial);
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
      encounterId,
      t.loadingError,
      t.partial,
      t.refreshed,
    ],
  );
  React.useEffect(() => {
    const controller =
      new AbortController();
    void load({
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [load]);
  const openProcedures = React.useMemo(
    () =>
      procedures.filter(
        (item) =>
          !TERMINAL_PROCEDURE_STATUSES.has(
            item.status,
          ),
      ).length,
    [procedures],
  );
  const printDetail = async () => {
    if (!encounter) {
      return;
    }
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle:
        encounter.number ||
        t.fallbackTitle,
      branchName: displayRelated(
        encounter.branch,
        t.unknown,
      ),
      tableHtml: buildReportHtml(
        encounter,
        diagnoses,
        procedures,
        locale,
      ),
      recordsCount:
        1 +
        diagnoses.length +
        procedures.length,
      logoUrl: "/logo/marilyn.svg",
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  };
  if (loading) {
    return (
      <main className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5">
        <div className="space-y-5">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[126px] rounded-lg"
              />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </main>
    );
  }
  if (error || !encounter) {
    return (
      <main
        dir={rtl ? "rtl" : "ltr"}
        className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5"
      >
        <Card className="rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <Stethoscope className="h-7 w-7" />
            </span>
            <CardTitle>
              {t.loadingError}
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/system/clinical-operations">
                {rtl ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {t.back}
              </Link>
            </Button>
            <Button
              type="button"
              onClick={() => void load()}
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  return (
    <main
      dir={rtl ? "rtl" : "ltr"}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <Badge
              variant="outline"
              className="mb-2 gap-2 rounded-full border-[#cbbda9]/55 bg-white/55 px-3 py-1 text-[#8f6a37] shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a57b3d]" />
              {t.badge}
            </Badge>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {encounter.number ||
                  t.fallbackTitle}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${statusClass(
                  encounter.status,
                )}`}
              >
                {statusLabel(
                  encounter.status,
                  locale,
                )}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className={
                registerOutlineButtonClass
              }
            >
              <Link href="/system/clinical-operations">
                {rtl ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {t.back}
              </Link>
            </Button>            <ClinicalEncounterHeaderActions
              locale={locale}
              encounter={encounter}
              onChanged={() =>
                load({
                  silent: true,
                })
              }
            />
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
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={() =>
                void printDetail()
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>
        {warnings.length ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 shadow-none">
            <CardContent className="p-4 text-sm text-amber-900">
              {t.partial}
              <span className="mt-1 block text-xs opacity-75">
                {warnings.join(" • ")}
              </span>
            </CardContent>
          </Card>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.diagnoses}
            value={diagnoses.length}
            description={t.diagnosesDesc}
            icon={Stethoscope}
          />
          <SystemKpiCard
            title={t.procedures}
            value={procedures.length}
            description={t.proceduresDesc}
            icon={ClipboardList}
          />
          <SystemKpiCard
            title={t.activeProcedures}
            value={openProcedures}
            description={t.activeProceduresDesc}
            icon={Activity}
          />
          <SystemKpiCard
            title={t.encounterStatus}
            value={statusLabel(
              encounter.status,
              locale,
            )}
            description={t.encounterStatusDesc}
            icon={CheckCircle2}
          />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={UserRound}
                title={t.identityTitle}
                description={t.identityDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.number}
                value={encounter.number}
                dir="ltr"
              />
              <DetailField
                label={t.encounterType}
                value={encounter.encounterType}
                dir="ltr"
              />
              <DetailField
                label={t.appointment}
                value={displayRelated(
                  encounter.appointment,
                  t.unknown,
                )}
              />
              <DetailField
                label={t.patient}
                value={displayRelated(
                  encounter.patient,
                  t.unknown,
                )}
              />
              <DetailField
                label={t.practitioner}
                value={displayRelated(
                  encounter.practitioner,
                  t.unknown,
                )}
              />
              <DetailField
                label={t.status}
                value={statusLabel(
                  encounter.status,
                  locale,
                )}
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={MapPin}
                title={t.locationTitle}
                description={t.locationDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <DetailField
                label={t.branch}
                value={displayRelated(
                  encounter.branch,
                  t.unknown,
                )}
              />
              <DetailField
                label={t.department}
                value={displayRelated(
                  encounter.department,
                  t.unknown,
                )}
              />
              <DetailField
                label={t.clinic}
                value={displayRelated(
                  encounter.clinic,
                  t.unknown,
                )}
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={FileText}
                title={t.clinicalTitle}
                description={t.clinicalDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3">
              <DetailField
                label={t.chiefComplaint}
                value={
                  encounter.chiefComplaint ||
                  "—"
                }
              />
              <DetailField
                label={t.history}
                value={
                  encounter.historyOfPresentIllness ||
                  "—"
                }
              />
              <DetailField
                label={t.clinicalNotes}
                value={
                  encounter.clinicalNotes ||
                  "—"
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={ClipboardList}
                title={t.planTitle}
                description={t.planDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3">
              <DetailField
                label={t.treatmentPlan}
                value={
                  encounter.treatmentPlan ||
                  "—"
                }
              />
              <DetailField
                label={t.followUpPlan}
                value={
                  encounter.followUpPlan ||
                  "—"
                }
              />
              <DetailField
                label={t.notes}
                value={
                  encounter.notes ||
                  "—"
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={CalendarClock}
                title={t.timelineTitle}
                description={t.timelineDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DetailField
                label={t.openedAt}
                value={formatDateTime(
                  encounter.openedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.closedAt}
                value={formatDateTime(
                  encounter.closedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.openedBy}
                value={
                  encounter.openedBy ||
                  t.unknown
                }
              />
              <DetailField
                label={t.closedBy}
                value={
                  encounter.closedBy ||
                  t.unknown
                }
              />
              <DetailField
                label={t.createdAt}
                value={formatDateTime(
                  encounter.createdAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.updatedAt}
                value={formatDateTime(
                  encounter.updatedAt,
                  locale,
                )}
                dir="ltr"
              />
            </CardContent>
          </Card>
        </section>
        <Card className="overflow-hidden rounded-lg bg-card shadow-none">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {t.diagnosisRegister}
              </CardTitle>
              <CardDescription className="mt-1">
                {t.diagnosisRegisterDesc}
              </CardDescription>
            </div>
            <ClinicalEncounterRegisterAction
              locale={locale}
              encounterId={encounterId}
              encounterStatus={encounter.status}
              kind="diagnosis"
              onChanged={() =>
                load({
                  silent: true,
                })
              }
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table
                  variant="register"
                  layout="fixed"
                  minWidth="900px"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        {t.diagnosis}
                      </TableHead>
                      <TableHead className="w-[150px]">
                        {t.diagnosisType}
                      </TableHead>
                      <TableHead className="w-[120px]">
                        {t.primary}
                      </TableHead>
                      <TableHead className="w-[170px]">
                        {t.diagnosedAt}
                      </TableHead>
                      <TableHead className="w-[140px]">
                        {t.status}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnoses.length ? (
                      diagnoses.map((item) => (
                        <TableRow
                          key={item.id}
                          role="link"
                          tabIndex={0}
                          className="cursor-pointer hover:bg-muted/35"
                          onClick={() =>
                            openDiagnosisDetails(
                              item,
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              openDiagnosisDetails(
                                item,
                              );
                            }
                          }}
                        >
                          <TableCell>
                            <p className="font-medium">
                              {item.name ||
                                item.code ||
                                t.unknown}
                            </p>
                            <p
                              dir="ltr"
                              className="mt-1 font-mono text-xs text-muted-foreground"
                            >
                              {item.code || "—"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {item.diagnosisType ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            {item.isPrimary
                              ? t.yes
                              : t.no}
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="tabular-nums"
                          >
                            {formatDateTime(
                              item.diagnosedAt,
                              locale,
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-full ${statusClass(
                                item.status,
                              )}`}
                            >
                              {statusLabel(
                                item.status,
                                locale,
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-40 text-center text-muted-foreground"
                        >
                          {t.noDiagnoses}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-lg bg-card shadow-none">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {t.procedureRegister}
              </CardTitle>
              <CardDescription className="mt-1">
                {t.procedureRegisterDesc}
              </CardDescription>
            </div>
            <ClinicalEncounterRegisterAction
              locale={locale}
              encounterId={encounterId}
              encounterStatus={encounter.status}
              kind="procedure"
              onChanged={() =>
                load({
                  silent: true,
                })
              }
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table
                  variant="register"
                  layout="fixed"
                  minWidth="1050px"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        {t.procedure}
                      </TableHead>
                      <TableHead className="w-[120px]">
                        {t.quantity}
                      </TableHead>
                      <TableHead className="w-[150px]">
                        {t.unitPrice}
                      </TableHead>
                      <TableHead className="w-[180px]">
                        {t.performedAt}
                      </TableHead>
                      <TableHead className="w-[140px]">
                        {t.status}
                      </TableHead>
                      <TableHead className="w-[220px]">
                        {t.cancellationReason}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.length ? (
                      procedures.map((item) => (
                        <TableRow
                          key={item.id}
                          role="link"
                          tabIndex={0}
                          className="cursor-pointer hover:bg-muted/35"
                          onClick={() =>
                            openProcedureDetails(
                              item,
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              openProcedureDetails(
                                item,
                              );
                            }
                          }}
                        >
                          <TableCell>
                            <p className="font-medium">
                              {item.name ||
                                item.code ||
                                t.unknown}
                            </p>
                            <p
                              dir="ltr"
                              className="mt-1 font-mono text-xs text-muted-foreground"
                            >
                              {item.code || "—"}
                            </p>
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="tabular-nums"
                          >
                            {item.quantity}
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="tabular-nums"
                          >
                            {item.unitPrice === null
                              ? "—"
                              : formatMoney(
                                  item.unitPrice,
                                )}
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="tabular-nums"
                          >
                            {formatDateTime(
                              item.performedAt,
                              locale,
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-full ${statusClass(
                                item.status,
                              )}`}
                            >
                              {statusLabel(
                                item.status,
                                locale,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.cancellationReason ||
                              "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-40 text-center text-muted-foreground"
                        >
                          {t.noProcedures}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
