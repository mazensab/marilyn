"use client";
// medical_structure_hr_spirit=true

import * as React from "react";
import {
  Activity,
  ArrowUpDown,
  Building2,
  FileSpreadsheet,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Power,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  type LucideIcon,
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
type Resource = "departments" | "specialties" | "clinics";
type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "code";
type ApiRecord = Record<string, unknown>;

type NamedRef = {
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
};

type StructureItem = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isActive: boolean;
  isSystem: boolean;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  branches: NamedRef[];
  specialties: NamedRef[];
};

type BranchOption = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

type StructureSummary = {
  departments: number;
  activeDepartments: number;
  clinics: number;
  activeClinics: number;
  systemSpecialties: number;
  customSpecialties: number;
  activeSpecialties: number;
};

type FormState = {
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  branchId: string;
  departmentId: string;
  branchIds: string[];
  specialtyIds: string[];
};

type PendingStatus = {
  resource: Resource;
  item: StructureItem;
  nextActive: boolean;
} | null;

const ENDPOINTS = {
  summary: "/api/company/medical/summary/",
  departments: "/api/company/medical/departments/",
  specialties: "/api/company/medical/specialties/",
  clinics: "/api/company/medical/clinics/",
  branches: "/api/company/branches/",
} as const;
const RESOURCES: Resource[] = [
  "departments",
  "specialties",
  "clinics",
];

const EMPTY_FORM: FormState = {
  code: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  branchId: "",
  departmentId: "",
  branchIds: [],
  specialtyIds: [],
};

const copy = {
  ar: {
    badge: "الإدارة المركزية",
    title: "البنية الطبية",
    description:
      "إدارة الأقسام الطبية والتخصصات والعيادات وربطها بفروع Marilyn Clinics من واجهات التشغيل الحقيقية.",
    connected: "متصل بواجهات البنية الطبية الحقيقية",
    refresh: "تحديث",
    export: "Excel",
    print: "طباعة",
    departments: "الأقسام",
    specialties: "التخصصات",
    clinics: "العيادات",
    activeDepartments: "الأقسام النشطة",
    activeClinics: "العيادات النشطة",
    systemSpecialties: "تخصصات النظام",
    customSpecialties: "التخصصات المضافة",
    activeSpecialties: "التخصصات النشطة",
    search: "ابحث بالاسم أو الكود أو الفرع أو القسم...",
    all: "الكل",
    allBranches: "كل الفروع",
    sortName: "الاسم",
    sortCode: "الكود",
    active: "نشط",
    inactive: "غير نشط",
    addDepartment: "إضافة قسم",
    addSpecialty: "إضافة تخصص",
    addClinic: "إضافة عيادة",
    editDepartment: "تعديل القسم",
    editSpecialty: "تعديل التخصص",
    editClinic: "تعديل العيادة",
    formDescription: "أدخل البيانات التشغيلية المطلوبة ثم احفظ التغييرات.",
    code: "الكود",
    nameAr: "الاسم بالعربية",
    nameEn: "الاسم بالإنجليزية",
    descriptionAr: "الوصف بالعربية",
    descriptionEn: "الوصف بالإنجليزية",
    branches: "الفروع",
    specialtiesField: "التخصصات",
    branch: "الفرع",
    department: "القسم",
    status: "الحالة",
    type: "النوع",
    system: "نظامي",
    custom: "مخصص",
    actions: "الإجراءات",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    save: "حفظ",
    cancel: "إلغاء",
    noData: "لا توجد سجلات متاحة حاليًا.",
    noResults: "لا توجد نتائج مطابقة للبحث أو الفلاتر.",
    loading: "جارٍ تحميل البنية الطبية...",
    partialTitle: "تم تحميل الصفحة جزئيًا",
    partialDescription:
      "تعذر تحميل بعض المصادر، لذلك تظهر البيانات المتاحة فقط.",
    errorTitle: "تعذر تحميل البنية الطبية",
    retry: "إعادة المحاولة",
    readOnlySystem: "تخصص نظامي للقراءة فقط",
    statusTitle: "تأكيد تغيير الحالة",
    statusDescription: "سيتم تحديث حالة السجل عبر واجهة البنية الطبية.",
    saved: "تم حفظ السجل بنجاح.",
    statusSaved: "تم تحديث الحالة بنجاح.",
    refreshed: "تم تحديث البنية الطبية.",
    exportEmpty: "لا توجد بيانات للتصدير.",
    printEmpty: "لا توجد بيانات للطباعة.",
    exportReady: "تم تجهيز ملف Excel.",
    printBlocked: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    required: "الكود والاسم العربي مطلوبان.",
    clinicRequired: "يجب تحديد الفرع والقسم للعيادة.",
    reportTitle: "تقرير البنية الطبية — Marilyn Clinics",
    linkedBranches: "الفروع المرتبطة",
    linkedSpecialties: "التخصصات المرتبطة",
    registerTitle: "سجل البنية الطبية",
    registerDescription: "قائمة تشغيلية موحدة لإدارة سجلات البنية الطبية وعلاقاتها وحالاتها.",
    reset: "إعادة ضبط",
    resultsCount: "عدد النتائج",
    activeCount: "النشطة",
    totalCount: "الإجمالي",
    unknown: "غير محدد",
  },
  en: {
    badge: "Central administration",
    title: "Medical Structure",
    description:
      "Manage medical departments, specialties, clinics, and their Marilyn Clinics branch relationships through live operational APIs.",
    connected: "Connected to live medical structure APIs",
    refresh: "Refresh",
    export: "Excel",
    print: "Print",
    departments: "Departments",
    specialties: "Specialties",
    clinics: "Clinics",
    activeDepartments: "Active departments",
    activeClinics: "Active clinics",
    systemSpecialties: "System specialties",
    customSpecialties: "Custom specialties",
    activeSpecialties: "Active specialties",
    search: "Search by name, code, branch, or department...",
    all: "All",
    allBranches: "All branches",
    sortName: "Name",
    sortCode: "Code",
    active: "Active",
    inactive: "Inactive",
    addDepartment: "Add department",
    addSpecialty: "Add specialty",
    addClinic: "Add clinic",
    editDepartment: "Edit department",
    editSpecialty: "Edit specialty",
    editClinic: "Edit clinic",
    formDescription: "Enter the required operational data, then save.",
    code: "Code",
    nameAr: "Arabic name",
    nameEn: "English name",
    descriptionAr: "Arabic description",
    descriptionEn: "English description",
    branches: "Branches",
    specialtiesField: "Specialties",
    branch: "Branch",
    department: "Department",
    status: "Status",
    type: "Type",
    system: "System",
    custom: "Custom",
    actions: "Actions",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    save: "Save",
    cancel: "Cancel",
    noData: "No records are currently available.",
    noResults: "No records match the current search or filters.",
    loading: "Loading medical structure...",
    partialTitle: "Partially loaded",
    partialDescription:
      "Some sources could not be loaded, so only available data is shown.",
    errorTitle: "Could not load medical structure",
    retry: "Try again",
    readOnlySystem: "Read-only system specialty",
    statusTitle: "Confirm status change",
    statusDescription: "The record status will be updated through the medical structure API.",
    saved: "Record saved successfully.",
    statusSaved: "Status updated successfully.",
    refreshed: "Medical structure refreshed.",
    exportEmpty: "There is no data to export.",
    printEmpty: "There is no data to print.",
    exportReady: "Excel file prepared.",
    printBlocked: "The print window could not be opened. Allow pop-ups and try again.",
    required: "Code and Arabic name are required.",
    clinicRequired: "Clinic branch and department are required.",
    reportTitle: "Medical Structure Report — Marilyn Clinics",
    linkedBranches: "Linked branches",
    linkedSpecialties: "Linked specialties",
    registerTitle: "Medical structure register",
    registerDescription: "A unified operational register for medical structure records, relationships, and statuses.",
    reset: "Reset",
    resultsCount: "Results",
    activeCount: "Active",
    totalCount: "Total",
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
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  const normalized = text(value).toLowerCase();
  if (["1", "true", "yes", "active", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) return false;
  return fallback;
}

function firstArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const source = record(payload);
  const data = record(source.data);
  const candidates = [
    source.items,
    source.results,
    source.records,
    source.rows,
    source.departments,
    source.specialties,
    source.clinics,
    data.items,
    data.results,
    data.records,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function nestedName(value: unknown): string {
  if (typeof value === "string") return value;
  const source = record(value);
  return text(
    source.name_ar ||
      source.name ||
      source.display_name ||
      source.branch_name ||
      source.department_name ||
      source.specialty_name ||
      source.name_en ||
      source.code,
  );
}

function normalizeRef(value: unknown): NamedRef {
  const source = record(value);
  const nestedBranch = record(source.branch);
  const nestedSpecialty = record(source.specialty);
  const candidate = Object.keys(nestedBranch).length
    ? nestedBranch
    : Object.keys(nestedSpecialty).length
      ? nestedSpecialty
      : source;
  return {
    id: text(
      source.branch_id ||
        source.specialty_id ||
        candidate.id ||
        candidate.pk ||
        candidate.uuid,
    ),
    code: text(
      source.branch_code ||
        source.specialty_code ||
        candidate.code ||
        candidate.branch_code,
    ),
    name:
      text(source.branch_name || source.specialty_name) ||
      nestedName(candidate) ||
      text(candidate.code),
    isPrimary: boolValue(source.is_primary),
    isActive: boolValue(source.is_active, true),
  };
}

function normalizeItem(value: unknown): StructureItem {
  const source = record(value);
  const branch = record(source.branch);
  const department = record(source.department);
  const branches = Array.isArray(source.branches)
    ? source.branches.map(normalizeRef)
    : Array.isArray(source.branch_links)
      ? source.branch_links.map(normalizeRef)
      : [];
  const specialties = Array.isArray(source.specialties)
    ? source.specialties.map(normalizeRef)
    : Array.isArray(source.specialty_links)
      ? source.specialty_links.map(normalizeRef)
      : [];

  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(source.code || source.department_code || source.clinic_code),
    nameAr: text(source.name_ar || source.name || source.title),
    nameEn: text(source.name_en),
    descriptionAr: text(source.description_ar || source.description),
    descriptionEn: text(source.description_en),
    isActive: boolValue(source.is_active, true),
    isSystem: boolValue(source.is_system) || source.company_id === null,
    branchId: text(source.branch_id || branch.id || branch.pk),
    branchName:
      text(source.branch_name) || nestedName(branch) || text(source.branch_code),
    departmentId: text(source.department_id || department.id || department.pk),
    departmentName:
      text(source.department_name) ||
      nestedName(department) ||
      text(source.department_code),
    branches,
    specialties,
  };
}

function normalizeBranch(value: unknown): BranchOption {
  const source = record(value);
  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(source.code || source.branch_code),
    name: text(
      source.name_ar ||
        source.name ||
        source.branch_name ||
        source.display_name ||
        source.name_en ||
        source.code,
    ),
    isActive: boolValue(source.is_active ?? source.status, true),
  };
}

function getApiBaseUrl() {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
  return envBase.endsWith("/api") ? envBase.slice(0, -4) : envBase;
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
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
    const source = record(payload);
    const errors = record(source.errors);
    const firstError = Object.values(errors).find((item) => Array.isArray(item));
    throw new Error(
      text(source.message || source.detail || source.error) ||
        (Array.isArray(firstError) ? text(firstError[0]) : "") ||
        `HTTP ${response.status}`,
    );
  }

  return payload;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function displayName(item: StructureItem, locale: Locale) {
  return locale === "ar"
    ? item.nameAr || item.nameEn || item.code
    : item.nameEn || item.nameAr || item.code;
}

function joinNames(items: NamedRef[], fallback: string) {
  const names = items.filter((item) => item.isActive).map((item) => item.name).filter(Boolean);
  return names.length ? names.join("، ") : fallback;
}

function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

function relationIds(items: NamedRef[]) {
  return items.filter((item) => item.isActive).map((item) => item.id).filter(Boolean);
}
function resourceIcon(
  resource: Resource,
): LucideIcon {
  return {
    departments: Building2,
    specialties: ShieldCheck,
    clinics: Stethoscope,
  }[resource];
}

function buildReportRows(
  rows: StructureItem[],
  resource: Resource,
  locale: Locale,
  t: (typeof copy)[Locale],
) {
  const headers =
    resource === "departments"
      ? [t.code, t.nameAr, t.nameEn, t.linkedBranches, t.linkedSpecialties, t.status]
      : resource === "specialties"
        ? [t.code, t.nameAr, t.nameEn, t.type, t.status]
        : [t.code, t.nameAr, t.nameEn, t.branch, t.department, t.linkedSpecialties, t.status];

  const body = rows.map((item) => {
    const common = [
      item.code,
      item.nameAr,
      item.nameEn,
    ];
    if (resource === "departments") {
      return [
        ...common,
        joinNames(item.branches, "—"),
        joinNames(item.specialties, "—"),
        item.isActive ? t.active : t.inactive,
      ];
    }
    if (resource === "specialties") {
      return [
        ...common,
        item.isSystem ? t.system : t.custom,
        item.isActive ? t.active : t.inactive,
      ];
    }
    return [
      ...common,
      item.branchName || "—",
      item.departmentName || "—",
      joinNames(item.specialties, "—"),
      item.isActive ? t.active : t.inactive,
    ];
  });

  const html = `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${body
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;

  return { headers, body, html, locale };
}

function downloadExcel(
  rows: StructureItem[],
  resource: Resource,
  locale: Locale,
  t: (typeof copy)[Locale],
) {
  if (!rows.length) {
    toast.warning(t.exportEmpty);
    return;
  }

  const report = buildReportRows(rows, resource, locale, t);
  const direction = locale === "ar" ? "rtl" : "ltr";
  const title =
    resource === "departments"
      ? t.departments
      : resource === "specialties"
        ? t.specialties
        : t.clinics;
  const html = `<!doctype html>
<html dir="${direction}" lang="${locale}">
<head>
<meta charset="UTF-8" />
<style>
body{font-family:Tahoma,Arial,sans-serif;padding:18px;color:#111}
h1{font-size:20px;margin:0 0 16px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:7px;text-align:${locale === "ar" ? "right" : "left"}}
th{background:#eee}
</style>
</head>
<body><h1>${escapeHtml(t.reportTitle)} — ${escapeHtml(title)}</h1>${report.html}</body>
</html>`;

  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `medical-structure-${resource}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success(t.exportReady);
}

async function printRows(
  rows: StructureItem[],
  resource: Resource,
  locale: Locale,
  t: (typeof copy)[Locale],
  branchName: string,
) {
  if (!rows.length) {
    toast.warning(t.printEmpty);
    return;
  }
  const report = buildReportRows(rows, resource, locale, t);
  const title =
    resource === "departments"
      ? t.departments
      : resource === "specialties"
        ? t.specialties
        : t.clinics;
  const opened = await openPrintReport({
    locale,
    title: t.reportTitle,
    subtitle: title,
    branchName,
    tableHtml: report.html,
    recordsCount: rows.length,
    logoUrl: "/logo/marilyn.svg",
  });
  if (!opened) {
    toast.error(t.printBlocked);
  }
}

function RelationPicker({
  label,
  options,
  selected,
  onChange,
  emptyLabel,
}: {
  label: string;
  options: Array<{ id: string; name: string; code?: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
        {options.length ? (
          options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-background"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    onChange(
                      value
                        ? Array.from(new Set([...selected, option.id]))
                        : selected.filter((id) => id !== option.id),
                    );
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{option.name}</span>
                  {option.code ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.code}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

type MedicalKpiItem = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

export default function MedicalStructureClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const t = copy[locale];
  const rtl = locale === "ar";

  const [resource, setResource] = React.useState<Resource>("departments");
  const [summaryPayload, setSummaryPayload] = React.useState<unknown>({});
  const [departmentsPayload, setDepartmentsPayload] = React.useState<unknown>({});
  const [specialtiesPayload, setSpecialtiesPayload] = React.useState<unknown>({});
  const [clinicsPayload, setClinicsPayload] = React.useState<unknown>({});
  const [branchesPayload, setBranchesPayload] = React.useState<unknown>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [branchFilter, setBranchFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StructureItem | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [pendingStatus, setPendingStatus] = React.useState<PendingStatus>(null);

  React.useEffect(() => {
    const syncLocale = () => setLocale(getInitialLocale());
    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener("primey-locale-changed", syncLocale);
    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener("primey-locale-changed", syncLocale);
    };
  }, []);
  React.useEffect(() => {
    const view =
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(
            window.location.search,
          ).get("view") || "";
    if (
      RESOURCES.includes(
        view as Resource,
      )
    ) {
      setResource(
        view as Resource,
      );
    }
  }, []);

  const load = React.useCallback(
    async ({
      silent = false,
      signal,
    }: {
      silent?: boolean;
      signal?: AbortSignal;
    } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      const sources = [
        ENDPOINTS.summary,
        ENDPOINTS.departments,
        ENDPOINTS.specialties,
        ENDPOINTS.clinics,
        ENDPOINTS.branches,
      ];

      try {
        const results = await Promise.allSettled(
          sources.map((path) => apiRequest(path, { method: "GET" }, signal)),
        );

        if (signal?.aborted) return;

        const failed = results
          .filter((item): item is PromiseRejectedResult => item.status === "rejected")
          .map((item) => (item.reason instanceof Error ? item.reason.message : String(item.reason)))
          .filter(Boolean);

        if (failed.length === results.length) {
          throw new Error(failed[0] || t.errorTitle);
        }

        const valueAt = (index: number) =>
          results[index]?.status === "fulfilled"
            ? (results[index] as PromiseFulfilledResult<unknown>).value
            : {};

        setSummaryPayload(valueAt(0));
        setDepartmentsPayload(valueAt(1));
        setSpecialtiesPayload(valueAt(2));
        setClinicsPayload(valueAt(3));
        setBranchesPayload(valueAt(4));
        setWarnings(failed);

        if (silent) toast.success(t.refreshed);
      } catch (caught) {
        if (signal?.aborted) return;
        const message = caught instanceof Error ? caught.message : t.errorTitle;
        setError(message);
        if (silent) toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [t.errorTitle, t.refreshed],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const departments = React.useMemo(
    () => firstArray(departmentsPayload).map(normalizeItem),
    [departmentsPayload],
  );
  const specialties = React.useMemo(
    () => firstArray(specialtiesPayload).map(normalizeItem),
    [specialtiesPayload],
  );
  const clinics = React.useMemo(
    () => firstArray(clinicsPayload).map(normalizeItem),
    [clinicsPayload],
  );
  const branches = React.useMemo(
    () => firstArray(branchesPayload).map(normalizeBranch).filter((item) => item.id),
    [branchesPayload],
  );

  const summary = React.useMemo<StructureSummary>(() => {
    const root = record(summaryPayload);
    const source = record(root.summary);
    return {
      departments: numberValue(source.departments, departments.length),
      activeDepartments: numberValue(
        source.active_departments,
        departments.filter((item) => item.isActive).length,
      ),
      clinics: numberValue(source.clinics, clinics.length),
      activeClinics: numberValue(
        source.active_clinics,
        clinics.filter((item) => item.isActive).length,
      ),
      systemSpecialties: numberValue(
        source.system_specialties,
        specialties.filter((item) => item.isSystem).length,
      ),
      customSpecialties: numberValue(
        source.custom_specialties,
        specialties.filter((item) => !item.isSystem).length,
      ),
      activeSpecialties: numberValue(
        source.active_specialties ?? source.active_custom_specialties,
        specialties.filter((item) => item.isActive).length,
      ),
    };
  }, [clinics, departments, specialties, summaryPayload]);

  const currentRows =
    resource === "departments"
      ? departments
      : resource === "specialties"
        ? specialties
        : clinics;

  const filteredRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return currentRows
      .filter((item) => {
        if (statusFilter === "active" && !item.isActive) return false;
        if (statusFilter === "inactive" && item.isActive) return false;

        if (branchFilter !== "all" && resource !== "specialties") {
          const matchesBranch =
            resource === "departments"
              ? item.branches.some(
                  (branch) => branch.id === branchFilter && branch.isActive,
                )
              : item.branchId === branchFilter;

          if (!matchesBranch) return false;
        }

        if (!needle) return true;

        return [
          item.code,
          item.nameAr,
          item.nameEn,
          item.branchName,
          item.departmentName,
          ...item.branches.map((ref) => ref.name),
          ...item.specialties.map((ref) => ref.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        if (sortKey === "code") {
          return a.code.localeCompare(b.code, locale);
        }
        return displayName(a, locale).localeCompare(displayName(b, locale));
      });
  }, [branchFilter, currentRows, locale, query, resource, sortKey, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: StructureItem) => {
    if (resource === "specialties" && item.isSystem) {
      toast.info(t.readOnlySystem);
      return;
    }

    setEditing(item);
    setForm({
      code: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      branchId: item.branchId,
      departmentId: item.departmentId,
      branchIds: relationIds(item.branches),
      specialtyIds: relationIds(item.specialties),
    });
    setDialogOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() || !form.nameAr.trim()) {
      toast.error(t.required);
      return;
    }

    if (resource === "clinics" && (!form.branchId || !form.departmentId)) {
      toast.error(t.clinicRequired);
      return;
    }

    const payload: ApiRecord = {
      code: form.code.trim(),
      name_ar: form.nameAr.trim(),
      name_en: form.nameEn.trim(),
      description_ar: form.descriptionAr.trim(),
      description_en: form.descriptionEn.trim(),
    };

    if (resource === "departments") {
      payload.branch_ids = form.branchIds;
      payload.specialty_ids = form.specialtyIds;
    }

    if (resource === "clinics") {
      payload.branch_id = form.branchId;
      payload.department_id = form.departmentId;
      payload.specialty_ids = form.specialtyIds;
    }

    try {
      setSaving(true);
      const base = ENDPOINTS[resource];
      const path = editing ? `${base}${encodeURIComponent(editing.id)}/` : base;
      await apiRequest(path, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(t.saved);
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load({ silent: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.errorTitle);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!pendingStatus) return;

    try {
      setStatusSaving(true);
      const base = ENDPOINTS[pendingStatus.resource];
      await apiRequest(
        `${base}${encodeURIComponent(pendingStatus.item.id)}/status/`,
        {
          method: "POST",
          body: JSON.stringify({
            action: pendingStatus.nextActive ? "activate" : "deactivate",
          }),
        },
      );
      toast.success(t.statusSaved);
      setPendingStatus(null);
      await load({ silent: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.errorTitle);
    } finally {
      setStatusSaving(false);
    }
  };

  const addLabel =
    resource === "departments"
      ? t.addDepartment
      : resource === "specialties"
        ? t.addSpecialty
        : t.addClinic;

  const dialogTitle = editing
    ? resource === "departments"
      ? t.editDepartment
      : resource === "specialties"
        ? t.editSpecialty
        : t.editClinic
    : addLabel;

  const resourceLabel =
    resource === "departments"
      ? t.departments
      : resource === "specialties"
        ? t.specialties
        : t.clinics;

  const tableColumnCount =
    resource === "departments" ? 7 : resource === "specialties" ? 6 : 8;

  const activeResourceCount = currentRows.filter((item) => item.isActive).length;

  const summaryCards: MedicalKpiItem[] = [
    {
      title: t.departments,
      value: summary.departments,
      description: `${t.activeCount}: ${summary.activeDepartments.toLocaleString("en-US")}`,
      icon: Building2,
    },
    {
      title: t.clinics,
      value: summary.clinics,
      description: `${t.activeCount}: ${summary.activeClinics.toLocaleString("en-US")}`,
      icon: Stethoscope,
    },
    {
      title: t.systemSpecialties,
      value: summary.systemSpecialties,
      description: t.readOnlySystem,
      icon: ShieldCheck,
    },
    {
      title: t.customSpecialties,
      value: summary.customSpecialties,
      description: `${t.activeSpecialties}: ${summary.activeSpecialties.toLocaleString("en-US")}`,
      icon: Plus,
    },
  ];

  const hasFilters =
    Boolean(query) ||
    statusFilter !== "all" ||
    branchFilter !== "all" ||
    sortKey !== "name";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("all");
    setSortKey("name");
  };
  const selectResource = (
    next: Resource,
  ) => {
    setResource(next);
    resetFilters();
    const url = new URL(
      window.location.href,
    );
    url.searchParams.set(
      "view",
      next,
    );
    window.history.replaceState(
      {},
      "",
      url.toString(),
    );
  };

  const selectedBranchName =
    branchFilter === "all"
      ? locale === "ar"
        ? "جميع الفروع"
        : "All branches"
      : branches.find((branch) => branch.id === branchFilter)?.name ||
        (locale === "ar" ? "جميع الفروع" : "All branches");  const ResourceIcon =
    resourceIcon(resource);
  return (
    <main
      dir={rtl ? "rtl" : "ltr"}
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

            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.description}
            </p>

            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              {t.connected}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
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
              className={registerOutlineButtonClass}
              onClick={() => downloadExcel(filteredRows, resource, locale, t)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.export}
            </Button>

            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void printRows(filteredRows, resource, locale, t, selectedBranchName)}
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>

            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          </div>
        </header>

        {warnings.length ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t.partialTitle}</p>
                <p className="mt-1 text-sm opacity-80">{t.partialDescription}</p>
                <p className="mt-1 text-xs opacity-70">{warnings.join(" • ")}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="rounded-lg border-rose-200 bg-card shadow-none">
            <CardHeader className="items-center text-center">
              <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <Stethoscope className="h-7 w-7" />
              </span>
              <CardTitle>{t.errorTitle}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button type="button" onClick={() => void load()}>
                <RefreshCw className="h-4 w-4" />
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={`medical-summary-loading-${index}`}
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
            : summaryCards.map((item) => (
                <SystemKpiCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  description={item.description}
                  icon={item.icon}
                />
              ))}
        </section>
        <nav
          aria-label={t.title}
          className="flex flex-wrap gap-2"
        >
          {RESOURCES.map((item) => {
            const Icon =
              resourceIcon(item);
            const active =
              item === resource;
            const count =
              item === "departments"
                ? departments.length
                : item === "specialties"
                  ? specialties.length
                  : clinics.length;
            const label =
              item === "departments"
                ? t.departments
                : item === "specialties"
                  ? t.specialties
                  : t.clinics;
            return (
              <Button
                key={item}
                type="button"
                variant={
                  active
                    ? "brand"
                    : "outline"
                }
                className={cn(
                  "h-9 shadow-none",
                  !active &&
                    registerOutlineButtonClass,
                )}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  selectResource(item)
                }
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                  {count.toLocaleString(
                    "en-US",
                  )}
                </span>
              </Button>
            );
          })}
        </nav>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <ResourceIcon className="h-4 w-4 text-[#a57b3d]" />
                  {resourceLabel}
                </CardTitle>
                <CardDescription className="mt-1 leading-6">
                  {t.registerDescription}
                </CardDescription>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={() => downloadExcel(filteredRows, resource, locale, t)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.export}
                </Button>

                <Button
                  type="button"
                  variant="brand"
                  className={registerBrandButtonClass}
                  onClick={() => void printRows(filteredRows, resource, locale, t, selectedBranchName)}
                >
                  <Printer className="h-4 w-4" />
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

                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="inactive">{t.inactive}</SelectItem>
                  </SelectContent>
                </Select>

                {resource !== "specialties" ? (
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-9 bg-background shadow-none sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                      <SelectItem value="all">{t.allBranches}</SelectItem>
                      {branches
                        .filter((branch) => branch.isActive)
                        .map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as SortKey)}
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[180px]">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="name">{t.sortName}</SelectItem>
                    <SelectItem value="code">{t.sortCode}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  className={registerOutlineButtonClass}
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
                    minWidth="1120px"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={`sticky z-20 h-11 w-[250px] bg-muted/40 px-4 text-start text-xs font-semibold text-muted-foreground ${
                            rtl ? "right-0" : "left-0"
                          }`}
                        >
                          {t.nameAr}
                        </TableHead>
                        <TableHead className="h-11 w-[125px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.code}
                        </TableHead>
                        <TableHead className="h-11 w-[210px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.nameEn}
                        </TableHead>

                        {resource === "departments" ? (
                          <>
                            <TableHead className="h-11 w-[230px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.linkedBranches}
                            </TableHead>
                            <TableHead className="h-11 w-[230px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.linkedSpecialties}
                            </TableHead>
                          </>
                        ) : null}

                        {resource === "specialties" ? (
                          <TableHead className="h-11 w-[140px] px-4 text-start text-xs font-semibold text-muted-foreground">
                            {t.type}
                          </TableHead>
                        ) : null}

                        {resource === "clinics" ? (
                          <>
                            <TableHead className="h-11 w-[180px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.branch}
                            </TableHead>
                            <TableHead className="h-11 w-[180px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.department}
                            </TableHead>
                            <TableHead className="h-11 w-[220px] px-4 text-start text-xs font-semibold text-muted-foreground">
                              {t.linkedSpecialties}
                            </TableHead>
                          </>
                        ) : null}

                        <TableHead className="h-11 w-[120px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.status}
                        </TableHead>
                        <TableHead
                          className={`sticky z-20 h-11 w-[84px] bg-muted/40 px-4 text-center text-xs font-semibold text-muted-foreground ${
                            rtl ? "left-0" : "right-0"
                          }`}
                        >
                          {t.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow
                            key={`medical-row-loading-${index}`}
                            className="h-[62px]"
                          >
                            <TableCell colSpan={tableColumnCount} className="h-[62px] px-4">
                              <Skeleton className="h-9 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredRows.length ? (
                        filteredRows.map((item) => (
                          <TableRow
                            key={`${resource}-${item.id}`}
                            className="group h-[62px] hover:bg-muted/35"
                          >
                            <TableCell
                              className={`sticky z-10 h-[62px] overflow-hidden bg-background px-4 text-start align-middle group-hover:bg-muted/35 ${
                                rtl ? "right-0" : "left-0"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {item.nameAr || item.nameEn || item.code || "—"}
                                </p>
                                {item.descriptionAr ? (
                                  <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {item.descriptionAr}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle font-mono text-xs">
                              {item.code || "—"}
                            </TableCell>
                            <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                              <span className="block truncate">{item.nameEn || "—"}</span>
                            </TableCell>

                            {resource === "departments" ? (
                              <>
                                <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle text-muted-foreground">
                                  <span className="block truncate">
                                    {joinNames(item.branches, "—")}
                                  </span>
                                </TableCell>
                                <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle text-muted-foreground">
                                  <span className="block truncate">
                                    {joinNames(item.specialties, "—")}
                                  </span>
                                </TableCell>
                              </>
                            ) : null}

                            {resource === "specialties" ? (
                              <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                                <Badge variant={item.isSystem ? "secondary" : "outline"}>
                                  {item.isSystem ? t.system : t.custom}
                                </Badge>
                              </TableCell>
                            ) : null}

                            {resource === "clinics" ? (
                              <>
                                <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                                  <span className="block truncate">{item.branchName || "—"}</span>
                                </TableCell>
                                <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                                  <span className="block truncate">{item.departmentName || "—"}</span>
                                </TableCell>
                                <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle text-muted-foreground">
                                  <span className="block truncate">
                                    {joinNames(item.specialties, "—")}
                                  </span>
                                </TableCell>
                              </>
                            ) : null}

                            <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                              <Badge
                                variant="outline"
                                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass(item.isActive)}`}
                              >
                                {item.isActive ? t.active : t.inactive}
                              </Badge>
                            </TableCell>

                            <TableCell
                              className={`sticky z-10 h-[62px] bg-background px-4 text-center align-middle group-hover:bg-muted/35 ${
                                rtl ? "left-0" : "right-0"
                              }`}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">{t.actions}</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={rtl ? "start" : "end"}>
                                  <DropdownMenuItem
                                    disabled={resource === "specialties" && item.isSystem}
                                    onSelect={() => openEdit(item)}
                                  >
                                    <Edit3 className="h-4 w-4 text-[#b58c4d]" />
                                    {resource === "specialties" && item.isSystem
                                      ? t.readOnlySystem
                                      : t.edit}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={resource === "specialties" && item.isSystem}
                                    className={
                                      item.isActive
                                        ? "text-rose-600"
                                        : "text-emerald-700"
                                    }
                                    onSelect={() =>
                                      setPendingStatus({
                                        resource,
                                        item,
                                        nextActive: !item.isActive,
                                      })
                                    }
                                  >
                                    <Power className="h-4 w-4" />
                                    {item.isActive ? t.deactivate : t.activate}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={tableColumnCount} className="h-72">
                            <DataRegisterEmptyState
                              title={currentRows.length ? t.noResults : t.noData}
                              description={t.registerDescription}
                              showReset={hasFilters}
                              onReset={resetFilters}
                              resetLabel={t.reset}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {t.resultsCount}:{" "}
                  <strong className="font-medium text-foreground tabular-nums">
                    {filteredRows.length.toLocaleString("en-US")}
                  </strong>
                  {" / "}
                  <strong className="font-medium text-foreground tabular-nums">
                    {currentRows.length.toLocaleString("en-US")}
                  </strong>
                  {" · "}
                  {t.activeCount}:{" "}
                  <strong className="font-medium text-foreground tabular-nums">
                    {activeResourceCount.toLocaleString("en-US")}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  {t.connected}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              setForm(EMPTY_FORM);
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir={rtl ? "rtl" : "ltr"}>
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{t.formDescription}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medical-code">{t.code}</Label>
                <Input
                  id="medical-code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  required
                  disabled={editing?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical-name-ar">{t.nameAr}</Label>
                <Input
                  id="medical-name-ar"
                  value={form.nameAr}
                  onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical-name-en">{t.nameEn}</Label>
                <Input
                  id="medical-name-en"
                  value={form.nameEn}
                  onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
                />
              </div>

              {resource === "clinics" ? (
                <>
                  <div className="space-y-2">
                    <Label>{t.branch}</Label>
                    <Select
                      value={form.branchId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          branchId: value,
                          departmentId: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.branch} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          .filter((branch) => branch.isActive)
                          .map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name} {branch.code ? `— ${branch.code}` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.department}</Label>
                    <Select
                      value={form.departmentId}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, departmentId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.department} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments
                          .filter(
                            (department) =>
                              department.isActive &&
                              (!form.branchId ||
                                !department.branches.length ||
                                department.branches.some(
                                  (branch) =>
                                    branch.id === form.branchId && branch.isActive,
                                )),
                          )
                          .map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {displayName(department, locale)} — {department.code}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medical-description-ar">{t.descriptionAr}</Label>
                <Textarea
                  id="medical-description-ar"
                  value={form.descriptionAr}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descriptionAr: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medical-description-en">{t.descriptionEn}</Label>
                <Textarea
                  id="medical-description-en"
                  value={form.descriptionEn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descriptionEn: event.target.value,
                    }))
                  }
                />
              </div>

              {resource === "departments" ? (
                <>
                  <RelationPicker
                    label={t.branches}
                    options={branches
                      .filter((branch) => branch.isActive)
                      .map((branch) => ({
                        id: branch.id,
                        name: branch.name,
                        code: branch.code,
                      }))}
                    selected={form.branchIds}
                    onChange={(branchIds) =>
                      setForm((current) => ({ ...current, branchIds }))
                    }
                    emptyLabel={t.noData}
                  />
                  <RelationPicker
                    label={t.specialtiesField}
                    options={specialties
                      .filter((specialty) => specialty.isActive)
                      .map((specialty) => ({
                        id: specialty.id,
                        name: displayName(specialty, locale),
                        code: specialty.code,
                      }))}
                    selected={form.specialtyIds}
                    onChange={(specialtyIds) =>
                      setForm((current) => ({ ...current, specialtyIds }))
                    }
                    emptyLabel={t.noData}
                  />
                </>
              ) : null}

              {resource === "clinics" ? (
                <div className="md:col-span-2">
                  <RelationPicker
                    label={t.specialtiesField}
                    options={specialties
                      .filter((specialty) => specialty.isActive)
                      .map((specialty) => ({
                        id: specialty.id,
                        name: displayName(specialty, locale),
                        code: specialty.code,
                      }))}
                    selected={form.specialtyIds}
                    onChange={(specialtyIds) =>
                      setForm((current) => ({ ...current, specialtyIds }))
                    }
                    emptyLabel={t.noData}
                  />
                </div>
              ) : null}
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (!open && !statusSaving) setPendingStatus(null);
        }}
      >
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.statusTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.statusDescription}
              {pendingStatus ? (
                <span className="mt-2 block font-medium text-foreground">
                  {displayName(pendingStatus.item, locale)} —{" "}
                  {pendingStatus.nextActive ? t.activate : t.deactivate}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusSaving}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={statusSaving}
              className={
                pendingStatus?.nextActive
                  ? "bg-[#b58c4d] text-white hover:bg-[#9a713a]"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }
              onClick={(event) => {
                event.preventDefault();
                void updateStatus();
              }}
            >
              {statusSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pendingStatus?.nextActive ? t.activate : t.deactivate}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
