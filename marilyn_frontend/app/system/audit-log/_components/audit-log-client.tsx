"use client";

import * as React from "react";
import { AccessManagementTabs } from "@/components/system/access-management-tabs";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  Building2,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Fingerprint,
  History,
  Info,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
  type LucideIcon,
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
  DataRegisterDatePicker,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { openPrintReport } from "@/lib/print-report";
import { cn } from "@/lib/utils";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type SeverityFilter = "all" | "info" | "warning" | "critical";
type SortKey = "newest" | "oldest" | "severity" | "actor";

type AuditEvent = {
  id: string;
  numericId: number;
  companyName: string;
  companyCode: string;
  actorName: string;
  actorEmail: string;
  actorUsername: string;
  eventType: string;
  severity: Exclude<SeverityFilter, "all">;
  sourceApp: string;
  sourceModel: string;
  objectId: string;
  objectReference: string;
  action: string;
  message: string;
  metadata: ApiRecord;
  requestId: string;
  idempotencyKey: string;
  ipAddress: string;
  createdAt: string;
};

type AuditSummary = {
  total: number;
  warning: number;
  critical: number;
  companies: number;
};

type ChoiceItem = {
  value: string;
  count: number;
};

const API_ENDPOINTS = {
  audit: "/api/system/business-controls/audit-events/",
  overview: "/api/system/business-controls/",
  companyAudit: "/api/company/business-controls/audit-events/",
} as const;

const translations = {
  ar: {
    badge: "الإدارة المركزية",
    title: "سجل التدقيق",
    subtitle:
      "مراجعة أحداث النظام والتغييرات التشغيلية والمستخدمين والمصادر من سجل التدقيق الحقيقي.",
    connected: "متصل بسجل التدقيق",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث",
    excel: "Excel",
    print: "طباعة",
    totalEvents: "إجمالي الأحداث",
    totalEventsDesc: "جميع أحداث التدقيق المسجلة",
    warnings: "التنبيهات",
    warningsDesc: "أحداث تتطلب المراجعة",
    critical: "الأحداث الحرجة",
    criticalDesc: "أحداث ذات أولوية عالية",
    companies: "النطاقات المسجلة",
    companiesDesc: "المنشآت المرتبطة بأحداث التدقيق",
    all: "جميع الأحداث",
    info: "معلومات",
    warning: "تنبيه",
    criticalTab: "حرج",
    registerTitle: "أحداث سجل التدقيق",
    registerDesc:
      "سجل زمني للعمليات والمستخدمين والمصادر والمراجع المسجلة في النظام.",
    search:
      "بحث في الحدث أو المستخدم أو المصدر أو المرجع أو رقم الطلب...",
    allTypes: "جميع أنواع الأحداث",
    allSources: "جميع المصادر",
    allSeverities: "جميع الحالات",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    newest: "الأحدث",
    oldest: "الأقدم",
    severitySort: "حسب الخطورة",
    actorSort: "حسب المستخدم",
    reset: "إعادة ضبط",
    event: "الحدث",
    severity: "الخطورة",
    source: "المصدر",
    actor: "المستخدم",
    reference: "المرجع",
    date: "التاريخ",
    details: "التفاصيل",
    noData: "لا توجد أحداث تدقيق",
    noDataDesc: "لم يسجل النظام أحداث تدقيق حتى الآن.",
    noResults: "لا توجد نتائج مطابقة",
    noResultsDesc: "غيّر البحث أو الفلاتر لعرض نتائج أخرى.",
    showing: "عرض",
    of: "من",
    rows: "سجل",
    unknownActor: "النظام",
    unknownSource: "مصدر غير محدد",
    unknownEvent: "حدث نظام",
    unknownReference: "بدون مرجع",
    detailsTitle: "تفاصيل حدث التدقيق",
    detailsDesc:
      "بيانات الحدث والمستخدم والمصدر والمرجع والبيانات الوصفية المسجلة.",
    eventType: "نوع الحدث",
    action: "الإجراء",
    company: "المنشأة",
    sourceApp: "تطبيق المصدر",
    sourceModel: "نموذج المصدر",
    objectId: "معرّف السجل",
    objectReference: "مرجع السجل",
    message: "الرسالة",
    requestId: "معرّف الطلب",
    idempotencyKey: "مفتاح منع التكرار",
    ipAddress: "عنوان IP",
    metadata: "البيانات الوصفية",
    close: "إغلاق",
    loaded: "تم تحديث سجل التدقيق.",
    exportReady: "تم تجهيز ملف Excel.",
    popupBlocked: "تعذر فتح نافذة الطباعة.",
    loadError: "تعذر تحميل سجل التدقيق.",
    partialSource:
      "تم استخدام مصدر التدقيق البديل المتاح في النظام.",
    systemAudit: "سجل النظام المركزي",
    companyAudit: "سجل المنشأة",
    overviewAudit: "ملخص ضوابط الأعمال",
  },
  en: {
    badge: "Central administration",
    title: "Audit Log",
    subtitle:
      "Review system events, operational changes, users, and sources from the live audit trail.",
    connected: "Connected to audit log",
    refresh: "Refresh",
    refreshing: "Refreshing",
    excel: "Excel",
    print: "Print",
    totalEvents: "Total events",
    totalEventsDesc: "All recorded audit events",
    warnings: "Warnings",
    warningsDesc: "Events requiring review",
    critical: "Critical events",
    criticalDesc: "High-priority audit events",
    companies: "Recorded scopes",
    companiesDesc: "Organizations linked to audit events",
    all: "All events",
    info: "Information",
    warning: "Warning",
    criticalTab: "Critical",
    registerTitle: "Audit log events",
    registerDesc:
      "Chronological record of operations, users, sources, and references captured by the system.",
    search:
      "Search event, user, source, reference, or request ID...",
    allTypes: "All event types",
    allSources: "All sources",
    allSeverities: "All severities",
    fromDate: "From date",
    toDate: "To date",
    newest: "Newest",
    oldest: "Oldest",
    severitySort: "By severity",
    actorSort: "By user",
    reset: "Reset",
    event: "Event",
    severity: "Severity",
    source: "Source",
    actor: "User",
    reference: "Reference",
    date: "Date",
    details: "Details",
    noData: "No audit events",
    noDataDesc: "The system has not recorded audit events yet.",
    noResults: "No matching results",
    noResultsDesc: "Change the search or filters to see other results.",
    showing: "Showing",
    of: "of",
    rows: "records",
    unknownActor: "System",
    unknownSource: "Unknown source",
    unknownEvent: "System event",
    unknownReference: "No reference",
    detailsTitle: "Audit event details",
    detailsDesc:
      "Recorded event, actor, source, reference, and metadata.",
    eventType: "Event type",
    action: "Action",
    company: "Organization",
    sourceApp: "Source application",
    sourceModel: "Source model",
    objectId: "Object ID",
    objectReference: "Object reference",
    message: "Message",
    requestId: "Request ID",
    idempotencyKey: "Idempotency key",
    ipAddress: "IP address",
    metadata: "Metadata",
    close: "Close",
    loaded: "Audit log refreshed.",
    exportReady: "Excel file prepared.",
    popupBlocked: "Could not open the print window.",
    loadError: "Could not load the audit log.",
    partialSource:
      "The available fallback audit source was used.",
    systemAudit: "Central system audit",
    companyAudit: "Organization audit",
    overviewAudit: "Business controls overview",
  },
} as const;

const sourceLabels: Record<string, { ar: string; en: string }> = {
  medical: { ar: "العمليات الطبية", en: "Medical operations" },
  appointments: { ar: "المواعيد", en: "Appointments" },
  patients: { ar: "المرضى", en: "Patients" },
  practitioners: { ar: "الممارسون", en: "Practitioners" },
  hr: { ar: "الموارد البشرية", en: "Human resources" },
  treasury: { ar: "الخزينة", en: "Treasury" },
  accounting: { ar: "الحسابات العامة", en: "General accounting" },
  sales: { ar: "الفوترة والتحصيل", en: "Billing and collection" },
  auth: { ar: "المصادقة والدخول", en: "Authentication" },
  accounts: { ar: "المستخدمون والصلاحيات", en: "Users and permissions" },
  business_controls: { ar: "ضوابط الأعمال", en: "Business controls" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  documents: { ar: "المستندات", en: "Documents" },
};

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function textValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem("primey-locale") === "en"
    ? "en"
    : "ar";
}

function getApiBaseUrl(): string {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).replace(/\/+$/, "");

  return value.endsWith("/api") ? value.slice(0, -4) : value;
}

function makeApiUrl(path: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `${getApiBaseUrl()}${path}${query ? `?${query}` : ""}`;
}

async function fetchJson(
  path: string,
  params?: URLSearchParams,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(makeApiUrl(path, params), {
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

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  let payload: unknown = {};

  if (raw && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(
      textValue(record.message) ||
        textValue(record.detail) ||
        textValue(record.error) ||
        `HTTP ${response.status}`,
    );
  }

  return payload;
}

function extractResults(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  const data = asRecord(record.data);

  const candidates = [
    record.results,
    record.items,
    data.results,
    data.items,
    data.latest_audit_events,
    record.latest_audit_events,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function extractSummary(payload: unknown): ApiRecord {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  return {
    ...asRecord(record.summary),
    ...asRecord(data.summary),
  };
}

function extractChoices(payload: unknown): ApiRecord {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  return {
    ...asRecord(record.choices),
    ...asRecord(data.choices),
  };
}

function normalizeSeverity(
  value: unknown,
): Exclude<SeverityFilter, "all"> {
  const normalized = textValue(value, "info").toLowerCase();

  if (["critical", "fatal", "high", "danger"].includes(normalized)) {
    return "critical";
  }

  if (["warning", "warn", "medium"].includes(normalized)) {
    return "warning";
  }

  return "info";
}

function normalizeAuditEvent(
  value: unknown,
  index: number,
): AuditEvent {
  const item = asRecord(value);
  const company = asRecord(item.company);
  const actor = asRecord(item.actor);

  return {
    id: textValue(item.id, String(index + 1)),
    numericId: numberValue(item.id, index + 1),
    companyName:
      textValue(company.display_name) ||
      textValue(company.name) ||
      textValue(item.company_name),
    companyCode:
      textValue(company.company_code) ||
      textValue(company.code) ||
      textValue(item.company_code),
    actorName:
      textValue(actor.name) ||
      textValue(actor.full_name) ||
      textValue(item.actor_name),
    actorEmail:
      textValue(actor.email) ||
      textValue(item.actor_email),
    actorUsername:
      textValue(actor.username) ||
      textValue(item.actor_username),
    eventType:
      textValue(item.event_type) ||
      textValue(item.type) ||
      textValue(item.action),
    severity: normalizeSeverity(item.severity),
    sourceApp:
      textValue(item.source_app) ||
      textValue(item.app) ||
      textValue(item.module),
    sourceModel:
      textValue(item.source_model) ||
      textValue(item.model),
    objectId:
      textValue(item.object_id) ||
      textValue(item.record_id),
    objectReference:
      textValue(item.object_reference) ||
      textValue(item.reference),
    action: textValue(item.action),
    message:
      textValue(item.message) ||
      textValue(item.description),
    metadata: asRecord(item.metadata),
    requestId: textValue(item.request_id),
    idempotencyKey: textValue(item.idempotency_key),
    ipAddress: textValue(item.ip_address),
    createdAt:
      textValue(item.created_at) ||
      textValue(item.timestamp) ||
      textValue(item.date),
  };
}

function choiceArray(value: unknown): ChoiceItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        value: textValue(record.value),
        count: numberValue(record.count),
      };
    })
    .filter((item) => item.value);
}

function dateValue(value: string): number {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatDateTime(value: string, locale: Locale): string {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(parsed);
}

function humanize(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceLabel(value: string, locale: Locale): string {
  const normalized = value.trim().toLowerCase();
  return sourceLabels[normalized]?.[locale] || humanize(value);
}

function severityLabel(
  severity: AuditEvent["severity"],
  locale: Locale,
): string {
  const t = translations[locale];
  if (severity === "critical") return t.criticalTab;
  if (severity === "warning") return t.warning;
  return t.info;
}

function severityClass(severity: AuditEvent["severity"]): string {
  if (severity === "critical") {
    return "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/25 dark:text-red-300";
  }

  if (severity === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-300";
  }

  return "border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/25 dark:text-sky-300";
}

function severityIcon(
  severity: AuditEvent["severity"],
): LucideIcon {
  if (severity === "critical") return ShieldAlert;
  if (severity === "warning") return AlertTriangle;
  return History;
}

function severityRank(severity: AuditEvent["severity"]): number {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function escapeHtml(value: unknown): string {
  return textValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadExcel(
  rows: AuditEvent[],
  locale: Locale,
): void {
  const t = translations[locale];
  const direction = locale === "ar" ? "rtl" : "ltr";

  const body = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(humanize(row.eventType) || t.unknownEvent)}</td>
          <td>${escapeHtml(row.action || "—")}</td>
          <td>${escapeHtml(severityLabel(row.severity, locale))}</td>
          <td>${escapeHtml(sourceLabel(row.sourceApp, locale) || t.unknownSource)}</td>
          <td>${escapeHtml(row.sourceModel || "—")}</td>
          <td>${escapeHtml(row.actorName || row.actorUsername || t.unknownActor)}</td>
          <td>${escapeHtml(row.companyName || "—")}</td>
          <td>${escapeHtml(row.objectReference || row.objectId || "—")}</td>
          <td>${escapeHtml(row.message || "—")}</td>
          <td>${escapeHtml(row.requestId || "—")}</td>
          <td>${escapeHtml(row.ipAddress || "—")}</td>
          <td>${escapeHtml(formatDateTime(row.createdAt, locale))}</td>
        </tr>
      `,
    )
    .join("");

  const html = `<!doctype html>
<html dir="${direction}" lang="${locale}">
<head>
<meta charset="UTF-8" />
<style>
table{border-collapse:collapse;width:100%;font-family:Tahoma,Arial,sans-serif}
th,td{border:1px solid #000;padding:7px;text-align:${locale === "ar" ? "right" : "left"}}
th{background:#e5e7eb;font-weight:700}
</style>
</head>
<body>
<table>
<thead>
<tr>
<th>#</th>
<th>${escapeHtml(t.eventType)}</th>
<th>${escapeHtml(t.action)}</th>
<th>${escapeHtml(t.severity)}</th>
<th>${escapeHtml(t.sourceApp)}</th>
<th>${escapeHtml(t.sourceModel)}</th>
<th>${escapeHtml(t.actor)}</th>
<th>${escapeHtml(t.company)}</th>
<th>${escapeHtml(t.reference)}</th>
<th>${escapeHtml(t.message)}</th>
<th>${escapeHtml(t.requestId)}</th>
<th>${escapeHtml(t.ipAddress)}</th>
<th>${escapeHtml(t.date)}</th>
</tr>
</thead>
<tbody>${body}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marilyn-audit-log-${new Date()
    .toISOString()
    .slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 break-words text-sm font-medium">
        {children || "—"}
      </div>
    </div>
  );
}

export default function AuditLogClient() {
  const [locale, setLocale] = React.useState<Locale>("ar");
  const [rows, setRows] = React.useState<AuditEvent[]>([]);
  const [summary, setSummary] = React.useState<AuditSummary>({
    total: 0,
    warning: 0,
    critical: 0,
    companies: 0,
  });
  const [eventTypeChoices, setEventTypeChoices] = React.useState<
    ChoiceItem[]
  >([]);
  const [sourceChoices, setSourceChoices] = React.useState<ChoiceItem[]>(
    [],
  );
  const [sourceName, setSourceName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [severity, setSeverity] =
    React.useState<SeverityFilter>("all");
  const [eventType, setEventType] = React.useState("all");
  const [sourceApp, setSourceApp] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [selected, setSelected] = React.useState<AuditEvent | null>(
    null,
  );

  const t = translations[locale];

  React.useEffect(() => {
    const syncLocale = () => setLocale(getInitialLocale());
    syncLocale();

    window.addEventListener("storage", syncLocale);
    window.addEventListener(
      "primey-locale-change",
      syncLocale as EventListener,
    );

    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener(
        "primey-locale-change",
        syncLocale as EventListener,
      );
    };
  }, []);

  const load = React.useCallback(
    async (silent = false, signal?: AbortSignal) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const params = new URLSearchParams({
          limit: "250",
          offset: "0",
        });

        const overviewPromise = fetchJson(
          API_ENDPOINTS.overview,
          undefined,
          signal,
        ).catch(() => null);

        const candidates = [
          {
            path: API_ENDPOINTS.audit,
            label: translations[locale].systemAudit,
          },
          {
            path: API_ENDPOINTS.companyAudit,
            label: translations[locale].companyAudit,
          },
          {
            path: API_ENDPOINTS.overview,
            label: translations[locale].overviewAudit,
          },
        ];

        let auditPayload: unknown = null;
        let resolvedSource = "";
        const failures: string[] = [];

        for (const candidate of candidates) {
          try {
            auditPayload = await fetchJson(
              candidate.path,
              candidate.path === API_ENDPOINTS.overview
                ? undefined
                : params,
              signal,
            );
            resolvedSource = candidate.label;
            break;
          } catch (caughtError) {
            failures.push(
              caughtError instanceof Error
                ? caughtError.message
                : String(caughtError),
            );
          }
        }

        if (!auditPayload) {
          throw new Error(failures[0] || translations[locale].loadError);
        }

        const overviewPayload = await overviewPromise;
        const auditRows = extractResults(auditPayload).map(
          normalizeAuditEvent,
        );

        const summaryRecord = {
          ...extractSummary(overviewPayload),
          ...extractSummary(auditPayload),
        };
        const choicesRecord = {
          ...extractChoices(overviewPayload),
          ...extractChoices(auditPayload),
        };

        const warningCount = numberValue(
          summaryRecord.audit_warning_count,
          auditRows.filter((row) => row.severity === "warning").length,
        );
        const criticalCount = numberValue(
          summaryRecord.audit_critical_count,
          auditRows.filter((row) => row.severity === "critical").length,
        );
        const uniqueCompanies = new Set(
          auditRows.map((row) => row.companyName).filter(Boolean),
        ).size;

        setRows(auditRows);
        setSummary({
          total: numberValue(
            summaryRecord.audit_events_count,
            auditRows.length,
          ),
          warning: warningCount,
          critical: criticalCount,
          companies: numberValue(
            summaryRecord.companies_with_audit_events,
            uniqueCompanies,
          ),
        });
        setEventTypeChoices(
          choiceArray(choicesRecord.audit_event_types),
        );
        setSourceChoices(choiceArray(choicesRecord.source_apps));
        setSourceName(resolvedSource);

        if (silent) toast.success(translations[locale].loaded);

        if (
          resolvedSource !== translations[locale].systemAudit &&
          resolvedSource
        ) {
          toast.warning(translations[locale].partialSource);
        }
      } catch (caughtError) {
        if (signal?.aborted) return;

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : translations[locale].loadError;

        setError(message);
        if (silent) toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [locale],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : 0;
    const to = dateTo
      ? new Date(`${dateTo}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;

    const next = rows.filter((row) => {
      if (severity !== "all" && row.severity !== severity) {
        return false;
      }

      if (eventType !== "all" && row.eventType !== eventType) {
        return false;
      }

      if (sourceApp !== "all" && row.sourceApp !== sourceApp) {
        return false;
      }

      const created = dateValue(row.createdAt);
      if (from && created < from) return false;
      if (Number.isFinite(to) && created > to) return false;

      if (!query) return true;

      const haystack = [
        row.id,
        row.eventType,
        row.action,
        row.message,
        row.sourceApp,
        row.sourceModel,
        row.objectId,
        row.objectReference,
        row.actorName,
        row.actorEmail,
        row.actorUsername,
        row.companyName,
        row.companyCode,
        row.requestId,
        row.idempotencyKey,
        row.ipAddress,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...next].sort((a, b) => {
      if (sort === "oldest") {
        return dateValue(a.createdAt) - dateValue(b.createdAt);
      }

      if (sort === "severity") {
        return (
          severityRank(b.severity) - severityRank(a.severity) ||
          dateValue(b.createdAt) - dateValue(a.createdAt)
        );
      }

      if (sort === "actor") {
        return (a.actorName || a.actorUsername).localeCompare(
          b.actorName || b.actorUsername,
          locale === "ar" ? "ar" : "en",
        );
      }

      return dateValue(b.createdAt) - dateValue(a.createdAt);
    });
  }, [
    dateFrom,
    dateTo,
    eventType,
    locale,
    rows,
    search,
    severity,
    sort,
    sourceApp,
  ]);

  const tabs: Array<{
    key: SeverityFilter;
    label: string;
    icon: LucideIcon;
  }> = [
    { key: "all", label: t.all, icon: History },
    { key: "info", label: t.info, icon: Info },
    { key: "warning", label: t.warning, icon: AlertTriangle },
    { key: "critical", label: t.criticalTab, icon: ShieldAlert },
  ];

  const hasFilters =
    search.trim() !== "" ||
    severity !== "all" ||
    eventType !== "all" ||
    sourceApp !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sort !== "newest";

  const reset = React.useCallback(() => {
    setSearch("");
    setSeverity("all");
    setEventType("all");
    setSourceApp("all");
    setDateFrom("");
    setDateTo("");
    setSort("newest");
  }, []);

  const handleExcel = React.useCallback(() => {
    downloadExcel(filteredRows, locale);
    toast.success(t.exportReady);
  }, [filteredRows, locale, t.exportReady]);

  const handlePrint = React.useCallback(async () => {
    const tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>${escapeHtml(t.event)}</th>
            <th>${escapeHtml(t.severity)}</th>
            <th>${escapeHtml(t.source)}</th>
            <th>${escapeHtml(t.actor)}</th>
            <th>${escapeHtml(t.reference)}</th>
            <th>${escapeHtml(t.date)}</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows
            .map(
              (row) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(
                      humanize(row.eventType) || t.unknownEvent,
                    )}</strong><br />
                    <span>${escapeHtml(row.message || row.action || "—")}</span>
                  </td>
                  <td>${escapeHtml(
                    severityLabel(row.severity, locale),
                  )}</td>
                  <td>${escapeHtml(
                    sourceLabel(row.sourceApp, locale) ||
                      t.unknownSource,
                  )}${row.sourceModel ? ` / ${escapeHtml(row.sourceModel)}` : ""}</td>
                  <td>${escapeHtml(
                    row.actorName ||
                      row.actorUsername ||
                      t.unknownActor,
                  )}</td>
                  <td>${escapeHtml(
                    row.objectReference ||
                      row.objectId ||
                      row.companyName ||
                      t.unknownReference,
                  )}</td>
                  <td>${escapeHtml(
                    formatDateTime(row.createdAt, locale),
                  )}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    const opened = await openPrintReport({
      locale,
      title: t.title,
      subtitle: t.subtitle,
      tableHtml,
      recordsCount: filteredRows.length,
    });

    if (!opened) toast.error(t.popupBlocked);
  }, [filteredRows, locale, t]);

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="w-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-9 w-64" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[126px] rounded-lg" />
            ))}
          </div>

          <Skeleton className="h-9 w-[480px] max-w-full" />
          <Skeleton className="h-[520px] rounded-lg" />
        </div>
      </main>
    );
  }

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#a57b3d]">
              <ShieldCheck className="h-4 w-4" />
              {t.badge}
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t.subtitle}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.connected}</span>
              {sourceName ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{sourceName}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
                          type="button"
                          variant="outline"
                          className={registerOutlineButtonClass}
                          onClick={() => void load(true)}
                          disabled={refreshing}
                        >
                          {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {refreshing ? t.refreshing : t.refresh}
                        </Button>

            <Button
                          type="button"
                          variant="outline"
                          className={registerOutlineButtonClass}
                          onClick={handleExcel}
                          disabled={filteredRows.length === 0}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          {t.excel}
                        </Button>

            <Button
                          type="button"
                          variant="brand"
                          className={registerBrandButtonClass}
                          onClick={() => void handlePrint()}
                          disabled={filteredRows.length === 0}
                        >
                          <Printer className="h-4 w-4" />
                          {t.print}
                        </Button>
          </div>
        </header>

        {error ? (
          <Card className="rounded-lg border-red-200 bg-red-50/60 shadow-none dark:border-red-900/60 dark:bg-red-950/15">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">{t.loadError}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {error}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className={registerOutlineButtonClass}
                onClick={() => void load(true)}
              >
                <RefreshCw className="h-4 w-4" />
                {t.refresh}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SystemKpiCard
            title={t.totalEvents}
            value={summary.total}
            description={t.totalEventsDesc}
            icon={History}
          />
          <SystemKpiCard
            title={t.warnings}
            value={summary.warning}
            description={t.warningsDesc}
            icon={AlertTriangle}
          />
          <SystemKpiCard
            title={t.critical}
            value={summary.critical}
            description={t.criticalDesc}
            icon={ShieldAlert}
          />
          <SystemKpiCard
            title={t.companies}
            value={summary.companies}
            description={t.companiesDesc}
            icon={Building2}
          />
        </section>

        <AccessManagementTabs active="audit" counts={{ audit: summary.total }} />

        <nav
          aria-label={t.severity}
          className="flex flex-wrap gap-2"
        >
          {tabs.map((item) => {
            const active = severity === item.key;
            const Icon = item.icon;
            const count =
              item.key === "all"
                ? rows.length
                : rows.filter((row) => row.severity === item.key).length;

            return (
              <Button
                key={item.key}
                type="button"
                variant={active ? "brand" : "outline"}
                className={cn(
                  "h-9 shadow-none",
                  !active && registerOutlineButtonClass,
                )}
                aria-current={active ? "page" : undefined}
                onClick={() => setSeverity(item.key)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                  {formatInteger(count)}
                </span>
              </Button>
            );
          })}
        </nav>

        <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-[#a57b3d]" />
                  {t.registerTitle}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  {t.registerDesc}
                </CardDescription>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                                  type="button"
                                  variant="outline"
                                  className={registerOutlineButtonClass}
                                  onClick={handleExcel}
                                  disabled={filteredRows.length === 0}
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                  {t.excel}
                                </Button>

                <Button
                                  type="button"
                                  variant="brand"
                                  className={registerBrandButtonClass}
                                  onClick={() => void handlePrint()}
                                  disabled={filteredRows.length === 0}
                                >
                                  <Printer className="h-4 w-4" />
                                  {t.print}
                                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DataRegisterSearch
                value={search}
                onChange={setSearch}
                placeholder={t.search}
                className="min-w-0 flex-1"
              />

              <div className="flex flex-wrap gap-2">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="h-9 w-[190px] bg-background shadow-none">
                    <SelectValue placeholder={t.allTypes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allTypes}</SelectItem>
                    {eventTypeChoices.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {humanize(item.value)} ({formatInteger(item.count)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sourceApp} onValueChange={setSourceApp}>
                  <SelectTrigger className="h-9 w-[180px] bg-background shadow-none">
                    <SelectValue placeholder={t.allSources} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allSources}</SelectItem>
                    {sourceChoices.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {sourceLabel(item.value, locale)} (
                        {formatInteger(item.count)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DataRegisterDatePicker
                  label={t.fromDate}
                  value={dateFrom}
                  onChange={setDateFrom}
                  locale={locale}
                />

                <DataRegisterDatePicker
                  label={t.toDate}
                  value={dateTo}
                  onChange={setDateTo}
                  locale={locale}
                />

                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as SortKey)}
                >
                  <SelectTrigger className="h-9 w-[155px] bg-background shadow-none">
                    <ArrowDownUp className="h-4 w-4 text-[#a57b3d]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t.newest}</SelectItem>
                    <SelectItem value="oldest">{t.oldest}</SelectItem>
                    <SelectItem value="severity">
                      {t.severitySort}
                    </SelectItem>
                    <SelectItem value="actor">{t.actorSort}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  className={registerOutlineButtonClass}
                  onClick={reset}
                  disabled={!hasFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.reset}
                </Button>
              </div>
            </DataRegisterToolbar>

            <div className="overflow-hidden rounded-lg border">
              <Table
                variant="register"
                layout="fixed"
                minWidth={1280}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[360px]">
                      {t.event}
                    </TableHead>
                    <TableHead className="w-[130px]">
                      {t.severity}
                    </TableHead>
                    <TableHead className="w-[210px]">
                      {t.source}
                    </TableHead>
                    <TableHead className="w-[190px]">
                      {t.actor}
                    </TableHead>
                    <TableHead className="w-[230px]">
                      {t.reference}
                    </TableHead>
                    <TableHead className="w-[150px]">
                      {t.date}
                    </TableHead>
                    <TableHead
                      contentAlign="center"
                      className="w-[80px]"
                    >
                      {t.details}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRows.length ? (
                    filteredRows.map((row) => {
                      const EventIcon = severityIcon(row.severity);
                      const actor =
                        row.actorName ||
                        row.actorUsername ||
                        t.unknownActor;
                      const source =
                        sourceLabel(row.sourceApp, locale) ||
                        t.unknownSource;
                      const reference =
                        row.objectReference ||
                        row.objectId ||
                        row.companyName ||
                        t.unknownReference;

                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <button
                              type="button"
                              className="group flex w-full min-w-0 items-center gap-3 rounded-lg text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => setSelected(row)}
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d7bd98]/60 bg-[#a57b3d]/5 text-[#a57b3d] shadow-sm transition-colors group-hover:bg-[#a57b3d]/10">
                                <EventIcon className="h-4 w-4" />
                              </span>

                              <span className="min-w-0">
                                <span className="block truncate font-semibold transition-colors group-hover:text-[#8b642f]">
                                  {humanize(row.eventType) ||
                                    t.unknownEvent}
                                </span>
                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                                  {row.message || row.action || "—"}
                                </span>
                              </span>
                            </button>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={severityClass(row.severity)}
                            >
                              {severityLabel(row.severity, locale)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {source}
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {row.sourceModel || "—"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/20 text-[#a57b3d]">
                                <UserRound className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {actor}
                                </div>
                                <div
                                  dir="ltr"
                                  className="mt-1 truncate text-xs text-muted-foreground"
                                >
                                  {row.actorEmail || "—"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {reference}
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {row.companyName ||
                                  row.companyCode ||
                                  row.requestId ||
                                  "—"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              dir="ltr"
                              lang="en"
                              className="tabular-nums"
                            >
                              {formatDateTime(row.createdAt, locale)}
                            </span>
                          </TableCell>

                          <TableCell contentAlign="center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full border border-[#d7bd98]/60 bg-background text-[#a57b3d] shadow-none hover:bg-[#a57b3d]/10 hover:text-[#8b642f]"
                              aria-label={`${t.details}: ${
                                humanize(row.eventType) ||
                                t.unknownEvent
                              }`}
                              title={t.details}
                              onClick={() => setSelected(row)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <DataRegisterEmptyState
                          title={rows.length ? t.noResults : t.noData}
                          description={
                            rows.length ? t.noResultsDesc : t.noDataDesc
                          }
                          showReset={rows.length > 0 && hasFilters}
                          onReset={reset}
                          resetLabel={t.reset}
                          icon={History}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {t.showing}{" "}
                <strong>{formatInteger(filteredRows.length)}</strong>{" "}
                {t.of} <strong>{formatInteger(rows.length)}</strong>{" "}
                {t.rows}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {t.connected}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.detailsTitle}</DialogTitle>
            <DialogDescription>{t.detailsDesc}</DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label={t.eventType}>
                  {humanize(selected.eventType) || t.unknownEvent}
                </DetailItem>
                <DetailItem label={t.action}>
                  {selected.action || "—"}
                </DetailItem>
                <DetailItem label={t.severity}>
                  <Badge
                    variant="outline"
                    className={severityClass(selected.severity)}
                  >
                    {severityLabel(selected.severity, locale)}
                  </Badge>
                </DetailItem>
                <DetailItem label={t.actor}>
                  {selected.actorName ||
                    selected.actorUsername ||
                    t.unknownActor}
                </DetailItem>
                <DetailItem label={t.company}>
                  {selected.companyName ||
                    selected.companyCode ||
                    "—"}
                </DetailItem>
                <DetailItem label={t.date}>
                  <span dir="ltr" className="tabular-nums">
                    {formatDateTime(selected.createdAt, locale)}
                  </span>
                </DetailItem>
                <DetailItem label={t.sourceApp}>
                  {sourceLabel(selected.sourceApp, locale) ||
                    t.unknownSource}
                </DetailItem>
                <DetailItem label={t.sourceModel}>
                  {selected.sourceModel || "—"}
                </DetailItem>
                <DetailItem label={t.objectId}>
                  {selected.objectId || "—"}
                </DetailItem>
                <DetailItem label={t.objectReference}>
                  {selected.objectReference || "—"}
                </DetailItem>
                <DetailItem label={t.requestId}>
                  <span dir="ltr">
                    {selected.requestId || "—"}
                  </span>
                </DetailItem>
                <DetailItem label={t.idempotencyKey}>
                  <span dir="ltr">
                    {selected.idempotencyKey || "—"}
                  </span>
                </DetailItem>
                <DetailItem label={t.ipAddress}>
                  <span dir="ltr">
                    {selected.ipAddress || "—"}
                  </span>
                </DetailItem>
                <DetailItem
                  label={t.message}
                  className="sm:col-span-2"
                >
                  {selected.message || "—"}
                </DetailItem>
              </div>

              <DetailItem label={t.metadata}>
                <pre
                  dir="ltr"
                  className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md bg-background p-3 text-xs leading-6"
                >
                  {Object.keys(selected.metadata).length
                    ? JSON.stringify(selected.metadata, null, 2)
                    : "—"}
                </pre>
              </DetailItem>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
