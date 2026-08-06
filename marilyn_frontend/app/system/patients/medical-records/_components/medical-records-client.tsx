"use client";
// patient_medical_records_hr_spirit=true
import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
import { PatientCenterTabs } from "@/components/system/patient-center-tabs";
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
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type PatientRow = {
  id: string;
  name: string;
  number: string;
  identity: string;
  mobile: string;
  branch: string;
  branchId: string;
  gender: string;
  registeredAt: string;
  status: string;
  raw: ApiRecord;
};
type SectionKey =
  | "appointments"
  | "encounters"
  | "diagnoses"
  | "procedures"
  | "referrals"
  | "record_access";
type MedicalSection = {
  count: number;
  items: ApiRecord[];
};
type MedicalSummary = {
  appointments_total: number;
  upcoming_appointments: number;
  encounters_total: number;
  open_encounters: number;
  diagnoses_total: number;
  primary_diagnoses: number;
  procedures_total: number;
  completed_procedures: number;
  referrals_total: number;
  active_referrals: number;
  record_access_total: number;
  effective_record_access: number;
  total_clinical_records: number;
  next_appointment_at: string | null;
  latest_encounter_at: string | null;
};
type MedicalFile = {
  patient: ApiRecord;
  summary: MedicalSummary;
  sections: Record<SectionKey, MedicalSection>;
  generated_at: string | null;
};
const sectionKeys: SectionKey[] = [
  "appointments",
  "encounters",
  "diagnoses",
  "procedures",
  "referrals",
  "record_access",
];
const hiddenRecordKeys = new Set([
  "id",
  "company",
  "company_id",
  "patient",
  "patient_id",
  "created_by",
  "created_by_id",
  "updated_by",
  "updated_by_id",
  "extra_data",
]);
const preferredColumns: Record<SectionKey, string[]> = {
  appointments: [
    "scheduled_start",
    "scheduled_end",
    "status",
    "practitioner_name",
    "branch_name",
    "service_name",
  ],
  encounters: [
    "opened_at",
    "closed_at",
    "status",
    "encounter_type",
    "practitioner_name",
    "clinic_name",
  ],
  diagnoses: [
    "diagnosis_name",
    "diagnosis_code",
    "is_primary",
    "diagnosed_at",
    "practitioner_name",
    "notes",
  ],
  procedures: [
    "procedure_name_snapshot",
    "procedure_code_snapshot",
    "status",
    "quantity",
    "performed_at",
    "practitioner_name",
  ],
  referrals: [
    "referred_at",
    "status",
    "priority",
    "practitioner_name",
    "destination",
    "notes",
  ],
  record_access: [
    "scope",
    "status",
    "starts_at",
    "expires_at",
    "practitioner_name",
    "notes",
  ],
};
const translations = {
  ar: {
    badge: "الإدارة المركزية",
    title: "الملفات الطبية",
    subtitle:
      "استعراض ملفات المرضى والسجل السريري والمواعيد والتشخيصات والإجراءات والإحالات.",
    connected:
      "متصل بواجهات ملفات المرضى والسجل السريري الحقيقية",
    patientsTab: "ملفات المرضى",
    medicalFilesTab: "الملفات الطبية",
    accessTab: "الوصول إلى السجلات",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    addPatient: "إضافة مريض",
    totalPatients: "إجمالي المرضى",
    totalRecords: "إجمالي السجلات السريرية",
    openEncounters: "المقابلات المفتوحة",
    activeReferrals: "الإحالات النشطة",
    totalPatientsDesc: "ملفات المرضى المتاحة في النظام",
    totalRecordsDesc: "إجمالي مكونات الملف الطبي المحدد",
    openEncountersDesc: "مقابلات سريرية لم تُغلق بعد",
    activeReferralsDesc: "إحالات طبية ما زالت فعالة",
    patientRegister: "سجل الملفات الطبية",
    patientRegisterDesc:
      "اختر مريضًا لعرض ملفه الطبي الحقيقي والأقسام السريرية المرتبطة به.",
    searchPatients: "ابحث باسم المريض أو الرقم أو الهوية أو الجوال...",
    patient: "المريض",
    patientNumber: "رقم المريض",
    identity: "الهوية",
    mobile: "الجوال",
    branch: "الفرع",
    gender: "النوع",
    registeredAt: "تاريخ التسجيل",
    status: "الحالة",
    allStatuses: "كل الحالات",
    allGenders: "كل الأنواع",
    allBranches: "كل الفروع",
    newestPatients: "الأحدث تسجيلًا",
    oldestPatients: "الأقدم تسجيلًا",
    registeredFrom: "من تاريخ التسجيل",
    registeredTo: "إلى تاريخ التسجيل",
    fileSummary: "ملخص الملف الطبي",
    fileSummaryDesc:
      "المؤشرات السريرية والأقسام المرتبطة بالمريض المحدد.",
    selectPatient: "اختر مريضًا",
    appointments: "المواعيد",
    encounters: "المقابلات",
    diagnoses: "التشخيصات",
    procedures: "الإجراءات",
    referrals: "الإحالات",
    recordAccess: "الوصول إلى السجل",
    searchRecords: "ابحث داخل سجلات القسم الحالي...",
    reset: "إعادة ضبط",
    records: "السجلات",
    generatedAt: "تم إنشاء الملف في",
    nextAppointment: "الموعد القادم",
    latestEncounter: "آخر مقابلة",
    noPatientsTitle: "لا توجد ملفات مرضى مسجلة حتى الآن",
    noPatientsDesc:
      "أضف مريضًا من مركز المرضى، ثم سيظهر ملفه الطبي هنا تلقائيًا.",
    noMatchingPatients: "لا توجد ملفات مطابقة للبحث.",
    noSectionRecords: "لا توجد سجلات في هذا القسم.",
    loadingPatients: "جارٍ تحميل ملفات المرضى...",
    loadingFile: "جارٍ تحميل الملف الطبي...",
    loadError: "تعذر تحميل الملفات الطبية",
    tryAgain: "إعادة المحاولة",
    unknown: "غير محدد",
    yes: "نعم",
    no: "لا",
    printReady: "تم تجهيز تقرير الملف الطبي للطباعة.",
    printBlocked:
      "تعذر فتح صفحة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    exportReady: "تم تجهيز ملف Excel.",
    emptyExport: "لا توجد سجلات متاحة للتصدير.",
    emptyPrint: "لا توجد سجلات متاحة للطباعة.",
    reportTitle: "تقرير الملف الطبي",
    section: "القسم",
  },
  en: {
    badge: "Central administration",
    title: "Medical Records",
    subtitle:
      "Review patient files, clinical records, appointments, diagnoses, procedures, and referrals.",
    connected:
      "Connected to live patient and clinical-record APIs",
    patientsTab: "Patient Files",
    medicalFilesTab: "Medical Records",
    accessTab: "Record Access",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    addPatient: "Add Patient",
    totalPatients: "Total Patients",
    totalRecords: "Clinical Records",
    openEncounters: "Open Encounters",
    activeReferrals: "Active Referrals",
    totalPatientsDesc: "Patient files available in the system",
    totalRecordsDesc: "All entries in the selected medical file",
    openEncountersDesc: "Clinical encounters not completed yet",
    activeReferralsDesc: "Medical referrals that remain active",
    patientRegister: "Medical Records Register",
    patientRegisterDesc:
      "Select a patient to load the real medical file and clinical sections.",
    searchPatients: "Search by patient, number, identity, or mobile...",
    patient: "Patient",
    patientNumber: "Patient Number",
    identity: "Identity",
    mobile: "Mobile",
    branch: "Branch",
    gender: "Gender",
    registeredAt: "Registered",
    status: "Status",
    allStatuses: "All statuses",
    allGenders: "All genders",
    allBranches: "All branches",
    newestPatients: "Newest first",
    oldestPatients: "Oldest first",
    registeredFrom: "Registered from",
    registeredTo: "Registered to",
    fileSummary: "Medical File Summary",
    fileSummaryDesc:
      "Clinical indicators and sections associated with the selected patient.",
    selectPatient: "Select patient",
    appointments: "Appointments",
    encounters: "Encounters",
    diagnoses: "Diagnoses",
    procedures: "Procedures",
    referrals: "Referrals",
    recordAccess: "Record Access",
    searchRecords: "Search the current section...",
    reset: "Reset",
    records: "Records",
    generatedAt: "Generated at",
    nextAppointment: "Next appointment",
    latestEncounter: "Latest encounter",
    noPatientsTitle: "No patient files have been registered",
    noPatientsDesc:
      "Add a patient in the patient center and the medical file will appear here.",
    noMatchingPatients: "No patient files match the search.",
    noSectionRecords: "There are no records in this section.",
    loadingPatients: "Loading patient files...",
    loadingFile: "Loading medical file...",
    loadError: "Could not load medical records",
    tryAgain: "Try again",
    unknown: "Unknown",
    yes: "Yes",
    no: "No",
    printReady: "Medical-file report prepared.",
    printBlocked:
      "The print page could not be opened. Allow pop-ups and try again.",
    exportReady: "Excel file prepared.",
    emptyExport: "There are no records to export.",
    emptyPrint: "There are no records to print.",
    reportTitle: "Medical File Report",
    section: "Section",
  },
} as const;
const fieldLabels: Record<string, { ar: string; en: string }> = {
  scheduled_start: { ar: "بداية الموعد", en: "Scheduled start" },
  scheduled_end: { ar: "نهاية الموعد", en: "Scheduled end" },
  opened_at: { ar: "وقت الفتح", en: "Opened at" },
  closed_at: { ar: "وقت الإغلاق", en: "Closed at" },
  diagnosed_at: { ar: "تاريخ التشخيص", en: "Diagnosed at" },
  performed_at: { ar: "تاريخ التنفيذ", en: "Performed at" },
  referred_at: { ar: "تاريخ الإحالة", en: "Referred at" },
  starts_at: { ar: "تاريخ البداية", en: "Starts at" },
  expires_at: { ar: "تاريخ الانتهاء", en: "Expires at" },
  status: { ar: "الحالة", en: "Status" },
  practitioner_name: { ar: "الممارس", en: "Practitioner" },
  branch_name: { ar: "الفرع", en: "Branch" },
  clinic_name: { ar: "العيادة", en: "Clinic" },
  service_name: { ar: "الخدمة", en: "Service" },
  encounter_type: { ar: "نوع المقابلة", en: "Encounter type" },
  diagnosis_name: { ar: "التشخيص", en: "Diagnosis" },
  diagnosis_code: { ar: "كود التشخيص", en: "Diagnosis code" },
  is_primary: { ar: "تشخيص رئيسي", en: "Primary" },
  procedure_name_snapshot: { ar: "الإجراء", en: "Procedure" },
  procedure_code_snapshot: { ar: "كود الإجراء", en: "Procedure code" },
  quantity: { ar: "الكمية", en: "Quantity" },
  priority: { ar: "الأولوية", en: "Priority" },
  destination: { ar: "الجهة المحال إليها", en: "Destination" },
  scope: { ar: "نطاق الوصول", en: "Scope" },
  notes: { ar: "ملاحظات", en: "Notes" },
};
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function toEnglishDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
    );
}
function textValue(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return toEnglishDigits(value).trim() || fallback;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return fallback;
}
function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(
    toEnglishDigits(value)
      .replaceAll(",", "")
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}
function firstText(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = textValue(record[key]);
    if (value) return value;
  }
  return "";
}
function nestedName(value: unknown) {
  if (typeof value === "string") return textValue(value);
  const record = asRecord(value);
  return firstText(record, [
    "name_ar",
    "name",
    "full_name",
    "display_name",
    "title",
    "code",
  ]);
}
function patientName(record: ApiRecord) {
  const direct = firstText(record, [
    "full_name",
    "name",
    "patient_name",
    "name_ar",
    "display_name",
  ]);
  if (direct) return direct;
  const first = firstText(record, ["first_name", "first_name_ar"]);
  const middle = firstText(record, ["middle_name", "middle_name_ar"]);
  const last = firstText(record, ["last_name", "last_name_ar"]);
  return [first, middle, last].filter(Boolean).join(" ");
}
function normalizePatient(value: unknown): PatientRow {
  const record = asRecord(value);
  return {
    id: firstText(record, ["id", "patient_id"]),
    name: patientName(record),
    number: firstText(record, [
      "patient_number",
      "medical_record_number",
      "code",
      "number",
    ]),
    identity: firstText(record, [
      "national_id",
      "identity_number",
      "id_number",
      "iqama_number",
    ]),
    mobile: firstText(record, [
      "mobile",
      "phone",
      "phone_number",
      "mobile_number",
    ]),
    branch:
      nestedName(record.registration_branch) ||
      nestedName(record.branch) ||
      firstText(record, ["registration_branch_name", "branch_name"]),
    branchId:
      firstText(record, ["registration_branch_id", "branch_id"]) ||
      firstText(asRecord(record.registration_branch), ["id"]),
    gender: firstText(record, ["gender"]),
    registeredAt: firstText(record, ["registered_at", "created_at"]),
    status: firstText(record, ["status", "is_active"]),
    raw: record,
  };
}
function extractPatients(payload: unknown) {
  if (Array.isArray(payload)) return payload.map(normalizePatient);
  const record = asRecord(payload);
  const candidates = [
    record.patients,
    record.items,
    record.results,
    record.records,
    record.data,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(normalizePatient).filter((item) => item.id);
    }
  }
  return [];
}
function normalizeSection(value: unknown): MedicalSection {
  const record = asRecord(value);
  const items = Array.isArray(record.items)
    ? record.items.map(asRecord)
    : [];
  return {
    count: numberValue(record.count) || items.length,
    items,
  };
}
function emptySummary(): MedicalSummary {
  return {
    appointments_total: 0,
    upcoming_appointments: 0,
    encounters_total: 0,
    open_encounters: 0,
    diagnoses_total: 0,
    primary_diagnoses: 0,
    procedures_total: 0,
    completed_procedures: 0,
    referrals_total: 0,
    active_referrals: 0,
    record_access_total: 0,
    effective_record_access: 0,
    total_clinical_records: 0,
    next_appointment_at: null,
    latest_encounter_at: null,
  };
}
function normalizeMedicalFile(payload: unknown): MedicalFile {
  const response = asRecord(payload);
  const source = asRecord(
    response.medical_file ?? response.item ?? response,
  );
  const summarySource = asRecord(source.summary);
  const sectionsSource = asRecord(source.sections);
  return {
    patient: asRecord(source.patient),
    summary: {
      appointments_total: numberValue(summarySource.appointments_total),
      upcoming_appointments: numberValue(summarySource.upcoming_appointments),
      encounters_total: numberValue(summarySource.encounters_total),
      open_encounters: numberValue(summarySource.open_encounters),
      diagnoses_total: numberValue(summarySource.diagnoses_total),
      primary_diagnoses: numberValue(summarySource.primary_diagnoses),
      procedures_total: numberValue(summarySource.procedures_total),
      completed_procedures: numberValue(summarySource.completed_procedures),
      referrals_total: numberValue(summarySource.referrals_total),
      active_referrals: numberValue(summarySource.active_referrals),
      record_access_total: numberValue(summarySource.record_access_total),
      effective_record_access: numberValue(
        summarySource.effective_record_access,
      ),
      total_clinical_records: numberValue(
        summarySource.total_clinical_records,
      ),
      next_appointment_at:
        textValue(summarySource.next_appointment_at) || null,
      latest_encounter_at:
        textValue(summarySource.latest_encounter_at) || null,
    },
    sections: {
      appointments: normalizeSection(sectionsSource.appointments),
      encounters: normalizeSection(sectionsSource.encounters),
      diagnoses: normalizeSection(sectionsSource.diagnoses),
      procedures: normalizeSection(sectionsSource.procedures),
      referrals: normalizeSection(sectionsSource.referrals),
      record_access: normalizeSection(sectionsSource.record_access),
    },
    generated_at: textValue(source.generated_at) || null,
  };
}
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en"
    ? "en"
    : "ar";
}
function getApiBaseUrl() {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return base.endsWith("/api") ? base.slice(0, -4) : base;
}
function makeApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}
async function fetchJson(path: string, signal?: AbortSignal) {
  const response = await fetch(makeApiUrl(path), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
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
    const record = asRecord(payload);
    throw new Error(
      firstText(record, ["message", "detail", "error"]) ||
        `HTTP ${response.status}`,
    );
  }
  return payload;
}
function formatDateTime(value: unknown) {
  const text = textValue(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return toEnglishDigits(text).replace("T", " ").slice(0, 16);
  }
  return date.toISOString().replace("T", " ").slice(0, 16);
}
function escapeHtml(value: unknown) {
  return textValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function fieldLabel(key: string, locale: Locale) {
  const known = fieldLabels[key];
  if (known) return known[locale];
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function displayValue(
  value: unknown,
  locale: Locale,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value
      ? translations[locale].yes
      : translations[locale].no;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => displayValue(item, locale))
      .filter((item) => item !== "—")
      .join("، ") || "—";
  }
  if (isRecord(value)) {
    return (
      nestedName(value) ||
      firstText(value, ["value", "label", "code"]) ||
      "—"
    );
  }
  const text = textValue(value);
  if (
    /^\d{4}-\d{2}-\d{2}T/.test(text) ||
    /^\d{4}-\d{2}-\d{2}\s/.test(text)
  ) {
    return formatDateTime(text);
  }
  return text || "—";
}
function sectionColumns(
  section: SectionKey,
  rows: ApiRecord[],
) {
  if (!rows.length) return [];
  const first = rows[0];
  const selected: string[] = [];
  for (const key of preferredColumns[section]) {
    if (key in first && !hiddenRecordKeys.has(key)) {
      selected.push(key);
    }
  }
  for (const key of Object.keys(first)) {
    if (
      selected.length >= 7 ||
      selected.includes(key) ||
      hiddenRecordKeys.has(key)
    ) {
      continue;
    }
    selected.push(key);
  }
  return selected.slice(0, 7);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}
function StatusBadge({
  value,
}: {
  value: string;
}) {
  const normalized = value.toLowerCase();
  const active = [
    "active",
    "completed",
    "confirmed",
    "open",
    "effective",
    "true",
  ].includes(normalized);
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      {value || "—"}
    </Badge>
  );
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
export default function MedicalRecordsClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [patients, setPatients] = React.useState<PatientRow[]>([]);
  const [selectedPatientId, setSelectedPatientId] = React.useState("");
  const [medicalFile, setMedicalFile] =
    React.useState<MedicalFile | null>(null);
  const [patientSearch, setPatientSearch] = React.useState("");
  const [patientStatusFilter, setPatientStatusFilter] =
    React.useState("all");
  const [patientGenderFilter, setPatientGenderFilter] =
    React.useState("all");
  const [patientBranchFilter, setPatientBranchFilter] =
    React.useState("all");
  const [registeredFrom, setRegisteredFrom] =
    React.useState<Date | undefined>();
  const [registeredTo, setRegisteredTo] =
    React.useState<Date | undefined>();
  const [patientSort, setPatientSort] =
    React.useState<"newest" | "oldest">("newest");
  const [recordSearch, setRecordSearch] = React.useState("");
  const [section, setSection] =
    React.useState<SectionKey>("appointments");
  const [loadingPatients, setLoadingPatients] = React.useState(true);
  const [loadingFile, setLoadingFile] = React.useState(false);
  const [error, setError] = React.useState("");
  const t = translations[locale];
  React.useEffect(() => {
    const syncLocale = () => setLocale(getInitialLocale());
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("primey-locale-change", syncLocale);
    const timer = window.setInterval(syncLocale, 750);
    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("primey-locale-change", syncLocale);
      window.clearInterval(timer);
    };
  }, []);
  const loadPatients = React.useCallback(async () => {
    const controller = new AbortController();
    setLoadingPatients(true);
    setError("");
    try {
      const payload = await fetchJson(
        "/api/company/medical/patients/",
        controller.signal,
      );
      const nextPatients = extractPatients(payload);
      setPatients(nextPatients);
      setSelectedPatientId((current) => {
        if (
          current &&
          nextPatients.some((patient) => patient.id === current)
        ) {
          return current;
        }
        return nextPatients[0]?.id || "";
      });
      if (!nextPatients.length) {
        setMedicalFile(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t.loadError,
      );
    } finally {
      setLoadingPatients(false);
    }
    return () => controller.abort();
  }, [t.loadError]);
  const loadMedicalFile = React.useCallback(
    async (patientId: string) => {
      if (!patientId) {
        setMedicalFile(null);
        return;
      }
      const controller = new AbortController();
      setLoadingFile(true);
      setError("");
      try {
        const payload = await fetchJson(
          `/api/company/medical/patients/${patientId}/medical-file/`,
          controller.signal,
        );
        setMedicalFile(normalizeMedicalFile(payload));
      } catch (loadError) {
        setMedicalFile(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t.loadError,
        );
      } finally {
        setLoadingFile(false);
      }
      return () => controller.abort();
    },
    [t.loadError],
  );
  React.useEffect(() => {
    void loadPatients();
  }, [loadPatients]);
  React.useEffect(() => {
    if (selectedPatientId) {
      void loadMedicalFile(selectedPatientId);
    }
  }, [loadMedicalFile, selectedPatientId]);
  const filteredPatients = React.useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    return patients
      .filter((patient) => {
        if (
          patientStatusFilter !== "all" &&
          patient.status !== patientStatusFilter
        ) {
          return false;
        }
        if (
          patientGenderFilter !== "all" &&
          patient.gender !== patientGenderFilter
        ) {
          return false;
        }
        const branchKey =
          patient.branchId ||
          patient.branch ||
          "none";
        if (
          patientBranchFilter !== "all" &&
          branchKey !== patientBranchFilter
        ) {
          return false;
        }
        if (registeredFrom || registeredTo) {
          const registeredTime = patient.registeredAt
            ? new Date(patient.registeredAt).getTime()
            : Number.NaN;
          if (Number.isNaN(registeredTime)) return false;
          if (
            registeredFrom &&
            registeredTime < startOfDay(registeredFrom)
          ) {
            return false;
          }
          if (
            registeredTo &&
            registeredTime > endOfDay(registeredTo)
          ) {
            return false;
          }
        }
        if (!query) return true;
        return [
          patient.name,
          patient.number,
          patient.identity,
          patient.mobile,
          patient.branch,
          patient.gender,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => {
        const firstTime = first.registeredAt
          ? new Date(first.registeredAt).getTime()
          : 0;
        const secondTime = second.registeredAt
          ? new Date(second.registeredAt).getTime()
          : 0;
        return patientSort === "newest"
          ? secondTime - firstTime
          : firstTime - secondTime;
      });
  }, [
    patientBranchFilter,
    patientGenderFilter,
    patientSearch,
    patientSort,
    patientStatusFilter,
    patients,
    registeredFrom,
    registeredTo,
  ]);
  const branchOptions = React.useMemo(() => {
    const values = new Map<string, string>();
    for (const patient of patients) {
      const key =
        patient.branchId ||
        patient.branch ||
        "none";
      const label =
        patient.branch ||
        (locale === "ar" ? "بدون فرع محدد" : "No branch");
      if (!values.has(key)) {
        values.set(key, label);
      }
    }
    return Array.from(values.entries()).map(
      ([value, label]) => ({
        value,
        label,
      }),
    );
  }, [locale, patients]);
  const hasPatientFilters = Boolean(
    patientSearch ||
      patientStatusFilter !== "all" ||
      patientGenderFilter !== "all" ||
      patientBranchFilter !== "all" ||
      registeredFrom ||
      registeredTo ||
      patientSort !== "newest",
  );
  const resetPatientFilters = () => {
    setPatientSearch("");
    setPatientStatusFilter("all");
    setPatientGenderFilter("all");
    setPatientBranchFilter("all");
    setRegisteredFrom(undefined);
    setRegisteredTo(undefined);
    setPatientSort("newest");
  };
  const selectedPatient = React.useMemo(
    () =>
      patients.find(
        (patient) => patient.id === selectedPatientId,
      ) || null,
    [patients, selectedPatientId],
  );
  const currentSection =
    medicalFile?.sections[section] || {
      count: 0,
      items: [],
    };
  const columns = React.useMemo(
    () => sectionColumns(section, currentSection.items),
    [currentSection.items, section],
  );
  const filteredRecords = React.useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    if (!query) return currentSection.items;
    return currentSection.items.filter((row) =>
      columns
        .map((key) => displayValue(row[key], locale))
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [
    columns,
    currentSection.items,
    locale,
    recordSearch,
  ]);
  const sectionName = React.useCallback(
    (key: SectionKey) => {
      const names: Record<SectionKey, string> = {
        appointments: t.appointments,
        encounters: t.encounters,
        diagnoses: t.diagnoses,
        procedures: t.procedures,
        referrals: t.referrals,
        record_access: t.recordAccess,
      };
      return names[key];
    },
    [t],
  );
  const refresh = async () => {
    await loadPatients();
    if (selectedPatientId) {
      await loadMedicalFile(selectedPatientId);
    }
    toast.success(t.refresh);
  };
  const exportExcel = () => {
    if (!filteredRecords.length) {
      toast.info(t.emptyExport);
      return;
    }
    const header = columns
      .map(
        (key) =>
          `<th>${escapeHtml(fieldLabel(key, locale))}</th>`,
      )
      .join("");
    const rows = filteredRecords
      .map(
        (row) =>
          `<tr>${columns
            .map(
              (key) =>
                `<td>${escapeHtml(
                  displayValue(row[key], locale),
                )}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <table border="1">
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download =
      `marilyn-medical-file-${selectedPatientId}-${section}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    toast.success(t.exportReady);
  };
  const printCurrentSection = async () => {
    if (!filteredRecords.length) {
      toast.info(t.emptyPrint);
      return;
    }
    const header = columns
      .map(
        (key) =>
          `<th>${escapeHtml(fieldLabel(key, locale))}</th>`,
      )
      .join("");
    const rows = filteredRecords
      .map(
        (row) =>
          `<tr>${columns
            .map(
              (key) =>
                `<td>${escapeHtml(
                  displayValue(row[key], locale),
                )}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const tableHtml = `
      <table>
        <thead>
          <tr>${header}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: [
        selectedPatient?.name,
        `${t.section}: ${sectionName(section)}`,
      ]
        .filter(Boolean)
        .join(" — "),
      tableHtml,
      recordsCount: filteredRecords.length,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  };
  const summary =
    medicalFile?.summary || emptySummary();
  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#9a7139]">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            {t.subtitle}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            {t.connected}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className={registerOutlineButtonClass}
            onClick={() => void refresh()}
            disabled={loadingPatients || loadingFile}
          >
            {loadingPatients || loadingFile ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t.refresh}
          </Button>
          <Button
            variant="outline"
            className={registerOutlineButtonClass}
            onClick={exportExcel}
          >
            <FileSpreadsheet className="size-4" />
            {t.excel}
          </Button>
          <Button
            variant="brand"
            className={registerBrandButtonClass}
            onClick={() => void printCurrentSection()}
          >
            <Printer className="size-4" />
            {t.print}
          </Button>
          <Button variant="brand" className={registerBrandButtonClass} asChild>
            <Link href="/system/patients">
              <UserRound className="size-4" />
              {t.addPatient}
            </Link>
          </Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SystemKpiCard
          title={t.totalPatients}
          value={patients.length}
          description={t.totalPatientsDesc}
          icon={Users}
        />
        <SystemKpiCard
          title={t.totalRecords}
          value={summary.total_clinical_records}
          description={t.totalRecordsDesc}
          icon={FileText}
        />
        <SystemKpiCard
          title={t.openEncounters}
          value={summary.open_encounters}
          description={t.openEncountersDesc}
          icon={Stethoscope}
        />
        <SystemKpiCard
          title={t.activeReferrals}
          value={summary.active_referrals}
          description={t.activeReferralsDesc}
          icon={Activity}
        />
      </section>

      <PatientCenterTabs
        active="medical-records"
        locale={locale}
        counts={{
          patients:
            patients.length,
          "medical-records":
            summary.total_clinical_records,
          "record-access":
            summary.record_access_total,
        }}
      />
      {error ? (
        <Card className="mb-4 border-red-200 bg-red-50/70">
          <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
            <ShieldCheck className="size-8 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-900">
                {t.loadError}
              </h2>
              <p
                dir="ltr"
                className="mt-1 text-sm text-red-700"
              >
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() => void refresh()}
            >
              <RotateCcw className="size-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
        <CardHeader className="px-5 pt-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                <FileText className="h-4 w-4 text-[#a57b3d]" />
                {t.patientRegister}
              </CardTitle>
              <CardDescription className="mt-1 leading-6">
                {t.patientRegisterDesc}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={exportExcel}
              >
                <FileSpreadsheet className="size-4" />
                {t.excel}
              </Button>
              <Button
                variant="brand"
                className={registerBrandButtonClass}
                onClick={() => void printCurrentSection()}
              >
                <Printer className="size-4" />
                {t.print}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
          <DataRegisterToolbar className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <DataRegisterSearch
                value={patientSearch}
                onChange={setPatientSearch}
                placeholder={t.searchPatients}
                className="w-full sm:w-[360px]"
              />
              <Select
                value={patientStatusFilter}
                onValueChange={setPatientStatusFilter}
              >
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[145px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allStatuses}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {locale === "ar" ? "نشط" : "Active"}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {locale === "ar" ? "غير نشط" : "Inactive"}
                  </SelectItem>
                  <SelectItem value="BLOCKED">
                    {locale === "ar" ? "محظور" : "Blocked"}
                  </SelectItem>
                  <SelectItem value="DECEASED">
                    {locale === "ar" ? "متوفى" : "Deceased"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={patientGenderFilter}
                onValueChange={setPatientGenderFilter}
              >
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allGenders}
                  </SelectItem>
                  <SelectItem value="MALE">
                    {locale === "ar" ? "ذكر" : "Male"}
                  </SelectItem>
                  <SelectItem value="FEMALE">
                    {locale === "ar" ? "أنثى" : "Female"}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {locale === "ar" ? "آخر" : "Other"}
                  </SelectItem>
                  <SelectItem value="UNSPECIFIED">
                    {locale === "ar" ? "غير محدد" : "Unspecified"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={patientBranchFilter}
                onValueChange={setPatientBranchFilter}
              >
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                  <SelectItem value="all">
                    {t.allBranches}
                  </SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem
                      key={branch.value}
                      value={branch.value}
                    >
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                            <DateRegisterFilter
                label={t.registeredFrom}
                value={registeredFrom}
                onChange={setRegisteredFrom}
                locale={locale}
              />
                            <DateRegisterFilter
                label={t.registeredTo}
                value={registeredTo}
                onChange={setRegisteredTo}
                locale={locale}
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Select
                value={patientSort}
                onValueChange={(value) =>
                  setPatientSort(
                    value as "newest" | "oldest",
                  )
                }
              >
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {t.newestPatients}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {t.oldestPatients}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-9 bg-background shadow-none"
                onClick={resetPatientFilters}
                disabled={!hasPatientFilters}
              >
                <RefreshCw className="size-4" />
                {t.reset}
              </Button>
            </div>
          </DataRegisterToolbar>
          {loadingPatients ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table
                variant="register"
                layout="fixed"
                minWidth="1320px"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead sticky="start" className="w-[250px]">
                      {t.patient}
                    </TableHead>
                    <TableHead className="w-[145px]">
                      {t.patientNumber}
                    </TableHead>
                    <TableHead className="w-[180px]">
                      {t.identity}
                    </TableHead>
                    <TableHead className="w-[190px]">
                      {t.mobile}
                    </TableHead>
                    <TableHead className="w-[110px]">
                      {t.gender}
                    </TableHead>
                    <TableHead className="w-[180px]">
                      {t.branch}
                    </TableHead>
                    <TableHead className="w-[155px]">
                      {t.registeredAt}
                    </TableHead>
                    <TableHead className="w-[120px]">
                      {t.status}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      data-state={
                        patient.id === selectedPatientId
                          ? "selected"
                          : undefined
                      }
                      interactive
                      className="group"
                      onClick={() =>
                        setSelectedPatientId(patient.id)
                      }
                    >
                      <TableCell sticky="start">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dccdb8] bg-[#fbf7ef] text-[#a57b3d]">
                            <UserRound className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {patient.name || t.unknown}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {patient.mobile ||
                                patient.number ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {patient.number || "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {patient.identity || "—"}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className="text-end tabular-nums"
                      >
                        {patient.mobile || "—"}
                      </TableCell>
                      <TableCell>
                        {patient.gender || "—"}
                      </TableCell>
                      <TableCell>
                        {patient.branch || "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateTime(patient.registeredAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={patient.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filteredPatients.length ? (
                <div className="py-2">
                  <DataRegisterEmptyState
                    title={
                      patients.length
                        ? t.noMatchingPatients
                        : t.noPatientsTitle
                    }
                    description={t.noPatientsDesc}
                    showReset={hasPatientFilters}
                    onReset={resetPatientFilters}
                    resetLabel={t.reset}
                  />
                  {!patients.length ? (
                    <div className="flex justify-center pb-5">
                      <Button
                        variant="brand"
                        className={registerBrandButtonClass}
                        asChild
                      >
                        <Link href="/system/patients">
                          <UserRound className="size-4" />
                          {t.addPatient}
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
      {selectedPatientId ? (
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>
                  {t.fileSummary}
                  {selectedPatient?.name
                    ? ` — ${selectedPatient.name}`
                    : ""}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.fileSummaryDesc}
                </CardDescription>
                {medicalFile ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      <CalendarClock className="me-1 size-3" />
                      {t.nextAppointment}:{" "}
                      {formatDateTime(
                        medicalFile.summary.next_appointment_at,
                      )}
                    </Badge>
                    <Badge variant="outline">
                      <Stethoscope className="me-1 size-3" />
                      {t.latestEncounter}:{" "}
                      {formatDateTime(
                        medicalFile.summary.latest_encounter_at,
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {t.generatedAt}:{" "}
                      {formatDateTime(medicalFile.generated_at)}
                    </Badge>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {sectionKeys.map((key) => (
                  <Button
                    key={key}
                    variant={
                      section === key
                        ? "brand"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setSection(key);
                      setRecordSearch("");
                    }}
                  >
                    {key === "appointments" ? (
                      <CalendarClock className="size-4" />
                    ) : key === "encounters" ? (
                      <Stethoscope className="size-4" />
                    ) : key === "diagnoses" ? (
                      <ClipboardList className="size-4" />
                    ) : key === "procedures" ? (
                      <Activity className="size-4" />
                    ) : key === "referrals" ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    {sectionName(key)}
                    <span className="tabular-nums">
                      {medicalFile?.sections[key].count || 0}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5 sm:px-6">
            {loadingFile ? (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : medicalFile ? (
              <>
                <DataRegisterToolbar className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <DataRegisterSearch
                    value={recordSearch}
                    onChange={setRecordSearch}
                    placeholder={t.searchRecords}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    variant="outline"
                    className={registerOutlineButtonClass}
                    onClick={() => setRecordSearch("")}
                    disabled={!recordSearch}
                  >
                    <RotateCcw className="size-4" />
                    {t.reset}
                  </Button>
                </DataRegisterToolbar>
                <div className="overflow-x-auto rounded-lg border bg-background">
                  <Table
                    variant="register"
                    layout="fixed"
                    minWidth="1120px"
                  >
                    <TableHeader>
                      <TableRow>
                        {columns.map((key) => (
                          <TableHead key={key}>
                            {fieldLabel(key, locale)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((row, index) => (
                        <TableRow
                          key={
                            textValue(row.id) ||
                            `${section}-${index}`
                          }
                        >
                          {columns.map((key) => (
                            <TableCell key={key}>
                              {displayValue(row[key], locale)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {!filteredRecords.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={Math.max(columns.length, 1)}
                            className="h-56 text-center"
                          >
                            <DataRegisterEmptyState
                              title={t.noSectionRecords}
                              description={t.fileSummaryDesc}
                              showReset={Boolean(recordSearch)}
                              onReset={() => setRecordSearch("")}
                              resetLabel={t.reset}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                {t.loadingFile}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
      </div>
    </main>
  );
}
