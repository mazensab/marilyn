"use client";
// detail_page_unified=true
// detail_username_duplicate_removed=true
/* ============================================================
   📂 marilyn_frontend/app/system/users/[id]/page.tsx
   👤 Marilyn Clinics — System User Detail
   ------------------------------------------------------------
   ✅ Real API only: GET /api/users/{id}/
   ✅ Unified access-management navigation
   ✅ Direct detail header
   ✅ Identity, contact, access, dates, and notes
   ✅ Copy user ID
   ✅ Print and browser PDF through the print dialog
   ✅ Arabic / English
   ✅ No localhost hardcoding
   ✅ No fake data
============================================================ */
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Copy,
  Hash,
  KeyRound,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AccessManagementTabs } from "@/components/system/access-management-tabs";
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
import { openPrintReport } from "@/lib/print-report";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type UserRecord = {
  id: string;
  name: string;
  code: string;
  status: string;
  owner: string;
  activity: string;
  subscription: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
};
const API_ENDPOINT = "/api/users/";
const translations = {
  ar: {
    module: "الإدارة والصلاحيات",
    title: "تفاصيل المستخدم",
    subtitle:
      "مراجعة بيانات حساب الدخول والدور ونوع الوصول والحالة والتواصل من واجهة المستخدمين الحقيقية.",
    connected: "متصل بواجهة تفاصيل مستخدمي النظام",
    backToUsers: "العودة للمستخدمين",
    refresh: "تحديث",
    print: "طباعة",
    copyId: "نسخ المعرف",
    copied: "تم نسخ معرف المستخدم.",
    refreshed: "تم تحديث تفاصيل المستخدم.",
    identity: "بيانات حساب المستخدم",
    identityDesc:
      "الاسم واسم الدخول والمعرف الداخلي المرتبط بالحساب.",
    contact: "بيانات التواصل",
    contactDesc:
      "البريد الإلكتروني ورقم الجوال المرتبطان بالمستخدم.",
    access: "الدور والوصول",
    accessDesc:
      "الدور الإداري ونوع الوصول والصلاحيات والحالة التشغيلية.",
    notes: "ملاحظات إدارية",
    notesDesc:
      "الملاحظات الداخلية المتاحة في سجل المستخدم.",
    dates: "التواريخ",
    datesDesc:
      "تاريخ إنشاء الحساب وآخر تحديث مسجل.",
    summary: "ملخص الحساب",
    summaryDesc:
      "أهم بيانات الوصول والتشغيل للمستخدم الحالي.",
    userName: "اسم المستخدم",
    userCode: "اسم الدخول",
    userId: "معرف المستخدم",
    owner: "اسم الدخول",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    permissions: "الصلاحيات",
    role: "دور النظام",
    accessType: "نوع الوصول",
    status: "الحالة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    endpoint: "واجهة التفاصيل",
    recordSource: "مصدر البيانات",
    liveApi: "واجهة النظام الحقيقية",
    active: "نشط",
    inactive: "غير نشط",
    suspended: "موقوف",
    trial: "تجريبي",
    pending: "معلق",
    draft: "مسودة",
    cancelled: "ملغي",
    unknown: "غير محدد",
    notAvailable: "غير متوفر",
    reportTitle: "تقرير تفاصيل مستخدم Marilyn Clinics",
    errorTitle: "تعذر تحميل تفاصيل المستخدم",
    errorDesc:
      "تأكد من تسجيل الدخول بصلاحية نظام ومن تشغيل الخادم الخلفي ثم أعد المحاولة.",
    emptyTitle: "لا توجد بيانات للمستخدم",
    emptyDesc:
      "لم ترجع واجهة المستخدمين بيانات صالحة لهذا المستخدم.",
    tryAgain: "إعادة المحاولة",
  },
  en: {
    module: "Access management",
    title: "User details",
    subtitle:
      "Review login account details, role, access type, status, and contact information from the live users API.",
    connected: "Connected to the system-user details API",
    backToUsers: "Back to users",
    refresh: "Refresh",
    print: "Print",
    copyId: "Copy ID",
    copied: "User ID copied.",
    refreshed: "User details refreshed.",
    identity: "User account",
    identityDesc:
      "Name, username, and internal identifier associated with the account.",
    contact: "Contact details",
    contactDesc:
      "Email address and phone number associated with the user.",
    access: "Role and access",
    accessDesc:
      "Administrative role, access type, permissions, and operational status.",
    notes: "Administrative notes",
    notesDesc:
      "Internal notes available in the user record.",
    dates: "Dates",
    datesDesc:
      "Account creation date and the latest recorded update.",
    summary: "Account summary",
    summaryDesc:
      "Key access and operational information for the current user.",
    userName: "User name",
    userCode: "Username",
    userId: "User ID",
    owner: "Username",
    email: "Email",
    phone: "Phone",
    permissions: "Permissions",
    role: "System role",
    accessType: "Access type",
    status: "Status",
    createdAt: "Created at",
    updatedAt: "Updated at",
    endpoint: "Details endpoint",
    recordSource: "Data source",
    liveApi: "Live system API",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    trial: "Trial",
    pending: "Pending",
    draft: "Draft",
    cancelled: "Cancelled",
    unknown: "Unknown",
    notAvailable: "Not available",
    reportTitle: "Marilyn Clinics User Details Report",
    errorTitle: "Could not load user details",
    errorDesc:
      "Make sure you are signed in as a system user and the backend is running, then try again.",
    emptyTitle: "No user data",
    emptyDesc:
      "The users API did not return valid data for this user.",
    tryAgain: "Try again",
  },
} as const;
function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}
function isRecord(
  value: unknown,
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
function asRecord(
  value: unknown,
): ApiRecord {
  return isRecord(value) ? value : {};
}
function normalizeText(
  value: unknown,
  fallback = "",
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }
  return String(value).trim() || fallback;
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
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    "";
  const base = raw.replace(/\/+$/, "");
  return base.endsWith("/api")
    ? base.slice(0, -4)
    : base;
}
function makeApiUrl(
  path: string,
): string {
  return `${getApiBaseUrl()}${path}`;
}
function escapeHtml(
  value: unknown,
): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
      .replace("T", " ")
      .slice(0, 16);
  }
  return parsed
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);
}
function normalizeStatus(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "unknown";
  }
  if (typeof value === "boolean") {
    return value
      ? "active"
      : "inactive";
  }
  const normalized = normalizeText(
    value,
  ).toLowerCase();
  if (!normalized) return "unknown";
  if (
    normalized === "true" ||
    normalized === "enabled"
  ) {
    return "active";
  }
  if (
    normalized === "false" ||
    normalized === "disabled"
  ) {
    return "inactive";
  }
  return normalized;
}
function extractUserPayload(
  payload: unknown,
): ApiRecord {
  const source = asRecord(payload);
  const data = asRecord(source.data);
  const result = asRecord(source.result);
  const candidates = [
    asRecord(source.user),
    asRecord(data.user),
    asRecord(result.user),
    asRecord(
      source.item ||
        source.record ||
        source.object,
    ),
    asRecord(
      data.item ||
        data.record ||
        data.object,
    ),
    asRecord(
      result.item ||
        result.record ||
        result.object,
    ),
    data,
    result,
    source,
  ];
  return (
    candidates.find(
      (item) =>
        Object.keys(item).length > 0,
    ) || {}
  );
}
function normalizePermissions(
  value: unknown,
): string {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === "string") {
          return normalizeText(item);
        }
        const permission = asRecord(item);
        return normalizeText(
          permission.code ||
            permission.key ||
            permission.name ||
            permission.label ||
            permission.codename,
        );
      })
      .filter(Boolean);
    if (items.length > 6) {
      return `${items
        .slice(0, 6)
        .join(", ")} +${items.length - 6}`;
    }
    return items.join(", ") || "—";
  }
  if (isRecord(value)) {
    const enabled = Object.entries(value)
      .filter(([, enabledValue]) =>
        Boolean(enabledValue),
      )
      .map(([key]) => key);
    if (enabled.length > 6) {
      return `${enabled
        .slice(0, 6)
        .join(", ")} +${enabled.length - 6}`;
    }
    return enabled.join(", ") || "—";
  }
  return normalizeText(
    value,
    "—",
  );
}
function normalizeUser(
  payload: unknown,
): UserRecord {
  const source =
    extractUserPayload(payload);
  const profile = asRecord(
    source.profile,
  );
  const defaultWorkspace = asRecord(
    source.default_workspace,
  );
  const membership = asRecord(
    source.default_membership ||
      source.membership ||
      source.company_membership,
  );
  const rawId = normalizeText(
    source.id ||
      source.pk ||
      source.user_id,
  );
  const userId = normalizeText(
    source.user_id ||
      rawId,
  );
  const username = normalizeText(
    source.username ||
      profile.username ||
      source.code ||
      userId,
    "—",
  );
  const firstName = normalizeText(
    source.first_name ||
      profile.first_name,
  );
  const lastName = normalizeText(
    source.last_name ||
      profile.last_name,
  );
  const joinedName =
    `${firstName} ${lastName}`.trim();
  const displayName = normalizeText(
    source.display_name ||
      source.full_name ||
      source.name ||
      joinedName ||
      username ||
      source.email,
    "—",
  );
  const email = normalizeText(
    source.email ||
      profile.email,
    "—",
  );
  const phone = normalizeText(
    source.phone ||
      source.mobile ||
      source.whatsapp ||
      profile.phone ||
      profile.mobile,
    "—",
  );
  const role = normalizeText(
    source.system_role ||
      source.role ||
      source.access_role ||
      membership.role,
    "—",
  );
  const accessType = normalizeText(
    source.access_type ||
      defaultWorkspace.type ||
      defaultWorkspace.code ||
      defaultWorkspace.name ||
      (
        source.can_access_system === true
          ? "system"
          : ""
      ),
    "—",
  );
  const permissions = normalizePermissions(
    source.system_permissions ||
      source.permissions ||
      source.permission_codes ||
      source.permission_list,
  );
  return {
    id:
      rawId ||
      userId ||
      username,
    name: displayName,
    code: username,
    status: normalizeStatus(
      source.status ||
        (
          source.is_active === false
            ? "inactive"
            : "active"
        ),
    ),
    owner: username,
    activity: role,
    subscription: accessType,
    email,
    phone,
    city: permissions,
    notes: normalizeText(
      source.status_reason ||
        source.notes ||
        source.description ||
        source.internal_notes,
    ),
    created_at:
      normalizeText(
        source.created_at ||
          source.created ||
          source.inserted_at ||
          source.date_joined ||
          profile.created_at,
      ) || null,
    updated_at:
      normalizeText(
        source.updated_at ||
          source.modified_at ||
          source.updated ||
          source.last_login ||
          profile.updated_at,
      ) || null,
  };
}
async function fetchJson<T>(
  url: string,
): Promise<T> {
  const response = await fetch(
    url,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json",
        "X-Requested-With":
          "XMLHttpRequest",
      },
    },
  );
  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const source = asRecord(payload);
    throw new Error(
      normalizeText(
        source.message ||
          source.detail ||
          source.error,
      ) ||
        `HTTP ${response.status}`,
    );
  }
  return payload as T;
}
function getStatusLabel(
  value: string,
  locale: Locale,
): string {
  const normalized =
    value.toLowerCase();
  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    active: {
      ar: "نشط",
      en: "Active",
    },
    inactive: {
      ar: "غير نشط",
      en: "Inactive",
    },
    suspended: {
      ar: "موقوف",
      en: "Suspended",
    },
    trial: {
      ar: "تجريبي",
      en: "Trial",
    },
    pending: {
      ar: "معلق",
      en: "Pending",
    },
    draft: {
      ar: "مسودة",
      en: "Draft",
    },
    cancelled: {
      ar: "ملغي",
      en: "Cancelled",
    },
  };
  return (
    labels[normalized]?.[locale] ||
    value ||
    translations[locale].unknown
  );
}
function getStatusClass(
  value: string,
): string {
  const normalized =
    value.toLowerCase();
  if (
    [
      "active",
      "paid",
      "confirmed",
      "ready",
      "success",
    ].includes(normalized)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "pending",
      "trial",
      "draft",
      "processing",
    ].includes(normalized)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (
    [
      "inactive",
      "failed",
      "cancelled",
      "expired",
      "suspended",
      "blocked",
    ].includes(normalized)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}
function StatusBadge({
  value,
  locale,
}: {
  value: string;
  locale: Locale;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs",
        getStatusClass(value),
      )}
    >
      {getStatusLabel(
        value,
        locale,
      )}
    </Badge>
  );
}
function DetailItem({
  label,
  value,
  icon: Icon,
  monospace = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{
    className?: string;
  }>;
  monospace?: boolean;
}) {
  return (
    <div className="flex min-h-[82px] items-start gap-3 rounded-lg border bg-muted/15 p-4">
      <span className="mt-0.5 rounded-full border bg-background p-2 text-[#a57b3d] shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "mt-1 break-words text-sm font-semibold text-foreground",
            monospace && "font-mono text-xs",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
function UserDetailSkeleton() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
          <Skeleton className="h-[520px] rounded-lg" />
        </div>
      </div>
    </main>
  );
}
export default function SystemUserDetailPage() {
  const params = useParams();
  const userId = React.useMemo(
    () => {
      const value = params?.id;
      return Array.isArray(value)
        ? value[0] || ""
        : String(value || "");
    },
    [params],
  );
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [user, setUser] =
    React.useState<UserRecord | null>(
      null,
    );
  const [loading, setLoading] =
    React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);
  const [error, setError] =
    React.useState("");
  const t = translations[locale];
  const dir =
    locale === "ar"
      ? "rtl"
      : "ltr";
  const BackIcon =
    locale === "ar"
      ? ChevronLeft
      : ArrowRight;
  React.useEffect(() => {
    const applyLocale = () => {
      const next =
        getInitialLocale();
      setLocale(next);
      document.documentElement.lang =
        next;
      document.documentElement.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
      document.body.dir =
        next === "ar"
          ? "rtl"
          : "ltr";
    };
    applyLocale();
    window.addEventListener(
      "storage",
      applyLocale,
    );
    window.addEventListener(
      "primey-locale-changed",
      applyLocale,
    );
    return () => {
      window.removeEventListener(
        "storage",
        applyLocale,
      );
      window.removeEventListener(
        "primey-locale-changed",
        applyLocale,
      );
    };
  }, []);
  const loadUser = React.useCallback(
    async ({
      silent = false,
    }: {
      silent?: boolean;
    } = {}) => {
      if (!userId) {
        setError(t.emptyDesc);
        setLoading(false);
        return;
      }
      try {
        if (!silent) {
          setLoading(true);
        }
        setRefreshing(true);
        setError("");
        const payload =
          await fetchJson<unknown>(
            makeApiUrl(
              `${API_ENDPOINT}${encodeURIComponent(
                userId,
              )}/`,
            ),
          );
        const normalized =
          normalizeUser(payload);
        if (
          !normalized.id &&
          !normalized.name
        ) {
          setUser(null);
          setError("");
          return;
        }
        setUser(normalized);
        if (silent) {
          toast.success(
            t.refreshed,
          );
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : t.errorDesc;
        setError(message);
        if (silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      userId,
      t.emptyDesc,
      t.errorDesc,
      t.refreshed,
    ],
  );
  React.useEffect(() => {
    void loadUser();
  }, [loadUser]);
  const fallback = React.useCallback(
    (
      value:
        | string
        | null
        | undefined,
    ) =>
      normalizeText(
        value,
        t.notAvailable,
      ),
    [t.notAvailable],
  );
  async function copyUserId() {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(
        user.id,
      );
      toast.success(t.copied);
    } catch {
      toast.error(t.errorDesc);
    }
  }
  function buildPrintableHtml() {
    if (!user) return "";
    const rows = [
      [t.userName, user.name],
      [t.userCode, user.code],
      [t.userId, user.id],
      [
        t.status,
        getStatusLabel(
          user.status,
          locale,
        ),
      ],
      [t.email, fallback(user.email)],
      [t.phone, fallback(user.phone)],
      [t.role, fallback(user.activity)],
      [
        t.accessType,
        fallback(user.subscription),
      ],
      [
        t.permissions,
        fallback(user.city),
      ],
      [
        t.createdAt,
        formatDateTime(
          user.created_at,
        ),
      ],
      [
        t.updatedAt,
        formatDateTime(
          user.updated_at,
        ),
      ],
      [t.notes, fallback(user.notes)],
    ];
    return `
      <table>
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th>${escapeHtml(label)}</th>
                  <td>${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }
  async function printUser() {
    if (!user) return;
    const subtitle = [
      user.name,
      user.code ||
        user.id,
    ]
      .filter(Boolean)
      .join(" — ");
    const opened =
      await openPrintReport({
        locale,
        title: t.reportTitle,
        subtitle:
          subtitle ||
          t.subtitle,
        tableHtml:
          buildPrintableHtml(),
        recordsCount: 1,
      });
    if (!opened) {
      toast.error(
        locale === "ar"
          ? "تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."
          : "The print window could not be opened. Allow pop-ups and try again.",
      );
    }
  }
  if (loading) {
    return <UserDetailSkeleton />;
  }
  if (error) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <Card className="mx-auto max-w-3xl rounded-lg border-destructive/30 bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-4 text-destructive">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <CardTitle>
              {t.errorTitle}
            </CardTitle>
            <CardDescription>
              {t.errorDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {error}
            </p>
            <Button
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() =>
                void loadUser({
                  silent: true,
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  if (!user) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8"
      >
        <Card className="mx-auto max-w-3xl rounded-lg bg-card shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-muted p-4 text-muted-foreground">
              <CircleAlert className="h-8 w-8" />
            </div>
            <CardTitle>
              {t.emptyTitle}
            </CardTitle>
            <CardDescription>
              {t.emptyDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              asChild
              variant="brand"
              className={registerBrandButtonClass}
            >
              <Link href="/system/users">
                <BackIcon className="h-4 w-4" />
                {t.backToUsers}
              </Link>
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
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#9a7139]">
              <UserRound className="h-4 w-4" />
              {t.module}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.name ||
                  t.title}
              </h1>
              <StatusBadge
                value={user.status}
                locale={locale}
              />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {t.subtitle}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              {t.connected}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className={registerOutlineButtonClass}
            >
              <Link href="/system/users">
                <BackIcon className="h-4 w-4" />
                {t.backToUsers}
              </Link>
            </Button>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={copyUserId}
              disabled={!user.id}
            >
              <Copy className="h-4 w-4" />
              {t.copyId}
            </Button>
            <Button
              variant="outline"
              className={registerOutlineButtonClass}
              onClick={() =>
                void loadUser({
                  silent: true,
                })
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
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() =>
                void printUser()
              }
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </Button>
          </div>
        </header>
        <AccessManagementTabs active="accounts" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <UserRound className="h-4 w-4 text-[#a57b3d]" />
                  {t.identity}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.identityDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                <DetailItem
                  label={t.userName}
                  value={fallback(
                    user.name,
                  )}
                  icon={UserRound}
                />
                <DetailItem
                  label={t.userCode}
                  value={fallback(
                    user.code,
                  )}
                  icon={KeyRound}
                  monospace
                />
                <DetailItem
                  label={t.userId}
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <span>
                        {fallback(
                          user.id,
                        )}
                      </span>
                      {user.id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={copyUserId}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {t.copyId}
                        </Button>
                      ) : null}
                    </div>
                  }
                  icon={Hash}
                  monospace
                />
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <Mail className="h-4 w-4 text-[#a57b3d]" />
                  {t.contact}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.contactDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                <DetailItem
                  label={t.email}
                  value={fallback(
                    user.email,
                  )}
                  icon={Mail}
                />
                <DetailItem
                  label={t.phone}
                  value={
                    <span dir="ltr">
                      {fallback(
                        user.phone,
                      )}
                    </span>
                  }
                  icon={Phone}
                />
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <CalendarDays className="h-4 w-4 text-[#a57b3d]" />
                  {t.dates}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.datesDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                <DetailItem
                  label={t.createdAt}
                  value={formatDateTime(
                    user.created_at,
                  )}
                  icon={CalendarDays}
                  monospace
                />
                <DetailItem
                  label={t.updatedAt}
                  value={formatDateTime(
                    user.updated_at,
                  )}
                  icon={RefreshCw}
                  monospace
                />
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <MessageSquareText className="h-4 w-4 text-[#a57b3d]" />
                  {t.notes}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.notesDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6">
                <div className="min-h-28 rounded-lg border bg-muted/15 p-4 text-sm leading-7 text-muted-foreground">
                  {fallback(
                    user.notes,
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <aside className="space-y-5">
            <Card
              id="user-detail-access-card"
              className="rounded-lg border bg-card shadow-none xl:sticky xl:top-6"
            >
              <CardHeader className="px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <ShieldCheck className="h-4 w-4 text-[#a57b3d]" />
                  {t.access}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.accessDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                <DetailItem
                  label={t.status}
                  value={
                    <StatusBadge
                      value={user.status}
                      locale={locale}
                    />
                  }
                  icon={CheckCircle2}
                />
                <DetailItem
                  label={t.role}
                  value={fallback(
                    user.activity,
                  )}
                  icon={KeyRound}
                />
                <DetailItem
                  label={t.accessType}
                  value={fallback(
                    user.subscription,
                  )}
                  icon={ShieldCheck}
                />
                <DetailItem
                  label={t.permissions}
                  value={fallback(
                    user.city,
                  )}
                  icon={ShieldCheck}
                />
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t.endpoint}
                    </span>
                    <code
                      dir="ltr"
                      className="break-all text-xs font-medium"
                    >
                      /api/users/{user.id}/
                    </code>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t.recordSource}
                    </span>
                    <span className="text-xs font-medium">
                      {t.liveApi}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="brand"
                  className={`w-full ${registerBrandButtonClass}`}
                  onClick={() =>
                    void printUser()
                  }
                >
                  <Printer className="h-4 w-4" />
                  {t.print}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
