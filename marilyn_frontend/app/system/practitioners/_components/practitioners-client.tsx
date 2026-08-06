"use client";

// practitioners_management_hr_spirit=true
// practitioner_inline_tabs_hr_brand_colors=true

import * as React from "react";
import Link from "next/link";
import {
  useRouter } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleSlash2,
  Eye,
  FileSpreadsheet,
  RotateCcw,
  Loader2,
  MoreVertical,
  Pencil,
  Printer,
  RefreshCw,
  Stethoscope,
  TriangleAlert,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataRegisterDatePicker,
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
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

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;

type LookupOption = {
  id: string;
  name: string;
  branchId?: string;
  departmentId?: string;
};

type Practitioner = {
  id: string;
  practitionerNumber: string;
  fullNameAr: string;
  fullNameEn: string;
  professionalTitle: string;
  practitionerType: string;
  gender: string;
  status: string;
  mobile: string;
  email: string;
  hireDate: string;
  isAcceptingAppointments: boolean;
  primarySpecialtyId: string;
  primarySpecialty: string;
  defaultBranchId: string;
  defaultBranch: string;
  defaultDepartmentId: string;
  defaultDepartment: string;
  defaultClinicId: string;
  defaultClinic: string;
  specialtiesCount: number;
  assignmentsCount: number;
  licensesCount: number;
  notes: string;
};

type FormState = {
  id: string;
  practitionerNumber: string;
  fullNameAr: string;
  fullNameEn: string;
  professionalTitle: string;
  practitionerType: string;
  gender: string;
  mobile: string;
  email: string;
  hireDate: string;
  primarySpecialtyId: string;
  defaultBranchId: string;
  defaultDepartmentId: string;
  defaultClinicId: string;
  isAcceptingAppointments: boolean;
  status: string;
  notes: string;
};

type StatusAction = {
  practitioner: Practitioner;
  action: "activate" | "suspend";
};

const API = {
  practitioners: "/api/company/medical/practitioners/",
  branches: "/api/company/branches/",
  departments: "/api/company/medical/departments/",
  clinics: "/api/company/medical/clinics/",
  specialties: "/api/company/medical/specialties/",
} as const;

const EMPTY_FORM: FormState = {
  id: "",
  practitionerNumber: "",
  fullNameAr: "",
  fullNameEn: "",
  professionalTitle: "",
  practitionerType: "PHYSICIAN",
  gender: "",
  mobile: "",
  email: "",
  hireDate: "",
  primarySpecialtyId: "",
  defaultBranchId: "",
  defaultDepartmentId: "",
  defaultClinicId: "",
  isAcceptingAppointments: true,
  status: "ACTIVE",
  notes: "",
};

const TYPE_OPTIONS = [
  { value: "PHYSICIAN", ar: "طبيب", en: "Physician" },
  { value: "DENTIST", ar: "طبيب أسنان", en: "Dentist" },
  { value: "NURSE", ar: "تمريض", en: "Nurse" },
  { value: "THERAPIST", ar: "معالج", en: "Therapist" },
  { value: "TECHNICIAN", ar: "فني", en: "Technician" },
  { value: "OTHER", ar: "أخرى", en: "Other" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", ar: "نشط", en: "Active" },
  { value: "SUSPENDED", ar: "موقوف", en: "Suspended" },
  { value: "INACTIVE", ar: "غير نشط", en: "Inactive" },
  { value: "ARCHIVED", ar: "مؤرشف", en: "Archived" },
] as const;

const translations = {
  ar: {
    badge: "العمليات الطبية",
    title: "إدارة الممارسين",
    subtitle:
      "إدارة ملفات الممارسين وربطها بالتخصصات والفروع والأقسام والعيادات ضمن البنية الطبية الفعلية.",
    refresh: "تحديث",
    newPractitioner: "ممارس جديد",
    tabs: {
      directory: "ملفات الممارسين",
      assignments: "التخصصات والتعيينات",
      licenses: "التراخيص",
      schedules: "الجداول والتوفر",
    },
    total: "إجمالي الممارسين",
    active: "الممارسون النشطون",
    accepting: "يقبلون المواعيد",
    suspended: "الموقوفون",
    totalDescription: "جميع ملفات الممارسين المتاحة",
    activeDescription: "ملفات بحالة نشطة",
    acceptingDescription: "متاحون لاستقبال الحجوزات",
    suspendedDescription: "ملفات تحتاج مراجعة إدارية",
    recordsTitle: "سجل الممارسين",
    recordsDescription:
      "قائمة موحدة لملفات الممارسين مع بيانات التخصص والفرع والارتباطات التشغيلية.",
    excel: "Excel",
    print: "طباعة",
    searchPlaceholder: "ابحث بالاسم أو الرقم أو الجوال أو البريد...",
    allStatuses: "كل الحالات",
    allTypes: "كل الأنواع",
    allBranches: "كل الفروع",
    fromDate: "من تاريخ الانضمام",
    toDate: "إلى تاريخ الانضمام",
    sort: "الترتيب",
    newest: "الأحدث انضمامًا",
    oldest: "الأقدم انضمامًا",
    nameSort: "الاسم",
    numberSort: "رقم الممارس",
    contact: "التواصل",
    reset: "إعادة ضبط",
    practitioner: "الممارس",
    number: "الرقم",
    type: "النوع",
    specialty: "التخصص",
    branch: "الفرع",
    links: "الارتباطات",
    status: "الحالة",
    action: "الإجراء",
    specialties: "تخصص",
    assignments: "تعيين",
    licenses: "ترخيص",
    acceptingBadge: "يقبل المواعيد",
    notAcceptingBadge: "لا يقبل المواعيد",
    noResults: "لا توجد نتائج مطابقة للفلاتر الحالية.",
    noRecords: "لا توجد ملفات ممارسين مسجلة حتى الآن.",
    resultCount: "عدد النتائج",
    actions: "الإجراءات",
    details: "فتح ملف الممارس",
    edit: "تعديل الملف",
    openAssignments: "فتح التخصصات والتعيينات",
    openLicenses: "فتح التراخيص",
    openSchedules: "فتح الجداول والتوفر",
    suspend: "إيقاف الممارس",
    activate: "تفعيل الممارس",
    createTitle: "إضافة ممارس جديد",
    createDescription:
      "أدخل بيانات الممارس الأساسية ثم اربطه بالبنية الطبية المتاحة.",
    editTitle: "تعديل ملف الممارس",
    editDescription:
      "حدّث البيانات الأساسية والارتباطات الافتراضية للممارس.",
    practitionerNumber: "رقم الممارس",
    fullNameAr: "الاسم بالعربية",
    fullNameEn: "الاسم بالإنجليزية",
    professionalTitle: "المسمى المهني",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    unspecified: "غير محدد",
    mobile: "رقم الجوال",
    email: "البريد الإلكتروني",
    hireDate: "تاريخ الانضمام",
    defaultSpecialty: "التخصص الأساسي",
    defaultBranch: "الفرع الافتراضي",
    defaultDepartment: "القسم الافتراضي",
    defaultClinic: "العيادة الافتراضية",
    chooseSpecialty: "اختر التخصص",
    chooseBranch: "اختر الفرع",
    chooseDepartment: "اختر القسم",
    chooseClinic: "اختر العيادة",
    none: "بدون",
    acceptingAppointments: "يقبل المواعيد",
    notes: "ملاحظات",
    cancel: "إلغاء",
    save: "حفظ التعديلات",
    create: "إضافة الممارس",
    saving: "جارٍ الحفظ...",
    confirmActivateTitle: "تفعيل الممارس",
    confirmActivateDescription:
      "سيصبح ملف الممارس نشطًا ومتاحًا ضمن العمليات الطبية حسب بقية إعداداته.",
    confirmSuspendTitle: "إيقاف الممارس",
    confirmSuspendDescription:
      "سيتم إيقاف الممارس ومنع قبوله للمواعيد حتى إعادة تفعيله.",
    confirm: "تأكيد",
    loadingErrorTitle: "تعذر تحميل سجل الممارسين",
    loadingErrorDescription:
      "تأكد من تسجيل الدخول واختيار المنشأة وتشغيل الباكند ثم أعد المحاولة.",
    partialTitle: "تم تحميل سجل الممارسين مع نقص في البيانات المرجعية",
    partialDescription:
      "تعذر تحميل بعض قوائم الفروع أو البنية الطبية. ما زالت بيانات الممارسين الحقيقية معروضة.",
    retry: "إعادة المحاولة",
    created: "تمت إضافة الممارس بنجاح.",
    updated: "تم تحديث ملف الممارس بنجاح.",
    statusUpdated: "تم تحديث حالة الممارس.",
    exported: "تم تجهيز ملف Excel.",
    printed: "تم تجهيز صفحة الطباعة.",
    noExport: "لا توجد بيانات لتصديرها.",
    printBlocked: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تقرير سجل الممارسين — Marilyn Clinics",
    generatedAt: "تم الإنشاء في",
    unknown: "غير محدد",
  },
  en: {
    badge: "Medical Operations",
    title: "Practitioner Management",
    subtitle:
      "Manage practitioner records and connect them to specialties, branches, departments, and clinics.",
    refresh: "Refresh",
    newPractitioner: "New practitioner",
    tabs: {
      directory: "Practitioner files",
      assignments: "Specialties & assignments",
      licenses: "Licenses",
      schedules: "Schedules & availability",
    },
    total: "Total practitioners",
    active: "Active practitioners",
    accepting: "Accepting appointments",
    suspended: "Suspended",
    totalDescription: "All available practitioner files",
    activeDescription: "Records with active status",
    acceptingDescription: "Available for appointment booking",
    suspendedDescription: "Records requiring administrative review",
    recordsTitle: "Practitioner Register",
    recordsDescription:
      "Unified practitioner records with specialty, branch, and operational relationships.",
    excel: "Excel",
    print: "Print",
    searchPlaceholder: "Search by name, number, mobile, or email...",
    allStatuses: "All statuses",
    allTypes: "All types",
    allBranches: "All branches",
    fromDate: "Hire date from",
    toDate: "Hire date to",
    sort: "Sort",
    newest: "Newest hire date",
    oldest: "Oldest hire date",
    nameSort: "Name",
    numberSort: "Practitioner number",
    contact: "Contact",
    reset: "Reset",
    practitioner: "Practitioner",
    number: "Number",
    type: "Type",
    specialty: "Specialty",
    branch: "Branch",
    links: "Relations",
    status: "Status",
    action: "Action",
    specialties: "specialties",
    assignments: "assignments",
    licenses: "licenses",
    acceptingBadge: "Accepting",
    notAcceptingBadge: "Not accepting",
    noResults: "No records match the current filters.",
    noRecords: "No practitioner records exist yet.",
    resultCount: "Results",
    actions: "Actions",
    details: "Open practitioner file",
    edit: "Edit file",
    openAssignments: "Open specialties and assignments",
    openLicenses: "Open licenses",
    openSchedules: "Open schedules and availability",
    suspend: "Suspend practitioner",
    activate: "Activate practitioner",
    createTitle: "Add practitioner",
    createDescription:
      "Enter the practitioner details and connect the record to the medical structure.",
    editTitle: "Edit practitioner file",
    editDescription:
      "Update the practitioner details and default medical relationships.",
    practitionerNumber: "Practitioner number",
    fullNameAr: "Arabic name",
    fullNameEn: "English name",
    professionalTitle: "Professional title",
    gender: "Gender",
    male: "Male",
    female: "Female",
    unspecified: "Unspecified",
    mobile: "Mobile",
    email: "Email",
    hireDate: "Hire date",
    defaultSpecialty: "Primary specialty",
    defaultBranch: "Default branch",
    defaultDepartment: "Default department",
    defaultClinic: "Default clinic",
    chooseSpecialty: "Choose specialty",
    chooseBranch: "Choose branch",
    chooseDepartment: "Choose department",
    chooseClinic: "Choose clinic",
    none: "None",
    acceptingAppointments: "Accepting appointments",
    notes: "Notes",
    cancel: "Cancel",
    save: "Save changes",
    create: "Create practitioner",
    saving: "Saving...",
    confirmActivateTitle: "Activate practitioner",
    confirmActivateDescription:
      "The practitioner record will become active and available according to its remaining settings.",
    confirmSuspendTitle: "Suspend practitioner",
    confirmSuspendDescription:
      "The practitioner will be suspended and cannot accept appointments until reactivated.",
    confirm: "Confirm",
    loadingErrorTitle: "Could not load the practitioner register",
    loadingErrorDescription:
      "Make sure you are signed in, the organization is selected, and the backend is running.",
    partialTitle: "Practitioners loaded with incomplete reference data",
    partialDescription:
      "Some branch or medical structure lists were unavailable. Real practitioner data is still displayed.",
    retry: "Try again",
    created: "Practitioner created successfully.",
    updated: "Practitioner updated successfully.",
    statusUpdated: "Practitioner status updated.",
    exported: "Excel file prepared.",
    printed: "Print page prepared.",
    noExport: "There are no records to export.",
    printBlocked: "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Marilyn Clinics Practitioner Register",
    generatedAt: "Generated at",
    unknown: "Unknown",
  },
} as const;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = text(value).toLowerCase();
  if (["true", "1", "yes", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive"].includes(normalized)) return false;
  return fallback;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  const candidates = [
    root.items,
    root.results,
    root.records,
    root.rows,
    root.practitioners,
    root.branches,
    root.departments,
    root.clinics,
    root.specialties,
    record(root.data).items,
    record(root.data).results,
  ];
  return candidates.find(Array.isArray) as unknown[] | undefined || [];
}

function objectId(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return text(value);
  const item = record(value);
  return text(item.id ?? item.pk ?? item.value);
}

function nestedName(value: unknown): string {
  if (typeof value === "string") return text(value);
  const item = record(value);
  return text(
    item.name_ar ??
      item.name_en ??
      item.name ??
      item.full_name_ar ??
      item.full_name_en ??
      item.full_name ??
      item.title ??
      item.code,
  );
}

function normalizeStatus(value: unknown): string {
  return text(value, "UNKNOWN").toUpperCase().replace(/[\s-]+/g, "_");
}

function normalizePractitioner(value: unknown): Practitioner {
  const item = record(value);
  const specialty = item.primary_specialty;
  const branch = item.default_branch;
  const department = item.default_department;
  const clinic = item.default_clinic;

  return {
    id: text(item.id ?? item.pk),
    practitionerNumber: text(item.practitioner_number ?? item.code),
    fullNameAr: text(item.full_name_ar),
    fullNameEn: text(item.full_name_en),
    professionalTitle: text(item.professional_title),
    practitionerType: normalizeStatus(item.practitioner_type),
    gender: normalizeStatus(item.gender),
    status: normalizeStatus(item.status),
    mobile: text(item.mobile ?? item.phone),
    email: text(item.email),
    hireDate: text(item.hire_date),
    isAcceptingAppointments: boolValue(item.is_accepting_appointments),
    primarySpecialtyId: objectId(specialty ?? item.primary_specialty_id),
    primarySpecialty: nestedName(specialty),
    defaultBranchId: objectId(branch ?? item.default_branch_id),
    defaultBranch: nestedName(branch),
    defaultDepartmentId: objectId(department ?? item.default_department_id),
    defaultDepartment: nestedName(department),
    defaultClinicId: objectId(clinic ?? item.default_clinic_id),
    defaultClinic: nestedName(clinic),
    specialtiesCount: numberValue(item.specialties_count),
    assignmentsCount: numberValue(item.assignments_count),
    licensesCount: numberValue(item.licenses_count),
    notes: text(item.notes),
  };
}

function normalizeLookup(value: unknown): LookupOption {
  const item = record(value);
  return {
    id: text(item.id ?? item.pk),
    name:
      nestedName(item) ||
      text(item.branch_name ?? item.department_name ?? item.clinic_name) ||
      text(item.code),
    branchId: objectId(item.branch ?? item.branch_id),
    departmentId: objectId(item.department ?? item.department_id),
  };
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function getApiBaseUrl(): string {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");

  if (init?.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set("X-CSRFToken", csrf);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
    const data = record(payload);
    const errors = record(data.errors);
    const firstError = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => text(value))
      .find(Boolean);

    throw new Error(
      text(data.message) ||
        text(data.detail) ||
        text(data.error) ||
        firstError ||
        `HTTP ${response.status}`,
    );
  }

  return payload;
}

function labelForType(value: string, locale: Locale): string {
  const match = TYPE_OPTIONS.find((item) => item.value === value);
  return match ? match[locale] : value || "—";
}

function labelForStatus(value: string, locale: Locale): string {
  const match = STATUS_OPTIONS.find((item) => item.value === value);
  return match ? match[locale] : value.toLowerCase().replaceAll("_", " ");
}

function statusBadgeClass(status: string): string {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "SUSPENDED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["INACTIVE", "ARCHIVED"].includes(status)) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

function escapeHtml(value: unknown): string {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function reportDateTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function parseIsoDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateToIso(value?: Date) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PageSkeleton() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    </main>
  );
}

export default function PractitionersClient() {
  const router = useRouter();
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [practitioners, setPractitioners] = React.useState<Practitioner[]>([]);
  const [branches, setBranches] = React.useState<LookupOption[]>([]);
  const [departments, setDepartments] = React.useState<LookupOption[]>([]);
  const [clinics, setClinics] = React.useState<LookupOption[]>([]);
  const [specialties, setSpecialties] = React.useState<LookupOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [partialReferences, setPartialReferences] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [branchFilter, setBranchFilter] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [sortKey, setSortKey] = React.useState("newest");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [statusAction, setStatusAction] = React.useState<StatusAction | null>(null);

  const t = translations[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  React.useEffect(() => {
    const syncLocale = () => {
      const next = getInitialLocale();
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.body.dir = next === "ar" ? "rtl" : "ltr";
    };

    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("primey-locale-changed", syncLocale);

    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("primey-locale-changed", syncLocale);
    };
  }, []);

  const loadData = React.useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError("");

      const sources = [
        requestJson(`${API.practitioners}?page_size=500`),
        requestJson(`${API.branches}?page_size=500`),
        requestJson(`${API.departments}?page_size=500`),
        requestJson(`${API.clinics}?page_size=500`),
        requestJson(`${API.specialties}?page_size=500`),
      ];

      const results = await Promise.allSettled(sources);
      const practitionerResult = results[0];

      if (practitionerResult.status === "rejected") {
        setError(
          practitionerResult.reason instanceof Error
            ? practitionerResult.reason.message
            : t.loadingErrorDescription,
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setPractitioners(
        extractArray(practitionerResult.value).map(normalizePractitioner),
      );

      const referenceResults = results.slice(1);
      setPartialReferences(referenceResults.some((result) => result.status === "rejected"));

      if (results[1]?.status === "fulfilled") {
        setBranches(extractArray(results[1].value).map(normalizeLookup));
      }
      if (results[2]?.status === "fulfilled") {
        setDepartments(extractArray(results[2].value).map(normalizeLookup));
      }
      if (results[3]?.status === "fulfilled") {
        setClinics(extractArray(results[3].value).map(normalizeLookup));
      }
      if (results[4]?.status === "fulfilled") {
        setSpecialties(extractArray(results[4].value).map(normalizeLookup));
      }

      if (silent) toast.success(t.refresh);
      setLoading(false);
      setRefreshing(false);
    },
    [t.loadingErrorDescription, t.refresh],
  );

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredDepartments = React.useMemo(() => {
    if (!form.defaultBranchId) return departments;
    return departments;
  }, [departments, form.defaultBranchId]);

  const filteredClinics = React.useMemo(() => {
    return clinics.filter((clinic) => {
      if (form.defaultBranchId && clinic.branchId && clinic.branchId !== form.defaultBranchId) {
        return false;
      }
      if (
        form.defaultDepartmentId &&
        clinic.departmentId &&
        clinic.departmentId !== form.defaultDepartmentId
      ) {
        return false;
      }
      return true;
    });
  }, [clinics, form.defaultBranchId, form.defaultDepartmentId]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = practitioners.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.practitionerNumber,
          item.fullNameAr,
          item.fullNameEn,
          item.professionalTitle,
          item.mobile,
          item.email,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchesType =
        typeFilter === "all" || item.practitionerType === typeFilter;
      const matchesBranch =
        branchFilter === "all" || item.defaultBranchId === branchFilter;
      const matchesFrom =
        !fromDate || (item.hireDate && item.hireDate.slice(0, 10) >= fromDate);
      const matchesTo =
        !toDate || (item.hireDate && item.hireDate.slice(0, 10) <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesBranch &&
        matchesFrom &&
        matchesTo
      );
    });

    return [...rows].sort((a, b) => {
      if (sortKey === "oldest") {
        return a.hireDate.localeCompare(b.hireDate);
      }
      if (sortKey === "name") {
        return (a.fullNameAr || a.fullNameEn).localeCompare(
          b.fullNameAr || b.fullNameEn,
        );
      }
      if (sortKey === "number") {
        return a.practitionerNumber.localeCompare(
          b.practitionerNumber,
          undefined,
          { numeric: true },
        );
      }
      return b.hireDate.localeCompare(a.hireDate);
    });
  }, [
    branchFilter,
    fromDate,
    practitioners,
    search,
    sortKey,
    statusFilter,
    toDate,
    typeFilter,
  ]);

  const metrics = React.useMemo(
    () => ({
      total: practitioners.length,
      active: practitioners.filter((item) => item.status === "ACTIVE").length,
      accepting: practitioners.filter((item) => item.isAcceptingAppointments).length,
      suspended: practitioners.filter((item) => item.status === "SUSPENDED").length,
    }),
    [practitioners],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: Practitioner) => {
    setForm({
      id: item.id,
      practitionerNumber: item.practitionerNumber,
      fullNameAr: item.fullNameAr,
      fullNameEn: item.fullNameEn,
      professionalTitle: item.professionalTitle,
      practitionerType: item.practitionerType || "PHYSICIAN",
      gender: item.gender === "UNKNOWN" ? "" : item.gender,
      mobile: item.mobile,
      email: item.email,
      hireDate: item.hireDate,
      primarySpecialtyId: item.primarySpecialtyId,
      defaultBranchId: item.defaultBranchId,
      defaultDepartmentId: item.defaultDepartmentId,
      defaultClinicId: item.defaultClinicId,
      isAcceptingAppointments: item.isAcceptingAppointments,
      status: item.status || "ACTIVE",
      notes: item.notes,
    });
    setDialogOpen(true);
  };

  const updateForm = <K extends keyof FormState,>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const savePractitioner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.practitionerNumber.trim()) {
      toast.error(t.practitionerNumber);
      return;
    }
    if (!form.fullNameAr.trim() && !form.fullNameEn.trim()) {
      toast.error(`${t.fullNameAr} / ${t.fullNameEn}`);
      return;
    }

    setSaving(true);

    try {
      const payload: ApiRecord = {
        practitioner_number: form.practitionerNumber.trim(),
        full_name_ar: form.fullNameAr.trim(),
        full_name_en: form.fullNameEn.trim(),
        professional_title: form.professionalTitle.trim(),
        practitioner_type: form.practitionerType,
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        hire_date: form.hireDate || null,
        is_accepting_appointments: form.isAcceptingAppointments,
        notes: form.notes.trim(),
      };

      if (form.gender) payload.gender = form.gender;
      if (!form.id) payload.status = form.status;

      const relationshipFields: Array<[string, string]> = [
        ["primary_specialty_id", form.primarySpecialtyId],
        ["default_branch_id", form.defaultBranchId],
        ["default_department_id", form.defaultDepartmentId],
        ["default_clinic_id", form.defaultClinicId],
      ];

      relationshipFields.forEach(([key, value]) => {
        if (value) payload[key] = Number(value);
        else if (form.id) payload[key] = null;
      });

      await requestJson(
        form.id ? `${API.practitioners}${form.id}/` : API.practitioners,
        {
          method: form.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );

      toast.success(form.id ? t.updated : t.created);
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await loadData(true);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : t.loadingErrorDescription,
      );
    } finally {
      setSaving(false);
    }
  };

  const applyStatusAction = async () => {
    if (!statusAction) return;

    setSaving(true);
    try {
      await requestJson(
        `${API.practitioners}${statusAction.practitioner.id}/status/`,
        {
          method: "POST",
          body: JSON.stringify({ action: statusAction.action }),
        },
      );

      toast.success(t.statusUpdated);
      setStatusAction(null);
      await loadData(true);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : t.loadingErrorDescription,
      );
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setBranchFilter("all");
    setFromDate("");
    setToDate("");
    setSortKey("newest");
  };

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    branchFilter !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    sortKey !== "newest";
  const exportExcel = () => {
    if (!filtered.length) {
      toast.error(t.noExport);
      return;
    }

    const rows = filtered
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.practitionerNumber || "—")}</td>
            <td>${escapeHtml(item.fullNameAr || item.fullNameEn || t.unknown)}</td>
            <td>${escapeHtml(item.fullNameEn || "—")}</td>
            <td>${escapeHtml(labelForType(item.practitionerType, locale))}</td>
            <td>${escapeHtml(item.primarySpecialty || "—")}</td>
            <td>${escapeHtml(item.defaultBranch || "—")}</td>
            <td>${escapeHtml(labelForStatus(item.status, locale))}</td>
            <td>${escapeHtml(item.mobile || "—")}</td>
            <td>${escapeHtml(item.email || "—")}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <!doctype html>
      <html dir="${dir}" lang="${locale}">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Tahoma, Arial, sans-serif; direction: ${dir}; padding: 12px; }
            h1, p { text-align: ${locale === "ar" ? "right" : "left"}; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td {
              border: 1px solid #000;
              padding: 7px;
              text-align: ${locale === "ar" ? "right" : "left"};
              mso-number-format: "\\@";
            }
            th { background: #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(t.reportTitle)}</h1>
          <p>${escapeHtml(t.generatedAt)}: ${escapeHtml(reportDateTime())}</p>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t.number)}</th>
                <th>${escapeHtml(t.fullNameAr)}</th>
                <th>${escapeHtml(t.fullNameEn)}</th>
                <th>${escapeHtml(t.type)}</th>
                <th>${escapeHtml(t.specialty)}</th>
                <th>${escapeHtml(t.branch)}</th>
                <th>${escapeHtml(t.status)}</th>
                <th>${escapeHtml(t.mobile)}</th>
                <th>${escapeHtml(t.email)}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-practitioners-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t.exported);
  };

  const printRegister = async () => {
    if (!filtered.length) {
      toast.error(t.noExport);
      return;
    }
    const rows = filtered
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.practitionerNumber || "—")}</td>
            <td>
              <strong>
                ${escapeHtml(
                  item.fullNameAr ||
                    item.fullNameEn ||
                    t.unknown,
                )}
              </strong>
              ${
                item.professionalTitle
                  ? `<div>${escapeHtml(item.professionalTitle)}</div>`
                  : ""
              }
            </td>
            <td>
              ${escapeHtml(
                labelForType(item.practitionerType, locale),
              )}
            </td>
            <td>
              ${escapeHtml(item.primarySpecialty || "—")}
            </td>
            <td>
              ${escapeHtml(item.defaultBranch || "—")}
              ${
                item.defaultClinic || item.defaultDepartment
                  ? `<div>${escapeHtml(
                      item.defaultClinic ||
                        item.defaultDepartment,
                    )}</div>`
                  : ""
              }
            </td>
            <td>
              ${escapeHtml(
                `${item.specialtiesCount} ${t.specialties} · ` +
                  `${item.assignmentsCount} ${t.assignments} · ` +
                  `${item.licensesCount} ${t.licenses}`,
              )}
            </td>
            <td>
              ${escapeHtml(
                labelForStatus(item.status, locale),
              )}
              <div>
                ${escapeHtml(
                  item.isAcceptingAppointments
                    ? t.acceptingBadge
                    : t.notAcceptingBadge,
                )}
              </div>
            </td>
            <td dir="ltr">
              ${escapeHtml(item.mobile || "—")}
            </td>
            <td dir="ltr">
              ${escapeHtml(item.email || "—")}
            </td>
          </tr>
        `,
      )
      .join("");
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t.number)}</th>
            <th>${escapeHtml(t.practitioner)}</th>
            <th>${escapeHtml(t.type)}</th>
            <th>${escapeHtml(t.specialty)}</th>
            <th>${escapeHtml(t.branch)}</th>
            <th>${escapeHtml(t.links)}</th>
            <th>${escapeHtml(t.status)}</th>
            <th>${escapeHtml(t.mobile)}</th>
            <th>${escapeHtml(t.email)}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    const selectedBranchName =
      branchFilter === "all"
        ? undefined
        : branches.find(
            (branch) => branch.id === branchFilter,
          )?.name;
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: t.recordsDescription,
      branchName: selectedBranchName,
      tableHtml,
      recordsCount: filtered.length,
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printed);
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <Card className="mx-auto max-w-3xl rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <CircleSlash2 className="h-7 w-7" />
            </span>
            <CardTitle>{t.loadingErrorTitle}</CardTitle>
            <CardDescription>{t.loadingErrorDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => void loadData()}>
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
      dir={dir}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-5xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <BriefcaseMedical className="h-3.5 w-3.5 text-[#a57b3d]" />
                            {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>

            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Stethoscope className="h-4 w-4 text-emerald-500" />
              {locale === "ar"
                ? "متصل بواجهات ملفات الممارسين والبنية الطبية الحقيقية"
                : "Connected to live practitioner and medical structure APIs"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={refreshing}
              onClick={() => void loadData(true)}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t.refresh}
            </Button>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={printRegister}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button variant="brand" className={registerBrandButtonClass} onClick={openCreate}>
              <UserRoundPlus className="h-4 w-4" />
              {t.newPractitioner}
            </Button>
          </div>
        </header>

        {partialReferences ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t.partialTitle}</p>
                <p className="mt-1 text-sm opacity-80">{t.partialDescription}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.total}
            value={metrics.total}
            description={t.totalDescription}
            icon={UsersRound}
          />
          <SystemKpiCard
            title={t.active}
            value={metrics.active}
            description={t.activeDescription}
            icon={UserRoundCheck}
          />
          <SystemKpiCard
            title={t.accepting}
            value={metrics.accepting}
            description={t.acceptingDescription}
            icon={CalendarClock}
          />
          <SystemKpiCard
            title={t.suspended}
            value={metrics.suspended}
            description={t.suspendedDescription}
            icon={CircleSlash2}
          />
        </section>

        <nav
          aria-label={
            locale === "ar"
              ? "التنقل في إدارة الممارسين"
              : "Practitioner management navigation"
          }
          className="flex flex-wrap gap-2"
        >
          {[
            {
              href:
                "/system/practitioners",
              label:
                t.tabs.directory,
              icon:
                UsersRound,
              active:
                true,
              count:
                metrics.total,
            },
            {
              href:
                "/system/practitioners/assignments",
              label:
                t.tabs.assignments,
              icon:
                Stethoscope,
              active:
                false,
            },
            {
              href:
                "/system/practitioners/licenses",
              label:
                t.tabs.licenses,
              icon:
                BadgeCheck,
              active:
                false,
            },
            {
              href:
                "/system/practitioners/schedules",
              label:
                t.tabs.schedules,
              icon:
                CalendarClock,
              active:
                false,
            },
          ].map((item) => {
            const Icon =
              item.icon;
            return (
              <Button
                key={item.href}
                variant={
                  item.active
                    ? "brand"
                    : "outline"
                }
                className={cn(
                  "h-9 shadow-none",
                  !item.active &&
                    registerOutlineButtonClass,
                )}
                asChild
              >
                <Link
                  href={item.href}
                  aria-current={
                    item.active
                      ? "page"
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>
                    {item.label}
                  </span>
                  {typeof item.count ===
                  "number" ? (
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                      {item.count.toLocaleString(
                        "en-US",
                      )}
                    </span>
                  ) : null}
                </Link>
              </Button>
            );
          })}
        </nav>

        <Card className="w-full overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                <UsersRound className="h-4 w-4 text-[#a57b3d]" />{t.recordsTitle}</CardTitle>
              <CardDescription className="mt-1.5">
                {t.recordsDescription}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={exportExcel}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {t.excel}
              </Button>
              <Button
                variant="brand"
                className={registerBrandButtonClass}
                onClick={printRegister}
              >
                <Printer className="h-4 w-4" />
                {t.print}
              </Button>
            </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="grid w-full gap-3 xl:grid-cols-[minmax(300px,1.5fr)_160px_160px_190px_160px_160px_170px_auto]">
              <DataRegisterSearch
                value={search}
                onChange={setSearch}
                placeholder={t.searchPlaceholder}
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none">
                  <SelectValue placeholder={t.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatuses}</SelectItem>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none">
                  <SelectValue placeholder={t.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
                  {TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-9 bg-background shadow-none">
                  <SelectValue placeholder={t.allBranches} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allBranches}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DataRegisterDatePicker
                label={t.fromDate}
                value={fromDate}
                onChange={setFromDate}
                locale={locale}
              />

              <DataRegisterDatePicker
                label={t.toDate}
                value={toDate}
                onChange={setToDate}
                locale={locale}
              />

              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="h-9 bg-background shadow-none">
                  <SelectValue placeholder={t.sort} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.newest}</SelectItem>
                  <SelectItem value="oldest">{t.oldest}</SelectItem>
                  <SelectItem value="name">{t.nameSort}</SelectItem>
                  <SelectItem value="number">{t.numberSort}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </Button>
            </DataRegisterToolbar>

            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <Table
                  variant="register"
                  layout="fixed"
                  minWidth="1520px"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky start-0 z-20 w-[250px] bg-muted/40 text-start">
                        {t.practitioner}
                      </TableHead>
                      <TableHead className="w-[120px] text-start">{t.number}</TableHead>
                      <TableHead className="w-[130px] text-start">{t.type}</TableHead>
                      <TableHead className="w-[170px] text-start">{t.specialty}</TableHead>
                      <TableHead className="w-[190px] text-start">{t.branch}</TableHead>
                      <TableHead className="w-[190px] text-start">{t.contact}</TableHead>
                      <TableHead className="w-[125px] text-start">{t.hireDate}</TableHead>
                      <TableHead className="w-[200px] text-start">{t.links}</TableHead>
                      <TableHead className="w-[140px] text-start">{t.status}</TableHead>
                      <TableHead className="sticky end-0 z-20 w-[76px] bg-muted/40 text-center">
                        {t.action}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length ? (
                      filtered.map((item) => (
                        <TableRow
                          key={item.id}
                          role="link"
                          tabIndex={0}
                          className="group h-[62px] cursor-pointer hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          onClick={() =>
                            router.push(
                              `/system/practitioners/${encodeURIComponent(item.id)}`,
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(
                                `/system/practitioners/${encodeURIComponent(item.id)}`,
                              );
                            }
                          }}
                        >
                          <TableCell className="sticky start-0 z-10 h-[62px] bg-background px-4 text-start align-middle group-hover:bg-muted/35">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dccdb8] bg-white text-[#a57b3d] shadow-sm">
                                <Stethoscope className="h-4.5 w-4.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {item.fullNameAr || item.fullNameEn || t.unknown}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {item.professionalTitle || item.fullNameEn || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="text-start font-medium tabular-nums"
                          >
                            {item.practitionerNumber || "—"}
                          </TableCell>
                          <TableCell className="text-start">
                            {labelForType(item.practitionerType, locale)}
                          </TableCell>
                          <TableCell className="truncate text-start text-muted-foreground">
                            {item.primarySpecialty || "—"}
                          </TableCell>
                          <TableCell className="text-start">
                            <p className="truncate">{item.defaultBranch || "—"}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.defaultClinic || item.defaultDepartment || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-start">
                            <p dir="ltr" className="truncate text-sm tabular-nums">
                              {item.mobile || "—"}
                            </p>
                            <p dir="ltr" className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.email || "—"}
                            </p>
                          </TableCell>
                          <TableCell
                            dir="ltr"
                            className="text-start tabular-nums text-muted-foreground"
                          >
                            {item.hireDate ? item.hireDate.slice(0, 10) : "—"}
                          </TableCell>
                          <TableCell className="text-start">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="rounded-full font-normal">
                                {item.specialtiesCount} {t.specialties}
                              </Badge>
                              <Badge variant="outline" className="rounded-full font-normal">
                                {item.assignmentsCount} {t.assignments}
                              </Badge>
                              <Badge variant="outline" className="rounded-full font-normal">
                                {item.licensesCount} {t.licenses}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-start">
                            <div className="space-y-1.5">
                              <Badge
                                variant="outline"
                                className={`rounded-full ${statusBadgeClass(item.status)}`}
                              >
                                {labelForStatus(item.status, locale)}
                              </Badge>
                              <p className="text-[11px] text-muted-foreground">
                                {item.isAcceptingAppointments
                                  ? t.acceptingBadge
                                  : t.notAcceptingBadge}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell
                            className="sticky end-0 z-10 h-[62px] bg-background px-4 text-center align-middle group-hover:bg-muted/35"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={t.actions}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align={locale === "ar" ? "end" : "start"}
                                className="w-60"
                              >
                                <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/system/practitioners/${encodeURIComponent(
                                      item.id,
                                    )}`}
                                  >
                                    <Eye className="h-4 w-4 text-[#a57b3d]" />
                                    {t.details}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                  <Pencil className="h-4 w-4 text-[#a57b3d]" />
                                  {t.edit}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/system/practitioners/assignments?practitioner=${item.id}`}>
                                    <Building2 className="h-4 w-4 text-[#a57b3d]" />
                                    {t.openAssignments}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/system/practitioners/licenses?practitioner=${item.id}`}>
                                    <BadgeCheck className="h-4 w-4 text-[#a57b3d]" />
                                    {t.openLicenses}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/system/practitioners/schedules?practitioner=${item.id}`}>
                                    <CalendarClock className="h-4 w-4 text-[#a57b3d]" />
                                    {t.openSchedules}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className={
                                    item.status === "ACTIVE"
                                      ? "text-rose-700 focus:text-rose-700"
                                      : "text-emerald-700 focus:text-emerald-700"
                                  }
                                  onClick={() =>
                                    setStatusAction({
                                      practitioner: item,
                                      action:
                                        item.status === "ACTIVE"
                                          ? "suspend"
                                          : "activate",
                                    })
                                  }
                                >
                                  {item.status === "ACTIVE" ? (
                                    <CircleSlash2 className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  {item.status === "ACTIVE" ? t.suspend : t.activate}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-72">
                          <DataRegisterEmptyState
                            title={practitioners.length ? t.noResults : t.noRecords}
                            description={t.recordsDescription}
                            showReset={hasActiveFilters}
                            onReset={resetFilters}
                            resetLabel={t.reset}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
                <span>{t.resultCount}</span>
                <span dir="ltr" className="font-medium tabular-nums">
                  {filtered.length} / {practitioners.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl" dir={dir}>
          <form onSubmit={savePractitioner}>
            <DialogHeader>
              <DialogTitle>{form.id ? t.editTitle : t.createTitle}</DialogTitle>
              <DialogDescription>
                {form.id ? t.editDescription : t.createDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="practitioner-number">{t.practitionerNumber}</Label>
                <Input
                  id="practitioner-number"
                  dir="ltr"
                  value={form.practitionerNumber}
                  onChange={(event) => updateForm("practitionerNumber", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practitioner-type">{t.type}</Label>
                <Select
                  value={form.practitionerType}
                  onValueChange={(value) => updateForm("practitionerType", value)}
                >
                  <SelectTrigger id="practitioner-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name-ar">{t.fullNameAr}</Label>
                <Input
                  id="full-name-ar"
                  value={form.fullNameAr}
                  onChange={(event) => updateForm("fullNameAr", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name-en">{t.fullNameEn}</Label>
                <Input
                  id="full-name-en"
                  dir="ltr"
                  value={form.fullNameEn}
                  onChange={(event) => updateForm("fullNameEn", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional-title">{t.professionalTitle}</Label>
                <Input
                  id="professional-title"
                  value={form.professionalTitle}
                  onChange={(event) =>
                    updateForm("professionalTitle", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t.gender}</Label>
                <Select
                  value={form.gender || "none"}
                  onValueChange={(value) =>
                    updateForm("gender", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t.unspecified} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.unspecified}</SelectItem>
                    <SelectItem value="MALE">{t.male}</SelectItem>
                    <SelectItem value="FEMALE">{t.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">{t.mobile}</Label>
                <Input
                  id="mobile"
                  dir="ltr"
                  value={form.mobile}
                  onChange={(event) => updateForm("mobile", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire-date">{t.hireDate}</Label>
                <Input
                  id="hire-date"
                  type="date"
                  dir="ltr"
                  value={form.hireDate}
                  onChange={(event) => updateForm("hireDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-specialty">{t.defaultSpecialty}</Label>
                <Select
                  value={form.primarySpecialtyId || "none"}
                  onValueChange={(value) =>
                    updateForm("primarySpecialtyId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="primary-specialty">
                    <SelectValue placeholder={t.chooseSpecialty} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.none}</SelectItem>
                    {specialties.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-branch">{t.defaultBranch}</Label>
                <Select
                  value={form.defaultBranchId || "none"}
                  onValueChange={(value) => {
                    const next = value === "none" ? "" : value;
                    setForm((current) => ({
                      ...current,
                      defaultBranchId: next,
                      defaultClinicId: "",
                    }));
                  }}
                >
                  <SelectTrigger id="default-branch">
                    <SelectValue placeholder={t.chooseBranch} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.none}</SelectItem>
                    {branches.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-department">{t.defaultDepartment}</Label>
                <Select
                  value={form.defaultDepartmentId || "none"}
                  onValueChange={(value) => {
                    const next = value === "none" ? "" : value;
                    setForm((current) => ({
                      ...current,
                      defaultDepartmentId: next,
                      defaultClinicId: "",
                    }));
                  }}
                >
                  <SelectTrigger id="default-department">
                    <SelectValue placeholder={t.chooseDepartment} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.none}</SelectItem>
                    {filteredDepartments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-clinic">{t.defaultClinic}</Label>
                <Select
                  value={form.defaultClinicId || "none"}
                  onValueChange={(value) =>
                    updateForm("defaultClinicId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="default-clinic">
                    <SelectValue placeholder={t.chooseClinic} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.none}</SelectItem>
                    {filteredClinics.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3 md:col-span-2">
                <Checkbox
                  id="accepting-appointments"
                  checked={form.isAcceptingAppointments}
                  onCheckedChange={(checked) =>
                    updateForm("isAcceptingAppointments", checked === true)
                  }
                />
                <Label htmlFor="accepting-appointments" className="cursor-pointer">
                  {t.acceptingAppointments}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {t.cancel}
              </Button>
              <Button type="submit" variant="brand" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : form.id ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <UserRoundPlus className="h-4 w-4" />
                )}
                {saving ? t.saving : form.id ? t.save : t.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(statusAction)}
        onOpenChange={(open) => {
          if (!open) setStatusAction(null);
        }}
      >
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.action === "activate"
                ? t.confirmActivateTitle
                : t.confirmSuspendTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.action === "activate"
                ? t.confirmActivateDescription
                : t.confirmSuspendDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void applyStatusAction();
              }}
              disabled={saving}
              className={
                statusAction?.action === "suspend"
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : ""
              }
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
