"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createPublicBookingPaymentCheckout,
  fetchPublicBookingPaymentOptions,
  fetchPublicBookingPaymentStatus,
  verifyPublicBookingPayment,
  type PublicBookingConfirmation,
  type PublicBookingPaymentCheckout,
  type PublicBookingPaymentMethod,
  type PublicBookingPaymentOptions,
} from "@/lib/public-booking";

type Props = {
  locale: "ar" | "en";
  confirmation?: PublicBookingConfirmation | null;
  returnMode?: boolean;
};

type PaymentResult =
  | "idle"
  | "cash"
  | "free"
  | "paid"
  | "pending"
  | "failed"
  | "cancelled";

type StoredPaymentContext = {
  token: string;
  provider: string;
  checkout_session_id: number;
  appointment_number: string;
  saved_at: number;
};

type MoyasarWindow = Window & {
  Moyasar?: {
    init: (config: Record<string, unknown>) => void;
  };
};

const STORAGE_KEY = "marilyn.public-booking.payment";

const GOLD_BUTTON =
  "border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] text-[#2e251a] shadow-[0_10px_24px_rgba(168,121,56,0.18)] hover:brightness-[1.03]";

function moneyLabel(amount: string) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return amount;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function providerLabel(provider: string, isArabic: boolean) {
  const normalized = provider.trim().toLowerCase();

  const labels: Record<string, { ar: string; en: string }> = {
    cash_at_clinic: {
      ar: "الدفع في العيادة",
      en: "Pay at clinic",
    },
    moyasar: {
      ar: "مدى / Apple Pay / البطاقات",
      en: "mada / Apple Pay / Cards",
    },
    tamara: {
      ar: "تمارا",
      en: "Tamara",
    },
    tabby: {
      ar: "تابي",
      en: "Tabby",
    },
  };

  const label = labels[normalized];
  if (!label) {
    return provider || (isArabic ? "طريقة دفع" : "Payment method");
  }

  return isArabic ? label.ar : label.en;
}

const PAYMENT_PROVIDER_LOGOS: Record<
  string,
  { src: string; alt: string; width: number; height: number; className: string }
> = {
  moyasar: {
    src: "/payment-methods/mada.svg",
    alt: "mada",
    width: 84,
    height: 34,
    className: "h-[28px] w-auto object-contain",
  },
  tamara: {
    src: "/payment-methods/tamara.svg",
    alt: "Tamara",
    width: 84,
    height: 34,
    className: "h-[28px] w-auto object-contain",
  },
  tabby: {
    src: "/payment-methods/tabby.svg",
    alt: "Tabby",
    width: 84,
    height: 34,
    className: "h-[28px] w-auto object-contain",
  },
};

function PaymentProviderMark({
  provider,
  compact = false,
}: {
  provider: string;
  compact?: boolean;
}) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "cash_at_clinic") {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-white/80 bg-[linear-gradient(145deg,#fbf5ec_0%,#ead8bf_100%)] text-[#a57b3d]">
        <Banknote className="size-5" />
      </div>
    );
  }

  const logo = PAYMENT_PROVIDER_LOGOS[normalized];
  if (logo) {
    return (
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-[15px] border border-white/80 bg-white/78 shadow-[0_6px_18px_rgba(45,34,20,0.04)]",
          compact ? "h-11 min-w-[72px] px-2" : "h-11 min-w-[82px] px-2.5",
        ].join(" ")}
      >
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className={logo.className}
        />
      </div>
    );
  }

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-white/80 bg-[linear-gradient(145deg,#fbf5ec_0%,#ead8bf_100%)] text-[#a57b3d]">
      <CreditCard className="size-5" />
    </div>
  );
}

function savePaymentContext(value: StoredPaymentContext) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage is convenience only; backend remains authoritative.
  }
}

function loadPaymentContext(): StoredPaymentContext | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredPaymentContext>;

    if (
      typeof parsed.token !== "string" ||
      typeof parsed.provider !== "string" ||
      typeof parsed.checkout_session_id !== "number" ||
      !Number.isInteger(parsed.checkout_session_id) ||
      parsed.checkout_session_id <= 0 ||
      typeof parsed.appointment_number !== "string" ||
      typeof parsed.saved_at !== "number"
    ) {
      return null;
    }

    return {
      token: parsed.token,
      provider: parsed.provider,
      checkout_session_id: parsed.checkout_session_id,
      appointment_number: parsed.appointment_number,
      saved_at: parsed.saved_at,
    };
  } catch {
    return null;
  }
}

function clearPaymentContext() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op.
  }
}

async function ensureMoyasarAssets() {
  if (typeof window === "undefined") {
    return;
  }

  const moyasarWindow = window as MoyasarWindow;
  if (moyasarWindow.Moyasar) {
    return;
  }

  if (!document.querySelector('link[data-marilyn-moyasar="css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.css";
    link.dataset.marilynMoyasar = "css";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-marilyn-moyasar="js"]',
    );

    if (existing) {
      if ((window as MoyasarWindow).Moyasar) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Moyasar checkout could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.js";
    script.async = true;
    script.dataset.marilynMoyasar = "js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Moyasar checkout could not be loaded."));
    document.head.appendChild(script);
  });
}

export function PublicBookingPayment({
  locale,
  confirmation = null,
  returnMode = false,
}: Props) {
  const isArabic = locale === "ar";

  const [options, setOptions] =
    React.useState<PublicBookingPaymentOptions | null>(null);
  const [selectedMethodId, setSelectedMethodId] =
    React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PaymentResult>("idle");
  const [appointmentNumber, setAppointmentNumber] = React.useState(
    confirmation?.appointment.appointment_number || "",
  );
  const [moyasarCheckout, setMoyasarCheckout] =
    React.useState<PublicBookingPaymentCheckout | null>(null);

  const moyasarMountRef = React.useRef<HTMLDivElement | null>(null);

  const copy = isArabic
    ? {
        title: "اختاري طريقة الدفع",
        hint: "موعدك تم إنشاؤه. اختاري طريقة الدفع المناسبة لإكمال الحجز.",
        loading: "جارٍ تحميل طرق الدفع...",
        loadFailed: "تعذر تحميل طرق الدفع.",
        noMethods: "لا توجد طريقة دفع متاحة حاليًا.",
        amount: "المبلغ",
        secure:
          "المبلغ وطريقة الدفع يتم التحقق منهما من Marilyn Clinics مباشرة.",
        continue: "متابعة الدفع",
        starting: "جارٍ تجهيز الدفع...",
        failed: "تعذر بدء عملية الدفع.",
        returnChecking: "جارٍ التحقق من نتيجة الدفع...",
        paidTitle: "تم الدفع وتأكيد الموعد",
        cashTitle: "تم تأكيد موعدك",
        returnMissing:
          "تعذر استعادة جلسة الدفع. افتحي صفحة الحجز وابدئي المحاولة مجددًا.",
      }
    : {
        title: "Choose payment method",
        hint: "Your appointment is created. Choose how you would like to pay.",
        loading: "Loading payment methods...",
        loadFailed: "Payment methods could not be loaded.",
        noMethods: "No payment method is currently available.",
        amount: "Amount",
        secure:
          "The amount and payment method are verified directly by Marilyn Clinics.",
        continue: "Continue to payment",
        starting: "Preparing payment...",
        failed: "The payment could not be started.",
        returnChecking: "Checking payment result...",
        paidTitle: "Payment verified and appointment confirmed",
        cashTitle: "Your appointment is confirmed",
        returnMissing:
          "The payment session could not be restored. Open the booking page and start again.",
      };

  const token = confirmation?.payment_token?.trim() || "";

  React.useEffect(() => {
    if (returnMode || !token) {
      return;
    }

    let active = true;

    setLoading(true);
    setError("");

    fetchPublicBookingPaymentOptions(token)
      .then((payload) => {
        if (!active) {
          return;
        }

        setOptions(payload);

        if (!payload.payment_required) {
          setResult("free");
          return;
        }

        if (payload.methods.length === 1) {
          setSelectedMethodId(payload.methods[0].id);
        }
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : copy.loadFailed,
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [copy.loadFailed, returnMode, token]);

  const handleReturn = React.useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("payment_return") !== "1") {
      return;
    }

    const provider = (params.get("provider") || "").trim().toLowerCase();
    const returnResult = (params.get("result") || "").trim().toLowerCase();
    const sessionId = Number(params.get("session"));
    const stored = loadPaymentContext();

    if (
      !stored ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0 ||
      sessionId !== stored.checkout_session_id ||
      provider !== stored.provider
    ) {
      setError(copy.returnMissing);
      setResult("failed");
      return;
    }

    setAppointmentNumber(stored.appointment_number);

    if (returnResult === "cancel") {
      clearPaymentContext();
      setResult("cancelled");
      return;
    }

    if (returnResult === "failure") {
      clearPaymentContext();
      setResult("failed");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (provider === "moyasar") {
        const paymentId = (params.get("payment_id") || "").trim();
        if (!paymentId) {
          throw new Error(copy.returnMissing);
        }

        const verification = await verifyPublicBookingPayment({
          token: stored.token,
          checkout_session_id: sessionId,
          payment_id: paymentId,
        });

        if (verification.verified) {
          clearPaymentContext();
          setResult("paid");
          toast.success(copy.paidTitle);
          return;
        }

        setResult("pending");
        return;
      }

      const status = await fetchPublicBookingPaymentStatus(
        stored.token,
        sessionId,
      );

      if (status.paid) {
        clearPaymentContext();
        setResult("paid");
        toast.success(copy.paidTitle);
      } else {
        setResult("pending");
      }
    } catch (returnError) {
      setError(
        returnError instanceof Error && returnError.message
          ? returnError.message
          : copy.failed,
      );
      setResult("failed");
    } finally {
      setLoading(false);
    }
  }, [copy.failed, copy.paidTitle, copy.returnMissing]);

  React.useEffect(() => {
    if (!returnMode) {
      return;
    }

    void handleReturn();
  }, [handleReturn, returnMode]);

  React.useEffect(() => {
    if (
      !moyasarCheckout ||
      !moyasarCheckout.publishable_key ||
      !moyasarCheckout.amount_minor ||
      !moyasarCheckout.currency_code ||
      !moyasarCheckout.callback_url ||
      !moyasarCheckout.checkout_session
    ) {
      return;
    }

    let active = true;

    ensureMoyasarAssets()
      .then(() => {
        if (!active) {
          return;
        }

        const element = moyasarMountRef.current;
        const moyasar = (window as MoyasarWindow).Moyasar;

        if (!element || !moyasar) {
          throw new Error(copy.failed);
        }

        element.innerHTML = "";

        moyasar.init({
          element: ".marilyn-moyasar-form",
          amount: moyasarCheckout.amount_minor,
          currency: moyasarCheckout.currency_code,
          description: `Marilyn Clinics appointment ${appointmentNumber}`,
          publishable_api_key: moyasarCheckout.publishable_key,
          callback_url: moyasarCheckout.callback_url,
          methods: ["creditcard", "applepay"],
          supported_networks: ["mada", "visa", "mastercard"],
          apple_pay: {
            country: "SA",
            label: "Marilyn Clinics",
            validate_merchant_url:
              "https://api.moyasar.com/v1/applepay/initiate",
          },
        });
      })
      .catch((assetError) => {
        setError(
          assetError instanceof Error && assetError.message
            ? assetError.message
            : copy.failed,
        );
      });

    return () => {
      active = false;
    };
  }, [appointmentNumber, copy.failed, moyasarCheckout]);

  async function beginPayment() {
    if (submitting || !options || !selectedMethodId || !token) {
      return;
    }

    const method = options.methods.find((item) => item.id === selectedMethodId);
    if (!method) {
      return;
    }

    setSubmitting(true);
    setError("");
    setMoyasarCheckout(null);

    try {
      const checkout = await createPublicBookingPaymentCheckout({
        token,
        payment_method_id: method.id,
      });

      if (checkout.provider === "cash_at_clinic") {
        setResult("cash");
        toast.success(copy.cashTitle);
        return;
      }

      const session = checkout.checkout_session;
      if (!session) {
        throw new Error(copy.failed);
      }

      savePaymentContext({
        token,
        provider: checkout.provider,
        checkout_session_id: session.id,
        appointment_number:
          confirmation?.appointment.appointment_number || "",
        saved_at: Date.now(),
      });

      if (checkout.provider === "moyasar") {
        if (
          checkout.payment_mode !== "client_side" ||
          !checkout.publishable_key ||
          !checkout.amount_minor ||
          !checkout.currency_code ||
          !checkout.callback_url
        ) {
          throw new Error(copy.failed);
        }

        setMoyasarCheckout(checkout);
        return;
      }

      if (
        (checkout.provider === "tamara" || checkout.provider === "tabby") &&
        checkout.checkout_url
      ) {
        window.location.assign(checkout.checkout_url);
        return;
      }

      throw new Error(copy.failed);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error && checkoutError.message
          ? checkoutError.message
          : copy.failed;

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result !== "idle") {
    return (
      <PaymentResultCard
        locale={locale}
        result={result}
        appointmentNumber={appointmentNumber}
        loading={loading}
        onRetry={result === "pending" ? () => void handleReturn() : undefined}
      />
    );
  }

  if (returnMode) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-[#d7c6ae]/48 bg-white/65 px-5 text-center">
        <Loader2 className="size-7 animate-spin text-[#b48745]" />
        <p className="mt-3 text-sm text-[#747a83]">
          {copy.returnChecking}
        </p>
        {error ? (
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#8a5e42]">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-[#77716a]">
        <Loader2 className="size-5 animate-spin text-[#b48745]" />
        {copy.loading}
      </div>
    );
  }

  if (error && !options) {
    return (
      <div className="rounded-[20px] border border-[#d8b88c]/60 bg-[#f8ecdb] p-5 text-sm leading-7 text-[#765836]">
        <AlertCircle className="mb-2 size-5 text-[#b48745]" />
        {error}
      </div>
    );
  }

  if (
    !options ||
    !options.payment_available ||
    options.methods.length === 0
  ) {
    if (options && !options.payment_required) {
      return (
        <PaymentResultCard
          locale={locale}
          result="free"
          appointmentNumber={appointmentNumber}
          loading={false}
        />
      );
    }

    return (
      <div className="rounded-[20px] border border-[#d8b88c]/60 bg-[#f8ecdb] p-5 text-sm leading-7 text-[#765836]">
        <AlertCircle className="mb-2 size-5 text-[#b48745]" />
        {copy.noMethods}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-[22px] border border-[#d7c6ae]/48 bg-[linear-gradient(145deg,rgba(255,253,249,0.92)_0%,rgba(244,232,214,0.60)_100%)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#9a7138]">
              <CreditCard className="size-4" />
              <span className="text-xs font-semibold">MARILYN PAYMENTS</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#172238]">
              {copy.title}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-7 text-[#747a83]">
              {copy.hint}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#d4bd98]/48 bg-white/72 px-4 py-3 sm:min-w-[170px]">
            <div className="text-[11px] text-[#91877b]">{copy.amount}</div>
            <div className="mt-1 flex items-center gap-2 font-semibold text-[#8f6734]">
              <span dir="ltr" className="text-lg tabular-nums">
                {moneyLabel(options.amount)}
              </span>
              <Image
                src="/currency/sar.svg"
                alt={options.currency_code}
                width={18}
                height={18}
                className="size-[18px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {options.methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isArabic={isArabic}
              selected={selectedMethodId === method.id}
              onSelect={() => {
                setSelectedMethodId(method.id);
                setError("");
                setMoyasarCheckout(null);
              }}
            />
          ))}

          {!options.methods.some(
            (method) => method.provider.trim().toLowerCase() === "tamara",
          ) ? (
            <ComingSoonPaymentMethodCard
              provider="tamara"
              isArabic={isArabic}
            />
          ) : null}

          {!options.methods.some(
            (method) => method.provider.trim().toLowerCase() === "tabby",
          ) ? (
            <ComingSoonPaymentMethodCard
              provider="tabby"
              isArabic={isArabic}
            />
          ) : null}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-[16px] border border-[#d7c5aa]/45 bg-white/60 px-3.5 py-3 text-xs leading-6 text-[#766e64]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#b48745]" />
          {copy.secure}
        </div>

        {error ? (
          <div className="mt-4 rounded-[16px] border border-[#d8b88c]/60 bg-[#f8ecdb] px-4 py-3 text-sm leading-6 text-[#765836]">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            disabled={submitting || !selectedMethodId}
            onClick={() => void beginPayment()}
            className={`h-11 rounded-full px-7 font-semibold ${GOLD_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {submitting ? copy.starting : copy.continue}
          </Button>
        </div>
      </div>

      {moyasarCheckout ? (
        <div className="mt-5 rounded-[22px] border border-[#d7c6ae]/48 bg-white/76 p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <PaymentProviderMark provider="moyasar" compact />
            <div>
              <h4 className="font-semibold text-[#273245]">
                {providerLabel("moyasar", isArabic)}
              </h4>
              <p className="mt-1 text-xs leading-6 text-[#777d85]">
                {isArabic
                  ? "ادفعي بأمان عبر مدى أو Apple Pay أو البطاقات البنكية."
                  : "Pay securely with mada, Apple Pay, or bank cards."}
              </p>
            </div>
          </div>

          <div
            ref={moyasarMountRef}
            className="marilyn-moyasar-form"
            dir="ltr"
          />
        </div>
      ) : null}
    </div>
  );
}

function ComingSoonPaymentMethodCard({
  provider,
  isArabic,
}: {
  provider: "tamara" | "tabby";
  isArabic: boolean;
}) {
  const hint =
    provider === "tamara"
      ? isArabic
        ? "قسمي دفعتك بسهولة مع تمارا عند تفعيل الخدمة."
        : "Split your payment with Tamara when the service becomes available."
      : isArabic
        ? "قسمي دفعتك بسهولة مع تابي عند تفعيل الخدمة."
        : "Split your payment with Tabby when the service becomes available.";

  return (
    <div
      aria-disabled="true"
      className="relative flex w-full cursor-not-allowed items-start gap-3 overflow-hidden rounded-[19px] border border-[#d9cab5]/45 bg-white/45 p-4 opacity-[0.72]"
    >
      <PaymentProviderMark provider={provider} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-[#273245]">
                {providerLabel(provider, isArabic)}
              </h4>

              <span className="rounded-full border border-[#c9aa7a]/45 bg-[#f5ead9] px-2.5 py-1 text-[10px] font-semibold text-[#9a7138]">
                {isArabic ? "قريبا" : "Coming soon"}
              </span>
            </div>

            <p className="mt-1 text-xs leading-6 text-[#777d85]">{hint}</p>
          </div>

          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[#d4c3aa] bg-white/55" />
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCard({
  method,
  isArabic,
  selected,
  onSelect,
}: {
  method: PublicBookingPaymentMethod;
  isArabic: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const provider = method.provider.trim().toLowerCase();

  const hint =
    provider === "cash_at_clinic"
      ? isArabic
        ? "السداد عند الحضور للعيادة."
        : "Pay when you arrive at the clinic."
      : provider === "moyasar"
        ? isArabic
          ? "مدى وApple Pay والبطاقات البنكية."
          : "mada, Apple Pay, and bank cards."
        : provider === "tamara"
          ? isArabic
            ? "أكملي الدفع عبر تمارا."
            : "Complete payment with Tamara."
          : provider === "tabby"
            ? isArabic
              ? "أكملي الدفع عبر تابي."
              : "Complete payment with Tabby."
            : method.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-3 rounded-[19px] border p-4 text-start transition duration-200",
        selected
          ? "border-[#b58a4a]/75 bg-[#f3e3cc] shadow-[0_12px_26px_rgba(145,103,48,0.09)]"
          : "border-[#d9cab5]/55 bg-white/72 hover:border-[#c5a474]/70 hover:bg-white",
      ].join(" ")}
    >
      <PaymentProviderMark provider={provider} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-[#273245]">
              {providerLabel(provider, isArabic)}
            </h4>
            <p className="mt-1 text-xs leading-6 text-[#777d85]">{hint}</p>
          </div>

          <span
            className={[
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition",
              selected
                ? "border-[#c89e58] bg-[#c89e58] text-white"
                : "border-[#d4c3aa] bg-white/70 text-transparent",
            ].join(" ")}
          >
            <Check className="size-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function PaymentResultCard({
  locale,
  result,
  appointmentNumber,
  loading,
  onRetry,
}: {
  locale: "ar" | "en";
  result: Exclude<PaymentResult, "idle">;
  appointmentNumber: string;
  loading: boolean;
  onRetry?: () => void;
}) {
  const isArabic = locale === "ar";

  const copy = isArabic
    ? {
        paidTitle: "تم الدفع وتأكيد الموعد",
        paidText: "تم التحقق من عملية الدفع بنجاح وربطها بموعدك.",
        cashTitle: "تم تأكيد موعدك",
        cashText: "تم اختيار الدفع في العيادة. يمكنك سداد المبلغ عند الحضور.",
        freeTitle: "تم تأكيد موعدك",
        freeText: "هذا الموعد لا يتطلب دفعًا إلكترونيًا.",
        pendingTitle: "عملية الدفع قيد المعالجة",
        pendingText:
          "لم تصل حالة الدفع النهائية بعد. يمكنك التحقق مرة أخرى بعد لحظات.",
        failedTitle: "لم تكتمل عملية الدفع",
        failedText: "لم يتم اعتماد عملية الدفع الإلكترونية.",
        cancelledTitle: "تم إلغاء الدفع",
        cancelledText: "تم إلغاء عملية الدفع ولم يتم اعتماد دفعة إلكترونية.",
        bookingNumber: "رقم الحجز",
        retry: "التحقق مرة أخرى",
        home: "العودة للرئيسية",
        another: "حجز موعد آخر",
      }
    : {
        paidTitle: "Payment verified and appointment confirmed",
        paidText:
          "Your payment was verified successfully and linked to the appointment.",
        cashTitle: "Your appointment is confirmed",
        cashText:
          "Pay at clinic was selected. You can settle the amount when you arrive.",
        freeTitle: "Your appointment is confirmed",
        freeText: "This appointment does not require an online payment.",
        pendingTitle: "Payment is processing",
        pendingText:
          "A final payment status has not arrived yet. You can check again shortly.",
        failedTitle: "Payment was not completed",
        failedText: "The electronic payment was not approved.",
        cancelledTitle: "Payment cancelled",
        cancelledText:
          "The payment was cancelled and no electronic payment was approved.",
        bookingNumber: "Booking number",
        retry: "Check again",
        home: "Back to home",
        another: "Book another appointment",
      };

  const content =
    result === "paid"
      ? { title: copy.paidTitle, text: copy.paidText }
      : result === "cash"
        ? { title: copy.cashTitle, text: copy.cashText }
        : result === "free"
          ? { title: copy.freeTitle, text: copy.freeText }
          : result === "pending"
            ? { title: copy.pendingTitle, text: copy.pendingText }
            : result === "cancelled"
              ? { title: copy.cancelledTitle, text: copy.cancelledText }
              : { title: copy.failedTitle, text: copy.failedText };

  const success = result === "paid" || result === "cash" || result === "free";

  return (
    <div className="rounded-[24px] border border-[#c4a16b]/50 bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_100%)] p-6 text-center sm:p-8">
      <div
        className={[
          "mx-auto flex size-16 items-center justify-center rounded-full border border-white/80 shadow-[0_14px_34px_rgba(168,121,56,0.16)]",
          success
            ? "bg-[#c89e58] text-white"
            : result === "pending"
              ? "bg-white/80 text-[#a57b3d]"
              : "bg-[#f4e5d5] text-[#9a6748]",
        ].join(" ")}
      >
        {success ? (
          <CheckCircle2 className="size-8" />
        ) : result === "pending" ? (
          <Clock3 className="size-8" />
        ) : (
          <AlertCircle className="size-8" />
        )}
      </div>

      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#172238]">
        {content.title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#747a83]">
        {content.text}
      </p>

      {appointmentNumber ? (
        <div className="mx-auto mt-6 max-w-sm rounded-[20px] border border-[#cfb58c]/48 bg-white/65 p-4">
          <div className="text-xs text-[#8d857b]">{copy.bookingNumber}</div>
          <div
            dir="ltr"
            className="mt-1 text-xl font-semibold tracking-[0.08em] text-[#966d37]"
          >
            {appointmentNumber}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {result === "pending" && onRetry ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onRetry}
            className="h-11 rounded-full border-[#cab28e]/55 bg-white/65 px-6 text-[#6e583b] hover:bg-[#f6ead9] hover:text-[#8f6936]"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {copy.retry}
          </Button>
        ) : null}

        <Button
          asChild
          variant="outline"
          className="h-11 rounded-full border-[#cab28e]/55 bg-white/65 px-6 text-[#6e583b] hover:bg-[#f6ead9] hover:text-[#8f6936]"
        >
          <Link href="/">
            {locale === "ar" ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            {copy.home}
          </Link>
        </Button>

        <Button
          asChild
          className={`h-11 rounded-full px-7 font-semibold ${GOLD_BUTTON}`}
        >
          <Link href="/book">
            {copy.another}
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
