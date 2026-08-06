"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseMedical,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  FileCheck2,
  Loader2,
  Printer,
  RefreshCw,
  Stethoscope,
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
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";
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
type Rec = Record<string, unknown>;

type Bundle = {
  practitioner: Rec;
  specialties: Rec[];
  assignments: Rec[];
  licenses: Rec[];
  schedules: Rec[];
  breaks: Rec[];
  timeOffs: Rec[];
  services: Rec[];
  partial: boolean;
};

const API = {
  practitioners: "/api/company/medical/practitioners/",
  schedules: "/api/company/medical/practitioner-schedules/",
  breaks: "/api/company/medical/practitioner-schedule-breaks/",
  timeOffs: "/api/company/medical/practitioner-time-offs/",
  services: "/api/company/medical/practitioner-service-assignments/",
} as const;

function asRec(value: unknown): Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Rec)
    : {};
}

function txt(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
}

function num(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function yes(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = txt(value).toLowerCase();
  if (["true", "1", "yes", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive"].includes(normalized)) return false;
  return fallback;
}

function objectName(value: unknown): string {
  if (typeof value === "string") return txt(value);
  const item = asRec(value);
  return txt(
    item.name_ar ??
      item.name_en ??
      item.name ??
      item.full_name_ar ??
      item.full_name_en ??
      item.display_name ??
      item.title ??
      item.code,
  );
}

function items(payload: unknown): Rec[] {
  if (Array.isArray(payload)) return payload.map(asRec);
  const root = asRec(payload);
  const data = asRec(root.data);
  const candidates = [
    root.items,
    root.results,
    root.specialties,
    root.assignments,
    root.licenses,
    root.weekly_schedules,
    root.schedule_breaks,
    root.time_off_periods,
    root.practitioner_service_assignments,
    data.items,
    data.results,
  ];
  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found.map(asRec) : [];
}

function item(payload: unknown): Rec {
  const root = asRec(payload);
  return asRec(root.item ?? root.data ?? payload);
}

function status(value: unknown): string {
  return txt(value, "UNKNOWN").toUpperCase().replace(/[\s-]+/g, "_");
}

function localStatus(value: unknown, locale: Locale): string {
  const key = status(value);
  const ar: Record<string, string> = {
    ACTIVE: "نشط",
    INACTIVE: "غير نشط",
    SUSPENDED: "موقوف",
    PENDING: "قيد المراجعة",
    APPROVED: "معتمد",
    EXPIRED: "منتهي",
    REVOKED: "ملغى",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى",
    ARCHIVED: "مؤرشف",
    ON_LEAVE: "في إجازة",
    PHYSICIAN: "طبيب",
    DENTIST: "طبيب أسنان",
    NURSE: "تمريض",
    THERAPIST: "معالج",
    TECHNICIAN: "فني",
    OTHER: "أخرى",
    MALE: "ذكر",
    FEMALE: "أنثى",
    UNKNOWN: "غير محدد",
  };
  const en: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
    PENDING: "Pending",
    APPROVED: "Approved",
    EXPIRED: "Expired",
    REVOKED: "Revoked",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    ARCHIVED: "Archived",
    ON_LEAVE: "On leave",
    PHYSICIAN: "Physician",
    DENTIST: "Dentist",
    NURSE: "Nurse",
    THERAPIST: "Therapist",
    TECHNICIAN: "Technician",
    OTHER: "Other",
    MALE: "Male",
    FEMALE: "Female",
    UNKNOWN: "Unknown",
  };
  return (locale === "ar" ? ar : en)[key] || key.toLowerCase().replaceAll("_", " ");
}

function statusClass(value: unknown): string {
  const key = status(value);
  if (["ACTIVE", "APPROVED"].includes(key)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["PENDING", "SUSPENDED"].includes(key)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["EXPIRED", "REVOKED", "REJECTED", "CANCELLED"].includes(key)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function dateOnly(value: unknown): string {
  const result = txt(value);
  return result ? result.slice(0, 10) : "—";
}

function timeOnly(value: unknown): string {
  const result = txt(value);
  return result ? result.slice(0, 5) : "—";
}

function dateTime(value: unknown): string {
  const result = txt(value);
  if (!result) return "—";
  const parsed = new Date(result);
  if (Number.isNaN(parsed.getTime())) return result;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function period(from: unknown, to: unknown, open: string): string {
  return txt(from) || txt(to)
    ? `${dateOnly(from)} — ${dateOnly(to)}`
    : open;
}

function escapeHtml(value: unknown): string {
  return txt(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar";
}

function apiBase(): string {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}

function csrf(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (init?.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = csrf();
    if (token) headers.set("X-CSRFToken", token);
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
  });
  const raw = await response.text();
  let payload: unknown = {};
  try {
    payload = raw ? (JSON.parse(raw) as unknown) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const data = asRec(payload);
    const errors = asRec(data.errors);
    const first = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => txt(value))
      .find(Boolean);
    throw new Error(
      txt(data.message) ||
        txt(data.detail) ||
        txt(data.error) ||
        first ||
        `HTTP ${response.status}`,
    );
  }
  return payload;
}

function Info({
  label,
  value,
  dir,
}: {
  label: string;
  value: React.ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-lg border bg-muted/10 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div dir={dir} className="mt-1.5 min-h-5 break-words text-sm font-medium">
        {value || "—"}
      </div>
    </div>
  );
}

function RegisterSection({
  title,
  description,
  headers,
  rows,
  empty,
  minWidth = "900px",
}: {
  title: string;
  description: string;
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
  minWidth?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-lg bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="mt-1 leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <Table variant="register" layout="fixed" minWidth={minWidth}>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="h-[58px]">
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="h-56">
                      <DataRegisterEmptyState title={empty} description={empty} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen w-full px-3 py-5 sm:px-4 lg:px-5">
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[126px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </main>
  );
}

export default function PractitionerDetailClient({
  practitionerId,
}: {
  practitionerId: string;
}) {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [bundle, setBundle] = React.useState<Bundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const ar = locale === "ar";
  const dir = ar ? "rtl" : "ltr";
  const l = React.useCallback(
    (arabic: string, english: string) => (ar ? arabic : english),
    [ar],
  );

  React.useEffect(() => {
    const sync = () => {
      const next = getLocale();
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.body.dir = next === "ar" ? "rtl" : "ltr";
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("primey-locale-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("primey-locale-changed", sync);
    };
  }, []);

  const load = React.useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const practitionerPayload = await request(
          `${API.practitioners}${encodeURIComponent(practitionerId)}/`,
        );
        const practitioner = item(practitionerPayload);

        const related = await Promise.allSettled([
          request(
            `${API.practitioners}${encodeURIComponent(practitionerId)}/specialties/`,
          ),
          request(
            `${API.practitioners}${encodeURIComponent(practitionerId)}/assignments/`,
          ),
          request(
            `${API.practitioners}${encodeURIComponent(practitionerId)}/licenses/`,
          ),
          request(
            `${API.schedules}?practitioner_id=${encodeURIComponent(practitionerId)}`,
          ),
          request(
            `${API.breaks}?practitioner_id=${encodeURIComponent(practitionerId)}`,
          ),
          request(
            `${API.timeOffs}?practitioner_id=${encodeURIComponent(practitionerId)}`,
          ),
          request(
            `${API.services}?page_size=200&practitioner_id=${encodeURIComponent(
              practitionerId,
            )}`,
          ),
        ]);

        const read = (index: number) =>
          related[index]?.status === "fulfilled"
            ? items(related[index].value)
            : [];

        setBundle({
          practitioner,
          specialties: read(0),
          assignments: read(1),
          licenses: read(2),
          schedules: read(3),
          breaks: read(4),
          timeOffs: read(5),
          services: read(6),
          partial: related.some((result) => result.status === "rejected"),
        });

        if (silent) toast.success(l("تم تحديث الملف.", "File refreshed."));
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : l("تعذر تحميل ملف الممارس.", "Could not load practitioner file.");
        setError(message);
        if (silent) toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [l, practitionerId],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const practitioner = bundle?.practitioner || {};
  const practitionerStatus = status(practitioner.status);
  const practitionerName = ar
    ? txt(practitioner.full_name_ar ?? practitioner.full_name_en)
    : txt(practitioner.full_name_en ?? practitioner.full_name_ar);
  const activeSchedules =
    bundle?.schedules.filter((entry) => yes(entry.is_active, true)).length || 0;
  const activeServices =
    bundle?.services.filter((entry) =>
      yes(entry.is_active_service_assignment),
    ).length || 0;

  const breaksBySchedule = React.useMemo(() => {
    const result = new Map<string, Rec[]>();
    (bundle?.breaks || []).forEach((entry) => {
      const scheduleId = txt(entry.weekly_schedule_id);
      result.set(scheduleId, [...(result.get(scheduleId) || []), entry]);
    });
    return result;
  }, [bundle]);

  const changeStatus = async () => {
    const action = practitionerStatus === "ACTIVE" ? "suspend" : "activate";
    setSaving(true);
    try {
      await request(
        `${API.practitioners}${encodeURIComponent(practitionerId)}/status/`,
        {
          method: "POST",
          body: JSON.stringify({ action }),
        },
      );
      toast.success(l("تم تحديث حالة الممارس.", "Practitioner status updated."));
      setConfirmOpen(false);
      await load(true);
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : l("تعذر تحديث الحالة.", "Could not update status."),
      );
    } finally {
      setSaving(false);
    }
  };

  const printFile = async () => {
    if (!bundle) return;
    const p = bundle.practitioner;
    const detailRows = [
      [l("رقم الممارس", "Practitioner number"), txt(p.practitioner_number, "—")],
      [l("الاسم بالعربية", "Arabic name"), txt(p.full_name_ar, "—")],
      [l("الاسم بالإنجليزية", "English name"), txt(p.full_name_en, "—")],
      [l("المسمى المهني", "Professional title"), txt(p.professional_title, "—")],
      [l("التخصص الأساسي", "Primary specialty"), objectName(p.primary_specialty) || "—"],
      [l("الفرع الافتراضي", "Default branch"), objectName(p.default_branch) || "—"],
      [l("الحالة", "Status"), localStatus(p.status, locale)],
    ]
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
      )
      .join("");

    const relatedRows = [
      [l("التخصصات", "Specialties"), bundle.specialties.length],
      [l("التعيينات", "Assignments"), bundle.assignments.length],
      [l("التراخيص", "Licenses"), bundle.licenses.length],
      [l("الجداول", "Schedules"), bundle.schedules.length],
      [l("الإجازات", "Time off"), bundle.timeOffs.length],
      [l("الخدمات المسندة", "Assigned services"), bundle.services.length],
    ]
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
      )
      .join("");

    const opened = await openPrintReport({
      locale,
      title: l(
        "تقرير ملف الممارس — Marilyn Clinics",
        "Marilyn Clinics Practitioner File Report",
      ),
      subtitle: `${practitionerName || txt(p.practitioner_number, "—")} — ${txt(
        p.practitioner_number,
        "—",
      )}`,
      branchName: objectName(p.default_branch) || undefined,
      tableHtml: `
        <h2>${escapeHtml(l("البيانات الأساسية", "Core information"))}</h2>
        <table><tbody>${detailRows}</tbody></table>
        <h2>${escapeHtml(l("ملخص الارتباطات", "Relationship summary"))}</h2>
        <table><tbody>${relatedRows}</tbody></table>
      `,
      recordsCount:
        bundle.specialties.length +
        bundle.assignments.length +
        bundle.licenses.length +
        bundle.schedules.length +
        bundle.timeOffs.length +
        bundle.services.length,
    });

    if (!opened) {
      toast.error(
        l(
          "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.",
          "Could not open the print window. Allow pop-ups.",
        ),
      );
      return;
    }
    toast.success(l("تم تجهيز الملف للطباعة.", "File prepared for printing."));
  };

  if (loading) return <LoadingState />;

  if (error || !bundle) {
    return (
      <main
        dir={dir}
        className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
      >
        <Card className="mx-auto max-w-3xl rounded-lg border-rose-200 bg-card shadow-none">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <CircleSlash2 className="h-7 w-7" />
            </span>
            <CardTitle>
              {l("تعذر تحميل ملف الممارس", "Could not load practitioner file")}
            </CardTitle>
            <CardDescription>
              {l(
                "تأكد من صحة رقم الممارس وتسجيل الدخول وتشغيل الباكند.",
                "Confirm the practitioner ID, session, and backend service.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {error || "HTTP 404"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => void load()}>
                <RefreshCw className="h-4 w-4" />
                {l("إعادة المحاولة", "Retry")}
              </Button>
              <Button asChild variant="brand">
                <Link href="/system/practitioners">
                  {ar ? (
                    <ArrowRight className="h-4 w-4" />
                  ) : (
                    <ArrowLeft className="h-4 w-4" />
                  )}
                  {l("العودة إلى الممارسين", "Back to practitioners")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const specialties = bundle.specialties.map((entry) => {
    const specialty = asRec(entry.specialty);
    return [
      <div key="name">
        <p className="font-medium">{objectName(specialty) || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {txt(specialty.code, "—")}
        </p>
      </div>,
      <span key="years" className="tabular-nums">
        {num(entry.years_experience)} {l("سنة", "years")}
      </span>,
      <span key="validity" dir="ltr">
        {period(entry.valid_from, entry.valid_until, l("مفتوح", "Open"))}
      </span>,
      <Badge key="type" variant="outline" className="rounded-full">
        {yes(entry.is_primary) ? l("أساسي", "Primary") : l("إضافي", "Additional")}
      </Badge>,
      <Badge
        key="status"
        variant="outline"
        className={`rounded-full ${statusClass(
          yes(entry.is_active, true) ? "ACTIVE" : "INACTIVE",
        )}`}
      >
        {yes(entry.is_active, true) ? l("نشط", "Active") : l("غير نشط", "Inactive")}
      </Badge>,
    ];
  });

  const assignments = bundle.assignments.map((entry) => [
    objectName(entry.branch) || "—",
    objectName(entry.department) || "—",
    objectName(entry.clinic) || "—",
    <span key="period" dir="ltr">
      {period(entry.start_date, entry.end_date, l("مفتوح", "Open"))}
    </span>,
    yes(entry.is_primary) ? l("أساسي", "Primary") : l("إضافي", "Additional"),
    <Badge
      key="status"
      variant="outline"
      className={`rounded-full ${statusClass(
        yes(entry.is_active, true) ? "ACTIVE" : "INACTIVE",
      )}`}
    >
      {yes(entry.is_active, true) ? l("نشط", "Active") : l("غير نشط", "Inactive")}
    </Badge>,
  ]);

  const licenses = bundle.licenses.map((entry) => [
    txt(entry.license_number, "—"),
    txt(entry.license_type, "—"),
    txt(entry.issuing_authority, "—"),
    objectName(entry.specialty) || "—",
    <span key="issued" dir="ltr">{dateOnly(entry.issued_at)}</span>,
    <span key="expires" dir="ltr">{dateOnly(entry.expires_at)}</span>,
    <Badge
      key="status"
      variant="outline"
      className={`rounded-full ${statusClass(
        yes(entry.is_expired) ? "EXPIRED" : entry.status,
      )}`}
    >
      {localStatus(yes(entry.is_expired) ? "EXPIRED" : entry.status, locale)}
    </Badge>,
  ]);

  const schedules = bundle.schedules.map((entry) => {
    const weekday = num(entry.weekday);
    const arDays = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    const enDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const scheduleBreaks = breaksBySchedule.get(txt(entry.id)) || [];
    return [
      (ar ? arDays : enDays)[weekday] || txt(entry.weekday_label, "—"),
      <span key="hours" dir="ltr">
        {timeOnly(entry.start_time)} — {timeOnly(entry.end_time)}
      </span>,
      `${num(entry.slot_interval_minutes)} ${l("دقيقة", "min")}`,
      <span key="breaks" dir="ltr">
        {scheduleBreaks.length
          ? scheduleBreaks
              .map(
                (value) =>
                  `${timeOnly(value.start_time)} — ${timeOnly(value.end_time)}`,
              )
              .join(" · ")
          : "—"}
      </span>,
      <Badge
        key="status"
        variant="outline"
        className={`rounded-full ${statusClass(
          yes(entry.is_active, true) ? "ACTIVE" : "INACTIVE",
        )}`}
      >
        {yes(entry.is_active, true) ? l("نشط", "Active") : l("غير نشط", "Inactive")}
      </Badge>,
    ];
  });

  const timeOffs = bundle.timeOffs.map((entry) => [
    <span key="from" dir="ltr">{dateTime(entry.starts_at)}</span>,
    <span key="to" dir="ltr">{dateTime(entry.ends_at)}</span>,
    txt(entry.reason, "—"),
    <Badge
      key="status"
      variant="outline"
      className={`rounded-full ${statusClass(entry.status)}`}
    >
      {localStatus(entry.status, locale)}
    </Badge>,
  ]);

  const services = bundle.services.map((entry) => {
    const offering = asRec(entry.service_offering);
    const catalog = asRec(offering.catalog_item);
    const assignment = asRec(entry.practitioner_assignment);
    return [
      <div key="service">
        <p className="font-medium">{objectName(catalog) || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {txt(catalog.code, "—")}
        </p>
      </div>,
      objectName(assignment.branch ?? offering.branch) || "—",
      `${num(
        entry.effective_duration_minutes ??
          entry.duration_override_minutes ??
          offering.duration_minutes,
      )} ${l("دقيقة", "min")}`,
      yes(
        entry.effective_online_booking_enabled ??
          entry.online_booking_enabled ??
          offering.online_booking_enabled,
      )
        ? l("مفعّل", "Enabled")
        : l("غير مفعّل", "Disabled"),
      <Badge
        key="status"
        variant="outline"
        className={`rounded-full ${statusClass(
          yes(entry.is_active_service_assignment) ? entry.status : "INACTIVE",
        )}`}
      >
        {localStatus(
          yes(entry.is_active_service_assignment) ? entry.status : "INACTIVE",
          locale,
        )}
      </Badge>,
    ];
  });

  const nextAction = practitionerStatus === "ACTIVE" ? "suspend" : "activate";

  return (
    <main
      dir={dir}
      className="min-h-screen w-full bg-transparent px-3 py-5 text-foreground sm:px-4 lg:px-5"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-5xl">
            <Badge
              variant="outline"
              className="mb-2 gap-2 rounded-full border-[#cbbda9]/55 bg-white/55 px-3 py-1 text-[#8f6a37] shadow-sm dark:bg-white/[0.04]"
            >
              <BriefcaseMedical className="h-3.5 w-3.5 text-[#a57b3d]" />
              {l("ملف الممارس", "Practitioner file")}
            </Badge>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {practitionerName || txt(practitioner.practitioner_number, "—")}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${statusClass(practitionerStatus)}`}
              >
                {localStatus(practitionerStatus, locale)}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {txt(practitioner.professional_title) ||
                localStatus(practitioner.practitioner_type, locale)}
              {txt(practitioner.practitioner_number)
                ? ` — ${txt(practitioner.practitioner_number)}`
                : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline" className={registerOutlineButtonClass}>
              <Link href="/system/practitioners">
                {ar ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {l("العودة", "Back")}
              </Link>
            </Button>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={refreshing}
              onClick={() => void load(true)}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {l("تحديث", "Refresh")}
            </Button>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void printFile()}
            >
              <Printer className="h-4 w-4" />
              {l("طباعة الملف", "Print file")}
            </Button>
            <Button
              variant={nextAction === "suspend" ? "outline" : "brand"}
              className={
                nextAction === "suspend"
                  ? `${registerOutlineButtonClass} text-rose-700 hover:text-rose-700`
                  : registerBrandButtonClass
              }
              onClick={() => setConfirmOpen(true)}
            >
              {nextAction === "suspend" ? (
                <CircleSlash2 className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {nextAction === "suspend"
                ? l("إيقاف الممارس", "Suspend practitioner")
                : l("تفعيل الممارس", "Activate practitioner")}
            </Button>
          </div>
        </header>

        {bundle.partial ? (
          <Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
            <CardContent className="flex gap-3 p-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {l("تم تحميل الملف مع نقص جزئي", "File loaded with partial data")}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {l(
                    "تعذر تحميل بعض السجلات المرتبطة، بينما بقيت البيانات المتاحة معروضة.",
                    "Some related registers could not be loaded; available data remains visible.",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={l("التخصصات", "Specialties")}
            value={bundle.specialties.length || num(practitioner.specialties_count)}
            description={l("التخصصات المرتبطة بالممارس", "Linked practitioner specialties")}
            icon={Stethoscope}
            href={`/system/practitioners/assignments?practitioner=${encodeURIComponent(
              practitionerId,
            )}`}
          />
          <SystemKpiCard
            title={l("التعيينات", "Assignments")}
            value={bundle.assignments.length || num(practitioner.assignments_count)}
            description={l("تعيينات الفروع والأقسام والعيادات", "Branch, department, and clinic assignments")}
            icon={Building2}
            href={`/system/practitioners/assignments?practitioner=${encodeURIComponent(
              practitionerId,
            )}`}
          />
          <SystemKpiCard
            title={l("التراخيص", "Licenses")}
            value={bundle.licenses.length || num(practitioner.licenses_count)}
            description={l("التراخيص المهنية المسجلة", "Registered professional licenses")}
            icon={FileCheck2}
            href={`/system/practitioners/licenses?practitioner=${encodeURIComponent(
              practitionerId,
            )}`}
          />
          <SystemKpiCard
            title={l("الجداول النشطة", "Active schedules")}
            value={activeSchedules}
            description={`${activeServices} ${l("خدمات مسندة", "assigned services")}`}
            icon={CalendarClock}
            href={`/system/practitioners/schedules?practitioner=${encodeURIComponent(
              practitionerId,
            )}`}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Card className="rounded-lg bg-card shadow-none xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {l("البيانات الأساسية", "Core information")}
              </CardTitle>
              <CardDescription className="mt-1 leading-6">
                {l(
                  "الهوية المهنية وبيانات التواصل والحالة التشغيلية.",
                  "Professional identity, contact details, and operational status.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Info label={l("رقم الممارس", "Practitioner number")} value={txt(practitioner.practitioner_number)} dir="ltr" />
              <Info label={l("الاسم بالعربية", "Arabic name")} value={txt(practitioner.full_name_ar)} />
              <Info label={l("الاسم بالإنجليزية", "English name")} value={txt(practitioner.full_name_en)} dir="ltr" />
              <Info label={l("المسمى المهني", "Professional title")} value={txt(practitioner.professional_title)} />
              <Info label={l("نوع الممارس", "Practitioner type")} value={localStatus(practitioner.practitioner_type, locale)} />
              <Info label={l("الجنس", "Gender")} value={localStatus(practitioner.gender, locale)} />
              <Info label={l("الجنسية", "Nationality")} value={txt(practitioner.nationality)} />
              <Info label={l("الجوال", "Mobile")} value={txt(practitioner.mobile)} dir="ltr" />
              <Info label={l("البريد الإلكتروني", "Email")} value={txt(practitioner.email)} dir="ltr" />
              <Info label={l("تاريخ الانضمام", "Hire date")} value={dateOnly(practitioner.hire_date)} dir="ltr" />
              <Info label={l("الحالة", "Status")} value={localStatus(practitioner.status, locale)} />
              <Info
                label={l("قبول المواعيد", "Appointment acceptance")}
                value={
                  yes(practitioner.is_accepting_appointments)
                    ? l("يقبل المواعيد", "Accepting appointments")
                    : l("لا يقبل المواعيد", "Not accepting appointments")
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-card shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                {l("الارتباط التشغيلي", "Operational relationship")}
              </CardTitle>
              <CardDescription className="mt-1 leading-6">
                {l(
                  "الموقع الافتراضي والربط الوظيفي وبيانات التدقيق.",
                  "Default location, employment links, and audit details.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Info label={l("التخصص الأساسي", "Primary specialty")} value={objectName(practitioner.primary_specialty)} />
              <Info label={l("الفرع الافتراضي", "Default branch")} value={objectName(practitioner.default_branch)} />
              <Info label={l("القسم الافتراضي", "Default department")} value={objectName(practitioner.default_department)} />
              <Info label={l("العيادة الافتراضية", "Default clinic")} value={objectName(practitioner.default_clinic)} />
              <Info label={l("عضوية النظام", "System membership")} value={objectName(practitioner.membership)} />
              <Info label={l("سجل الموظف", "Employee record")} value={objectName(practitioner.employee)} />
              <Info label={l("تاريخ الإنشاء", "Created at")} value={dateTime(practitioner.created_at)} dir="ltr" />
              <Info label={l("آخر تحديث", "Last updated")} value={dateTime(practitioner.updated_at)} dir="ltr" />
            </CardContent>
          </Card>
        </section>

        <RegisterSection
          title={l("التخصصات", "Specialties")}
          description={l("التخصصات والخبرة والصلاحية والحالة.", "Specialties, experience, validity, and status.")}
          headers={[
            l("التخصص", "Specialty"),
            l("الخبرة", "Experience"),
            l("الصلاحية", "Validity"),
            l("النوع", "Type"),
            l("الحالة", "Status"),
          ]}
          rows={specialties}
          empty={l("لا توجد تخصصات مرتبطة بهذا الممارس.", "No specialties are linked to this practitioner.")}
        />

        <RegisterSection
          title={l("التعيينات", "Assignments")}
          description={l("ربط الممارس بالفروع والأقسام والعيادات.", "Practitioner links to branches, departments, and clinics.")}
          headers={[
            l("الفرع", "Branch"),
            l("القسم", "Department"),
            l("العيادة", "Clinic"),
            l("الفترة", "Period"),
            l("النوع", "Type"),
            l("الحالة", "Status"),
          ]}
          rows={assignments}
          empty={l("لا توجد تعيينات تشغيلية مرتبطة بهذا الممارس.", "No operational assignments are linked to this practitioner.")}
          minWidth="1050px"
        />

        <RegisterSection
          title={l("التراخيص", "Licenses")}
          description={l("التراخيص المهنية وتواريخ الإصدار والانتهاء.", "Professional licenses and issue/expiry dates.")}
          headers={[
            l("الترخيص", "License"),
            l("النوع", "Type"),
            l("الجهة المصدرة", "Issuing authority"),
            l("التخصص", "Specialty"),
            l("الإصدار", "Issued"),
            l("الانتهاء", "Expires"),
            l("الحالة", "Status"),
          ]}
          rows={licenses}
          empty={l("لا توجد تراخيص مرتبطة بهذا الممارس.", "No licenses are linked to this practitioner.")}
          minWidth="1100px"
        />

        <RegisterSection
          title={l("الجداول وفترات الاستراحة", "Schedules and breaks")}
          description={l("الجداول الأسبوعية وفترات الاستراحة والحالة.", "Weekly schedules, breaks, and status.")}
          headers={[
            l("اليوم", "Day"),
            l("ساعات العمل", "Working hours"),
            l("مدة الموعد", "Slot"),
            l("الاستراحات", "Breaks"),
            l("الحالة", "Status"),
          ]}
          rows={schedules}
          empty={l("لا توجد جداول أسبوعية مرتبطة بهذا الممارس.", "No weekly schedules are linked to this practitioner.")}
          minWidth="980px"
        />

        <section className="grid gap-5 xl:grid-cols-2">
          <RegisterSection
            title={l("الإجازات وعدم التوفر", "Time off and unavailability")}
            description={l("الفترات المسجلة وحالتها التشغيلية.", "Registered periods and operational states.")}
            headers={[
              l("البداية", "Start"),
              l("النهاية", "End"),
              l("السبب", "Reason"),
              l("الحالة", "Status"),
            ]}
            rows={timeOffs}
            empty={l("لا توجد إجازات أو فترات عدم توفر مسجلة.", "No time-off periods are registered.")}
            minWidth="760px"
          />

          <RegisterSection
            title={l("الخدمات المسندة", "Assigned services")}
            description={l("الخدمات الطبية وخصائص المدة والحجز.", "Medical services, duration, and booking settings.")}
            headers={[
              l("الخدمة", "Service"),
              l("الفرع", "Branch"),
              l("المدة", "Duration"),
              l("الحجز الإلكتروني", "Online booking"),
              l("الحالة", "Status"),
            ]}
            rows={services}
            empty={l("لا توجد خدمات طبية مسندة لهذا الممارس.", "No medical services are assigned to this practitioner.")}
            minWidth="850px"
          />
        </section>

        <Card className="rounded-lg bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {l("الملاحظات", "Notes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {txt(practitioner.notes, "—")}
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextAction === "suspend"
                ? l("إيقاف الممارس", "Suspend practitioner")
                : l("تفعيل الممارس", "Activate practitioner")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextAction === "suspend"
                ? l(
                    "سيتم إيقاف الممارس وتعطيل قبوله للمواعيد حتى إعادة تفعيله.",
                    "The practitioner will be suspended and appointment acceptance disabled until reactivation.",
                  )
                : l(
                    "سيصبح ملف الممارس نشطًا وفق إعداداته الحالية.",
                    "The practitioner record will become active under its current settings.",
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              {l("إلغاء", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className={
                nextAction === "suspend"
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : ""
              }
              onClick={(event) => {
                event.preventDefault();
                void changeStatus();
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {l("تأكيد", "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
