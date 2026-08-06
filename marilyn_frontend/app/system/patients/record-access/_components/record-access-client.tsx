"use client";
// patient_record_access_hr_spirit=true
// record_access_visible_tabs_fix=true

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Ban,
  CheckCircle2,
  CircleOff,
  Clock3,
  FileKey2,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataRegisterDatePicker,
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { openPrintReport } from "@/lib/print-report";
import { PatientCenterTabs } from "@/components/system/patient-center-tabs";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type AccessStatus = "NOT_CREATED" | "PENDING" | "ACTIVE" | "REJECTED" | "REVOKED" | "EXPIRED";
type AccessScope = "SUMMARY" | "SOURCE_ENCOUNTER" | "FULL_RECORD" | "CUSTOM";
type StatusFilter = "all" | AccessStatus;
type ScopeFilter = "all" | AccessScope;
type EffectFilter = "all" | "effective" | "inactive";
type SortOrder = "newest" | "oldest";

type Referral = {
  id: string;
  number: string;
  status: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  referringPractitionerName: string;
  receivingPractitionerName: string;
  targetBranchName: string;
  targetDepartmentName: string;
  targetClinicName: string;
  allowsRecordAccess: boolean;
  referredAt: string;
  createdAt: string;
};

type RecordAccess = {
  id: string;
  referralId: string;
  referralNumber: string;
  referralStatus: string;
  referralAllowsRecordAccess: boolean;
  patientId: string;
  patientNumber: string;
  patientName: string;
  receivingPractitionerName: string;
  scope: AccessScope;
  status: Exclude<AccessStatus, "NOT_CREATED">;
  sharedSections: string[];
  accessStartsAt: string;
  accessEndsAt: string;
  isEffective: boolean;
  grantedAt: string;
  rejectedAt: string;
  rejectionReason: string;
  revokedAt: string;
  revocationReason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type AccessRow = {
  referral: Referral;
  access: RecordAccess | null;
  status: AccessStatus;
  scope: AccessScope | "";
  createdAt: string;
  updatedAt: string;
};

type AccessForm = {
  referralId: string;
  scope: AccessScope;
  sections: string[];
  startsAt?: Date;
  endsAt?: Date;
  notes: string;
};

type PendingAction = {
  row: AccessRow;
  action: "grant" | "reject" | "revoke" | "expire";
};

const API = {
  referrals: "/api/company/medical/referrals/",
} as const;

const SHARE_SECTIONS = [
  "PATIENT_SUMMARY",
  "SOURCE_ENCOUNTER",
  "DIAGNOSES",
  "PROCEDURES",
  "CLINICAL_NOTES",
  "TREATMENT_PLAN",
  "FOLLOW_UP_PLAN",
] as const;

const EMPTY_FORM: AccessForm = {
  referralId: "",
  scope: "SUMMARY",
  sections: [],
  startsAt: undefined,
  endsAt: undefined,
  notes: "",
};

const translations = {
  ar: {
    badge: "الإدارة المركزية",
    title: "الوصول إلى السجلات",
    subtitle: "إدارة صلاحيات مشاركة الملفات الطبية ومتابعة نطاق الوصول ومدته وحالته عبر الإحالات الحقيقية.",
    connected:
      "متصل بواجهات الإحالات وصلاحيات السجلات الحقيقية",
    patients: "ملفات المرضى",
    medicalRecords: "الملفات الطبية",
    recordAccess: "الوصول إلى السجلات",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    add: "إضافة صلاحية",
    total: "إجمالي الصلاحيات",
    totalDesc: "جميع صلاحيات الوصول المنشأة من الإحالات",
    active: "وصول فعّال",
    activeDesc: "صلاحيات نشطة ضمن نافذة الوصول الحالية",
    pending: "قيد المراجعة",
    pendingDesc: "صلاحيات معلقة تنتظر المنح أو الرفض",
    closed: "مغلقة أو منتهية",
    closedDesc: "صلاحيات مرفوضة أو ملغاة أو منتهية",
    registerTitle: "سجل الوصول إلى السجلات",
    registerDesc: "قائمة موحدة للإحالات وصلاحيات مشاركة الملف الطبي مع النطاق والمدة والحالة والإجراءات.",
    search: "ابحث برقم الإحالة أو المريض أو الممارس...",
    allStatuses: "كل الحالات",
    allScopes: "كل النطاقات",
    allEffects: "كل الصلاحيات",
    effectiveOnly: "فعّالة فقط",
    inactiveOnly: "غير فعّالة",
    newest: "الأحدث",
    oldest: "الأقدم",
    from: "من تاريخ الإنشاء",
    to: "إلى تاريخ الإنشاء",
    reset: "إعادة ضبط",
    referral: "الإحالة",
    patient: "المريض",
    practitioner: "الممارس المستلم",
    scope: "النطاق",
    sections: "الأقسام المشتركة",
    window: "نافذة الوصول",
    status: "الحالة",
    effective: "الفعالية",
    updated: "آخر تحديث",
    actions: "الإجراءات",
    noRows: "لا توجد صلاحيات وصول مطابقة.",
    noRowsDesc: "أنشئ صلاحية من إحالة مؤهلة أو غيّر الفلاتر الحالية.",
    createFirst: "إضافة أول صلاحية",
    loading: "جارٍ تحميل سجل الوصول...",
    loadError: "تعذر تحميل صلاحيات الوصول إلى السجلات.",
    retry: "إعادة المحاولة",
    partialLoad: "تم تحميل السجل جزئيًا؛ تعذر فحص بعض الإحالات.",
    refreshed: "تم تحديث سجل الوصول.",
    emptyExport: "لا توجد سجلات متاحة للتصدير.",
    emptyPrint: "لا توجد سجلات متاحة للطباعة.",
    exportReady: "تم تجهيز ملف Excel.",
    printReady: "تم تجهيز صفحة الطباعة.",
    printBlocked: "تعذر فتح صفحة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    createTitle: "إضافة صلاحية وصول",
    editTitle: "تعديل صلاحية الوصول",
    createDesc: "اختر إحالة مؤهلة وحدد نطاق مشاركة الملف الطبي ومدتها.",
    editDesc: "يمكن تعديل الصلاحية وهي في حالة قيد المراجعة فقط.",
    referralLabel: "الإحالة الطبية",
    selectReferral: "اختر الإحالة",
    scopeLabel: "نطاق المشاركة",
    sectionsLabel: "الأقسام المشتركة",
    startsAt: "بداية الوصول",
    endsAt: "نهاية الوصول",
    notes: "ملاحظات",
    notesPlaceholder: "أضف ملاحظات تشغيلية أو ضوابط الوصول...",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    requiredReferral: "اختر إحالة طبية.",
    requiredSections: "حدد قسمًا واحدًا على الأقل للنطاق المخصص.",
    invalidWindow: "يجب ألا يسبق تاريخ نهاية الوصول تاريخ البداية.",
    created: "تم إنشاء صلاحية الوصول.",
    updatedSuccess: "تم تحديث صلاحية الوصول.",
    noEligibleReferral: "لا توجد إحالة مؤهلة جديدة لإنشاء صلاحية وصول.",
    edit: "تعديل",
    grant: "منح الوصول",
    reject: "رفض",
    revoke: "سحب الوصول",
    expire: "إنهاء الصلاحية",
    actionTitle: "تحديث حالة الوصول",
    actionGrantDesc: "سيتم تفعيل الوصول ويمكن تحديد تاريخ انتهاء اختياري.",
    actionRejectDesc: "أدخل سبب رفض طلب الوصول.",
    actionRevokeDesc: "أدخل سبب سحب صلاحية الوصول النشطة.",
    actionExpireDesc: "سيتم إنهاء الصلاحية وتسجيل وقت الانتهاء الحالي.",
    reason: "السبب",
    reasonPlaceholder: "اكتب السبب...",
    reasonRequired: "السبب مطلوب لهذا الإجراء.",
    confirm: "تأكيد",
    processing: "جارٍ التنفيذ...",
    statusUpdated: "تم تحديث حالة صلاحية الوصول.",
    notCreated: "لم تُنشأ",
    pendingStatus: "قيد المراجعة",
    activeStatus: "نشط",
    rejectedStatus: "مرفوض",
    revokedStatus: "مسحوب",
    expiredStatus: "منتهي",
    yes: "فعّال",
    no: "غير فعّال",
    summaryScope: "ملخص المريض",
    encounterScope: "الزيارة المصدر",
    fullScope: "الملف الطبي الكامل",
    customScope: "أقسام مخصصة",
    patientSummary: "ملخص المريض",
    sourceEncounter: "الزيارة المصدر",
    diagnoses: "التشخيصات",
    procedures: "الإجراءات",
    clinicalNotes: "الملاحظات السريرية",
    treatmentPlan: "خطة العلاج",
    followUpPlan: "خطة المتابعة",
    notAvailable: "—",
    reportTitle: "تقرير الوصول إلى السجلات الطبية",
    reportDesc: "صلاحيات مشاركة الملفات الطبية حسب الإحالة والمريض والممارس والنطاق والحالة.",
    openPatient: "فتح مركز المرضى",
    openMedicalFile: "فتح الملف الطبي",
  },
  en: {
    badge: "Central administration",
    title: "Record Access",
    subtitle: "Manage medical-record sharing permissions and monitor access scope, window, and status through real referrals.",
    connected:
      "Connected to live referral and record-access APIs",
    patients: "Patient Files",
    medicalRecords: "Medical Records",
    recordAccess: "Record Access",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    add: "Add Access",
    total: "Total access",
    totalDesc: "All record-access permissions created from referrals",
    active: "Effective access",
    activeDesc: "Active permissions inside their current access window",
    pending: "Pending review",
    pendingDesc: "Pending permissions awaiting grant or rejection",
    closed: "Closed or expired",
    closedDesc: "Rejected, revoked, or expired permissions",
    registerTitle: "Medical Record Access Register",
    registerDesc: "Unified referral and record-sharing register with scope, window, status, and actions.",
    search: "Search by referral, patient, or practitioner...",
    allStatuses: "All statuses",
    allScopes: "All scopes",
    allEffects: "All access",
    effectiveOnly: "Effective only",
    inactiveOnly: "Not effective",
    newest: "Newest",
    oldest: "Oldest",
    from: "Created from",
    to: "Created to",
    reset: "Reset",
    referral: "Referral",
    patient: "Patient",
    practitioner: "Receiving practitioner",
    scope: "Scope",
    sections: "Shared sections",
    window: "Access window",
    status: "Status",
    effective: "Effective",
    updated: "Last update",
    actions: "Actions",
    noRows: "No matching record-access entries.",
    noRowsDesc: "Create access from an eligible referral or change the active filters.",
    createFirst: "Add first access",
    loading: "Loading record access...",
    loadError: "Medical record access could not be loaded.",
    retry: "Try again",
    partialLoad: "The register loaded partially; some referrals could not be inspected.",
    refreshed: "Record-access register refreshed.",
    emptyExport: "There are no records to export.",
    emptyPrint: "There are no records to print.",
    exportReady: "Excel file prepared.",
    printReady: "Print page prepared.",
    printBlocked: "The print page could not be opened. Allow pop-ups and try again.",
    createTitle: "Add Record Access",
    editTitle: "Edit Record Access",
    createDesc: "Choose an eligible referral and define the medical-record sharing scope and window.",
    editDesc: "Access can only be edited while pending.",
    referralLabel: "Medical referral",
    selectReferral: "Select referral",
    scopeLabel: "Sharing scope",
    sectionsLabel: "Shared sections",
    startsAt: "Access starts",
    endsAt: "Access ends",
    notes: "Notes",
    notesPlaceholder: "Add operational notes or access controls...",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    requiredReferral: "Select a medical referral.",
    requiredSections: "Select at least one section for custom scope.",
    invalidWindow: "The access end date cannot precede the start date.",
    created: "Record access created.",
    updatedSuccess: "Record access updated.",
    noEligibleReferral: "There is no new eligible referral for record access.",
    edit: "Edit",
    grant: "Grant access",
    reject: "Reject",
    revoke: "Revoke access",
    expire: "Expire access",
    actionTitle: "Update Access Status",
    actionGrantDesc: "Access will be activated and an optional end date can be defined.",
    actionRejectDesc: "Enter the reason for rejecting the access request.",
    actionRevokeDesc: "Enter the reason for revoking active access.",
    actionExpireDesc: "Access will be expired using the current time.",
    reason: "Reason",
    reasonPlaceholder: "Enter the reason...",
    reasonRequired: "A reason is required for this action.",
    confirm: "Confirm",
    processing: "Processing...",
    statusUpdated: "Record-access status updated.",
    notCreated: "Not created",
    pendingStatus: "Pending",
    activeStatus: "Active",
    rejectedStatus: "Rejected",
    revokedStatus: "Revoked",
    expiredStatus: "Expired",
    yes: "Effective",
    no: "Not effective",
    summaryScope: "Patient summary",
    encounterScope: "Source encounter",
    fullScope: "Full medical record",
    customScope: "Custom sections",
    patientSummary: "Patient summary",
    sourceEncounter: "Source encounter",
    diagnoses: "Diagnoses",
    procedures: "Procedures",
    clinicalNotes: "Clinical notes",
    treatmentPlan: "Treatment plan",
    followUpPlan: "Follow-up plan",
    notAvailable: "—",
    reportTitle: "Medical Record Access Report",
    reportDesc: "Medical-record sharing permissions by referral, patient, practitioner, scope, and status.",
    openPatient: "Open patient center",
    openMedicalFile: "Open medical file",
  },
} as const;

class ApiHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function text(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function boolValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = text(value).toLowerCase();
  if (["true", "1", "yes", "active", "enabled"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive", "disabled"].includes(normalized)) return false;
  return fallback;
}

function toEnglishDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function getApiBaseUrl() {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return base.endsWith("/api") ? base.slice(0, -4) : base;
}

function makeApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const part = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : "";
}

function getCsrfToken() {
  return getCookie("csrftoken") || getCookie("csrf_token");
}

async function requestJson(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const csrf = getCsrfToken();
  if (csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRFToken", csrf);

  const response = await fetch(makeApiUrl(path), {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
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
    const source = record(payload);
    throw new ApiHttpError(
      response.status,
      text(source.message || source.detail || source.error, `HTTP ${response.status}`),
    );
  }

  return payload;
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const source = record(payload);
  for (const key of ["items", "results", "data", "rows", "referrals"]) {
    if (Array.isArray(source[key])) return source[key] as unknown[];
  }
  for (const key of ["item", "payload"]) {
    const nested = record(source[key]);
    for (const child of ["items", "results", "data", "rows"]) {
      if (Array.isArray(nested[child])) return nested[child] as unknown[];
    }
  }
  return [];
}

function normalizeReferral(value: unknown): Referral {
  const source = record(value);
  return {
    id: text(source.id || source.pk),
    number: text(source.referral_number || source.number || source.code),
    status: text(source.status).toUpperCase(),
    patientId: text(source.patient_id),
    patientNumber: text(source.patient_number),
    patientName: text(source.patient_name || source.patient_display_name),
    referringPractitionerName: text(source.referring_practitioner_name),
    receivingPractitionerName: text(source.receiving_practitioner_name),
    targetBranchName: text(source.target_branch_name || source.branch_name),
    targetDepartmentName: text(source.target_department_name || source.department_name),
    targetClinicName: text(source.target_clinic_name || source.clinic_name),
    allowsRecordAccess: boolValue(source.allows_record_access),
    referredAt: text(source.referred_at),
    createdAt: text(source.created_at || source.referred_at),
  };
}

function normalizeAccess(value: unknown): RecordAccess {
  const source = record(value);
  return {
    id: text(source.id || source.pk),
    referralId: text(source.referral_id),
    referralNumber: text(source.referral_number),
    referralStatus: text(source.referral_status).toUpperCase(),
    referralAllowsRecordAccess: boolValue(source.referral_allows_record_access),
    patientId: text(source.patient_id),
    patientNumber: text(source.patient_number),
    patientName: text(source.patient_name),
    receivingPractitionerName: text(source.receiving_practitioner_name),
    scope: (text(source.scope, "SUMMARY").toUpperCase() || "SUMMARY") as AccessScope,
    status: (text(source.status, "PENDING").toUpperCase() || "PENDING") as RecordAccess["status"],
    sharedSections: Array.isArray(source.shared_sections)
      ? source.shared_sections.map((item) => text(item).toUpperCase()).filter(Boolean)
      : [],
    accessStartsAt: text(source.access_starts_at),
    accessEndsAt: text(source.access_ends_at),
    isEffective: boolValue(source.is_effective),
    grantedAt: text(source.granted_at),
    rejectedAt: text(source.rejected_at),
    rejectionReason: text(source.rejection_reason),
    revokedAt: text(source.revoked_at),
    revocationReason: text(source.revocation_reason),
    notes: text(source.notes),
    createdAt: text(source.created_at),
    updatedAt: text(source.updated_at || source.created_at),
  };
}

function accessPath(referralId: string) {
  return `/api/company/medical/referrals/${encodeURIComponent(referralId)}/record-access/`;
}

function accessStatusPath(referralId: string) {
  return `/api/company/medical/referrals/${encodeURIComponent(referralId)}/record-access/status/`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return toEnglishDigits(value).slice(0, 10) || "—";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
    parsed.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return toEnglishDigits(value).replace("T", " ").slice(0, 16) || "—";
  return `${formatDate(parsed.toISOString())} ${String(parsed.getHours()).padStart(2, "0")}:${String(
    parsed.getMinutes(),
  ).padStart(2, "0")}`;
}

function dateFromString(value: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateStartIso(value?: Date) {
  if (!value) return null;
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function dateEndIso(value?: Date) {
  if (!value) return null;
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
}

function formatCalendarDate(value?: Date) {
  if (!value) return "";
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

function escapeHtml(value: unknown) {
  return toEnglishDigits(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(values.length, 1)) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

function getStatusLabel(status: AccessStatus, locale: Locale) {
  const t = translations[locale];
  return {
    NOT_CREATED: t.notCreated,
    PENDING: t.pendingStatus,
    ACTIVE: t.activeStatus,
    REJECTED: t.rejectedStatus,
    REVOKED: t.revokedStatus,
    EXPIRED: t.expiredStatus,
  }[status];
}

function getScopeLabel(scope: AccessScope | "", locale: Locale) {
  const t = translations[locale];
  return {
    SUMMARY: t.summaryScope,
    SOURCE_ENCOUNTER: t.encounterScope,
    FULL_RECORD: t.fullScope,
    CUSTOM: t.customScope,
    "": t.notAvailable,
  }[scope];
}

function getSectionLabel(section: string, locale: Locale) {
  const t = translations[locale];
  return {
    PATIENT_SUMMARY: t.patientSummary,
    SOURCE_ENCOUNTER: t.sourceEncounter,
    DIAGNOSES: t.diagnoses,
    PROCEDURES: t.procedures,
    CLINICAL_NOTES: t.clinicalNotes,
    TREATMENT_PLAN: t.treatmentPlan,
    FOLLOW_UP_PLAN: t.followUpPlan,
  }[section] || section;
}

function statusBadgeClass(status: AccessStatus) {
  if (status === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "NOT_CREATED") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

type DateRegisterFilterProps = Omit<
  React.ComponentProps<typeof DataRegisterDatePicker>,
  "value" | "onChange"
> & {
  value?: Date;
  onChange: (value?: Date) => void;
};
function toRegisterDateValue(value?: Date) {
  if (
    !value ||
    Number.isNaN(value.getTime())
  ) {
    return "";
  }
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}
function fromRegisterDateValue(
  value: string,
) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    value,
  );
  if (!match) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(
    year,
    month - 1,
    day,
  );
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }
  return parsed;
}
function DateRegisterFilter({
  value,
  onChange,
  ...props
}: DateRegisterFilterProps) {
  return (
    <DataRegisterDatePicker
      {...props}
      value={toRegisterDateValue(value)}
      onChange={(nextValue) =>
        onChange(
          fromRegisterDateValue(nextValue),
        )
      }
    />
  );
}
export default function RecordAccessClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [rows, setRows] = React.useState<AccessRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warningCount, setWarningCount] = React.useState(0);

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>("all");
  const [effectFilter, setEffectFilter] = React.useState<EffectFilter>("all");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("newest");
  const [createdFrom, setCreatedFrom] = React.useState<Date | undefined>();
  const [createdTo, setCreatedTo] = React.useState<Date | undefined>();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<AccessRow | null>(null);
  const [form, setForm] = React.useState<AccessForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);

  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [actionReason, setActionReason] = React.useState("");
  const [actionEndsAt, setActionEndsAt] = React.useState<Date | undefined>();
  const [actionSubmitting, setActionSubmitting] = React.useState(false);

  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  React.useEffect(() => {
    const applyLocale = () => {
      const next = getInitialLocale();
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.body.dir = next === "ar" ? "rtl" : "ltr";
    };
    applyLocale();
    window.addEventListener("storage", applyLocale);
    window.addEventListener("primey-locale-changed", applyLocale);
    return () => {
      window.removeEventListener("storage", applyLocale);
      window.removeEventListener("primey-locale-changed", applyLocale);
    };
  }, []);

  const load = React.useCallback(
    async ({ silent = false, signal }: { silent?: boolean; signal?: AbortSignal } = {}) => {
      try {
        if (!silent) setLoading(true);
        setRefreshing(true);
        setError("");
        setWarningCount(0);

        const queryString = new URLSearchParams({
          page: "1",
          page_size: "200",
          ordering: "-created_at",
        });
        const referralPayload = await requestJson(`${API.referrals}?${queryString.toString()}`, {
          method: "GET",
          signal,
        });
        const referrals = extractItems(referralPayload).map(normalizeReferral).filter((item) => item.id);

        let failed = 0;
        const inspected = await mapWithConcurrency(referrals, 8, async (referral) => {
          try {
            const payload = await requestJson(accessPath(referral.id), { method: "GET", signal });
            const source = record(payload);
            const access = normalizeAccess(source.item || source.data || source.access);
            return { referral, access } as const;
          } catch (caught) {
            if (caught instanceof ApiHttpError && caught.status === 404) {
              return { referral, access: null } as const;
            }
            if (signal?.aborted) throw caught;
            failed += 1;
            return { referral, access: null } as const;
          }
        });

        const nextRows = inspected
          .filter(({ referral, access }) => Boolean(access) || referral.allowsRecordAccess)
          .map(({ referral, access }): AccessRow => ({
            referral,
            access,
            status: access?.status || "NOT_CREATED",
            scope: access?.scope || "",
            createdAt: access?.createdAt || referral.createdAt,
            updatedAt: access?.updatedAt || access?.createdAt || referral.createdAt,
          }));

        setRows(nextRows);
        setWarningCount(failed);
        if (silent) {
          if (failed) toast.warning(t.partialLoad);
          else toast.success(t.refreshed);
        }
      } catch (caught) {
        if (signal?.aborted) return;
        const message = caught instanceof Error ? caught.message : t.loadError;
        setError(message || t.loadError);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [t.loadError, t.partialLoad, t.refreshed],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const fromTime = createdFrom ? new Date(createdFrom).setHours(0, 0, 0, 0) : null;
    const toTime = createdTo ? new Date(createdTo).setHours(23, 59, 59, 999) : null;

    return rows
      .filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (scopeFilter !== "all" && row.scope !== scopeFilter) return false;
        if (effectFilter === "effective" && !row.access?.isEffective) return false;
        if (effectFilter === "inactive" && row.access?.isEffective) return false;

        const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
        if (fromTime !== null && created < fromTime) return false;
        if (toTime !== null && created > toTime) return false;

        if (!needle) return true;
        return [
          row.referral.number,
          row.referral.patientNumber,
          row.referral.patientName,
          row.referral.referringPractitionerName,
          row.referral.receivingPractitionerName,
          row.access?.receivingPractitionerName,
          row.referral.targetBranchName,
          row.referral.targetDepartmentName,
          row.referral.targetClinicName,
          row.access?.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortOrder === "newest" ? right - left : left - right;
      });
  }, [createdFrom, createdTo, effectFilter, query, rows, scopeFilter, sortOrder, statusFilter]);

  const stats = React.useMemo(() => {
    const accesses = rows.filter((row) => row.access);
    return {
      total: accesses.length,
      active: accesses.filter((row) => row.access?.isEffective).length,
      pending: accesses.filter((row) => row.status === "PENDING").length,
      closed: accesses.filter((row) => ["REJECTED", "REVOKED", "EXPIRED"].includes(row.status)).length,
    };
  }, [rows]);

  const eligibleRows = React.useMemo(
    () => rows.filter((row) => !row.access && row.referral.allowsRecordAccess),
    [rows],
  );

  const hasFilters = Boolean(
    query ||
      statusFilter !== "all" ||
      scopeFilter !== "all" ||
      effectFilter !== "all" ||
      sortOrder !== "newest" ||
      createdFrom ||
      createdTo,
  );

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setScopeFilter("all");
    setEffectFilter("all");
    setSortOrder("newest");
    setCreatedFrom(undefined);
    setCreatedTo(undefined);
  }

  function openCreate() {
    if (!eligibleRows.length) {
      toast.info(t.noEligibleReferral);
      return;
    }
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(row: AccessRow) {
    if (!row.access || row.status !== "PENDING") return;
    setEditingRow(row);
    setForm({
      referralId: row.referral.id,
      scope: row.access.scope,
      sections: row.access.sharedSections,
      startsAt: dateFromString(row.access.accessStartsAt),
      endsAt: dateFromString(row.access.accessEndsAt),
      notes: row.access.notes,
    });
    setFormOpen(true);
  }

  function toggleSection(section: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      sections: checked
        ? Array.from(new Set([...current.sections, section]))
        : current.sections.filter((item) => item !== section),
    }));
  }

  async function submitForm() {
    const referralId = editingRow?.referral.id || form.referralId;
    if (!referralId) {
      toast.error(t.requiredReferral);
      return;
    }
    if (form.scope === "CUSTOM" && !form.sections.length) {
      toast.error(t.requiredSections);
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt.getTime() < form.startsAt.getTime()) {
      toast.error(t.invalidWindow);
      return;
    }

    const payload = {
      scope: form.scope,
      shared_sections: form.scope === "CUSTOM" ? form.sections : [],
      access_starts_at: dateStartIso(form.startsAt),
      access_ends_at: dateEndIso(form.endsAt),
      notes: form.notes.trim(),
    };

    setSubmitting(true);
    try {
      await requestJson(accessPath(referralId), {
        method: editingRow ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(editingRow ? t.updatedSuccess : t.created);
      setFormOpen(false);
      setEditingRow(null);
      setForm(EMPTY_FORM);
      await load({ silent: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadError);
    } finally {
      setSubmitting(false);
    }
  }

  function openAction(row: AccessRow, action: PendingAction["action"]) {
    setPendingAction({ row, action });
    setActionReason("");
    setActionEndsAt(action === "grant" ? dateFromString(row.access?.accessEndsAt || "") : undefined);
  }

  async function applyAction() {
    if (!pendingAction) return;
    if (["reject", "revoke"].includes(pendingAction.action) && !actionReason.trim()) {
      toast.error(t.reasonRequired);
      return;
    }

    const payload: Record<string, unknown> = { action: pendingAction.action };
    if (pendingAction.action === "grant" && actionEndsAt) {
      payload.access_ends_at = dateEndIso(actionEndsAt);
    }
    if (pendingAction.action === "reject") payload.reason = actionReason.trim();
    if (pendingAction.action === "revoke") payload.revocation_reason = actionReason.trim();

    setActionSubmitting(true);
    try {
      await requestJson(accessStatusPath(pendingAction.row.referral.id), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(t.statusUpdated);
      setPendingAction(null);
      setActionReason("");
      setActionEndsAt(undefined);
      await load({ silent: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.loadError);
    } finally {
      setActionSubmitting(false);
    }
  }

  function exportExcel() {
    if (!filtered.length) {
      toast.info(t.emptyExport);
      return;
    }
    const headers = [
      t.referral,
      t.patient,
      t.practitioner,
      t.scope,
      t.sections,
      t.window,
      t.status,
      t.effective,
      t.updated,
    ];
    const body = filtered.map((row) => [
      row.referral.number,
      `${row.referral.patientName} ${row.referral.patientNumber}`.trim(),
      row.access?.receivingPractitionerName || row.referral.receivingPractitionerName,
      getScopeLabel(row.scope, locale),
      row.access?.sharedSections.map((item) => getSectionLabel(item, locale)).join("، ") || "—",
      `${formatDateTime(row.access?.accessStartsAt || "")} — ${formatDateTime(
        row.access?.accessEndsAt || "",
      )}`,
      getStatusLabel(row.status, locale),
      row.access?.isEffective ? t.yes : t.no,
      formatDateTime(row.updatedAt),
    ]);
    const table = `<table><thead><tr>${headers
      .map((item) => `<th>${escapeHtml(item)}</th>`)
      .join("")}</tr></thead><tbody>${body
      .map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
    const blob = new Blob([`\uFEFF<html><meta charset="utf-8"><body>${table}</body></html>`], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-record-access-${formatCalendarDate(new Date())}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t.exportReady);
  }

  async function printRegister() {
    if (!filtered.length) {
      toast.info(t.emptyPrint);
      return;
    }
    const headers = [
      t.referral,
      t.patient,
      t.practitioner,
      t.scope,
      t.sections,
      t.window,
      t.status,
      t.effective,
      t.updated,
    ];
    const body = filtered
      .map((row) => [
        row.referral.number,
        `${row.referral.patientName} ${row.referral.patientNumber}`.trim(),
        row.access?.receivingPractitionerName || row.referral.receivingPractitionerName,
        getScopeLabel(row.scope, locale),
        row.access?.sharedSections.map((item) => getSectionLabel(item, locale)).join("، ") || "—",
        `${formatDateTime(row.access?.accessStartsAt || "")} — ${formatDateTime(
          row.access?.accessEndsAt || "",
        )}`,
        getStatusLabel(row.status, locale),
        row.access?.isEffective ? t.yes : t.no,
        formatDateTime(row.updatedAt),
      ])
      .map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`)
      .join("");
    const tableHtml = `<table><thead><tr>${headers
      .map((item) => `<th>${escapeHtml(item)}</th>`)
      .join("")}</tr></thead><tbody>${body}</tbody></table>`;
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: t.reportDesc,
      recordsCount: filtered.length,
      tableHtml,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  }

  const actionDescription = pendingAction
    ? {
        grant: t.actionGrantDesc,
        reject: t.actionRejectDesc,
        revoke: t.actionRevokeDesc,
        expire: t.actionExpireDesc,
      }[pendingAction.action]
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8" dir={dir}>
        <div className="w-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-24 w-full max-w-xl" />
            <Skeleton className="h-10 w-80" />
          </div>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[126px] rounded-lg" />
            ))}
          </section>

          <Skeleton className="h-[420px] rounded-lg" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8" dir={dir}>
        <Card className="rounded-lg border-rose-200 bg-card shadow-none">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
            <XCircle className="size-10 text-rose-500" />
            <h2 className="font-semibold">{t.loadError}</h2>
            <p className="max-w-xl text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8" dir={dir}>
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#9a7139]">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            {t.connected}
          </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {t.refresh}
            </Button>
            <Button variant="outline" className={registerOutlineButtonClass} onClick={exportExcel}>
              <FileSpreadsheet className="size-4" />
              {t.excel}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void printRegister()}
            >
              <Printer className="size-4" />
              {t.print}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={openCreate}
            >
              <Plus className="size-4" />
              {t.add}
            </Button>
          </div>
        </header>

        {warningCount ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            {t.partialLoad} ({formatInteger(warningCount)})
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard title={t.total} value={stats.total} description={t.totalDesc} icon={FileKey2} />
          <SystemKpiCard title={t.active} value={stats.active} description={t.activeDesc} icon={ShieldCheck} />
          <SystemKpiCard title={t.pending} value={stats.pending} description={t.pendingDesc} icon={Clock3} />
          <SystemKpiCard title={t.closed} value={stats.closed} description={t.closedDesc} icon={CircleOff} />
        </section>
        <PatientCenterTabs
          active="record-access"
          locale={locale}
          counts={{
            "record-access":
              stats.total,
          }}
        />

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <FileKey2 className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle}
                </CardTitle>
                <CardDescription className="mt-1 leading-6">{t.registerDesc}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className={registerOutlineButtonClass} onClick={exportExcel}>
                  <FileSpreadsheet className="size-4" />
                  {t.excel}
                </Button>
                <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void printRegister()}
            >
                  <Printer className="size-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DataRegisterSearch
                value={query}
                onChange={setQuery}
                placeholder={t.search}
                className="min-w-0 flex-1"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger className="h-9 w-[145px] bg-background shadow-none">
                    <SelectValue placeholder={t.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    {(["NOT_CREATED", "PENDING", "ACTIVE", "REJECTED", "REVOKED", "EXPIRED"] as AccessStatus[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status, locale)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as ScopeFilter)}>
                  <SelectTrigger className="h-9 w-[155px] bg-background shadow-none">
                    <SelectValue placeholder={t.allScopes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allScopes}</SelectItem>
                    {(["SUMMARY", "SOURCE_ENCOUNTER", "FULL_RECORD", "CUSTOM"] as AccessScope[]).map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {getScopeLabel(scope, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={effectFilter} onValueChange={(value) => setEffectFilter(value as EffectFilter)}>
                  <SelectTrigger className="h-9 w-[140px] bg-background shadow-none">
                    <SelectValue placeholder={t.allEffects} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allEffects}</SelectItem>
                    <SelectItem value="effective">{t.effectiveOnly}</SelectItem>
                    <SelectItem value="inactive">{t.inactiveOnly}</SelectItem>
                  </SelectContent>
                </Select>

                <DateRegisterFilter
                  label={t.from}
                  value={createdFrom}
                  onChange={setCreatedFrom}
                  locale={locale}
                />
                <DateRegisterFilter
                  label={t.to}
                  value={createdTo}
                  onChange={setCreatedTo}
                  locale={locale}
                />

                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger className="h-9 w-[125px] bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t.newest}</SelectItem>
                    <SelectItem value="oldest">{t.oldest}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={resetFilters}
                  disabled={!hasFilters}
                >
                  <RotateCcw className="size-4" />
                  {t.reset}
                </Button>
              </div>
            </DataRegisterToolbar>

            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table
                  variant="register"
                  layout="fixed"
                  minWidth="1540px"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead sticky="start" className="w-[150px]">{t.referral}</TableHead>
                      <TableHead className="w-[220px]">{t.patient}</TableHead>
                      <TableHead className="w-[210px]">{t.practitioner}</TableHead>
                      <TableHead className="w-[170px]">{t.scope}</TableHead>
                      <TableHead className="w-[230px]">{t.sections}</TableHead>
                      <TableHead className="w-[250px]">{t.window}</TableHead>
                      <TableHead className="w-[120px]">{t.status}</TableHead>
                      <TableHead className="w-[110px]">{t.effective}</TableHead>
                      <TableHead className="w-[165px]">{t.updated}</TableHead>
                      <TableHead sticky="end" contentAlign="center" className="w-[80px]">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.referral.id} interactive>
                        <TableCell sticky="start">
                          <div className="font-medium">{row.referral.number || "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{row.referral.status || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.referral.patientName || "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{row.referral.patientNumber || "—"}</div>
                        </TableCell>
                        <TableCell>
                          {row.access?.receivingPractitionerName ||
                            row.referral.receivingPractitionerName ||
                            row.referral.referringPractitionerName ||
                            "—"}
                        </TableCell>
                        <TableCell>{getScopeLabel(row.scope, locale)}</TableCell>
                        <TableCell className="whitespace-normal">
                          {row.access?.sharedSections.length
                            ? row.access.sharedSections.map((item) => getSectionLabel(item, locale)).join("، ")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div>{formatDateTime(row.access?.accessStartsAt || "")}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(row.access?.accessEndsAt || "")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(row.status)}>
                            {getStatusLabel(row.status, locale)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.access?.isEffective ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="size-4" />
                              {t.yes}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Ban className="size-4" />
                              {t.no}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                        <TableCell sticky="end" contentAlign="center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t.actions}>
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-48">
                              <DropdownMenuItem asChild>
                                <Link href="/system/patients">
                                  <UsersRound className="size-4" />
                                  {t.openPatient}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/system/patients/medical-records?patient=${encodeURIComponent(row.referral.patientId)}`}>
                                  <UserRound className="size-4" />
                                  {t.openMedicalFile}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!row.access && row.referral.allowsRecordAccess ? (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditingRow(null);
                                    setForm({ ...EMPTY_FORM, referralId: row.referral.id });
                                    setFormOpen(true);
                                  }}
                                >
                                  <Plus className="size-4" />
                                  {t.add}
                                </DropdownMenuItem>
                              ) : null}
                              {row.status === "PENDING" ? (
                                <>
                                  <DropdownMenuItem onSelect={() => openEdit(row)}>
                                    <FileKey2 className="size-4" />
                                    {t.edit}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openAction(row, "grant")}>
                                    <ShieldCheck className="size-4" />
                                    {t.grant}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openAction(row, "reject")} className="text-rose-700">
                                    <XCircle className="size-4" />
                                    {t.reject}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              {row.status === "ACTIVE" ? (
                                <>
                                  <DropdownMenuItem onSelect={() => openAction(row, "revoke")} className="text-rose-700">
                                    <CircleOff className="size-4" />
                                    {t.revoke}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openAction(row, "expire")}>
                                    <Clock3 className="size-4" />
                                    {t.expire}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!filtered.length ? (
                <div className="py-2">
                  <DataRegisterEmptyState
                    title={t.noRows}
                    description={t.noRowsDesc}
                    showReset={hasFilters}
                    onReset={resetFilters}
                    resetLabel={t.reset}
                  />
                  {!rows.length ? (
                    <div className="flex justify-center pb-5">
                      <Button
                        variant="brand"
                        className={registerBrandButtonClass}
                        onClick={openCreate}
                      >
                        <Plus className="size-4" />
                        {t.createFirst}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => !submitting && setFormOpen(open)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle>{editingRow ? t.editTitle : t.createTitle}</DialogTitle>
            <DialogDescription>{editingRow ? t.editDesc : t.createDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label>{t.referralLabel}</Label>
              <Select
                value={editingRow?.referral.id || form.referralId}
                onValueChange={(value) => setForm((current) => ({ ...current, referralId: value }))}
                disabled={Boolean(editingRow)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectReferral} />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {(editingRow ? [editingRow] : eligibleRows).map((row) => (
                    <SelectItem key={row.referral.id} value={row.referral.id}>
                      {row.referral.number} — {row.referral.patientName} —{" "}
                      {row.referral.receivingPractitionerName || row.referral.referringPractitionerName || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t.scopeLabel}</Label>
              <Select
                value={form.scope}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    scope: value as AccessScope,
                    sections: value === "CUSTOM" ? current.sections : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["SUMMARY", "SOURCE_ENCOUNTER", "FULL_RECORD", "CUSTOM"] as AccessScope[]).map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {getScopeLabel(scope, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.scope === "CUSTOM" ? (
              <div className="grid gap-3">
                <Label>{t.sectionsLabel}</Label>
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                  {SHARE_SECTIONS.map((section) => (
                    <label key={section} className="flex cursor-pointer items-center gap-3 text-sm">
                      <Checkbox
                        checked={form.sections.includes(section)}
                        onCheckedChange={(checked) => toggleSection(section, checked === true)}
                      />
                      <span>{getSectionLabel(section, locale)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t.startsAt}</Label>
                <DateRegisterFilter
                  label={t.startsAt}
                  value={form.startsAt}
                  onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))}
                  locale={locale}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t.endsAt}</Label>
                <DateRegisterFilter
                  label={t.endsAt}
                  value={form.endsAt}
                  onChange={(value) => setForm((current) => ({ ...current, endsAt: value }))}
                  locale={locale}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="record-access-notes">{t.notes}</Label>
              <Textarea
                id="record-access-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder={t.notesPlaceholder}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              {t.cancel}
            </Button>
            <Button variant="brand" onClick={() => void submitForm()} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {submitting ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && !actionSubmitting && setPendingAction(null)}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t.actionTitle}</DialogTitle>
            <DialogDescription>{actionDescription}</DialogDescription>
          </DialogHeader>

          {pendingAction?.action === "grant" ? (
            <div className="grid gap-2 py-2">
              <Label>{t.endsAt}</Label>
              <DateRegisterFilter
                label={t.endsAt}
                value={actionEndsAt}
                onChange={setActionEndsAt}
                locale={locale}
              />
            </div>
          ) : null}

          {pendingAction && ["reject", "revoke"].includes(pendingAction.action) ? (
            <div className="grid gap-2 py-2">
              <Label htmlFor="record-access-action-reason">{t.reason}</Label>
              <Textarea
                id="record-access-action-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder={t.reasonPlaceholder}
                rows={4}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={actionSubmitting}>
              {t.cancel}
            </Button>
            <Button variant="brand" onClick={() => void applyAction()} disabled={actionSubmitting}>
              {actionSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {actionSubmitting ? t.processing : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
