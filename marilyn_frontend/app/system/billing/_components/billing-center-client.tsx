"use client";
// billing_financial_center_hr_spirit=true
// billing_shared_financial_tabs=true

import * as React from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { FinancialCenterTabs } from "@/components/system/financial-center-tabs";
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
type RecordValue = Record<string, unknown>;
type Row = {
  id: string;
  number: string;
  customer: string;
  phone: string;
  branch: string;
  date: string;
  due: string;
  status: string;
  payment: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  source: string;
  reference: string;
  notes: string;
};
type Summary = {
  total: number;
  issued: number;
  outstanding: number;
  overdue: number;
};
type SortKey = "newest" | "oldest" | "high" | "low";

const API = {
  list: "/api/company/sales/invoices/?page_size=100&ordering=-invoice_date",
  summary: "/api/company/sales/invoices/summary/",
};

const TEXT = {
  ar: {
    badge: "الإدارة المركزية",
    title: "مركز الفوترة",
    description:
      "متابعة فواتير المرضى وقيم الخدمات وحالة الإصدار والسداد والاستحقاق من السجلات المالية الحقيقية.",
    tabs: ["فواتير المرضى", "مدفوعات المرضى", "الخزينة", "الحسابات"],
    refresh: "تحديث",
    excel: "Excel",
    print: "طباعة",
    kpis: ["إجمالي الفواتير", "الفواتير الصادرة", "غير المسدد", "الفواتير المتأخرة"],
    kpiDescriptions: [
      "جميع الفواتير المسجلة داخل المنشأة",
      "الفواتير التي تم إصدارها واعتمادها",
      "الفواتير غير المسددة أو المسددة جزئيًا",
      "الفواتير التي تجاوزت تاريخ الاستحقاق",
    ],
    register: "سجل فواتير المرضى",
    registerDescription:
      "سجل موحد للفواتير والمريض أو العميل والفرع والقيم المالية وحالة السداد والاستحقاق.",
    search: "ابحث برقم الفاتورة أو المريض أو العميل أو الفرع...",
    allInvoice: "كل حالات الفاتورة",
    allPayment: "كل حالات السداد",
    statuses: { DRAFT: "مسودة", ISSUED: "صادرة", CANCELLED: "ملغاة", CANCELED: "ملغاة" },
    payments: { UNPAID: "غير مسددة", PARTIAL: "مسددة جزئيًا", PAID: "مسددة" },
    sort: ["الأحدث", "الأقدم", "الأعلى قيمة", "الأقل قيمة"],
    from: "من تاريخ",
    to: "إلى تاريخ",
    reset: "إعادة ضبط",
    columns: ["الفاتورة", "المريض أو العميل", "الفرع", "التواريخ", "القيم المالية", "حالة السداد", "حالة الفاتورة", "الإجراءات"],
    invoiceDate: "تاريخ الفاتورة",
    dueDate: "الاستحقاق",
    total: "الإجمالي",
    paid: "المسدد",
    balance: "المتبقي",
    details: "عرض التفاصيل",
    detailsTitle: "تفاصيل الفاتورة",
    detailsDescription: "البيانات المتاحة من سجل الفاتورة دون إضافة بيانات افتراضية.",
    subtotal: "قبل الضريبة",
    discount: "الخصم",
    tax: "الضريبة",
    source: "المصدر",
    reference: "المرجع",
    notes: "الملاحظات",
    noData: "لا توجد فواتير مسجلة حاليًا.",
    noResults: "لا توجد فواتير مطابقة للبحث أو الفلاتر.",
    error: "تعذر تحميل مركز الفوترة",
    retry: "إعادة المحاولة",
    partial: "تعذر تحميل ملخص الفواتير، وتظهر بيانات السجل المتاحة فقط.",
    refreshed: "تم تحديث مركز الفوترة.",
    excelEmpty: "لا توجد فواتير للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد فواتير للطباعة.",
    printReady: "تم تجهيز تقرير الفواتير.",
    printBlocked: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.",
    report: "تقرير فواتير المرضى — Marilyn Clinics",
    count: "عدد النتائج",
    unknown: "غير محدد",
  },
  en: {
    badge: "Central administration",
    title: "Billing Center",
    description:
      "Monitor patient invoices, service values, issuance, payment, and due status from live financial records.",
    tabs: ["Patient billing", "Patient payments", "Treasury", "Accounting"],
    refresh: "Refresh",
    excel: "Excel",
    print: "Print",
    kpis: ["Total invoices", "Issued invoices", "Outstanding", "Overdue invoices"],
    kpiDescriptions: [
      "All invoices registered in the organization",
      "Invoices that have been issued",
      "Unpaid or partially paid invoices",
      "Invoices past their due date",
    ],
    register: "Patient invoices register",
    registerDescription:
      "A unified register of invoices, patients or customers, branches, amounts, payment status, and due dates.",
    search: "Search by invoice, patient, customer, or branch...",
    allInvoice: "All invoice statuses",
    allPayment: "All payment statuses",
    statuses: { DRAFT: "Draft", ISSUED: "Issued", CANCELLED: "Cancelled", CANCELED: "Cancelled" },
    payments: { UNPAID: "Unpaid", PARTIAL: "Partially paid", PAID: "Paid" },
    sort: ["Newest", "Oldest", "Highest amount", "Lowest amount"],
    from: "From date",
    to: "To date",
    reset: "Reset",
    columns: ["Invoice", "Patient or customer", "Branch", "Dates", "Amounts", "Payment status", "Invoice status", "Actions"],
    invoiceDate: "Invoice date",
    dueDate: "Due date",
    total: "Total",
    paid: "Paid",
    balance: "Balance",
    details: "View details",
    detailsTitle: "Invoice details",
    detailsDescription: "Available invoice data without fabricated information.",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    source: "Source",
    reference: "Reference",
    notes: "Notes",
    noData: "No invoices are currently registered.",
    noResults: "No invoices match the current search or filters.",
    error: "Could not load the billing center",
    retry: "Try again",
    partial: "The invoice summary could not be loaded; available records are shown.",
    refreshed: "Billing center refreshed.",
    excelEmpty: "There are no invoices to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There are no invoices to print.",
    printReady: "Invoice report prepared.",
    printBlocked: "The print window could not be opened. Allow pop-ups.",
    report: "Patient Billing Report — Marilyn Clinics",
    count: "Results",
    unknown: "Unknown",
  },
} as const;

function useLocale(): Locale {
  const [locale, setLocale] = React.useState<Locale>("ar");
  React.useEffect(() => {
    const root = document.documentElement;
    const sync = () => setLocale(root.lang.toLowerCase().startsWith("en") ? "en" : "ar");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["lang", "dir"] });
    return () => observer.disconnect();
  }, []);
  return locale;
}
function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";
}
function first(source: RecordValue, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return fallback;
}
function number(source: RecordValue, keys: string[]): number {
  for (const key of keys) {
    const raw = first(source, [key]);
    if (raw) {
      const value = Number(raw.replaceAll(",", ""));
      if (Number.isFinite(value)) return value;
    }
  }
  return 0;
}
function rowsFrom(payload: unknown): RecordValue[] {
  const root = record(payload);
  for (const source of [root, record(root.data)]) {
    for (const key of ["results", "items", "invoices"]) {
      if (Array.isArray(source[key])) {
        return (source[key] as unknown[]).map(record).filter((item) => Object.keys(item).length);
      }
    }
  }
  return [];
}
function normalize(source: RecordValue): Row {
  const customer = record(source.customer);
  const branch = record(source.branch);
  return {
    id: first(source, ["id"]),
    number: first(source, ["invoice_number", "number", "code"], "—"),
    customer: first(source, ["customer_name", "patient_name"], first(customer, ["display_name", "name", "name_ar"], "—")),
    phone: first(source, ["customer_phone", "patient_phone"], first(customer, ["phone", "mobile"])),
    branch: first(source, ["branch_name"], first(branch, ["display_name", "name", "name_ar"], "—")),
    date: first(source, ["invoice_date", "date", "created_at"]).slice(0, 10),
    due: first(source, ["due_date"]).slice(0, 10),
    status: first(source, ["status"], "DRAFT").toUpperCase(),
    payment: first(source, ["payment_status"], "UNPAID").toUpperCase(),
    subtotal: number(source, ["subtotal", "subtotal_amount"]),
    discount: number(source, ["discount_amount", "total_discount"]),
    tax: number(source, ["tax_amount", "total_tax"]),
    total: number(source, ["total_amount", "grand_total", "total"]),
    paid: number(source, ["paid_amount", "amount_paid"]),
    balance: number(source, ["balance_due", "remaining_amount", "outstanding_amount"]),
    source: first(source, ["source", "source_display"]),
    reference: first(source, ["reference", "external_reference"]),
    notes: first(source, ["notes", "description"]),
  };
}
function summaryFromRows(rows: Row[]): Summary {
  const today = new Date().toISOString().slice(0, 10);
  return rows.reduce<Summary>((sum, row) => {
    sum.total += 1;
    if (row.status === "ISSUED") sum.issued += 1;
    if (["UNPAID", "PARTIAL"].includes(row.payment)) sum.outstanding += 1;
    if (
      row.due &&
      row.due < today &&
      ["UNPAID", "PARTIAL"].includes(row.payment) &&
      !["CANCELLED", "CANCELED"].includes(row.status)
    ) sum.overdue += 1;
    return sum;
  }, { total: 0, issued: 0, outstanding: 0, overdue: 0 });
}
function summaryFrom(payload: unknown, fallback: Row[]): Summary {
  const root = record(payload);
  const data = Object.keys(record(root.summary)).length ? record(root.summary) : record(root.data);
  if (!Object.keys(data).length) return summaryFromRows(fallback);
  return {
    total: number(data, ["total_invoices"]),
    issued: number(data, ["issued_invoices"]),
    outstanding: number(data, ["unpaid_invoices"]) + number(data, ["partial_invoices"]),
    overdue: number(data, ["overdue_invoices"]),
  };
}
function getApiBaseUrl(): string {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    ""
  ).trim().replace(/\/+$/, "");
  return value.endsWith("/api")
    ? value.slice(0, -4)
    : value;
}
function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}
async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  });
  const raw = await response.text();
  let payload: unknown = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }
  if (!response.ok) {
    throw new Error(first(record(payload), ["message", "detail"], `HTTP ${response.status}`));
  }
  return payload;
}
function date(value: string): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "—";
}
function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
function escapeHtml(value: unknown): string {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${strong ? "font-semibold text-foreground" : ""}`}>
      <span dir="ltr" lang="en" className="tabular-nums">{money(value)}</span>
      <Image src="/currency/sar.svg" alt="SAR" width={14} height={14} className="size-3.5 opacity-75" />
    </span>
  );
}
function badgeClass(value: string, payment = false): string {
  if (value === "PAID" || value === "ISSUED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "PARTIAL") return "border-sky-200 bg-sky-50 text-sky-700";
  if (!payment && ["CANCELLED", "CANCELED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{children || "—"}</div>
    </div>
  );
}

export default function BillingCenterClient() {
  const locale = useLocale();
  const t = TEXT[locale];
  const [rows, setRows] = React.useState<Row[]>([]);
  const [summary, setSummary] = React.useState<Summary>({ total: 0, issued: 0, outstanding: 0, overdue: 0 });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [partial, setPartial] = React.useState(false);
  const [selected, setSelected] = React.useState<Row | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [payment, setPayment] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");

  const load = React.useCallback(async (refresh = false, signal?: AbortSignal) => {
    const own = signal ? null : new AbortController();
    const activeSignal = signal ?? own?.signal;
    if (!activeSignal) return;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    setPartial(false);
    try {
      const result = await Promise.allSettled([
        getJson(API.list, activeSignal),
        getJson(API.summary, activeSignal),
      ]);
      if (result[0].status === "rejected") throw result[0].reason;
      const nextRows = rowsFrom(result[0].value).map(normalize);
      setRows(nextRows);
      if (result[1].status === "fulfilled") {
        setSummary(summaryFrom(result[1].value, nextRows));
      } else {
        setSummary(summaryFromRows(nextRows));
        setPartial(true);
      }
      if (refresh) toast.success(t.refreshed);
    } catch (reason) {
      setRows([]);
      setError(reason instanceof Error ? reason.message : t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t.error, t.refreshed]);

  React.useEffect(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (query && ![row.number, row.customer, row.phone, row.branch, row.reference].join(" ").toLowerCase().includes(query)) return false;
        if (status !== "all" && row.status !== status) return false;
        if (payment !== "all" && row.payment !== payment) return false;
        if (from && row.date && row.date < from) return false;
        if (to && row.date && row.date > to) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.date.localeCompare(b.date);
        if (sort === "high") return b.total - a.total;
        if (sort === "low") return a.total - b.total;
        return b.date.localeCompare(a.date);
      });
  }, [from, payment, rows, search, sort, status, to]);

  const hasFilters = Boolean(search || from || to) || status !== "all" || payment !== "all" || sort !== "newest";
  const reset = () => {
    setSearch("");
    setStatus("all");
    setPayment("all");
    setFrom("");
    setTo("");
    setSort("newest");
  };
  const statusLabel = (value: string) =>
    (t.statuses as Record<string, string>)[value] || value || t.unknown;
  const paymentLabel = (value: string) =>
    (t.payments as Record<string, string>)[value] || value || t.unknown;

  const tableHtml = () => `
    <table>
      <thead><tr>${[...t.columns.slice(0, 3), t.invoiceDate, t.dueDate, t.total, t.paid, t.balance, t.columns[5], t.columns[6]]
        .map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
      <tbody>${filtered.map((row) => `<tr>
        <td>${escapeHtml(row.number)}</td><td>${escapeHtml(row.customer)}</td><td>${escapeHtml(row.branch)}</td>
        <td dir="ltr">${escapeHtml(row.date)}</td><td dir="ltr">${escapeHtml(row.due)}</td>
        <td dir="ltr">${money(row.total)}</td><td dir="ltr">${money(row.paid)}</td><td dir="ltr">${money(row.balance)}</td>
        <td>${escapeHtml(paymentLabel(row.payment))}</td><td>${escapeHtml(statusLabel(row.status))}</td>
      </tr>`).join("")}</tbody>
    </table>`;

  const excel = () => {
    if (!filtered.length) return toast.error(t.excelEmpty);
    const html = `<!doctype html><html dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="UTF-8"></head><body>${tableHtml()}</body></html>`;
    const url = URL.createObjectURL(new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-billing-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t.excelReady);
  };
  const print = async () => {
    if (!filtered.length) return toast.error(t.printEmpty);
    const opened = await openPrintReport({
      locale,
      title: t.report,
      subtitle: t.registerDescription,
      recordsCount: filtered.length,
      tableHtml: tableHtml(),
    });
    if (opened) {
      toast.success(t.printReady);
    } else {
      toast.error(t.printBlocked);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[126px] rounded-lg" />)}
        </div>
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    );
  }
  if (error) {
    return (
      <Card className="rounded-lg border-rose-200 shadow-none">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
          <TriangleAlert className="h-8 w-8 text-rose-600" />
          <div><h2 className="font-semibold">{t.error}</h2><p className="mt-1 text-sm text-muted-foreground">{error}</p></div>
          <Button variant="brand" className={registerBrandButtonClass} onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />{t.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const kpiValues = [summary.total, summary.issued, summary.outstanding, summary.overdue];
  const kpiIcons = [ReceiptText, CheckCircle2, Clock3, TriangleAlert];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-5xl text-start">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
            <ReceiptText className="h-3.5 w-3.5 text-[#a57b3d]" />
            {t.badge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
            {t.description}
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {locale === "ar"
              ? "متصل بواجهات الفواتير والمدفوعات والخزينة والحسابات الحقيقية"
              : "Connected to live billing, payments, treasury, and accounting APIs"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            {t.refresh}
          </Button>
          <Button
            variant="outline"
            className={registerOutlineButtonClass}
            onClick={excel}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t.excel}
          </Button>
          <Button
            variant="brand"
            className={registerBrandButtonClass}
            onClick={() => void print()}
          >
            <Printer className="h-4 w-4" />
            {t.print}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiValues.map((value, index) => (
          <SystemKpiCard
            key={t.kpis[index]}
            title={t.kpis[index]}
            value={value}
            description={t.kpiDescriptions[index]}
            icon={kpiIcons[index]}
          />
        ))}
      </div>

      <FinancialCenterTabs
        active="billing"
        locale={locale}
        counts={{
          billing: summary.total,
        }}
      />

      {partial ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />{t.partial}
        </div>
      ) : null}

      <Card className="gap-0 overflow-hidden rounded-lg shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
              <ReceiptText className="h-4 w-4 text-[#a57b3d]" />
              {t.register}
            </CardTitle>
            <CardDescription className="mt-1 leading-6">{t.registerDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className={registerOutlineButtonClass} onClick={excel}>
              <FileSpreadsheet className="h-4 w-4" />{t.excel}
            </Button>
            <Button variant="brand" className={registerBrandButtonClass} onClick={() => void print()}>
              <Printer className="h-4 w-4" />{t.print}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          <DataRegisterToolbar className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <DataRegisterSearch value={search} onChange={setSearch} placeholder={t.search} className="min-w-0 flex-1" />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-[160px] bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allInvoice}</SelectItem>
                  {["DRAFT", "ISSUED", "CANCELLED"].map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="h-9 w-[170px] bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allPayment}</SelectItem>
                  {["UNPAID", "PARTIAL", "PAID"].map((value) => <SelectItem key={value} value={value}>{paymentLabel(value)}</SelectItem>)}
                </SelectContent>
              </Select>
              <DataRegisterDatePicker label={t.from} value={from} onChange={setFrom} locale={locale} />
              <DataRegisterDatePicker label={t.to} value={to} onChange={setTo} locale={locale} />
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger className="h-9 w-[145px] bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["newest", "oldest", "high", "low"].map((value, index) => <SelectItem key={value} value={value}>{t.sort[index]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" className={registerOutlineButtonClass} disabled={!hasFilters} onClick={reset}>
                <RotateCcw className="h-4 w-4" />{t.reset}
              </Button>
            </div>
          </DataRegisterToolbar>

          <div className="overflow-hidden rounded-lg border">
            <Table variant="register">
              <TableHeader><TableRow>
                {t.columns.map((column, index) => <TableHead key={column} className={index === 7 ? "w-[74px] text-center" : ""}>{column}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length ? filtered.map((row) => (
                  <TableRow key={row.id || row.number} interactive role="button" tabIndex={0} onClick={() => setSelected(row)}>
                    <TableCell><div className="font-semibold">{row.number}</div><div className="mt-1 text-xs text-muted-foreground">{row.reference || row.source || "—"}</div></TableCell>
                    <TableCell><div className="font-medium">{row.customer}</div><div dir="ltr" className="mt-1 text-start text-xs text-muted-foreground">{row.phone || "—"}</div></TableCell>
                    <TableCell>{row.branch}</TableCell>
                    <TableCell className="text-xs">
                      <div>{t.invoiceDate}: <span dir="ltr">{date(row.date)}</span></div>
                      <div className="mt-1">{t.dueDate}: <span dir="ltr">{date(row.due)}</span></div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.total}</span><Money value={row.total} strong /></div>
                      <div className="mt-1 flex justify-between gap-3"><span className="text-muted-foreground">{t.balance}</span><Money value={row.balance} /></div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={badgeClass(row.payment, true)}>{paymentLabel(row.payment)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={badgeClass(row.status)}>{statusLabel(row.status)}</Badge></TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t.columns[7]} onClick={(event) => event.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(row)}><Eye className="h-4 w-4 text-[#a57b3d]" />{t.details}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="p-0">
                    <DataRegisterEmptyState
                      title={rows.length ? t.noResults : t.noData}
                      description={t.registerDescription}
                      showReset={rows.length > 0 && hasFilters}
                      onReset={reset}
                      resetLabel={t.reset}
                      icon={ReceiptText}
                    />
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.count}: <strong dir="ltr" className="text-foreground tabular-nums">{filtered.length}</strong></span>
            <span>{t.total}: <Money value={filtered.reduce((sum, row) => sum + row.total, 0)} strong /></span>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.detailsTitle}{selected ? ` — ${selected.number}` : ""}</DialogTitle>
            <DialogDescription>{t.detailsDescription}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label={t.columns[1]}>{selected.customer}</Detail>
              <Detail label={t.columns[2]}>{selected.branch}</Detail>
              <Detail label={t.invoiceDate}>{date(selected.date)}</Detail>
              <Detail label={t.dueDate}>{date(selected.due)}</Detail>
              <Detail label={t.columns[6]}>{statusLabel(selected.status)}</Detail>
              <Detail label={t.columns[5]}>{paymentLabel(selected.payment)}</Detail>
              <Detail label={t.subtotal}><Money value={selected.subtotal} /></Detail>
              <Detail label={t.discount}><Money value={selected.discount} /></Detail>
              <Detail label={t.tax}><Money value={selected.tax} /></Detail>
              <Detail label={t.total}><Money value={selected.total} strong /></Detail>
              <Detail label={t.paid}><Money value={selected.paid} /></Detail>
              <Detail label={t.balance}><Money value={selected.balance} /></Detail>
              <Detail label={t.source}>{selected.source || "—"}</Detail>
              <Detail label={t.reference}>{selected.reference || "—"}</Detail>
              <div className="sm:col-span-2 lg:col-span-3"><Detail label={t.notes}>{selected.notes || "—"}</Detail></div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
