"use client";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { PublicBookingPayment } from "@/components/booking/public-booking-payment";
import { Button } from "@/components/ui/button";
import {
  confirmPublicBooking,
  fetchPublicBookingRequirements,
  localizedBookingBranch,
  localizedBookingPractitioner,
  localizedBookingService,
  type PublicBookingAssignment,
  type PublicBookingConfirmation,
  type PublicBookingPatientInput,
  type PublicBookingRequirements,
  type PublicBookingSlot,
} from "@/lib/public-booking";
type Props = {
  locale: "ar" | "en";
  step: 5 | 6;
  assignment: PublicBookingAssignment;
  selectedSlot: PublicBookingSlot;
  onStepChange: (
    step: 5 | 6,
  ) => void;
  onBackToSchedule: () => void;
};
const GOLD_BUTTON =
  "border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] text-[#2e251a] shadow-[0_10px_24px_rgba(168,121,56,0.18)] hover:brightness-[1.03]";
const INPUT_CLASS_NAME = `
  h-11
  w-full
  rounded-xl
  border
  border-[#d1bea3]/60
  bg-white/82
  px-3
  text-sm
  text-[#354153]
  outline-none
  transition
  placeholder:text-[#a09a91]
  focus:border-[#b48745]
  focus:ring-2
  focus:ring-[#d8b979]/20
`;
const EMPTY_PATIENT: PublicBookingPatientInput = {
  full_name: "",
  mobile: "",
  email: "",
  identifier_type: "",
  identifier_number: "",
};
function appointmentTime(
  value: string,
) {
  const parsed =
    new Date(value);
  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }
  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(parsed);
}
function appointmentDate(
  value: string,
) {
  const parsed =
    new Date(value);
  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value.slice(
      0,
      10,
    );
  }
  const year =
    parsed.getFullYear();
  const month =
    String(
      parsed.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );
  const day =
    String(
      parsed.getDate(),
    ).padStart(
      2,
      "0",
    );
  return `${year}-${month}-${day}`;
}
function identifierLabel(
  value: string,
  isArabic: boolean,
) {
  const labels: Record<
    string,
    {
      ar: string;
      en: string;
    }
  > = {
    NATIONAL_ID: {
      ar: "الهوية الوطنية",
      en: "National ID",
    },
    IQAMA: {
      ar: "الإقامة",
      en: "Iqama",
    },
    PASSPORT: {
      ar: "جواز السفر",
      en: "Passport",
    },
    OTHER: {
      ar: "أخرى",
      en: "Other",
    },
  };
  const item =
    labels[value];
  if (!item) {
    return value;
  }
  return isArabic
    ? item.ar
    : item.en;
}
export function PublicBookingCheckout({
  locale,
  step,
  assignment,
  selectedSlot,
  onStepChange,
  onBackToSchedule,
}: Props) {
  const isArabic =
    locale === "ar";
  const BackArrow =
    isArabic
      ? ArrowRight
      : ArrowLeft;
  const NextArrow =
    isArabic
      ? ArrowLeft
      : ArrowRight;
  const [
    requirements,
    setRequirements,
  ] =
    React.useState<
      PublicBookingRequirements | null
    >(null);
  const [
    patient,
    setPatient,
  ] =
    React.useState<
      PublicBookingPatientInput
    >(EMPTY_PATIENT);
  const [
    requirementsLoading,
    setRequirementsLoading,
  ] =
    React.useState(true);
  const [
    requirementsError,
    setRequirementsError,
  ] =
    React.useState("");
  const [
    formError,
    setFormError,
  ] =
    React.useState("");
  const [
    confirming,
    setConfirming,
  ] =
    React.useState(false);
  const [
    confirmError,
    setConfirmError,
  ] =
    React.useState("");
  const [
    confirmation,
    setConfirmation,
  ] =
    React.useState<
      PublicBookingConfirmation | null
    >(null);
  const copy = isArabic
    ? {
        patientTitle:
          "بيانات المراجع",
        patientHint:
          "نحتاج فقط البيانات الأساسية اللازمة لإتمام الحجز.",
        fullName:
          "الاسم الكامل",
        fullNamePlaceholder:
          "اكتبي الاسم الكامل",
        mobile:
          "رقم الجوال",
        mobilePlaceholder:
          "05xxxxxxxx",
        email:
          "البريد الإلكتروني",
        optional:
          "اختياري",
        emailPlaceholder:
          "name@example.com",
        identifierType:
          "نوع الهوية",
        identifierNumber:
          "رقم الهوية",
        chooseIdentifier:
          "اختاري نوع الهوية",
        privacy:
          "تُستخدم هذه البيانات لإتمام الحجز وربطه بالسجل الطبي فقط.",
        loadingRequirements:
          "جارٍ تجهيز متطلبات بيانات المراجع...",
        requirementsFailed:
          "تعذر تحميل متطلبات بيانات المراجع.",
        fullNameRequired:
          "الاسم الكامل مطلوب.",
        mobileRequired:
          "رقم الجوال مطلوب.",
        identifierRequired:
          "بيانات الهوية مطلوبة لإتمام الحجز.",
        review:
          "مراجعة الحجز",
        back:
          "العودة للموعد",
        reviewTitle:
          "راجعي تفاصيل الحجز",
        reviewHint:
          "تأكدي من البيانات والموعد قبل التأكيد النهائي.",
        appointmentTitle:
          "تفاصيل الموعد",
        service:
          "الخدمة",
        branch:
          "الفرع",
        practitioner:
          "الطبيب",
        date:
          "التاريخ",
        time:
          "الوقت",
        name:
          "الاسم",
        phone:
          "الجوال",
        edit:
          "تعديل البيانات",
        confirm:
          "تأكيد الحجز",
        confirming:
          "جارٍ تأكيد الحجز...",
        confirmFailed:
          "تعذر تأكيد الحجز.",
        chooseAnother:
          "اختيار موعد آخر",
        successTitle:
          "تم تأكيد موعدك",
        successText:
          "تم إنشاء الحجز وتسجيل الموعد بنجاح في Marilyn Clinics.",
        bookingNumber:
          "رقم الحجز",
        home:
          "العودة للرئيسية",
        another:
          "حجز موعد آخر",
      }
    : {
        patientTitle:
          "Patient details",
        patientHint:
          "We only need the essential details required to complete your booking.",
        fullName:
          "Full name",
        fullNamePlaceholder:
          "Enter your full name",
        mobile:
          "Mobile number",
        mobilePlaceholder:
          "05xxxxxxxx",
        email:
          "Email address",
        optional:
          "Optional",
        emailPlaceholder:
          "name@example.com",
        identifierType:
          "ID type",
        identifierNumber:
          "ID number",
        chooseIdentifier:
          "Choose ID type",
        privacy:
          "These details are used only to complete the booking and connect it to the medical record.",
        loadingRequirements:
          "Preparing patient requirements...",
        requirementsFailed:
          "Patient requirements could not be loaded.",
        fullNameRequired:
          "Full name is required.",
        mobileRequired:
          "Mobile number is required.",
        identifierRequired:
          "Identification details are required.",
        review:
          "Review booking",
        back:
          "Back to appointment",
        reviewTitle:
          "Review your booking",
        reviewHint:
          "Check the details and appointment before final confirmation.",
        appointmentTitle:
          "Appointment details",
        service:
          "Service",
        branch:
          "Branch",
        practitioner:
          "Doctor",
        date:
          "Date",
        time:
          "Time",
        name:
          "Name",
        phone:
          "Mobile",
        edit:
          "Edit details",
        confirm:
          "Confirm booking",
        confirming:
          "Confirming booking...",
        confirmFailed:
          "The booking could not be confirmed.",
        chooseAnother:
          "Choose another appointment",
        successTitle:
          "Your appointment is confirmed",
        successText:
          "Your appointment has been created successfully with Marilyn Clinics.",
        bookingNumber:
          "Booking number",
        home:
          "Back to home",
        another:
          "Book another appointment",
      };
  React.useEffect(
    () => {
      let active =
        true;
      setRequirementsLoading(
        true,
      );
      setRequirementsError(
        "",
      );
      fetchPublicBookingRequirements()
        .then(
          (payload) => {
            if (!active) {
              return;
            }
            setRequirements(
              payload,
            );
            if (
              payload.patient
                .require_identifier &&
              payload.patient
                .identifier_types
                .length === 1
            ) {
              setPatient(
                (current) => ({
                  ...current,
                  identifier_type:
                    payload.patient
                      .identifier_types[0]
                      .value,
                }),
              );
            }
          },
        )
        .catch(
          () => {
            if (active) {
              setRequirementsError(
                copy.requirementsFailed,
              );
            }
          },
        )
        .finally(
          () => {
            if (active) {
              setRequirementsLoading(
                false,
              );
            }
          },
        );
      return () => {
        active = false;
      };
    },
    [
      copy.requirementsFailed,
    ],
  );
  const requireIdentifier =
    Boolean(
      requirements
        ?.patient
        .require_identifier,
    );
  const identifierTypes =
    requirements
      ?.patient
      .identifier_types ??
    [];
  function updatePatient(
    key:
      keyof PublicBookingPatientInput,
    value: string,
  ) {
    setPatient(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
    setFormError(
      "",
    );
  }
  function continueToReview(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (
      !patient
        .full_name
        .trim()
    ) {
      setFormError(
        copy.fullNameRequired,
      );
      return;
    }
    if (
      !patient
        .mobile
        .trim()
    ) {
      setFormError(
        copy.mobileRequired,
      );
      return;
    }
    if (
      requireIdentifier &&
      (
        !patient
          .identifier_type
          .trim() ||
        !patient
          .identifier_number
          .trim()
      )
    ) {
      setFormError(
        copy.identifierRequired,
      );
      return;
    }
    setFormError(
      "",
    );
    onStepChange(
      6,
    );
  }
  async function confirmBooking() {
    if (
      confirming ||
      confirmation
    ) {
      return;
    }
    setConfirming(
      true,
    );
    setConfirmError(
      "",
    );
    try {
      const result =
        await confirmPublicBooking(
          {
            practitioner_service_assignment_id:
              assignment.id,
            scheduled_start:
              selectedSlot.start,
            patient: {
              full_name:
                patient
                  .full_name
                  .trim(),
              mobile:
                patient
                  .mobile
                  .trim(),
              email:
                patient
                  .email
                  .trim(),
              identifier_type:
                requireIdentifier
                  ? patient
                      .identifier_type
                      .trim()
                  : "",
              identifier_number:
                requireIdentifier
                  ? patient
                      .identifier_number
                      .trim()
                  : "",
            },
          },
        );
      setConfirmation(
        result,
      );
    } catch (error) {
      setConfirmError(
        error instanceof Error &&
        error.message
          ? error.message
          : copy.confirmFailed,
      );
    } finally {
      setConfirming(
        false,
      );
    }
  }
  if (step === 5) {
    return (
      <form
        onSubmit={
          continueToReview
        }
      >
        {requirementsLoading ? (
          <div className="flex min-h-[260px] items-center justify-center gap-2 text-sm text-[#77716a]">
            <Loader2 className="size-5 animate-spin text-[#b48745]" />
            {copy.loadingRequirements}
          </div>
        ) : requirementsError ? (
          <div className="rounded-[20px] border border-[#d7b98d]/55 bg-[#f6ead9]/75 p-5 text-sm leading-7 text-[#775b37]">
            {requirementsError}
          </div>
        ) : (
          <>
            <div
              className="
                rounded-[22px]
                border
                border-[#d8c8b2]/48
                bg-[linear-gradient(145deg,rgba(255,253,249,0.88)_0%,rgba(244,232,214,0.55)_100%)]
                p-4
                sm:p-5
              "
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-[#d3bb96]/50 bg-white/75 text-[#a57b3d]">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#273245]">
                    {copy.patientTitle}
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-[#777d85]">
                    {copy.patientHint}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    copy.fullName
                  }
                  required
                >
                  <input
                    type="text"
                    autoComplete="name"
                    value={
                      patient.full_name
                    }
                    onChange={(
                      event,
                    ) =>
                      updatePatient(
                        "full_name",
                        event.target.value,
                      )
                    }
                    placeholder={
                      copy.fullNamePlaceholder
                    }
                    className={
                      INPUT_CLASS_NAME
                    }
                  />
                </Field>
                <Field
                  label={
                    copy.mobile
                  }
                  required
                >
                  <div className="relative">
                    <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#b48745]" />
                    <input
                      dir="ltr"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={
                        patient.mobile
                      }
                      onChange={(
                        event,
                      ) =>
                        updatePatient(
                          "mobile",
                          event.target.value,
                        )
                      }
                      placeholder={
                        copy.mobilePlaceholder
                      }
                      className={`${INPUT_CLASS_NAME} ps-10`}
                    />
                  </div>
                </Field>
                <Field
                  label={
                    copy.email
                  }
                  hint={
                    copy.optional
                  }
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#b48745]" />
                    <input
                      dir="ltr"
                      type="email"
                      autoComplete="email"
                      value={
                        patient.email
                      }
                      onChange={(
                        event,
                      ) =>
                        updatePatient(
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder={
                        copy.emailPlaceholder
                      }
                      className={`${INPUT_CLASS_NAME} ps-10`}
                    />
                  </div>
                </Field>
                {requireIdentifier ? (
                  <>
                    <Field
                      label={
                        copy.identifierType
                      }
                      required
                    >
                      <select
                        value={
                          patient
                            .identifier_type
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePatient(
                            "identifier_type",
                            event.target.value,
                          )
                        }
                        className={
                          INPUT_CLASS_NAME
                        }
                      >
                        <option value="">
                          {copy.chooseIdentifier}
                        </option>
                        {identifierTypes.map(
                          (item) => (
                            <option
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {identifierLabel(
                                item.value,
                                isArabic,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </Field>
                    <Field
                      label={
                        copy.identifierNumber
                      }
                      required
                    >
                      <input
                        dir="ltr"
                        type="text"
                        value={
                          patient
                            .identifier_number
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePatient(
                            "identifier_number",
                            event.target.value,
                          )
                        }
                        className={
                          INPUT_CLASS_NAME
                        }
                      />
                    </Field>
                  </>
                ) : null}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-[16px] border border-[#d7c5aa]/45 bg-white/58 px-3.5 py-3 text-xs leading-6 text-[#766e64]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#b48745]" />
                {copy.privacy}
              </div>
            </div>
            {formError ? (
              <div className="mt-4 rounded-[16px] border border-[#d9b890]/60 bg-[#f8ecdb] px-4 py-3 text-sm text-[#765836]">
                {formError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#ddcfbd]/45 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={
                  onBackToSchedule
                }
                className="h-11 rounded-full border-[#cab28e]/55 bg-white/60 px-6 text-[#6e583b] hover:bg-[#f6ead9] hover:text-[#8f6936]"
              >
                <BackArrow className="size-4" />
                {copy.back}
              </Button>
              <Button
                type="submit"
                disabled={
                  Boolean(
                    requirementsError,
                  )
                }
                className={`
                  h-11
                  rounded-full
                  px-7
                  font-semibold
                  ${GOLD_BUTTON}
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                `}
              >
                {copy.review}
                <NextArrow className="size-4" />
              </Button>
            </div>
          </>
        )}
      </form>
    );
  }
  if (confirmation) {
    return (
      <PublicBookingPayment
        locale={locale}
        confirmation={confirmation}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ReviewCard
          icon={
            <CalendarDays className="size-5" />
          }
          title={
            copy.appointmentTitle
          }
        >
          <ReviewRow
            icon={
              <Stethoscope className="size-4" />
            }
            label={
              copy.service
            }
            value={
              localizedBookingService(
                assignment.service,
                isArabic,
              )
            }
          />
          <ReviewRow
            icon={
              <Building2 className="size-4" />
            }
            label={
              copy.branch
            }
            value={
              localizedBookingBranch(
                assignment.branch,
                isArabic,
              )
            }
          />
          <ReviewRow
            icon={
              <UserRound className="size-4" />
            }
            label={
              copy.practitioner
            }
            value={
              localizedBookingPractitioner(
                assignment.practitioner,
                isArabic,
              )
            }
          />
          <ReviewRow
            icon={
              <CalendarDays className="size-4" />
            }
            label={
              copy.date
            }
            value={
              appointmentDate(
                selectedSlot.start,
              )
            }
            ltr
          />
          <ReviewRow
            icon={
              <Clock3 className="size-4" />
            }
            label={
              copy.time
            }
            value={
              appointmentTime(
                selectedSlot.start,
              )
            }
            ltr
          />
        </ReviewCard>
        <ReviewCard
          icon={
            <UserRound className="size-5" />
          }
          title={
            copy.patientTitle
          }
        >
          <ReviewRow
            icon={
              <UserRound className="size-4" />
            }
            label={
              copy.name
            }
            value={
              patient.full_name
            }
          />
          <ReviewRow
            icon={
              <Phone className="size-4" />
            }
            label={
              copy.phone
            }
            value={
              patient.mobile
            }
            ltr
          />
          {patient.email ? (
            <ReviewRow
              icon={
                <Mail className="size-4" />
              }
              label={
                copy.email
              }
              value={
                patient.email
              }
              ltr
            />
          ) : null}
        </ReviewCard>
      </div>
      <div className="mt-5 rounded-[20px] border border-[#d5c2a4]/48 bg-[linear-gradient(145deg,rgba(251,245,236,0.72)_0%,rgba(238,224,205,0.55)_100%)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#b48745]" />
          <div>
            <h3 className="font-semibold text-[#354153]">
              {copy.reviewTitle}
            </h3>
            <p className="mt-1 text-xs leading-6 text-[#777d85]">
              {copy.reviewHint}
            </p>
          </div>
        </div>
      </div>
      {confirmError ? (
        <div className="mt-4 rounded-[17px] border border-[#d8b88c]/60 bg-[#f8ecdb] px-4 py-3 text-sm leading-6 text-[#765836]">
          {confirmError}
          <button
            type="button"
            onClick={
              onBackToSchedule
            }
            className="mt-2 block font-semibold text-[#9a7138] underline underline-offset-4"
          >
            {copy.chooseAnother}
          </button>
        </div>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#ddcfbd]/45 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={
            confirming
          }
          onClick={() =>
            onStepChange(
              5,
            )
          }
          className="h-11 rounded-full border-[#cab28e]/55 bg-white/60 px-6 text-[#6e583b] hover:bg-[#f6ead9] hover:text-[#8f6936]"
        >
          <BackArrow className="size-4" />
          {copy.edit}
        </Button>
        <Button
          type="button"
          disabled={
            confirming
          }
          onClick={() =>
            void confirmBooking()
          }
          className={`
            h-11
            rounded-full
            px-7
            font-semibold
            ${GOLD_BUTTON}
            disabled:cursor-not-allowed
            disabled:opacity-60
          `}
        >
          {confirming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {confirming
            ? copy.confirming
            : copy.confirm}
        </Button>
      </div>
    </div>
  );
}
function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#725c3f]">
        <span>
          {label}
        </span>
        {required ? (
          <span className="text-[#b48745]">
            *
          </span>
        ) : null}
        {hint ? (
          <span className="font-normal text-[#9b948a]">
            ({hint})
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}
function ReviewCard({
  icon,
  title,
  children,
}: {
  icon:
    React.ReactNode;
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d7c6ae]/48 bg-white/65">
      <div className="flex items-center gap-2 border-b border-[#ded0bd]/42 bg-[#f6ead9]/60 px-4 py-3.5 font-semibold text-[#354153]">
        <span className="text-[#b48745]">
          {icon}
        </span>
        {title}
      </div>
      <div className="space-y-1 p-3">
        {children}
      </div>
    </section>
  );
}
function ReviewRow({
  icon,
  label,
  value,
  ltr = false,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[15px] px-2 py-2.5">
      <span className="mt-0.5 text-[#b48745]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-[#958d83]">
          {label}
        </div>
        <div
          dir={
            ltr
              ? "ltr"
              : undefined
          }
          className="mt-0.5 text-sm font-semibold text-[#354153]"
        >
          {value}
        </div>
      </div>
    </div>
  );
}
