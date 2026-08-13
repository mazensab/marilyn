"use client";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchPublicAvailability,
  fetchPublicBookingOptions,
  formatBookingPrice,
  localizedBookingBranch,
  localizedBookingPractitioner,
  localizedBookingService,
  localizedBookingSpecialty,
  type PublicBookingAssignment,
  type PublicBookingBranch,
  type PublicBookingPractitioner,
  type PublicBookingService,
  type PublicBookingSlot,
} from "@/lib/public-booking";
type Props = {
  locale: "ar" | "en";
  initialBranchId?: number;
  initialServiceId?: number;
  initialPractitionerId?: number;
};
type WizardStep = 1 | 2 | 3 | 4;
const LANDING_GOLD_BUTTON =
  "border border-[#b58c4d]/40 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] text-[#2e251a] shadow-[0_10px_24px_rgba(168,121,56,0.18)] hover:brightness-[1.03]";
function uniqueById<
  T extends {
    id: number;
  },
>(
  values: T[],
) {
  const map = new Map<number, T>();
  for (const value of values) {
    if (!map.has(value.id)) {
      map.set(
        value.id,
        value,
      );
    }
  }
  return Array.from(
    map.values(),
  );
}
function localDateValue(
  value = new Date(),
) {
  const adjusted = new Date(
    value.getTime() -
      value.getTimezoneOffset() * 60_000,
  );
  return adjusted
    .toISOString()
    .slice(0, 10);
}
function upcomingDates(
  count: number,
) {
  const values: Date[] = [];
  const start = new Date();
  start.setHours(
    12,
    0,
    0,
    0,
  );
  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const next = new Date(
      start,
    );
    next.setDate(
      start.getDate() + index,
    );
    values.push(next);
  }
  return values;
}
function englishDayNumber(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "2-digit",
    },
  ).format(value);
}
function englishMonthLabel(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
    },
  ).format(value);
}
function weekdayLabel(
  value: Date,
  isArabic: boolean,
) {
  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-SA"
      : "en-US",
    {
      weekday: "short",
    },
  ).format(value);
}
function timeLabel(
  value: string,
) {
  const parsed = new Date(value);
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
function initials(
  value: string,
) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join("")
    .toUpperCase();
}
export function PublicBookingExperience({
  locale,
  initialBranchId,
  initialServiceId,
  initialPractitionerId,
}: Props) {
  const isArabic =
    locale === "ar";
  const NextArrow =
    isArabic
      ? ArrowLeft
      : ArrowRight;
  const BackArrow =
    isArabic
      ? ArrowRight
      : ArrowLeft;
  const [
    branches,
    setBranches,
  ] =
    React.useState<
      PublicBookingBranch[]
    >([]);
  const [
    assignments,
    setAssignments,
  ] =
    React.useState<
      PublicBookingAssignment[]
    >([]);
  const [
    branchId,
    setBranchId,
  ] =
    React.useState<
      number | null
    >(null);
  const [
    serviceId,
    setServiceId,
  ] =
    React.useState<
      number | null
    >(null);
  const [
    practitionerId,
    setPractitionerId,
  ] =
    React.useState<
      number | null
    >(null);
  const [
    currentStep,
    setCurrentStep,
  ] =
    React.useState<
      WizardStep
    >(1);
  const [
    bookingDate,
    setBookingDate,
  ] =
    React.useState("");
  const [
    slots,
    setSlots,
  ] =
    React.useState<
      PublicBookingSlot[]
    >([]);
  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    React.useState<
      PublicBookingSlot | null
    >(null);
  const [
    loading,
    setLoading,
  ] =
    React.useState(true);
  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] =
    React.useState(false);
  const [
    loadError,
    setLoadError,
  ] =
    React.useState("");
  const [
    availabilityError,
    setAvailabilityError,
  ] =
    React.useState("");
  const copy = React.useMemo(
    () =>
      isArabic
        ? {
            eyebrow:
              "الحجز الإلكتروني",
            title:
              "احجزي موعدك بسهولة",
            description:
              "رحلة حجز بسيطة وواضحة، مرتبطة مباشرة بخيارات Marilyn Clinics ومواعيدها الفعلية.",
            service:
              "الخدمة",
            branch:
              "الفرع",
            practitioner:
              "الطبيب",
            appointment:
              "الموعد",
            patient:
              "بياناتك",
            confirm:
              "التأكيد",
            selectService:
              "اختاري الخدمة",
            serviceDescription:
              "ابدئي بالخدمة التي ترغبين بها. ستظهر هنا فقط الخدمات المؤهلة للحجز الإلكتروني.",
            selectBranch:
              "اختاري الفرع",
            branchDescription:
              "اختاري الفرع الذي يقدم الخدمة. إذا كان هناك فرع واحد مناسب سيتم اختياره تلقائيًا.",
            selectPractitioner:
              "اختاري الطبيب",
            practitionerDescription:
              "تظهر فقط الكوادر الطبية المرتبطة فعليًا بالخدمة والفرع المحددين.",
            selectAppointment:
              "اختاري التاريخ والوقت",
            appointmentDescription:
              "الأوقات المعروضة تأتي مباشرة من جدول الطبيب بعد استبعاد المواعيد والتوقفات والإجازات.",
            noServicesTitle:
              "لا توجد خدمات متاحة للحجز الإلكتروني حاليًا",
            noServicesText:
              "ستظهر الخدمات هنا تلقائيًا بمجرد تفعيلها وربطها بممارس متاح للحجز في النظام.",
            noBranches:
              "لا يوجد فرع متاح لهذه الخدمة حاليًا.",
            noPractitioners:
              "لا يوجد طبيب متاح لهذه الخدمة في الفرع المحدد حاليًا.",
            chooseDate:
              "اختاري يومًا لعرض المواعيد المتاحة.",
            noSlots:
              "لا توجد أوقات متاحة في هذا اليوم.",
            loading:
              "جارٍ تحميل خيارات الحجز...",
            loadingAvailability:
              "جارٍ التحقق من الأوقات المتاحة...",
            loadFailed:
              "تعذر تحميل خيارات الحجز حاليًا.",
            availabilityFailed:
              "تعذر تحميل التوافر لهذا اليوم.",
            next:
              "التالي",
            back:
              "السابق",
            continue:
              "متابعة إلى بيانات المراجع",
            pendingPatient:
              "سيتم ربط بيانات المراجع وإنشاء الموعد في Batch 4B بعد تثبيت هذه الواجهة.",
            bookingSummary:
              "ملخص الحجز",
            summaryHint:
              "يتحدث الملخص تلقائيًا مع كل اختيار.",
            notSelected:
              "لم يتم الاختيار",
            duration:
              "مدة الخدمة",
            minutes:
              "دقيقة",
            price:
              "السعر",
            date:
              "التاريخ",
            time:
              "الوقت",
            mainBranch:
              "الفرع الرئيسي",
            realAvailability:
              "توافر حقيقي",
            realAvailabilityText:
              "المواعيد من جدول العيادة مباشرة.",
            noFakeSlots:
              "بدون أوقات وهمية",
            noFakeSlotsText:
              "المحجوز والإجازات والتوقفات لا تظهر.",
            editable:
              "اختيارات مرنة",
            editableText:
              "يمكنك الرجوع وتعديل اختيارك قبل التأكيد.",
          }
        : {
            eyebrow:
              "Online booking",
            title:
              "Book your appointment with ease",
            description:
              "A simple booking journey connected directly to real Marilyn Clinics options and availability.",
            service:
              "Service",
            branch:
              "Branch",
            practitioner:
              "Doctor",
            appointment:
              "Appointment",
            patient:
              "Your details",
            confirm:
              "Confirmation",
            selectService:
              "Choose your service",
            serviceDescription:
              "Start with the service you want. Only genuinely bookable services appear here.",
            selectBranch:
              "Choose your branch",
            branchDescription:
              "Choose a branch offering the service. A single matching branch is selected automatically.",
            selectPractitioner:
              "Choose your doctor",
            practitionerDescription:
              "Only practitioners genuinely assigned to the selected service and branch appear here.",
            selectAppointment:
              "Choose date and time",
            appointmentDescription:
              "Times come directly from the practitioner schedule after removing bookings, breaks and approved time off.",
            noServicesTitle:
              "No services are currently available for online booking",
            noServicesText:
              "Services will appear automatically once enabled and linked to a practitioner available for online booking.",
            noBranches:
              "No branch is currently available for this service.",
            noPractitioners:
              "No doctor is currently available for this service at the selected branch.",
            chooseDate:
              "Choose a day to view available times.",
            noSlots:
              "No appointment times are available on this day.",
            loading:
              "Loading booking options...",
            loadingAvailability:
              "Checking available times...",
            loadFailed:
              "Booking options could not be loaded.",
            availabilityFailed:
              "Availability could not be loaded for this day.",
            next:
              "Next",
            back:
              "Back",
            continue:
              "Continue to patient details",
            pendingPatient:
              "Patient details and appointment creation will be connected in Batch 4B after this interface is approved.",
            bookingSummary:
              "Booking summary",
            summaryHint:
              "Your summary updates automatically with each choice.",
            notSelected:
              "Not selected",
            duration:
              "Duration",
            minutes:
              "min",
            price:
              "Price",
            date:
              "Date",
            time:
              "Time",
            mainBranch:
              "Main branch",
            realAvailability:
              "Real availability",
            realAvailabilityText:
              "Times come directly from the clinic schedule.",
            noFakeSlots:
              "No fake slots",
            noFakeSlotsText:
              "Bookings, breaks and time off are excluded.",
            editable:
              "Flexible choices",
            editableText:
              "Go back and adjust your choices before confirmation.",
          },
    [
      isArabic,
    ],
  );
  React.useEffect(
    () => {
      let active = true;
      setLoading(true);
      setLoadError("");
      fetchPublicBookingOptions()
        .then(
          (payload) => {
            if (!active) {
              return;
            }
            const nextBranches =
              Array.isArray(
                payload.branches,
              )
                ? payload.branches
                : [];
            const nextAssignments =
              Array.isArray(
                payload.assignments,
              )
                ? payload.assignments
                : [];
            setBranches(
              nextBranches,
            );
            setAssignments(
              nextAssignments,
            );
            let nextBranchId:
              number | null =
              null;
            if (
              initialBranchId &&
              nextBranches.some(
                (branch) =>
                  branch.id ===
                  initialBranchId,
              )
            ) {
              nextBranchId =
                initialBranchId;
            } else if (
              nextBranches.length ===
              1
            ) {
              nextBranchId =
                nextBranches[0].id;
            }
            let nextServiceId:
              number | null =
              null;
            if (
              initialServiceId &&
              nextAssignments.some(
                (item) =>
                  item.service.id ===
                    initialServiceId &&
                  (
                    !nextBranchId ||
                    item.branch.id ===
                      nextBranchId
                  ),
              )
            ) {
              nextServiceId =
                initialServiceId;
            }
            let nextPractitionerId:
              number | null =
              null;
            if (
              initialPractitionerId &&
              nextServiceId &&
              nextAssignments.some(
                (item) =>
                  item.service.id ===
                    nextServiceId &&
                  item.practitioner.id ===
                    initialPractitionerId &&
                  (
                    !nextBranchId ||
                    item.branch.id ===
                      nextBranchId
                  ),
              )
            ) {
              nextPractitionerId =
                initialPractitionerId;
            }
            setBranchId(
              nextBranchId,
            );
            setServiceId(
              nextServiceId,
            );
            setPractitionerId(
              nextPractitionerId,
            );
            if (
              nextServiceId &&
              nextBranchId &&
              nextPractitionerId
            ) {
              setCurrentStep(4);
            } else if (
              nextServiceId &&
              nextBranchId
            ) {
              setCurrentStep(3);
            } else if (
              nextServiceId
            ) {
              setCurrentStep(2);
            } else {
              setCurrentStep(1);
            }
          },
        )
        .catch(
          () => {
            if (active) {
              setLoadError(
                copy.loadFailed,
              );
            }
          },
        )
        .finally(
          () => {
            if (active) {
              setLoading(
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
      copy.loadFailed,
      initialBranchId,
      initialPractitionerId,
      initialServiceId,
    ],
  );
  const allServices =
    React.useMemo(
      () => {
        const source =
          branchId
            ? assignments.filter(
                (item) =>
                  item.branch.id ===
                  branchId,
              )
            : assignments;
        return uniqueById(
          source.map(
            (item) =>
              item.service,
          ),
        );
      },
      [
        assignments,
        branchId,
      ],
    );
  const compatibleBranches =
    React.useMemo(
      () => {
        if (!serviceId) {
          return branches;
        }
        const ids =
          new Set(
            assignments
              .filter(
                (item) =>
                  item.service.id ===
                  serviceId,
              )
              .map(
                (item) =>
                  item.branch.id,
              ),
          );
        return branches.filter(
          (branch) =>
            ids.has(
              branch.id,
            ),
        );
      },
      [
        assignments,
        branches,
        serviceId,
      ],
    );
  const compatiblePractitioners =
    React.useMemo(
      () => {
        if (
          !serviceId ||
          !branchId
        ) {
          return [];
        }
        return uniqueById(
          assignments
            .filter(
              (item) =>
                item.service.id ===
                  serviceId &&
                item.branch.id ===
                  branchId,
            )
            .map(
              (item) =>
                item.practitioner,
            ),
        );
      },
      [
        assignments,
        branchId,
        serviceId,
      ],
    );
  const selectedBranch =
    React.useMemo(
      () =>
        branches.find(
          (branch) =>
            branch.id ===
            branchId,
        ) || null,
      [
        branchId,
        branches,
      ],
    );
  const selectedService =
    React.useMemo(
      () =>
        assignments.find(
          (item) =>
            item.service.id ===
            serviceId,
        )?.service || null,
      [
        assignments,
        serviceId,
      ],
    );
  const selectedPractitioner =
    React.useMemo(
      () =>
        assignments.find(
          (item) =>
            item.practitioner.id ===
            practitionerId,
        )?.practitioner ||
        null,
      [
        assignments,
        practitionerId,
      ],
    );
  const selectedAssignment =
    React.useMemo(
      () => {
        if (
          !branchId ||
          !serviceId ||
          !practitionerId
        ) {
          return null;
        }
        return (
          assignments.find(
            (item) =>
              item.branch.id ===
                branchId &&
              item.service.id ===
                serviceId &&
              item.practitioner.id ===
                practitionerId,
          ) || null
        );
      },
      [
        assignments,
        branchId,
        practitionerId,
        serviceId,
      ],
    );
  React.useEffect(
    () => {
      setSlots([]);
      setSelectedSlot(
        null,
      );
      setAvailabilityError(
        "",
      );
      if (
        !selectedAssignment ||
        !bookingDate
      ) {
        return;
      }
      let active = true;
      setAvailabilityLoading(
        true,
      );
      fetchPublicAvailability(
        selectedAssignment.id,
        bookingDate,
      )
        .then(
          (payload) => {
            if (!active) {
              return;
            }
            setSlots(
              Array.isArray(
                payload.slots,
              )
                ? payload.slots
                : [],
            );
          },
        )
        .catch(
          () => {
            if (active) {
              setAvailabilityError(
                copy.availabilityFailed,
              );
            }
          },
        )
        .finally(
          () => {
            if (active) {
              setAvailabilityLoading(
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
      bookingDate,
      copy.availabilityFailed,
      selectedAssignment,
    ],
  );
  const dateChoices =
    React.useMemo(
      () =>
        upcomingDates(7),
      [],
    );
  const steps = [
    copy.service,
    copy.branch,
    copy.practitioner,
    copy.appointment,
    copy.patient,
    copy.confirm,
  ];
  const selectedPrice =
    selectedService
      ? formatBookingPrice(
          selectedService
            .effective_sale_price,
        )
      : "";
  function chooseService(
    service: PublicBookingService,
  ) {
    const matchingBranches =
      uniqueById(
        assignments
          .filter(
            (item) =>
              item.service.id ===
              service.id,
          )
          .map(
            (item) =>
              item.branch,
          ),
      );
    let nextBranchId =
      branchId;
    if (
      !nextBranchId ||
      !matchingBranches.some(
        (branch) =>
          branch.id ===
          nextBranchId,
      )
    ) {
      nextBranchId =
        matchingBranches.length ===
        1
          ? matchingBranches[0].id
          : null;
    }
    setServiceId(
      service.id,
    );
    setBranchId(
      nextBranchId,
    );
    setPractitionerId(
      null,
    );
    setBookingDate("");
    setSlots([]);
    setSelectedSlot(null);
  }
  function chooseBranch(
    branch: PublicBookingBranch,
  ) {
    setBranchId(
      branch.id,
    );
    setPractitionerId(
      null,
    );
    setBookingDate("");
    setSlots([]);
    setSelectedSlot(null);
  }
  function choosePractitioner(
    practitioner:
      PublicBookingPractitioner,
  ) {
    setPractitionerId(
      practitioner.id,
    );
    setBookingDate("");
    setSlots([]);
    setSelectedSlot(null);
  }
  function goNext() {
    if (
      currentStep === 1 &&
      serviceId
    ) {
      if (branchId) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
      return;
    }
    if (
      currentStep === 2 &&
      branchId
    ) {
      setCurrentStep(3);
      return;
    }
    if (
      currentStep === 3 &&
      practitionerId
    ) {
      setCurrentStep(4);
    }
  }
  function goBack() {
    if (currentStep === 4) {
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (
        compatibleBranches.length >
        1
      ) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  }
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <BookingIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={
            copy.description
          }
        />
        <div
          className="
            mt-8
            flex
            min-h-[420px]
            items-center
            justify-center
            rounded-[32px]
            border
            border-[#d7c7b1]/45
            bg-white/62
            shadow-[0_24px_70px_rgba(81,60,35,0.07)]
            backdrop-blur-xl
          "
        >
          <div className="flex flex-col items-center gap-3 text-[#766f66]">
            <Loader2 className="size-7 animate-spin text-[#b48745]" />
            <p className="text-sm">
              {copy.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl">
      <BookingIntro
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={
          copy.description
        }
      />
      <BookingStepper
        steps={steps}
        currentStep={
          currentStep
        }
        serviceComplete={
          Boolean(
            serviceId,
          )
        }
        branchComplete={
          Boolean(
            branchId,
          )
        }
        practitionerComplete={
          Boolean(
            practitionerId,
          )
        }
        appointmentComplete={
          Boolean(
            selectedSlot,
          )
        }
      />
      <div
        className="
          mt-6
          grid
          items-start
          gap-5
          lg:grid-cols-[minmax(0,1fr)_330px]
        "
      >
        <section
          className="
            overflow-hidden
            rounded-[30px]
            border
            border-[#cdbb9f]/48
            bg-white/68
            shadow-[0_24px_65px_rgba(83,61,35,0.075)]
            backdrop-blur-xl
          "
        >
          <div
            className="
              border-b
              border-[#dccdb9]/45
              bg-[linear-gradient(145deg,rgba(255,253,249,0.92)_0%,rgba(244,232,214,0.66)_100%)]
              px-5
              py-5
              sm:px-7
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-[14px]
                  border
                  border-[#d1bb97]/50
                  bg-white/72
                  font-semibold
                  text-[#a57b3d]
                  shadow-[0_8px_18px_rgba(140,100,50,0.08)]
                "
              >
                {currentStep}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#172238]">
                  {currentStep === 1
                    ? copy.selectService
                    : currentStep === 2
                      ? copy.selectBranch
                      : currentStep === 3
                        ? copy.selectPractitioner
                        : copy.selectAppointment}
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-7 text-[#727985]">
                  {currentStep === 1
                    ? copy.serviceDescription
                    : currentStep === 2
                      ? copy.branchDescription
                      : currentStep === 3
                        ? copy.practitionerDescription
                        : copy.appointmentDescription}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            {loadError ? (
              <EmptyState
                icon={
                  <Stethoscope className="size-6" />
                }
                title={
                  copy.loadFailed
                }
                description={
                  loadError
                }
              />
            ) : currentStep === 1 ? (
              <ServiceStep
                services={
                  allServices
                }
                selectedId={
                  serviceId
                }
                isArabic={
                  isArabic
                }
                noServicesTitle={
                  copy.noServicesTitle
                }
                noServicesText={
                  copy.noServicesText
                }
                minutesLabel={
                  copy.minutes
                }
                onSelect={
                  chooseService
                }
              />
            ) : currentStep === 2 ? (
              <BranchStep
                branches={
                  compatibleBranches
                }
                selectedId={
                  branchId
                }
                isArabic={
                  isArabic
                }
                mainBranchLabel={
                  copy.mainBranch
                }
                emptyText={
                  copy.noBranches
                }
                onSelect={
                  chooseBranch
                }
              />
            ) : currentStep === 3 ? (
              <PractitionerStep
                practitioners={
                  compatiblePractitioners
                }
                selectedId={
                  practitionerId
                }
                isArabic={
                  isArabic
                }
                emptyText={
                  copy.noPractitioners
                }
                onSelect={
                  choosePractitioner
                }
              />
            ) : (
              <AppointmentStep
                dateChoices={
                  dateChoices
                }
                bookingDate={
                  bookingDate
                }
                setBookingDate={
                  setBookingDate
                }
                slots={
                  slots
                }
                selectedSlot={
                  selectedSlot
                }
                setSelectedSlot={
                  setSelectedSlot
                }
                isArabic={
                  isArabic
                }
                loading={
                  availabilityLoading
                }
                error={
                  availabilityError
                }
                chooseDateText={
                  copy.chooseDate
                }
                noSlotsText={
                  copy.noSlots
                }
                loadingText={
                  copy.loadingAvailability
                }
              />
            )}
            <div
              className="
                mt-7
                flex
                flex-col-reverse
                gap-3
                border-t
                border-[#ddcfbd]/45
                pt-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      goBack
                    }
                    className="
                      h-11
                      rounded-full
                      border-[#cab28e]/55
                      bg-white/60
                      px-6
                      text-[#6e583b]
                      hover:bg-[#f6ead9]
                      hover:text-[#8f6936]
                    "
                  >
                    <BackArrow className="size-4" />
                    {copy.back}
                  </Button>
                ) : (
                  <div />
                )}
              </div>
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={
                    goNext
                  }
                  disabled={
                    (
                      currentStep === 1 &&
                      !serviceId
                    ) ||
                    (
                      currentStep === 2 &&
                      !branchId
                    ) ||
                    (
                      currentStep === 3 &&
                      !practitionerId
                    )
                  }
                  className={`
                    h-11
                    rounded-full
                    px-7
                    font-semibold
                    ${LANDING_GOLD_BUTTON}
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  `}
                >
                  {copy.next}
                  <NextArrow className="size-4" />
                </Button>
              ) : (
                <div className="w-full sm:w-auto">
                  <Button
                    type="button"
                    disabled={
                      !selectedSlot
                    }
                    className={`
                      h-11
                      w-full
                      rounded-full
                      px-7
                      font-semibold
                      ${LANDING_GOLD_BUTTON}
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    `}
                  >
                    <CheckCircle2 className="size-4" />
                    {copy.continue}
                  </Button>
                  {selectedSlot ? (
                    <p className="mt-2 max-w-sm text-xs leading-5 text-[#82786c]">
                      {copy.pendingPatient}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>
        <BookingSummary
          copy={copy}
          isArabic={
            isArabic
          }
          branch={
            selectedBranch
          }
          service={
            selectedService
          }
          practitioner={
            selectedPractitioner
          }
          bookingDate={
            bookingDate
          }
          selectedSlot={
            selectedSlot
          }
          price={
            selectedPrice
          }
        />
      </div>
      <div
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-3
        "
      >
        <TrustCard
          icon={
            <CalendarDays className="size-5" />
          }
          title={
            copy.realAvailability
          }
          description={
            copy.realAvailabilityText
          }
        />
        <TrustCard
          icon={
            <ShieldCheck className="size-5" />
          }
          title={
            copy.noFakeSlots
          }
          description={
            copy.noFakeSlotsText
          }
        />
        <TrustCard
          icon={
            <Sparkles className="size-5" />
          }
          title={
            copy.editable
          }
          description={
            copy.editableText
          }
        />
      </div>
    </div>
  );
}
function BookingIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <div
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-[#cbb58f]/45
          bg-white/62
          px-3.5
          py-1.5
          text-xs
          font-semibold
          text-[#9a7138]
          shadow-[0_6px_18px_rgba(92,67,38,0.05)]
          backdrop-blur-xl
        "
      >
        <Sparkles className="size-3.5" />
        {eyebrow}
      </div>
      <h1
        className="
          mt-4
          text-3xl
          font-semibold
          tracking-[-0.04em]
          text-[#172238]
          sm:text-4xl
          lg:text-[2.85rem]
        "
      >
        {title}
      </h1>
      <p
        className="
          mx-auto
          mt-4
          max-w-2xl
          text-sm
          leading-7
          text-[#68717f]
          sm:text-base
        "
      >
        {description}
      </p>
    </header>
  );
}
function BookingStepper({
  steps,
  currentStep,
  serviceComplete,
  branchComplete,
  practitionerComplete,
  appointmentComplete,
}: {
  steps: string[];
  currentStep: WizardStep;
  serviceComplete: boolean;
  branchComplete: boolean;
  practitionerComplete: boolean;
  appointmentComplete: boolean;
}) {
  const complete = [
    serviceComplete,
    branchComplete,
    practitionerComplete,
    appointmentComplete,
    false,
    false,
  ];
  return (
    <div
      className="
        mt-8
        overflow-x-auto
        rounded-[26px]
        border
        border-[#d4c2a7]/45
        bg-white/58
        px-4
        py-4
        shadow-[0_16px_44px_rgba(79,58,35,0.055)]
        backdrop-blur-xl
        sm:px-5
      "
    >
      <div className="mx-auto flex min-w-[680px] max-w-5xl items-start">
        {steps.map(
          (
            step,
            index,
          ) => {
            const number =
              index + 1;
            const active =
              number ===
              currentStep;
            const done =
              complete[index];
            return (
              <React.Fragment
                key={step}
              >
                <div className="flex min-w-[82px] flex-col items-center text-center">
                  <div
                    className={[
                      "flex size-9 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition",
                      active
                        ? "border-[#b48745] bg-[#c89e58] text-white shadow-[0_8px_18px_rgba(166,119,55,0.20)]"
                        : done
                          ? "border-[#c39b60]/60 bg-[#f1e1c9] text-[#956d36]"
                          : "border-[#d9c9b4]/60 bg-white/75 text-[#8f8a82]",
                    ].join(" ")}
                  >
                    {done ? (
                      <Check className="size-4" />
                    ) : (
                      number
                    )}
                  </div>
                  <span
                    className={[
                      "mt-2 whitespace-nowrap text-[11px] font-medium",
                      active
                        ? "text-[#9a7138]"
                        : done
                          ? "text-[#74624b]"
                          : "text-[#96918a]",
                    ].join(" ")}
                  >
                    {step}
                  </span>
                </div>
                {index <
                steps.length -
                  1 ? (
                  <div
                    className={[
                      "mt-[17px] h-px flex-1",
                      done
                        ? "bg-[#c5a16b]/65"
                        : "bg-[#ded3c3]/70",
                    ].join(" ")}
                  />
                ) : null}
              </React.Fragment>
            );
          },
        )}
      </div>
    </div>
  );
}
function ServiceStep({
  services,
  selectedId,
  isArabic,
  noServicesTitle,
  noServicesText,
  minutesLabel,
  onSelect,
}: {
  services:
    PublicBookingService[];
  selectedId:
    number | null;
  isArabic: boolean;
  noServicesTitle: string;
  noServicesText: string;
  minutesLabel: string;
  onSelect: (
    service:
      PublicBookingService,
  ) => void;
}) {
  if (
    services.length === 0
  ) {
    return (
      <EmptyState
        icon={
          <Stethoscope className="size-7" />
        }
        title={
          noServicesTitle
        }
        description={
          noServicesText
        }
      />
    );
  }
  return (
    <div
      className="
        grid
        gap-3
        md:grid-cols-2
      "
    >
      {services.map(
        (service) => {
          const selected =
            selectedId ===
            service.id;
          const price =
            formatBookingPrice(
              service
                .effective_sale_price,
            );
          return (
            <button
              key={service.id}
              type="button"
              onClick={() =>
                onSelect(
                  service,
                )
              }
              className={[
                "group rounded-[20px] border p-4 text-start transition duration-200",
                selected
                  ? "border-[#b58a4a]/70 bg-[#f3e3cc] shadow-[0_14px_28px_rgba(145,103,48,0.10)]"
                  : "border-[#d9cab5]/50 bg-white/68 hover:-translate-y-0.5 hover:border-[#c5a474]/65 hover:bg-white/90",
              ].join(" ")}
            >
              <div className="flex gap-3">
                <div
                  className="
                    flex
                    size-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-[16px]
                    border
                    border-white/75
                    bg-[linear-gradient(145deg,#fbf5ec_0%,#ead8bf_100%)]
                    text-[#a57b3d]
                  "
                >
                  <Stethoscope className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-6 text-[#273245]">
                      {localizedBookingService(
                        service,
                        isArabic,
                      )}
                    </h3>
                    {selected ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c89e58] text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#777e88]">
                    {service.duration_minutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5 text-[#b48745]" />
                        <span
                          dir="ltr"
                          className="tabular-nums"
                        >
                          {service.duration_minutes}
                        </span>
                        {minutesLabel}
                      </span>
                    ) : null}
                    {price ? (
                      <span className="font-semibold text-[#956d37]">
                        <span
                          dir="ltr"
                          className="tabular-nums"
                        >
                          {price}
                        </span>{" "}
                        {isArabic
                          ? "ر.س"
                          : "SAR"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
function BranchStep({
  branches,
  selectedId,
  isArabic,
  mainBranchLabel,
  emptyText,
  onSelect,
}: {
  branches:
    PublicBookingBranch[];
  selectedId:
    number | null;
  isArabic: boolean;
  mainBranchLabel: string;
  emptyText: string;
  onSelect: (
    branch:
      PublicBookingBranch,
  ) => void;
}) {
  if (
    branches.length === 0
  ) {
    return (
      <EmptyState
        icon={
          <Building2 className="size-7" />
        }
        title={
          emptyText
        }
      />
    );
  }
  return (
    <div
      className="
        grid
        gap-3
        md:grid-cols-2
      "
    >
      {branches.map(
        (branch) => {
          const selected =
            selectedId ===
            branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() =>
                onSelect(
                  branch,
                )
              }
              className={[
                "rounded-[20px] border p-4 text-start transition duration-200",
                selected
                  ? "border-[#b58a4a]/70 bg-[#f3e3cc] shadow-[0_14px_28px_rgba(145,103,48,0.10)]"
                  : "border-[#d9cab5]/50 bg-white/68 hover:-translate-y-0.5 hover:border-[#c5a474]/65 hover:bg-white/90",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-[#f0dfc7] text-[#a57b3d]">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#273245]">
                      {localizedBookingBranch(
                        branch,
                        isArabic,
                      )}
                    </h3>
                    {branch.city ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#7b818a]">
                        <MapPin className="size-3.5 text-[#b48745]" />
                        {branch.city}
                      </p>
                    ) : null}
                    {branch.is_default ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#9b7137]">
                        {mainBranchLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
                {selected ? (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c89e58] text-white">
                    <Check className="size-3.5" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
function PractitionerStep({
  practitioners,
  selectedId,
  isArabic,
  emptyText,
  onSelect,
}: {
  practitioners:
    PublicBookingPractitioner[];
  selectedId:
    number | null;
  isArabic: boolean;
  emptyText: string;
  onSelect: (
    practitioner:
      PublicBookingPractitioner,
  ) => void;
}) {
  if (
    practitioners.length === 0
  ) {
    return (
      <EmptyState
        icon={
          <UserRound className="size-7" />
        }
        title={
          emptyText
        }
      />
    );
  }
  return (
    <div
      className="
        grid
        gap-3
        md:grid-cols-2
      "
    >
      {practitioners.map(
        (practitioner) => {
          const selected =
            selectedId ===
            practitioner.id;
          const name =
            localizedBookingPractitioner(
              practitioner,
              isArabic,
            );
          const specialty =
            localizedBookingSpecialty(
              practitioner
                .primary_specialty,
              isArabic,
            );
          return (
            <button
              key={
                practitioner.id
              }
              type="button"
              onClick={() =>
                onSelect(
                  practitioner,
                )
              }
              className={[
                "rounded-[20px] border p-4 text-start transition duration-200",
                selected
                  ? "border-[#b58a4a]/70 bg-[#f3e3cc] shadow-[0_14px_28px_rgba(145,103,48,0.10)]"
                  : "border-[#d9cab5]/50 bg-white/68 hover:-translate-y-0.5 hover:border-[#c5a474]/65 hover:bg-white/90",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    size-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#d0b68f]/50
                    bg-[linear-gradient(145deg,#f8ecda_0%,#e8d3b5_100%)]
                    text-sm
                    font-semibold
                    text-[#986e36]
                  "
                >
                  {initials(
                    name,
                  ) || (
                    <UserRound className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-6 text-[#273245]">
                      {name}
                    </h3>
                    {selected ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c89e58] text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                  {practitioner.professional_title ? (
                    <p className="mt-1 text-xs font-medium text-[#9a7138]">
                      {practitioner.professional_title}
                    </p>
                  ) : null}
                  {specialty ? (
                    <p className="mt-1 text-xs text-[#777f88]">
                      {specialty}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
function AppointmentStep({
  dateChoices,
  bookingDate,
  setBookingDate,
  slots,
  selectedSlot,
  setSelectedSlot,
  isArabic,
  loading,
  error,
  chooseDateText,
  noSlotsText,
  loadingText,
}: {
  dateChoices: Date[];
  bookingDate: string;
  setBookingDate: (
    value: string,
  ) => void;
  slots:
    PublicBookingSlot[];
  selectedSlot:
    PublicBookingSlot | null;
  setSelectedSlot: (
    value:
      PublicBookingSlot | null,
  ) => void;
  isArabic: boolean;
  loading: boolean;
  error: string;
  chooseDateText: string;
  noSlotsText: string;
  loadingText: string;
}) {
  return (
    <div>
      <div
        className="
          grid
          grid-cols-4
          gap-2
          sm:grid-cols-7
        "
      >
        {dateChoices.map(
          (date) => {
            const value =
              localDateValue(
                date,
              );
            const selected =
              bookingDate ===
              value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setBookingDate(
                    value,
                  );
                  setSelectedSlot(
                    null,
                  );
                }}
                className={[
                  "rounded-[17px] border px-2 py-3 text-center transition",
                  selected
                    ? "border-[#b48745] bg-[#c89e58] text-[#2e251a] shadow-[0_9px_20px_rgba(168,121,56,0.18)]"
                    : "border-[#d8c8b2]/55 bg-white/66 text-[#536071] hover:border-[#bea071]/65 hover:bg-[#f8efe2]",
                ].join(" ")}
              >
                <div className="text-[10px] font-medium">
                  {weekdayLabel(
                    date,
                    isArabic,
                  )}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {englishDayNumber(
                    date,
                  )}
                </div>
                <div className="text-[10px] uppercase">
                  {englishMonthLabel(
                    date,
                  )}
                </div>
              </button>
            );
          },
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#806443]">
          <CalendarDays className="size-4 text-[#b48745]" />
          <input
            type="date"
            min={
              localDateValue()
            }
            value={
              bookingDate
            }
            onChange={(
              event,
            ) => {
              setBookingDate(
                event.target.value,
              );
              setSelectedSlot(
                null,
              );
            }}
            className="
              h-10
              rounded-xl
              border
              border-[#d0bda1]/60
              bg-white/78
              px-3
              text-sm
              font-normal
              text-[#354153]
              outline-none
              focus:border-[#b48745]
              focus:ring-2
              focus:ring-[#d8b979]/20
            "
          />
        </label>
      </div>
      {!bookingDate ? (
        <div className="mt-5">
          <CompactEmpty
            icon={
              <CalendarDays className="size-5" />
            }
            text={
              chooseDateText
            }
          />
        </div>
      ) : loading ? (
        <div className="mt-6 flex min-h-24 items-center justify-center gap-2 text-sm text-[#79736b]">
          <Loader2 className="size-4 animate-spin text-[#b48745]" />
          {loadingText}
        </div>
      ) : error ? (
        <div className="mt-5">
          <CompactEmpty
            icon={
              <Clock3 className="size-5" />
            }
            text={error}
          />
        </div>
      ) : slots.length ===
        0 ? (
        <div className="mt-5">
          <CompactEmpty
            icon={
              <Clock3 className="size-5" />
            }
            text={
              noSlotsText
            }
          />
        </div>
      ) : (
        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-2
            sm:grid-cols-3
            xl:grid-cols-4
          "
        >
          {slots.map(
            (slot) => {
              const selected =
                selectedSlot
                  ?.start ===
                slot.start;
              return (
                <button
                  key={
                    slot.start
                  }
                  type="button"
                  onClick={() =>
                    setSelectedSlot(
                      slot,
                    )
                  }
                  className={[
                    "h-11 rounded-xl border text-sm font-semibold tabular-nums transition",
                    selected
                      ? "border-[#b48745] bg-[#c89e58] text-[#2e251a] shadow-[0_8px_20px_rgba(168,121,56,0.18)]"
                      : "border-[#d8c8b2]/55 bg-white/70 text-[#354153] hover:border-[#bea071]/70 hover:bg-[#f8efe2]",
                  ].join(" ")}
                >
                  {timeLabel(
                    slot.start,
                  )}
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
function BookingSummary({
  copy,
  isArabic,
  branch,
  service,
  practitioner,
  bookingDate,
  selectedSlot,
  price,
}: {
  copy: Record<
    string,
    string
  >;
  isArabic: boolean;
  branch:
    PublicBookingBranch | null;
  service:
    PublicBookingService | null;
  practitioner:
    PublicBookingPractitioner | null;
  bookingDate: string;
  selectedSlot:
    PublicBookingSlot | null;
  price: string;
}) {
  return (
    <aside
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-[#cbb99d]/48
        bg-white/68
        shadow-[0_22px_58px_rgba(83,61,35,0.07)]
        backdrop-blur-xl
        lg:sticky
        lg:top-28
      "
    >
      <div
        className="
          border-b
          border-[#ddcfbd]/45
          bg-[linear-gradient(145deg,#fbf5ec_0%,#eee0cd_100%)]
          p-5
        "
      >
        <div className="flex items-center gap-2 text-[#9a7138]">
          <Sparkles className="size-4" />
          <span className="text-xs font-semibold">
            MARILYN CLINICS
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-[#172238]">
          {copy.bookingSummary}
        </h3>
        <p className="mt-1 text-xs leading-5 text-[#766f67]">
          {copy.summaryHint}
        </p>
      </div>
      <div className="space-y-1 p-4">
        <SummaryRow
          icon={
            <Stethoscope className="size-4" />
          }
          label={
            copy.service
          }
          value={
            service
              ? localizedBookingService(
                  service,
                  isArabic,
                )
              : copy.notSelected
          }
        />
        <SummaryRow
          icon={
            <Building2 className="size-4" />
          }
          label={
            copy.branch
          }
          value={
            branch
              ? localizedBookingBranch(
                  branch,
                  isArabic,
                )
              : copy.notSelected
          }
        />
        <SummaryRow
          icon={
            <UserRound className="size-4" />
          }
          label={
            copy.practitioner
          }
          value={
            practitioner
              ? localizedBookingPractitioner(
                  practitioner,
                  isArabic,
                )
              : copy.notSelected
          }
        />
        <SummaryRow
          icon={
            <CalendarDays className="size-4" />
          }
          label={
            copy.date
          }
          value={
            bookingDate ||
            copy.notSelected
          }
          ltr={
            Boolean(
              bookingDate,
            )
          }
        />
        <SummaryRow
          icon={
            <Clock3 className="size-4" />
          }
          label={
            copy.time
          }
          value={
            selectedSlot
              ? timeLabel(
                  selectedSlot.start,
                )
              : copy.notSelected
          }
          ltr={
            Boolean(
              selectedSlot,
            )
          }
        />
      </div>
      {service ? (
        <div
          className="
            mx-4
            mb-4
            rounded-[18px]
            border
            border-[#d3bd98]/45
            bg-[#f6ebdb]/62
            p-4
          "
        >
          <div className="flex items-center justify-between gap-3 text-xs text-[#786e62]">
            <span>
              {copy.duration}
            </span>
            <span className="font-semibold tabular-nums text-[#374153]">
              {service.duration_minutes}{" "}
              {copy.minutes}
            </span>
          </div>
          {price ? (
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#dac9b1]/50 pt-2">
              <span className="text-xs text-[#786e62]">
                {copy.price}
              </span>
              <span className="font-semibold text-[#956c35]">
                <span
                  dir="ltr"
                  className="tabular-nums"
                >
                  {price}
                </span>{" "}
                {isArabic
                  ? "ر.س"
                  : "SAR"}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="border-t border-[#ddcfbd]/45 px-4 py-4">
        <div className="flex items-center gap-2 text-xs leading-5 text-[#766f67]">
          <ShieldCheck className="size-4 shrink-0 text-[#b48745]" />
          <span>
            {copy.realAvailabilityText}
          </span>
        </div>
      </div>
    </aside>
  );
}
function SummaryRow({
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
    <div
      className="
        flex
        items-start
        gap-3
        rounded-[16px]
        px-3
        py-3
        transition
        hover:bg-[#f8f0e5]/60
      "
    >
      <div className="mt-0.5 text-[#b48745]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-[#92897f]">
          {label}
        </div>
        <div
          dir={
            ltr
              ? "ltr"
              : undefined
          }
          className="
            mt-0.5
            truncate
            text-sm
            font-semibold
            text-[#354153]
          "
        >
          {value}
        </div>
      </div>
    </div>
  );
}
function TrustCard({
  icon,
  title,
  description,
}: {
  icon:
    React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-[20px]
        border
        border-[#d7c7b0]/40
        bg-white/52
        p-4
        backdrop-blur-lg
      "
    >
      <div
        className="
          flex
          size-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-[#d4bc95]/45
          bg-[#f3e5d1]
          text-[#a57b3d]
        "
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-[#354153]">
          {title}
        </div>
        <p className="mt-1 text-xs leading-5 text-[#7b7e82]">
          {description}
        </p>
      </div>
    </div>
  );
}
function EmptyState({
  icon,
  title,
  description,
}: {
  icon:
    React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div
      className="
        flex
        min-h-[250px]
        flex-col
        items-center
        justify-center
        rounded-[22px]
        border
        border-dashed
        border-[#d2bea0]/65
        bg-[linear-gradient(145deg,rgba(251,245,236,0.72)_0%,rgba(238,224,205,0.56)_100%)]
        px-5
        py-10
        text-center
      "
    >
      <div
        className="
          flex
          size-14
          items-center
          justify-center
          rounded-[18px]
          border
          border-white/75
          bg-white/70
          text-[#a57b3d]
          shadow-[0_10px_24px_rgba(130,91,44,0.08)]
        "
      >
        {icon}
      </div>
      <h3 className="mt-4 max-w-lg text-base font-semibold text-[#354153]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-lg text-sm leading-7 text-[#7b7d80]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
function CompactEmpty({
  icon,
  text,
}: {
  icon:
    React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="
        flex
        min-h-20
        items-center
        gap-3
        rounded-[17px]
        border
        border-dashed
        border-[#d4c2a7]/65
        bg-[#f7efe4]/55
        px-4
        py-3
        text-sm
        text-[#756e65]
      "
    >
      <span className="text-[#b48745]">
        {icon}
      </span>
      <span>
        {text}
      </span>
    </div>
  );
}
