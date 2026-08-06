"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hash,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  Sparkles,
  Stethoscope,
  UserRound,
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
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { openPrintReport } from "@/lib/print-report";
import { ClinicalRecordActions } from "@/app/system/clinical-operations/_components/clinical-operation-actions";
type Locale = "ar" | "en";
type RecordKind = "diagnosis" | "procedure";
type ApiRecord = Record<string, unknown>;
type RelatedRecord = {
  id: string;
  code: string;
  name: string;
};
type EncounterSummary = {
  id: string;
  number: string;
  status: string;
  patient: RelatedRecord;
  practitioner: RelatedRecord;
  branch: RelatedRecord;
  department: RelatedRecord;
  clinic: RelatedRecord;
};
type DiagnosisDetail = {
  kind: "diagnosis";
  id: string;
  encounterId: string;
  encounterNumber: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  code: string;
  name: string;
  isPrimary: boolean;
  diagnosedAt: string;
  notes: string;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};
type ProcedureDetail = {
  kind: "procedure";
  id: string;
  encounterId: string;
  encounterNumber: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  catalogItemId: string;
  catalogItemCode: string;
  catalogItemName: string;
  code: string;
  name: string;
  status: string;
  quantity: number;
  unitPrice: number | null;
  performedAt: string;
  cancellationReason: string;
  notes: string;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};
type ClinicalRecordDetail =
  | DiagnosisDetail
  | ProcedureDetail;
type Props = {
  kind: RecordKind;
  encounterId: string;
  recordId: string;
};
const copy = {
  ar: {
    diagnosisBadge: "تفاصيل التشخيص",
    procedureBadge: "تفاصيل الإجراء الطبي",
    diagnosisFallback: "التشخيص الطبي",
    procedureFallback: "الإجراء الطبي",
    diagnosisDescription:
      "عرض التشخيص المرتبط بالزيارة والمريض والممارس وبيانات التدقيق.",
    procedureDescription:
      "عرض الإجراء الطبي وحالته وكميته وتسعيره وارتباطه بالزيارة.",
    back: "العودة إلى الزيارة",
    refresh: "تحديث",
    print: "طباعة",
    retry: "إعادة المحاولة",
    code: "الكود",
    name: "الاسم",
    primary: "تشخيص أساسي",
    secondary: "تشخيص إضافي",
    diagnosedAt: "تاريخ التشخيص",
    status: "الحالة",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    performedAt: "وقت التنفيذ",
    catalogItem: "خدمة الكتالوج",
    encounterContext: "الارتباط السريري",
    encounterContextDescription:
      "الزيارة والمريض والممارس وموقع تقديم الرعاية المرتبط بالسجل.",
    encounter: "الزيارة",
    encounterStatus: "حالة الزيارة",
    patient: "المريض",
    patientNumber: "رقم المريض",
    practitioner: "الممارس",
    branch: "الفرع",
    department: "القسم",
    clinic: "العيادة",
    diagnosisData: "بيانات التشخيص",
    diagnosisDataDescription:
      "كود التشخيص واسمه وتصنيفه داخل الزيارة.",
    procedureData: "بيانات الإجراء",
    procedureDataDescription:
      "بيانات الإجراء والكمية والسعر والحالة التنفيذية.",
    recordId: "معرّف السجل",
    catalogCode: "كود خدمة الكتالوج",
    catalogName: "اسم خدمة الكتالوج",
    cancellationReason: "سبب الإلغاء",
    notesTitle: "الملاحظات",
    notesDescription:
      "الملاحظات المسجلة على السجل الطبي.",
    noNotes: "لا توجد ملاحظات.",
    auditTitle: "بيانات التدقيق",
    auditDescription:
      "معرّفات الإنشاء والتحديث وتوقيتات السجل.",
    createdBy: "أنشئ بواسطة",
    updatedBy: "حُدث بواسطة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    yes: "نعم",
    no: "لا",
    unknown: "غير محدد",
    notPerformed: "لم ينفذ بعد",
    loadingDiagnosisError:
      "تعذر تحميل تفاصيل التشخيص",
    loadingProcedureError:
      "تعذر تحميل تفاصيل الإجراء الطبي",
    refreshedDiagnosis:
      "تم تحديث تفاصيل التشخيص.",
    refreshedProcedure:
      "تم تحديث تفاصيل الإجراء الطبي.",
    printDiagnosisReady:
      "تم تجهيز تقرير التشخيص.",
    printProcedureReady:
      "تم تجهيز تقرير الإجراء الطبي.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    diagnosisReportTitle:
      "تفاصيل التشخيص — Marilyn Clinics",
    procedureReportTitle:
      "تفاصيل الإجراء الطبي — Marilyn Clinics",
    reportField: "البيان",
    reportValue: "القيمة",
  },
  en: {
    diagnosisBadge: "Diagnosis details",
    procedureBadge: "Procedure details",
    diagnosisFallback: "Medical diagnosis",
    procedureFallback: "Medical procedure",
    diagnosisDescription:
      "View the diagnosis, encounter, patient, practitioner, and audit data.",
    procedureDescription:
      "View the medical procedure, status, quantity, pricing, and encounter link.",
    back: "Back to encounter",
    refresh: "Refresh",
    print: "Print",
    retry: "Try again",
    code: "Code",
    name: "Name",
    primary: "Primary diagnosis",
    secondary: "Additional diagnosis",
    diagnosedAt: "Diagnosed at",
    status: "Status",
    quantity: "Quantity",
    unitPrice: "Unit price",
    performedAt: "Performed at",
    catalogItem: "Catalog service",
    encounterContext: "Clinical context",
    encounterContextDescription:
      "Encounter, patient, practitioner, and care location linked to this record.",
    encounter: "Encounter",
    encounterStatus: "Encounter status",
    patient: "Patient",
    patientNumber: "Patient number",
    practitioner: "Practitioner",
    branch: "Branch",
    department: "Department",
    clinic: "Clinic",
    diagnosisData: "Diagnosis data",
    diagnosisDataDescription:
      "Diagnosis code, name, and classification inside the encounter.",
    procedureData: "Procedure data",
    procedureDataDescription:
      "Procedure, quantity, pricing, and execution status.",
    recordId: "Record ID",
    catalogCode: "Catalog service code",
    catalogName: "Catalog service name",
    cancellationReason: "Cancellation reason",
    notesTitle: "Notes",
    notesDescription:
      "Notes recorded on the medical record.",
    noNotes: "No notes.",
    auditTitle: "Audit data",
    auditDescription:
      "Creation and update identifiers and timestamps.",
    createdBy: "Created by",
    updatedBy: "Updated by",
    createdAt: "Created at",
    updatedAt: "Updated at",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    notPerformed: "Not performed yet",
    loadingDiagnosisError:
      "Could not load diagnosis details",
    loadingProcedureError:
      "Could not load procedure details",
    refreshedDiagnosis:
      "Diagnosis details refreshed.",
    refreshedProcedure:
      "Procedure details refreshed.",
    printDiagnosisReady:
      "Diagnosis report prepared.",
    printProcedureReady:
      "Procedure report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    diagnosisReportTitle:
      "Diagnosis Details — Marilyn Clinics",
    procedureReportTitle:
      "Medical Procedure Details — Marilyn Clinics",
    reportField: "Field",
    reportValue: "Value",
  },
} as const;
const STATUS_LABELS: Record<
  Locale,
  Record<string, string>
> = {
  ar: {
    DRAFT: "مسودة",
    OPEN: "مفتوح",
    PLANNED: "مخطط",
    PENDING: "معلق",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    CANCELED: "ملغي",
    ACTIVE: "نشط",
  },
  en: {
    DRAFT: "Draft",
    OPEN: "Open",
    PLANNED: "Planned",
    PENDING: "Pending",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    ACTIVE: "Active",
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
function numberValue(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}
function boolValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes"].includes(
    text(value).toLowerCase(),
  );
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
        source.practitioner_number,
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
): EncounterSummary {
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  return {
    id: text(source.id || source.pk),
    number: text(
      source.encounter_number ||
        source.number,
    ),
    status: text(
      source.status,
    ).toUpperCase(),
    patient: normalizeRelated(
      source.patient,
    ),
    practitioner: normalizeRelated(
      source.practitioner,
    ),
    branch: normalizeRelated(
      source.branch,
    ),
    department: normalizeRelated(
      source.department,
    ),
    clinic: normalizeRelated(
      source.clinic,
    ),
  };
}
function normalizeDiagnosis(
  payload: unknown,
): DiagnosisDetail {
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  return {
    kind: "diagnosis",
    id: text(source.id || source.pk),
    encounterId: text(source.encounter_id),
    encounterNumber: text(
      source.encounter_number,
    ),
    patientId: text(source.patient_id),
    patientNumber: text(
      source.patient_number,
    ),
    patientName: text(
      source.patient_name,
    ),
    practitionerId: text(
      source.practitioner_id,
    ),
    practitionerName: text(
      source.practitioner_name,
    ),
    code: text(source.diagnosis_code),
    name: text(source.diagnosis_name),
    isPrimary: boolValue(
      source.is_primary,
    ),
    diagnosedAt: text(
      source.diagnosed_at,
    ),
    notes: text(source.notes),
    createdById: text(
      source.created_by_id,
    ),
    updatedById: text(
      source.updated_by_id,
    ),
    createdAt: text(source.created_at),
    updatedAt: text(source.updated_at),
  };
}
function normalizeProcedure(
  payload: unknown,
): ProcedureDetail {
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  const unitPrice =
    source.unit_price_snapshot === null ||
    source.unit_price_snapshot ===
      undefined ||
    source.unit_price_snapshot === ""
      ? null
      : numberValue(
          source.unit_price_snapshot,
        );
  return {
    kind: "procedure",
    id: text(source.id || source.pk),
    encounterId: text(source.encounter_id),
    encounterNumber: text(
      source.encounter_number,
    ),
    patientId: text(source.patient_id),
    patientNumber: text(
      source.patient_number,
    ),
    patientName: text(
      source.patient_name,
    ),
    practitionerId: text(
      source.practitioner_id,
    ),
    practitionerName: text(
      source.practitioner_name,
    ),
    catalogItemId: text(
      source.catalog_item_id,
    ),
    catalogItemCode: text(
      source.catalog_item_code,
    ),
    catalogItemName: text(
      source.catalog_item_name,
    ),
    code: text(
      source.procedure_code_snapshot,
    ),
    name: text(
      source.procedure_name_snapshot,
    ),
    status: text(
      source.status,
      "PLANNED",
    ).toUpperCase(),
    quantity: numberValue(
      source.quantity,
      1,
    ),
    unitPrice,
    performedAt: text(
      source.performed_at,
    ),
    cancellationReason: text(
      source.cancellation_reason,
    ),
    notes: text(source.notes),
    createdById: text(
      source.created_by_id,
    ),
    updatedById: text(
      source.updated_by_id,
    ),
    createdAt: text(source.created_at),
    updatedAt: text(source.updated_at),
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
function formatDate(
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
    },
  ).format(parsed);
}
function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}
function statusLabel(
  status: string,
  locale: Locale,
) {
  return (
    STATUS_LABELS[locale][status] ||
    status.replaceAll("_", " ") ||
    "—"
  );
}
function statusClass(status: string) {
  if (
    ["COMPLETED", "ACTIVE"].includes(
      status,
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    ["CANCELLED", "CANCELED"].includes(
      status,
    )
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "IN_PROGRESS") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function MoneyValue({
  value,
}: {
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold tabular-nums">
      <span lang="en">
        {formatMoney(value)}
      </span>
      <Image
        src="/currency/sar.svg"
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        className="size-4 shrink-0"
      />
    </span>
  );
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
function buildReportHtml(
  item: ClinicalRecordDetail,
  encounter: EncounterSummary,
  locale: Locale,
) {
  const t = copy[locale];
  const sharedRows: Array<
    [string, string]
  > = [
    [
      t.recordId,
      item.id || "—",
    ],
    [
      t.encounter,
      item.encounterNumber ||
        encounter.number ||
        "—",
    ],
    [
      t.encounterStatus,
      statusLabel(
        encounter.status,
        locale,
      ),
    ],
    [
      t.patient,
      item.patientName ||
        displayRelated(
          encounter.patient,
          t.unknown,
        ),
    ],
    [
      t.patientNumber,
      item.patientNumber ||
        encounter.patient.code ||
        "—",
    ],
    [
      t.practitioner,
      item.practitionerName ||
        displayRelated(
          encounter.practitioner,
          t.unknown,
        ),
    ],
  ];
  const specificRows: Array<
    [string, string]
  > =
    item.kind === "diagnosis"
      ? [
          [t.code, item.code || "—"],
          [t.name, item.name || "—"],
          [
            t.primary,
            item.isPrimary
              ? t.yes
              : t.no,
          ],
          [
            t.diagnosedAt,
            formatDateTime(
              item.diagnosedAt,
              locale,
            ),
          ],
          [
            t.notesTitle,
            item.notes || t.noNotes,
          ],
        ]
      : [
          [t.code, item.code || "—"],
          [t.name, item.name || "—"],
          [
            t.catalogCode,
            item.catalogItemCode || "—",
          ],
          [
            t.catalogName,
            item.catalogItemName || "—",
          ],
          [
            t.quantity,
            String(item.quantity),
          ],
          [
            t.unitPrice,
            item.unitPrice === null
              ? "—"
              : formatMoney(
                  item.unitPrice,
                ),
          ],
          [
            t.status,
            statusLabel(
              item.status,
              locale,
            ),
          ],
          [
            t.performedAt,
            formatDateTime(
              item.performedAt,
              locale,
            ),
          ],
          [
            t.cancellationReason,
            item.cancellationReason ||
              "—",
          ],
          [
            t.notesTitle,
            item.notes || t.noNotes,
          ],
        ];
  const auditRows: Array<
    [string, string]
  > = [
    [
      t.createdBy,
      item.createdById || "—",
    ],
    [
      t.updatedBy,
      item.updatedById || "—",
    ],
    [
      t.createdAt,
      formatDateTime(
        item.createdAt,
        locale,
      ),
    ],
    [
      t.updatedAt,
      formatDateTime(
        item.updatedAt,
        locale,
      ),
    ],
  ];
  const rows = [
    ...sharedRows,
    ...specificRows,
    ...auditRows,
  ];
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(
            t.reportField,
          )}</th>
          <th>${escapeHtml(
            t.reportValue,
          )}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td>${escapeHtml(
                  label,
                )}</td>
                <td>${escapeHtml(
                  value,
                )}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}
export function ClinicalRecordDetailClient({
  kind,
  encounterId,
  recordId,
}: Props) {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [encounter, setEncounter] =
    React.useState<
      EncounterSummary | null
    >(null);
  const [item, setItem] =
    React.useState<
      ClinicalRecordDetail | null
    >(null);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const t = copy[locale];
  const rtl = locale === "ar";
  const loadingError =
    kind === "diagnosis"
      ? t.loadingDiagnosisError
      : t.loadingProcedureError;
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
      const encodedEncounterId =
        encodeURIComponent(encounterId);
      const encodedRecordId =
        encodeURIComponent(recordId);
      const recordPath =
        kind === "diagnosis"
          ? `/api/company/medical/encounters/${encodedEncounterId}/diagnoses/${encodedRecordId}/`
          : `/api/company/medical/encounters/${encodedEncounterId}/procedures/${encodedRecordId}/`;
      try {
        const [
          encounterPayload,
          recordPayload,
        ] = await Promise.all([
          apiRequest(
            `/api/company/medical/encounters/${encodedEncounterId}/`,
            signal,
          ),
          apiRequest(
            recordPath,
            signal,
          ),
        ]);
        if (signal?.aborted) {
          return;
        }
        const nextEncounter =
          normalizeEncounter(
            encounterPayload,
          );
        const nextItem =
          kind === "diagnosis"
            ? normalizeDiagnosis(
                recordPayload,
              )
            : normalizeProcedure(
                recordPayload,
              );
        if (
          !nextEncounter.id ||
          !nextItem.id
        ) {
          throw new Error(
            "Invalid clinical record response.",
          );
        }
        setEncounter(nextEncounter);
        setItem(nextItem);
        if (silent) {
          toast.success(
            kind === "diagnosis"
              ? t.refreshedDiagnosis
              : t.refreshedProcedure,
          );
        }
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }
        const message =
          caught instanceof Error
            ? caught.message
            : loadingError;
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
      kind,
      loadingError,
      recordId,
      t.refreshedDiagnosis,
      t.refreshedProcedure,
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
  const printDetail = async () => {
    if (!item || !encounter) {
      return;
    }
    const opened =
      await openPrintReport({
        locale,
        title:
          item.kind === "diagnosis"
            ? t.diagnosisReportTitle
            : t.procedureReportTitle,
        subtitle:
          item.name ||
          item.code ||
          (
            item.kind === "diagnosis"
              ? t.diagnosisFallback
              : t.procedureFallback
          ),
        branchName: displayRelated(
          encounter.branch,
          t.unknown,
        ),
        tableHtml: buildReportHtml(
          item,
          encounter,
          locale,
        ),
        recordsCount: 1,
        logoUrl:
          "/logo/marilyn.svg",
      });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(
      item.kind === "diagnosis"
        ? t.printDiagnosisReady
        : t.printProcedureReady,
    );
  };
  if (loading) {
    return (
      <main
        dir={rtl ? "rtl" : "ltr"}
        className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5"
      >
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
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        </div>
      </main>
    );
  }
  if (
    error ||
    !item ||
    !encounter
  ) {
    return (
      <main
        dir={rtl ? "rtl" : "ltr"}
        className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5"
      >
        <Card className="rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              {kind === "diagnosis" ? (
                <Stethoscope className="h-7 w-7" />
              ) : (
                <ClipboardCheck className="h-7 w-7" />
              )}
            </span>
            <CardTitle>
              {loadingError}
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-2">
            <Button
              asChild
              variant="outline"
            >
              <Link
                href={`/system/clinical-operations/encounters/${encodeURIComponent(
                  encounterId,
                )}`}
              >
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
              onClick={() =>
                void load()
              }
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  const title =
    item.name ||
    item.code ||
    (
      item.kind === "diagnosis"
        ? t.diagnosisFallback
        : t.procedureFallback
    );
  const recordStatus =
    item.kind === "diagnosis"
      ? (
          item.isPrimary
            ? t.primary
            : t.secondary
        )
      : statusLabel(
          item.status,
          locale,
        );
  const recordStatusClass =
    item.kind === "diagnosis"
      ? (
          item.isPrimary
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-700"
        )
      : statusClass(item.status);
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
              {item.kind === "diagnosis"
                ? t.diagnosisBadge
                : t.procedureBadge}
            </Badge>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {title}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${recordStatusClass}`}
              >
                {recordStatus}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {item.kind === "diagnosis"
                ? t.diagnosisDescription
                : t.procedureDescription}
            </p>
            <p
              dir="ltr"
              lang="en"
              className="mt-2 font-mono text-xs text-muted-foreground"
            >
              {item.code || item.id}
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
              <Link
                href={`/system/clinical-operations/encounters/${encodeURIComponent(
                  encounterId,
                )}`}
              >
                {rtl ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {t.back}
              </Link>
            </Button>            <ClinicalRecordActions
              locale={locale}
              encounterId={encounterId}
              encounterStatus={encounter.status}
              record={item}
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
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {item.kind === "diagnosis" ? (
            <>
              <SystemKpiCard
                title={t.code}
                value={item.code || "—"}
                description={
                  item.name || t.unknown
                }
                icon={Hash}
              />
              <SystemKpiCard
                title={t.primary}
                value={
                  item.isPrimary
                    ? t.yes
                    : t.no
                }
                description={
                  item.isPrimary
                    ? t.primary
                    : t.secondary
                }
                icon={CheckCircle2}
              />
              <SystemKpiCard
                title={t.diagnosedAt}
                value={formatDate(
                  item.diagnosedAt,
                  locale,
                )}
                description={
                  item.encounterNumber ||
                  encounter.number
                }
                icon={CalendarClock}
              />
              <SystemKpiCard
                title={t.encounterStatus}
                value={statusLabel(
                  encounter.status,
                  locale,
                )}
                description={
                  encounter.number
                }
                icon={Activity}
              />
            </>
          ) : (
            <>
              <SystemKpiCard
                title={t.quantity}
                value={item.quantity}
                description={
                  item.code || t.unknown
                }
                icon={Hash}
              />
              <SystemKpiCard
                title={t.status}
                value={statusLabel(
                  item.status,
                  locale,
                )}
                description={
                  item.name || t.unknown
                }
                icon={ClipboardCheck}
              />
              <SystemKpiCard
                title={t.performedAt}
                value={
                  item.performedAt
                    ? formatDate(
                        item.performedAt,
                        locale,
                      )
                    : t.notPerformed
                }
                description={
                  item.encounterNumber ||
                  encounter.number
                }
                icon={CalendarClock}
              />
              <SystemKpiCard
                title={t.encounterStatus}
                value={statusLabel(
                  encounter.status,
                  locale,
                )}
                description={
                  encounter.number
                }
                icon={Activity}
              />
            </>
          )}
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={UserRound}
                title={
                  t.encounterContext
                }
                description={
                  t.encounterContextDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.encounter}
                value={
                  item.encounterNumber ||
                  encounter.number
                }
                dir="ltr"
              />
              <DetailField
                label={t.encounterStatus}
                value={statusLabel(
                  encounter.status,
                  locale,
                )}
              />
              <DetailField
                label={t.patient}
                value={
                  item.patientName ||
                  displayRelated(
                    encounter.patient,
                    t.unknown,
                  )
                }
              />
              <DetailField
                label={t.patientNumber}
                value={
                  item.patientNumber ||
                  encounter.patient.code ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.practitioner}
                value={
                  item.practitionerName ||
                  displayRelated(
                    encounter.practitioner,
                    t.unknown,
                  )
                }
              />
              <DetailField
                label={t.recordId}
                value={item.id}
                dir="ltr"
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={MapPin}
                title={t.branch}
                description={
                  t.encounterContextDescription
                }
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
                icon={
                  item.kind === "diagnosis"
                    ? Stethoscope
                    : ClipboardCheck
                }
                title={
                  item.kind === "diagnosis"
                    ? t.diagnosisData
                    : t.procedureData
                }
                description={
                  item.kind === "diagnosis"
                    ? t.diagnosisDataDescription
                    : t.procedureDataDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailField
                label={t.code}
                value={item.code}
                dir="ltr"
              />
              <DetailField
                label={t.name}
                value={item.name}
              />
              {item.kind === "diagnosis" ? (
                <>
                  <DetailField
                    label={t.primary}
                    value={
                      item.isPrimary
                        ? t.yes
                        : t.no
                    }
                  />
                  <DetailField
                    label={t.diagnosedAt}
                    value={formatDateTime(
                      item.diagnosedAt,
                      locale,
                    )}
                    dir="ltr"
                  />
                </>
              ) : (
                <>
                  <DetailField
                    label={t.status}
                    value={statusLabel(
                      item.status,
                      locale,
                    )}
                  />
                  <DetailField
                    label={t.quantity}
                    value={String(
                      item.quantity,
                    )}
                    dir="ltr"
                  />
                  <DetailField
                    label={t.unitPrice}
                    value={
                      item.unitPrice === null
                        ? "—"
                        : (
                          <MoneyValue
                            value={
                              item.unitPrice
                            }
                          />
                        )
                    }
                  />
                  <DetailField
                    label={t.performedAt}
                    value={
                      item.performedAt
                        ? formatDateTime(
                            item.performedAt,
                            locale,
                          )
                        : t.notPerformed
                    }
                    dir="ltr"
                  />
                  <DetailField
                    label={t.catalogCode}
                    value={
                      item.catalogItemCode ||
                      "—"
                    }
                    dir="ltr"
                  />
                  <DetailField
                    label={t.catalogName}
                    value={
                      item.catalogItemName ||
                      "—"
                    }
                  />
                  <DetailField
                    label={
                      t.cancellationReason
                    }
                    value={
                      item.cancellationReason ||
                      "—"
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={FileText}
                title={t.notesTitle}
                description={
                  t.notesDescription
                }
              />
            </CardHeader>
            <CardContent>
              <DetailField
                label={t.notesTitle}
                value={
                  item.notes ||
                  t.noNotes
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={WalletCards}
                title={t.auditTitle}
                description={
                  t.auditDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.createdBy}
                value={
                  item.createdById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.updatedBy}
                value={
                  item.updatedById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.createdAt}
                value={formatDateTime(
                  item.createdAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.updatedAt}
                value={formatDateTime(
                  item.updatedAt,
                  locale,
                )}
                dir="ltr"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
