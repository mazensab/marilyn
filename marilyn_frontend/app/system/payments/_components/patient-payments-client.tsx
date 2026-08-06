"use client";
// patient_payments_financial_center_hr_spirit=true
// patient_payments_shared_financial_tabs=true

import * as React from "react";
import Image from "next/image";
import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
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
import { FinancialCenterTabs } from "@/components/system/financial-center-tabs";
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
type SortKey = "newest" | "oldest" | "high" | "low";
type PaymentRow = {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  currency: string;
  method: string;
  methodLabel: string;
  status: string;
  statusLabel: string;
  paymentDate: string;
  treasuryAccountId: string;
  treasuryAccountName: string;
  treasuryAccountType: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  invoicePaymentStatus: string;
  reference: string;
  description: string;
  notes: string;
  treasuryTransactionNumber: string;
  treasuryTransactionStatus: string;
  accountingEntryNumber: string;
  accountingEntryStatus: string;
  accountingPosted: boolean;
  confirmedAt: string;
  confirmedByName: string;
  cancelledAt: string;
  cancelledByName: string;
  cancellationReason: string;
  createdAt: string;
};
type Choice = { value: string; label: string };
type TreasuryAccount = {
  id: string;
  name: string;
  code: string;
  type: string;
  currency: string;
  balance: number;
  active: boolean;
};
type InvoiceOption = {
  id: string;
  number: string;
  customer: string;
  balance: number;
  paymentStatus: string;
};
type FormState = {
  customerName: string;
  customerPhone: string;
  amount: string;
  treasuryAccountId: string;
  paymentMethod: string;
  paymentDate: string;
  invoiceId: string;
  reference: string;
  description: string;
  notes: string;
  status: string;
};

const API = {
  payments: "/api/company/treasury/customer-payments/?page_size=100&ordering=-payment_date",
  accounts: "/api/company/treasury/accounts/?page_size=100&is_active=true&ordering=name",
  invoices: "/api/company/sales/invoices/?page_size=100&ordering=-invoice_date",
} as const;


const EMPTY_FORM: FormState = {
  customerName: "",
  customerPhone: "",
  amount: "",
  treasuryAccountId: "",
  paymentMethod: "CASH",
  paymentDate: new Date().toISOString().slice(0, 10),
  invoiceId: "none",
  reference: "",
  description: "",
  notes: "",
  status: "DRAFT",
};

const TEXT = {
  ar: {
    badge: "الإدارة المركزية",
    title: "مدفوعات المرضى",
    description:
      "متابعة المبالغ المحصلة من المرضى والعملاء وربطها بالفواتير والخزينة والترحيل المحاسبي من السجلات الحقيقية.",
    tabs: ["فواتير المرضى", "مدفوعات المرضى", "الخزينة", "الحسابات"],
    refresh: "تحديث",
    create: "تسجيل دفعة",
    excel: "Excel",
    print: "طباعة",
    kpis: ["إجمالي المدفوعات", "المدفوعات المؤكدة", "المسودات", "المدفوعات الملغاة"],
    kpiDescriptions: [
      "جميع دفعات المرضى والعملاء المسجلة",
      "دفعات مؤكدة أثرت في الخزينة",
      "دفعات ما زالت بانتظار التأكيد",
      "دفعات ألغيت مع حفظ الأثر المالي",
    ],
    register: "سجل مدفوعات المرضى",
    registerDescription:
      "سجل موحد للدفعة والمريض أو العميل والمبلغ وطريقة الدفع والحساب والفاتورة وحالة الترحيل.",
    search: "ابحث برقم الدفعة أو المريض أو الهاتف أو الفاتورة أو المرجع...",
    allStatuses: "كل الحالات",
    allMethods: "كل طرق الدفع",
    sort: ["الأحدث", "الأقدم", "الأعلى قيمة", "الأقل قيمة"],
    from: "من تاريخ",
    to: "إلى تاريخ",
    reset: "إعادة ضبط",
    columns: ["الدفعة", "المريض أو العميل", "المبلغ والطريقة", "حساب الخزينة", "الفاتورة", "الترحيل", "التاريخ والحالة", "الإجراءات"],
    amount: "المبلغ",
    method: "طريقة الدفع",
    account: "حساب الخزينة",
    invoice: "الفاتورة",
    paymentDate: "تاريخ الدفع",
    status: "الحالة",
    accounting: "القيد المحاسبي",
    transaction: "حركة الخزينة",
    posted: "مرحلة محاسبيًا",
    notPosted: "غير مرحلة محاسبيًا",
    details: "عرض التفاصيل",
    confirm: "تأكيد الدفعة",
    cancel: "إلغاء الدفعة",
    detailsTitle: "تفاصيل الدفعة",
    detailsDescription: "تفاصيل السجل المالي وروابط الفاتورة والخزينة والقيد المحاسبي.",
    createTitle: "تسجيل دفعة مريض",
    createDescription: "تُسجل الدفعة داخل الشركة الحالية، ويمكن حفظها كمسودة أو تأكيدها مباشرة.",
    customerName: "اسم المريض أو العميل",
    customerPhone: "رقم الجوال",
    selectAccount: "اختر حساب الخزينة",
    noAccounts: "لا توجد حسابات خزينة نشطة",
    selectMethod: "اختر طريقة الدفع",
    linkedInvoice: "الفاتورة المرتبطة",
    noInvoice: "دون فاتورة مرتبطة",
    reference: "المرجع",
    descriptionField: "الوصف",
    notes: "الملاحظات",
    initialStatus: "الحالة عند التسجيل",
    draft: "حفظ كمسودة",
    confirmed: "تأكيد مباشرة",
    save: "حفظ الدفعة",
    saving: "جارٍ الحفظ...",
    confirmTitle: "تأكيد الدفعة",
    confirmDescription: "سيتم تأكيد الدفعة وإنشاء أثر الخزينة والترحيل المحاسبي وفق منطق الخادم.",
    confirmAction: "تأكيد الآن",
    cancelTitle: "إلغاء الدفعة",
    cancelDescription: "يُحفظ سبب الإلغاء، وقد ينشئ الخادم عكسًا محاسبيًا للدفعات المرحلة.",
    cancelReason: "سبب الإلغاء",
    cancelReasonPlaceholder: "اكتب سبب الإلغاء...",
    cancelAction: "إلغاء الدفعة",
    close: "إغلاق",
    noData: "لا توجد مدفوعات مرضى مسجلة حاليًا.",
    noResults: "لا توجد مدفوعات مطابقة للبحث أو الفلاتر.",
    error: "تعذر تحميل مركز المدفوعات",
    retry: "إعادة المحاولة",
    partial: "تعذر تحميل بعض بيانات الحسابات أو الفواتير، ويظهر سجل المدفوعات المتاح فقط.",
    refreshed: "تم تحديث مدفوعات المرضى.",
    created: "تم تسجيل الدفعة بنجاح.",
    confirmedToast: "تم تأكيد الدفعة بنجاح.",
    cancelledToast: "تم إلغاء الدفعة بنجاح.",
    required: "أكمل اسم المريض والمبلغ وحساب الخزينة وتاريخ الدفع.",
    invalidAmount: "أدخل مبلغًا أكبر من صفر.",
    cancelRequired: "اكتب سبب الإلغاء.",
    excelEmpty: "لا توجد مدفوعات للتصدير.",
    excelReady: "تم تجهيز ملف Excel.",
    printEmpty: "لا توجد مدفوعات للطباعة.",
    printReady: "تم تجهيز تقرير المدفوعات.",
    printBlocked: "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.",
    report: "تقرير مدفوعات المرضى — Marilyn Clinics",
    count: "عدد النتائج",
    total: "إجمالي النتائج",
    unknown: "غير محدد",
    none: "—",
    statuses: { DRAFT: "مسودة", CONFIRMED: "مؤكدة", CANCELLED: "ملغاة", CANCELED: "ملغاة" },
    methods: { CASH: "نقدي", CARD: "بطاقة", BANK_TRANSFER: "تحويل بنكي", CHEQUE: "شيك", ONLINE: "دفع إلكتروني", OTHER: "أخرى" },
  },
  en: {
    badge: "Central administration",
    title: "Patient Payments",
    description:
      "Monitor amounts collected from patients and customers and their invoice, treasury, and accounting links from live records.",
    tabs: ["Patient billing", "Patient payments", "Treasury", "Accounting"],
    refresh: "Refresh",
    create: "Record payment",
    excel: "Excel",
    print: "Print",
    kpis: ["Total payments", "Confirmed payments", "Draft payments", "Cancelled payments"],
    kpiDescriptions: [
      "All patient and customer payments",
      "Confirmed payments reflected in treasury",
      "Payments waiting for confirmation",
      "Cancelled payments with their audit trail",
    ],
    register: "Patient payments register",
    registerDescription:
      "A unified register of payment, patient or customer, amount, method, account, invoice, and posting status.",
    search: "Search by payment, patient, phone, invoice, or reference...",
    allStatuses: "All statuses",
    allMethods: "All payment methods",
    sort: ["Newest", "Oldest", "Highest amount", "Lowest amount"],
    from: "From date",
    to: "To date",
    reset: "Reset",
    columns: ["Payment", "Patient or customer", "Amount and method", "Treasury account", "Invoice", "Posting", "Date and status", "Actions"],
    amount: "Amount",
    method: "Payment method",
    account: "Treasury account",
    invoice: "Invoice",
    paymentDate: "Payment date",
    status: "Status",
    accounting: "Accounting entry",
    transaction: "Treasury transaction",
    posted: "Accounting posted",
    notPosted: "Not accounting posted",
    details: "View details",
    confirm: "Confirm payment",
    cancel: "Cancel payment",
    detailsTitle: "Payment details",
    detailsDescription: "Financial record details and its invoice, treasury, and accounting links.",
    createTitle: "Record patient payment",
    createDescription: "The payment is recorded for the current company and can be saved as draft or confirmed immediately.",
    customerName: "Patient or customer name",
    customerPhone: "Mobile number",
    selectAccount: "Select treasury account",
    noAccounts: "No active treasury accounts",
    selectMethod: "Select payment method",
    linkedInvoice: "Linked invoice",
    noInvoice: "No linked invoice",
    reference: "Reference",
    descriptionField: "Description",
    notes: "Notes",
    initialStatus: "Initial status",
    draft: "Save as draft",
    confirmed: "Confirm immediately",
    save: "Save payment",
    saving: "Saving...",
    confirmTitle: "Confirm payment",
    confirmDescription: "The payment will be confirmed and treasury and accounting effects will be created by the server.",
    confirmAction: "Confirm now",
    cancelTitle: "Cancel payment",
    cancelDescription: "The cancellation reason is preserved and the server may create an accounting reversal.",
    cancelReason: "Cancellation reason",
    cancelReasonPlaceholder: "Enter cancellation reason...",
    cancelAction: "Cancel payment",
    close: "Close",
    noData: "No patient payments are currently registered.",
    noResults: "No payments match the current search or filters.",
    error: "Could not load the payments center",
    retry: "Try again",
    partial: "Some account or invoice data could not be loaded; available payment records are shown.",
    refreshed: "Patient payments refreshed.",
    created: "Payment recorded successfully.",
    confirmedToast: "Payment confirmed successfully.",
    cancelledToast: "Payment cancelled successfully.",
    required: "Complete patient name, amount, treasury account, and payment date.",
    invalidAmount: "Enter an amount greater than zero.",
    cancelRequired: "Enter a cancellation reason.",
    excelEmpty: "There are no payments to export.",
    excelReady: "Excel file prepared.",
    printEmpty: "There are no payments to print.",
    printReady: "Payment report prepared.",
    printBlocked: "The print window could not be opened. Allow pop-ups.",
    report: "Patient Payments Report — Marilyn Clinics",
    count: "Results",
    total: "Results total",
    unknown: "Unknown",
    none: "—",
    statuses: { DRAFT: "Draft", CONFIRMED: "Confirmed", CANCELLED: "Cancelled", CANCELED: "Cancelled" },
    methods: { CASH: "Cash", CARD: "Card", BANK_TRANSFER: "Bank transfer", CHEQUE: "Cheque", ONLINE: "Online", OTHER: "Other" },
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
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}
function first(source: ApiRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return fallback;
}
function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(text(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function boolValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes"].includes(text(value).toLowerCase());
}
function arrayFrom(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  const data = record(root.data);
  for (const source of [root, data]) {
    for (const key of keys) {
      if (Array.isArray(source[key])) return source[key] as unknown[];
    }
  }
  return [];
}
function choicesFrom(payload: unknown, key: string): Choice[] {
  const choices = record(record(payload).choices)[key];
  if (!Array.isArray(choices)) return [];
  return choices
    .map((item) => {
      const source = record(item);
      return { value: first(source, ["value"]), label: first(source, ["label"]) };
    })
    .filter((item) => item.value);
}
function normalizePayment(value: unknown): PaymentRow {
  const source = record(value);
  return {
    id: first(source, ["id"]),
    number: first(source, ["payment_number", "number"], "—"),
    customerName: first(source, ["counterparty_name", "customer_name"], "—"),
    customerPhone: first(source, ["counterparty_phone", "customer_phone"]),
    amount: numberValue(source.amount),
    currency: first(source, ["currency"], "SAR"),
    method: first(source, ["payment_method"], "OTHER").toUpperCase(),
    methodLabel: first(source, ["payment_method_label"]),
    status: first(source, ["status"], "DRAFT").toUpperCase(),
    statusLabel: first(source, ["status_label"]),
    paymentDate: first(source, ["payment_date"]).slice(0, 10),
    treasuryAccountId: first(source, ["treasury_account_id"]),
    treasuryAccountName: first(source, ["treasury_account_name"], "—"),
    treasuryAccountType: first(source, ["treasury_account_type"]),
    invoiceId: first(source, ["sales_invoice_id"]),
    invoiceNumber: first(source, ["sales_invoice_number", "invoice_number"]),
    invoiceStatus: first(source, ["invoice_status"]),
    invoicePaymentStatus: first(source, ["invoice_payment_status"]),
    reference: first(source, ["reference"]),
    description: first(source, ["description"]),
    notes: first(source, ["notes"]),
    treasuryTransactionNumber: first(source, ["treasury_transaction_number"]),
    treasuryTransactionStatus: first(source, ["treasury_transaction_status"]),
    accountingEntryNumber: first(source, ["accounting_entry_number"]),
    accountingEntryStatus: first(source, ["accounting_entry_status"]),
    accountingPosted: boolValue(source.is_accounting_posted),
    confirmedAt: first(source, ["confirmed_at"]),
    confirmedByName: first(source, ["confirmed_by_name"]),
    cancelledAt: first(source, ["cancelled_at"]),
    cancelledByName: first(source, ["cancelled_by_name"]),
    cancellationReason: first(source, ["cancellation_reason"]),
    createdAt: first(source, ["created_at"]),
  };
}
function normalizeAccount(value: unknown): TreasuryAccount {
  const source = record(value);
  return {
    id: first(source, ["id"]),
    name: first(source, ["name"], "—"),
    code: first(source, ["code"]),
    type: first(source, ["account_type_display", "account_type"]),
    currency: first(source, ["currency"], "SAR"),
    balance: numberValue(source.current_balance),
    active: boolValue(source.is_active) || first(source, ["status"]).toUpperCase() === "ACTIVE",
  };
}
function normalizeInvoice(value: unknown): InvoiceOption {
  const source = record(value);
  return {
    id: first(source, ["id"]),
    number: first(source, ["invoice_number", "number"], "—"),
    customer: first(source, ["customer_name", "patient_name"], "—"),
    balance: numberValue(source.balance_due ?? source.remaining_amount),
    paymentStatus: first(source, ["payment_status"]),
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
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}
function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? decodeURIComponent(parts.pop()?.split(";").shift() || "") : "";
}
async function apiJson(path: string, options: RequestInit = {}): Promise<unknown> {
  const method = String(options.method || "GET").toUpperCase();
  const csrf = getCookie("csrftoken") || getCookie("csrf_token");
  const response = await fetch(buildApiUrl(path), {
    ...options,
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" && csrf ? { "X-CSRFToken": csrf } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const raw = await response.text();
  let payload: unknown = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }
  if (!response.ok || record(payload).success === false) {
    throw new Error(first(record(payload), ["message", "detail"], `HTTP ${response.status}`));
  }
  return payload;
}
function money(value: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function date(value: string): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "—";
}
function dateTime(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(parsed);
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
function statusClass(status: string): string {
  if (status === "CONFIRMED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["CANCELLED", "CANCELED"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{children || "—"}</div>
    </div>
  );
}

export default function PatientPaymentsClient() {
  const locale = useLocale();
  const t = TEXT[locale];
  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [accounts, setAccounts] = React.useState<TreasuryAccount[]>([]);
  const [invoices, setInvoices] = React.useState<InvoiceOption[]>([]);
  const [methodChoices, setMethodChoices] = React.useState<Choice[]>([]);
  const [statusChoices, setStatusChoices] = React.useState<Choice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [partial, setPartial] = React.useState(false);
  const [selected, setSelected] = React.useState<PaymentRow | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<PaymentRow | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<PaymentRow | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [method, setMethod] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");

  const load = React.useCallback(async (refresh = false, signal?: AbortSignal) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    setPartial(false);
    try {
      const result = await Promise.allSettled([
        apiJson(API.payments, { signal }),
        apiJson(API.accounts, { signal }),
        apiJson(API.invoices, { signal }),
      ]);
      if (result[0].status === "rejected") throw result[0].reason;
      const paymentsPayload = result[0].value;
      setRows(arrayFrom(paymentsPayload, ["results", "items", "payments"]).map(normalizePayment));
      setMethodChoices(choicesFrom(paymentsPayload, "payment_methods"));
      setStatusChoices(choicesFrom(paymentsPayload, "statuses"));
      if (result[1].status === "fulfilled") {
        setAccounts(arrayFrom(result[1].value, ["results", "items", "accounts"]).map(normalizeAccount).filter((item) => item.id && item.active));
      } else {
        setAccounts([]);
        setPartial(true);
      }
      if (result[2].status === "fulfilled") {
        setInvoices(arrayFrom(result[2].value, ["results", "items", "invoices"]).map(normalizeInvoice).filter((item) => item.id));
      } else {
        setInvoices([]);
        setPartial(true);
      }
      if (refresh) toast.success(t.refreshed);
    } catch (reason) {
      if (signal?.aborted) return;
      setRows([]);
      setError(reason instanceof Error ? reason.message : t.error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [t.error, t.refreshed]);

  React.useEffect(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  const statusLabel = React.useCallback((value: string) => {
    return (t.statuses as Record<string, string>)[value] || statusChoices.find((item) => item.value === value)?.label || value || t.unknown;
  }, [statusChoices, t.statuses, t.unknown]);
  const methodLabel = React.useCallback((value: string, fallback = "") => {
    return (t.methods as Record<string, string>)[value] || methodChoices.find((item) => item.value === value)?.label || fallback || value || t.unknown;
  }, [methodChoices, t.methods, t.unknown]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (query && ![
          row.number, row.customerName, row.customerPhone, row.invoiceNumber, row.reference,
          row.treasuryAccountName, row.accountingEntryNumber, row.treasuryTransactionNumber,
        ].join(" ").toLowerCase().includes(query)) return false;
        if (status !== "all" && row.status !== status) return false;
        if (method !== "all" && row.method !== method) return false;
        if (from && row.paymentDate && row.paymentDate < from) return false;
        if (to && row.paymentDate && row.paymentDate > to) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.paymentDate.localeCompare(b.paymentDate);
        if (sort === "high") return b.amount - a.amount;
        if (sort === "low") return a.amount - b.amount;
        return b.paymentDate.localeCompare(a.paymentDate);
      });
  }, [from, method, rows, search, sort, status, to]);

  const kpis = React.useMemo(() => ({
    total: rows.length,
    confirmed: rows.filter((row) => row.status === "CONFIRMED").length,
    draft: rows.filter((row) => row.status === "DRAFT").length,
    cancelled: rows.filter((row) => ["CANCELLED", "CANCELED"].includes(row.status)).length,
  }), [rows]);

  const effectiveMethods = React.useMemo<Choice[]>(() => {
    if (methodChoices.length) return methodChoices;
    return Object.entries(t.methods).map(([value, label]) => ({ value, label }));
  }, [methodChoices, t.methods]);
  const effectiveStatuses = React.useMemo<Choice[]>(() => {
    if (statusChoices.length) return statusChoices;
    return ["DRAFT", "CONFIRMED", "CANCELLED"].map((value) => ({ value, label: statusLabel(value) }));
  }, [statusChoices, statusLabel]);

  const hasFilters = Boolean(search || from || to) || status !== "all" || method !== "all" || sort !== "newest";
  const reset = () => {
    setSearch("");
    setStatus("all");
    setMethod("all");
    setFrom("");
    setTo("");
    setSort("newest");
  };
  const openCreate = () => {
    setForm({ ...EMPTY_FORM, paymentDate: new Date().toISOString().slice(0, 10) });
    setCreateOpen(true);
  };

  async function createPayment() {
    if (!form.customerName.trim() || !form.amount || !form.treasuryAccountId || !form.paymentDate) {
      toast.error(t.required);
      return;
    }
    if (numberValue(form.amount) <= 0) {
      toast.error(t.invalidAmount);
      return;
    }
    setSaving(true);
    try {
      await apiJson("/api/company/treasury/customer-payments/", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.customerName.trim(),
          counterparty_name: form.customerName.trim(),
          customer_phone: form.customerPhone.trim(),
          counterparty_phone: form.customerPhone.trim(),
          amount: form.amount,
          treasury_account_id: Number(form.treasuryAccountId),
          payment_method: form.paymentMethod,
          payment_date: form.paymentDate,
          sales_invoice_id: form.invoiceId !== "none" ? Number(form.invoiceId) : null,
          reference: form.reference.trim(),
          description: form.description.trim(),
          notes: form.notes.trim(),
          status: form.status,
        }),
      });
      toast.success(t.created);
      setCreateOpen(false);
      await load(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmPayment() {
    if (!confirmTarget) return;
    setActing(true);
    try {
      await apiJson(`/api/company/treasury/customer-payments/${encodeURIComponent(confirmTarget.id)}/confirm/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(t.confirmedToast);
      setConfirmTarget(null);
      setSelected(null);
      await load(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : t.error);
    } finally {
      setActing(false);
    }
  }

  async function cancelPayment() {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      toast.error(t.cancelRequired);
      return;
    }
    setActing(true);
    try {
      await apiJson(`/api/company/treasury/customer-payments/${encodeURIComponent(cancelTarget.id)}/cancel/`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      toast.success(t.cancelledToast);
      setCancelTarget(null);
      setCancelReason("");
      setSelected(null);
      await load(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : t.error);
    } finally {
      setActing(false);
    }
  }

  const tableHtml = () => `
    <table>
      <thead><tr>${[
        t.columns[0], t.columns[1], t.amount, t.method, t.account, t.invoice,
        t.paymentDate, t.status, t.accounting, t.transaction,
      ].map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
      <tbody>${filtered.map((row) => `<tr>
        <td>${escapeHtml(row.number)}</td><td>${escapeHtml(row.customerName)}</td>
        <td dir="ltr">${money(row.amount)}</td><td>${escapeHtml(methodLabel(row.method, row.methodLabel))}</td>
        <td>${escapeHtml(row.treasuryAccountName)}</td><td>${escapeHtml(row.invoiceNumber || "—")}</td>
        <td dir="ltr">${escapeHtml(date(row.paymentDate))}</td><td>${escapeHtml(statusLabel(row.status))}</td>
        <td>${escapeHtml(row.accountingEntryNumber || "—")}</td><td>${escapeHtml(row.treasuryTransactionNumber || "—")}</td>
      </tr>`).join("")}</tbody>
    </table>`;

  const excel = () => {
    if (!filtered.length) return toast.error(t.excelEmpty);
    const html = `<!doctype html><html dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="UTF-8"></head><body>${tableHtml()}</body></html>`;
    const url = URL.createObjectURL(new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marilyn-patient-payments-${new Date().toISOString().slice(0, 10)}.xls`;
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
    if (opened) toast.success(t.printReady);
    else toast.error(t.printBlocked);
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

  const kpiValues = [kpis.total, kpis.confirmed, kpis.draft, kpis.cancelled];
  const kpiIcons = [WalletCards, CheckCircle2, Clock3, Ban];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-5xl text-start">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
            <WalletCards className="h-3.5 w-3.5 text-[#a57b3d]" />
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
              ? "متصل بواجهات المدفوعات والفواتير والخزينة والترحيل المحاسبي الحقيقية"
              : "Connected to live payments, invoices, treasury, and accounting posting APIs"}
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
          <Button
            variant="brand"
            className={registerBrandButtonClass}
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            {t.create}
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
        active="payments"
        locale={locale}
        counts={{
          payments: kpis.total,
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
              <WalletCards className="h-4 w-4 text-[#a57b3d]" />
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
                  <SelectItem value="all">{t.allStatuses}</SelectItem>
                  {effectiveStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{statusLabel(item.value)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 w-[170px] bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allMethods}</SelectItem>
                  {effectiveMethods.map((item) => <SelectItem key={item.value} value={item.value}>{methodLabel(item.value, item.label)}</SelectItem>)}
                </SelectContent>
              </Select>
              <DataRegisterDatePicker label={t.from} value={from} onChange={setFrom} locale={locale} />
              <DataRegisterDatePicker label={t.to} value={to} onChange={setTo} locale={locale} />
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger className="h-9 w-[145px] bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["newest", "oldest", "high", "low"] as SortKey[]).map((value, index) => <SelectItem key={value} value={value}>{t.sort[index]}</SelectItem>)}
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
                    <TableCell><div className="font-semibold">{row.number}</div><div className="mt-1 text-xs text-muted-foreground">{row.reference || "—"}</div></TableCell>
                    <TableCell><div className="font-medium">{row.customerName}</div><div dir="ltr" className="mt-1 text-start text-xs text-muted-foreground">{row.customerPhone || "—"}</div></TableCell>
                    <TableCell><Money value={row.amount} strong /><div className="mt-1 text-xs text-muted-foreground">{methodLabel(row.method, row.methodLabel)}</div></TableCell>
                    <TableCell><div>{row.treasuryAccountName}</div><div className="mt-1 text-xs text-muted-foreground">{row.treasuryAccountType || "—"}</div></TableCell>
                    <TableCell><div className="font-medium">{row.invoiceNumber || "—"}</div><div className="mt-1 text-xs text-muted-foreground">{row.invoicePaymentStatus || row.invoiceStatus || "—"}</div></TableCell>
                    <TableCell className="text-xs">
                      <div>{t.accounting}: {row.accountingEntryNumber || "—"}</div>
                      <div className="mt-1">{t.transaction}: {row.treasuryTransactionNumber || "—"}</div>
                      <Badge variant="outline" className={`mt-2 ${row.accountingPosted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        {row.accountingPosted ? t.posted : t.notPosted}
                      </Badge>
                    </TableCell>
                    <TableCell><div dir="ltr" className="text-start text-xs">{date(row.paymentDate)}</div><Badge variant="outline" className={`mt-2 ${statusClass(row.status)}`}>{statusLabel(row.status)}</Badge></TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t.columns[7]} onClick={(event) => event.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(row)}><Eye className="h-4 w-4 text-[#a57b3d]" />{t.details}</DropdownMenuItem>
                          {row.status === "DRAFT" ? (
                            <DropdownMenuItem onClick={() => setConfirmTarget(row)}><CheckCircle2 className="h-4 w-4 text-emerald-600" />{t.confirm}</DropdownMenuItem>
                          ) : null}
                          {!(["CANCELLED", "CANCELED"].includes(row.status)) ? <DropdownMenuSeparator /> : null}
                          {!(["CANCELLED", "CANCELED"].includes(row.status)) ? (
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-700" onClick={() => { setCancelTarget(row); setCancelReason(""); }}><Ban className="h-4 w-4" />{t.cancel}</DropdownMenuItem>
                          ) : null}
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
                      icon={CircleDollarSign}
                      action={!rows.length ? <Button variant="brand" className={registerBrandButtonClass} onClick={openCreate}><Plus className="h-4 w-4" />{t.create}</Button> : undefined}
                    />
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.count}: <strong dir="ltr" className="text-foreground tabular-nums">{filtered.length}</strong></span>
            <span>{t.total}: <Money value={filtered.reduce((sum, row) => sum + row.amount, 0)} strong /></span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t.detailsTitle}{selected ? ` — ${selected.number}` : ""}</DialogTitle>
            <DialogDescription>{t.detailsDescription}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t.customerName}>{selected.customerName}</Detail>
                <Detail label={t.customerPhone}>{selected.customerPhone || "—"}</Detail>
                <Detail label={t.amount}><Money value={selected.amount} strong /></Detail>
                <Detail label={t.method}>{methodLabel(selected.method, selected.methodLabel)}</Detail>
                <Detail label={t.account}>{selected.treasuryAccountName}</Detail>
                <Detail label={t.invoice}>{selected.invoiceNumber || "—"}</Detail>
                <Detail label={t.paymentDate}>{date(selected.paymentDate)}</Detail>
                <Detail label={t.status}>{statusLabel(selected.status)}</Detail>
                <Detail label={t.reference}>{selected.reference || "—"}</Detail>
                <Detail label={t.transaction}>{selected.treasuryTransactionNumber || "—"}<br />{selected.treasuryTransactionStatus || ""}</Detail>
                <Detail label={t.accounting}>{selected.accountingEntryNumber || "—"}<br />{selected.accountingEntryStatus || ""}</Detail>
                <Detail label={t.posted}>{selected.accountingPosted ? t.posted : t.notPosted}</Detail>
                <Detail label={t.confirmed}>{selected.confirmedAt ? `${dateTime(selected.confirmedAt)} — ${selected.confirmedByName || "—"}` : "—"}</Detail>
                <Detail label={t.cancel}>{selected.cancelledAt ? `${dateTime(selected.cancelledAt)} — ${selected.cancelledByName || "—"}` : "—"}</Detail>
                <Detail label={t.cancelReason}>{selected.cancellationReason || "—"}</Detail>
                <div className="sm:col-span-2 lg:col-span-3"><Detail label={t.descriptionField}>{selected.description || "—"}</Detail></div>
                <div className="sm:col-span-2 lg:col-span-3"><Detail label={t.notes}>{selected.notes || "—"}</Detail></div>
              </div>
              <DialogFooter>
                {selected.status === "DRAFT" ? <Button variant="outline" onClick={() => setConfirmTarget(selected)}><CheckCircle2 className="h-4 w-4 text-emerald-600" />{t.confirm}</Button> : null}
                {!(["CANCELLED", "CANCELED"].includes(selected.status)) ? <Button variant="destructive" onClick={() => { setCancelTarget(selected); setCancelReason(""); }}><Ban className="h-4 w-4" />{t.cancel}</Button> : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => { if (!saving) setCreateOpen(open); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.createTitle}</DialogTitle>
            <DialogDescription>{t.createDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="payment-customer">{t.customerName}</Label><Input id="payment-customer" value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="payment-phone">{t.customerPhone}</Label><Input id="payment-phone" dir="ltr" value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="payment-amount">{t.amount}</Label><Input id="payment-amount" dir="ltr" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.paymentDate}</Label><Input dir="ltr" type="date" value={form.paymentDate} onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.account}</Label><Select value={form.treasuryAccountId} onValueChange={(value) => setForm((current) => ({ ...current, treasuryAccountId: value }))}><SelectTrigger><SelectValue placeholder={accounts.length ? t.selectAccount : t.noAccounts} /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}{account.code ? ` — ${account.code}` : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.method}</Label><Select value={form.paymentMethod} onValueChange={(value) => setForm((current) => ({ ...current, paymentMethod: value }))}><SelectTrigger><SelectValue placeholder={t.selectMethod} /></SelectTrigger><SelectContent>{effectiveMethods.map((item) => <SelectItem key={item.value} value={item.value}>{methodLabel(item.value, item.label)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.linkedInvoice}</Label><Select value={form.invoiceId} onValueChange={(value) => setForm((current) => ({ ...current, invoiceId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t.noInvoice}</SelectItem>{invoices.map((invoice) => <SelectItem key={invoice.id} value={invoice.id}>{invoice.number} — {invoice.customer} — {money(invoice.balance)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.initialStatus}</Label><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">{t.draft}</SelectItem><SelectItem value="CONFIRMED">{t.confirmed}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="payment-reference">{t.reference}</Label><Input id="payment-reference" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="payment-description">{t.descriptionField}</Label><Input id="payment-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="payment-notes">{t.notes}</Label><Textarea id="payment-notes" rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setCreateOpen(false)}>{t.close}</Button>
            <Button disabled={saving || !accounts.length} onClick={() => void createPayment()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}{saving ? t.saving : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmTarget)} onOpenChange={(open) => { if (!open && !acting) setConfirmTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.confirmTitle}</DialogTitle><DialogDescription>{t.confirmDescription}</DialogDescription></DialogHeader>
          {confirmTarget ? <div className="rounded-lg border bg-muted/20 p-4"><div className="font-semibold">{confirmTarget.number}</div><div className="mt-1 text-sm text-muted-foreground">{confirmTarget.customerName}</div><div className="mt-3"><Money value={confirmTarget.amount} strong /></div></div> : null}
          <DialogFooter><Button variant="outline" disabled={acting} onClick={() => setConfirmTarget(null)}>{t.close}</Button><Button disabled={acting} onClick={() => void confirmPayment()}>{acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{t.confirmAction}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !acting) { setCancelTarget(null); setCancelReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.cancelTitle}</DialogTitle><DialogDescription>{t.cancelDescription}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="payment-cancel-reason">{t.cancelReason}</Label><Textarea id="payment-cancel-reason" rows={4} placeholder={t.cancelReasonPlaceholder} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" disabled={acting} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>{t.close}</Button><Button variant="destructive" disabled={acting || !cancelReason.trim()} onClick={() => void cancelPayment()}>{acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}{t.cancelAction}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
