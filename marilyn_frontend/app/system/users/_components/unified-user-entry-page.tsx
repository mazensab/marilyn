"use client";
// unified_user_creation_page=true
// unified_organization_user_edit_page=true
// unified_user_entry_component=true
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Save,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AccessManagementTabs } from "@/components/system/access-management-tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type CreateScope = "system" | "organization";
type SystemRole =
  | "SUPER_ADMIN"
  | "SYSTEM_ADMIN"
  | "SUPPORT"
  | "BILLING_MANAGER";
type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "CASHIER"
  | "SALES"
  | "INVENTORY"
  | "HR"
  | "EMPLOYEE"
  | "VIEWER";
type BranchOption = {
  id: string;
  name: string;
  code: string;
};
type FormState = {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  system_role: SystemRole;
  organization_role: OrganizationRole;
  branch_id: string;
  status: "active" | "inactive";
  notes: string;
};
type UnifiedUserEntryPageProps = {
  initialScope?: CreateScope;
  initialEditId?: string;
};
const SYSTEM_USERS_ENDPOINT = "/api/users/";
const ORGANIZATION_USERS_ENDPOINT = "/api/company/users/";
const BRANCHES_ENDPOINT = "/api/company/branches/";
const CSRF_ENDPOINT = "/api/auth/csrf";
const SYSTEM_ROLES: SystemRole[] = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "SUPPORT",
  "BILLING_MANAGER",
];
const ORGANIZATION_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "CASHIER",
  "SALES",
  "INVENTORY",
  "HR",
  "EMPLOYEE",
  "VIEWER",
];
const initialForm: FormState = {
  username: "",
  password: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  system_role: "SUPPORT",
  organization_role: "VIEWER",
  branch_id: "",
  status: "active",
  notes: "",
};
const translations = {
  ar: {
    module: "الإدارة والصلاحيات",
    systemTitle: "إضافة مستخدم نظام",
    organizationTitle: "إضافة مستخدم للمنشأة أو الفرع",
    organizationEditTitle: "تعديل مستخدم المنشأة أو الفرع",
    systemSubtitle:
      "إنشاء حساب دخول جديد للإدارة المركزية وربطه بدور النظام وحالته التشغيلية.",
    organizationSubtitle:
      "إضافة مستخدم تشغيلي إلى المنشأة وربطه بالدور والفرع ونطاق العمل.",
    organizationEditSubtitle:
      "تحديث بيانات المستخدم التشغيلي ودوره وفرعه وحالته من صفحة الإدارة الموحدة.",
    connected: "متصل بواجهات المستخدمين الحقيقية",
    back: "العودة للمستخدمين",
    create: "إنشاء المستخدم",
    creating: "جارٍ الإنشاء...",
    saveChanges: "حفظ التعديلات",
    savingChanges: "جارٍ حفظ التعديلات...",
    account: "بيانات حساب الدخول",
    accountDesc:
      "اسم الدخول وكلمة المرور المستخدمة للوصول إلى الإدارة المركزية.",
    profile: "بيانات المستخدم والتواصل",
    profileDesc:
      "الاسم ووسائل التواصل المرتبطة بالمستخدم.",
    access: "الدور والحالة",
    accessDesc:
      "حدد نطاق المستخدم والدور والفرع والحالة.",
    notes: "ملاحظات إدارية",
    notesDesc:
      "معلومات داخلية اختيارية لحساب الإدارة المركزية.",
    scope: "نطاق المستخدم",
    systemScope: "الإدارة المركزية",
    organizationScope: "المنشأة والفروع",
    systemScopeDesc:
      "حساب لإدارة النظام المركزية.",
    organizationScopeDesc:
      "مستخدم تشغيلي داخل المنشأة أو أحد الفروع.",
    username: "اسم الدخول",
    password: "كلمة المرور",
    firstName: "الاسم الأول",
    lastName: "الاسم الأخير",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    systemRole: "دور النظام",
    organizationRole: "الدور التشغيلي",
    branch: "الفرع",
    noBranch: "دون فرع محدد",
    status: "حالة المستخدم",
    notesLabel: "الملاحظات",
    active: "نشط",
    inactive: "غير نشط",
    endpoint: "واجهة الإنشاء",
    authentication: "المصادقة",
    sessionCsrf: "جلسة مستخدم + CSRF",
    loadingBranches: "جارٍ تحميل الفروع...",
    branchesFailed: "تعذر تحميل الفروع.",
    requiredSystem:
      "اسم الدخول وكلمة المرور مطلوبان، ويجب ألا تقل كلمة المرور عن 8 أحرف.",
    requiredOrganization:
      "البريد الإلكتروني مطلوب ويجب أن تكون صيغته صحيحة.",
    systemSuccess: "تم إنشاء مستخدم النظام بنجاح.",
    organizationSuccess:
      "تمت إضافة مستخدم المنشأة أو الفرع بنجاح.",
    organizationUpdated:
      "تم تحديث مستخدم المنشأة أو الفرع بنجاح.",
    loadingUser: "جارٍ تحميل بيانات المستخدم...",
    loadUserFailed: "تعذر تحميل بيانات المستخدم.",
    userNotFound: "لم يتم العثور على مستخدم المنشأة المطلوب.",
    failed: "تعذر حفظ المستخدم.",
    systemHint:
      "سيتم إنشاء الحساب من واجهة مستخدمي النظام المركزية.",
    organizationHint:
      "سيتم إنشاء المستخدم من واجهة مستخدمي المنشأة دون سجل إدخال مكرر.",
    editHint:
      "سيتم تحديث المستخدم عبر واجهة مستخدمي المنشأة مع الحفاظ على الحساب والسجلات المرتبطة به.",
    usernamePlaceholder: "support.user",
    emailPlaceholder: "user@marilyn.sa",
    phonePlaceholder: "05xxxxxxxx",
    notesPlaceholder:
      "أضف ملاحظة إدارية عند الحاجة...",
  },
  en: {
    module: "Access management",
    systemTitle: "Add system user",
    organizationTitle: "Add facility or branch user",
    organizationEditTitle: "Edit facility or branch user",
    systemSubtitle:
      "Create a central-administration login account and assign its system role and status.",
    organizationSubtitle:
      "Add an operational facility user and assign a role, branch, and work scope.",
    organizationEditSubtitle:
      "Update the operational user's details, role, branch, and status from the unified management page.",
    connected: "Connected to the live users APIs",
    back: "Back to users",
    create: "Create user",
    creating: "Creating...",
    saveChanges: "Save changes",
    savingChanges: "Saving changes...",
    account: "Login account",
    accountDesc:
      "Username and password used to access central administration.",
    profile: "User and contact details",
    profileDesc:
      "Name and contact information associated with the user.",
    access: "Role and status",
    accessDesc:
      "Choose the user scope, role, branch, and status.",
    notes: "Administrative notes",
    notesDesc:
      "Optional internal information for the central account.",
    scope: "User scope",
    systemScope: "Central administration",
    organizationScope: "Facility and branches",
    systemScopeDesc:
      "Account for central system administration.",
    organizationScopeDesc:
      "Operational user inside the facility or one of its branches.",
    username: "Username",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    systemRole: "System role",
    organizationRole: "Operational role",
    branch: "Branch",
    noBranch: "No specific branch",
    status: "User status",
    notesLabel: "Notes",
    active: "Active",
    inactive: "Inactive",
    endpoint: "Creation endpoint",
    authentication: "Authentication",
    sessionCsrf: "User session + CSRF",
    loadingBranches: "Loading branches...",
    branchesFailed: "Could not load branches.",
    requiredSystem:
      "Username and password are required. Password must contain at least 8 characters.",
    requiredOrganization:
      "A valid email address is required.",
    systemSuccess: "System user created successfully.",
    organizationSuccess:
      "Facility or branch user added successfully.",
    organizationUpdated:
      "Facility or branch user updated successfully.",
    loadingUser: "Loading user details...",
    loadUserFailed: "Could not load user details.",
    userNotFound: "The requested facility user was not found.",
    failed: "Could not save user.",
    systemHint:
      "The account will be created through the central system-users API.",
    organizationHint:
      "The user will be created through the facility-users API without a duplicate entry form.",
    editHint:
      "The user will be updated through the facility-users API while preserving the linked account and records.",
    usernamePlaceholder: "support.user",
    emailPlaceholder: "user@marilyn.sa",
    phonePlaceholder: "05xxxxxxxx",
    notesPlaceholder:
      "Add an administrative note when needed...",
  },
} as const;
const systemRoleLabels: Record<
  SystemRole,
  { ar: string; en: string }
> = {
  SUPER_ADMIN: {
    ar: "مدير أعلى",
    en: "Super admin",
  },
  SYSTEM_ADMIN: {
    ar: "مدير النظام",
    en: "System admin",
  },
  SUPPORT: {
    ar: "الدعم",
    en: "Support",
  },
  BILLING_MANAGER: {
    ar: "مدير الفوترة",
    en: "Billing manager",
  },
};
const organizationRoleLabels: Record<
  OrganizationRole,
  { ar: string; en: string }
> = {
  OWNER: {
    ar: "مالك",
    en: "Owner",
  },
  ADMIN: {
    ar: "مدير نظام",
    en: "Administrator",
  },
  MANAGER: {
    ar: "مدير",
    en: "Manager",
  },
  ACCOUNTANT: {
    ar: "محاسب",
    en: "Accountant",
  },
  CASHIER: {
    ar: "أمين صندوق",
    en: "Cashier",
  },
  SALES: {
    ar: "مبيعات",
    en: "Sales",
  },
  INVENTORY: {
    ar: "مخزون",
    en: "Inventory",
  },
  HR: {
    ar: "موارد بشرية",
    en: "Human resources",
  },
  EMPLOYEE: {
    ar: "موظف",
    en: "Employee",
  },
  VIEWER: {
    ar: "مشاهد",
    en: "Viewer",
  },
};
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
  return isRecord(value)
    ? value
    : {};
}
function text(
  value: unknown,
): string {
  return value === null ||
    value === undefined
    ? ""
    : String(value).trim();
}
function normalizeList(
  payload: unknown,
): ApiRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(asRecord);
  }
  const source = asRecord(payload);
  const data = asRecord(source.data);
  const candidates = [
    source.results,
    source.items,
    source.rows,
    source.data,
    data.results,
    data.items,
    data.rows,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(asRecord);
    }
  }
  return [];
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
function getCookie(
  name: string,
): string {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith(`${name}=`)
    );
  return match
    ? decodeURIComponent(
        match.slice(name.length + 1),
      )
    : "";
}
async function ensureCsrfToken(): Promise<string> {
  let token = getCookie("csrftoken");
  if (token) return token;
  await fetch(
    makeApiUrl(CSRF_ENDPOINT),
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Requested-With":
          "XMLHttpRequest",
      },
    },
  );
  token = getCookie("csrftoken");
  return token;
}
function extractError(
  payload: unknown,
): string {
  if (typeof payload === "string") {
    return payload.slice(0, 400);
  }
  const source = asRecord(payload);
  const direct =
    source.detail ||
    source.message ||
    source.error;
  if (Array.isArray(direct)) {
    return direct.map(String).join(" ");
  }
  if (direct) {
    return String(direct);
  }
  const first = Object.entries(source)[0];
  if (!first) return "";
  return Array.isArray(first[1])
    ? `${first[0]}: ${first[1]
        .map(String)
        .join(" ")}`
    : `${first[0]}: ${String(first[1])}`;
}
async function requestJson(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const method = (
    options.method || "GET"
  ).toUpperCase();
  const headers = new Headers(
    options.headers,
  );
  headers.set(
    "Accept",
    "application/json",
  );
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
    !["GET", "HEAD", "OPTIONS"].includes(
      method,
    )
  ) {
    const csrfToken =
      await ensureCsrfToken();
    if (csrfToken) {
      headers.set(
        "X-CSRFToken",
        csrfToken,
      );
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
  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }
  if (!response.ok) {
    throw new Error(
      extractError(payload) ||
        `${response.status} ${response.statusText}`,
    );
  }
  return payload;
}
function extractCreatedUserId(
  payload: unknown,
): string {
  const source = asRecord(payload);
  const data = asRecord(source.data);
  const user = asRecord(
    source.user ||
      data.user ||
      source.account ||
      data.account,
  );
  const nestedId = text(
    user.id ||
      user.user_id ||
      user.pk ||
      user.uuid,
  );
  if (nestedId) {
    return nestedId;
  }
  const explicitId = text(
    source.user_id ||
      data.user_id ||
      source.account_id ||
      data.account_id,
  );
  if (explicitId) {
    return explicitId;
  }
  const looksLikeUser = Boolean(
    source.username ||
      source.system_role ||
      source.access_type,
  );
  return looksLikeUser
    ? text(
        source.id ||
          source.pk ||
          source.uuid,
      )
    : "";
}
function normalizeBranch(
  row: ApiRecord,
): BranchOption | null {
  const id = text(
    row.id ||
      row.pk ||
      row.uuid,
  );
  if (!id) return null;
  return {
    id,
    name:
      text(
        row.name ||
          row.branch_name ||
          row.title,
      ) || id,
    code: text(
      row.code ||
        row.branch_code ||
        row.reference,
    ),
  };
}
function booleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized =
      value.trim().toLowerCase();
    if (
      [
        "true",
        "1",
        "active",
        "enabled",
      ].includes(normalized)
    ) {
      return true;
    }
    if (
      [
        "false",
        "0",
        "inactive",
        "disabled",
      ].includes(normalized)
    ) {
      return false;
    }
  }
  return fallback;
}
function getOrganizationMembershipId(
  row: ApiRecord,
): string {
  return text(
    row.id ||
      row.pk ||
      row.uuid ||
      row.key,
  );
}
function getOrganizationEditForm(
  row: ApiRecord,
): Partial<FormState> {
  const user = asRecord(row.user);
  const membership = asRecord(
    row.membership,
  );
  const branch = asRecord(row.branch);
  const fullName = text(
    row.full_name ||
      row.name ||
      row.display_name ||
      user.full_name ||
      user.name ||
      user.display_name ||
      user.username,
  );
  const nameParts = fullName
    .split(/\s+/)
    .filter(Boolean);
  const fallbackFirstName =
    nameParts.shift() || "";
  const fallbackLastName =
    nameParts.join(" ");
  const roleCandidate = text(
    row.role ||
      row.role_key ||
      row.role_code ||
      membership.role ||
      membership.role_key ||
      membership.role_code,
  ).toUpperCase();
  const organizationRole =
    ORGANIZATION_ROLES.includes(
      roleCandidate as OrganizationRole,
    )
      ? roleCandidate as OrganizationRole
      : "VIEWER";
  const activeValue =
    row.is_active ??
    membership.is_active ??
    user.is_active ??
    row.active ??
    membership.active ??
    user.active;
  return {
    first_name:
      text(
        row.first_name ||
          user.first_name,
      ) || fallbackFirstName,
    last_name:
      text(
        row.last_name ||
          user.last_name,
      ) || fallbackLastName,
    email: text(
      row.email ||
        user.email,
    ),
    phone: text(
      row.phone ||
        row.mobile ||
        row.contact_phone ||
        user.phone ||
        user.mobile ||
        user.contact_phone,
    ),
    organization_role:
      organizationRole,
    branch_id: text(
      row.branch_id ||
        membership.branch_id ||
        branch.id ||
        branch.pk ||
        branch.uuid,
    ),
    status: booleanValue(
      activeValue,
      true,
    )
      ? "active"
      : "inactive",
  };
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
export function UnifiedUserEntryPage({
  initialScope = "system",
  initialEditId = "",
}: UnifiedUserEntryPageProps) {
  const router = useRouter();
  const [locale, setLocale] =
    React.useState<Locale>("ar");
  const [scope, setScope] =
    React.useState<CreateScope>(
      initialScope,
    );
  const [form, setForm] =
    React.useState<FormState>(
      initialForm,
    );
  const [branches, setBranches] =
    React.useState<BranchOption[]>([]);
  const [
    branchesLoading,
    setBranchesLoading,
  ] = React.useState(false);
  const [
    branchesError,
    setBranchesError,
  ] = React.useState("");
  const [saving, setSaving] =
    React.useState(false);
  const [editId, setEditId] =
    React.useState(
      initialScope === "organization"
        ? initialEditId
        : "",
    );
  const [
    loadingEdit,
    setLoadingEdit,
  ] = React.useState(false);
  const t = translations[locale];
  const dir =
    locale === "ar"
      ? "rtl"
      : "ltr";
  const isOrganization =
    scope === "organization";
  const isEditingOrganization =
    isOrganization &&
    Boolean(editId);
  const endpoint =
    isEditingOrganization
      ? `${ORGANIZATION_USERS_ENDPOINT}${encodeURIComponent(
          editId,
        )}/`
      : isOrganization
        ? ORGANIZATION_USERS_ENDPOINT
        : SYSTEM_USERS_ENDPOINT;
  const backHref = isOrganization
    ? "/system/users/organization"
    : "/system/users";
  const title =
    isEditingOrganization
      ? t.organizationEditTitle
      : isOrganization
        ? t.organizationTitle
        : t.systemTitle;
  const subtitle =
    isEditingOrganization
      ? t.organizationEditSubtitle
      : isOrganization
        ? t.organizationSubtitle
        : t.systemSubtitle;
  const submitLabel =
    isEditingOrganization
      ? t.saveChanges
      : t.create;
  const savingLabel =
    isEditingOrganization
      ? t.savingChanges
      : t.creating;
  const fullName = [
    form.first_name.trim(),
    form.last_name.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim(),
    );
  const isReady =
    !loadingEdit &&
    (
      isOrganization
        ? emailValid
        : (
            form.username.trim().length > 0 &&
            form.password.length >= 8
          )
    );
  React.useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );
    const queryScope =
      params.get("scope");
    const requestedScope =
      queryScope === "organization"
        ? "organization"
        : initialScope;
    const requestedEditId =
      text(
        params.get("edit") ||
          initialEditId,
      );
    setScope(requestedScope);
    setEditId(
      requestedScope === "organization"
        ? requestedEditId
        : "",
    );
  }, [
    initialEditId,
    initialScope,
  ]);
  React.useEffect(() => {
    const applyLocale = () => {
      const next = getInitialLocale();
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
  React.useEffect(() => {
    if (!isOrganization) {
      setLoadingEdit(false);
      return;
    }
    let cancelled = false;
    async function loadOrganizationContext() {
      try {
        setBranchesLoading(true);
        setLoadingEdit(
          Boolean(editId),
        );
        setBranchesError("");
        const [
          branchesPayload,
          usersPayload,
        ] = await Promise.all([
          requestJson(
            BRANCHES_ENDPOINT,
          ),
          editId
            ? requestJson(
                ORGANIZATION_USERS_ENDPOINT,
              )
            : Promise.resolve([]),
        ]);
        const options =
          normalizeList(
            branchesPayload,
          )
            .map(normalizeBranch)
            .filter(
              (
                item,
              ): item is BranchOption =>
                item !== null,
            );
        if (cancelled) {
          return;
        }
        setBranches(options);
        if (editId) {
          const editRow =
            normalizeList(
              usersPayload,
            ).find(
              (row) =>
                getOrganizationMembershipId(
                  row,
                ) === editId,
            );
          if (!editRow) {
            throw new Error(
              t.userNotFound,
            );
          }
          setForm((current) => ({
            ...current,
            ...getOrganizationEditForm(
              editRow,
            ),
          }));
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : editId
                ? t.loadUserFailed
                : t.branchesFailed;
          setBranchesError(message);
          if (editId) {
            toast.error(
              t.loadUserFailed,
              {
                description:
                  message,
              },
            );
          }
        }
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
          setLoadingEdit(false);
        }
      }
    }
    void loadOrganizationContext();
    return () => {
      cancelled = true;
    };
  }, [
    editId,
    isOrganization,
    t.branchesFailed,
    t.loadUserFailed,
    t.userNotFound,
  ]);
  function updateField<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }
  function changeScope(
    next: CreateScope,
  ) {
    setScope(next);
    router.replace(
      next === "organization"
        ? "/system/users/create?scope=organization"
        : "/system/users/create",
    );
  }
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!isReady) {
      toast.error(
        isOrganization
          ? t.requiredOrganization
          : t.requiredSystem,
      );
      return;
    }
    setSaving(true);
    try {
      let payload: ApiRecord;
      if (isOrganization) {
        payload = {
          full_name: fullName,
          email: form.email.trim(),
          role:
            form.organization_role,
          is_active:
            form.status === "active",
        };
        if (form.phone.trim()) {
          payload.phone =
            form.phone.trim();
        }
        if (form.branch_id) {
          payload.branch_id =
            form.branch_id;
        }
      } else {
        payload = {
          username: form.username
            .trim()
            .replace(/\s+/g, ".")
            .toLowerCase(),
          password: form.password,
          system_role:
            form.system_role,
          access_type: "system",
          is_active:
            form.status === "active",
        };
        if (form.email.trim()) {
          payload.email =
            form.email.trim();
        }
        if (form.first_name.trim()) {
          payload.first_name =
            form.first_name.trim();
        }
        if (form.last_name.trim()) {
          payload.last_name =
            form.last_name.trim();
        }
        if (form.phone.trim()) {
          payload.phone =
            form.phone.trim();
        }
        if (form.notes.trim()) {
          payload.status_reason =
            form.notes.trim();
        }
      }
      const response =
        await requestJson(
          endpoint,
          {
            method:
              isEditingOrganization
                ? "PATCH"
                : "POST",
            body: JSON.stringify(
              payload,
            ),
          },
        );
      const userId =
        extractCreatedUserId(
          response,
        );
      toast.success(
        isEditingOrganization
          ? t.organizationUpdated
          : isOrganization
            ? t.organizationSuccess
            : t.systemSuccess,
      );
      if (isEditingOrganization) {
        router.push(
          "/system/users/organization",
        );
        return;
      }
      if (userId) {
        router.push(
          `/system/users/${encodeURIComponent(
            userId,
          )}`,
        );
        return;
      }
      router.push(
        isOrganization
          ? "/system/users/organization"
          : "/system/users",
      );
    } catch (error) {
      toast.error(t.failed, {
        description:
          error instanceof Error
            ? error.message
            : t.failed,
      });
    } finally {
      setSaving(false);
    }
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
              <UserPlus className="h-4 w-4" />
              {t.module}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {subtitle}
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
              className={
                registerOutlineButtonClass
              }
            >
              <Link href={backHref}>
                <ArrowRight className="h-4 w-4" />
                {t.back}
              </Link>
            </Button>
            <Button
              type="submit"
              form="unified-create-user-form"
              variant="brand"
              className={
                registerBrandButtonClass
              }
              disabled={
                saving ||
                !isReady
              }
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? savingLabel
                : submitLabel}
            </Button>
          </div>
        </header>
        <AccessManagementTabs
          active={
            isOrganization
              ? "organization"
              : "accounts"
          }
        />
        {loadingEdit ? (
          <Card className="rounded-lg border bg-card shadow-none">
            <CardContent className="flex min-h-24 items-center justify-center gap-3 px-5 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#a57b3d]" />
              {t.loadingUser}
            </CardContent>
          </Card>
        ) : null}
        <form
          id="unified-create-user-form"
          onSubmit={handleSubmit}
          className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="space-y-5">
            {!isOrganization ? (
              <Card className="rounded-lg border bg-card shadow-none">
                <CardHeader className="px-5 pt-5 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                    <LockKeyhole className="h-4 w-4 text-[#a57b3d]" />
                    {t.account}
                  </CardTitle>
                  <CardDescription className="leading-6">
                    {t.accountDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      {t.username} *
                    </Label>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(event) =>
                        updateField(
                          "username",
                          event.target.value,
                        )
                      }
                      placeholder={
                        t.usernamePlaceholder
                      }
                      autoComplete="username"
                      className="h-10 bg-background shadow-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {t.password} *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value,
                        )
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={8}
                      className="h-10 bg-background shadow-none"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
            <Card className="rounded-lg border bg-card shadow-none">
              <CardHeader className="px-5 pt-5 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <UserRound className="h-4 w-4 text-[#a57b3d]" />
                  {t.profile}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.profileDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="first-name">
                    {t.firstName}
                  </Label>
                  <Input
                    id="first-name"
                    value={form.first_name}
                    onChange={(event) =>
                      updateField(
                        "first_name",
                        event.target.value,
                      )
                    }
                    autoComplete="given-name"
                    className="h-10 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">
                    {t.lastName}
                  </Label>
                  <Input
                    id="last-name"
                    value={form.last_name}
                    onChange={(event) =>
                      updateField(
                        "last_name",
                        event.target.value,
                      )
                    }
                    autoComplete="family-name"
                    className="h-10 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#a57b3d]" />
                      {t.email}
                      {isOrganization
                        ? " *"
                        : ""}
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder={
                      t.emailPlaceholder
                    }
                    autoComplete="email"
                    className="h-10 bg-background shadow-none"
                    required={
                      isOrganization
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#a57b3d]" />
                      {t.phone}
                    </span>
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder={
                      t.phonePlaceholder
                    }
                    autoComplete="tel"
                    dir="ltr"
                    className="h-10 bg-background text-start shadow-none"
                  />
                </div>
              </CardContent>
            </Card>
            {!isOrganization ? (
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
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      {t.notesLabel}
                    </Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(event) =>
                        updateField(
                          "notes",
                          event.target.value,
                        )
                      }
                      placeholder={
                        t.notesPlaceholder
                      }
                      className="min-h-28 resize-y bg-background shadow-none"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
          <aside className="space-y-5">
            <Card className="rounded-lg border bg-card shadow-none xl:sticky xl:top-6">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <ShieldCheck className="h-4 w-4 text-[#a57b3d]" />
                  {t.access}
                </CardTitle>
                <CardDescription className="leading-6">
                  {t.accessDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5">
                <div className="space-y-2">
                  <Label>
                    {t.scope}
                  </Label>
                  <Select
                    value={scope}
                    disabled={
                      isEditingOrganization
                    }
                    onValueChange={(value) =>
                      changeScope(
                        value as CreateScope,
                      )
                    }
                  >
                    <SelectTrigger className="h-10 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">
                        {t.systemScope}
                      </SelectItem>
                      <SelectItem value="organization">
                        {t.organizationScope}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {isOrganization
                      ? t.organizationScopeDesc
                      : t.systemScopeDesc}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    {isOrganization
                      ? t.organizationRole
                      : t.systemRole}
                  </Label>
                  {isOrganization ? (
                    <Select
                      value={
                        form.organization_role
                      }
                      onValueChange={(value) =>
                        updateField(
                          "organization_role",
                          value as OrganizationRole,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 bg-background shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGANIZATION_ROLES.map(
                          (role) => (
                            <SelectItem
                              key={role}
                              value={role}
                            >
                              {
                                organizationRoleLabels[
                                  role
                                ][locale]
                              }
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={
                        form.system_role
                      }
                      onValueChange={(value) =>
                        updateField(
                          "system_role",
                          value as SystemRole,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 bg-background shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_ROLES.map(
                          (role) => (
                            <SelectItem
                              key={role}
                              value={role}
                            >
                              {
                                systemRoleLabels[
                                  role
                                ][locale]
                              }
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {isOrganization ? (
                  <div className="space-y-2">
                    <Label>
                      {t.branch}
                    </Label>
                    <Select
                      value={
                        form.branch_id ||
                        "__none__"
                      }
                      onValueChange={(value) =>
                        updateField(
                          "branch_id",
                          value === "__none__"
                            ? ""
                            : value,
                        )
                      }
                      disabled={
                        branchesLoading
                      }
                    >
                      <SelectTrigger className="h-10 bg-background shadow-none">
                        <MapPin className="me-2 h-4 w-4 text-[#a57b3d]" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t.noBranch}
                        </SelectItem>
                        {branches.map(
                          (branch) => (
                            <SelectItem
                              key={branch.id}
                              value={branch.id}
                            >
                              {branch.name}
                              {branch.code
                                ? ` — ${branch.code}`
                                : ""}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {branchesLoading ? (
                      <p className="text-xs text-muted-foreground">
                        {t.loadingBranches}
                      </p>
                    ) : null}
                    {branchesError ? (
                      <p className="text-xs text-amber-700">
                        {branchesError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>
                    {t.status}
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateField(
                        "status",
                        value as FormState["status"],
                      )
                    }
                  >
                    <SelectTrigger className="h-10 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t.active}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t.inactive}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t.endpoint}
                    </span>
                    <code
                      dir="ltr"
                      className="break-all text-xs font-medium"
                    >
                      {endpoint}
                    </code>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t.authentication}
                    </span>
                    <span className="text-xs font-medium">
                      {t.sessionCsrf}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-800">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
                  <span>
                    {isEditingOrganization
                      ? t.editHint
                      : isOrganization
                        ? t.organizationHint
                        : t.systemHint}
                  </span>
                </div>
                <Button
                  type="submit"
                  variant="brand"
                  className={`w-full ${registerBrandButtonClass}`}
                  disabled={
                    saving ||
                    !isReady
                  }
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isOrganization ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {saving
                ? savingLabel
                : submitLabel}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>
    </main>
  );
}
