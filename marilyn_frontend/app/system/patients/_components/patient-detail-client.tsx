"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  FileKey2,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type Locale = "ar" | "en";
type Row = Record<string, unknown>;
type Status = "ACTIVE" | "INACTIVE" | "BLOCKED" | "DECEASED";
type Section = "appointments" | "encounters" | "diagnoses" | "procedures" | "referrals" | "record_access";

type Patient = {
  id: number;
  patient_number: string;
  identifier_type: string;
  identifier_number: string;
  full_name: string;
  full_name_ar: string;
  full_name_en: string;
  display_name: string;
  date_of_birth: string | null;
  gender: string;
  nationality: string;
  mobile: string;
  email: string;
  status: string;
  registration_branch: Row | null;
  registered_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

type Summary = {
  total_clinical_records: number;
  upcoming_appointments: number;
  open_encounters: number;
  active_referrals: number;
};

type FileData = {
  patient: Patient;
  summary: Summary;
  sections: Record<Section, { count: number; items: Row[] }>;
};

const SECTIONS: Section[] = [
  "appointments",
  "encounters",
  "diagnoses",
  "procedures",
  "referrals",
  "record_access",
];

const COLUMNS: Record<Section, string[]> = {
  appointments: ["scheduled_start", "scheduled_end", "status", "practitioner_name", "branch_name", "service_name"],
  encounters: ["opened_at", "closed_at", "status", "encounter_type", "practitioner_name", "clinic_name"],
  diagnoses: ["diagnosis_name", "diagnosis_code", "is_primary", "diagnosed_at", "practitioner_name", "notes"],
  procedures: ["procedure_name_snapshot", "procedure_code_snapshot", "status", "quantity", "performed_at", "practitioner_name"],
  referrals: ["referral_number", "referred_at", "status", "priority", "receiving_practitioner_name", "target_clinic_name"],
  record_access: ["scope", "status", "access_starts_at", "access_ends_at", "receiving_practitioner_name", "is_effective"],
};

const LABELS: Record<string, { ar: string; en: string }> = {
  scheduled_start: { ar: "بداية الموعد", en: "Scheduled start" },
  scheduled_end: { ar: "نهاية الموعد", en: "Scheduled end" },
  opened_at: { ar: "وقت الفتح", en: "Opened at" },
  closed_at: { ar: "وقت الإغلاق", en: "Closed at" },
  diagnosed_at: { ar: "تاريخ التشخيص", en: "Diagnosed at" },
  performed_at: { ar: "تاريخ التنفيذ", en: "Performed at" },
  referred_at: { ar: "تاريخ الإحالة", en: "Referred at" },
  access_starts_at: { ar: "بداية الوصول", en: "Access starts" },
  access_ends_at: { ar: "نهاية الوصول", en: "Access ends" },
  status: { ar: "الحالة", en: "Status" },
  practitioner_name: { ar: "الممارس", en: "Practitioner" },
  receiving_practitioner_name: { ar: "الممارس المستلم", en: "Receiving practitioner" },
  branch_name: { ar: "الفرع", en: "Branch" },
  clinic_name: { ar: "العيادة", en: "Clinic" },
  target_clinic_name: { ar: "العيادة المحال إليها", en: "Target clinic" },
  service_name: { ar: "الخدمة", en: "Service" },
  encounter_type: { ar: "نوع المقابلة", en: "Encounter type" },
  diagnosis_name: { ar: "التشخيص", en: "Diagnosis" },
  diagnosis_code: { ar: "كود التشخيص", en: "Diagnosis code" },
  is_primary: { ar: "رئيسي", en: "Primary" },
  procedure_name_snapshot: { ar: "الإجراء", en: "Procedure" },
  procedure_code_snapshot: { ar: "كود الإجراء", en: "Procedure code" },
  referral_number: { ar: "رقم الإحالة", en: "Referral number" },
  quantity: { ar: "الكمية", en: "Quantity" },
  priority: { ar: "الأولوية", en: "Priority" },
  scope: { ar: "النطاق", en: "Scope" },
  is_effective: { ar: "فعّال", en: "Effective" },
  notes: { ar: "ملاحظات", en: "Notes" },
};

const T = {
  ar: {
    badge: "ملف المريض",
    back: "العودة إلى المرضى",
    refresh: "تحديث",
    print: "طباعة الملف",
    medical: "مركز الملفات الطبية",
    subtitle: "بيانات المريض والسجل السريري والمواعيد والتشخيصات والإجراءات والإحالات.",
    total: "إجمالي السجلات السريرية",
    totalDesc: "جميع عناصر الملف الطبي المرتبطة بالمريض",
    upcoming: "المواعيد القادمة",
    upcomingDesc: "مواعيد مستقبلية غير ملغاة أو مكتملة",
    open: "المقابلات المفتوحة",
    openDesc: "مقابلات سريرية لم تُغلق بعد",
    referrals: "الإحالات النشطة",
    referralsDesc: "إحالات طبية لم تصل إلى حالة نهائية",
    identity: "الهوية والبيانات الأساسية",
    contact: "التواصل والبيانات الشخصية",
    registration: "التسجيل والحالة",
    notes: "ملاحظات الملف",
    clinical: "السجل السريري",
    clinicalDesc: "المواعيد والمقابلات والتشخيصات والإجراءات والإحالات وصلاحيات الوصول.",
    number: "رقم المريض",
    idType: "نوع الهوية",
    idNumber: "رقم الهوية",
    birth: "تاريخ الميلاد",
    gender: "النوع",
    nationality: "الجنسية",
    mobile: "الجوال",
    email: "البريد الإلكتروني",
    branch: "فرع التسجيل",
    registered: "تاريخ التسجيل",
    updated: "آخر تحديث",
    status: "الحالة",
    noNotes: "لا توجد ملاحظات مسجلة.",
    appointments: "المواعيد",
    encounters: "المقابلات",
    diagnoses: "التشخيصات",
    procedures: "الإجراءات",
    referralsSection: "الإحالات",
    access: "الوصول إلى السجل",
    search: "ابحث داخل القسم الحالي...",
    reset: "إعادة ضبط",
    empty: "لا توجد سجلات في هذا القسم.",
    emptyDesc: "ستظهر السجلات هنا بعد إنشاء البيانات التشغيلية.",
    error: "تعذر تحميل ملف المريض",
    retry: "إعادة المحاولة",
    refreshed: "تم تحديث ملف المريض.",
    printReady: "تم تجهيز ملف المريض للطباعة.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    changeStatus: "تغيير الحالة",
    confirmTitle: "تأكيد تغيير حالة المريض",
    confirmDesc: "سيتم تحديث الحالة التشغيلية لملف المريض فورًا.",
    cancel: "إلغاء",
    confirm: "تأكيد",
    statusUpdated: "تم تحديث حالة المريض.",
    active: "نشط",
    inactive: "غير نشط",
    blocked: "محظور",
    deceased: "متوفى",
    unknown: "غير محدد",
    yes: "نعم",
    no: "لا",
    report: "ملف المريض الطبي",
  },
  en: {
    badge: "Patient file",
    back: "Back to patients",
    refresh: "Refresh",
    print: "Print file",
    medical: "Medical records center",
    subtitle: "Patient data, clinical records, appointments, diagnoses, procedures, and referrals.",
    total: "Clinical records",
    totalDesc: "All medical-file entries linked to the patient",
    upcoming: "Upcoming appointments",
    upcomingDesc: "Future appointments not cancelled or completed",
    open: "Open encounters",
    openDesc: "Clinical encounters that remain open",
    referrals: "Active referrals",
    referralsDesc: "Medical referrals that are not terminal",
    identity: "Identity and basics",
    contact: "Contact and personal data",
    registration: "Registration and status",
    notes: "File notes",
    clinical: "Clinical register",
    clinicalDesc: "Appointments, encounters, diagnoses, procedures, referrals, and record access.",
    number: "Patient number",
    idType: "Identifier type",
    idNumber: "Identifier number",
    birth: "Date of birth",
    gender: "Gender",
    nationality: "Nationality",
    mobile: "Mobile",
    email: "Email",
    branch: "Registration branch",
    registered: "Registered at",
    updated: "Last updated",
    status: "Status",
    noNotes: "No notes recorded.",
    appointments: "Appointments",
    encounters: "Encounters",
    diagnoses: "Diagnoses",
    procedures: "Procedures",
    referralsSection: "Referrals",
    access: "Record access",
    search: "Search the current section...",
    reset: "Reset",
    empty: "There are no records in this section.",
    emptyDesc: "Records will appear after operational data is created.",
    error: "Unable to load patient file",
    retry: "Retry",
    refreshed: "Patient file refreshed.",
    printReady: "Patient file is ready to print.",
    printBlocked: "The print window could not be opened.",
    changeStatus: "Change status",
    confirmTitle: "Confirm patient status change",
    confirmDesc: "The patient file operational status will be updated immediately.",
    cancel: "Cancel",
    confirm: "Confirm",
    statusUpdated: "Patient status updated.",
    active: "Active",
    inactive: "Inactive",
    blocked: "Blocked",
    deceased: "Deceased",
    unknown: "Unknown",
    yes: "Yes",
    no: "No",
    report: "Patient medical file",
  },
} as const;

function rec(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
}
function txt(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}
function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function arr(value: unknown) {
  return Array.isArray(value) ? value.map(rec) : [];
}
function baseUrl() {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}
function cookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const part = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : "";
}
async function request(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (init.body) headers.set("Content-Type", "application/json");
  const csrf = cookie("csrftoken") || cookie("csrf_token");
  if (csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRFToken", csrf);
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const raw = await response.text();
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const source = rec(payload);
    throw new Error(txt(source.message || source.detail || source.error) || `HTTP ${response.status}`);
  }
  return payload;
}
function patient(value: unknown): Patient {
  const source = rec(value);
  return {
    id: num(source.id),
    patient_number: txt(source.patient_number),
    identifier_type: txt(source.identifier_type),
    identifier_number: txt(source.identifier_number),
    full_name: txt(source.full_name),
    full_name_ar: txt(source.full_name_ar),
    full_name_en: txt(source.full_name_en),
    display_name: txt(source.display_name),
    date_of_birth: txt(source.date_of_birth) || null,
    gender: txt(source.gender),
    nationality: txt(source.nationality),
    mobile: txt(source.mobile),
    email: txt(source.email),
    status: txt(source.status),
    registration_branch: Object.keys(rec(source.registration_branch)).length ? rec(source.registration_branch) : null,
    registered_at: txt(source.registered_at) || null,
    notes: txt(source.notes),
    created_at: txt(source.created_at),
    updated_at: txt(source.updated_at),
  };
}
function normalize(payload: unknown): FileData {
  const response = rec(payload);
  const source = rec(response.medical_file || response.item || response);
  const summary = rec(source.summary);
  const sections = rec(source.sections);
  const section = (key: Section) => {
    const value = rec(sections[key]);
    const items = arr(value.items);
    return { count: num(value.count) || items.length, items };
  };
  return {
    patient: patient(source.patient),
    summary: {
      total_clinical_records: num(summary.total_clinical_records),
      upcoming_appointments: num(summary.upcoming_appointments),
      open_encounters: num(summary.open_encounters),
      active_referrals: num(summary.active_referrals),
    },
    sections: {
      appointments: section("appointments"),
      encounters: section("encounters"),
      diagnoses: section("diagnoses"),
      procedures: section("procedures"),
      referrals: section("referrals"),
      record_access: section("record_access"),
    },
  };
}
function name(item: Patient, locale: Locale) {
  return locale === "ar"
    ? item.full_name_ar || item.display_name || item.full_name || item.full_name_en
    : item.full_name_en || item.display_name || item.full_name || item.full_name_ar;
}
function branch(item: Patient, locale: Locale) {
  const value = item.registration_branch;
  if (!value) return "—";
  return locale === "ar"
    ? txt(value.name_ar || value.name || value.name_en) || "—"
    : txt(value.name_en || value.name || value.name_ar) || "—";
}
function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}
function dateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.replace("T", " ").slice(0, 16);
  return `${date(parsed.toISOString())} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}
function escape(value: unknown) {
  return txt(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function display(value: unknown, locale: Locale): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? T[locale].yes : T[locale].no;
  if (Array.isArray(value)) return value.map((item) => display(item, locale)).join("، ") || "—";
  if (value && typeof value === "object") {
    const source = rec(value);
    return txt(source.name_ar || source.name || source.display_name || source.title || source.code) || "—";
  }
  const result = txt(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(result) ? dateTime(result) : result || "—";
}
function status(value: string, locale: Locale) {
  const t = T[locale];
  const values: Record<string, string> = {
    ACTIVE: t.active,
    INACTIVE: t.inactive,
    BLOCKED: t.blocked,
    DECEASED: t.deceased,
  };
  return values[value] || value || t.unknown;
}
function statusClass(value: string) {
  if (value === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "INACTIVE") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-rose-200 bg-rose-50 text-rose-700";
}
function detail(label: string, value: React.ReactNode, ltr = false) {
  return (
    <div className="rounded-lg border bg-muted/15 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div dir={ltr ? "ltr" : undefined} className="mt-1.5 break-words text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

export default function PatientDetailClient({ patientId }: { patientId: string }) {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [file, setFile] = React.useState<FileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [section, setSection] = React.useState<Section>("appointments");
  const [query, setQuery] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState<Status | null>(null);
  const [savingStatus, setSavingStatus] = React.useState(false);
  const t = T[locale];

  React.useEffect(() => {
    const sync = () => setLocale(document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ar");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    return () => observer.disconnect();
  }, []);

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [patientPayload, medicalPayload] = await Promise.all([
        request(`/api/company/medical/patients/${encodeURIComponent(patientId)}/`),
        request(`/api/company/medical/patients/${encodeURIComponent(patientId)}/medical-file/`),
      ]);
      const next = normalize(medicalPayload);
      const patientResponse = rec(patientPayload);
      const currentPatient = patient(patientResponse.item || patientResponse.patient || patientPayload);
      if (currentPatient.id) next.patient = currentPatient;
      setFile(next);
      if (silent) toast.success(t.refreshed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, t.error, t.refreshed]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const current = file?.sections[section] || { count: 0, items: [] };
  const columns = React.useMemo(() => {
    const first = current.items[0] || {};
    const preferred = COLUMNS[section].filter((key) => key in first);
    return preferred.length ? preferred : Object.keys(first).filter((key) => !["id", "company_id", "patient_id"].includes(key)).slice(0, 7);
  }, [current.items, section]);
  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? current.items.filter((row) => columns.map((key) => display(row[key], locale)).join(" ").toLowerCase().includes(needle))
      : current.items;
  }, [columns, current.items, locale, query]);
  const sectionName = (value: Section) => ({
    appointments: t.appointments,
    encounters: t.encounters,
    diagnoses: t.diagnoses,
    procedures: t.procedures,
    referrals: t.referralsSection,
    record_access: t.access,
  })[value];
  const sectionIcon = (value: Section) => ({
    appointments: CalendarClock,
    encounters: Stethoscope,
    diagnoses: ClipboardList,
    procedures: Activity,
    referrals: FileText,
    record_access: FileKey2,
  })[value];

  async function changeStatus() {
    if (!file || !nextStatus) return;
    setSavingStatus(true);
    try {
      await request(`/api/company/medical/patients/${file.patient.id}/status/`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(t.statusUpdated);
      setNextStatus(null);
      await load(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.error);
    } finally {
      setSavingStatus(false);
    }
  }

  async function printFile() {
    if (!file) return;
    const item = file.patient;
    const profile = [
      [t.number, item.patient_number],
      [t.idType, item.identifier_type],
      [t.idNumber, item.identifier_number],
      [t.birth, date(item.date_of_birth)],
      [t.gender, item.gender],
      [t.nationality, item.nationality],
      [t.mobile, item.mobile],
      [t.email, item.email],
      [t.branch, branch(item, locale)],
      [t.status, status(item.status, locale)],
    ].map(([label, value]) => `<tr><th>${escape(label)}</th><td>${escape(value || "—")}</td></tr>`).join("");
    const header = columns.map((key) => `<th>${escape(LABELS[key]?.[locale] || key.replaceAll("_", " "))}</th>`).join("");
    const body = rows.map((row) => `<tr>${columns.map((key) => `<td>${escape(display(row[key], locale))}</td>`).join("")}</tr>`).join("");
    const opened = await openPrintReport({
      locale,
      title: t.report,
      subtitle: `${name(item, locale)} — ${sectionName(section)}`,
      branchName: branch(item, locale),
      recordsCount: rows.length,
      tableHtml: `<table><tbody>${profile}</tbody></table><h2>${escape(sectionName(section))}</h2><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  }

  if (loading) {
    return (
      <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5">
        <div className="space-y-5">
          <Skeleton className="h-28 w-full rounded-lg" />
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[126px] rounded-lg" />)}
          </section>
          <Skeleton className="h-[520px] w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (error || !file) {
    return (
      <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5">
        <Card className="rounded-lg border-rose-200 shadow-none">
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
            <ShieldCheck className="size-11 text-rose-500" />
            <h1 className="text-xl font-semibold">{t.error}</h1>
            <p dir="ltr" className="text-sm text-muted-foreground">{error || t.error}</p>
            <div className="flex gap-2">
              <Button variant="outline" className={registerOutlineButtonClass} asChild>
                <Link href="/system/patients">
                  {locale === "ar" ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
                  {t.back}
                </Link>
              </Button>
              <Button variant="brand" className={registerBrandButtonClass} onClick={() => void load()}>
                <RefreshCw className="size-4" />
                {t.retry}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const item = file.patient;
  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5">
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-2 gap-2 rounded-full border-[#cbbda9]/55 bg-white/55 px-3 py-1 text-[#8f6a37] shadow-sm dark:bg-white/[0.04]">
              <Sparkles className="size-3.5 text-[#a57b3d]" />
              {t.badge}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{name(item, locale) || t.badge}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline"><CircleUserRound className="me-1 size-3.5" />{item.patient_number || "—"}</Badge>
              <Badge variant="outline" className={statusClass(item.status)}>{status(item.status, locale)}</Badge>
              <Badge variant="outline">{branch(item, locale)}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" className={registerOutlineButtonClass} asChild>
              <Link href="/system/patients">
                {locale === "ar" ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
                {t.back}
              </Link>
            </Button>
            <Button variant="outline" className={registerOutlineButtonClass} onClick={() => void load(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {t.refresh}
            </Button>
            <Button variant="outline" className={registerOutlineButtonClass} asChild>
              <Link href={`/system/patients/medical-records?patient=${item.id}`}>
                <FileText className="size-4" />
                {t.medical}
              </Link>
            </Button>
            <Button variant="brand" className={registerBrandButtonClass} onClick={() => void printFile()}>
              <Printer className="size-4" />
              {t.print}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="brand" className={registerBrandButtonClass}>
                  <UserRoundCheck className="size-4" />
                  {t.changeStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel>{t.changeStatus}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["ACTIVE", "INACTIVE", "BLOCKED", "DECEASED"] as Status[])
                  .filter((value) => value !== item.status)
                  .map((value) => (
                    <DropdownMenuItem key={value} onSelect={() => setNextStatus(value)}>
                      <CheckCircle2 className="size-4" />
                      {status(value, locale)}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard title={t.total} value={file.summary.total_clinical_records} description={t.totalDesc} icon={FileText} />
          <SystemKpiCard title={t.upcoming} value={file.summary.upcoming_appointments} description={t.upcomingDesc} icon={CalendarClock} />
          <SystemKpiCard title={t.open} value={file.summary.open_encounters} description={t.openDesc} icon={Stethoscope} />
          <SystemKpiCard title={t.referrals} value={file.summary.active_referrals} description={t.referralsDesc} icon={Activity} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="rounded-lg shadow-none">
            <CardHeader><CardTitle className="text-base">{t.identity}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {detail(t.number, item.patient_number, true)}
              {detail(t.idType, item.identifier_type)}
              {detail(t.idNumber, item.identifier_number, true)}
              {detail(t.birth, date(item.date_of_birth), true)}
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardHeader><CardTitle className="text-base">{t.contact}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {detail(t.gender, item.gender)}
              {detail(t.nationality, item.nationality)}
              {detail(t.mobile, item.mobile, true)}
              {detail(t.email, item.email, true)}
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardHeader><CardTitle className="text-base">{t.registration}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {detail(t.branch, branch(item, locale))}
              {detail(t.status, <Badge variant="outline" className={statusClass(item.status)}>{status(item.status, locale)}</Badge>)}
              {detail(t.registered, dateTime(item.registered_at), true)}
              {detail(t.updated, dateTime(item.updated_at), true)}
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-lg shadow-none">
          <CardHeader><CardTitle className="text-base">{t.notes}</CardTitle></CardHeader>
          <CardContent><div className="min-h-20 whitespace-pre-wrap rounded-lg border bg-muted/15 px-4 py-3 text-sm leading-7">{item.notes || t.noNotes}</div></CardContent>
        </Card>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-base">{t.clinical}</CardTitle>
                <CardDescription className="mt-1 leading-6">{t.clinicalDesc}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SECTIONS.map((value) => {
                  const Icon = sectionIcon(value);
                  return (
                    <Button
                      key={value}
                      variant={section === value ? "brand" : "outline"}
                      size="sm"
                      className={section === value ? registerBrandButtonClass : registerOutlineButtonClass}
                      onClick={() => {
                        setSection(value);
                        setQuery("");
                      }}
                    >
                      <Icon className="size-4" />
                      {sectionName(value)}
                      <span dir="ltr" className="tabular-nums">{file.sections[value].count}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <DataRegisterSearch value={query} onChange={setQuery} placeholder={t.search} className="min-w-0 flex-1" />
              <Button variant="outline" className={registerOutlineButtonClass} onClick={() => setQuery("")} disabled={!query}>
                <RotateCcw className="size-4" />
                {t.reset}
              </Button>
            </DataRegisterToolbar>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table variant="register" layout="fixed" minWidth="1120px">
                <TableHeader><TableRow>{columns.map((key) => <TableHead key={key}>{LABELS[key]?.[locale] || key.replaceAll("_", " ")}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={txt(row.id) || `${section}-${index}`}>
                      {columns.map((key) => <TableCell key={key}>{display(row[key], locale)}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!rows.length ? (
                <div className="py-2">
                  <DataRegisterEmptyState title={t.empty} description={t.emptyDesc} showReset={Boolean(query)} onReset={() => setQuery("")} resetLabel={t.reset} />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(nextStatus)} onOpenChange={(open) => !open && !savingStatus && setNextStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-end">
            <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDesc}{nextStatus ? ` ${name(item, locale)} — ${status(nextStatus, locale)}` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingStatus}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void changeStatus(); }} disabled={savingStatus}>
              {savingStatus ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
