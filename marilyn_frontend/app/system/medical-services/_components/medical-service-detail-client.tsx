"use client";
/*
 * MARILYN MEDICAL SERVICE DETAIL
 * Live service-offering detail page.
 */
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Tag,
  WalletCards,
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
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type OfferingStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type RelatedRecord = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
};
type MedicalServiceDetail = {
  id: string;
  code: string;
  sku: string;
  barcode: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  catalogStatus: string;
  isSellable: boolean;
  status: OfferingStatus;
  branch: RelatedRecord;
  department: RelatedRecord;
  specialty: RelatedRecord;
  clinic: RelatedRecord;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  totalSlotMinutes: number;
  defaultSessionCount: number;
  baseSalePrice: number;
  salePriceOverride: number | null;
  effectiveSalePrice: number;
  taxable: boolean;
  taxRate: number;
  onlineBookingEnabled: boolean;
  requiresApproval: boolean;
  requiresPreparation: boolean;
  preparationInstructions: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
type Props = {
  offeringId: string;
};
const copy = {
  ar: {
    badge: "تفاصيل الخدمة الطبية",
    fallbackTitle: "الخدمة الطبية",
    description:
      "عرض بيانات الخدمة وموقع تقديمها وتسعيرها ومددها وسياسات الحجز والتجهيز.",
    back: "العودة إلى الخدمات",
    refresh: "تحديث",
    print: "طباعة",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    archived: "مؤرشف",
    enabled: "مفعّل",
    disabled: "غير مفعّل",
    yes: "نعم",
    no: "لا",
    unknown: "غير محدد",
    duration: "مدة الخدمة",
    totalSlot: "مدة الحجز الكاملة",
    sessions: "عدد الجلسات",
    taxRate: "نسبة الضريبة",
    minute: "دقيقة",
    session: "جلسة",
    identityTitle: "هوية الخدمة",
    identityDescription:
      "بيانات خدمة الكتالوج المرتبطة بعرض الخدمة الطبي.",
    code: "كود الخدمة",
    sku: "SKU",
    barcode: "الباركود",
    arabicName: "الاسم العربي",
    englishName: "الاسم الإنجليزي",
    catalogStatus: "حالة خدمة الكتالوج",
    sellable: "قابلة للبيع",
    serviceDescription: "وصف الخدمة",
    locationTitle: "موقع تقديم الخدمة",
    locationDescription:
      "الفرع والقسم والتخصص والعيادة المرتبطة بالخدمة.",
    branch: "الفرع",
    department: "القسم",
    specialty: "التخصص",
    clinic: "العيادة",
    pricingTitle: "التسعير والضريبة",
    pricingDescription:
      "السعر الأساسي والسعر الطبي الفعلي وإعدادات الضريبة.",
    basePrice: "السعر الأساسي",
    overridePrice: "السعر الطبي المخصص",
    effectivePrice: "السعر الفعلي",
    taxable: "خاضعة للضريبة",
    schedulingTitle: "المدة وسياسات الحجز",
    schedulingDescription:
      "مدة الخدمة وفترات التجهيز والموافقة والحجز الإلكتروني.",
    bufferBefore: "التجهيز قبل الخدمة",
    bufferAfter: "الوقت بعد الخدمة",
    onlineBooking: "الحجز الإلكتروني",
    approval: "تتطلب موافقة",
    preparation: "تتطلب تجهيزًا",
    instructionsTitle: "التعليمات والملاحظات",
    instructionsDescription:
      "تعليمات تجهيز المريض والملاحظات التشغيلية للخدمة.",
    preparationInstructions: "تعليمات التجهيز",
    notes: "الملاحظات",
    noInstructions: "لا توجد تعليمات تجهيز.",
    noNotes: "لا توجد ملاحظات.",
    auditTitle: "بيانات السجل",
    auditDescription:
      "معرّف عرض الخدمة وتاريخ الإنشاء وآخر تحديث.",
    recordId: "معرّف السجل",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    loadingError: "تعذر تحميل تفاصيل الخدمة الطبية",
    retry: "إعادة المحاولة",
    refreshed: "تم تحديث تفاصيل الخدمة الطبية.",
    printReady: "تم تجهيز تقرير تفاصيل الخدمة.",
    printBlocked:
      "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
    reportTitle: "تفاصيل الخدمة الطبية — Marilyn Clinics",
    reportField: "البيان",
    reportValue: "القيمة",
  },
  en: {
    badge: "Medical service details",
    fallbackTitle: "Medical service",
    description:
      "View the service location, pricing, duration, booking policies, and preparation settings.",
    back: "Back to services",
    refresh: "Refresh",
    print: "Print",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
    enabled: "Enabled",
    disabled: "Disabled",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    duration: "Service duration",
    totalSlot: "Total booking slot",
    sessions: "Session count",
    taxRate: "Tax rate",
    minute: "minutes",
    session: "sessions",
    identityTitle: "Service identity",
    identityDescription:
      "Catalog-service information linked to this medical offering.",
    code: "Service code",
    sku: "SKU",
    barcode: "Barcode",
    arabicName: "Arabic name",
    englishName: "English name",
    catalogStatus: "Catalog status",
    sellable: "Sellable",
    serviceDescription: "Service description",
    locationTitle: "Service location",
    locationDescription:
      "Branch, department, specialty, and clinic linked to the service.",
    branch: "Branch",
    department: "Department",
    specialty: "Specialty",
    clinic: "Clinic",
    pricingTitle: "Pricing and tax",
    pricingDescription:
      "Base price, effective medical price, and tax settings.",
    basePrice: "Base price",
    overridePrice: "Medical price override",
    effectivePrice: "Effective price",
    taxable: "Taxable",
    schedulingTitle: "Duration and booking policies",
    schedulingDescription:
      "Service duration, buffers, approval, and online-booking settings.",
    bufferBefore: "Preparation before service",
    bufferAfter: "Time after service",
    onlineBooking: "Online booking",
    approval: "Requires approval",
    preparation: "Requires preparation",
    instructionsTitle: "Instructions and notes",
    instructionsDescription:
      "Patient preparation instructions and operational service notes.",
    preparationInstructions: "Preparation instructions",
    notes: "Notes",
    noInstructions: "No preparation instructions.",
    noNotes: "No notes.",
    auditTitle: "Record information",
    auditDescription:
      "Service-offering ID, creation date, and last update.",
    recordId: "Record ID",
    createdAt: "Created at",
    updatedAt: "Last updated",
    loadingError: "Could not load medical service details",
    retry: "Try again",
    refreshed: "Medical service details refreshed.",
    printReady: "Service-detail report prepared.",
    printBlocked:
      "The print window could not be opened. Allow pop-ups and try again.",
    reportTitle: "Medical Service Details — Marilyn Clinics",
    reportField: "Field",
    reportValue: "Value",
  },
} as const;
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
function numberValue(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
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
  const normalized = text(value).toLowerCase();
  if (
    [
      "1",
      "true",
      "yes",
      "active",
      "enabled",
    ].includes(normalized)
  ) {
    return true;
  }
  if (
    [
      "0",
      "false",
      "no",
      "inactive",
      "disabled",
    ].includes(normalized)
  ) {
    return false;
  }
  return fallback;
}
function normalizeRelated(
  value: unknown,
): RelatedRecord {
  const source = record(value);
  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(source.code),
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
  };
}
function normalizeDetail(
  payload: unknown,
): MedicalServiceDetail {
  const root = record(payload);
  const source = record(
    root.item ||
      root.data ||
      root.result ||
      root,
  );
  const catalog = record(source.catalog_item);
  const rawStatus = text(
    source.status,
    "ACTIVE",
  ).toUpperCase();
  const status: OfferingStatus =
    rawStatus === "INACTIVE" ||
    rawStatus === "ARCHIVED"
      ? rawStatus
      : "ACTIVE";
  const salePriceOverride =
    source.sale_price_override === null ||
    source.sale_price_override === undefined ||
    source.sale_price_override === ""
      ? null
      : numberValue(source.sale_price_override);
  return {
    id: text(source.id || source.pk || source.uuid),
    code: text(catalog.code || source.code),
    sku: text(catalog.sku),
    barcode: text(catalog.barcode),
    name: text(catalog.name),
    nameAr: text(
      catalog.name_ar ||
        catalog.name,
    ),
    nameEn: text(
      catalog.name_en ||
        catalog.name,
    ),
    description: text(catalog.description),
    catalogStatus: text(catalog.status).toUpperCase(),
    isSellable: boolValue(catalog.is_sellable),
    status,
    branch: normalizeRelated(source.branch),
    department: normalizeRelated(source.department),
    specialty: normalizeRelated(source.specialty),
    clinic: normalizeRelated(source.clinic),
    durationMinutes: numberValue(
      source.duration_minutes,
    ),
    bufferBeforeMinutes: numberValue(
      source.buffer_before_minutes,
    ),
    bufferAfterMinutes: numberValue(
      source.buffer_after_minutes,
    ),
    totalSlotMinutes: numberValue(
      source.total_slot_minutes,
    ),
    defaultSessionCount: numberValue(
      source.default_session_count,
      1,
    ),
    baseSalePrice: numberValue(catalog.sale_price),
    salePriceOverride,
    effectiveSalePrice: numberValue(
      source.effective_sale_price,
    ),
    taxable: boolValue(
      source.taxable ??
        catalog.taxable,
    ),
    taxRate: numberValue(
      source.tax_rate ??
        catalog.tax_rate,
    ),
    onlineBookingEnabled: boolValue(
      source.online_booking_enabled,
    ),
    requiresApproval: boolValue(
      source.requires_approval,
    ),
    requiresPreparation: boolValue(
      source.requires_preparation,
    ),
    preparationInstructions: text(
      source.preparation_instructions,
    ),
    notes: text(source.notes),
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
async function fetchDetail(
  offeringId: string,
  signal?: AbortSignal,
): Promise<MedicalServiceDetail> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/company/medical/service-offerings/${encodeURIComponent(
      offeringId,
    )}/`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      signal,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
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
    throw new Error(
      text(
        source.message ||
          source.detail ||
          source.error,
      ) || `HTTP ${response.status}`,
    );
  }
  const item = normalizeDetail(payload);
  if (!item.id) {
    throw new Error(
      "Invalid medical service response.",
    );
  }
  return item;
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
function localizedName(
  value: RelatedRecord,
  locale: Locale,
) {
  return locale === "ar"
    ? value.nameAr ||
        value.nameEn ||
        value.code
    : value.nameEn ||
        value.nameAr ||
        value.code;
}
function serviceName(
  item: MedicalServiceDetail,
  locale: Locale,
) {
  return locale === "ar"
    ? item.nameAr ||
        item.nameEn ||
        item.name ||
        item.code
    : item.nameEn ||
        item.nameAr ||
        item.name ||
        item.code;
}
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function MoneyValue({
  value,
}: {
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold tabular-nums">
      <span lang="en">
        {formatMoney(value)}
      </span>
      <Image
        src="/currency/sar.svg"
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        className="size-4 shrink-0"
      />
    </span>
  );
}
function statusLabel(
  status: OfferingStatus,
  locale: Locale,
) {
  const t = copy[locale];
  if (status === "INACTIVE") {
    return t.inactive;
  }
  if (status === "ARCHIVED") {
    return t.archived;
  }
  return t.active;
}
function statusClass(
  status: OfferingStatus,
) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "INACTIVE") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
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
  item: MedicalServiceDetail,
  locale: Locale,
) {
  const t = copy[locale];
  const rows: Array<[string, string]> = [
    [t.code, item.code || "—"],
    [t.arabicName, item.nameAr || "—"],
    [t.englishName, item.nameEn || "—"],
    [
      t.branch,
      localizedName(item.branch, locale) ||
        t.unknown,
    ],
    [
      t.department,
      localizedName(item.department, locale) ||
        t.unknown,
    ],
    [
      t.specialty,
      localizedName(item.specialty, locale) ||
        t.unknown,
    ],
    [
      t.clinic,
      localizedName(item.clinic, locale) ||
        t.unknown,
    ],
    [
      t.duration,
      `${item.durationMinutes} ${t.minute}`,
    ],
    [
      t.totalSlot,
      `${item.totalSlotMinutes} ${t.minute}`,
    ],
    [t.basePrice, formatMoney(item.baseSalePrice)],
    [
      t.overridePrice,
      item.salePriceOverride === null
        ? "—"
        : formatMoney(item.salePriceOverride),
    ],
    [
      t.effectivePrice,
      formatMoney(item.effectiveSalePrice),
    ],
    [t.taxRate, `${item.taxRate}%`],
    [
      t.onlineBooking,
      item.onlineBookingEnabled
        ? t.enabled
        : t.disabled,
    ],
    [
      t.approval,
      item.requiresApproval ? t.yes : t.no,
    ],
    [
      t.preparation,
      item.requiresPreparation ? t.yes : t.no,
    ],
    [
      t.preparationInstructions,
      item.preparationInstructions ||
        t.noInstructions,
    ],
    [t.notes, item.notes || t.noNotes],
    [
      t.status,
      statusLabel(item.status, locale),
    ],
  ];
  return `
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.reportField)}</th>
          <th>${escapeHtml(t.reportValue)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td>${escapeHtml(label)}</td>
                <td>${escapeHtml(value)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}
export function MedicalServiceDetailClient({
  offeringId,
}: Props) {
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [item, setItem] =
    React.useState<MedicalServiceDetail | null>(
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
      try {
        const detail = await fetchDetail(
          offeringId,
          signal,
        );
        if (signal?.aborted) {
          return;
        }
        setItem(detail);
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
      offeringId,
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
    if (!item) {
      return;
    }
    const opened = await openPrintReport({
      locale,
      title: t.reportTitle,
      subtitle: serviceName(item, locale),
      branchName:
        localizedName(item.branch, locale) ||
        t.unknown,
      tableHtml: buildReportHtml(item, locale),
      recordsCount: 1,
      logoUrl: "/logo/marilyn.svg",
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
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-64 rounded-lg"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }
  if (error || !item) {
    return (
      <main
        dir={rtl ? "rtl" : "ltr"}
        className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5"
      >
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
          <CardContent className="flex flex-wrap justify-center gap-2">
            <Button
              asChild
              variant="outline"
            >
              <Link href="/system/medical-services">
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
              onClick={() => void load()}
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
                {serviceName(item, locale) ||
                  t.fallbackTitle}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${statusClass(
                  item.status,
                )}`}
              >
                {statusLabel(item.status, locale)}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.description}
            </p>
            <p
              dir="ltr"
              lang="en"
              className="mt-2 font-mono text-xs text-muted-foreground"
            >
              {item.code || "—"}
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
              <Link href="/system/medical-services">
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
            title={t.duration}
            value={item.durationMinutes}
            valueSuffix={t.minute}
            description={`${item.bufferBeforeMinutes} + ${item.bufferAfterMinutes}`}
            icon={Clock3}
          />
          <SystemKpiCard
            title={t.totalSlot}
            value={item.totalSlotMinutes}
            valueSuffix={t.minute}
            description={t.totalSlot}
            icon={CalendarClock}
          />
          <SystemKpiCard
            title={t.sessions}
            value={item.defaultSessionCount}
            valueSuffix={t.session}
            description={t.sessions}
            icon={Layers3}
          />
          <SystemKpiCard
            title={t.taxRate}
            value={item.taxRate}
            valueSuffix="%"
            description={
              item.taxable
                ? t.yes
                : t.no
            }
            icon={BadgeCheck}
          />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={Tag}
                title={t.identityTitle}
                description={t.identityDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.code}
                value={item.code}
                dir="ltr"
              />
              <DetailField
                label={t.sku}
                value={item.sku}
                dir="ltr"
              />
              <DetailField
                label={t.barcode}
                value={item.barcode}
                dir="ltr"
              />
              <DetailField
                label={t.catalogStatus}
                value={
                  item.catalogStatus ||
                  t.unknown
                }
                dir="ltr"
              />
              <DetailField
                label={t.arabicName}
                value={item.nameAr}
              />
              <DetailField
                label={t.englishName}
                value={item.nameEn}
                dir="ltr"
              />
              <DetailField
                label={t.sellable}
                value={
                  item.isSellable
                    ? t.yes
                    : t.no
                }
              />
              <div className="sm:col-span-2">
                <DetailField
                  label={t.serviceDescription}
                  value={
                    item.description || "—"
                  }
                />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={MapPin}
                title={t.locationTitle}
                description={t.locationDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.branch}
                value={
                  localizedName(
                    item.branch,
                    locale,
                  ) || t.unknown
                }
              />
              <DetailField
                label={t.department}
                value={
                  localizedName(
                    item.department,
                    locale,
                  ) || t.unknown
                }
              />
              <DetailField
                label={t.specialty}
                value={
                  localizedName(
                    item.specialty,
                    locale,
                  ) || t.unknown
                }
              />
              <DetailField
                label={t.clinic}
                value={
                  localizedName(
                    item.clinic,
                    locale,
                  ) || t.unknown
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={WalletCards}
                title={t.pricingTitle}
                description={t.pricingDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.basePrice}
                value={
                  <MoneyValue
                    value={item.baseSalePrice}
                  />
                }
              />
              <DetailField
                label={t.overridePrice}
                value={
                  item.salePriceOverride === null
                    ? "—"
                    : (
                      <MoneyValue
                        value={
                          item.salePriceOverride
                        }
                      />
                    )
                }
              />
              <DetailField
                label={t.effectivePrice}
                value={
                  <MoneyValue
                    value={
                      item.effectiveSalePrice
                    }
                  />
                }
              />
              <DetailField
                label={t.taxable}
                value={
                  item.taxable ? t.yes : t.no
                }
              />
              <DetailField
                label={t.taxRate}
                value={
                  <span
                    dir="ltr"
                    lang="en"
                    className="tabular-nums"
                  >
                    {item.taxRate.toLocaleString(
                      "en-US",
                      {
                        maximumFractionDigits: 2,
                      },
                    )}
                    %
                  </span>
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <SectionHeading
                icon={CalendarClock}
                title={t.schedulingTitle}
                description={
                  t.schedulingDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label={t.duration}
                value={`${item.durationMinutes} ${t.minute}`}
                dir="ltr"
              />
              <DetailField
                label={t.totalSlot}
                value={`${item.totalSlotMinutes} ${t.minute}`}
                dir="ltr"
              />
              <DetailField
                label={t.bufferBefore}
                value={`${item.bufferBeforeMinutes} ${t.minute}`}
                dir="ltr"
              />
              <DetailField
                label={t.bufferAfter}
                value={`${item.bufferAfterMinutes} ${t.minute}`}
                dir="ltr"
              />
              <DetailField
                label={t.onlineBooking}
                value={
                  item.onlineBookingEnabled
                    ? t.enabled
                    : t.disabled
                }
              />
              <DetailField
                label={t.approval}
                value={
                  item.requiresApproval
                    ? t.yes
                    : t.no
                }
              />
              <DetailField
                label={t.preparation}
                value={
                  item.requiresPreparation
                    ? t.yes
                    : t.no
                }
              />
              <DetailField
                label={t.sessions}
                value={String(
                  item.defaultSessionCount,
                )}
                dir="ltr"
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={FileText}
                title={t.instructionsTitle}
                description={
                  t.instructionsDescription
                }
              />
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              <DetailField
                label={t.preparationInstructions}
                value={
                  item.preparationInstructions ||
                  t.noInstructions
                }
              />
              <DetailField
                label={t.notes}
                value={
                  item.notes ||
                  t.noNotes
                }
              />
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <SectionHeading
                icon={Building2}
                title={t.auditTitle}
                description={t.auditDescription}
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <DetailField
                label={t.recordId}
                value={item.id}
                dir="ltr"
              />
              <DetailField
                label={t.createdAt}
                value={formatDateTime(
                  item.createdAt,
                  locale,
                )}
                dir="ltr"
              />
              <DetailField
                label={t.updatedAt}
                value={formatDateTime(
                  item.updatedAt,
                  locale,
                )}
                dir="ltr"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
