"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileHeart,
  HeartPulse,
  Languages,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* =========================================================
   Marilyn Clinics - Unified Login Page
   Path: marilyn_frontend/app/(guest)/login/page.tsx

   - صفحة دخول واحدة لجميع المستخدمين.
   - التوجيه بعد الدخول حسب whoami/dashboard_path.
   - لا توجد واجهات دخول مستقلة للأدوار.
   - CSRF + Cookies Session.
   - Arabic / English.
   - RTL / LTR.
   - Sonner Toasts.
   - جميع العناصر مبنية من UI المشروع دون مصادر خارجية.
========================================================= */

type AppLocale = "ar" | "en";
type LoginMode = "system" | "company";

type MembershipSnapshot = {
  company_id?: number | string | null;
  role?: string | null;
  workspace?: string | null;
  company?: {
    id?: number | string | null;
  } | null;
};

type WhoAmIResponse = {
  authenticated?: boolean;
  workspace?: string | null;
  dashboard_path?: string | null;
  is_system_user?: boolean;
  is_superuser?: boolean;
  is_staff?: boolean;
  role?: string | null;
  user_type?: string | null;
  scope_type?: string | null;
  company_id?: number | string | null;
  default_company_id?: number | string | null;
  agent_id?: number | string | null;
  default_membership?: MembershipSnapshot | null;
  memberships?: MembershipSnapshot[] | null;
  permissions?: {
    is_superuser?: boolean;
    is_staff?: boolean;
    groups?: string[];
  } | null;
  profile?: {
    role?: string | null;
    user_type?: string | null;
    extra_data?: Record<string, unknown> | null;
  } | null;
};

type JsonObject = Record<string, unknown>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
const FALLBACK_LOGIN_MODE: LoginMode = "company";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }

  return null;
}

function resolveApiUrl(path: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${safePath}` : safePath;
}

function normalizeUpper(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function extractBoolean(value: unknown): boolean {
  return value === true;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(value: unknown): string {
  if (asString(value)) return asString(value);

  if (Array.isArray(value)) {
    const found = value.find((item) => asString(item));
    return asString(found);
  }

  return "";
}

function extractApiMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const payload = data as JsonObject;

  const directMessage =
    firstString(payload.message) ||
    firstString(payload.detail) ||
    firstString(payload.error) ||
    firstString(payload.non_field_errors);

  if (directMessage) return directMessage;

  const errors = payload.errors;

  if (errors && typeof errors === "object") {
    const firstValue = Object.values(errors as JsonObject)[0];
    const message = firstString(firstValue);

    if (message) return message;
  }

  return fallback;
}

function toPositiveId(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function extractIds(user: WhoAmIResponse | null) {
  const profileExtra = user?.profile?.extra_data ?? {};
  const defaultMembership = user?.default_membership ?? null;
  const firstMembership = Array.isArray(user?.memberships)
    ? user.memberships[0]
    : null;

  return {
    companyId: toPositiveId(
      user?.company_id ??
        user?.default_company_id ??
        defaultMembership?.company_id ??
        defaultMembership?.company?.id ??
        firstMembership?.company_id ??
        firstMembership?.company?.id ??
        profileExtra["company_id"] ??
        profileExtra["default_company_id"]
    ),
    agentId: toPositiveId(user?.agent_id ?? profileExtra["agent_id"]),
  };
}

function isSystemUser(user: WhoAmIResponse | null): boolean {
  if (!user) return false;

  const normalizedRole = normalizeUpper(
    user.role || user.profile?.role || user.default_membership?.role
  );

  const normalizedUserType = normalizeUpper(
    user.user_type || user.profile?.user_type
  );

  const normalizedScope = normalizeUpper(user.scope_type || user.workspace);
  const permissions = user.permissions || {};

  const groups = Array.isArray(permissions.groups)
    ? permissions.groups.map((item) => normalizeUpper(item))
    : [];

  const systemRoles = [
    "SYSTEM",
    "SUPER_ADMIN",
    "SYSTEM_ADMIN",
    "SUPPORT",
    "BILLING_MANAGER",
    "INTERNAL",
  ];

  return (
    extractBoolean(user.is_system_user) ||
    extractBoolean(user.is_superuser) ||
    extractBoolean(user.is_staff) ||
    extractBoolean(permissions.is_superuser) ||
    extractBoolean(permissions.is_staff) ||
    systemRoles.includes(normalizedRole) ||
    systemRoles.includes(normalizedUserType) ||
    normalizedScope === "SYSTEM" ||
    groups.some((group) => systemRoles.includes(group))
  );
}

function resolveRedirectPath(
  user: WhoAmIResponse | null,
  preferredMode: LoginMode
): string {
  if (!user) {
    return preferredMode === "company" ? "/company" : "/system";
  }

  const dashboardPath = String(user.dashboard_path || "").trim();

  if (dashboardPath.startsWith("/")) {
    return dashboardPath;
  }

  const workspace = normalizeUpper(
    user.workspace || user.scope_type || user.default_membership?.workspace
  );

  const { companyId, agentId } = extractIds(user);
  const role = normalizeUpper(user.role || user.profile?.role);

  if (workspace === "SYSTEM" || isSystemUser(user)) {
    return "/system";
  }

  if (workspace === "COMPANY" || companyId) {
    return "/company";
  }

  if (workspace === "AGENT" || role === "AGENT" || agentId) {
    return "/agent";
  }

  return preferredMode === "company" ? "/company" : "/system";
}

async function prepareCsrf(errorMessage: string): Promise<string> {
  const csrfResponse = await fetch(resolveApiUrl("/api/auth/csrf/"), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!csrfResponse.ok) {
    throw new Error(errorMessage);
  }

  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(errorMessage);
  }

  return csrfToken;
}

export default function Page() {
  const router = useRouter();

  const [locale, setLocale] = useState<AppLocale>("ar");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const content = useMemo(
    () => ({
      title: isArabic ? "مرحبا بعودتك" : "Welcome Back",
      subtitle: isArabic
        ? "سجل الدخول للمتابعة إلى Marilyn Clinics"
        : "Sign in to continue to Marilyn Clinics",

      usernameLabel: isArabic ? "اسم المستخدم" : "Username",
      usernamePlaceholder: isArabic
        ? "أدخل اسم المستخدم"
        : "Enter your username",

      passwordLabel: isArabic ? "كلمة المرور" : "Password",
      passwordPlaceholder: isArabic
        ? "أدخل كلمة المرور"
        : "Enter your password",

      remember: isArabic ? "تذكرني" : "Remember me",
      resetPassword: isArabic ? "نسيت كلمة المرور" : "Forgot password?",
      login: isArabic ? "تسجيل الدخول" : "Log in",
      loading: isArabic ? "جار تسجيل الدخول..." : "Signing in...",

      languageButton: isArabic ? "English" : "العربية",
      passwordShow: isArabic ? "إظهار كلمة المرور" : "Show password",
      passwordHide: isArabic ? "إخفاء كلمة المرور" : "Hide password",

      secureBadge: isArabic
        ? "دخول آمن ومحمي"
        : "Secure protected access",

      securityFooter: isArabic
        ? "يتم توجيهك تلقائيا حسب دورك وصلاحياتك ونطاق المنشأة أو الفرع."
        : "You will be routed automatically based on your role, permissions, organization, and branch scope.",

      requiredFields: isArabic
        ? "يرجى تعبئة اسم المستخدم وكلمة المرور"
        : "Please enter your username and password",

      invalidCredentials: isArabic
        ? "اسم المستخدم أو كلمة المرور غير صحيحة"
        : "Invalid username or password",

      csrfMissing: isArabic
        ? "تعذر تجهيز جلسة الأمان حاول مرة أخرى"
        : "Unable to initialize the secure session. Please try again.",

      sessionFailed: isArabic
        ? "تم تسجيل الدخول لكن تعذر التحقق من الجلسة"
        : "Signed in, but session validation failed",

      loginFailed: isArabic ? "فشل تسجيل الدخول" : "Login failed",
      loginSuccess: isArabic
        ? "تم تسجيل الدخول بنجاح"
        : "Signed in successfully",

      visualEyebrow: isArabic
        ? "رعاية مصممة حول المريض"
        : "CAREFULLY DESIGNED FOR CARE",

      visualTopLine: isArabic
        ? "تقنية متطورة. تجربة إنسانية."
        : "SMART TECHNOLOGY. HUMAN EXPERIENCE.",

      visualTitleOne: isArabic ? "الجمال." : "Beauty.",
      visualTitleTwo: isArabic ? "العناية." : "Care.",
      visualTitleThree: isArabic ? "بمستوى أرقى." : "Elevated.",

      visualDescription: isArabic
        ? "تجربة متكاملة لإدارة العيادات والمواعيد والملفات الطبية والمدفوعات مصممة لتقديم رعاية أكثر سلاسة وخصوصية."
        : "A complete experience for clinics, appointments, medical records, and payments—designed for smoother, more private care.",

      visualAction: isArabic ? "اكتشف التجربة" : "Explore the experience",

      featureOne: isArabic ? "تجربة شخصية" : "Personal Care",
      featureTwo: isArabic ? "ملفات آمنة" : "Secure Records",
      featureThree: isArabic ? "مواعيد ذكية" : "Smart Booking",

      bottleLabel: isArabic ? "عناية متكاملة" : "COMPLETE CARE",
      bottleSubLabel: "MARILYN",
    }),
    [isArabic]
  );

  useEffect(() => {
    try {
      const savedLocale =
        typeof window !== "undefined"
          ? ((window.localStorage.getItem("marilyn-locale") ||
              window.localStorage.getItem("Mhamcloud-locale") ||
              window.localStorage.getItem("primey-locale")) as AppLocale | null)
          : null;

      const nextLocale: AppLocale = savedLocale === "en" ? "en" : "ar";

      setLocale(nextLocale);

      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
        document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
        document.body.setAttribute("dir", nextLocale === "ar" ? "rtl" : "ltr");
      }
    } catch (err) {
      console.error("Login locale initialization error:", err);
    }
  }, []);

  const toggleLanguage = () => {
    try {
      const nextLocale: AppLocale = locale === "ar" ? "en" : "ar";

      setLocale(nextLocale);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("marilyn-locale", nextLocale);
        window.localStorage.setItem("primey-locale", nextLocale);
      }

      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
        document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
        document.body.setAttribute("dir", nextLocale === "ar" ? "rtl" : "ltr");
      }
    } catch (err) {
      console.error("Login language toggle error:", err);
    }
  };

  const fetchWhoamiAndRedirect = async () => {
    const whoamiResponse = await fetch(resolveApiUrl("/api/auth/whoami/"), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!whoamiResponse.ok) {
      throw new Error(content.sessionFailed);
    }

    const user = (await whoamiResponse.json()) as WhoAmIResponse;
    const redirectPath = resolveRedirectPath(user, FALLBACK_LOGIN_MODE);

    router.replace(redirectPath);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    if (!username.trim() || !password.trim()) {
      setError(content.requiredFields);
      toast.error(content.requiredFields);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csrfToken = await prepareCsrf(content.csrfMissing);

      const loginResponse = await fetch(resolveApiUrl("/api/auth/login/"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember,
        }),
      });

      if (!loginResponse.ok) {
        let payload: unknown = null;

        try {
          payload = await loginResponse.json();
        } catch {
          payload = null;
        }

        throw new Error(extractApiMessage(payload, content.invalidCredentials));
      }

      toast.success(content.loginSuccess);
      await fetchWhoamiAndRedirect();
    } catch (err) {
      const message = err instanceof Error ? err.message : content.loginFailed;

      setError(message);
      toast.error(message);
      console.error("Marilyn Clinics login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative h-dvh overflow-hidden bg-[#e9e1d7] text-[#29241f]"
    >
      <style jsx global>{`
        #login-form input:-webkit-autofill,
        #login-form input:-webkit-autofill:hover,
        #login-form input:-webkit-autofill:focus,
        #login-form input:-webkit-autofill:active {
          -webkit-text-fill-color: #2f2a25 !important;
          caret-color: #2f2a25;
          -webkit-box-shadow:
            0 0 0 1000px rgba(249, 246, 241, 0.96) inset !important;
          box-shadow:
            0 0 0 1000px rgba(249, 246, 241, 0.96) inset !important;
          transition: background-color 9999s ease-out 0s;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.92),transparent_31%),radial-gradient(circle_at_88%_76%,rgba(206,180,138,0.2),transparent_34%),linear-gradient(145deg,#eee7de_0%,#e7ded3_44%,#f0ebe4_100%)]" />

        <div className="absolute -left-24 top-[-5rem] h-[30rem] w-[11rem] rotate-[38deg] rounded-full bg-white/50 blur-2xl" />
        <div className="absolute left-[10%] top-[-8rem] h-[32rem] w-[5rem] rotate-[38deg] rounded-full bg-white/35 blur-xl" />
        <div className="absolute right-[4%] top-0 h-full w-px bg-white/40" />
        <div className="absolute right-[5.5%] top-0 h-full w-px bg-[#c6b8a5]/25" />
        <div className="absolute right-[7%] top-0 h-full w-px bg-white/40" />

        <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full border-[44px] border-white/25 blur-[1px]" />
        <div className="absolute -bottom-36 right-[-5rem] h-96 w-96 rounded-full bg-[#d8c2a4]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-dvh w-full max-w-[1440px] items-center justify-center px-2 py-2 sm:px-4 sm:py-3 lg:px-6 xl:px-10">
        <div
          dir="ltr"
          className="grid h-full w-full max-w-[600px] items-center gap-3 xl:max-w-[1240px] xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] xl:gap-5"
        >
          <section
            id="login-form"
            dir={isArabic ? "rtl" : "ltr"}
            className="relative flex h-[calc(100dvh-1rem)] max-h-[760px] min-h-0 overflow-hidden rounded-[30px] border border-white/80 bg-[rgba(247,243,237,0.9)] shadow-[0_28px_90px_rgba(86,65,42,0.16)] backdrop-blur-xl sm:h-[calc(100dvh-1.5rem)] sm:rounded-[38px]"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/65 to-transparent" />
              <div className="absolute -right-20 top-24 h-48 w-48 rounded-full bg-[#d6b878]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto grid h-full min-h-0 w-full max-w-[520px] grid-rows-[auto_minmax(0,1fr)_auto] px-4 py-3 sm:px-7 sm:py-4 lg:px-9 lg:py-5">
              <header className="relative flex min-h-[72px] items-center justify-center sm:min-h-[78px] [@media(max-height:720px)]:min-h-[58px]">
                <Image
                  src="/logo/marilyn.svg"
                  alt="Marilyn Clinics"
                  width={156}
                  height={52}
                  priority
                  className="absolute left-1/2 top-1/2 h-auto w-[104px] -translate-x-1/2 -translate-y-1/2 object-contain sm:w-[118px] xl:top-[58%] [@media(max-height:720px)]:w-[96px]"
                />

                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="absolute end-0 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-full border border-[#cbbda9]/65 bg-white/55 px-2.5 text-xs font-semibold text-[#6d6154] shadow-sm backdrop-blur transition hover:border-[#b89b69] hover:bg-white/80 hover:text-[#3f382f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b99150]/35 sm:h-10 sm:gap-2 sm:px-3"
                  aria-label={content.languageButton}
                >
                  <Languages className="h-4 w-4" />
                  <span>{isArabic ? "EN" : "عربي"}</span>
                </button>
              </header>

              <div className="flex min-h-0 flex-col justify-start overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:py-4 xl:justify-center [@media(max-height:720px)]:py-1">
                <div
                  className={`mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#cdbb9e]/55 bg-white/50 px-3 py-1.5 text-xs font-semibold text-[#78664e] ${
                    isArabic ? "self-start" : "self-start"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-[#ae874a]" />
                  <span>{content.secureBadge}</span>
                </div>

                <div className={isArabic ? "text-right" : "text-left"}>
                  <h1
                    className={`text-[2.2rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[#29241f] sm:text-[2.85rem] [@media(max-height:720px)]:text-[2rem] ${
                      isArabic ? "font-sans" : "font-serif"
                    }`}
                  >
                    {content.title}
                  </h1>

                  <p className="mt-3 text-sm leading-7 text-[#756d63] sm:text-base">
                    {content.subtitle}
                  </p>
                </div>

                <form
                  onSubmit={handleLoginSubmit}
                  className="mt-4 space-y-3 [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:space-y-2.5"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-username"
                      className="block text-sm font-semibold text-[#4b443c]"
                    >
                      {content.usernameLabel}
                    </label>

                    <div className="relative">
                      <UserRound
                        className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6e675f] ${
                          isArabic ? "right-5" : "left-5"
                        }`}
                      />

                      <Input
                        id="login-username"
                        name="username"
                        required
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        dir={isArabic ? "rtl" : "ltr"}
                        placeholder={content.usernamePlaceholder}
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value);
                          setError(null);
                        }}
                        className={`h-[52px] rounded-[18px] border border-white/80 bg-[rgba(255,255,255,0.58)] text-[15px] text-[#2f2a25] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(112,91,64,0.06)] placeholder:text-[#958c81] focus-visible:border-[#bf9b61] focus-visible:ring-2 focus-visible:ring-[#c8a86e]/20 ${
                          isArabic
                            ? "pr-14 pl-5 text-right"
                            : "pl-14 pr-5 text-left"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-[#4b443c]"
                    >
                      {content.passwordLabel}
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6e675f] ${
                          isArabic ? "right-5" : "left-5"
                        }`}
                      />

                      <Input
                        id="login-password"
                        name="password"
                        required
                        autoComplete="current-password"
                        type={showPassword ? "text" : "password"}
                        dir={isArabic ? "rtl" : "ltr"}
                        placeholder={content.passwordPlaceholder}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError(null);
                        }}
                        className={`h-[52px] rounded-[18px] border border-white/80 bg-[rgba(255,255,255,0.58)] text-[15px] text-[#2f2a25] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(112,91,64,0.06)] placeholder:text-[#958c81] focus-visible:border-[#bf9b61] focus-visible:ring-2 focus-visible:ring-[#c8a86e]/20 ${
                          isArabic
                            ? "pr-14 pl-14 text-right"
                            : "pl-14 pr-14 text-left"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#6c655d] transition hover:bg-[#e9dfd2]/70 hover:text-[#342e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a86e]/30 ${
                          isArabic ? "left-2.5" : "right-2.5"
                        }`}
                        aria-label={
                          showPassword
                            ? content.passwordHide
                            : content.passwordShow
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[18px] w-[18px]" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                    <label className="inline-flex cursor-pointer items-center gap-2.5 text-[#71685e]">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="peer sr-only"
                      />

                      <span className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-[#b9ad9e] bg-white/45 shadow-sm transition peer-checked:border-[#b38b4b] peer-checked:bg-[#b38b4b] peer-focus-visible:ring-2 peer-focus-visible:ring-[#c8a86e]/35">
                        <CheckCircle2 className="h-3.5 w-3.5 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" />
                      </span>

                      <span>{content.remember}</span>
                    </label>

                    <Link
                      href="/reset-password"
                      className="font-semibold text-[#a57b3d] transition hover:text-[#7e5925] hover:underline hover:underline-offset-4"
                    >
                      {content.resetPassword}
                    </Link>
                  </div>

                  {error ? (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="rounded-[18px] border border-[#d9a39b]/55 bg-[#fff5f2] px-4 py-3 text-sm leading-6 text-[#9f463c]"
                    >
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="group h-[52px] w-full rounded-[18px] border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] px-6 text-sm font-semibold text-[#2e251a] shadow-[0_15px_34px_rgba(168,121,56,0.24),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-[1.03] hover:shadow-[0_18px_42px_rgba(168,121,56,0.3)] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{content.loading}</span>
                      </span>
                    ) : (
                      <span className="flex w-full items-center justify-center gap-3">
                        <span>{content.login}</span>
                        <DirectionArrow className="h-5 w-5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>

              <footer className="mt-2 border-t border-[#cbbfaf]/55 pt-2.5 [@media(max-height:680px)]:hidden">
                <div className="flex items-start gap-2.5 text-xs leading-6 text-[#847a6f]">
                  <LockKeyhole className="mt-1 h-3.5 w-3.5 shrink-0 text-[#aa8246]" />
                  <p>{content.securityFooter}</p>
                </div>
              </footer>
            </div>
          </section>

          <section
            dir={isArabic ? "rtl" : "ltr"}
            className="relative hidden h-[calc(100dvh-1.5rem)] max-h-[760px] min-h-0 overflow-hidden rounded-[38px] border border-white/80 bg-[rgba(248,245,239,0.9)] shadow-[0_28px_90px_rgba(86,65,42,0.16)] backdrop-blur-xl xl:block"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.46),transparent_38%),radial-gradient(circle_at_78%_34%,rgba(208,174,113,0.18),transparent_29%),radial-gradient(circle_at_18%_92%,rgba(255,255,255,0.72),transparent_30%)]" />
              <div className="absolute left-0 top-0 h-full w-px bg-white/85" />
              <div className="absolute right-[9%] top-0 h-full w-px bg-[#cabcaa]/25" />
              <div className="absolute right-[11%] top-0 h-full w-px bg-white/70" />
              <div className="absolute right-[13%] top-0 h-full w-px bg-[#cabcaa]/20" />
            </div>

            <div className="relative z-10 flex h-full min-h-0 flex-col px-10 py-7">
              <div className="flex items-start justify-between gap-5">
                <div className={isArabic ? "text-right" : "text-left"}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#756b60] sm:text-xs">
                    {content.visualTopLine}
                  </p>

                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a27c43] sm:text-xs">
                    {content.visualEyebrow}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c8b694]/55 bg-white/45 text-[#aa8144] shadow-sm backdrop-blur">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="relative mt-6 min-h-0 flex-1">
                <div
                  className={`relative z-20 max-w-[335px] ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  <div className="mb-6 h-[2px] w-14 rounded-full bg-[#bd9250]" />

                  <h2
                    className={`text-[3.15rem] font-medium leading-[1.06] tracking-[-0.04em] text-[#29241f] [@media(max-height:720px)]:text-[2.8rem] ${
                      isArabic ? "font-sans" : "font-serif"
                    }`}
                  >
                    <span className="block">{content.visualTitleOne}</span>
                    <span className="block">{content.visualTitleTwo}</span>
                    <span className="block text-[#b48745]">
                      {content.visualTitleThree}
                    </span>
                  </h2>

                  <p className="mt-5 max-w-[315px] text-sm leading-6 text-[#665e55]">
                    {content.visualDescription}
                  </p>

                  <Link
                    href="/"
                    className="group mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#423a32] transition hover:text-[#9b7033]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b89561] bg-white/35 text-[#9d743b] shadow-sm transition group-hover:bg-[#c79d5b] group-hover:text-white">
                      <DirectionArrow className="h-5 w-5" />
                    </span>
                    <span>{content.visualAction}</span>
                  </Link>
                </div>

                <div
                  dir="ltr"
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-2 z-10 h-[385px] w-[288px] scale-[0.74] ${
                    isArabic
                      ? "-left-8 origin-bottom-left"
                      : "-right-8 origin-bottom-right"
                  }`}
                >
                  <div className="absolute right-[34px] top-[5px] h-[210px] w-[76px] rotate-[22deg]">
                    <div className="absolute right-[4px] top-0 h-[72px] w-[68px] rounded-t-[24px] rounded-b-[14px] border border-[#9d733d]/35 bg-[linear-gradient(100deg,#755024_0%,#d4ad67_32%,#8f642d_58%,#d9b873_100%)] shadow-[0_12px_25px_rgba(88,57,23,0.25)]">
                      <div className="absolute inset-x-2 top-2 h-px bg-white/45" />
                      <div className="absolute inset-x-3 bottom-2 h-px bg-black/15" />
                    </div>

                    <div className="absolute left-[28px] top-[66px] h-[125px] w-[16px] rounded-full border border-white/80 bg-[linear-gradient(to_right,rgba(255,255,255,0.55),rgba(255,255,255,0.12),rgba(205,171,111,0.35))] shadow-[inset_0_0_10px_rgba(255,255,255,0.75)]" />

                    <div className="absolute left-[29px] top-[184px] h-5 w-4 rounded-b-full bg-[radial-gradient(circle_at_35%_25%,#fff9ea_0%,#d7b777_46%,#a87839_100%)] shadow-[0_7px_10px_rgba(145,96,38,0.18)]" />
                  </div>

                  <div className="absolute right-[83px] top-[211px] h-7 w-7 rounded-full bg-[radial-gradient(circle_at_35%_25%,#fff9ea_0%,#d8b978_45%,#ad7b38_100%)] shadow-[0_10px_16px_rgba(137,94,42,0.18)]" />

                  <div className="absolute bottom-0 right-[34px] h-[242px] w-[172px]">
                    <div className="absolute left-[44px] top-0 h-[48px] w-[84px] rounded-t-[24px] border border-white/80 bg-[linear-gradient(to_right,rgba(255,255,255,0.74),rgba(215,206,193,0.42),rgba(255,255,255,0.76))] shadow-[inset_0_0_14px_rgba(255,255,255,0.75)]" />

                    <div className="absolute inset-x-0 bottom-0 top-[36px] overflow-hidden rounded-t-[42px] rounded-b-[34px] border border-white/80 bg-[linear-gradient(90deg,rgba(245,241,234,0.76)_0%,rgba(206,196,181,0.42)_38%,rgba(255,255,255,0.83)_70%,rgba(221,213,201,0.58)_100%)] shadow-[0_22px_38px_rgba(95,75,52,0.18),inset_0_0_24px_rgba(255,255,255,0.7)]">
                      <div className="absolute left-4 top-4 h-[80%] w-6 rounded-full bg-white/35 blur-md" />

                      <div className="absolute inset-x-5 bottom-7 rounded-[17px] border border-white/75 bg-[rgba(247,243,236,0.78)] px-4 py-5 text-center shadow-[0_8px_20px_rgba(96,74,48,0.08)] backdrop-blur">
                        <HeartPulse className="mx-auto h-7 w-7 text-[#a67d43]" />
                        <p className="mt-3 text-[11px] font-semibold tracking-[0.26em] text-[#5c5146]">
                          {content.bottleSubLabel}
                        </p>
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a27a42]">
                          {content.bottleLabel}
                        </p>
                        <div className="mx-auto mt-3 h-px w-8 bg-[#b79158]" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-[-7px] right-[4px] h-8 w-[245px] rounded-[50%] bg-[#967650]/16 blur-lg" />
                </div>
              </div>

              <div className="relative z-30 mt-4 grid grid-cols-3 overflow-hidden rounded-[25px] border border-white/75 bg-[rgba(255,255,255,0.48)] shadow-[0_14px_35px_rgba(87,66,42,0.09)] backdrop-blur-md">
                <div className="flex min-h-[82px] flex-col items-center justify-center px-2 py-3 text-center">
                  <HeartPulse className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f] sm:text-xs">
                    {content.featureOne}
                  </span>
                </div>

                <div className="flex min-h-[82px] flex-col items-center justify-center border-s border-[#c8bbab]/50 px-2 py-3 text-center">
                  <FileHeart className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f] sm:text-xs">
                    {content.featureTwo}
                  </span>
                </div>

                <div className="flex min-h-[82px] flex-col items-center justify-center border-s border-[#c8bbab]/50 px-2 py-3 text-center">
                  <CalendarCheck2 className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f] sm:text-xs">
                    {content.featureThree}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}