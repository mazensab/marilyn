"use client";
// patients_center_hr_spirit=true

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Ban,
  CheckCircle2,
  CircleUserRound,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DropdownMenuLabel,
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
type PatientStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "DECEASED";
type Gender = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
type IdentifierType = "NATIONAL_ID" | "IQAMA" | "PASSPORT" | "OTHER" | "UNSPECIFIED";

type Branch = {
  id: number;
  code?: string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  display_name?: string;
};

type PatientBranch = {
  id?: number;
  code?: string;
  name?: string;
  name_ar?: string;
  name_en?: string;
};

type Patient = {
  id: number;
  patient_number: string;
  identifier_type: IdentifierType | string;
  identifier_number: string;
  full_name: string;
  full_name_ar: string;
  full_name_en: string;
  display_name: string;
  date_of_birth: string | null;
  gender: Gender | string;
  nationality: string;
  mobile: string;
  email: string;
  status: PatientStatus | string;
  registration_branch_id: number | null;
  registration_branch: PatientBranch | null;
  registered_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

type PatientForm = {
  patientNumber: string;
  identifierType: IdentifierType;
  identifierNumber: string;
  fullName: string;
  fullNameAr: string;
  fullNameEn: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  mobile: string;
  email: string;
  registrationBranchId: string;
  notes: string;
};

type PendingStatus = {
  patient: Patient;
  nextStatus: PatientStatus;
} | null;

const EMPTY_FORM: PatientForm = {
  patientNumber: "",
  identifierType: "UNSPECIFIED",
  identifierNumber: "",
  fullName: "",
  fullNameAr: "",
  fullNameEn: "",
  dateOfBirth: "",
  gender: "UNSPECIFIED",
  nationality: "",
  mobile: "",
  email: "",
  registrationBranchId: "none",
  notes: "",
};

const API = {
  patients: "/api/company/medical/patients/",
  branches: "/api/company/branches/",
};

const TEXT = {
  ar: {
    badge: "الإدارة المركزية",
    title: "مركز المرضى",
    subtitle: "إدارة ملفات المرضى وبيانات التسجيل والفروع والحالة التشغيلية.",
    connected: "متصل بواجهات ملفات المرضى الحقيقية",
    tabs: {
      patients: "ملفات المرضى",
      medicalRecords: "الملفات الطبية",
      recordAccess: "الوصول إلى السجلات",
    },
    refresh: "تحديث",
    add: "إضافة مريض",
    print: "طباعة",
    excel: "Excel",
    total: "إجمالي المرضى",
    active: "المرضى النشطون",
    inactive: "غير النشطين",
    restricted: "محظورون أو متوفون",
    totalDesc: "جميع ملفات المرضى المسجلة",
    activeDesc: "ملفات متاحة للتشغيل والمتابعة",
    inactiveDesc: "ملفات موقوفة مؤقتًا",
    restrictedDesc: "ملفات مقيدة أو منتهية المتابعة",
    registerTitle: "سجل المرضى",
    registerDesc: "قائمة موحدة لملفات المرضى مع البحث والتصفية والإجراءات التشغيلية.",
    search: "ابحث بالاسم أو رقم المريض أو الهوية أو الجوال...",
    allStatuses: "كل الحالات",
    allGenders: "كل الأنواع",
    allBranches: "كل الفروع",
    newest: "الأحدث تسجيلًا",
    oldest: "الأقدم تسجيلًا",
    registeredFrom: "من تاريخ التسجيل",
    registeredTo: "إلى تاريخ التسجيل",
    reset: "إعادة ضبط",
    patient: "المريض",
    number: "رقم المريض",
    identifier: "الهوية",
    contact: "التواصل",
    gender: "النوع",
    branch: "الفرع",
    registeredAt: "تاريخ التسجيل",
    status: "الحالة",
    actions: "الإجراءات",
    noPatients: "لا توجد ملفات مرضى مسجلة حتى الآن.",
    noResults: "لا توجد نتائج مطابقة للفلاتر الحالية.",
    addFirst: "إضافة أول مريض",
    details: "فتح ملف المريض",
    edit: "تعديل الملف",
    medicalFile: "فتح الملف الطبي",
    changeStatus: "تغيير الحالة",
    createTitle: "إضافة مريض جديد",
    createDesc: "أدخل بيانات المريض الأساسية. يُنشأ رقم المريض تلقائيًا عند تركه فارغًا.",
    editTitle: "تعديل ملف المريض",
    editDesc: "حدّث بيانات التسجيل والتواصل والفرع دون تغيير نطاق المنشأة.",
    patientNumber: "رقم المريض",
    optionalAuto: "اختياري — يُنشأ تلقائيًا",
    fullName: "الاسم الكامل",
    fullNameAr: "الاسم بالعربية",
    fullNameEn: "الاسم بالإنجليزية",
    identifierType: "نوع الهوية",
    identifierNumber: "رقم الهوية",
    dateOfBirth: "تاريخ الميلاد",
    nationality: "الجنسية",
    mobile: "رقم الجوال",
    email: "البريد الإلكتروني",
    registrationBranch: "فرع التسجيل",
    notes: "ملاحظات",
    choose: "اختر",
    noBranch: "بدون فرع محدد",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    statusConfirmTitle: "تأكيد تغيير حالة المريض",
    statusConfirmDesc: "سيتم تحديث الحالة التشغيلية لهذا الملف فورًا.",
    confirm: "تأكيد",
    loadingError: "تعذر تحميل سجل المرضى",
    retry: "إعادة المحاولة",
    created: "تمت إضافة المريض بنجاح.",
    updated: "تم تحديث ملف المريض بنجاح.",
    statusUpdated: "تم تحديث حالة المريض.",
    printBlocked: "تعذر فتح نافذة الطباعة.",
    printReady: "تم تجهيز تقرير المرضى للطباعة.",
    excelReady: "تم تجهيز ملف Excel.",
    requiredName: "الاسم الكامل مطلوب.",
    statusLabels: {
      ACTIVE: "نشط",
      INACTIVE: "غير نشط",
      BLOCKED: "محظور",
      DECEASED: "متوفى",
    },
    genderLabels: {
      MALE: "ذكر",
      FEMALE: "أنثى",
      OTHER: "آخر",
      UNSPECIFIED: "غير محدد",
    },
    identifierLabels: {
      NATIONAL_ID: "هوية وطنية",
      IQAMA: "إقامة",
      PASSPORT: "جواز سفر",
      OTHER: "أخرى",
      UNSPECIFIED: "غير محدد",
    },
  },
  en: {
    badge: "Central administration",
    title: "Patient center",
    subtitle: "Manage patient records, registration data, branches, and operational status.",
    connected: "Connected to live patient APIs",
    tabs: {
      patients: "Patient records",
      medicalRecords: "Medical files",
      recordAccess: "Record access",
    },
    refresh: "Refresh",
    add: "Add patient",
    print: "Print",
    excel: "Excel",
    total: "Total patients",
    active: "Active patients",
    inactive: "Inactive patients",
    restricted: "Blocked or deceased",
    totalDesc: "All registered patient records",
    activeDesc: "Records available for operations",
    inactiveDesc: "Temporarily inactive records",
    restrictedDesc: "Restricted or closed records",
    registerTitle: "Patient register",
    registerDesc: "A unified patient register with search, filters, and operational actions.",
    search: "Search by name, patient number, ID, or mobile...",
    allStatuses: "All statuses",
    allGenders: "All genders",
    allBranches: "All branches",
    newest: "Newest first",
    oldest: "Oldest first",
    registeredFrom: "Registered from",
    registeredTo: "Registered to",
    reset: "Reset",
    patient: "Patient",
    number: "Patient no.",
    identifier: "Identifier",
    contact: "Contact",
    gender: "Gender",
    branch: "Branch",
    registeredAt: "Registered",
    status: "Status",
    actions: "Actions",
    noPatients: "No patient records have been registered yet.",
    noResults: "No records match the current filters.",
    addFirst: "Add first patient",
    details: "Open patient file",
    edit: "Edit record",
    medicalFile: "Open medical file",
    changeStatus: "Change status",
    createTitle: "Add patient",
    createDesc: "Enter the patient's basic data. A patient number is generated when left blank.",
    editTitle: "Edit patient record",
    editDesc: "Update registration, contact, and branch data without changing organization scope.",
    patientNumber: "Patient number",
    optionalAuto: "Optional — generated automatically",
    fullName: "Full name",
    fullNameAr: "Arabic name",
    fullNameEn: "English name",
    identifierType: "Identifier type",
    identifierNumber: "Identifier number",
    dateOfBirth: "Date of birth",
    nationality: "Nationality",
    mobile: "Mobile",
    email: "Email",
    registrationBranch: "Registration branch",
    notes: "Notes",
    choose: "Choose",
    noBranch: "No branch selected",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    statusConfirmTitle: "Confirm patient status change",
    statusConfirmDesc: "The operational status of this record will be updated immediately.",
    confirm: "Confirm",
    loadingError: "Unable to load patient register",
    retry: "Retry",
    created: "Patient created successfully.",
    updated: "Patient record updated successfully.",
    statusUpdated: "Patient status updated.",
    printBlocked: "The print window could not be opened.",
    printReady: "Patient report is ready to print.",
    excelReady: "Excel file is ready.",
    requiredName: "Full name is required.",
    statusLabels: {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      BLOCKED: "Blocked",
      DECEASED: "Deceased",
    },
    genderLabels: {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      UNSPECIFIED: "Unspecified",
    },
    identifierLabels: {
      NATIONAL_ID: "National ID",
      IQAMA: "Iqama",
      PASSPORT: "Passport",
      OTHER: "Other",
      UNSPECIFIED: "Unspecified",
    },
  },
} as const;

function useLocale(): Locale {
  const [locale, setLocale] = React.useState<Locale>("ar");

  React.useEffect(() => {
    const sync = () => {
      const language = document.documentElement.lang.toLowerCase();
      setLocale(language.startsWith("en") ? "en" : "ar");
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    return () => observer.disconnect();
  }, []);

  return locale;
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
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message || response.statusText)
        : response.statusText;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return payload;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractPatients(payload: unknown): Patient[] {
  const record = asRecord(payload);
  const values = record?.items ?? record?.patients ?? record?.results ?? payload;
  return asArray(values).filter((item): item is Patient => Boolean(asRecord(item)?.id));
}

function extractBranches(payload: unknown): Branch[] {
  const record = asRecord(payload);
  const values = record?.items ?? record?.branches ?? record?.results ?? record?.data ?? payload;
  return asArray(values)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item && item.id))
    .map((item) => ({
      id: Number(item.id),
      code: String(item.code || ""),
      name: String(item.name || item.display_name || ""),
      name_ar: String(item.name_ar || ""),
      name_en: String(item.name_en || ""),
      display_name: String(item.display_name || ""),
    }));
}

function patientName(patient: Patient, locale: Locale) {
  if (locale === "ar") return patient.full_name_ar || patient.display_name || patient.full_name;
  return patient.full_name_en || patient.display_name || patient.full_name;
}

function branchName(branch: Branch | PatientBranch | null | undefined, locale: Locale) {
  if (!branch) return "—";
  if (locale === "ar") return branch.name_ar || branch.name || branch.name_en || branch.code || "—";
  return branch.name_en || branch.name || branch.name_ar || branch.code || "—";
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    numberingSystem: "latn",
  }).format(date);
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "BLOCKED" || status === "DECEASED") return "destructive";
  if (status === "INACTIVE") return "secondary";
  return "outline";
}

function LoadingState() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
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
export default function PatientsClient() {
  const locale = useLocale();
  const t = TEXT[locale];
  const router = useRouter();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [genderFilter, setGenderFilter] = React.useState("all");
  const [branchFilter, setBranchFilter] = React.useState("all");
  const [registeredFrom, setRegisteredFrom] = React.useState<Date | undefined>();
  const [registeredTo, setRegisteredTo] = React.useState<Date | undefined>();
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">("newest");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [form, setForm] = React.useState<PatientForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<PendingStatus>(null);
  const [statusSubmitting, setStatusSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [patientsPayload, branchesPayload] = await Promise.all([
        fetchJson(API.patients),
        fetchJson(API.branches),
      ]);
      setPatients(extractPatients(patientsPayload));
      setBranches(extractBranches(branchesPayload));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [t.loadingError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = patients.filter((patient) => {
      const haystack = [
        patient.full_name,
        patient.full_name_ar,
        patient.full_name_en,
        patient.display_name,
        patient.patient_number,
        patient.identifier_number,
        patient.mobile,
        patient.email,
      ]
        .join(" ")
        .toLowerCase();
      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      if (statusFilter !== "all" && patient.status !== statusFilter) return false;
      if (genderFilter !== "all" && patient.gender !== genderFilter) return false;
      if (branchFilter !== "all" && String(patient.registration_branch_id ?? "none") !== branchFilter) return false;

      if (registeredFrom || registeredTo) {
        const registeredValue = patient.registered_at || patient.created_at;
        const registeredTime = registeredValue ? new Date(registeredValue).getTime() : Number.NaN;

        if (Number.isNaN(registeredTime)) return false;
        if (registeredFrom && registeredTime < startOfDay(registeredFrom)) return false;
        if (registeredTo && registeredTime > endOfDay(registeredTo)) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      const aTime = new Date(a.registered_at || a.created_at || 0).getTime();
      const bTime = new Date(b.registered_at || b.created_at || 0).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [branchFilter, genderFilter, patients, query, registeredFrom, registeredTo, sortOrder, statusFilter]);

  const kpis = React.useMemo(
    () => ({
      total: patients.length,
      active: patients.filter((item) => item.status === "ACTIVE").length,
      inactive: patients.filter((item) => item.status === "INACTIVE").length,
      restricted: patients.filter((item) => item.status === "BLOCKED" || item.status === "DECEASED").length,
    }),
    [patients],
  );

  function openCreate() {
    setEditingPatient(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(patient: Patient) {
    setEditingPatient(patient);
    setForm({
      patientNumber: patient.patient_number || "",
      identifierType: (patient.identifier_type || "UNSPECIFIED") as IdentifierType,
      identifierNumber: patient.identifier_number || "",
      fullName: patient.full_name || patient.display_name || "",
      fullNameAr: patient.full_name_ar || "",
      fullNameEn: patient.full_name_en || "",
      dateOfBirth: patient.date_of_birth || "",
      gender: (patient.gender || "UNSPECIFIED") as Gender,
      nationality: patient.nationality || "",
      mobile: patient.mobile || "",
      email: patient.email || "",
      registrationBranchId: patient.registration_branch_id ? String(patient.registration_branch_id) : "none",
      notes: patient.notes || "",
    });
    setDialogOpen(true);
  }

  function updateForm<K extends keyof PatientForm>(key: K, value: PatientForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitPatient() {
    if (!form.fullName.trim()) {
      toast.error(t.requiredName);
      return;
    }

    const payload: Record<string, unknown> = {
      full_name: form.fullName.trim(),
      full_name_ar: form.fullNameAr.trim(),
      full_name_en: form.fullNameEn.trim(),
      identifier_type: form.identifierType,
      identifier_number: form.identifierNumber.trim(),
      date_of_birth: form.dateOfBirth || null,
      gender: form.gender,
      nationality: form.nationality.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      registration_branch_id: form.registrationBranchId === "none" ? null : Number(form.registrationBranchId),
      notes: form.notes.trim(),
    };

    if (form.patientNumber.trim()) payload.patient_number = form.patientNumber.trim();

    setSubmitting(true);
    try {
      await fetchJson(editingPatient ? `${API.patients}${editingPatient.id}/` : API.patients, {
        method: editingPatient ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(editingPatient ? t.updated : t.created);
      setDialogOpen(false);
      await load();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : t.loadingError);
    } finally {
      setSubmitting(false);
    }
  }

  async function applyStatus() {
    if (!pendingStatus) return;
    setStatusSubmitting(true);
    try {
      await fetchJson(`${API.patients}${pendingStatus.patient.id}/status/`, {
        method: "POST",
        body: JSON.stringify({ status: pendingStatus.nextStatus }),
      });
      toast.success(t.statusUpdated);
      setPendingStatus(null);
      await load();
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : t.loadingError);
    } finally {
      setStatusSubmitting(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setGenderFilter("all");
    setBranchFilter("all");
    setRegisteredFrom(undefined);
    setRegisteredTo(undefined);
    setSortOrder("newest");
  }

  async function printRegister() {
    const rows = filtered
      .map(
        (patient) => `
          <tr>
            <td>${escapeHtml(patientName(patient, locale))}</td>
            <td>${escapeHtml(patient.patient_number)}</td>
            <td>${escapeHtml(patient.identifier_number || "—")}</td>
            <td>${escapeHtml(patient.mobile || patient.email || "—")}</td>
            <td>${escapeHtml(t.genderLabels[(patient.gender as keyof typeof t.genderLabels)] || patient.gender)}</td>
            <td>${escapeHtml(branchName(patient.registration_branch, locale))}</td>
            <td>${escapeHtml(formatDate(patient.registered_at || patient.created_at, locale))}</td>
            <td>${escapeHtml(t.statusLabels[(patient.status as keyof typeof t.statusLabels)] || patient.status)}</td>
          </tr>`,
      )
      .join("");

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t.patient)}</th>
            <th>${escapeHtml(t.number)}</th>
            <th>${escapeHtml(t.identifier)}</th>
            <th>${escapeHtml(t.contact)}</th>
            <th>${escapeHtml(t.gender)}</th>
            <th>${escapeHtml(t.branch)}</th>
            <th>${escapeHtml(t.registeredAt)}</th>
            <th>${escapeHtml(t.status)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    const selectedBranchName =
      branchFilter === "all"
        ? undefined
        : branchName(branches.find((branch) => String(branch.id) === branchFilter), locale);

    const opened = await openPrintReport({
      locale,
      title: t.registerTitle,
      subtitle: t.registerDesc,
      branchName: selectedBranchName,
      tableHtml,
      recordsCount: filtered.length,
    });

    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  }

  function exportExcel() {
    const rows = filtered
      .map(
        (patient) => `
          <tr>
            <td>${escapeHtml(patientName(patient, locale))}</td>
            <td>${escapeHtml(patient.patient_number)}</td>
            <td>${escapeHtml(patient.identifier_type)}</td>
            <td>${escapeHtml(patient.identifier_number)}</td>
            <td>${escapeHtml(patient.mobile)}</td>
            <td>${escapeHtml(patient.email)}</td>
            <td>${escapeHtml(branchName(patient.registration_branch, locale))}</td>
            <td>${escapeHtml(patient.status)}</td>
          </tr>`,
      )
      .join("");
    const html = `\ufeff<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr><th>${t.patient}</th><th>${t.number}</th><th>${t.identifierType}</th><th>${t.identifierNumber}</th><th>${t.mobile}</th><th>${t.email}</th><th>${t.branch}</th><th>${t.status}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-patients-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t.excelReady);
  }

  const hasFilters = Boolean(
    query ||
      statusFilter !== "all" ||
      genderFilter !== "all" ||
      branchFilter !== "all" ||
      registeredFrom ||
      registeredTo ||
      sortOrder !== "newest",
  );

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
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
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
          <Button variant="brand" className={registerBrandButtonClass} onClick={() => void printRegister()}>
            <Printer className="size-4" />
            {t.print}
          </Button>
          <Button variant="brand" className={registerBrandButtonClass} onClick={openCreate}>
            <Plus className="size-4" />
            {t.add}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SystemKpiCard title={t.total} value={kpis.total} description={t.totalDesc} icon={UsersRound} />
        <SystemKpiCard title={t.active} value={kpis.active} description={t.activeDesc} icon={UserRoundCheck} />
        <SystemKpiCard title={t.inactive} value={kpis.inactive} description={t.inactiveDesc} icon={Activity} />
        <SystemKpiCard title={t.restricted} value={kpis.restricted} description={t.restrictedDesc} icon={Ban} />
      </section>

      <PatientCenterTabs
        active="patients"
        locale={locale}
        counts={{
          patients: kpis.total,
          "medical-records":
            kpis.total,
        }}
      />

      <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
        <CardHeader className="px-5 pt-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                <UsersRound className="h-4 w-4 text-[#a57b3d]" />
                {t.registerTitle}
              </CardTitle>
              <CardDescription className="mt-1 leading-6">{t.registerDesc}</CardDescription>
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
              <Button variant="brand" className={registerBrandButtonClass} onClick={() => void printRegister()}>
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
                value={query}
                onChange={setQuery}
                placeholder={t.search}
                className="w-full sm:w-[360px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[150px]">
                  <SelectValue placeholder={t.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatuses}</SelectItem>
                  {(["ACTIVE", "INACTIVE", "BLOCKED", "DECEASED"] as PatientStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>{t.statusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[150px]">
                  <SelectValue placeholder={t.allGenders} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allGenders}</SelectItem>
                  {(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as Gender[]).map((gender) => (
                    <SelectItem key={gender} value={gender}>{t.genderLabels[gender]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[180px]">
                  <SelectValue placeholder={t.allBranches} />
                </SelectTrigger>
                <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                  <SelectItem value="all">{t.allBranches}</SelectItem>
                  <SelectItem value="none">{t.noBranch}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>{branchName(branch, locale)}</SelectItem>
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
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}>
                <SelectTrigger className="h-9 bg-background shadow-none sm:w-[160px]">
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
                <RefreshCw className="size-4" />
                {t.reset}
              </Button>
            </div>
          </DataRegisterToolbar>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <Alert variant="destructive" className="min-h-56 items-center justify-center text-center">
              <ShieldCheck className="size-5" />
              <AlertTitle>{t.loadingError}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{error}</p>
                <Button variant="outline" onClick={() => void load()}>{t.retry}</Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table
                variant="register"
                layout="fixed"
                minWidth="1320px"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead sticky="start" className="w-[260px]">{t.patient}</TableHead>
                    <TableHead className="w-[145px]">{t.number}</TableHead>
                    <TableHead className="w-[190px]">{t.identifier}</TableHead>
                    <TableHead className="w-[210px]">{t.contact}</TableHead>
                    <TableHead className="w-[110px]">{t.gender}</TableHead>
                    <TableHead className="w-[180px]">{t.branch}</TableHead>
                    <TableHead className="w-[145px]">{t.registeredAt}</TableHead>
                    <TableHead className="w-[120px]">{t.status}</TableHead>
                    <TableHead sticky="end" contentAlign="center" className="w-[90px]">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((patient) => (
                    <TableRow
                      key={patient.id}
                      interactive
                      role="link"
                      tabIndex={0}
                      className="group"
                      onClick={() =>
                        router.push(`/system/patients/${patient.id}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/system/patients/${patient.id}`);
                        }
                      }}
                    >
                      <TableCell sticky="start">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dccdb8] bg-[#fbf7ef] text-[#a57b3d]">
                            <CircleUserRound className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{patientName(patient, locale)}</p>
                            <p className="truncate text-xs text-muted-foreground">{patient.email || patient.mobile || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{patient.patient_number || "—"}</TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">{t.identifierLabels[(patient.identifier_type as keyof typeof t.identifierLabels)] || patient.identifier_type}</p>
                        <p className="mt-1 font-medium tabular-nums">{patient.identifier_number || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <p>{patient.mobile || "—"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{patient.email || "—"}</p>
                      </TableCell>
                      <TableCell>{t.genderLabels[(patient.gender as keyof typeof t.genderLabels)] || patient.gender}</TableCell>
                      <TableCell>{branchName(patient.registration_branch, locale)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(patient.registered_at || patient.created_at, locale)}</TableCell>
                      <TableCell><Badge variant={statusVariant(patient.status)}>{t.statusLabels[(patient.status as keyof typeof t.statusLabels)] || patient.status}</Badge></TableCell>
                      <TableCell sticky="end" contentAlign="center" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-52">
                            <DropdownMenuLabel>{patientName(patient, locale)}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/system/patients/${patient.id}`)
                              }
                            >
                              <Eye className="size-4 text-[#a57b3d]" />
                              {t.details}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(patient)}>
                              <Edit3 className="size-4" />
                              {t.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/system/patients/medical-records?patient=${patient.id}`}>
                                <FileText className="size-4" />
                                {t.medicalFile}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t.changeStatus}</DropdownMenuLabel>
                            {(["ACTIVE", "INACTIVE", "BLOCKED", "DECEASED"] as PatientStatus[])
                              .filter((status) => status !== patient.status)
                              .map((status) => (
                                <DropdownMenuItem key={status} onClick={() => setPendingStatus({ patient, nextStatus: status })}>
                                  <CheckCircle2 className="size-4" />
                                  {t.statusLabels[status]}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!filtered.length ? (
                <div className="py-2">
                  <DataRegisterEmptyState
                    title={patients.length ? t.noResults : t.noPatients}
                    description={patients.length ? t.noResults : t.registerDesc}
                    showReset={hasFilters}
                    onReset={resetFilters}
                    resetLabel={t.reset}
                  />
                  {!patients.length ? (
                    <div className="flex justify-center pb-5">
                      <Button
                        variant="brand"
                        className={registerBrandButtonClass}
                        onClick={openCreate}
                      >
                        <Plus className="size-4" />
                        {t.addFirst}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !submitting && setDialogOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="text-end">
            <DialogTitle>{editingPatient ? t.editTitle : t.createTitle}</DialogTitle>
            <DialogDescription>{editingPatient ? t.editDesc : t.createDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patient-full-name">{t.fullName} *</Label>
              <Input id="patient-full-name" value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-number">{t.patientNumber}</Label>
              <Input id="patient-number" value={form.patientNumber} onChange={(event) => updateForm("patientNumber", event.target.value)} placeholder={t.optionalAuto} disabled={Boolean(editingPatient)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-name-ar">{t.fullNameAr}</Label>
              <Input id="patient-name-ar" value={form.fullNameAr} onChange={(event) => updateForm("fullNameAr", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-name-en">{t.fullNameEn}</Label>
              <Input id="patient-name-en" value={form.fullNameEn} onChange={(event) => updateForm("fullNameEn", event.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{t.identifierType}</Label>
              <Select value={form.identifierType} onValueChange={(value) => updateForm("identifierType", value as IdentifierType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["NATIONAL_ID", "IQAMA", "PASSPORT", "OTHER", "UNSPECIFIED"] as IdentifierType[]).map((type) => (
                    <SelectItem key={type} value={type}>{t.identifierLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-identifier">{t.identifierNumber}</Label>
              <Input id="patient-identifier" value={form.identifierNumber} onChange={(event) => updateForm("identifierNumber", event.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{t.gender}</Label>
              <Select value={form.gender} onValueChange={(value) => updateForm("gender", value as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as Gender[]).map((gender) => (
                    <SelectItem key={gender} value={gender}>{t.genderLabels[gender]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-birth-date">{t.dateOfBirth}</Label>
              <Input id="patient-birth-date" type="date" value={form.dateOfBirth} onChange={(event) => updateForm("dateOfBirth", event.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-mobile">{t.mobile}</Label>
              <Input id="patient-mobile" value={form.mobile} onChange={(event) => updateForm("mobile", event.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-email">{t.email}</Label>
              <Input id="patient-email" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-nationality">{t.nationality}</Label>
              <Input id="patient-nationality" value={form.nationality} onChange={(event) => updateForm("nationality", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.registrationBranch}</Label>
              <Select value={form.registrationBranchId} onValueChange={(value) => updateForm("registrationBranchId", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                  <SelectItem value="none">{t.noBranch}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>{branchName(branch, locale)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="patient-notes">{t.notes}</Label>
              <Textarea id="patient-notes" rows={4} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>{t.cancel}</Button>
            <Button variant="brand" onClick={() => void submitPatient()} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {submitting ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(open) => !open && !statusSubmitting && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-end">
            <AlertDialogTitle>{t.statusConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.statusConfirmDesc}
              {pendingStatus ? ` ${patientName(pendingStatus.patient, locale)} — ${t.statusLabels[pendingStatus.nextStatus]}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusSubmitting}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void applyStatus(); }} disabled={statusSubmitting}>
              {statusSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </main>
  );
}
