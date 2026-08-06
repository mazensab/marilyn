"use client";

// practitioner_licenses_hr_spirit=true

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  MoreVertical,
  Pencil,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserRoundPlus,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PractitionerManagementTabs } from "@/components/system/practitioner-management-tabs";
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

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;

type Practitioner = {
  id: string;
  number: string;
  nameAr: string;
  nameEn: string;
  status: string;
};

type Specialty = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
};

type LicenseRecord = {
  id: string;
  practitionerId: string;
  practitionerNameAr: string;
  practitionerNameEn: string;
  practitionerNumber: string;
  specialtyId: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
  licenseNumber: string;
  licenseType: string;
  issuingAuthority: string;
  status: string;
  statusDisplay: string;
  issuedAt: string;
  expiresAt: string;
  verifiedAt: string;
  documentReference: string;
  notes: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
};

type LicenseForm = {
  id: string;
  practitionerId: string;
  specialtyId: string;
  licenseNumber: string;
  licenseType: string;
  issuingAuthority: string;
  issuedAt: string;
  expiresAt: string;
  verifiedAt: string;
  documentReference: string;
  notes: string;
};

type PendingStatus = {
  item: LicenseRecord;
  action: "verify" | "pending" | "activate" | "suspend" | "expire" | "revoke";
} | null;

const API = {
  practitioners: "/api/company/medical/practitioners/",
  specialties: "/api/company/medical/specialties/",
} as const;

const EMPTY_FORM: LicenseForm = {
  id: "",
  practitionerId: "",
  specialtyId: "none",
  licenseNumber: "",
  licenseType: "",
  issuingAuthority: "",
  issuedAt: "",
  expiresAt: "",
  verifiedAt: "",
  documentReference: "",
  notes: "",
};

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"] as const;

const translations = {
  ar: {
    badge: "العمليات الطبية",
    title: "تراخيص الممارسين",
    subtitle: "إدارة تراخيص الممارسين والتحقق من صلاحيتها وتواريخ الإصدار والانتهاء ضمن السجل الطبي التشغيلي.",
    tabs: {
      directory: "ملفات الممارسين",
      assignments: "التخصصات والتعيينات",
      licenses: "التراخيص",
      schedules: "الجداول والتوفر",
    },
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    add: "إضافة ترخيص",
    addPractitioner: "إضافة ممارس",
    total: "إجمالي التراخيص",
    active: "التراخيص النشطة",
    expiring: "تنتهي قريبًا",
    expired: "منتهية الصلاحية",
    totalDescription: "جميع تراخيص الممارسين المسجلة",
    activeDescription: "تراخيص فعالة ومتحقق منها تشغيليًا",
    expiringDescription: "تنتهي خلال الستين يومًا القادمة",
    expiredDescription: "تراخيص منتهية أو محددة كمنتهية",
    registerTitle: "سجل تراخيص الممارسين",
    registerDescription: "قائمة موحدة للتراخيص مع الممارس والتخصص والجهة المصدرة وحالة الصلاحية.",
    searchPlaceholder: "ابحث برقم الترخيص أو الممارس أو الجهة أو النوع...",
    allPractitioners: "كل الممارسين",
    allStatuses: "كل الحالات",
    allExpiry: "كل الصلاحيات",
    expiringSoon: "تنتهي قريبًا",
    expiredOnly: "منتهية فقط",
    verifiedOnly: "تم التحقق",
    unverifiedOnly: "لم يتم التحقق",
    reset: "إعادة ضبط",
    license: "الترخيص",
    practitioner: "الممارس",
    type: "النوع",
    authority: "الجهة المصدرة",
    specialty: "التخصص",
    issued: "الإصدار",
    expires: "الانتهاء",
    verification: "التحقق",
    status: "الحالة",
    actions: "الإجراءات",
    none: "بدون",
    notVerified: "غير متحقق",
    noRecords: "لا توجد تراخيص ممارسين مسجلة حتى الآن.",
    noResults: "لا توجد تراخيص مطابقة للفلاتر الحالية.",
    noPractitioners: "لا توجد ملفات ممارسين لإضافة ترخيص.",
    noRecordsDescription: "أضف ممارسًا أولًا ثم أنشئ ترخيصه المهني من هذا السجل.",
    noResultsDescription: "عدّل البحث أو الفلاتر لإظهار السجلات المناسبة.",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل السجل مع نقص جزئي",
    partialDescription: "تعذر تحميل بعض تراخيص الممارسين، بينما بقيت السجلات المتاحة معروضة.",
    errorTitle: "تعذر تحميل تراخيص الممارسين",
    errorDescription: "تأكد من تسجيل الدخول وتشغيل الباكند ثم أعد المحاولة.",
    createTitle: "إضافة ترخيص ممارس",
    createDescription: "أدخل بيانات الترخيص الفعلية واربطه بالممارس والتخصص المناسب.",
    editTitle: "تعديل ترخيص الممارس",
    editDescription: "حدّث بيانات الترخيص وتواريخ الصلاحية ومرجع المستند.",
    choosePractitioner: "اختر الممارس",
    chooseSpecialty: "اختر التخصص",
    licenseNumber: "رقم الترخيص",
    licenseType: "نوع الترخيص",
    issuingAuthority: "الجهة المصدرة",
    issuedAt: "تاريخ الإصدار",
    expiresAt: "تاريخ الانتهاء",
    verifiedAt: "تاريخ التحقق",
    documentReference: "مرجع المستند",
    notes: "ملاحظات",
    cancel: "إلغاء",
    save: "حفظ التعديلات",
    create: "إضافة الترخيص",
    saving: "جارٍ الحفظ...",
    edit: "تعديل الترخيص",
    verify: "التحقق من الترخيص",
    activate: "تفعيل",
    pending: "إعادته للمراجعة",
    suspend: "تعليق",
    expire: "تحديده منتهيًا",
    revoke: "إلغاء الترخيص",
    confirm: "تأكيد",
    confirmTitle: "تحديث حالة الترخيص",
    confirmDescription: "سيتم تحديث حالة الترخيص في السجل الطبي الفعلي.",
    created: "تمت إضافة الترخيص بنجاح.",
    updated: "تم تحديث الترخيص بنجاح.",
    statusUpdated: "تم تحديث حالة الترخيص.",
    exported: "تم تجهيز ملف Excel.",
    printed: "تم تجهيز تقرير التراخيص للطباعة.",
    printFailed: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    required: "أكمل الحقول المطلوبة.",
    pendingStatus: "قيد المراجعة",
    activeStatus: "نشط",
    suspendedStatus: "معلق",
    expiredStatus: "منتهي",
    revokedStatus: "ملغى",
    allScope: "جميع الممارسين",
  },
  en: {
    badge: "Medical operations",
    title: "Practitioner licenses",
    subtitle: "Manage practitioner licenses, verification, issue dates, and expiry within the operational medical register.",
    tabs: {
      directory: "Practitioner files",
      assignments: "Specialties & assignments",
      licenses: "Licenses",
      schedules: "Schedules & availability",
    },
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    add: "Add license",
    addPractitioner: "Add practitioner",
    total: "Total licenses",
    active: "Active licenses",
    expiring: "Expiring soon",
    expired: "Expired licenses",
    totalDescription: "All registered practitioner licenses",
    activeDescription: "Operationally active licenses",
    expiringDescription: "Expiring within the next sixty days",
    expiredDescription: "Expired or marked as expired",
    registerTitle: "Practitioner license register",
    registerDescription: "Unified license register with practitioner, specialty, issuer, and validity status.",
    searchPlaceholder: "Search license number, practitioner, issuer, or type...",
    allPractitioners: "All practitioners",
    allStatuses: "All statuses",
    allExpiry: "All validity",
    expiringSoon: "Expiring soon",
    expiredOnly: "Expired only",
    verifiedOnly: "Verified",
    unverifiedOnly: "Unverified",
    reset: "Reset",
    license: "License",
    practitioner: "Practitioner",
    type: "Type",
    authority: "Issuing authority",
    specialty: "Specialty",
    issued: "Issued",
    expires: "Expires",
    verification: "Verification",
    status: "Status",
    actions: "Actions",
    none: "None",
    notVerified: "Not verified",
    noRecords: "No practitioner licenses have been registered yet.",
    noResults: "No licenses match the current filters.",
    noPractitioners: "No practitioner files are available for licensing.",
    noRecordsDescription: "Create a practitioner first, then add their professional license here.",
    noResultsDescription: "Adjust the search or filters to display matching records.",
    retry: "Retry",
    partialTitle: "The register loaded with partial data",
    partialDescription: "Some practitioner licenses could not be loaded; available records remain visible.",
    errorTitle: "Unable to load practitioner licenses",
    errorDescription: "Confirm your session and backend service, then try again.",
    createTitle: "Add practitioner license",
    createDescription: "Enter the real license data and link it to the correct practitioner and specialty.",
    editTitle: "Edit practitioner license",
    editDescription: "Update license details, validity dates, and document reference.",
    choosePractitioner: "Choose practitioner",
    chooseSpecialty: "Choose specialty",
    licenseNumber: "License number",
    licenseType: "License type",
    issuingAuthority: "Issuing authority",
    issuedAt: "Issue date",
    expiresAt: "Expiry date",
    verifiedAt: "Verification date",
    documentReference: "Document reference",
    notes: "Notes",
    cancel: "Cancel",
    save: "Save changes",
    create: "Add license",
    saving: "Saving...",
    edit: "Edit license",
    verify: "Verify license",
    activate: "Activate",
    pending: "Return to review",
    suspend: "Suspend",
    expire: "Mark expired",
    revoke: "Revoke license",
    confirm: "Confirm",
    confirmTitle: "Update license status",
    confirmDescription: "The license status will be updated in the live medical register.",
    created: "License created successfully.",
    updated: "License updated successfully.",
    statusUpdated: "License status updated.",
    exported: "Excel file prepared.",
    printed: "License report prepared for printing.",
    printFailed: "The print window could not be opened. Allow pop-ups and try again.",
    required: "Complete the required fields.",
    pendingStatus: "Pending",
    activeStatus: "Active",
    suspendedStatus: "Suspended",
    expiredStatus: "Expired",
    revokedStatus: "Revoked",
    allScope: "All practitioners",
  },
} as const;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(text(value).toLowerCase());
}

function firstArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  for (const key of ["items", "results", "licenses", "data", "rows"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalizeName(value: unknown, locale: Locale): string {
  const record = asRecord(value);
  return locale === "ar"
    ? text(record.name_ar || record.full_name_ar || record.name || record.full_name || record.name_en)
    : text(record.name_en || record.full_name_en || record.name || record.full_name || record.name_ar);
}

function normalizePractitioner(value: unknown): Practitioner {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk),
    number: text(record.practitioner_number || record.number || record.code),
    nameAr: text(record.full_name_ar || record.name_ar || record.full_name || record.name),
    nameEn: text(record.full_name_en || record.name_en || record.full_name || record.name),
    status: text(record.status || "ACTIVE").toUpperCase(),
  };
}

function normalizeSpecialty(value: unknown): Specialty {
  const record = asRecord(value);
  return {
    id: text(record.id || record.pk),
    code: text(record.code),
    nameAr: text(record.name_ar || record.name || record.name_en),
    nameEn: text(record.name_en || record.name || record.name_ar),
  };
}

function normalizeLicense(value: unknown, practitioner: Practitioner): LicenseRecord {
  const record = asRecord(value);
  const specialty = asRecord(record.specialty);
  const days = record.days_until_expiry;
  return {
    id: text(record.id || record.pk),
    practitionerId: practitioner.id,
    practitionerNameAr: practitioner.nameAr,
    practitionerNameEn: practitioner.nameEn,
    practitionerNumber: practitioner.number,
    specialtyId: text(specialty.id || record.specialty_id),
    specialtyNameAr: text(specialty.name_ar || specialty.name || specialty.name_en),
    specialtyNameEn: text(specialty.name_en || specialty.name || specialty.name_ar),
    licenseNumber: text(record.license_number),
    licenseType: text(record.license_type),
    issuingAuthority: text(record.issuing_authority || record.issuer),
    status: text(record.status || "PENDING").toUpperCase(),
    statusDisplay: text(record.status_display),
    issuedAt: text(record.issued_at),
    expiresAt: text(record.expires_at),
    verifiedAt: text(record.verified_at),
    documentReference: text(record.document_reference),
    notes: text(record.notes),
    isExpired: boolValue(record.is_expired),
    daysUntilExpiry: days === null || days === undefined || days === "" ? null : numberValue(days),
  };
}

function practitionerName(item: Practitioner | LicenseRecord, locale: Locale): string {
  if ("practitionerNameAr" in item) {
    return locale === "ar"
      ? item.practitionerNameAr || item.practitionerNameEn || item.practitionerNumber
      : item.practitionerNameEn || item.practitionerNameAr || item.practitionerNumber;
  }
  return locale === "ar" ? item.nameAr || item.nameEn || item.number : item.nameEn || item.nameAr || item.number;
}

function specialtyName(item: LicenseRecord, locale: Locale): string {
  return locale === "ar"
    ? item.specialtyNameAr || item.specialtyNameEn || "—"
    : item.specialtyNameEn || item.specialtyNameAr || "—";
}

function formatDate(value: string): string {
  return value ? value.slice(0, 10) : "—";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getApiBaseUrl() {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return envBase.endsWith("/api")
    ? envBase.slice(0, -4)
    : envBase;
}
function makeApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(makeApiUrl(path), {
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(init?.headers || {}),
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
    throw new Error(text(record.message || record.detail || record.error) || `HTTP ${response.status}`);
  }
  return payload;
}

function statusLabel(status: string, locale: Locale): string {
  const t = translations[locale];
  const map: Record<string, string> = {
    PENDING: t.pendingStatus,
    ACTIVE: t.activeStatus,
    SUSPENDED: t.suspendedStatus,
    EXPIRED: t.expiredStatus,
    REVOKED: t.revokedStatus,
  };
  return map[status] || status;
}

function statusClass(status: string): string {
  if (status === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (["SUSPENDED", "EXPIRED", "REVOKED"].includes(status)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-lg shadow-none">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-11 w-11 rounded-full" />
            </CardHeader>
            <CardContent><Skeleton className="h-3 w-44" /></CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-lg shadow-none">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PractitionerLicensesClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [practitioners, setPractitioners] = React.useState<Practitioner[]>([]);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [licenses, setLicenses] = React.useState<LicenseRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [partialWarning, setPartialWarning] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [practitionerFilter, setPractitionerFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [expiryFilter, setExpiryFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<LicenseForm>(EMPTY_FORM);
  const [pendingStatus, setPendingStatus] = React.useState<PendingStatus>(null);

  React.useEffect(() => {
    const html = document.documentElement;
    setLocale(html.lang.toLowerCase().startsWith("en") || html.dir === "ltr" ? "en" : "ar");
    const requested = new URLSearchParams(window.location.search).get("practitioner");
    if (requested) setPractitionerFilter(requested);
  }, []);

  const t = translations[locale];
  const rtl = locale === "ar";

  const load = React.useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    setPartialWarning(false);
    try {
      const [practitionerPayload, specialtyPayload] = await Promise.all([
        fetchJson(`${API.practitioners}?page_size=500`),
        fetchJson(API.specialties),
      ]);
      const practitionerRows = firstArray(practitionerPayload)
        .map(normalizePractitioner)
        .filter((item) => item.id);
      const specialtyRows = firstArray(specialtyPayload)
        .map(normalizeSpecialty)
        .filter((item) => item.id);
      const results = await Promise.allSettled(
        practitionerRows.map(async (practitioner) => {
          const payload = await fetchJson(
            `${API.practitioners}${practitioner.id}/licenses/`,
          );
          return firstArray(payload).map((item) => normalizeLicense(item, practitioner));
        }),
      );
      const licenseRows: LicenseRecord[] = [];
      let failed = 0;
      for (const result of results) {
        if (result.status === "fulfilled") licenseRows.push(...result.value);
        else failed += 1;
      }
      setPractitioners(practitionerRows);
      setSpecialties(specialtyRows);
      setLicenses(licenseRows);
      setPartialWarning(failed > 0);
      if (silent) toast.success(t.refresh);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.errorDescription;
      setError(message);
      if (silent) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t.errorDescription, t.refresh]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return licenses.filter((item) => {
      if (practitionerFilter !== "all" && item.practitionerId !== practitionerFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (expiryFilter === "soon" && !(item.daysUntilExpiry !== null && item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 60)) return false;
      if (expiryFilter === "expired" && !(item.isExpired || item.status === "EXPIRED")) return false;
      if (expiryFilter === "verified" && !item.verifiedAt) return false;
      if (expiryFilter === "unverified" && item.verifiedAt) return false;
      if (!needle) return true;
      return [
        item.licenseNumber,
        item.licenseType,
        item.issuingAuthority,
        item.practitionerNameAr,
        item.practitionerNameEn,
        item.practitionerNumber,
        item.specialtyNameAr,
        item.specialtyNameEn,
        item.documentReference,
      ].join(" ").toLowerCase().includes(needle);
    });
  }, [expiryFilter, licenses, practitionerFilter, search, statusFilter]);

  const stats = React.useMemo(() => ({
    total: licenses.length,
    active: licenses.filter((item) => item.status === "ACTIVE" && !item.isExpired).length,
    expiring: licenses.filter((item) => item.daysUntilExpiry !== null && item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 60).length,
    expired: licenses.filter((item) => item.isExpired || item.status === "EXPIRED").length,
  }), [licenses]);

  const hasFilters = Boolean(search) || practitionerFilter !== "all" || statusFilter !== "all" || expiryFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setPractitionerFilter("all");
    setStatusFilter("all");
    setExpiryFilter("all");
  };

  const openCreate = () => {
    if (!practitioners.length) return;
    setForm({
      ...EMPTY_FORM,
      practitionerId: practitionerFilter !== "all" ? practitionerFilter : practitioners[0]?.id || "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: LicenseRecord) => {
    setForm({
      id: item.id,
      practitionerId: item.practitionerId,
      specialtyId: item.specialtyId || "none",
      licenseNumber: item.licenseNumber,
      licenseType: item.licenseType,
      issuingAuthority: item.issuingAuthority,
      issuedAt: formatDate(item.issuedAt) === "—" ? "" : formatDate(item.issuedAt),
      expiresAt: formatDate(item.expiresAt) === "—" ? "" : formatDate(item.expiresAt),
      verifiedAt: formatDate(item.verifiedAt) === "—" ? "" : formatDate(item.verifiedAt),
      documentReference: item.documentReference,
      notes: item.notes,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.practitionerId || !form.licenseNumber.trim() || !form.issuingAuthority.trim()) {
      toast.warning(t.required);
      return;
    }
    setSaving(true);
    try {
      const collection = `${API.practitioners}${form.practitionerId}/licenses/`;
      const path = form.id ? `${collection}${form.id}/` : collection;
      await fetchJson(path, {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify({
          specialty_id: form.specialtyId === "none" ? null : form.specialtyId,
          license_number: form.licenseNumber.trim(),
          license_type: form.licenseType.trim(),
          issuing_authority: form.issuingAuthority.trim(),
          issued_at: form.issuedAt || null,
          expires_at: form.expiresAt || null,
          verified_at: form.verifiedAt || null,
          document_reference: form.documentReference.trim(),
          notes: form.notes.trim(),
        }),
      });
      toast.success(form.id ? t.updated : t.created);
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await load({ silent: false });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.errorDescription);
    } finally {
      setSaving(false);
    }
  };

  const applyStatus = async () => {
    if (!pendingStatus) return;
    setSaving(true);
    try {
      const { item, action } = pendingStatus;
      const body: Record<string, string> = { action };
      if (action === "verify") body.verified_at = new Date().toISOString().slice(0, 10);
      await fetchJson(
        `${API.practitioners}${item.practitionerId}/licenses/${item.id}/status/`,
        { method: "POST", body: JSON.stringify(body) },
      );
      toast.success(t.statusUpdated);
      setPendingStatus(null);
      await load({ silent: false });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t.errorDescription);
    } finally {
      setSaving(false);
    }
  };

  const reportRows = React.useMemo(() => filtered.map((item) => [
    item.licenseNumber,
    practitionerName(item, locale),
    item.licenseType || "—",
    item.issuingAuthority || "—",
    specialtyName(item, locale),
    formatDate(item.issuedAt),
    formatDate(item.expiresAt),
    formatDate(item.verifiedAt),
    statusLabel(item.status, locale),
  ]), [filtered, locale]);

  const exportExcel = () => {
    if (!reportRows.length) return;
    const headers = [t.license, t.practitioner, t.type, t.authority, t.specialty, t.issued, t.expires, t.verification, t.status];
    const csv = [headers, ...reportRows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marilyn-practitioner-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.exported);
  };

  const print = async () => {
    if (!reportRows.length) return;
    const headers = [t.license, t.practitioner, t.type, t.authority, t.specialty, t.issued, t.expires, t.verification, t.status];
    const tableHtml = `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${reportRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const selected = practitioners.find((item) => item.id === practitionerFilter);
    const opened = await openPrintReport({
      locale,
      title: rtl ? "تقرير تراخيص الممارسين — Marilyn Clinics" : "Marilyn Clinics Practitioner Licenses Report",
      subtitle: t.registerDescription,
      branchName: selected ? practitionerName(selected, locale) : t.allScope,
      tableHtml,
      recordsCount: reportRows.length,
    });
    if (!opened) {
      toast.error(t.printFailed);
      return;
    }
    toast.success(t.printed);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8" dir={rtl ? "rtl" : "ltr"}>
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <FileCheck2 className="h-3.5 w-3.5 text-[#a57b3d]" />
                            {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              {locale === "ar"
                ? "متصل بواجهات الممارسين والتراخيص المهنية الحقيقية"
                : "Connected to live practitioner and professional license APIs"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={() => void load({ silent: true })} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {t.refresh}
            </Button>
            <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={exportExcel} disabled={!filtered.length}>
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={() => void print()} disabled={!filtered.length}>
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            {practitioners.length ? (
              <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={openCreate}>
                <FileCheck2 className="h-4 w-4" />
                {t.add}
              </Button>
            ) : (
              <Button asChild type="button" variant="brand" className={registerBrandButtonClass}>
                <Link href="/system/practitioners"><UserRoundPlus className="h-4 w-4" />{t.addPractitioner}</Link>
              </Button>
            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard title={t.total} value={stats.total} description={t.totalDescription} icon={FileCheck2} />
          <SystemKpiCard title={t.active} value={stats.active} description={t.activeDescription} icon={ShieldCheck} />
          <SystemKpiCard title={t.expiring} value={stats.expiring} description={t.expiringDescription} icon={Clock3} />
          <SystemKpiCard title={t.expired} value={stats.expired} description={t.expiredDescription} icon={ShieldOff} />
        </section>

        <PractitionerManagementTabs
          active="licenses"
          locale={locale}
          counts={{
            licenses:
              stats.total,
          }}
        />

        {partialWarning ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div><p className="font-medium">{t.partialTitle}</p><p className="mt-1 text-sm">{t.partialDescription}</p></div>
          </div>
        ) : null}

        {error ? (
          <Card className="rounded-lg border-rose-200 shadow-none">
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
              <ShieldAlert className="h-8 w-8 text-rose-600" />
              <div><h2 className="font-semibold">{t.errorTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{error || t.errorDescription}</p></div>
              <Button type="button" variant="outline" onClick={() => void load()}>{t.retry}</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
            <CardHeader className="px-5 pt-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                    <FileCheck2 className="h-4 w-4 text-[#a57b3d]" />{t.registerTitle}</CardTitle>
                  <CardDescription className="mt-1">{t.registerDescription}</CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={registerOutlineButtonClass}
                    onClick={exportExcel}
                    disabled={!filtered.length}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t.excel}
                  </Button>
                  <Button
                    type="button"
                    variant="brand"
                    className={registerBrandButtonClass}
                    onClick={() => void print()}
                    disabled={!filtered.length}
                  >
                    <Printer className="h-4 w-4" />
                    {t.print}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
              <DataRegisterToolbar className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_200px_180px_180px_auto]">
                <DataRegisterSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t.searchPlaceholder}
                />
                <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
                  <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue placeholder={t.allPractitioners} /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{t.allPractitioners}</SelectItem>{practitioners.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item, locale)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{t.allStatuses}</SelectItem>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{statusLabel(status, locale)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                  <SelectTrigger className="h-9 bg-background shadow-none"><SelectValue placeholder={t.allExpiry} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allExpiry}</SelectItem>
                    <SelectItem value="soon">{t.expiringSoon}</SelectItem>
                    <SelectItem value="expired">{t.expiredOnly}</SelectItem>
                    <SelectItem value="verified">{t.verifiedOnly}</SelectItem>
                    <SelectItem value="unverified">{t.unverifiedOnly}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={resetFilters} disabled={!hasFilters}>
                  <RotateCcw className="h-4 w-4" />{t.reset}
                </Button>
              </DataRegisterToolbar>

              <div className="overflow-hidden rounded-lg border bg-background"><div className="overflow-x-auto">
                <Table variant="register" layout="fixed" minWidth="1450px">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`sticky z-20 w-[170px] bg-muted/40 ${rtl ? "right-0" : "left-0"}`}>{t.license}</TableHead>
                      <TableHead className="w-[220px]">{t.practitioner}</TableHead>
                      <TableHead className="w-[180px]">{t.type}</TableHead>
                      <TableHead className="w-[180px]">{t.authority}</TableHead>
                      <TableHead className="w-[180px]">{t.specialty}</TableHead>
                      <TableHead className="w-[120px]">{t.issued}</TableHead>
                      <TableHead className="w-[120px]">{t.expires}</TableHead>
                      <TableHead className="w-[130px]">{t.verification}</TableHead>
                      <TableHead className="w-[120px]">{t.status}</TableHead>
                      <TableHead className={`sticky z-20 w-[90px] bg-muted/40 text-center ${rtl ? "left-0" : "right-0"}`}>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={`${item.practitionerId}-${item.id}`} className="group h-[62px] hover:bg-muted/35">
                        <TableCell className={`sticky z-10 h-[62px] bg-background px-4 font-medium group-hover:bg-muted/35 ${rtl ? "right-0" : "left-0"}`}>
                          <div>{item.licenseNumber}</div>
                          {item.documentReference ? <div className="mt-1 text-xs text-muted-foreground">{item.documentReference}</div> : null}
                        </TableCell>
                        <TableCell><div className="font-medium">{practitionerName(item, locale)}</div><div className="mt-1 text-xs text-muted-foreground">{item.practitionerNumber || "—"}</div></TableCell>
                        <TableCell>{item.licenseType || "—"}</TableCell>
                        <TableCell>{item.issuingAuthority || "—"}</TableCell>
                        <TableCell>{specialtyName(item, locale)}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(item.issuedAt)}</TableCell>
                        <TableCell className="tabular-nums"><div>{formatDate(item.expiresAt)}</div>{item.daysUntilExpiry !== null ? <div className="mt-1 text-xs text-muted-foreground">{new Intl.NumberFormat("en-US").format(item.daysUntilExpiry)}</div> : null}</TableCell>
                        <TableCell className="tabular-nums">{item.verifiedAt ? formatDate(item.verifiedAt) : t.notVerified}</TableCell>
                        <TableCell><Badge variant="outline" className={statusClass(item.status)}>{statusLabel(item.status, locale)}</Badge></TableCell>
                        <TableCell className={`sticky z-10 h-[62px] bg-background px-4 text-center group-hover:bg-muted/35 ${rtl ? "left-0" : "right-0"}`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align={rtl ? "start" : "end"}>
                              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="h-4 w-4" />{t.edit}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setPendingStatus({ item, action: "verify" })}><BadgeCheck className="h-4 w-4" />{t.verify}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPendingStatus({ item, action: "activate" })}><CheckCircle2 className="h-4 w-4" />{t.activate}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPendingStatus({ item, action: "pending" })}><CalendarClock className="h-4 w-4" />{t.pending}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPendingStatus({ item, action: "suspend" })}><ShieldAlert className="h-4 w-4" />{t.suspend}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPendingStatus({ item, action: "expire" })}><Clock3 className="h-4 w-4" />{t.expire}</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingStatus({ item, action: "revoke" })}><ShieldOff className="h-4 w-4" />{t.revoke}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filtered.length ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-72">
                          <DataRegisterEmptyState
                            title={!practitioners.length ? t.noPractitioners : licenses.length ? t.noResults : t.noRecords}
                            description={!practitioners.length || !licenses.length ? t.noRecordsDescription : t.noResultsDescription}
                            showReset={Boolean(practitioners.length && licenses.length && hasFilters)}
                            onReset={resetFilters}
                            resetLabel={t.reset}
                            action={!practitioners.length ? (
                              <Button asChild type="button" variant="brand" className={registerBrandButtonClass}>
                                <Link href="/system/practitioners"><UserRoundPlus className="h-4 w-4" />{t.addPractitioner}</Link>
                              </Button>
                            ) : !licenses.length ? (
                              <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={openCreate}>
                                <FileCheck2 className="h-4 w-4" />{t.add}
                              </Button>
                            ) : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? t.editTitle : t.createTitle}</DialogTitle><DialogDescription>{form.id ? t.editDescription : t.createDescription}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2"><Label>{t.practitioner} *</Label><Select value={form.practitionerId} onValueChange={(value) => setForm((current) => ({ ...current, practitionerId: value }))} disabled={Boolean(form.id)}><SelectTrigger><SelectValue placeholder={t.choosePractitioner} /></SelectTrigger><SelectContent>{practitioners.map((item) => <SelectItem key={item.id} value={item.id}>{practitionerName(item, locale)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.specialty}</Label><Select value={form.specialtyId} onValueChange={(value) => setForm((current) => ({ ...current, specialtyId: value }))}><SelectTrigger><SelectValue placeholder={t.chooseSpecialty} /></SelectTrigger><SelectContent><SelectItem value="none">{t.none}</SelectItem>{specialties.map((item) => <SelectItem key={item.id} value={item.id}>{locale === "ar" ? item.nameAr || item.nameEn : item.nameEn || item.nameAr}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.licenseNumber} *</Label><Input value={form.licenseNumber} onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.licenseType}</Label><Input value={form.licenseType} onChange={(event) => setForm((current) => ({ ...current, licenseType: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>{t.issuingAuthority} *</Label><Input value={form.issuingAuthority} onChange={(event) => setForm((current) => ({ ...current, issuingAuthority: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.issuedAt}</Label><Input type="date" value={form.issuedAt} onChange={(event) => setForm((current) => ({ ...current, issuedAt: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.expiresAt}</Label><Input type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.verifiedAt}</Label><Input type="date" value={form.verifiedAt} onChange={(event) => setForm((current) => ({ ...current, verifiedAt: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.documentReference}</Label><Input value={form.documentReference} onChange={(event) => setForm((current) => ({ ...current, documentReference: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>{t.notes}</Label><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button><Button type="button" variant="brand" onClick={() => void save()} disabled={saving}>{saving ? t.saving : form.id ? t.save : t.create}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle><AlertDialogDescription>{t.confirmDescription}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => void applyStatus()} disabled={saving}>{t.confirm}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
