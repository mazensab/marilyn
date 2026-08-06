"use client";
/*
 * MARILYN MEDICAL SERVICES CENTER
 * Central medical service offerings management using live company APIs.
 */
// medical_services_practitioner_tabs_pattern=true
// medical_services_shared_navigation=true
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,  FileSpreadsheet,
  Globe2,
  Layers3,
  Loader2,
  MoreVertical,
  Plus,
  Power,
  Printer,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  TriangleAlert,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { MedicalOperationsTabs } from "@/components/system/medical-operations-tabs";
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
type OfferingStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type StatusFilter = "all" | OfferingStatus;
type BookingFilter = "all" | "enabled" | "disabled";
type SortKey = "name" | "duration" | "price";
type StatusAction = "activate" | "deactivate" | "archive";
type RelatedOption = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  branchId: string;
  departmentId: string;
  branchIds: string[];
};
type CatalogServiceOption = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  salePrice: number;
  status: string;
  itemType: string;
};
type MedicalServiceOffering = {
  id: string;
  catalogItemId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  branchId: string;
  branchNameAr: string;
  branchNameEn: string;
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  specialtyId: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
  clinicId: string;
  clinicNameAr: string;
  clinicNameEn: string;
  status: OfferingStatus;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  totalSlotMinutes: number;
  baseSalePrice: number;
  effectiveSalePrice: number;
  salePriceOverride: string;
  defaultSessionCount: number;
  onlineBookingEnabled: boolean;
  requiresApproval: boolean;
  requiresPreparation: boolean;
  preparationInstructions: string;
  notes: string;
  updatedAt: string;
};
type FormState = {
  catalogItemId: string;
  branchId: string;
  departmentId: string;
  specialtyId: string;
  clinicId: string;
  durationMinutes: string;
  bufferBeforeMinutes: string;
  bufferAfterMinutes: string;
  salePriceOverride: string;
  defaultSessionCount: string;
  onlineBookingEnabled: boolean;
  requiresApproval: boolean;
  requiresPreparation: boolean;
  preparationInstructions: string;
  notes: string;
};
type PendingStatus = {
  item: MedicalServiceOffering;
  action: StatusAction;
} | null;
const ENDPOINTS = {
  offerings: "/api/company/medical/service-offerings/?page_size=500",
  offeringBase: "/api/company/medical/service-offerings/",
  catalogServices:
    "/api/company/products/?page_size=500&item_type=SERVICE&status=ACTIVE",
  branches: "/api/company/branches/?page_size=500",
  departments: "/api/company/medical/departments/?page_size=500",
  specialties: "/api/company/medical/specialties/?page_size=500",
  clinics: "/api/company/medical/clinics/?page_size=500",
} as const;
const EMPTY_FORM: FormState = {
  catalogItemId: "",
  branchId: "",
  departmentId: "",
  specialtyId: "",
  clinicId: "",
  durationMinutes: "30",
  bufferBeforeMinutes: "0",
  bufferAfterMinutes: "0",
  salePriceOverride: "",
  defaultSessionCount: "1",
  onlineBookingEnabled: true,
  requiresApproval: false,
  requiresPreparation: false,
  preparationInstructions: "",
  notes: "",
};
const copy = {
  ar: {
    badge: "الإدارة المركزية",
    title: "الخدمات الطبية",
    description:
      "إدارة الخدمات المقدمة داخل الفروع والعيادات، ومدد الحجز والأسعار والتخصصات وإتاحة الحجز الإلكتروني.",
    servicesTab: "الخدمات الطبية",
    operationsTab: "التشغيل الطبي",
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    add: "إضافة خدمة طبية",
    total: "إجمالي الخدمات",
    active: "الخدمات النشطة",
    online: "الحجز الإلكتروني",
    averageDuration: "متوسط مدة الخدمة",
    totalDesc: "جميع عروض الخدمات الطبية المسجلة",
    activeDesc: "الخدمات المتاحة للتشغيل والحجز",
    onlineDesc: "الخدمات المتاحة للحجز الإلكتروني",
    averageDurationDesc: "متوسط مدة الخدمة دون فترات التجهيز",
    minute: "دقيقة",
    registerTitle: "سجل الخدمات الطبية",
    registerDescription:
      "سجل موحد للخدمات ومواقع تقديمها وأسعارها ومددها وحالتها التشغيلية.",
    search:
      "ابحث باسم الخدمة أو الكود أو الفرع أو العيادة أو التخصص...",
    allStatuses: "كل الحالات",
    allBranches: "كل الفروع",
    allBooking: "كل خيارات الحجز",
    bookingEnabled: "الحجز متاح",
    bookingDisabled: "الحجز غير متاح",
    sortName: "الاسم",
    sortDuration: "المدة",
    sortPrice: "السعر",
    reset: "إعادة ضبط",
    service: "الخدمة",
    location: "موقع التقديم",
    specialty: "التخصص",
    duration: "المدة",
    slotDuration: "مدة الحجز",
    price: "السعر",
    booking: "الحجز",
    status: "الحالة",
    actions: "الإجراءات",
    branch: "الفرع",
    department: "القسم",
    clinic: "العيادة",
    activeStatus: "نشط",
    inactiveStatus: "غير نشط",
    archivedStatus: "مؤرشف",
    enabled: "متاح",
    disabled: "غير متاح",
    details: "عرض التفاصيل",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    archive: "أرشفة",
    addTitle: "إضافة عرض خدمة طبية",
    editTitle: "تعديل عرض الخدمة الطبية",
    formDescription:
      "اربط خدمة الكتالوج بموقع تقديم طبي وحدد المدة والسعر وسياسات الحجز.",
    catalogService: "خدمة الكتالوج",
    chooseService: "اختر خدمة",
    chooseBranch: "اختر الفرع",
    chooseDepartment: "اختر القسم",
    chooseSpecialty: "اختر التخصص",
    chooseClinic: "اختر العيادة",
    basePrice: "السعر الأساسي",
    priceOverride: "السعر الطبي المخصص",
    durationMinutes: "مدة الخدمة بالدقائق",
    bufferBefore: "تجهيز قبل الخدمة",
    bufferAfter: "وقت بعد الخدمة",
    sessions: "عدد الجلسات الافتراضي",
    onlineBooking: "السماح بالحجز الإلكتروني",
    approval: "يتطلب موافقة",
    preparation: "يتطلب تجهيزات",
    preparationInstructions: "تعليمات التجهيز",
    notes: "ملاحظات",
    save: "حفظ",
    cancel: "إلغاء",
    requiredRelations:
      "يجب تحديد الخدمة والفرع والقسم والتخصص والعيادة.",
    invalidNumbers:
      "تحقق من مدة الخدمة وفترات التجهيز وعدد الجلسات والسعر.",
    saved: "تم حفظ الخدمة الطبية بنجاح.",
    statusSaved: "تم تحديث حالة الخدمة بنجاح.",
    refreshed: "تم تحديث الخدمات الطبية.",
    statusTitle: "تأكيد تغيير حالة الخدمة",
    statusDescription:
      "سيتم تحديث الحالة التشغيلية للخدمة عبر واجهة الخدمات الطبية.",
    noData: "لا توجد خدمات طبية مسجلة حاليًا.",
    noResults: "لا توجد خدمات مطابقة للبحث أو الفلاتر.",
    loadingError: "تعذر تحميل الخدمات الطبية",
    retry: "إعادة المحاولة",
    partialTitle: "تم تحميل الصفحة جزئيًا",
    partialDescription:
      "تعذر تحميل بعض مصادر الخيارات، وتظهر البيانات التشغيلية المتاحة فقط.",
    excelEmpty: "لا توجد خدمات للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد خدمات للطباعة.",
    printReady: "تم تجهيز تقرير الخدمات الطبية.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    resultCount: "عدد النتائج",
    totalCount: "الإجمالي",
    unknown: "غير محدد",
    noCatalogServices:
      "لا توجد خدمات كتالوج نشطة متاحة للربط.",
    serviceLocked:
      "هوية خدمة الكتالوج ثابتة عند التعديل.",
    reportTitle: "تقرير الخدمات الطبية — Marilyn Clinics",
  },
  en: {
    badge: "Central administration",
    title: "Medical Services",
    description:
      "Manage services offered across branches and clinics, including booking duration, pricing, specialties, and online availability.",
    servicesTab: "Medical services",
    operationsTab: "Clinical operations",
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    add: "Add medical service",
    total: "Total services",
    active: "Active services",
    online: "Online booking",
    averageDuration: "Average duration",
    totalDesc: "All registered medical service offerings",
    activeDesc: "Services available for operation and booking",
    onlineDesc: "Services available for online booking",
    averageDurationDesc: "Average service duration excluding buffers",
    minute: "minutes",
    registerTitle: "Medical services register",
    registerDescription:
      "A unified register of services, locations, prices, durations, and operational statuses.",
    search:
      "Search by service, code, branch, clinic, or specialty...",
    allStatuses: "All statuses",
    allBranches: "All branches",
    allBooking: "All booking options",
    bookingEnabled: "Booking enabled",
    bookingDisabled: "Booking disabled",
    sortName: "Name",
    sortDuration: "Duration",
    sortPrice: "Price",
    reset: "Reset",
    service: "Service",
    location: "Service location",
    specialty: "Specialty",
    duration: "Duration",
    slotDuration: "Slot duration",
    price: "Price",
    booking: "Booking",
    status: "Status",
    actions: "Actions",
    branch: "Branch",
    department: "Department",
    clinic: "Clinic",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    archivedStatus: "Archived",
    enabled: "Enabled",
    disabled: "Disabled",
    details: "View details",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    archive: "Archive",
    addTitle: "Add medical service offering",
    editTitle: "Edit medical service offering",
    formDescription:
      "Link a catalog service to a medical location and define duration, pricing, and booking policies.",
    catalogService: "Catalog service",
    chooseService: "Choose service",
    chooseBranch: "Choose branch",
    chooseDepartment: "Choose department",
    chooseSpecialty: "Choose specialty",
    chooseClinic: "Choose clinic",
    basePrice: "Base price",
    priceOverride: "Medical price override",
    durationMinutes: "Service duration in minutes",
    bufferBefore: "Preparation before service",
    bufferAfter: "Time after service",
    sessions: "Default session count",
    onlineBooking: "Allow online booking",
    approval: "Requires approval",
    preparation: "Requires preparation",
    preparationInstructions: "Preparation instructions",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    requiredRelations:
      "Service, branch, department, specialty, and clinic are required.",
    invalidNumbers:
      "Check service duration, buffers, session count, and price.",
    saved: "Medical service saved successfully.",
    statusSaved: "Service status updated successfully.",
    refreshed: "Medical services refreshed.",
    statusTitle: "Confirm service status change",
    statusDescription:
      "The operational service status will be updated through the medical services API.",
    noData: "No medical services are currently registered.",
    noResults: "No services match the current search or filters.",
    loadingError: "Could not load medical services",
    retry: "Try again",
    partialTitle: "Partially loaded",
    partialDescription:
      "Some option sources could not be loaded. Available operational data is shown.",
    excelEmpty: "There are no services to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There are no services to print.",
    printReady: "Medical services report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    resultCount: "Results",
    totalCount: "Total",
    unknown: "Unknown",
    noCatalogServices:
      "No active catalog services are available for linking.",
    serviceLocked:
      "The catalog service identity is fixed while editing.",
    reportTitle: "Medical Services Report — Marilyn Clinics",
  },
} as const;
function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim() || fallback;
  }
  return fallback;
}
function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = text(value).toLowerCase();
  if (
    ["true", "1", "yes", "active", "enabled"].includes(
      normalized,
    )
  ) {
    return true;
  }
  if (
    ["false", "0", "no", "inactive", "disabled"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return fallback;
}
function extractArray(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload) || depth > 3) return [];
  const candidates = [
    payload.items,
    payload.results,
    payload.records,
    payload.rows,
    payload.service_offerings,
    payload.services,
    payload.products,
    payload.branches,
    payload.departments,
    payload.specialties,
    payload.clinics,
    payload.data,
    payload.result,
    payload.payload,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  for (const candidate of candidates) {
    const nested = extractArray(candidate, depth + 1);
    if (nested.length) return nested;
  }
  return [];
}
function relatedNames(value: unknown) {
  const source = record(value);
  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(source.code),
    nameAr: text(
      source.name_ar ||
        source.full_name_ar ||
        source.branch_name_ar ||
        source.department_name_ar ||
        source.specialty_name_ar ||
        source.clinic_name_ar ||
        source.name ||
        source.title,
    ),
    nameEn: text(
      source.name_en ||
        source.full_name_en ||
        source.branch_name_en ||
        source.department_name_en ||
        source.specialty_name_en ||
        source.clinic_name_en ||
        source.name ||
        source.title,
    ),
  };
}
function normalizeRelatedOption(value: unknown): RelatedOption {
  const source = record(value);
  const branch = record(source.branch);
  const department = record(source.department);
  const branchLinks = Array.isArray(source.branches)
    ? source.branches
    : Array.isArray(source.branch_links)
      ? source.branch_links
      : [];
  return {
    ...relatedNames(source),
    isActive: boolValue(
      source.is_active ?? source.status,
      true,
    ),
    branchId: text(
      source.branch_id ||
        branch.id ||
        branch.pk,
    ),
    departmentId: text(
      source.department_id ||
        department.id ||
        department.pk,
    ),
    branchIds: branchLinks
      .map((item) => {
        const link = record(item);
        const linkedBranch = record(link.branch);
        return text(
          link.branch_id ||
            linkedBranch.id ||
            link.id,
        );
      })
      .filter(Boolean),
  };
}
function normalizeCatalogService(
  value: unknown,
): CatalogServiceOption {
  const source = record(value);
  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(source.code || source.sku),
    nameAr: text(
      source.name_ar ||
        source.name ||
        source.title,
    ),
    nameEn: text(
      source.name_en ||
        source.name ||
        source.title,
    ),
    salePrice: numberValue(
      source.sale_price ||
        source.price ||
        source.selling_price,
    ),
    status: text(
      source.status,
      boolValue(source.is_active, true)
        ? "ACTIVE"
        : "INACTIVE",
    ).toUpperCase(),
    itemType: text(
      source.item_type ||
        source.type ||
        source.product_type,
      "SERVICE",
    ).toUpperCase(),
  };
}
function normalizeOffering(
  value: unknown,
): MedicalServiceOffering {
  const source = record(value);
  const catalogItem = record(
    source.catalog_item ||
      source.service ||
      source.catalog_service,
  );
  const branch = record(source.branch);
  const department = record(source.department);
  const specialty = record(source.specialty);
  const clinic = record(source.clinic);
  const catalogNames = relatedNames(catalogItem);
  const branchNames = relatedNames(branch);
  const departmentNames = relatedNames(department);
  const specialtyNames = relatedNames(specialty);
  const clinicNames = relatedNames(clinic);
  const duration = numberValue(
    source.duration_minutes,
    0,
  );
  const bufferBefore = numberValue(
    source.buffer_before_minutes,
    0,
  );
  const bufferAfter = numberValue(
    source.buffer_after_minutes,
    0,
  );
  const rawStatus = text(
    source.status,
    "ACTIVE",
  ).toUpperCase();
  const status: OfferingStatus =
    rawStatus === "INACTIVE" ||
    rawStatus === "ARCHIVED"
      ? rawStatus
      : "ACTIVE";
  const baseSalePrice = numberValue(
    catalogItem.sale_price ||
      source.base_sale_price ||
      source.catalog_sale_price,
    0,
  );
  return {
    id: text(source.id || source.pk || source.uuid),
    catalogItemId: text(
      source.catalog_item_id ||
        catalogItem.id ||
        catalogItem.pk,
    ),
    code: text(
      catalogItem.code ||
        source.service_code ||
        source.code,
    ),
    nameAr: text(
      catalogItem.name_ar ||
        source.service_name_ar ||
        source.name_ar ||
        catalogNames.nameAr,
    ),
    nameEn: text(
      catalogItem.name_en ||
        source.service_name_en ||
        source.name_en ||
        catalogNames.nameEn,
    ),
    branchId: text(
      source.branch_id ||
        branch.id ||
        branch.pk,
    ),
    branchNameAr: text(
      source.branch_name_ar ||
        branch.name_ar ||
        branch.name ||
        branchNames.nameAr,
    ),
    branchNameEn: text(
      source.branch_name_en ||
        branch.name_en ||
        branch.name ||
        branchNames.nameEn,
    ),
    departmentId: text(
      source.department_id ||
        department.id ||
        department.pk,
    ),
    departmentNameAr: text(
      source.department_name_ar ||
        department.name_ar ||
        department.name ||
        departmentNames.nameAr,
    ),
    departmentNameEn: text(
      source.department_name_en ||
        department.name_en ||
        department.name ||
        departmentNames.nameEn,
    ),
    specialtyId: text(
      source.specialty_id ||
        specialty.id ||
        specialty.pk,
    ),
    specialtyNameAr: text(
      source.specialty_name_ar ||
        specialty.name_ar ||
        specialty.name ||
        specialtyNames.nameAr,
    ),
    specialtyNameEn: text(
      source.specialty_name_en ||
        specialty.name_en ||
        specialty.name ||
        specialtyNames.nameEn,
    ),
    clinicId: text(
      source.clinic_id ||
        clinic.id ||
        clinic.pk,
    ),
    clinicNameAr: text(
      source.clinic_name_ar ||
        clinic.name_ar ||
        clinic.name ||
        clinicNames.nameAr,
    ),
    clinicNameEn: text(
      source.clinic_name_en ||
        clinic.name_en ||
        clinic.name ||
        clinicNames.nameEn,
    ),
    status,
    durationMinutes: duration,
    bufferBeforeMinutes: bufferBefore,
    bufferAfterMinutes: bufferAfter,
    totalSlotMinutes: numberValue(
      source.total_slot_minutes,
      duration + bufferBefore + bufferAfter,
    ),
    baseSalePrice,
    effectiveSalePrice: numberValue(
      source.effective_sale_price,
      numberValue(
        source.sale_price_override,
        baseSalePrice,
      ),
    ),
    salePriceOverride:
      source.sale_price_override === null ||
      source.sale_price_override === undefined
        ? ""
        : text(source.sale_price_override),
    defaultSessionCount: numberValue(
      source.default_session_count,
      1,
    ),
    onlineBookingEnabled: boolValue(
      source.online_booking_enabled,
      false,
    ),
    requiresApproval: boolValue(
      source.requires_approval,
      false,
    ),
    requiresPreparation: boolValue(
      source.requires_preparation,
      false,
    ),
    preparationInstructions: text(
      source.preparation_instructions,
    ),
    notes: text(source.notes),
    updatedAt: text(
      source.updated_at ||
        source.modified_at ||
        source.created_at,
    ),
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
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(
    `${getApiBaseUrl()}${path}`,
    {
      ...options,
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      signal,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(options.body instanceof FormData
          ? {}
          : {
              "Content-Type":
                "application/json",
            }),
        ...(options.headers || {}),
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
    const errors = record(source.errors);
    const firstError = Object.values(errors).find(
      (item) => Array.isArray(item),
    );
    throw new Error(
      text(
        source.message ||
          source.detail ||
          source.error,
      ) ||
        (Array.isArray(firstError)
          ? text(firstError[0])
          : "") ||
        `HTTP ${response.status}`,
    );
  }
  return payload;
}
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem(
    "primey-locale",
  ) === "en"
    ? "en"
    : "ar";
}
function localizedName(
  value: {
    nameAr: string;
    nameEn: string;
    code?: string;
  },
  locale: Locale,
) {
  return locale === "ar"
    ? value.nameAr ||
        value.nameEn ||
        value.code ||
        ""
    : value.nameEn ||
        value.nameAr ||
        value.code ||
        "";
}
function offeringName(
  item: MedicalServiceOffering,
  locale: Locale,
) {
  return localizedName(item, locale);
}
function branchName(
  item: MedicalServiceOffering,
  locale: Locale,
) {
  return locale === "ar"
    ? item.branchNameAr ||
        item.branchNameEn
    : item.branchNameEn ||
        item.branchNameAr;
}
function departmentName(
  item: MedicalServiceOffering,
  locale: Locale,
) {
  return locale === "ar"
    ? item.departmentNameAr ||
        item.departmentNameEn
    : item.departmentNameEn ||
        item.departmentNameAr;
}
function specialtyName(
  item: MedicalServiceOffering,
  locale: Locale,
) {
  return locale === "ar"
    ? item.specialtyNameAr ||
        item.specialtyNameEn
    : item.specialtyNameEn ||
        item.specialtyNameAr;
}
function clinicName(
  item: MedicalServiceOffering,
  locale: Locale,
) {
  return locale === "ar"
    ? item.clinicNameAr ||
        item.clinicNameEn
    : item.clinicNameEn ||
        item.clinicNameAr;
}
function statusLabel(
  status: OfferingStatus,
  locale: Locale,
) {
  const t = copy[locale];
  if (status === "INACTIVE") {
    return t.inactiveStatus;
  }
  if (status === "ARCHIVED") {
    return t.archivedStatus;
  }
  return t.activeStatus;
}
function statusClass(status: OfferingStatus) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "INACTIVE") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}
function actionLabel(
  action: StatusAction,
  locale: Locale,
) {
  const t = copy[locale];
  if (action === "activate") return t.activate;
  if (action === "deactivate") return t.deactivate;
  return t.archive;
}
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
function MoneyValue({
  value,
}: {
  value: number;
}) {
  return (
    <span
      dir="inherit"
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium tabular-nums"
    >
      <span lang="en">{formatMoney(value)}</span>
      <Image
        src="/currency/sar.svg"
        alt=""
        aria-hidden="true"
        width={15}
        height={15}
        className="size-[15px] shrink-0"
      />
    </span>
  );
}
function buildReportHtml(
  rows: MedicalServiceOffering[],
  locale: Locale,
) {
  const t = copy[locale];
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.service)}</th>
          <th>${escapeHtml(t.branch)}</th>
          <th>${escapeHtml(t.department)}</th>
          <th>${escapeHtml(t.clinic)}</th>
          <th>${escapeHtml(t.specialty)}</th>
          <th>${escapeHtml(t.duration)}</th>
          <th>${escapeHtml(t.slotDuration)}</th>
          <th>${escapeHtml(t.price)}</th>
          <th>${escapeHtml(t.booking)}</th>
          <th>${escapeHtml(t.status)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(
                  `${offeringName(item, locale)}${
                    item.code ? ` — ${item.code}` : ""
                  }`,
                )}</td>
                <td>${escapeHtml(
                  branchName(item, locale) ||
                    t.unknown,
                )}</td>
                <td>${escapeHtml(
                  departmentName(item, locale) ||
                    t.unknown,
                )}</td>
                <td>${escapeHtml(
                  clinicName(item, locale) ||
                    t.unknown,
                )}</td>
                <td>${escapeHtml(
                  specialtyName(item, locale) ||
                    t.unknown,
                )}</td>
                <td>${escapeHtml(
                  `${item.durationMinutes} ${t.minute}`,
                )}</td>
                <td>${escapeHtml(
                  `${item.totalSlotMinutes} ${t.minute}`,
                )}</td>
                <td>${escapeHtml(
                  formatMoney(item.effectiveSalePrice),
                )}</td>
                <td>${escapeHtml(
                  item.onlineBookingEnabled
                    ? t.enabled
                    : t.disabled,
                )}</td>
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
export function MedicalServicesClient() {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const t = copy[locale];
  const rtl = locale === "ar";
  const router = useRouter();
  // MEDICAL SERVICE DETAIL ROUTING
  const openDetails = React.useCallback(
    (item: MedicalServiceOffering) => {
      router.push(
        `/system/medical-services/${encodeURIComponent(
          item.id,
        )}`,
      );
    },
    [router],
  );
  const [rows, setRows] = React.useState<
    MedicalServiceOffering[]
  >([]);
  const [catalogServices, setCatalogServices] =
    React.useState<CatalogServiceOption[]>([]);
  const [branches, setBranches] = React.useState<
    RelatedOption[]
  >([]);
  const [departments, setDepartments] =
    React.useState<RelatedOption[]>([]);
  const [specialties, setSpecialties] =
    React.useState<RelatedOption[]>([]);
  const [clinics, setClinics] = React.useState<
    RelatedOption[]
  >([]);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [saving, setSaving] =
    React.useState(false);
  const [statusSaving, setStatusSaving] =
    React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<
    string[]
  >([]);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("all");
  const [branchFilter, setBranchFilter] =
    React.useState("all");
  const [bookingFilter, setBookingFilter] =
    React.useState<BookingFilter>("all");
  const [sortKey, setSortKey] =
    React.useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] =
    React.useState(false);
  const [editing, setEditing] =
    React.useState<MedicalServiceOffering | null>(
      null,
    );
  const [form, setForm] =
    React.useState<FormState>(EMPTY_FORM);
  const [pendingStatus, setPendingStatus] =
    React.useState<PendingStatus>(null);
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
      const sources = [
        ENDPOINTS.offerings,
        ENDPOINTS.catalogServices,
        ENDPOINTS.branches,
        ENDPOINTS.departments,
        ENDPOINTS.specialties,
        ENDPOINTS.clinics,
      ];
      try {
        const results = await Promise.allSettled(
          sources.map((path) =>
            apiRequest(
              path,
              { method: "GET" },
              signal,
            ),
          ),
        );
        if (signal?.aborted) return;
        const offeringResult = results[0];
        if (
          !offeringResult ||
          offeringResult.status === "rejected"
        ) {
          throw new Error(
            offeringResult?.status === "rejected" &&
            offeringResult.reason instanceof Error
              ? offeringResult.reason.message
              : t.loadingError,
          );
        }
        const valueAt = (index: number) =>
          results[index]?.status === "fulfilled"
            ? (
                results[
                  index
                ] as PromiseFulfilledResult<unknown>
              ).value
            : {};
        const failed = results
          .slice(1)
          .filter(
            (
              item,
            ): item is PromiseRejectedResult =>
              item.status === "rejected",
          )
          .map((item) =>
            item.reason instanceof Error
              ? item.reason.message
              : String(item.reason),
          )
          .filter(Boolean);
        setRows(
          extractArray(valueAt(0))
            .map(normalizeOffering)
            .filter((item) => item.id),
        );
        setCatalogServices(
          extractArray(valueAt(1))
            .map(normalizeCatalogService)
            .filter(
              (item) =>
                item.id &&
                item.itemType === "SERVICE" &&
                item.status !== "INACTIVE" &&
                item.status !== "ARCHIVED",
            ),
        );
        setBranches(
          extractArray(valueAt(2))
            .map(normalizeRelatedOption)
            .filter((item) => item.id),
        );
        setDepartments(
          extractArray(valueAt(3))
            .map(normalizeRelatedOption)
            .filter((item) => item.id),
        );
        setSpecialties(
          extractArray(valueAt(4))
            .map(normalizeRelatedOption)
            .filter((item) => item.id),
        );
        setClinics(
          extractArray(valueAt(5))
            .map(normalizeRelatedOption)
            .filter((item) => item.id),
        );
        setWarnings(failed);
        if (silent) {
          toast.success(t.refreshed);
        }
      } catch (caught) {
        if (signal?.aborted) return;
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
    [t.loadingError, t.refreshed],
  );
  React.useEffect(() => {
    const controller = new AbortController();
    void load({
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [load]);
  const filteredRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((item) => {
        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
          return false;
        }
        if (
          branchFilter !== "all" &&
          item.branchId !== branchFilter
        ) {
          return false;
        }
        if (
          bookingFilter === "enabled" &&
          !item.onlineBookingEnabled
        ) {
          return false;
        }
        if (
          bookingFilter === "disabled" &&
          item.onlineBookingEnabled
        ) {
          return false;
        }
        if (!needle) return true;
        return [
          item.code,
          item.nameAr,
          item.nameEn,
          item.branchNameAr,
          item.branchNameEn,
          item.departmentNameAr,
          item.departmentNameEn,
          item.specialtyNameAr,
          item.specialtyNameEn,
          item.clinicNameAr,
          item.clinicNameEn,
          item.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => {
        if (sortKey === "duration") {
          return (
            right.durationMinutes -
            left.durationMinutes
          );
        }
        if (sortKey === "price") {
          return (
            right.effectiveSalePrice -
            left.effectiveSalePrice
          );
        }
        return offeringName(
          left,
          locale,
        ).localeCompare(
          offeringName(right, locale),
          locale,
        );
      });
  }, [
    bookingFilter,
    branchFilter,
    locale,
    query,
    rows,
    sortKey,
    statusFilter,
  ]);
  const stats = React.useMemo(() => {
    const activeRows = rows.filter(
      (item) => item.status === "ACTIVE",
    );
    const averageDuration = rows.length
      ? Math.round(
          rows.reduce(
            (total, item) =>
              total + item.durationMinutes,
            0,
          ) / rows.length,
        )
      : 0;
    return {
      total: rows.length,
      active: activeRows.length,
      online: activeRows.filter(
        (item) => item.onlineBookingEnabled,
      ).length,
      averageDuration,
    };
  }, [rows]);
  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== "all" ||
    branchFilter !== "all" ||
    bookingFilter !== "all" ||
    sortKey !== "name";
  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("all");
    setBookingFilter("all");
    setSortKey("name");
  };
  const activeBranches = React.useMemo(
    () =>
      branches.filter(
        (item) => item.isActive,
      ),
    [branches],
  );
  const availableDepartments =
    React.useMemo(() => {
      return departments.filter((item) => {
        if (!item.isActive) return false;
        if (!form.branchId) return true;
        if (item.branchIds.length) {
          return item.branchIds.includes(
            form.branchId,
          );
        }
        return (
          !item.branchId ||
          item.branchId === form.branchId
        );
      });
    }, [
      departments,
      form.branchId,
    ]);
  const availableClinics = React.useMemo(
    () =>
      clinics.filter((item) => {
        if (!item.isActive) return false;
        if (
          form.branchId &&
          item.branchId &&
          item.branchId !== form.branchId
        ) {
          return false;
        }
        if (
          form.departmentId &&
          item.departmentId &&
          item.departmentId !==
            form.departmentId
        ) {
          return false;
        }
        return true;
      }),
    [
      clinics,
      form.branchId,
      form.departmentId,
    ],
  );
  const selectedCatalogService =
    catalogServices.find(
      (item) =>
        item.id === form.catalogItemId,
    ) || null;
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };
  const openEdit = (
    item: MedicalServiceOffering,
  ) => {
    setEditing(item);
    setForm({
      catalogItemId: item.catalogItemId,
      branchId: item.branchId,
      departmentId: item.departmentId,
      specialtyId: item.specialtyId,
      clinicId: item.clinicId,
      durationMinutes: String(
        item.durationMinutes,
      ),
      bufferBeforeMinutes: String(
        item.bufferBeforeMinutes,
      ),
      bufferAfterMinutes: String(
        item.bufferAfterMinutes,
      ),
      salePriceOverride:
        item.salePriceOverride,
      defaultSessionCount: String(
        item.defaultSessionCount,
      ),
      onlineBookingEnabled:
        item.onlineBookingEnabled,
      requiresApproval:
        item.requiresApproval,
      requiresPreparation:
        item.requiresPreparation,
      preparationInstructions:
        item.preparationInstructions,
      notes: item.notes,
    });
    setDialogOpen(true);
  };
  const save = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (
      !form.catalogItemId ||
      !form.branchId ||
      !form.departmentId ||
      !form.specialtyId ||
      !form.clinicId
    ) {
      toast.error(t.requiredRelations);
      return;
    }
    const durationMinutes = Number(
      form.durationMinutes,
    );
    const bufferBeforeMinutes = Number(
      form.bufferBeforeMinutes,
    );
    const bufferAfterMinutes = Number(
      form.bufferAfterMinutes,
    );
    const defaultSessionCount = Number(
      form.defaultSessionCount,
    );
    const priceValue =
      form.salePriceOverride.trim() === ""
        ? null
        : Number(form.salePriceOverride);
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 ||
      !Number.isInteger(
        bufferBeforeMinutes,
      ) ||
      bufferBeforeMinutes < 0 ||
      !Number.isInteger(
        bufferAfterMinutes,
      ) ||
      bufferAfterMinutes < 0 ||
      !Number.isInteger(
        defaultSessionCount,
      ) ||
      defaultSessionCount <= 0 ||
      (priceValue !== null &&
        (!Number.isFinite(priceValue) ||
          priceValue < 0))
    ) {
      toast.error(t.invalidNumbers);
      return;
    }
    const payload: ApiRecord = {
      catalog_item_id: form.catalogItemId,
      branch_id: form.branchId,
      department_id: form.departmentId,
      specialty_id: form.specialtyId,
      clinic_id: form.clinicId,
      duration_minutes: durationMinutes,
      buffer_before_minutes:
        bufferBeforeMinutes,
      buffer_after_minutes:
        bufferAfterMinutes,
      sale_price_override:
        priceValue === null
          ? null
          : priceValue.toFixed(2),
      default_session_count:
        defaultSessionCount,
      online_booking_enabled:
        form.onlineBookingEnabled,
      requires_approval:
        form.requiresApproval,
      requires_preparation:
        form.requiresPreparation,
      preparation_instructions:
        form.requiresPreparation
          ? form.preparationInstructions.trim()
          : "",
      notes: form.notes.trim(),
    };
    try {
      setSaving(true);
      const path = editing
        ? `${ENDPOINTS.offeringBase}${encodeURIComponent(
            editing.id,
          )}/`
        : ENDPOINTS.offeringBase;
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
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.loadingError,
      );
    } finally {
      setSaving(false);
    }
  };
  const updateStatus = async () => {
    if (!pendingStatus) return;
    try {
      setStatusSaving(true);
      await apiRequest(
        `${
          ENDPOINTS.offeringBase
        }${encodeURIComponent(
          pendingStatus.item.id,
        )}/status/`,
        {
          method: "POST",
          body: JSON.stringify({
            action: pendingStatus.action,
          }),
        },
      );
      toast.success(t.statusSaved);
      setPendingStatus(null);
      await load({ silent: true });
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.loadingError,
      );
    } finally {
      setStatusSaving(false);
    }
  };
  const exportExcel = () => {
    if (!filteredRows.length) {
      toast.warning(t.excelEmpty);
      return;
    }
    const html = `<!doctype html>
<html dir="${rtl ? "rtl" : "ltr"}" lang="${locale}">
<head>
<meta charset="UTF-8" />
<style>
body{font-family:Tahoma,Arial,sans-serif;padding:18px;color:#111}
h1{font-size:20px;margin:0 0 16px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:7px;text-align:${rtl ? "right" : "left"}}
th{background:#eee}
</style>
</head>
<body>
<h1>${escapeHtml(t.reportTitle)}</h1>
${buildReportHtml(filteredRows, locale)}
</body>
</html>`;
    const blob = new Blob(
      ["\uFEFF", html],
      {
        type:
          "application/vnd.ms-excel;charset=utf-8;",
      },
    );
    const url = URL.createObjectURL(blob);
    const anchor =
      document.createElement("a");
    anchor.href = url;
    anchor.download =
      `marilyn-medical-services-${new Date()
        .toISOString()
        .slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000,
    );
    toast.success(t.excelReady);
  };
  const printServices = async () => {
    if (!filteredRows.length) {
      toast.warning(t.printEmpty);
      return;
    }
    const selectedBranchName =
      branchFilter === "all"
        ? locale === "ar"
          ? "جميع الفروع"
          : "All branches"
        : localizedName(
            branches.find(
              (item) =>
                item.id === branchFilter,
            ) || {
              nameAr: "",
              nameEn: "",
              code: "",
            },
            locale,
          ) ||
          (locale === "ar"
            ? "جميع الفروع"
            : "All branches");
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: t.registerTitle,
      branchName: selectedBranchName,
      tableHtml: buildReportHtml(
        filteredRows,
        locale,
      ),
      recordsCount: filteredRows.length,
      logoUrl: "/logo/marilyn.svg",
    });
    if (!opened) {
      toast.error(t.printBlocked);
      return;
    }
    toast.success(t.printReady);
  };
  return (
    <main
      dir={rtl ? "rtl" : "ltr"}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
              <Stethoscope className="h-3.5 w-3.5 text-[#a57b3d]" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.description}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Stethoscope className="h-4 w-4 text-emerald-500" />
              {locale === "ar"
                ? "متصل بواجهات الخدمات والكتالوج والبنية الطبية الحقيقية"
                : "Connected to live medical services, catalog, and medical structure APIs"}
            </p>

          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={
                registerOutlineButtonClass
              }
              onClick={() =>
                void load({ silent: true })
              }
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
              className={
                registerOutlineButtonClass
              }
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t.excel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={() =>
                void printServices()
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={
                registerBrandButtonClass
              }
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </div>
        </header>
        {warnings.length ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {t.partialTitle}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {t.partialDescription}
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {warnings.join(" • ")}
                </p>
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
              <CardTitle>
                {t.loadingError}
              </CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                type="button"
                onClick={() => void load()}
              >
                <RefreshCw className="h-4 w-4" />
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map(
              (_, index) => (
                <Card
                  key={`medical-service-kpi-${index}`}
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
              ),
            )
          ) : (
            <>
              <SystemKpiCard
                title={t.total}
                value={stats.total}
                description={t.totalDesc}
                icon={Layers3}
              />
              <SystemKpiCard
                title={t.active}
                value={stats.active}
                description={t.activeDesc}
                icon={CheckCircle2}
              />
              <SystemKpiCard
                title={t.online}
                value={stats.online}
                description={t.onlineDesc}
                icon={Globe2}
              />
              <SystemKpiCard
                title={t.averageDuration}
                value={stats.averageDuration}
                valueSuffix={t.minute}
                description={
                  t.averageDurationDesc
                }
                icon={Clock3}
              />
            </>
          )}
        </section>
        <MedicalOperationsTabs
          active="services"
          locale={locale}
          counts={{
            services:
              stats.total,
          }}
        />
        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <Stethoscope className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.registerDescription}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.excel}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className={
                    registerBrandButtonClass
                  }
                  onClick={() =>
                    void printServices()
                  }
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <DataRegisterSearch
                  value={query}
                  onChange={setQuery}
                  placeholder={t.search}
                  className="w-full sm:w-[350px]"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(
                      value as StatusFilter,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[155px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.allStatuses}
                    </SelectItem>
                    <SelectItem value="ACTIVE">
                      {t.activeStatus}
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      {t.inactiveStatus}
                    </SelectItem>
                    <SelectItem value="ARCHIVED">
                      {t.archivedStatus}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={branchFilter}
                  onValueChange={setBranchFilter}
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[180px]">
                    <Building2 className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    <SelectItem value="all">
                      {t.allBranches}
                    </SelectItem>
                    {activeBranches.map(
                      (branch) => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id}
                        >
                          {localizedName(
                            branch,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={bookingFilter}
                  onValueChange={(value) =>
                    setBookingFilter(
                      value as BookingFilter,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[175px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t.allBooking}
                    </SelectItem>
                    <SelectItem value="enabled">
                      {t.bookingEnabled}
                    </SelectItem>
                    <SelectItem value="disabled">
                      {t.bookingDisabled}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sortKey}
                  onValueChange={(value) =>
                    setSortKey(
                      value as SortKey,
                    )
                  }
                >
                  <SelectTrigger className="h-9 bg-background shadow-none sm:w-[165px]">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">
                      {t.sortName}
                    </SelectItem>
                    <SelectItem value="duration">
                      {t.sortDuration}
                    </SelectItem>
                    <SelectItem value="price">
                      {t.sortPrice}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    registerOutlineButtonClass
                  }
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
                    minWidth="1280px"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={`sticky z-20 h-11 w-[250px] bg-muted/40 px-4 text-start text-xs font-semibold text-muted-foreground ${
                            rtl
                              ? "right-0"
                              : "left-0"
                          }`}
                        >
                          {t.service}
                        </TableHead>
                        <TableHead className="h-11 w-[245px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.location}
                        </TableHead>
                        <TableHead className="h-11 w-[180px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.specialty}
                        </TableHead>
                        <TableHead className="h-11 w-[135px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.duration}
                        </TableHead>
                        <TableHead className="h-11 w-[135px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.slotDuration}
                        </TableHead>
                        <TableHead className="h-11 w-[145px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.price}
                        </TableHead>
                        <TableHead className="h-11 w-[130px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.booking}
                        </TableHead>
                        <TableHead className="h-11 w-[125px] px-4 text-start text-xs font-semibold text-muted-foreground">
                          {t.status}
                        </TableHead>
                        <TableHead
                          className={`sticky z-20 h-11 w-[84px] bg-muted/40 px-4 text-center text-xs font-semibold text-muted-foreground ${
                            rtl
                              ? "left-0"
                              : "right-0"
                          }`}
                        >
                          {t.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({
                          length: 6,
                        }).map((_, index) => (
                          <TableRow
                            key={`service-loading-${index}`}
                            className="h-[66px]"
                          >
                            <TableCell
                              colSpan={9}
                              className="h-[66px] px-4"
                            >
                              <Skeleton className="h-9 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredRows.length ? (
                        filteredRows.map(
                          (item) => (
                            <TableRow
                              key={item.id}
                              className="group h-[66px] cursor-pointer hover:bg-muted/35"
                              onClick={() =>
                                openDetails(item)
                              }
                            >
                              <TableCell
                                className={`sticky z-10 h-[66px] overflow-hidden bg-background px-4 text-start align-middle group-hover:bg-muted/35 ${
                                  rtl
                                    ? "right-0"
                                    : "left-0"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">
                                    {offeringName(
                                      item,
                                      locale,
                                    ) ||
                                      t.unknown}
                                  </p>
                                  <p
                                    dir="ltr"
                                    lang="en"
                                    className="mt-1 truncate font-mono text-xs text-muted-foreground"
                                  >
                                    {item.code ||
                                      "—"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                <p className="truncate text-sm font-medium">
                                  {branchName(
                                    item,
                                    locale,
                                  ) || t.unknown}
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {[
                                    departmentName(
                                      item,
                                      locale,
                                    ),
                                    clinicName(
                                      item,
                                      locale,
                                    ),
                                  ]
                                    .filter(Boolean)
                                    .join(" • ") ||
                                    t.unknown}
                                </p>
                              </TableCell>
                              <TableCell className="h-[66px] overflow-hidden px-4 text-start align-middle">
                                <span className="block truncate">
                                  {specialtyName(
                                    item,
                                    locale,
                                  ) || t.unknown}
                                </span>
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <span
                                  dir="ltr"
                                  lang="en"
                                  className="whitespace-nowrap tabular-nums"
                                >
                                  {
                                    item.durationMinutes
                                  }{" "}
                                  {t.minute}
                                </span>
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <span
                                  dir="ltr"
                                  lang="en"
                                  className="whitespace-nowrap tabular-nums"
                                >
                                  {
                                    item.totalSlotMinutes
                                  }{" "}
                                  {t.minute}
                                </span>
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <MoneyValue
                                  value={
                                    item.effectiveSalePrice
                                  }
                                />
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <Badge
                                  variant="outline"
                                  className={
                                    item.onlineBookingEnabled
                                      ? "rounded-full border-cyan-200 bg-cyan-50 text-cyan-700"
                                      : "rounded-full border-slate-200 bg-slate-50 text-slate-600"
                                  }
                                >
                                  {item.onlineBookingEnabled
                                    ? t.enabled
                                    : t.disabled}
                                </Badge>
                              </TableCell>
                              <TableCell className="h-[66px] px-4 text-start align-middle">
                                <Badge
                                  variant="outline"
                                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass(
                                    item.status,
                                  )}`}
                                >
                                  {statusLabel(
                                    item.status,
                                    locale,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`sticky z-10 h-[66px] bg-background px-4 text-center align-middle group-hover:bg-muted/35 ${
                                  rtl
                                    ? "left-0"
                                    : "right-0"
                                }`}
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                  >
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">
                                        {
                                          t.actions
                                        }
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align={
                                      rtl
                                        ? "start"
                                        : "end"
                                    }
                                  >
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        openDetails(
                                          item,
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4 text-[#b58c4d]" />
                                      {t.details}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        openEdit(
                                          item,
                                        )
                                      }
                                    >
                                      <Edit3 className="h-4 w-4 text-[#b58c4d]" />
                                      {t.edit}
                                    </DropdownMenuItem>
                                    {item.status !==
                                    "ARCHIVED" ? (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className={
                                            item.status ===
                                            "ACTIVE"
                                              ? "text-rose-600"
                                              : "text-emerald-700"
                                          }
                                          onSelect={() =>
                                            setPendingStatus(
                                              {
                                                item,
                                                action:
                                                  item.status ===
                                                  "ACTIVE"
                                                    ? "deactivate"
                                                    : "activate",
                                              },
                                            )
                                          }
                                        >
                                          <Power className="h-4 w-4" />
                                          {item.status ===
                                          "ACTIVE"
                                            ? t.deactivate
                                            : t.activate}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-slate-700"
                                          onSelect={() =>
                                            setPendingStatus(
                                              {
                                                item,
                                                action:
                                                  "archive",
                                              },
                                            )
                                          }
                                        >
                                          <Archive className="h-4 w-4" />
                                          {t.archive}
                                        </DropdownMenuItem>
                                      </>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ),
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="h-72"
                          >
                            <DataRegisterEmptyState
                              title={
                                rows.length
                                  ? t.noResults
                                  : t.noData
                              }
                              description={
                                t.registerDescription
                              }
                              showReset={
                                hasFilters
                              }
                              onReset={
                                resetFilters
                              }
                              resetLabel={
                                t.reset
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {t.resultCount}:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {filteredRows.length.toLocaleString(
                      "en-US",
                    )}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {rows.length.toLocaleString(
                      "en-US",
                    )}
                  </span>
                </span>
                <span>
                  {t.active}:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {stats.active.toLocaleString(
                      "en-US",
                    )}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent
          dir={rtl ? "rtl" : "ltr"}
          className="max-h-[92vh] max-w-4xl overflow-y-auto"
        >
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? t.editTitle
                  : t.addTitle}
              </DialogTitle>
              <DialogDescription>
                {t.formDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>
                  {t.catalogService}
                </Label>
                <Select
                  value={form.catalogItemId}
                  disabled={Boolean(editing)}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      catalogItemId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.chooseService
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    {catalogServices.map(
                      (service) => (
                        <SelectItem
                          key={service.id}
                          value={service.id}
                        >
                          {localizedName(
                            service,
                            locale,
                          )}
                          {service.code
                            ? ` — ${service.code}`
                            : ""}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {!catalogServices.length &&
                !loading ? (
                  <p className="text-xs text-amber-700">
                    {t.noCatalogServices}
                  </p>
                ) : null}
                {editing ? (
                  <p className="text-xs text-muted-foreground">
                    {t.serviceLocked}
                  </p>
                ) : null}
                {selectedCatalogService ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      {t.basePrice}
                    </span>
                    <MoneyValue
                      value={
                        selectedCatalogService.salePrice
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t.branch}</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      branchId: value,
                      departmentId: "",
                      clinicId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.chooseBranch
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    {activeBranches.map(
                      (branch) => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id}
                        >
                          {localizedName(
                            branch,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.department}</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      departmentId: value,
                      clinicId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.chooseDepartment
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    {availableDepartments.map(
                      (department) => (
                        <SelectItem
                          key={department.id}
                          value={department.id}
                        >
                          {localizedName(
                            department,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.specialty}</Label>
                <Select
                  value={form.specialtyId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      specialtyId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.chooseSpecialty
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    {specialties
                      .filter(
                        (item) =>
                          item.isActive,
                      )
                      .map((specialty) => (
                        <SelectItem
                          key={specialty.id}
                          value={specialty.id}
                        >
                          {localizedName(
                            specialty,
                            locale,
                          )}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.clinic}</Label>
                <Select
                  value={form.clinicId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      clinicId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.chooseClinic
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                    {availableClinics.map(
                      (clinic) => (
                        <SelectItem
                          key={clinic.id}
                          value={clinic.id}
                        >
                          {localizedName(
                            clinic,
                            locale,
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-duration">
                  {t.durationMinutes}
                </Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  dir="ltr"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes:
                        event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-sessions">
                  {t.sessions}
                </Label>
                <Input
                  id="service-sessions"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    form.defaultSessionCount
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultSessionCount:
                        event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer-before">
                  {t.bufferBefore}
                </Label>
                <Input
                  id="buffer-before"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    form.bufferBeforeMinutes
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bufferBeforeMinutes:
                        event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer-after">
                  {t.bufferAfter}
                </Label>
                <Input
                  id="buffer-after"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    form.bufferAfterMinutes
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bufferAfterMinutes:
                        event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="price-override">
                  {t.priceOverride}
                </Label>
                <div className="relative">
                  <Input
                    id="price-override"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    dir="ltr"
                    value={
                      form.salePriceOverride
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        salePriceOverride:
                          event.target.value,
                      }))
                    }
                    className="pe-11"
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                    <Image
                      src="/currency/sar.svg"
                      alt=""
                      aria-hidden="true"
                      width={17}
                      height={17}
                      className="size-[17px]"
                    />
                  </span>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={
                      form.onlineBookingEnabled
                    }
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        onlineBookingEnabled:
                          value === true,
                      }))
                    }
                  />
                  <span className="text-sm font-medium">
                    {t.onlineBooking}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={
                      form.requiresApproval
                    }
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        requiresApproval:
                          value === true,
                      }))
                    }
                  />
                  <span className="text-sm font-medium">
                    {t.approval}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={
                      form.requiresPreparation
                    }
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        requiresPreparation:
                          value === true,
                      }))
                    }
                  />
                  <span className="text-sm font-medium">
                    {t.preparation}
                  </span>
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparation-instructions">
                  {t.preparationInstructions}
                </Label>
                <Textarea
                  id="preparation-instructions"
                  value={
                    form.preparationInstructions
                  }
                  disabled={
                    !form.requiresPreparation
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preparationInstructions:
                        event.target.value,
                    }))
                  }
                  className="min-h-32"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="service-notes">
                  {t.notes}
                </Label>
                <Textarea
                  id="service-notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  setDialogOpen(false)
                }
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (!open && !statusSaving) {
            setPendingStatus(null);
          }
        }}
      >
        <AlertDialogContent
          dir={rtl ? "rtl" : "ltr"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.statusTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.statusDescription}
              {pendingStatus ? (
                <span className="mt-2 block font-medium text-foreground">
                  {offeringName(
                    pendingStatus.item,
                    locale,
                  )}{" "}
                  —{" "}
                  {actionLabel(
                    pendingStatus.action,
                    locale,
                  )}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={statusSaving}
            >
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={statusSaving}
              className={
                pendingStatus?.action ===
                "activate"
                  ? "bg-[#b58c4d] text-white hover:bg-[#9a713a]"
                  : pendingStatus?.action ===
                      "archive"
                    ? "bg-slate-700 text-white hover:bg-slate-800"
                    : "bg-rose-600 text-white hover:bg-rose-700"
              }
              onClick={(event) => {
                event.preventDefault();
                void updateStatus();
              }}
            >
              {statusSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {pendingStatus
                ? actionLabel(
                    pendingStatus.action,
                    locale,
                  )
                : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
