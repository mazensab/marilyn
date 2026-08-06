"use client";
/*
 * MARILYN CLINICAL REFERRAL DETAIL
 * Live medical referral and record-access detail page.
 */
import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileText,
  Link2,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Stethoscope,
  UserRound,
  Waypoints,
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
import {
  ClinicalRecordAccessActions,
  ClinicalReferralActions,
} from "@/app/system/clinical-operations/_components/clinical-referral-actions";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type ReferralDetail = {
  id: string;
  number: string;
  sourceEncounterId: string;
  sourceEncounterNumber: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  referringPractitionerId: string;
  referringPractitionerName: string;
  receivingPractitionerId: string;
  receivingPractitionerName: string;
  targetBranchId: string;
  targetBranchName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetClinicId: string;
  targetClinicName: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  referralReason: string;
  clinicalSummary: string;
  requestedService: string;
  referredAt: string;
  sentAt: string;
  acceptedAt: string;
  rejectedAt: string;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  expiresAt: string;
  acceptedById: string;
  rejectedById: string;
  completedById: string;
  cancelledById: string;
  rejectionReason: string;
  cancellationReason: string;
  notes: string;
  isTerminal: boolean;
  allowsRecordAccess: boolean;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};
type RecordAccessDetail = {
  id: string;
  referralId: string;
  referralNumber: string;
  referralStatus: string;
  referralAllowsRecordAccess: boolean;
  patientId: string;
  patientNumber: string;
  patientName: string;
  receivingPractitionerId: string;
  receivingPractitionerName: string;
  scope: string;
  status: string;
  sharedSections: string[];
  accessStartsAt: string;
  accessEndsAt: string;
  isEffective: boolean;
  grantedById: string;
  grantedAt: string;
  acceptedById: string;
  acceptedAt: string;
  rejectedById: string;
  rejectedAt: string;
  rejectionReason: string;
  revokedById: string;
  revokedAt: string;
  revocationReason: string;
  notes: string;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};
type Props = {
  referralId: string;
};
const copy = {
  ar: {
    badge: "تفاصيل الإحالة الطبية",
    fallbackTitle: "الإحالة الطبية",
    description:
      "عرض مصدر الإحالة ووجهتها وملخصها السريري وحالتها وصلاحية الوصول إلى السجل الطبي.",
    back: "العودة إلى التشغيل الطبي",
    refresh: "تحديث",
    print: "طباعة",
    retry: "إعادة المحاولة",
    priority: "الأولوية",
    status: "حالة الإحالة",
    recordAccess: "صلاحية السجل",
    recordAccessAllowed: "السماح بالوصول",
    effective: "فعالة",
    notEffective: "غير فعالة",
    notCreated: "لم تُنشأ",
    allowed: "مسموح",
    notAllowed: "غير مسموح",
    referralContext: "بيانات الإحالة",
    referralContextDescription:
      "رقم الإحالة والزيارة المصدر والمريض والممارسون.",
    referralNumber: "رقم الإحالة",
    sourceEncounter: "الزيارة المصدر",
    patient: "المريض",
    patientNumber: "رقم المريض",
    referringPractitioner: "الممارس المحيل",
    receivingPractitioner: "الممارس المستقبِل",
    recordId: "معرّف السجل",
    destinationTitle: "وجهة الإحالة",
    destinationDescription:
      "الفرع والقسم والعيادة المستهدفة لاستكمال الرعاية.",
    targetBranch: "الفرع المستهدف",
    targetDepartment: "القسم المستهدف",
    targetClinic: "العيادة المستهدفة",
    clinicalTitle: "المحتوى السريري",
    clinicalDescription:
      "سبب الإحالة والملخص السريري والخدمة المطلوبة والملاحظات.",
    referralReason: "سبب الإحالة",
    clinicalSummary: "الملخص السريري",
    requestedService: "الخدمة المطلوبة",
    notes: "الملاحظات",
    noNotes: "لا توجد ملاحظات.",
    timelineTitle: "الخط الزمني للإحالة",
    timelineDescription:
      "توقيتات الإرسال والقبول والبدء والإكمال أو الإلغاء والانتهاء.",
    referredAt: "تاريخ الإحالة",
    sentAt: "تاريخ الإرسال",
    acceptedAt: "تاريخ القبول",
    startedAt: "تاريخ البدء",
    completedAt: "تاريخ الإكمال",
    rejectedAt: "تاريخ الرفض",
    cancelledAt: "تاريخ الإلغاء",
    expiresAt: "تاريخ الانتهاء",
    rejectionReason: "سبب الرفض",
    cancellationReason: "سبب الإلغاء",
    accessTitle: "صلاحية الوصول إلى السجل الطبي",
    accessDescription:
      "نطاق المشاركة والأقسام المشتركة وفترة الصلاحية وحالتها التشغيلية.",
    accessEmptyTitle:
      "لم تُنشأ صلاحية وصول لهذه الإحالة",
    accessEmptyDescription:
      "ستظهر بيانات النطاق والأقسام والتوقيتات هنا عند إنشاء صلاحية الوصول.",
    accessStatus: "حالة الصلاحية",
    scope: "نطاق المشاركة",
    sharedSections: "الأقسام المشتركة",
    accessStartsAt: "بداية الصلاحية",
    accessEndsAt: "نهاية الصلاحية",
    grantedAt: "تاريخ المنح",
    acceptedAccessAt: "تاريخ قبول الصلاحية",
    rejectedAccessAt: "تاريخ رفض الصلاحية",
    revokedAt: "تاريخ السحب",
    accessRejectionReason: "سبب رفض الصلاحية",
    revocationReason: "سبب سحب الصلاحية",
    noSharedSections: "لا توجد أقسام مشتركة.",
    auditTitle: "بيانات التدقيق",
    auditDescription:
      "معرّفات الإنشاء والتحديث والتعامل مع الإحالة والصلاحية.",
    createdBy: "أنشئ بواسطة",
    updatedBy: "حُدث بواسطة",
    acceptedBy: "قُبل بواسطة",
    rejectedBy: "رُفض بواسطة",
    completedBy: "أُكمل بواسطة",
    cancelledBy: "أُلغي بواسطة",
    grantedBy: "مُنح بواسطة",
    revokedBy: "سُحب بواسطة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    yes: "نعم",
    no: "لا",
    unknown: "غير محدد",
    loadingError: "تعذر تحميل تفاصيل الإحالة الطبية",
    refreshed: "تم تحديث تفاصيل الإحالة الطبية.",
    printReady: "تم تجهيز تقرير الإحالة الطبية.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تفاصيل الإحالة الطبية — Marilyn Clinics",
    reportField: "البيان",
    reportValue: "القيمة",
  },
  en: {
    badge: "Medical referral details",
    fallbackTitle: "Medical referral",
    description:
      "View the referral source, destination, clinical summary, status, and medical-record access.",
    back: "Back to clinical operations",
    refresh: "Refresh",
    print: "Print",
    retry: "Try again",
    priority: "Priority",
    status: "Referral status",
    recordAccess: "Record access",
    recordAccessAllowed: "Access allowed",
    effective: "Effective",
    notEffective: "Not effective",
    notCreated: "Not created",
    allowed: "Allowed",
    notAllowed: "Not allowed",
    referralContext: "Referral information",
    referralContextDescription:
      "Referral number, source encounter, patient, and practitioners.",
    referralNumber: "Referral number",
    sourceEncounter: "Source encounter",
    patient: "Patient",
    patientNumber: "Patient number",
    referringPractitioner: "Referring practitioner",
    receivingPractitioner: "Receiving practitioner",
    recordId: "Record ID",
    destinationTitle: "Referral destination",
    destinationDescription:
      "Target branch, department, and clinic for continuing care.",
    targetBranch: "Target branch",
    targetDepartment: "Target department",
    targetClinic: "Target clinic",
    clinicalTitle: "Clinical content",
    clinicalDescription:
      "Referral reason, clinical summary, requested service, and notes.",
    referralReason: "Referral reason",
    clinicalSummary: "Clinical summary",
    requestedService: "Requested service",
    notes: "Notes",
    noNotes: "No notes.",
    timelineTitle: "Referral timeline",
    timelineDescription:
      "Referral, sending, acceptance, progress, completion, cancellation, and expiry times.",
    referredAt: "Referred at",
    sentAt: "Sent at",
    acceptedAt: "Accepted at",
    startedAt: "Started at",
    completedAt: "Completed at",
    rejectedAt: "Rejected at",
    cancelledAt: "Cancelled at",
    expiresAt: "Expires at",
    rejectionReason: "Rejection reason",
    cancellationReason: "Cancellation reason",
    accessTitle: "Medical-record access",
    accessDescription:
      "Sharing scope, shared sections, validity period, and operational status.",
    accessEmptyTitle:
      "No record access exists for this referral",
    accessEmptyDescription:
      "Scope, sections, and access timing will appear here when access is created.",
    accessStatus: "Access status",
    scope: "Sharing scope",
    sharedSections: "Shared sections",
    accessStartsAt: "Access starts at",
    accessEndsAt: "Access ends at",
    grantedAt: "Granted at",
    acceptedAccessAt: "Access accepted at",
    rejectedAccessAt: "Access rejected at",
    revokedAt: "Revoked at",
    accessRejectionReason: "Access rejection reason",
    revocationReason: "Revocation reason",
    noSharedSections: "No shared sections.",
    auditTitle: "Audit data",
    auditDescription:
      "Creation, update, referral handling, and access actor identifiers.",
    createdBy: "Created by",
    updatedBy: "Updated by",
    acceptedBy: "Accepted by",
    rejectedBy: "Rejected by",
    completedBy: "Completed by",
    cancelledBy: "Cancelled by",
    grantedBy: "Granted by",
    revokedBy: "Revoked by",
    createdAt: "Created at",
    updatedAt: "Updated at",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    loadingError: "Could not load medical referral details",
    refreshed: "Medical referral details refreshed.",
    printReady: "Referral report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Medical Referral Details — Marilyn Clinics",
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
    SENT: "مرسلة",
    ACCEPTED: "مقبولة",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتملة",
    REJECTED: "مرفوضة",
    CANCELLED: "ملغاة",
    CANCELED: "ملغاة",
    EXPIRED: "منتهية",
    PENDING: "معلقة",
    ACTIVE: "فعالة",
    REVOKED: "مسحوبة",
  },
  en: {
    DRAFT: "Draft",
    SENT: "Sent",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    EXPIRED: "Expired",
    PENDING: "Pending",
    ACTIVE: "Active",
    REVOKED: "Revoked",
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
function boolValue(
  value: unknown,
  fallback = false,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  const normalized = text(
    value,
  ).toLowerCase();
  if (
    ["1", "true", "yes"].includes(
      normalized,
    )
  ) {
    return true;
  }
  if (
    ["0", "false", "no"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return fallback;
}
function stringList(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) =>
      text(item).toUpperCase(),
    )
    .filter(Boolean);
}
function normalizeReferral(
  payload: unknown,
): ReferralDetail {
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
      source.referral_number,
    ),
    sourceEncounterId: text(
      source.source_encounter_id,
    ),
    sourceEncounterNumber: text(
      source.source_encounter_number,
    ),
    patientId: text(source.patient_id),
    patientNumber: text(
      source.patient_number,
    ),
    patientName: text(
      source.patient_name,
    ),
    referringPractitionerId: text(
      source.referring_practitioner_id,
    ),
    referringPractitionerName: text(
      source.referring_practitioner_name,
    ),
    receivingPractitionerId: text(
      source.receiving_practitioner_id,
    ),
    receivingPractitionerName: text(
      source.receiving_practitioner_name,
    ),
    targetBranchId: text(
      source.target_branch_id,
    ),
    targetBranchName: text(
      source.target_branch_name,
    ),
    targetDepartmentId: text(
      source.target_department_id,
    ),
    targetDepartmentName: text(
      source.target_department_name,
    ),
    targetClinicId: text(
      source.target_clinic_id,
    ),
    targetClinicName: text(
      source.target_clinic_name,
    ),
    priority: text(
      source.priority,
    ).toUpperCase(),
    priorityLabel: text(
      source.priority_label,
    ),
    status: text(
      source.status,
    ).toUpperCase(),
    statusLabel: text(
      source.status_label,
    ),
    referralReason: text(
      source.referral_reason,
    ),
    clinicalSummary: text(
      source.clinical_summary,
    ),
    requestedService: text(
      source.requested_service,
    ),
    referredAt: text(source.referred_at),
    sentAt: text(source.sent_at),
    acceptedAt: text(source.accepted_at),
    rejectedAt: text(source.rejected_at),
    startedAt: text(source.started_at),
    completedAt: text(
      source.completed_at,
    ),
    cancelledAt: text(
      source.cancelled_at,
    ),
    expiresAt: text(source.expires_at),
    acceptedById: text(
      source.accepted_by_id,
    ),
    rejectedById: text(
      source.rejected_by_id,
    ),
    completedById: text(
      source.completed_by_id,
    ),
    cancelledById: text(
      source.cancelled_by_id,
    ),
    rejectionReason: text(
      source.rejection_reason,
    ),
    cancellationReason: text(
      source.cancellation_reason,
    ),
    notes: text(source.notes),
    isTerminal: boolValue(
      source.is_terminal,
    ),
    allowsRecordAccess: boolValue(
      source.allows_record_access,
    ),
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
function normalizeRecordAccess(
  payload: unknown,
): RecordAccessDetail | null {
  if (payload === null) {
    return null;
  }
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  const id = text(source.id || source.pk);
  if (!id) {
    return null;
  }
  return {
    id,
    referralId: text(
      source.referral_id,
    ),
    referralNumber: text(
      source.referral_number,
    ),
    referralStatus: text(
      source.referral_status,
    ).toUpperCase(),
    referralAllowsRecordAccess:
      boolValue(
        source.referral_allows_record_access,
      ),
    patientId: text(source.patient_id),
    patientNumber: text(
      source.patient_number,
    ),
    patientName: text(
      source.patient_name,
    ),
    receivingPractitionerId: text(
      source.receiving_practitioner_id,
    ),
    receivingPractitionerName: text(
      source.receiving_practitioner_name,
    ),
    scope: text(
      source.scope,
    ).toUpperCase(),
    status: text(
      source.status,
    ).toUpperCase(),
    sharedSections: stringList(
      source.shared_sections,
    ),
    accessStartsAt: text(
      source.access_starts_at,
    ),
    accessEndsAt: text(
      source.access_ends_at,
    ),
    isEffective: boolValue(
      source.is_effective,
    ),
    grantedById: text(
      source.granted_by_id,
    ),
    grantedAt: text(
      source.granted_at,
    ),
    acceptedById: text(
      source.accepted_by_id,
    ),
    acceptedAt: text(
      source.accepted_at,
    ),
    rejectedById: text(
      source.rejected_by_id,
    ),
    rejectedAt: text(
      source.rejected_at,
    ),
    rejectionReason: text(
      source.rejection_reason,
    ),
    revokedById: text(
      source.revoked_by_id,
    ),
    revokedAt: text(
      source.revoked_at,
    ),
    revocationReason: text(
      source.revocation_reason,
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
  allowNotFound = false,
): Promise<unknown | null> {
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
  if (
    allowNotFound &&
    response.status === 404
  ) {
    return null;
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
function humanize(value: string) {
  if (!value) {
    return "—";
  }
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}
function statusLabel(
  value: string,
  locale: Locale,
) {
  return (
    STATUS_LABELS[locale][value] ||
    humanize(value)
  );
}
function priorityLabel(
  item: ReferralDetail,
  locale: Locale,
) {
  return (
    PRIORITY_LABELS[locale][
      item.priority
    ] ||
    item.priorityLabel ||
    humanize(item.priority)
  );
}
function statusClass(value: string) {
  if (
    ["ACTIVE", "ACCEPTED", "COMPLETED"].includes(
      value,
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "REJECTED",
      "REVOKED",
      "CANCELLED",
      "CANCELED",
      "EXPIRED",
    ].includes(value)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (value === "IN_PROGRESS") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function priorityClass(value: string) {
  if (
    ["URGENT", "EMERGENCY"].includes(
      value,
    )
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (value === "HIGH") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (
    ["LOW", "ROUTINE"].includes(value)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  referral: ReferralDetail,
  access: RecordAccessDetail | null,
  locale: Locale,
) {
  const t = copy[locale];
  const rows: Array<
    [string, string]
  > = [
    [
      t.referralNumber,
      referral.number || "—",
    ],
    [
      t.sourceEncounter,
      referral.sourceEncounterNumber ||
        "—",
    ],
    [
      t.patient,
      referral.patientName || t.unknown,
    ],
    [
      t.patientNumber,
      referral.patientNumber || "—",
    ],
    [
      t.referringPractitioner,
      referral.referringPractitionerName ||
        t.unknown,
    ],
    [
      t.receivingPractitioner,
      referral.receivingPractitionerName ||
        t.unknown,
    ],
    [
      t.priority,
      priorityLabel(
        referral,
        locale,
      ),
    ],
    [
      t.status,
      statusLabel(
        referral.status,
        locale,
      ),
    ],
    [
      t.targetBranch,
      referral.targetBranchName ||
        t.unknown,
    ],
    [
      t.targetDepartment,
      referral.targetDepartmentName ||
        t.unknown,
    ],
    [
      t.targetClinic,
      referral.targetClinicName ||
        t.unknown,
    ],
    [
      t.referralReason,
      referral.referralReason || "—",
    ],
    [
      t.clinicalSummary,
      referral.clinicalSummary || "—",
    ],
    [
      t.requestedService,
      referral.requestedService || "—",
    ],
    [
      t.referredAt,
      formatDateTime(
        referral.referredAt,
        locale,
      ),
    ],
    [
      t.recordAccess,
      access
        ? statusLabel(
            access.status,
            locale,
          )
        : t.notCreated,
    ],
    [
      t.scope,
      access
        ? humanize(access.scope)
        : "—",
    ],
    [
      t.sharedSections,
      access?.sharedSections.length
        ? access.sharedSections
            .map(humanize)
            .join(", ")
        : "—",
    ],
    [
      t.accessStartsAt,
      access
        ? formatDateTime(
            access.accessStartsAt,
            locale,
          )
        : "—",
    ],
    [
      t.accessEndsAt,
      access
        ? formatDateTime(
            access.accessEndsAt,
            locale,
          )
        : "—",
    ],
    [
      t.notes,
      referral.notes || t.noNotes,
    ],
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
export function ClinicalReferralDetailClient({
  referralId,
}: Props) {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [referral, setReferral] =
    React.useState<ReferralDetail | null>(
      null,
    );
  const [access, setAccess] =
    React.useState<RecordAccessDetail | null>(
      null,
    );
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const t = copy[locale];
  const rtl = locale === "ar";
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
      const encodedReferralId =
        encodeURIComponent(referralId);
      try {
        const [
          referralPayload,
          accessPayload,
        ] = await Promise.all([
          apiRequest(
            `/api/company/medical/referrals/${encodedReferralId}/`,
            signal,
          ),
          apiRequest(
            `/api/company/medical/referrals/${encodedReferralId}/record-access/`,
            signal,
            true,
          ),
        ]);
        if (signal?.aborted) {
          return;
        }
        const nextReferral =
          normalizeReferral(
            referralPayload,
          );
        if (!nextReferral.id) {
          throw new Error(
            "Invalid medical referral response.",
          );
        }
        setReferral(nextReferral);
        setAccess(
          normalizeRecordAccess(
            accessPayload,
          ),
        );
        if (silent) {
          toast.success(t.refreshed);
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
      referralId,
      t.loadingError,
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
  const printDetail = async () => {
    if (!referral) {
      return;
    }
    const opened =
      await openPrintReport({
        locale,
        title: t.reportTitle,
        subtitle:
          referral.number ||
          t.fallbackTitle,
        branchName:
          referral.targetBranchName ||
          t.unknown,
        tableHtml: buildReportHtml(
          referral,
          access,
          locale,
        ),
        recordsCount:
          access ? 2 : 1,
        logoUrl:
          "/logo/marilyn.svg",
      });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
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
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </main>
    );
  }
  if (error || !referral) {
    return (
      <main
        dir={rtl ? "rtl" : "ltr"}
        className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5"
      >
        <Card className="rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <Waypoints className="h-7 w-7" />
            </span>
            <CardTitle>
              {t.loadingError}
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
                {referral.number ||
                  t.fallbackTitle}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${statusClass(
                  referral.status,
                )}`}
              >
                {statusLabel(
                  referral.status,
                  locale,
                )}
              </Badge>
              <Badge
                variant="outline"
                className={`rounded-full ${priorityClass(
                  referral.priority,
                )}`}
              >
                {priorityLabel(
                  referral,
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
            </Button>            <ClinicalReferralActions
              locale={locale}
              referral={referral}
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
          <SystemKpiCard
            title={t.priority}
            value={priorityLabel(
              referral,
              locale,
            )}
            description={
              referral.number
            }
            icon={Waypoints}
          />
          <SystemKpiCard
            title={t.status}
            value={statusLabel(
              referral.status,
              locale,
            )}
            description={
              referral.isTerminal
                ? statusLabel(
                    referral.status,
                    locale,
                  )
                : t.status
            }
            icon={Activity}
          />
          <SystemKpiCard
            title={t.recordAccess}
            value={
              access
                ? statusLabel(
                    access.status,
                    locale,
                  )
                : t.notCreated
            }
            description={
              access?.isEffective
                ? t.effective
                : t.notEffective
            }
            icon={
              access?.isEffective
                ? ShieldCheck
                : ShieldOff
            }
          />
          <SystemKpiCard
            title={t.recordAccessAllowed}
            value={
              referral.allowsRecordAccess
                ? t.allowed
                : t.notAllowed
            }
            description={
              referral.allowsRecordAccess
                ? t.yes
                : t.no
            }
            icon={ShieldCheck}
          />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={UserRound}
                title={t.referralContext}
                description={
                  t.referralContextDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.referralNumber}
                value={referral.number}
                dir="ltr"
              />
              <DetailField
                label={t.recordId}
                value={referral.id}
                dir="ltr"
              />
              <DetailField
                label={t.sourceEncounter}
                value={
                  referral.sourceEncounterId ? (
                    <Link
                      href={`/system/clinical-operations/encounters/${encodeURIComponent(
                        referral.sourceEncounterId,
                      )}`}
                      className="inline-flex items-center gap-1.5 text-[#8f6a37] hover:underline"
                    >
                      <Link2 className="h-4 w-4" />
                      {referral.sourceEncounterNumber ||
                        referral.sourceEncounterId}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailField
                label={t.patient}
                value={
                  referral.patientName ||
                  t.unknown
                }
              />
              <DetailField
                label={t.patientNumber}
                value={
                  referral.patientNumber ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={
                  t.referringPractitioner
                }
                value={
                  referral.referringPractitionerName ||
                  t.unknown
                }
              />
              <DetailField
                label={
                  t.receivingPractitioner
                }
                value={
                  referral.receivingPractitionerName ||
                  t.unknown
                }
              />
              <DetailField
                label={t.status}
                value={
                  <Badge
                    variant="outline"
                    className={`rounded-full ${statusClass(
                      referral.status,
                    )}`}
                  >
                    {statusLabel(
                      referral.status,
                      locale,
                    )}
                  </Badge>
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={MapPin}
                title={t.destinationTitle}
                description={
                  t.destinationDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <DetailField
                label={t.targetBranch}
                value={
                  referral.targetBranchName ||
                  t.unknown
                }
              />
              <DetailField
                label={t.targetDepartment}
                value={
                  referral.targetDepartmentName ||
                  t.unknown
                }
              />
              <DetailField
                label={t.targetClinic}
                value={
                  referral.targetClinicName ||
                  t.unknown
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={Stethoscope}
                title={t.clinicalTitle}
                description={
                  t.clinicalDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              <DetailField
                label={t.referralReason}
                value={
                  referral.referralReason ||
                  "—"
                }
              />
              <DetailField
                label={t.requestedService}
                value={
                  referral.requestedService ||
                  "—"
                }
              />
              <div className="lg:col-span-2">
                <DetailField
                  label={t.clinicalSummary}
                  value={
                    referral.clinicalSummary ||
                    "—"
                  }
                />
              </div>
              <div className="lg:col-span-2">
                <DetailField
                  label={t.notes}
                  value={
                    referral.notes ||
                    t.noNotes
                  }
                />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={CalendarClock}
                title={t.timelineTitle}
                description={
                  t.timelineDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailField
                label={t.referredAt}
                value={formatDateTime(
                  referral.referredAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.sentAt}
                value={formatDateTime(
                  referral.sentAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.acceptedAt}
                value={formatDateTime(
                  referral.acceptedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.startedAt}
                value={formatDateTime(
                  referral.startedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.completedAt}
                value={formatDateTime(
                  referral.completedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.rejectedAt}
                value={formatDateTime(
                  referral.rejectedAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.cancelledAt}
                value={formatDateTime(
                  referral.cancelledAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.expiresAt}
                value={formatDateTime(
                  referral.expiresAt,
                  locale,
                )}
                dir="ltr"
              />
              {referral.rejectionReason ? (
                <div className="md:col-span-2">
                  <DetailField
                    label={t.rejectionReason}
                    value={
                      referral.rejectionReason
                    }
                  />
                </div>
              ) : null}
              {referral.cancellationReason ? (
                <div className="md:col-span-2">
                  <DetailField
                    label={
                      t.cancellationReason
                    }
                    value={
                      referral.cancellationReason
                    }
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading
                icon={
                  access?.isEffective
                    ? ShieldCheck
                    : ShieldOff
                }
                title={t.accessTitle}
                description={
                  t.accessDescription
                }
              />
              <ClinicalRecordAccessActions
                locale={locale}
                referralId={referralId}
                referralAllowsRecordAccess={
                  referral.allowsRecordAccess
                }
                receivingPractitionerId={
                  referral.receivingPractitionerId
                }
                access={access}
                onChanged={() =>
                  load({
                    silent: true,
                  })
                }
              />
            </CardHeader>
            <CardContent>
              {access ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField
                      label={t.accessStatus}
                      value={
                        <Badge
                          variant="outline"
                          className={`rounded-full ${statusClass(
                            access.status,
                          )}`}
                        >
                          {statusLabel(
                            access.status,
                            locale,
                          )}
                        </Badge>
                      }
                    />
                    <DetailField
                      label={t.scope}
                      value={humanize(
                        access.scope,
                      )}
                    />
                    <DetailField
                      label={t.recordAccessAllowed}
                      value={
                        access.referralAllowsRecordAccess
                          ? t.allowed
                          : t.notAllowed
                      }
                    />
                    <DetailField
                      label={t.effective}
                      value={
                        access.isEffective
                          ? t.yes
                          : t.no
                      }
                    />
                    <DetailField
                      label={t.accessStartsAt}
                      value={formatDateTime(
                        access.accessStartsAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    <DetailField
                      label={t.accessEndsAt}
                      value={formatDateTime(
                        access.accessEndsAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    <DetailField
                      label={
                        t.receivingPractitioner
                      }
                      value={
                        access.receivingPractitionerName ||
                        referral.receivingPractitionerName ||
                        t.unknown
                      }
                    />
                    <DetailField
                      label={t.recordId}
                      value={access.id}
                      dir="ltr"
                    />
                  </div>
                  <div className="rounded-lg border bg-muted/15 px-4 py-4">
                    <p className="text-xs text-muted-foreground">
                      {t.sharedSections}
                    </p>
                    {access.sharedSections.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {access.sharedSections.map(
                          (section) => (
                            <Badge
                              key={section}
                              variant="outline"
                              className="rounded-full border-[#d9c4a5] bg-[#fbf6ee] text-[#805f2f]"
                            >
                              {humanize(
                                section,
                              )}
                            </Badge>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-medium">
                        {t.noSharedSections}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField
                      label={t.grantedAt}
                      value={formatDateTime(
                        access.grantedAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    <DetailField
                      label={t.acceptedAccessAt}
                      value={formatDateTime(
                        access.acceptedAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    <DetailField
                      label={t.rejectedAccessAt}
                      value={formatDateTime(
                        access.rejectedAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    <DetailField
                      label={t.revokedAt}
                      value={formatDateTime(
                        access.revokedAt,
                        locale,
                      )}
                      dir="ltr"
                    />
                    {access.rejectionReason ? (
                      <div className="md:col-span-2">
                        <DetailField
                          label={
                            t.accessRejectionReason
                          }
                          value={
                            access.rejectionReason
                          }
                        />
                      </div>
                    ) : null}
                    {access.revocationReason ? (
                      <div className="md:col-span-2">
                        <DetailField
                          label={
                            t.revocationReason
                          }
                          value={
                            access.revocationReason
                          }
                        />
                      </div>
                    ) : null}
                    <div className="md:col-span-2 xl:col-span-4">
                      <DetailField
                        label={t.notes}
                        value={
                          access.notes ||
                          t.noNotes
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border bg-background text-[#a57b3d]">
                    <ShieldOff className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">
                    {t.accessEmptyTitle}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    {t.accessEmptyDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={FileText}
                title={t.auditTitle}
                description={
                  t.auditDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailField
                label={t.createdBy}
                value={
                  referral.createdById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.updatedBy}
                value={
                  referral.updatedById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.acceptedBy}
                value={
                  referral.acceptedById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.rejectedBy}
                value={
                  referral.rejectedById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.completedBy}
                value={
                  referral.completedById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.cancelledBy}
                value={
                  referral.cancelledById ||
                  "—"
                }
                dir="ltr"
              />
              <DetailField
                label={t.createdAt}
                value={formatDateTime(
                  referral.createdAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.updatedAt}
                value={formatDateTime(
                  referral.updatedAt,
                  locale,
                )}
                dir="ltr"
              />
              {access ? (
                <>
                  <DetailField
                    label={t.grantedBy}
                    value={
                      access.grantedById ||
                      "—"
                    }
                    dir="ltr"
                  />
                  <DetailField
                    label={t.revokedBy}
                    value={
                      access.revokedById ||
                      "—"
                    }
                    dir="ltr"
                  />
                  <DetailField
                    label={t.createdBy}
                    value={
                      access.createdById ||
                      "—"
                    }
                    dir="ltr"
                  />
                  <DetailField
                    label={t.updatedBy}
                    value={
                      access.updatedById ||
                      "—"
                    }
                    dir="ltr"
                  />
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
