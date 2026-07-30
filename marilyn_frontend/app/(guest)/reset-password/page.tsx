"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Languages,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* =========================================================
   Marilyn Clinics - Reset Password Page
   Path: marilyn_frontend/app/(guest)/reset-password/page.tsx

   - نفس الهوية البصرية المعتمدة لصفحة تسجيل الدخول.
   - صفحة واحدة لحسابات النظام والمنشآت والفروع.
   - CSRF + Cookies Session.
   - Backend remains the final authority.
   - Arabic / English.
   - RTL / LTR.
   - Sonner Toasts.
   - لا تعتمد على أي أصول أو خدمات خارجية.
========================================================= */

type AppLocale = "ar" | "en";
type JsonObject = Record<string, unknown>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

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

async function prepareCsrf(errorMessage: string): Promise<string> {
  const response = await fetch(resolveApiUrl("/api/auth/csrf/"), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(errorMessage);
  }

  return csrfToken;
}

export default function ResetPasswordPage() {
  const [locale, setLocale] = useState<AppLocale>("ar");

  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  const content = useMemo(
    () => ({
      title: isArabic ? "استعادة كلمة المرور" : "Reset your password",
      subtitle: isArabic
        ? "أدخل بيانات حسابك واختر كلمة مرور جديدة للعودة إلى Marilyn Clinics."
        : "Enter your account details and choose a new password to return to Marilyn Clinics.",

      badge: isArabic ? "استعادة آمنة" : "Secure recovery",
      languageButton: isArabic ? "English" : "العربية",

      secureTitle: isArabic
        ? "طلب آمن ومحمي"
        : "Secure protected request",
      secureDescription: isArabic
        ? "لن يعتمد تغيير كلمة المرور إلا بعد تحقق النظام من صحة الطلب."
        : "Your password will only be changed after the system validates the request.",

      identifierLabel: isArabic
        ? "اسم المستخدم أو البريد الإلكتروني"
        : "Username or email",
      identifierPlaceholder: isArabic
        ? "أدخل اسم المستخدم أو البريد الإلكتروني"
        : "Enter username or email",

      newPasswordLabel: isArabic ? "كلمة المرور الجديدة" : "New password",
      newPasswordPlaceholder: isArabic
        ? "أدخل كلمة المرور الجديدة"
        : "Enter new password",

      confirmPasswordLabel: isArabic
        ? "تأكيد كلمة المرور"
        : "Confirm password",
      confirmPasswordPlaceholder: isArabic
        ? "أعد إدخال كلمة المرور الجديدة"
        : "Re-enter new password",

      resetButton: isArabic ? "تحديث كلمة المرور" : "Update password",
      loadingButton: isArabic
        ? "جار تحديث كلمة المرور..."
        : "Updating password...",

      backToLogin: isArabic
        ? "العودة إلى تسجيل الدخول"
        : "Back to sign in",
      tryAgain: isArabic
        ? "تعيين كلمة مرور أخرى"
        : "Reset another password",

      showPassword: isArabic ? "إظهار كلمة المرور" : "Show password",
      hidePassword: isArabic ? "إخفاء كلمة المرور" : "Hide password",

      identifierRequired: isArabic
        ? "الرجاء إدخال اسم المستخدم أو البريد الإلكتروني"
        : "Please enter your username or email",

      newPasswordRequired: isArabic
        ? "الرجاء إدخال كلمة المرور الجديدة"
        : "Please enter the new password",

      confirmPasswordRequired: isArabic
        ? "الرجاء تأكيد كلمة المرور الجديدة"
        : "Please confirm the new password",

      passwordTooShort: isArabic
        ? "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل"
        : "Password must contain at least 8 characters",

      passwordMismatch: isArabic
        ? "كلمة المرور وتأكيدها غير متطابقين"
        : "Password and confirmation do not match",

      csrfMissing: isArabic
        ? "تعذر تجهيز جلسة الأمان حاول مرة أخرى"
        : "Unable to initialize the secure session. Please try again.",

      resetFailed: isArabic
        ? "تعذر تحديث كلمة المرور"
        : "Unable to update password",

      successTitle: isArabic
        ? "تم تحديث كلمة المرور"
        : "Password updated",

      successDescription: isArabic
        ? "اكتملت العملية بنجاح. يمكنك الآن العودة إلى صفحة تسجيل الدخول واستخدام كلمة المرور الجديدة."
        : "Your password was updated successfully. You can now return to sign in using your new password.",

      securityFooter: isArabic
        ? "تتم معالجة الطلب داخل النظام مع حماية الجلسة وبيانات الحساب."
        : "The request is processed securely while protecting your session and account data.",

      visualTopLine: isArabic
        ? "حماية متقدمة. وصول أكثر أمانا."
        : "ADVANCED SECURITY. SAFER ACCESS.",

      visualEyebrow: isArabic
        ? "استعادة مصممة بثقة"
        : "RECOVERY DESIGNED WITH TRUST",

      visualTitleOne: isArabic ? "حسابك." : "Your account.",
      visualTitleTwo: isArabic ? "محمي." : "Protected.",
      visualTitleThree: isArabic ? "والعودة أسهل." : "Access restored.",

      visualDescription: isArabic
        ? "خطوات واضحة ومحمية لاستعادة الوصول إلى حسابك مع الحفاظ على خصوصية بياناتك والتحقق من الطلب داخل النظام."
        : "Clear and protected steps to restore access while keeping your information private and validating every request.",

      visualAction: isArabic
        ? "العودة إلى تسجيل الدخول"
        : "Return to sign in",

      featureOne: isArabic ? "تحقق موثوق" : "Trusted verification",
      featureTwo: isArabic ? "طلب محمي" : "Protected request",
      featureThree: isArabic ? "عودة آمنة" : "Secure return",

      recoveryCardTitle: isArabic ? "استعادة الوصول" : "ACCESS RECOVERY",
      recoveryCardSubtitle: "MARILYN",
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
      console.error("Reset password locale initialization error:", err);
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
      console.error("Reset password language toggle error:", err);
    }
  };

  const clearFormFeedback = () => {
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!identifier.trim()) return content.identifierRequired;
    if (!newPassword.trim()) return content.newPasswordRequired;
    if (!confirmPassword.trim()) return content.confirmPasswordRequired;
    if (newPassword.length < 8) return content.passwordTooShort;
    if (newPassword !== confirmPassword) return content.passwordMismatch;

    return null;
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const trimmedIdentifier = identifier.trim();
      const csrfToken = await prepareCsrf(content.csrfMissing);

      const response = await fetch(resolveApiUrl("/api/auth/reset-password/"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          username: trimmedIdentifier,
          email: trimmedIdentifier.includes("@") ? trimmedIdentifier : undefined,
          new_password: newPassword,
          confirm_password: confirmPassword,
          password: newPassword,
          password_confirm: confirmPassword,
        }),
      });

      let payload: unknown = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(extractApiMessage(payload, content.resetFailed));
      }

      const message = extractApiMessage(payload, content.successTitle);

      setDone(true);
      setIdentifier("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast.success(message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : content.resetFailed;

      setError(message);
      toast.error(message);
      console.error("Marilyn Clinics reset password error:", err);
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
        #reset-password-form input:-webkit-autofill,
        #reset-password-form input:-webkit-autofill:hover,
        #reset-password-form input:-webkit-autofill:focus,
        #reset-password-form input:-webkit-autofill:active {
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
            id="reset-password-form"
            dir={isArabic ? "rtl" : "ltr"}
            className="relative flex h-[calc(100dvh-1rem)] max-h-[780px] min-h-0 overflow-hidden rounded-[30px] border border-white/80 bg-[rgba(247,243,237,0.9)] shadow-[0_28px_90px_rgba(86,65,42,0.16)] backdrop-blur-xl sm:h-[calc(100dvh-1.5rem)] sm:rounded-[38px]"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/65 to-transparent" />
              <div className="absolute -right-20 top-24 h-48 w-48 rounded-full bg-[#d6b878]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto grid h-full min-h-0 w-full max-w-[520px] grid-rows-[auto_minmax(0,1fr)] px-4 py-3 sm:px-7 sm:py-4 xl:px-9 xl:py-5">
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

              <div className="flex min-h-0 flex-col justify-start overflow-y-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:py-3 xl:justify-center [@media(max-height:720px)]:py-1">
                <div className="mb-2 mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#cdbb9e]/55 bg-white/50 px-3 py-1.5 text-xs font-semibold text-[#78664e]">
                  <KeyRound className="h-4 w-4 text-[#ae874a]" />
                  <span>{content.badge}</span>
                </div>

                <div className={isArabic ? "text-right" : "text-left"}>
                  <h1
                    className={`text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[#29241f] sm:text-[2.35rem] [@media(max-height:720px)]:text-[1.7rem] ${
                      isArabic ? "font-sans" : "font-serif"
                    }`}
                  >
                    {content.title}
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-[#756d63]">
                    {content.subtitle}
                  </p>
                </div>

                {done ? (
                  <div className="mt-5 space-y-3">
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-[24px] border border-[#b7cbaa]/70 bg-[#f3f8ef] p-5 text-[#38552f] shadow-[0_10px_28px_rgba(74,99,64,0.08)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcebd4] text-[#527046]">
                          <CheckCircle2 className="h-6 w-6" />
                        </span>

                        <div className={isArabic ? "text-right" : "text-left"}>
                          <h2 className="font-semibold">
                            {content.successTitle}
                          </h2>
                          <p className="mt-1 text-sm leading-7 text-[#5f7657]">
                            {content.successDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDone(false);
                        setError(null);
                      }}
                      className="h-[50px] w-full rounded-[17px] border-[#cabba8]/70 bg-white/45 text-sm font-semibold text-[#5e554c] shadow-sm hover:bg-white/75"
                    >
                      <span className="flex items-center justify-center gap-2.5">
                        <RotateCcw className="h-4 w-4" />
                        <span>{content.tryAgain}</span>
                      </span>
                    </Button>

                    <Link
                      href="/login"
                      className="group inline-flex h-[50px] w-full items-center justify-center gap-3 rounded-[17px] border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] px-6 text-sm font-semibold text-[#2e251a] shadow-[0_15px_34px_rgba(168,121,56,0.24),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-[1.03]"
                    >
                      <BackIcon className="h-5 w-5" />
                      <span>{content.backToLogin}</span>
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={handleResetSubmit}
                    className="mt-3 space-y-2.5 pb-1 [@media(max-height:720px)]:mt-2 [@media(max-height:720px)]:space-y-2"
                    noValidate
                  >
                    <div className="rounded-[18px] border border-[#d2c1a5]/65 bg-white/42 px-4 py-3 [@media(max-height:720px)]:py-2.5 shadow-sm backdrop-blur">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9dcc5]/65 text-[#9f763c]">
                          <ShieldCheck className="h-4.5 w-4.5" />
                        </span>

                        <div className={isArabic ? "text-right" : "text-left"}>
                          <p className="text-sm font-semibold text-[#4d443b]">
                            {content.secureTitle}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-[#7b7166]">
                            {content.secureDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="reset-identifier"
                        className="block text-sm font-semibold text-[#4b443c]"
                      >
                        {content.identifierLabel}
                      </label>

                      <div className="relative">
                        <Mail
                          className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6e675f] ${
                            isArabic ? "right-5" : "left-5"
                          }`}
                        />

                        <Input
                          id="reset-identifier"
                          name="identifier"
                          required
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          dir={isArabic ? "rtl" : "ltr"}
                          placeholder={content.identifierPlaceholder}
                          value={identifier}
                          onChange={(event) => {
                            setIdentifier(event.target.value);
                            clearFormFeedback();
                          }}
                          className={`h-[50px] rounded-[17px] border border-white/80 bg-[rgba(255,255,255,0.58)] text-[15px] text-[#2f2a25] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(112,91,64,0.06)] placeholder:text-[#958c81] focus-visible:border-[#bf9b61] focus-visible:ring-2 focus-visible:ring-[#c8a86e]/20 ${
                            isArabic
                              ? "pr-14 pl-5 text-right"
                              : "pl-14 pr-5 text-left"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="reset-new-password"
                        className="block text-sm font-semibold text-[#4b443c]"
                      >
                        {content.newPasswordLabel}
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6e675f] ${
                            isArabic ? "right-5" : "left-5"
                          }`}
                        />

                        <Input
                          id="reset-new-password"
                          name="new-password"
                          required
                          autoComplete="new-password"
                          type={showNewPassword ? "text" : "password"}
                          dir={isArabic ? "rtl" : "ltr"}
                          placeholder={content.newPasswordPlaceholder}
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            clearFormFeedback();
                          }}
                          className={`h-[50px] rounded-[17px] border border-white/80 bg-[rgba(255,255,255,0.58)] text-[15px] text-[#2f2a25] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(112,91,64,0.06)] placeholder:text-[#958c81] focus-visible:border-[#bf9b61] focus-visible:ring-2 focus-visible:ring-[#c8a86e]/20 ${
                            isArabic
                              ? "pr-14 pl-14 text-right"
                              : "pl-14 pr-14 text-left"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword((previous) => !previous)
                          }
                          className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#6c655d] transition hover:bg-[#e9dfd2]/70 hover:text-[#342e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a86e]/30 ${
                            isArabic ? "left-2.5" : "right-2.5"
                          }`}
                          aria-label={
                            showNewPassword
                              ? content.hidePassword
                              : content.showPassword
                          }
                          aria-pressed={showNewPassword}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="reset-confirm-password"
                        className="block text-sm font-semibold text-[#4b443c]"
                      >
                        {content.confirmPasswordLabel}
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6e675f] ${
                            isArabic ? "right-5" : "left-5"
                          }`}
                        />

                        <Input
                          id="reset-confirm-password"
                          name="confirm-password"
                          required
                          autoComplete="new-password"
                          type={showConfirmPassword ? "text" : "password"}
                          dir={isArabic ? "rtl" : "ltr"}
                          placeholder={content.confirmPasswordPlaceholder}
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            clearFormFeedback();
                          }}
                          className={`h-[50px] rounded-[17px] border border-white/80 bg-[rgba(255,255,255,0.58)] text-[15px] text-[#2f2a25] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(112,91,64,0.06)] placeholder:text-[#958c81] focus-visible:border-[#bf9b61] focus-visible:ring-2 focus-visible:ring-[#c8a86e]/20 ${
                            isArabic
                              ? "pr-14 pl-14 text-right"
                              : "pl-14 pr-14 text-left"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((previous) => !previous)
                          }
                          className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#6c655d] transition hover:bg-[#e9dfd2]/70 hover:text-[#342e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a86e]/30 ${
                            isArabic ? "left-2.5" : "right-2.5"
                          }`}
                          aria-label={
                            showConfirmPassword
                              ? content.hidePassword
                              : content.showPassword
                          }
                          aria-pressed={showConfirmPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
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
                      className="group h-[50px] w-full rounded-[17px] border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] px-6 text-sm font-semibold text-[#2e251a] shadow-[0_15px_34px_rgba(168,121,56,0.24),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-[1.03] hover:shadow-[0_18px_42px_rgba(168,121,56,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{content.loadingButton}</span>
                        </span>
                      ) : (
                        <span className="flex w-full items-center justify-center gap-3">
                          <span>{content.resetButton}</span>
                          <DirectionArrow className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </Button>

                    <div className="flex pt-1.5">
                      <Link
                        href="/login"
                        className="group inline-flex w-fit items-center gap-3 rounded-full py-1 text-sm font-semibold text-[#423a32] transition hover:text-[#9b7033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a86e]/35"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#b89561] bg-white/35 text-[#9d743b] shadow-sm transition group-hover:bg-[#c79d5b] group-hover:text-white">
                          <BackIcon className="h-[18px] w-[18px]" />
                        </span>

                        <span>{content.backToLogin}</span>
                      </Link>
                    </div>
                  </form>
                )}
              </div>

              <footer className="border-t border-[#cbbfaf]/55 pt-3 [@media(max-height:720px)]:hidden">
                <div className="flex items-start gap-2.5 text-xs leading-6 text-[#847a6f]">
                  <LockKeyhole className="mt-1 h-3.5 w-3.5 shrink-0 text-[#aa8246]" />
                  <p>{content.securityFooter}</p>
                </div>
              </footer>
            </div>
          </section>

          <section
            dir={isArabic ? "rtl" : "ltr"}
            className="relative hidden h-[calc(100dvh-1.5rem)] max-h-[780px] min-h-0 overflow-hidden rounded-[38px] border border-white/80 bg-[rgba(248,245,239,0.9)] shadow-[0_28px_90px_rgba(86,65,42,0.16)] backdrop-blur-xl xl:block"
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#756b60]">
                    {content.visualTopLine}
                  </p>

                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a27c43]">
                    {content.visualEyebrow}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c8b694]/55 bg-white/45 text-[#aa8144] shadow-sm backdrop-blur">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="relative mt-6 min-h-0 flex-1">
                <div
                  className={`relative z-20 max-w-[350px] ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  <div className="mb-6 h-[2px] w-14 rounded-full bg-[#bd9250]" />

                  <h2
                    className={`text-[3.05rem] font-medium leading-[1.06] tracking-[-0.04em] text-[#29241f] [@media(max-height:720px)]:text-[2.7rem] ${
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
                    href="/login"
                    className="group mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#423a32] transition hover:text-[#9b7033]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b89561] bg-white/35 text-[#9d743b] shadow-sm transition group-hover:bg-[#c79d5b] group-hover:text-white">
                      <BackIcon className="h-5 w-5" />
                    </span>
                    <span>{content.visualAction}</span>
                  </Link>
                </div>

                <div
                  dir="ltr"
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 z-10 h-[370px] w-[275px] scale-[0.76] ${
                    isArabic
                      ? "-left-7 origin-bottom-left"
                      : "-right-7 origin-bottom-right"
                  }`}
                >
                  <div className="absolute left-[57px] top-[8px] h-[280px] w-[190px]">
                    <div className="absolute left-[56px] top-0 flex h-[82px] w-[82px] items-center justify-center rounded-full border border-[#b89258]/45 bg-[linear-gradient(135deg,#e7c98e_0%,#b17c35_55%,#d5ac65_100%)] shadow-[0_18px_32px_rgba(115,76,31,0.22)]">
                      <div className="h-[39px] w-[39px] rounded-full border-[8px] border-[#f1dfb8]/85 bg-[#8b612b]/20" />
                    </div>

                    <div className="absolute left-[89px] top-[73px] h-[150px] w-[16px] rounded-full border border-[#aa7e43]/30 bg-[linear-gradient(to_right,#e8cb92_0%,#a9722e_45%,#d9b66f_100%)] shadow-[0_12px_20px_rgba(123,83,38,0.18)]" />

                    <div className="absolute left-[99px] top-[190px] h-[17px] w-[70px] rounded-full bg-[linear-gradient(to_right,#d9b671,#9c682c,#d9b671)] shadow-[0_9px_18px_rgba(108,71,29,0.18)]" />

                    <div className="absolute left-[152px] top-[190px] h-[58px] w-[16px] rounded-full bg-[linear-gradient(to_right,#d9b671,#9c682c,#d9b671)]" />
                  </div>

                  <div className="absolute bottom-0 left-[22px] h-[238px] w-[222px] overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(120deg,rgba(255,255,255,0.72),rgba(219,208,192,0.42),rgba(255,255,255,0.76))] shadow-[0_26px_48px_rgba(95,75,52,0.17),inset_0_0_28px_rgba(255,255,255,0.7)] backdrop-blur">
                    <div className="absolute left-5 top-5 h-[75%] w-8 rounded-full bg-white/35 blur-lg" />

                    <div className="absolute inset-x-5 bottom-6 rounded-[22px] border border-white/80 bg-[rgba(248,244,237,0.78)] px-5 py-6 text-center shadow-[0_9px_24px_rgba(90,69,44,0.08)]">
                      <ShieldCheck className="mx-auto h-8 w-8 text-[#a67d43]" />

                      <p className="mt-3 text-[11px] font-semibold tracking-[0.26em] text-[#5c5146]">
                        {content.recoveryCardSubtitle}
                      </p>

                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a27a42]">
                        {content.recoveryCardTitle}
                      </p>

                      <div className="mx-auto mt-3 h-px w-8 bg-[#b79158]" />
                    </div>
                  </div>

                  <div className="absolute bottom-[-7px] left-0 h-8 w-[270px] rounded-[50%] bg-[#967650]/16 blur-lg" />
                </div>
              </div>

              <div className="relative z-30 mt-4 grid grid-cols-3 divide-x divide-[#c8bbab]/50 overflow-hidden rounded-[25px] border border-white/75 bg-[rgba(255,255,255,0.48)] shadow-[0_14px_35px_rgba(87,66,42,0.09)] backdrop-blur-md">
                <div className="flex min-h-[82px] flex-col items-center justify-center px-2 py-3 text-center">
                  <Fingerprint className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f]">
                    {content.featureOne}
                  </span>
                </div>

                <div className="flex min-h-[82px] flex-col items-center justify-center px-2 py-3 text-center">
                  <ShieldCheck className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f]">
                    {content.featureTwo}
                  </span>
                </div>

                <div className="flex min-h-[82px] flex-col items-center justify-center px-2 py-3 text-center">
                  <BadgeCheck className="h-6 w-6 text-[#9c7847]" />
                  <span className="mt-2 text-[11px] font-medium leading-4 text-[#51483f]">
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