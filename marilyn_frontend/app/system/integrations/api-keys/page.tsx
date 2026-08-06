"use client";
/* ============================================================
   📂 marilyn_frontend/app/system/integrations/api-keys/page.tsx
   🔑 Marilyn Clinics — Integration API Keys Lifecycle
   ------------------------------------------------------------
   ✅ List / create / detail / edit
   ✅ Usage log
   ✅ Disable / enable / revoke / rotate
   ✅ One-time secret reveal for create and rotate
   ✅ Existing Excel / print / filters / KPI capabilities preserved
   ✅ Real API only
   ✅ sonner toast
   ✅ RTL / LTR and English digits
   ✅ No localhost hardcoding
   ✅ No backend changes
============================================================ */
import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  Copy,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  LayoutDashboard,
  KeyRound,
  Loader2,
  MoreVertical,
  PlugZap,
  Plus,
  Power,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
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
import {
  DataRegisterEmptyState,
  DataRegisterSearch,
  DataRegisterToolbar,
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type StatusFilter = "all" | "active" | "disabled" | "revoked" | "expired";
type EnvironmentFilter = "all" | "test" | "live";
type SortKey = "newest" | "oldest" | "name" | "usage";
type LifecycleAction = "disable" | "enable" | "revoke" | "rotate";
type CompanyOption = {
  id: string;
  name: string;
  code: string;
};
type ApiKeyRecord = {
  id: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  name: string;
  description: string;
  environment: "test" | "live";
  status: "active" | "disabled" | "revoked" | "expired";
  keyPrefix: string;
  scopes: string[];
  ipAllowlist: string[];
  rateLimitPerMinute: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  rotatedFromId: string;
  disabledAt: string | null;
  disabledBy: string;
  disabledReason: string;
  revokedAt: string | null;
  revokedBy: string;
  revokedReason: string;
  metadata: ApiRecord;
};
type UsageRecord = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  scope: string;
  success: boolean;
  errorMessage: string;
  createdAt: string | null;
};
type KeyFormState = {
  name: string;
  description: string;
  scopes: string[];
  ipAllowlistText: string;
  rateLimitPerMinute: string;
  expiresAt: string;
};
type CreateFormState = KeyFormState & {
  companyId: string;
  environment: "TEST" | "LIVE";
};
const API_KEYS_PATH = "/api/system/integration-api-keys/";
const COMPANIES_PATH = "/api/system/companies/";
const AVAILABLE_SCOPES = [
  "company.read",
  "customers.read",
  "customers.write",
  "products.read",
  "products.write",
  "sales_invoices.read",
  "sales_invoices.write",
  "payments.read",
  "reports.read",
  "webhooks.manage",
] as const;
const defaultKeyForm: KeyFormState = {
  name: "",
  description: "",
  scopes: ["company.read"],
  ipAllowlistText: "",
  rateLimitPerMinute: "60",
  expiresAt: "",
};
const defaultCreateForm: CreateFormState = {
  ...defaultKeyForm,
  companyId: "",
  environment: "TEST",
};
const translations = {
  ar: {
    badge: "التكاملات",
    title: "مفاتيح API",
    subtitle:
      "إدارة مفاتيح التكامل من الإنشاء حتى التدوير أو الإلغاء، مع تفاصيل الصلاحيات وسجل الاستخدام.",
    integrations: "مركز التكاملات",
    apiContracts: "عقود API",
    readiness: "جاهزية الإصدار",
    dashboard: "لوحة النظام",
    refresh: "تحديث",
    create: "إنشاء مفتاح",
    exportExcel: "تصدير Excel",
    print: "طباعة",
    searchPlaceholder: "ابحث باسم المفتاح أو المنشأة أو البادئة...",
    allStatuses: "كل الحالات",
    allEnvironments: "كل البيئات",
    allCompanies: "كل المنشآت",
    newest: "الأحدث",
    oldest: "الأقدم",
    nameSort: "الاسم",
    usageSort: "الأكثر استخدامًا",
    reset: "إعادة ضبط",
    totalKeys: "إجمالي المفاتيح",
    activeKeys: "المفاتيح النشطة",
    disabledKeys: "المفاتيح المعطلة",
    revokedKeys: "المفاتيح الملغاة",
    fromLiveApi: "من واجهة API الفعلية",
    registerTitle: "سجل مفاتيح API",
    registerDescription:
      "عرض المفاتيح الحالية وتنفيذ إجراءات دورة الحياة دون كشف السر المحفوظ.",
    key: "المفتاح",
    company: "المنشأة",
    environment: "البيئة",
    scopes: "الصلاحيات",
    lastUsage: "آخر استخدام",
    usageCount: "مرات الاستخدام",
    status: "الحالة",
    actions: "الإجراءات",
    test: "اختبار",
    live: "إنتاج",
    active: "نشط",
    disabled: "معطل",
    revoked: "ملغى",
    expired: "منتهي",
    details: "عرض التفاصيل",
    edit: "تعديل",
    usage: "سجل الاستخدام",
    rotate: "تدوير المفتاح",
    disable: "تعطيل",
    enable: "تفعيل",
    revoke: "إلغاء نهائي",
    noRows: "لا توجد مفاتيح API مطابقة.",
    noDataTitle: "لا توجد مفاتيح API",
    noDataDescription: "ستظهر مفاتيح التكامل هنا عند إنشائها من واجهة API الفعلية.",
    noResultsTitle: "لا توجد نتائج مطابقة",
    noResultsDescription: "غيّر البحث أو الفلاتر لعرض مفاتيح أخرى.",
    showing: "عرض",
    of: "من",
    rows: "سجل",
    connected: "متصل بواجهة API الفعلية",
    loadFailed: "تعذر تحميل مفاتيح API.",
    refreshed: "تم تحديث مفاتيح API.",
    tryAgain: "إعادة المحاولة",
    createTitle: "إنشاء مفتاح API",
    createDescription:
      "أنشئ مفتاحًا مرتبطًا بمنشأة واحدة. سيظهر السر مرة واحدة فقط بعد الإنشاء.",
    companyLabel: "المنشأة",
    chooseCompany: "اختر المنشأة",
    noCompanies: "لا توجد منشآت متاحة",
    environmentLabel: "البيئة",
    nameLabel: "اسم المفتاح",
    namePlaceholder: "مثال: تكامل نظام الحجز",
    descriptionLabel: "الوصف",
    descriptionPlaceholder: "وصف الغرض من المفتاح...",
    scopesLabel: "الصلاحيات",
    ipAllowlistLabel: "قائمة عناوين IP المسموحة",
    ipAllowlistPlaceholder: "عنوان واحد في كل سطر، ويمكن استخدام CIDR",
    rateLimitLabel: "حد الطلبات في الدقيقة",
    expiresAtLabel: "تاريخ الانتهاء",
    optional: "اختياري",
    cancel: "إلغاء",
    creating: "جارٍ الإنشاء...",
    created: "تم إنشاء مفتاح API.",
    createFailed: "تعذر إنشاء مفتاح API.",
    nameRequired: "اسم المفتاح مطلوب.",
    companyRequired: "اختر المنشأة.",
    scopeRequired: "اختر صلاحية واحدة على الأقل.",
    invalidRateLimit: "حد الطلبات يجب أن يكون رقمًا صحيحًا بين 1 و100000.",
    secretTitle: "سر مفتاح API",
    secretCreatedDescription:
      "انسخ السر الآن واحفظه في مكان آمن؛ لن يظهر مرة أخرى.",
    secretRotatedDescription:
      "انسخ السر الجديد الآن؛ المفتاح السابق أصبح غير صالح ولن يظهر هذا السر مجددًا.",
    copySecret: "نسخ السر",
    copied: "تم نسخ السر.",
    copyFailed: "تعذر نسخ السر.",
    secretMissing:
      "اكتملت العملية لكن الاستجابة لم تتضمن السر. لا يمكن استعادته من الواجهة.",
    close: "إغلاق",
    detailTitle: "تفاصيل مفتاح API",
    detailDescription:
      "بيانات المفتاح الحالية وحالته وأثر إجراءات دورة الحياة.",
    detailFailed: "تعذر تحميل تفاصيل المفتاح.",
    prefix: "بادئة المفتاح",
    description: "الوصف",
    ipAllowlist: "عناوين IP المسموحة",
    rateLimit: "حد الطلبات",
    expiresAt: "ينتهي في",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    createdBy: "أنشئ بواسطة",
    rotatedFrom: "مدوّر من",
    disabledAt: "تاريخ التعطيل",
    disabledBy: "عُطّل بواسطة",
    disabledReason: "سبب التعطيل",
    revokedAt: "تاريخ الإلغاء",
    revokedBy: "أُلغي بواسطة",
    revokedReason: "سبب الإلغاء",
    metadata: "بيانات إضافية",
    requestsPerMinute: "طلب/دقيقة",
    editTitle: "تعديل مفتاح API",
    editDescription:
      "يمكن تعديل الاسم والوصف والصلاحيات وعناوين IP وحد الطلبات والانتهاء.",
    save: "حفظ التعديلات",
    saving: "جارٍ الحفظ...",
    saved: "تم تحديث مفتاح API.",
    saveFailed: "تعذر تحديث مفتاح API.",
    usageTitle: "سجل استخدام مفتاح API",
    usageDescription:
      "آخر الطلبات المسجلة للمفتاح مع الاستجابة والنطاق ومعرّف الطلب.",
    usageFailed: "تعذر تحميل سجل الاستخدام.",
    method: "الطريقة",
    path: "المسار",
    response: "الاستجابة",
    ipAddress: "عنوان IP",
    scope: "الصلاحية",
    requestId: "معرّف الطلب",
    date: "التاريخ",
    success: "نجاح",
    failed: "فشل",
    noUsage: "لا توجد طلبات مسجلة لهذا المفتاح.",
    actionTitle: "تأكيد إجراء دورة الحياة",
    actionReason: "سبب الإجراء",
    actionReasonPlaceholder: "اكتب سببًا واضحًا للتدقيق الداخلي...",
    actionHint:
      "سيُرسل الإجراء إلى واجهة API الفعلية ويُحدّث السجل بعد نجاحه.",
    actionConfirm: "تنفيذ الإجراء",
    acting: "جارٍ التنفيذ...",
    actionFailed: "تعذر تنفيذ الإجراء.",
    disabledSuccess: "تم تعطيل المفتاح.",
    enabledSuccess: "تم تفعيل المفتاح.",
    revokedSuccess: "تم إلغاء المفتاح نهائيًا.",
    rotatedSuccess: "تم تدوير المفتاح وإنشاء سر جديد.",
    disableWarning:
      "سيوقف التعطيل جميع الطلبات باستخدام هذا المفتاح حتى إعادة تفعيله.",
    enableWarning:
      "سيصبح المفتاح متاحًا للاستخدام مجددًا إذا لم يكن منتهيًا.",
    revokeWarning:
      "الإلغاء نهائي ولا يمكن إعادة تفعيل المفتاح بعده.",
    rotateWarning:
      "سيُعطّل المفتاح الحالي ويُنشأ مفتاح بديل بسر جديد يظهر مرة واحدة.",
    exportEmpty: "لا توجد بيانات لتصديرها.",
    exportReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد بيانات للطباعة.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تقرير مفاتيح API — مارلين كلينكس",
  },
  en: {
    badge: "Integrations",
    title: "API Keys",
    subtitle:
      "Manage integration keys from creation through rotation or revocation, with permissions and usage history.",
    integrations: "Integrations Center",
    apiContracts: "API Contracts",
    readiness: "Release Readiness",
    dashboard: "System dashboard",
    refresh: "Refresh",
    create: "Create key",
    exportExcel: "Export Excel",
    print: "Print",
    searchPlaceholder: "Search by key, organization, or prefix...",
    allStatuses: "All statuses",
    allEnvironments: "All environments",
    allCompanies: "All organizations",
    newest: "Newest",
    oldest: "Oldest",
    nameSort: "Name",
    usageSort: "Most used",
    reset: "Reset",
    totalKeys: "Total keys",
    activeKeys: "Active keys",
    disabledKeys: "Disabled keys",
    revokedKeys: "Revoked keys",
    fromLiveApi: "From the live API",
    registerTitle: "API key register",
    registerDescription:
      "Review current keys and run lifecycle actions without exposing stored secrets.",
    key: "Key",
    company: "Organization",
    environment: "Environment",
    scopes: "Scopes",
    lastUsage: "Last usage",
    usageCount: "Usage count",
    status: "Status",
    actions: "Actions",
    test: "Test",
    live: "Live",
    active: "Active",
    disabled: "Disabled",
    revoked: "Revoked",
    expired: "Expired",
    details: "View details",
    edit: "Edit",
    usage: "Usage log",
    rotate: "Rotate key",
    disable: "Disable",
    enable: "Enable",
    revoke: "Revoke permanently",
    noRows: "No matching API keys.",
    noDataTitle: "No API keys",
    noDataDescription: "Integration keys will appear here after they are created through the live API.",
    noResultsTitle: "No matching results",
    noResultsDescription: "Change the search or filters to show other keys.",
    showing: "Showing",
    of: "of",
    rows: "records",
    connected: "Connected to the live API",
    loadFailed: "Could not load API keys.",
    refreshed: "API keys refreshed.",
    tryAgain: "Try again",
    createTitle: "Create API key",
    createDescription:
      "Create a key for one organization. The secret is shown only once after creation.",
    companyLabel: "Organization",
    chooseCompany: "Choose organization",
    noCompanies: "No organizations available",
    environmentLabel: "Environment",
    nameLabel: "Key name",
    namePlaceholder: "Example: Booking platform integration",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Describe what this key is used for...",
    scopesLabel: "Scopes",
    ipAllowlistLabel: "Allowed IP addresses",
    ipAllowlistPlaceholder: "One address per line; CIDR is supported",
    rateLimitLabel: "Requests per minute",
    expiresAtLabel: "Expiry date",
    optional: "Optional",
    cancel: "Cancel",
    creating: "Creating...",
    created: "API key created.",
    createFailed: "Could not create the API key.",
    nameRequired: "Key name is required.",
    companyRequired: "Choose an organization.",
    scopeRequired: "Choose at least one scope.",
    invalidRateLimit:
      "The request limit must be an integer between 1 and 100000.",
    secretTitle: "API key secret",
    secretCreatedDescription:
      "Copy the secret now and store it securely. It will not be shown again.",
    secretRotatedDescription:
      "Copy the new secret now. The previous key is no longer valid and this secret will not be shown again.",
    copySecret: "Copy secret",
    copied: "Secret copied.",
    copyFailed: "Could not copy the secret.",
    secretMissing:
      "The operation completed, but the response did not include the secret. It cannot be recovered from the UI.",
    close: "Close",
    detailTitle: "API key details",
    detailDescription:
      "Current key data, status, and lifecycle audit information.",
    detailFailed: "Could not load key details.",
    prefix: "Key prefix",
    description: "Description",
    ipAllowlist: "Allowed IP addresses",
    rateLimit: "Rate limit",
    expiresAt: "Expires at",
    createdAt: "Created at",
    updatedAt: "Updated at",
    createdBy: "Created by",
    rotatedFrom: "Rotated from",
    disabledAt: "Disabled at",
    disabledBy: "Disabled by",
    disabledReason: "Disable reason",
    revokedAt: "Revoked at",
    revokedBy: "Revoked by",
    revokedReason: "Revoke reason",
    metadata: "Metadata",
    requestsPerMinute: "requests/minute",
    editTitle: "Edit API key",
    editDescription:
      "Update name, description, scopes, IP allowlist, rate limit, and expiry.",
    save: "Save changes",
    saving: "Saving...",
    saved: "API key updated.",
    saveFailed: "Could not update the API key.",
    usageTitle: "API key usage log",
    usageDescription:
      "Latest requests recorded for this key with response, scope, and request ID.",
    usageFailed: "Could not load the usage log.",
    method: "Method",
    path: "Path",
    response: "Response",
    ipAddress: "IP address",
    scope: "Scope",
    requestId: "Request ID",
    date: "Date",
    success: "Success",
    failed: "Failed",
    noUsage: "No requests have been recorded for this key.",
    actionTitle: "Confirm lifecycle action",
    actionReason: "Action reason",
    actionReasonPlaceholder: "Enter a clear reason for the internal audit...",
    actionHint:
      "The action is sent to the live API and the register refreshes after success.",
    actionConfirm: "Run action",
    acting: "Working...",
    actionFailed: "Could not complete the action.",
    disabledSuccess: "The key was disabled.",
    enabledSuccess: "The key was enabled.",
    revokedSuccess: "The key was permanently revoked.",
    rotatedSuccess: "The key was rotated and a new secret was created.",
    disableWarning:
      "Disabling stops all requests with this key until it is enabled again.",
    enableWarning:
      "The key becomes available again if it has not expired.",
    revokeWarning:
      "Revocation is permanent. The key cannot be enabled afterward.",
    rotateWarning:
      "The current key is disabled and a replacement key with a one-time secret is created.",
    exportEmpty: "There is no data to export.",
    exportReady: "Excel file prepared.",
    printEmpty: "There is no data to print.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Marilyn Clinics API Keys Report",
  },
} as const;
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function toEnglishDigits(value: unknown): string {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
    )
    .replaceAll("٫", ".")
    .replaceAll("٬", ",");
}
function normalizeText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return toEnglishDigits(value).trim() || fallback;
}
function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(
    toEnglishDigits(value)
      .replaceAll(",", "")
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : fallback;
}
function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeText(value).toLowerCase();
  if (["true", "1", "yes", "success", "ok"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "failed", "error"].includes(normalized)) {
    return false;
  }
  return fallback;
}
function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const visited = new Set<unknown>();
  const walk = (value: unknown, depth = 0): unknown[] => {
    if (Array.isArray(value)) return value;
    if (
      !isRecord(value) ||
      depth > 6 ||
      visited.has(value)
    ) {
      return [];
    }
    visited.add(value);
    const candidates = [
      value.results,
      value.items,
      value.records,
      value.rows,
      value.data,
      value.result,
      value.payload,
      value.response,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
    for (const candidate of candidates) {
      const nested = walk(candidate, depth + 1);
      if (nested.length) return nested;
    }
    return [];
  };
  return walk(payload);
}
function normalizePerson(value: unknown): string {
  if (typeof value === "string") {
    return normalizeText(value);
  }
  const record = asRecord(value);
  return normalizeText(
    record.full_name ||
      record.name ||
      record.username ||
      record.email ||
      record.id,
  );
}
function normalizeStatus(
  value: unknown,
): ApiKeyRecord["status"] {
  const normalized = normalizeText(value, "ACTIVE")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    ["disabled", "inactive", "suspended", "blocked"].includes(
      normalized,
    )
  ) {
    return "disabled";
  }
  if (
    ["revoked", "cancelled", "canceled"].includes(
      normalized,
    )
  ) {
    return "revoked";
  }
  if (["expired", "ended"].includes(normalized)) {
    return "expired";
  }
  return "active";
}
function normalizeEnvironment(
  value: unknown,
): ApiKeyRecord["environment"] {
  const normalized = normalizeText(value, "TEST").toLowerCase();
  return normalized === "live" ||
    normalized === "production"
    ? "live"
    : "test";
}
function normalizeCompany(value: unknown): CompanyOption {
  const record = asRecord(value);
  return {
    id: normalizeText(
      record.id ||
        record.pk ||
        record.uuid,
    ),
    name: normalizeText(
      record.name_ar ||
        record.name ||
        record.name_en ||
        record.company_name ||
        record.title,
      "—",
    ),
    code: normalizeText(
      record.company_code ||
        record.code ||
        record.slug ||
        record.id,
    ),
  };
}
function normalizeApiKey(value: unknown): ApiKeyRecord {
  const record = asRecord(value);
  const company = asRecord(record.company);
  return {
    id: normalizeText(
      record.id ||
        record.pk ||
        record.uuid,
    ),
    companyId: normalizeText(
      record.company_id ||
        company.id ||
        company.pk ||
        company.uuid,
    ),
    companyName: normalizeText(
      record.company_name ||
        company.name_ar ||
        company.name ||
        company.name_en ||
        company.company_name,
      "—",
    ),
    companyCode: normalizeText(
      record.company_code ||
        company.company_code ||
        company.code,
    ),
    name: normalizeText(
      record.name ||
        record.title,
      "—",
    ),
    description: normalizeText(
      record.description ||
        record.notes,
    ),
    environment: normalizeEnvironment(
      record.environment ||
        record.mode,
    ),
    status: normalizeStatus(
      record.status ||
        record.state,
    ),
    keyPrefix: normalizeText(
      record.key_prefix ||
        record.prefix ||
        record.public_key,
      "—",
    ),
    scopes: normalizeStringList(
      record.scopes ||
        record.permissions ||
        record.allowed_scopes,
    ),
    ipAllowlist: normalizeStringList(
      record.ip_allowlist ||
        record.allowed_ips ||
        record.ip_addresses,
    ),
    rateLimitPerMinute: normalizeNumber(
      record.rate_limit_per_minute ||
        record.rate_limit ||
        record.requests_per_minute,
      60,
    ),
    expiresAt:
      normalizeText(
        record.expires_at ||
          record.expired_at ||
          record.valid_until,
      ) || null,
    lastUsedAt:
      normalizeText(
        record.last_used_at ||
          record.last_used ||
          record.used_at,
      ) || null,
    usageCount: normalizeNumber(
      record.usage_count ||
        record.requests_count ||
        record.total_requests ||
        record.usage_logs_count,
    ),
    createdBy: normalizePerson(
      record.created_by ||
        record.creator,
    ),
    createdAt:
      normalizeText(
        record.created_at ||
          record.created ||
          record.inserted_at,
      ) || null,
    updatedAt:
      normalizeText(
        record.updated_at ||
          record.modified_at ||
          record.updated,
      ) || null,
    rotatedFromId: normalizeText(
      record.rotated_from_id ||
        asRecord(record.rotated_from).id ||
        asRecord(record.rotated_from).pk,
    ),
    disabledAt:
      normalizeText(record.disabled_at) || null,
    disabledBy: normalizePerson(record.disabled_by),
    disabledReason: normalizeText(
      record.disabled_reason,
    ),
    revokedAt:
      normalizeText(record.revoked_at) || null,
    revokedBy: normalizePerson(record.revoked_by),
    revokedReason: normalizeText(
      record.revoked_reason,
    ),
    metadata: asRecord(record.metadata),
  };
}
function normalizeUsage(value: unknown): UsageRecord {
  const record = asRecord(value);
  return {
    id: normalizeText(
      record.id ||
        record.pk ||
        record.uuid ||
        `${record.request_id || "request"}-${
          record.created_at || ""
        }`,
    ),
    method: normalizeText(
      record.method,
      "GET",
    ).toUpperCase(),
    path: normalizeText(
      record.path ||
        record.endpoint ||
        record.url,
      "—",
    ),
    statusCode: normalizeNumber(
      record.status_code ||
        record.response_status,
    ),
    ipAddress: normalizeText(
      record.ip_address ||
        record.ip,
      "—",
    ),
    userAgent: normalizeText(record.user_agent),
    requestId: normalizeText(
      record.request_id ||
        record.correlation_id,
    ),
    scope: normalizeText(record.scope),
    success: normalizeBoolean(
      record.success,
      normalizeNumber(record.status_code) >= 200 &&
        normalizeNumber(record.status_code) < 400,
    ),
    errorMessage: normalizeText(
      record.error_message ||
        record.error,
    ),
    createdAt:
      normalizeText(
        record.created_at ||
          record.timestamp ||
          record.date,
      ) || null,
  };
}
function getSecretFromPayload(payload: unknown): string {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  const key = asRecord(record.key);
  return (
    normalizeText(record.secret_key) ||
    normalizeText(record.secret) ||
    normalizeText(record.raw_key) ||
    normalizeText(record.api_key) ||
    normalizeText(data.secret_key) ||
    normalizeText(data.secret) ||
    normalizeText(data.raw_key) ||
    normalizeText(key.secret_key) ||
    normalizeText(key.secret) ||
    normalizeText(key.raw_key)
  );
}
function formatInteger(value: unknown): string {
  return toEnglishDigits(
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(
      Math.round(normalizeNumber(value)),
    ),
  );
}
function formatDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const normalized = toEnglishDigits(value);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return (
      normalized
        .replace("T", " ")
        .slice(0, 16) || "—"
    );
  }
  return parsed
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);
}
function toDateInput(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const parsed = new Date(
    toEnglishDigits(value),
  );
  if (Number.isNaN(parsed.getTime())) {
    return toEnglishDigits(value).slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}
function dateToIso(value: string): string | null {
  const normalized = toEnglishDigits(value).trim();
  if (!normalized) return null;
  const parsed = new Date(
    `${normalized}T23:59:59`,
  );
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}
function parseIpAllowlist(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function escapeHtml(value: unknown): string {
  return toEnglishDigits(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function metadataText(metadata: ApiRecord): string {
  const entries = Object.entries(metadata);
  if (!entries.length) return "—";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return entries
      .map(
        ([key, value]) =>
          `${key}: ${normalizeText(value)}`,
      )
      .join("\n");
  }
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
function getApiBaseUrl(): string {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
  return envBase.endsWith("/api")
    ? envBase.slice(0, -4)
    : envBase;
}
function makeApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${getApiBaseUrl()}${path}`;
}
function readCookie(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith(`${name}=`),
    );
  return match
    ? decodeURIComponent(
        match.slice(name.length + 1),
      )
    : "";
}
async function ensureCsrf(): Promise<string> {
  let token = readCookie("csrftoken");
  if (token) return token;
  await fetch(
    makeApiUrl("/api/auth/csrf/"),
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  token = readCookie("csrftoken");
  return token;
}
function getApiError(
  payload: unknown,
  fallback: string,
): string {
  const record = asRecord(payload);
  const direct = normalizeText(
    record.detail ||
      record.message ||
      record.error ||
      record.non_field_errors,
  );
  if (direct) return direct;
  const fragments: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (
      ["data", "results", "items"].includes(field)
    ) {
      continue;
    }
    const values = Array.isArray(value)
      ? value
      : [value];
    for (const item of values) {
      if (isRecord(item)) {
        for (const nestedValue of Object.values(item)) {
          const text = normalizeText(nestedValue);
          if (text) {
            fragments.push(`${field}: ${text}`);
          }
        }
      } else {
        const text = normalizeText(item);
        if (text) {
          fragments.push(`${field}: ${text}`);
        }
      }
    }
  }
  return fragments.join(" · ") || fallback;
}
async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (
    options.method ||
    "GET"
  ).toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set(
    "X-Requested-With",
    "XMLHttpRequest",
  );
  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }
  if (
    !["GET", "HEAD", "OPTIONS"].includes(method)
  ) {
    const csrf = await ensureCsrf();
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }
  }
  const response = await fetch(
    makeApiUrl(path),
    {
      ...options,
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
    },
  );
  const rawText = await response.text();
  let payload: unknown = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = {
        detail: rawText,
      };
    }
  }
  if (!response.ok) {
    throw new Error(
      getApiError(
        payload,
        `HTTP ${response.status}`,
      ),
    );
  }
  return payload as T;
}
function statusClass(
  status: ApiKeyRecord["status"],
): string {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    status === "disabled" ||
    status === "expired"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}
function responseClass(success: boolean): string {
  return success
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}
function DetailItem({
  label,
  children,
  mono = false,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-muted/15 px-4 py-3",
        wide ? "sm:col-span-2" : "",
      ].join(" ")}
    >
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div
        className={[
          "min-w-0 break-words text-sm font-semibold text-foreground",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
function ScopeSelector({
  locale,
  selected,
  onChange,
  disabled = false,
}: {
  locale: Locale;
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {AVAILABLE_SCOPES.map((scope) => {
        const checked = selected.includes(scope);
        return (
          <button
            key={scope}
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange(
                checked
                  ? selected.filter(
                      (item) => item !== scope,
                    )
                  : [...selected, scope],
              )
            }
            className={[
              "flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-start transition",
              checked
                ? "border-amber-400 bg-amber-50/70"
                : "border-border bg-background hover:border-amber-300",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "",
            ].join(" ")}
            aria-pressed={checked}
          >
            <span
              dir="ltr"
              className="truncate font-mono text-xs"
            >
              {scope}
            </span>
            <span
              className={[
                "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                checked
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-muted-foreground/30",
              ].join(" ")}
            >
              {checked ? (
                <Check className="h-3.5 w-3.5" />
              ) : null}
            </span>
            <span className="sr-only">
              {locale === "ar"
                ? "تحديد الصلاحية"
                : "Toggle scope"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function KeyFields({
  locale,
  form,
  onChange,
  disabled = false,
}: {
  locale: Locale;
  form: KeyFormState;
  onChange: (
    patch: Partial<KeyFormState>,
  ) => void;
  disabled?: boolean;
}) {
  const t = translations[locale];
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="api-key-name">
            {t.nameLabel}
          </Label>
          <Input
            id="api-key-name"
            value={form.name}
            disabled={disabled}
            maxLength={150}
            autoComplete="off"
            placeholder={t.namePlaceholder}
            onChange={(event) =>
              onChange({
                name: event.target.value,
              })
            }
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key-rate-limit">
            {t.rateLimitLabel}
          </Label>
          <Input
            id="api-key-rate-limit"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={form.rateLimitPerMinute}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                rateLimitPerMinute:
                  event.target.value,
              })
            }
            className="h-11 rounded-xl"
            dir="ltr"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-key-description">
          {t.descriptionLabel}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({t.optional})
          </span>
        </Label>
        <Textarea
          id="api-key-description"
          value={form.description}
          disabled={disabled}
          maxLength={2000}
          placeholder={t.descriptionPlaceholder}
          onChange={(event) =>
            onChange({
              description: event.target.value,
            })
          }
          className="min-h-24 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label>{t.scopesLabel}</Label>
        <ScopeSelector
          locale={locale}
          selected={form.scopes}
          disabled={disabled}
          onChange={(scopes) =>
            onChange({ scopes })
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="api-key-ip-allowlist">
            {t.ipAllowlistLabel}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({t.optional})
            </span>
          </Label>
          <Textarea
            id="api-key-ip-allowlist"
            dir="ltr"
            value={form.ipAllowlistText}
            disabled={disabled}
            placeholder={t.ipAllowlistPlaceholder}
            onChange={(event) =>
              onChange({
                ipAllowlistText:
                  event.target.value,
              })
            }
            className="min-h-28 rounded-xl font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key-expires-at">
            {t.expiresAtLabel}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({t.optional})
            </span>
          </Label>
          <Input
            id="api-key-expires-at"
            type="date"
            dir="ltr"
            value={form.expiresAt}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                expiresAt: event.target.value,
              })
            }
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
export default function SystemIntegrationApiKeysPage() {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [keys, setKeys] =
    React.useState<ApiKeyRecord[]>([]);
  const [companies, setCompanies] =
    React.useState<CompanyOption[]>([]);
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [loadError, setLoadError] =
    React.useState("");
  const [query, setQuery] =
    React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("all");
  const [
    environmentFilter,
    setEnvironmentFilter,
  ] = React.useState<EnvironmentFilter>("all");
  const [companyFilter, setCompanyFilter] =
    React.useState("all");
  const [sortKey, setSortKey] =
    React.useState<SortKey>("newest");
  const [createOpen, setCreateOpen] =
    React.useState(false);
  const [createForm, setCreateForm] =
    React.useState<CreateFormState>(
      defaultCreateForm,
    );
  const [creating, setCreating] =
    React.useState(false);
  const [secretOpen, setSecretOpen] =
    React.useState(false);
  const [createdSecret, setCreatedSecret] =
    React.useState("");
  const [secretSource, setSecretSource] =
    React.useState<"create" | "rotate">(
      "create",
    );
  const [detailOpen, setDetailOpen] =
    React.useState(false);
  const [detailLoading, setDetailLoading] =
    React.useState(false);
  const [selectedKey, setSelectedKey] =
    React.useState<ApiKeyRecord | null>(null);
  const [editOpen, setEditOpen] =
    React.useState(false);
  const [editForm, setEditForm] =
    React.useState<KeyFormState>(
      defaultKeyForm,
    );
  const [saving, setSaving] =
    React.useState(false);
  const [usageOpen, setUsageOpen] =
    React.useState(false);
  const [usageLoading, setUsageLoading] =
    React.useState(false);
  const [usageRows, setUsageRows] =
    React.useState<UsageRecord[]>([]);
  const [usageKey, setUsageKey] =
    React.useState<ApiKeyRecord | null>(null);
  const [actionOpen, setActionOpen] =
    React.useState(false);
  const [actionKey, setActionKey] =
    React.useState<ApiKeyRecord | null>(null);
  const [actionType, setActionType] =
    React.useState<LifecycleAction>("disable");
  const [actionReason, setActionReason] =
    React.useState("");
  const [acting, setActing] =
    React.useState(false);
  const t = translations[locale];
  const direction =
    locale === "ar" ? "rtl" : "ltr";
  const isArabic = locale === "ar";
  React.useEffect(() => {
    const syncLocale = () =>
      setLocale(getInitialLocale());
    syncLocale();
    window.addEventListener(
      "storage",
      syncLocale,
    );
    window.addEventListener(
      "primey-locale-change",
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
        "primey-locale-change",
        syncLocale,
      );
      window.removeEventListener(
        "primey-locale-changed",
        syncLocale,
      );
    };
  }, []);
  const loadCompanies = React.useCallback(
    async () => {
      try {
        const payload =
          await requestJson<unknown>(
            `${COMPANIES_PATH}?page=1&page_size=200`,
          );
        setCompanies(
          extractItems(payload)
            .map(normalizeCompany)
            .filter((company) => company.id),
        );
      } catch {
        setCompanies([]);
      }
    },
    [],
  );
  const loadApiKeys = React.useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadError("");
      try {
        const payload =
          await requestJson<unknown>(
            `${API_KEYS_PATH}?page=1&page_size=200`,
          );
        const normalized = extractItems(payload)
          .map(normalizeApiKey)
          .filter((key) => key.id);
        setKeys(normalized);
        if (silent) {
          toast.success(t.refreshed);
        }
      } catch (error) {
        const message =
          error instanceof Error &&
          error.message
            ? error.message
            : t.loadFailed;
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      t.loadFailed,
      t.refreshed,
    ],
  );
  React.useEffect(() => {
    void Promise.all([
      loadApiKeys(false),
      loadCompanies(),
    ]);
  }, [
    loadApiKeys,
    loadCompanies,
  ]);
  const filteredKeys = React.useMemo(() => {
    const needle = query
      .trim()
      .toLowerCase();
    const rows = keys.filter((key) => {
      const haystack = [
        key.name,
        key.companyName,
        key.companyCode,
        key.keyPrefix,
        key.environment,
        key.status,
        key.scopes.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (
        needle &&
        !haystack.includes(needle)
      ) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        key.status !== statusFilter
      ) {
        return false;
      }
      if (
        environmentFilter !== "all" &&
        key.environment !== environmentFilter
      ) {
        return false;
      }
      if (
        companyFilter !== "all" &&
        key.companyId !== companyFilter
      ) {
        return false;
      }
      return true;
    });
    return [...rows].sort(
      (first, second) => {
        if (sortKey === "name") {
          return first.name.localeCompare(
            second.name,
            locale,
          );
        }
        if (sortKey === "usage") {
          return (
            second.usageCount -
            first.usageCount
          );
        }
        const firstTime = new Date(
          first.createdAt || 0,
        ).getTime();
        const secondTime = new Date(
          second.createdAt || 0,
        ).getTime();
        return sortKey === "oldest"
          ? firstTime - secondTime
          : secondTime - firstTime;
      },
    );
  }, [
    companyFilter,
    environmentFilter,
    keys,
    locale,
    query,
    sortKey,
    statusFilter,
  ]);
  const stats = React.useMemo(
    () => ({
      total: keys.length,
      active: keys.filter(
        (key) => key.status === "active",
      ).length,
      disabled: keys.filter(
        (key) =>
          key.status === "disabled" ||
          key.status === "expired",
      ).length,
      revoked: keys.filter(
        (key) => key.status === "revoked",
      ).length,
    }),
    [keys],
  );
  const hasFilters = Boolean(
    query.trim() ||
      statusFilter !== "all" ||
      environmentFilter !== "all" ||
      companyFilter !== "all" ||
      sortKey !== "newest",
  );
  const resetFilters = React.useCallback(() => {
    setQuery("");
    setStatusFilter("all");
    setEnvironmentFilter("all");
    setCompanyFilter("all");
    setSortKey("newest");
  }, []);
  const validateForm = React.useCallback(
    (
      form: KeyFormState,
      options: {
        requireCompany?: string;
      } = {},
    ): boolean => {
      if (!form.name.trim()) {
        toast.error(t.nameRequired);
        return false;
      }
      if (
        options.requireCompany !== undefined &&
        !options.requireCompany
      ) {
        toast.error(t.companyRequired);
        return false;
      }
      if (!form.scopes.length) {
        toast.error(t.scopeRequired);
        return false;
      }
      const rateLimit = Number(
        toEnglishDigits(
          form.rateLimitPerMinute,
        ),
      );
      if (
        !Number.isInteger(rateLimit) ||
        rateLimit < 1 ||
        rateLimit > 100000
      ) {
        toast.error(t.invalidRateLimit);
        return false;
      }
      return true;
    },
    [
      t.companyRequired,
      t.invalidRateLimit,
      t.nameRequired,
      t.scopeRequired,
    ],
  );
  const openCreateModal =
    React.useCallback(() => {
      setCreateForm(defaultCreateForm);
      setCreateOpen(true);
    }, []);
  const createApiKey =
    React.useCallback(async () => {
      if (
        !validateForm(
          createForm,
          {
            requireCompany:
              createForm.companyId,
          },
        )
      ) {
        return;
      }
      setCreating(true);
      try {
        const payload: ApiRecord = {
          company_id: Number(
            createForm.companyId,
          ),
          name: createForm.name.trim(),
          description:
            createForm.description.trim(),
          environment:
            createForm.environment,
          scopes: createForm.scopes,
          ip_allowlist: parseIpAllowlist(
            createForm.ipAllowlistText,
          ),
          rate_limit_per_minute: Number(
            toEnglishDigits(
              createForm.rateLimitPerMinute,
            ),
          ),
        };
        const expiry = dateToIso(
          createForm.expiresAt,
        );
        if (expiry) {
          payload.expires_at = expiry;
        }
        const response =
          await requestJson<unknown>(
            API_KEYS_PATH,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
          );
        const secret =
          getSecretFromPayload(response);
        setCreateOpen(false);
        setCreateForm(defaultCreateForm);
        toast.success(t.created);
        await loadApiKeys(true);
        if (secret) {
          setCreatedSecret(secret);
          setSecretSource("create");
          setSecretOpen(true);
        } else {
          toast.warning(t.secretMissing);
        }
      } catch (error) {
        toast.error(
          error instanceof Error &&
          error.message
            ? error.message
            : t.createFailed,
        );
      } finally {
        setCreating(false);
      }
    }, [
      createForm,
      loadApiKeys,
      t.createFailed,
      t.created,
      t.secretMissing,
      validateForm,
    ]);
  const loadDetail = React.useCallback(
    async (
      key: ApiKeyRecord,
    ): Promise<ApiKeyRecord | null> => {
      setDetailLoading(true);
      try {
        const payload =
          await requestJson<unknown>(
            `${API_KEYS_PATH}${encodeURIComponent(
              key.id,
            )}/`,
          );
        const detail =
          normalizeApiKey(payload);
        setSelectedKey(detail);
        return detail;
      } catch (error) {
        toast.error(
          error instanceof Error &&
          error.message
            ? error.message
            : t.detailFailed,
        );
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [t.detailFailed],
  );
  const openDetails = React.useCallback(
    async (key: ApiKeyRecord) => {
      setSelectedKey(key);
      setDetailOpen(true);
      await loadDetail(key);
    },
    [loadDetail],
  );
  const openEdit = React.useCallback(
    async (key: ApiKeyRecord) => {
      const detail = await loadDetail(key);
      if (!detail) return;
      setEditForm({
        name:
          detail.name === "—"
            ? ""
            : detail.name,
        description: detail.description,
        scopes: detail.scopes.length
          ? detail.scopes
          : ["company.read"],
        ipAllowlistText:
          detail.ipAllowlist.join("\n"),
        rateLimitPerMinute: String(
          detail.rateLimitPerMinute || 60,
        ),
        expiresAt: toDateInput(
          detail.expiresAt,
        ),
      });
      setEditOpen(true);
    },
    [loadDetail],
  );
  const saveEdit =
    React.useCallback(async () => {
      if (
        !selectedKey ||
        !validateForm(editForm)
      ) {
        return;
      }
      setSaving(true);
      try {
        const payload: ApiRecord = {
          name: editForm.name.trim(),
          description:
            editForm.description.trim(),
          scopes: editForm.scopes,
          ip_allowlist: parseIpAllowlist(
            editForm.ipAllowlistText,
          ),
          rate_limit_per_minute: Number(
            toEnglishDigits(
              editForm.rateLimitPerMinute,
            ),
          ),
          expires_at: dateToIso(
            editForm.expiresAt,
          ),
        };
        const response =
          await requestJson<unknown>(
            `${API_KEYS_PATH}${encodeURIComponent(
              selectedKey.id,
            )}/`,
            {
              method: "PATCH",
              body: JSON.stringify(payload),
            },
          );
        const updated =
          normalizeApiKey(response);
        setSelectedKey(updated);
        setKeys((current) =>
          current.map((key) =>
            key.id === updated.id
              ? updated
              : key,
          ),
        );
        setEditOpen(false);
        toast.success(t.saved);
      } catch (error) {
        toast.error(
          error instanceof Error &&
          error.message
            ? error.message
            : t.saveFailed,
        );
      } finally {
        setSaving(false);
      }
    }, [
      editForm,
      selectedKey,
      t.saveFailed,
      t.saved,
      validateForm,
    ]);
  const openUsage = React.useCallback(
    async (key: ApiKeyRecord) => {
      setUsageKey(key);
      setUsageRows([]);
      setUsageOpen(true);
      setUsageLoading(true);
      try {
        const payload =
          await requestJson<unknown>(
            `${API_KEYS_PATH}${encodeURIComponent(
              key.id,
            )}/usage/?page=1&page_size=100`,
          );
        setUsageRows(
          extractItems(payload).map(
            normalizeUsage,
          ),
        );
      } catch (error) {
        toast.error(
          error instanceof Error &&
          error.message
            ? error.message
            : t.usageFailed,
        );
      } finally {
        setUsageLoading(false);
      }
    },
    [t.usageFailed],
  );
  const openAction = React.useCallback(
    (
      key: ApiKeyRecord,
      action: LifecycleAction,
    ) => {
      setActionKey(key);
      setActionType(action);
      setActionReason("");
      setActionOpen(true);
    },
    [],
  );
  const runLifecycleAction =
    React.useCallback(async () => {
      if (!actionKey) return;
      setActing(true);
      try {
        const response =
          await requestJson<unknown>(
            `${API_KEYS_PATH}${encodeURIComponent(
              actionKey.id,
            )}/${actionType}/`,
            {
              method: "POST",
              body: JSON.stringify({
                reason:
                  actionReason.trim(),
              }),
            },
          );
        if (actionType === "rotate") {
          const secret =
            getSecretFromPayload(response);
          toast.success(t.rotatedSuccess);
          if (secret) {
            setCreatedSecret(secret);
            setSecretSource("rotate");
            setSecretOpen(true);
          } else {
            toast.warning(t.secretMissing);
          }
        } else if (
          actionType === "disable"
        ) {
          toast.success(t.disabledSuccess);
        } else if (
          actionType === "enable"
        ) {
          toast.success(t.enabledSuccess);
        } else {
          toast.success(t.revokedSuccess);
        }
        setActionOpen(false);
        await loadApiKeys(true);
        if (
          detailOpen &&
          selectedKey?.id === actionKey.id
        ) {
          await loadDetail(actionKey);
        }
      } catch (error) {
        toast.error(
          error instanceof Error &&
          error.message
            ? error.message
            : t.actionFailed,
        );
      } finally {
        setActing(false);
      }
    }, [
      actionKey,
      actionReason,
      actionType,
      detailOpen,
      loadApiKeys,
      loadDetail,
      selectedKey?.id,
      t.actionFailed,
      t.disabledSuccess,
      t.enabledSuccess,
      t.revokedSuccess,
      t.rotatedSuccess,
      t.secretMissing,
    ]);
  const copySecret =
    React.useCallback(async () => {
      if (!createdSecret) return;
      try {
        await navigator.clipboard.writeText(
          createdSecret,
        );
        toast.success(t.copied);
      } catch {
        toast.error(t.copyFailed);
      }
    }, [
      createdSecret,
      t.copied,
      t.copyFailed,
    ]);
  const statusLabel = React.useCallback(
    (status: ApiKeyRecord["status"]) =>
      t[status],
    [t],
  );
  const environmentLabel =
    React.useCallback(
      (
        environment:
          ApiKeyRecord["environment"],
      ) => t[environment],
      [t],
    );
  const buildTableHtml =
    React.useCallback(() => {
      const headers = [
        t.key,
        t.company,
        t.environment,
        t.scopes,
        t.lastUsage,
        t.usageCount,
        t.status,
      ];
      const head = headers
        .map(
          (header) =>
            `<th>${escapeHtml(
              header,
            )}</th>`,
        )
        .join("");
      const body = filteredKeys
        .map(
          (key) => `
            <tr>
              <td>
                <strong>${escapeHtml(
                  key.name,
                )}</strong><br />
                <span dir="ltr">${escapeHtml(
                  key.keyPrefix,
                )}</span>
              </td>
              <td>${escapeHtml(
                key.companyName,
              )}</td>
              <td>${escapeHtml(
                environmentLabel(
                  key.environment,
                ),
              )}</td>
              <td dir="ltr">${escapeHtml(
                key.scopes.length
                  ? key.scopes.join(", ")
                  : "—",
              )}</td>
              <td dir="ltr">${escapeHtml(
                formatDateTime(
                  key.lastUsedAt,
                ),
              )}</td>
              <td dir="ltr">${escapeHtml(
                formatInteger(
                  key.usageCount,
                ),
              )}</td>
              <td>${escapeHtml(
                statusLabel(key.status),
              )}</td>
            </tr>
          `,
        )
        .join("");
      return `
        <table class="data-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      `;
    }, [
      environmentLabel,
      filteredKeys,
      statusLabel,
      t.company,
      t.environment,
      t.key,
      t.lastUsage,
      t.scopes,
      t.status,
      t.usageCount,
    ]);
  const exportExcel =
    React.useCallback(() => {
      if (!filteredKeys.length) {
        toast.error(t.exportEmpty);
        return;
      }
      const documentHtml = `
        <!doctype html>
        <html
          dir="${direction}"
          lang="${locale}"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
        >
          <head>
            <meta charset="UTF-8" />
            <style>
              body {
                font-family: Tahoma, Arial, sans-serif;
                direction: ${direction};
              }
              h1 {
                font-size: 20px;
              }
              .data-table {
                width: 100%;
                border-collapse: collapse;
              }
              .data-table th,
              .data-table td {
                border: 1px solid #000;
                padding: 7px;
                text-align: ${
                  isArabic
                    ? "right"
                    : "left"
                };
                vertical-align: top;
                mso-number-format: "\\@";
              }
              .data-table th {
                background: #e5e7eb;
                font-weight: 700;
              }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(
              t.reportTitle,
            )}</h1>
            ${buildTableHtml()}
          </body>
        </html>
      `;
      const blob = new Blob(
        ["\uFEFF", documentHtml],
        {
          type: "application/vnd.ms-excel;charset=utf-8;",
        },
      );
      const url =
        URL.createObjectURL(blob);
      const anchor =
        document.createElement("a");
      anchor.href = url;
      anchor.download =
        `marilyn-api-keys-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.xls`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000,
      );
      toast.success(t.exportReady);
    }, [
      buildTableHtml,
      direction,
      filteredKeys.length,
      isArabic,
      locale,
      t.exportEmpty,
      t.exportReady,
      t.reportTitle,
    ]);
  const printReport =
    React.useCallback(async () => {
      if (!filteredKeys.length) {
        toast.error(t.printEmpty);
        return;
      }
      const opened =
        await openPrintReport({
          locale,
          title: t.reportTitle,
          tableHtml:
            buildTableHtml(),
          recordsCount:
            filteredKeys.length,
        });
      if (!opened) {
        toast.error(t.printBlocked);
      }
    }, [
      buildTableHtml,
      filteredKeys.length,
      locale,
      t.printBlocked,
      t.printEmpty,
      t.reportTitle,
    ]);
  const actionLabel = t[actionType];
  const actionWarning =
    actionType === "disable"
      ? t.disableWarning
      : actionType === "enable"
        ? t.enableWarning
        : actionType === "revoke"
          ? t.revokeWarning
          : t.rotateWarning;
  const headerArrow = isArabic
    ? ArrowLeft
    : ArrowRight;
  return (
    <main
      dir={direction}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2 text-start">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#a57b3d]">
              <Sparkles className="h-4 w-4" />
              {t.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t.title}
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t.connected}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={refreshing}
              onClick={() => void loadApiKeys(true)}
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
              className={registerBrandButtonClass}
              onClick={openCreateModal}
            >
              <Plus className="h-4 w-4" />
              {t.create}
            </Button>
          </div>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.totalKeys}
            value={stats.total}
            description={t.fromLiveApi}
            icon={KeyRound}
          />
          <SystemKpiCard
            title={t.activeKeys}
            value={stats.active}
            description={t.fromLiveApi}
            icon={CheckCircle2}
          />
          <SystemKpiCard
            title={t.disabledKeys}
            value={stats.disabled}
            description={t.fromLiveApi}
            icon={Ban}
          />
          <SystemKpiCard
            title={t.revokedKeys}
            value={stats.revoked}
            description={t.fromLiveApi}
            icon={XCircle}
          />
        </section>
        <nav
          aria-label={
            isArabic
              ? "تنقل وحدة التكاملات"
              : "Integrations navigation"
          }
          className="flex flex-wrap gap-2"
        >
          <Button
            asChild
            variant="outline"
            className={registerOutlineButtonClass}
          >
            <Link href="/system/integrations">
              <PlugZap className="h-4 w-4" />
              {t.integrations}
            </Link>
          </Button>
          <Button
            asChild
            variant="brand"
            className={registerBrandButtonClass}
          >
            <Link
              href="/system/integrations/api-keys"
              aria-current="page"
            >
              <KeyRound className="h-4 w-4" />
              {t.title}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={registerOutlineButtonClass}
          >
            <Link href="/system/integrations/api-contracts">
              <FileText className="h-4 w-4" />
              {t.apiContracts}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={registerOutlineButtonClass}
          >
            <Link href="/system/release-readiness">
              <ShieldCheck className="h-4 w-4" />
              {t.readiness}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={registerOutlineButtonClass}
          >
            <Link href="/system">
              <LayoutDashboard className="h-4 w-4" />
              {t.dashboard}
            </Link>
          </Button>
        </nav>
        {loadError ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50/70 shadow-none">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <TriangleAlert className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900">
                    {t.loadFailed}
                  </p>
                  <p className="mt-1 break-words text-xs text-amber-700">
                    {loadError}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={() => void loadApiKeys(false)}
              >
                <RotateCcw className="h-4 w-4" />
                {t.tryAgain}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card className="w-full overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle>
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
                  className={registerOutlineButtonClass}
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t.exportExcel}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className={registerBrandButtonClass}
                  onClick={() => void printReport()}
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataRegisterToolbar className="flex flex-col gap-2 xl:flex-row xl:items-center">
              <DataRegisterSearch
                value={query}
                onChange={setQuery}
                placeholder={t.searchPlaceholder}
                className="min-w-0 flex-1"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(
                    value as StatusFilter,
                  )
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[165px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allStatuses}
                  </SelectItem>
                  <SelectItem value="active">
                    {t.active}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {t.disabled}
                  </SelectItem>
                  <SelectItem value="expired">
                    {t.expired}
                  </SelectItem>
                  <SelectItem value="revoked">
                    {t.revoked}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={environmentFilter}
                onValueChange={(value) =>
                  setEnvironmentFilter(
                    value as EnvironmentFilter,
                  )
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allEnvironments}
                  </SelectItem>
                  <SelectItem value="test">
                    {t.test}
                  </SelectItem>
                  <SelectItem value="live">
                    {t.live}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={companyFilter}
                onValueChange={setCompanyFilter}
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[175px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.allCompanies}
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortKey}
                onValueChange={(value) =>
                  setSortKey(
                    value as SortKey,
                  )
                }
              >
                <SelectTrigger className="h-9 w-full bg-background shadow-none sm:w-[170px]">
                  <ArrowUpDown className="me-2 h-4 w-4 text-[#a57b3d]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {t.newest}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {t.oldest}
                  </SelectItem>
                  <SelectItem value="name">
                    {t.nameSort}
                  </SelectItem>
                  <SelectItem value="usage">
                    {t.usageSort}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </Button>
            </DataRegisterToolbar>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="w-full overflow-x-auto">
                <Table
                  variant="register"
                  className="w-full min-w-[1160px] table-fixed"
                >
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-11 w-[230px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.key}
                      </TableHead>
                      <TableHead className="h-11 w-[210px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.company}
                      </TableHead>
                      <TableHead className="h-11 w-[115px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.environment}
                      </TableHead>
                      <TableHead className="h-11 w-[250px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.scopes}
                      </TableHead>
                      <TableHead className="h-11 w-[160px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.lastUsage}
                      </TableHead>
                      <TableHead className="h-11 w-[125px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.usageCount}
                      </TableHead>
                      <TableHead className="h-11 w-[115px] px-4 text-start text-xs font-semibold text-muted-foreground">
                        {t.status}
                      </TableHead>
                      <TableHead className="sticky left-0 z-10 h-11 w-[82px] bg-muted/40 px-3 text-center text-xs font-semibold text-muted-foreground">
                        {t.actions}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({
                          length: 6,
                        }).map(
                          (_, rowIndex) => (
                            <TableRow
                              key={`loading-${rowIndex}`}
                              className="h-[64px]"
                            >
                              {Array.from({
                                length: 8,
                              }).map(
                                (
                                  __,
                                  cellIndex,
                                ) => (
                                  <TableCell
                                    key={cellIndex}
                                  >
                                    <Skeleton className="h-5 w-full" />
                                  </TableCell>
                                ),
                              )}
                            </TableRow>
                          ),
                        )
                      : filteredKeys.map(
                          (key) => (
                            <TableRow
                              key={key.id}
                              tabIndex={0}
                              className="h-[64px] cursor-pointer"
                              onClick={() =>
                                void openDetails(
                                  key,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key ===
                                    "Enter" ||
                                  event.key ===
                                    " "
                                ) {
                                  event.preventDefault();
                                  void openDetails(
                                    key,
                                  );
                                }
                              }}
                            >
                              <TableCell className="h-[64px] overflow-hidden px-4 align-middle">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {key.name}
                                  </p>
                                  <p
                                    dir="ltr"
                                    className="mt-1 truncate font-mono text-xs text-muted-foreground"
                                  >
                                    {key.keyPrefix}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="h-[64px] overflow-hidden px-4 align-middle">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {
                                      key.companyName
                                    }
                                  </p>
                                  <p
                                    dir="ltr"
                                    className="mt-1 truncate text-xs text-muted-foreground"
                                  >
                                    {key.companyCode ||
                                      key.companyId}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="h-[64px] px-4 align-middle">
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-sky-200 bg-sky-50 text-sky-700"
                                >
                                  {environmentLabel(
                                    key.environment,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="h-[64px] overflow-hidden px-4 align-middle">
                                <div
                                  dir="ltr"
                                  className="flex max-w-[330px] flex-wrap gap-1"
                                >
                                  {key.scopes.length ? (
                                    key.scopes
                                      .slice(0, 3)
                                      .map(
                                        (scope) => (
                                          <Badge
                                            key={
                                              scope
                                            }
                                            variant="outline"
                                            className="font-mono text-[10px]"
                                          >
                                            {scope}
                                          </Badge>
                                        ),
                                      )
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                  {key.scopes.length >
                                  3 ? (
                                    <Badge variant="secondary">
                                      +
                                      {formatInteger(
                                        key.scopes
                                          .length -
                                          3,
                                      )}
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="h-[64px] px-4 align-middle">
                                <span
                                  dir="ltr"
                                  lang="en"
                                  className="text-sm tabular-nums text-muted-foreground"
                                >
                                  {formatDateTime(
                                    key.lastUsedAt,
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="h-[64px] px-4 align-middle">
                                <span
                                  dir="ltr"
                                  lang="en"
                                  className="text-sm font-semibold tabular-nums"
                                >
                                  {formatInteger(
                                    key.usageCount,
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="h-[64px] px-4 align-middle">
                                <Badge
                                  variant="outline"
                                  className={[
                                    "rounded-full",
                                    statusClass(
                                      key.status,
                                    ),
                                  ].join(" ")}
                                >
                                  {statusLabel(
                                    key.status,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="sticky left-0 z-10 h-[64px] bg-background px-3 text-center align-middle"
                                onClick={(
                                  event,
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                  >
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="size-9 rounded-full"
                                      aria-label={
                                        t.actions
                                      }
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align={
                                      isArabic
                                        ? "start"
                                        : "end"
                                    }
                                    className="w-52"
                                  >
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        void openDetails(
                                          key,
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                      {t.details}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        void openEdit(
                                          key,
                                        )
                                      }
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      {t.edit}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        void openUsage(
                                          key,
                                        )
                                      }
                                    >
                                      <History className="h-4 w-4" />
                                      {t.usage}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {key.status !==
                                    "revoked" ? (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          openAction(
                                            key,
                                            "rotate",
                                          )
                                        }
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                        {t.rotate}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {key.status ===
                                    "active" ? (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          openAction(
                                            key,
                                            "disable",
                                          )
                                        }
                                      >
                                        <Ban className="h-4 w-4" />
                                        {t.disable}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {key.status ===
                                    "disabled" ? (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          openAction(
                                            key,
                                            "enable",
                                          )
                                        }
                                      >
                                        <Power className="h-4 w-4" />
                                        {t.enable}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {key.status !==
                                    "revoked" ? (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-rose-600 focus:text-rose-700"
                                          onSelect={() =>
                                            openAction(
                                              key,
                                              "revoke",
                                            )
                                          }
                                        >
                                          <CircleSlash2 className="h-4 w-4" />
                                          {t.revoke}
                                        </DropdownMenuItem>
                                      </>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                    {!loading &&
                    !filteredKeys.length ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <DataRegisterEmptyState
                            title={
                              hasFilters
                                ? t.noResultsTitle
                                : t.noDataTitle
                            }
                            description={
                              hasFilters
                                ? t.noResultsDescription
                                : t.noDataDescription
                            }
                            showReset={
                              hasFilters
                            }
                            resetLabel={t.reset}
                            onReset={
                              resetFilters
                            }
                            icon={KeyRound}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t.showing}{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatInteger(
                    filteredKeys.length,
                  )}
                </span>{" "}
                {t.of}{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatInteger(
                    keys.length,
                  )}
                </span>{" "}
                {t.rows}
              </p>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-600" />
                {t.connected}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t.createTitle}
            </DialogTitle>
            <DialogDescription>
              {t.createDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-company">
                  {t.companyLabel}
                </Label>
                <Select
                  value={
                    createForm.companyId
                  }
                  disabled={creating}
                  onValueChange={(
                    companyId,
                  ) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        companyId,
                      }),
                    )
                  }
                >
                  <SelectTrigger
                    id="create-company"
                    className="h-11 rounded-xl"
                  >
                    <SelectValue
                      placeholder={
                        t.chooseCompany
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.length ? (
                      companies.map(
                        (company) => (
                          <SelectItem
                            key={
                              company.id
                            }
                            value={
                              company.id
                            }
                          >
                            {
                              company.name
                            }
                          </SelectItem>
                        ),
                      )
                    ) : (
                      <SelectItem
                        value="none"
                        disabled
                      >
                        {t.noCompanies}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-environment">
                  {t.environmentLabel}
                </Label>
                <Select
                  value={
                    createForm.environment
                  }
                  disabled={creating}
                  onValueChange={(
                    environment,
                  ) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        environment:
                          environment as
                            | "TEST"
                            | "LIVE",
                      }),
                    )
                  }
                >
                  <SelectTrigger
                    id="create-environment"
                    className="h-11 rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEST">
                      {t.test}
                    </SelectItem>
                    <SelectItem value="LIVE">
                      {t.live}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <KeyFields
              locale={locale}
              form={createForm}
              disabled={creating}
              onChange={(patch) =>
                setCreateForm(
                  (current) => ({
                    ...current,
                    ...patch,
                  }),
                )
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={creating}
              onClick={() =>
                setCreateOpen(false)
              }
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              disabled={creating}
              onClick={() =>
                void createApiKey()
              }
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {creating
                ? t.creating
                : t.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={secretOpen}
        onOpenChange={(open) => {
          setSecretOpen(open);
          if (!open) {
            setCreatedSecret("");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t.secretTitle}
            </DialogTitle>
            <DialogDescription>
              {secretSource === "rotate"
                ? t.secretRotatedDescription
                : t.secretCreatedDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-800">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {t.secretTitle}
              </span>
            </div>
            <code
              dir="ltr"
              className="block max-h-40 overflow-auto break-all rounded-lg border bg-background p-4 text-sm"
            >
              {createdSecret}
            </code>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSecretOpen(false);
                setCreatedSecret("");
              }}
            >
              {t.close}
            </Button>
            <Button
              type="button"
              onClick={() =>
                void copySecret()
              }
            >
              <Copy className="h-4 w-4" />
              {t.copySecret}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t.detailTitle}
            </DialogTitle>
            <DialogDescription>
              {t.detailDescription}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ||
          !selectedKey ? (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              {Array.from({
                length: 12,
              }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 rounded-xl"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">
                    {selectedKey.name}
                  </p>
                  <p
                    dir="ltr"
                    className="mt-1 truncate font-mono text-xs text-muted-foreground"
                  >
                    {selectedKey.keyPrefix}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={[
                      "rounded-full",
                      statusClass(
                        selectedKey.status,
                      ),
                    ].join(" ")}
                  >
                    {statusLabel(
                      selectedKey.status,
                    )}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-sky-200 bg-sky-50 text-sky-700"
                  >
                    {environmentLabel(
                      selectedKey.environment,
                    )}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 py-2 sm:grid-cols-2">
                <DetailItem
                  label={t.company}
                >
                  {selectedKey.companyName}
                </DetailItem>
                <DetailItem
                  label={t.prefix}
                  mono
                >
                  <span dir="ltr">
                    {selectedKey.keyPrefix}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.description}
                  wide
                >
                  {selectedKey.description ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={t.scopes}
                  wide
                >
                  <div
                    dir="ltr"
                    className="flex flex-wrap gap-1.5"
                  >
                    {selectedKey.scopes
                      .length
                      ? selectedKey.scopes.map(
                          (scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="font-mono text-[11px]"
                            >
                              {scope}
                            </Badge>
                          ),
                        )
                      : "—"}
                  </div>
                </DetailItem>
                <DetailItem
                  label={t.ipAllowlist}
                  wide
                  mono
                >
                  <span dir="ltr">
                    {selectedKey
                      .ipAllowlist.length
                      ? selectedKey.ipAllowlist.join(
                          ", ",
                        )
                      : "—"}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.rateLimit}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatInteger(
                      selectedKey.rateLimitPerMinute,
                    )}{" "}
                    {t.requestsPerMinute}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.expiresAt}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.expiresAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.lastUsage}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.lastUsedAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.usageCount}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatInteger(
                      selectedKey.usageCount,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.createdAt}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.createdAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.updatedAt}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.updatedAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.createdBy}
                >
                  {selectedKey.createdBy ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={t.rotatedFrom}
                  mono
                >
                  <span dir="ltr">
                    {selectedKey.rotatedFromId ||
                      "—"}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.disabledAt}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.disabledAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.disabledBy}
                >
                  {selectedKey.disabledBy ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={
                    t.disabledReason
                  }
                  wide
                >
                  {selectedKey.disabledReason ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={t.revokedAt}
                >
                  <span
                    dir="ltr"
                    className="tabular-nums"
                  >
                    {formatDateTime(
                      selectedKey.revokedAt,
                    )}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.revokedBy}
                >
                  {selectedKey.revokedBy ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={
                    t.revokedReason
                  }
                  wide
                >
                  {selectedKey.revokedReason ||
                    "—"}
                </DetailItem>
                <DetailItem
                  label={t.metadata}
                  wide
                  mono
                >
                  <pre
                    dir="ltr"
                    className="max-h-48 overflow-auto whitespace-pre-wrap text-xs font-normal"
                  >
                    {metadataText(
                      selectedKey.metadata,
                    )}
                  </pre>
                </DetailItem>
              </div>
            </>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {selectedKey ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void openEdit(
                        selectedKey,
                      )
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                    {t.edit}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void openUsage(
                        selectedKey,
                      )
                    }
                  >
                    <History className="h-4 w-4" />
                    {t.usage}
                  </Button>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedKey &&
              selectedKey.status !==
              "revoked" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedKey) {
                      openAction(
                        selectedKey,
                        "rotate",
                      );
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.rotate}
                </Button>
              ) : null}
              {selectedKey?.status ===
              "active" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedKey) {
                      openAction(
                        selectedKey,
                        "disable",
                      );
                    }
                  }}
                >
                  <Ban className="h-4 w-4" />
                  {t.disable}
                </Button>
              ) : null}
              {selectedKey?.status ===
              "disabled" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedKey) {
                      openAction(
                        selectedKey,
                        "enable",
                      );
                    }
                  }}
                >
                  <Power className="h-4 w-4" />
                  {t.enable}
                </Button>
              ) : null}
              {selectedKey &&
              selectedKey.status !==
              "revoked" ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (selectedKey) {
                      openAction(
                        selectedKey,
                        "revoke",
                      );
                    }
                  }}
                >
                  <CircleSlash2 className="h-4 w-4" />
                  {t.revoke}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t.editTitle}
            </DialogTitle>
            <DialogDescription>
              {t.editDescription}
            </DialogDescription>
          </DialogHeader>
          <KeyFields
            locale={locale}
            form={editForm}
            disabled={saving}
            onChange={(patch) =>
              setEditForm(
                (current) => ({
                  ...current,
                  ...patch,
                }),
              )
            }
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() =>
                setEditOpen(false)
              }
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveEdit()
              }
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? t.saving
                : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={usageOpen}
        onOpenChange={setUsageOpen}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {t.usageTitle}
            </DialogTitle>
            <DialogDescription>
              {usageKey
                ? `${t.usageDescription} — ${usageKey.name}`
                : t.usageDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/25 hover:bg-muted/25">
                  <TableHead className="min-w-[90px]">
                    {t.method}
                  </TableHead>
                  <TableHead className="min-w-[280px]">
                    {t.path}
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    {t.response}
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    {t.ipAddress}
                  </TableHead>
                  <TableHead className="min-w-[170px]">
                    {t.scope}
                  </TableHead>
                  <TableHead className="min-w-[190px]">
                    {t.requestId}
                  </TableHead>
                  <TableHead className="min-w-[160px]">
                    {t.date}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLoading
                  ? Array.from({
                      length: 5,
                    }).map(
                      (
                        _,
                        rowIndex,
                      ) => (
                        <TableRow
                          key={`usage-loading-${rowIndex}`}
                        >
                          {Array.from({
                            length: 7,
                          }).map(
                            (
                              __,
                              cellIndex,
                            ) => (
                              <TableCell
                                key={
                                  cellIndex
                                }
                              >
                                <Skeleton className="h-5 w-full" />
                              </TableCell>
                            ),
                          )}
                        </TableRow>
                      ),
                    )
                  : usageRows.map(
                      (row) => (
                        <TableRow
                          key={row.id}
                        >
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono"
                            >
                              {row.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[420px]">
                              <p
                                dir="ltr"
                                className="truncate font-mono text-xs"
                                title={
                                  row.path
                                }
                              >
                                {row.path}
                              </p>
                              {row.errorMessage ? (
                                <p className="mt-1 truncate text-xs text-rose-600">
                                  {
                                    row.errorMessage
                                  }
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={[
                                "rounded-full",
                                responseClass(
                                  row.success,
                                ),
                              ].join(
                                " ",
                              )}
                            >
                              <span
                                dir="ltr"
                                className="tabular-nums"
                              >
                                {row.statusCode ||
                                  "—"}
                              </span>
                              {row.success
                                ? t.success
                                : t.failed}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              dir="ltr"
                              className="font-mono text-xs"
                            >
                              {
                                row.ipAddress
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              dir="ltr"
                              className="font-mono text-xs"
                            >
                              {row.scope ||
                                "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              dir="ltr"
                              className="block max-w-[230px] truncate font-mono text-xs"
                              title={
                                row.requestId
                              }
                            >
                              {row.requestId ||
                                "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              dir="ltr"
                              lang="en"
                              className="tabular-nums text-muted-foreground"
                            >
                              {formatDateTime(
                                row.createdAt,
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                {!usageLoading &&
                !usageRows.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-40 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                        <History className="h-9 w-9 opacity-40" />
                        <p className="font-medium">
                          {t.noUsage}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setUsageOpen(false)
              }
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={actionOpen}
        onOpenChange={setActionOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t.actionTitle}
            </DialogTitle>
            <DialogDescription>
              {actionKey
                ? `${actionLabel} — ${actionKey.name}`
                : actionLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={[
                "flex items-start gap-3 rounded-xl border p-4",
                actionType === "revoke"
                  ? "border-rose-200 bg-rose-50/70 text-rose-900"
                  : "border-amber-200 bg-amber-50/70 text-amber-900",
              ].join(" ")}
            >
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {actionWarning}
                </p>
                <p className="text-xs leading-5 opacity-80">
                  {t.actionHint}
                </p>
              </div>
            </div>
            {actionType !== "enable" ? (
              <div className="space-y-2">
                <Label htmlFor="lifecycle-reason">
                  {t.actionReason}
                </Label>
                <Textarea
                  id="lifecycle-reason"
                  value={actionReason}
                  disabled={acting}
                  maxLength={1000}
                  placeholder={
                    t.actionReasonPlaceholder
                  }
                  onChange={(event) =>
                    setActionReason(
                      event.target.value,
                    )
                  }
                  className="min-h-24 rounded-xl"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={acting}
              onClick={() =>
                setActionOpen(false)
              }
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant={
                actionType === "revoke"
                  ? "destructive"
                  : "default"
              }
              disabled={acting}
              onClick={() =>
                void runLifecycleAction()
              }
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : actionType ===
                "rotate" ? (
                <RotateCcw className="h-4 w-4" />
              ) : actionType ===
                "enable" ? (
                <Power className="h-4 w-4" />
              ) : actionType ===
                "disable" ? (
                <Ban className="h-4 w-4" />
              ) : (
                <CircleSlash2 className="h-4 w-4" />
              )}
              {acting
                ? t.acting
                : t.actionConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div
        className="sr-only"
        aria-hidden="true"
      >
        {React.createElement(
          headerArrow,
          {
            className: "h-4 w-4",
          },
        )}
        <Building2 className="h-4 w-4" />
        <Clock3 className="h-4 w-4" />
      </div>
    </main>
  );
}
