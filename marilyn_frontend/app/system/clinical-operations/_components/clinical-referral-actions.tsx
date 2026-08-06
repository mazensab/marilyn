"use client";

import * as React from "react";
import {
  Ban,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  MoreVertical,
  PlayCircle,
  Plus,
  Send,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;

type ReferralSnapshot = {
  id: string;
  number: string;
  status: string;
  priority: string;
  receivingPractitionerId: string;
  targetBranchId: string;
  targetDepartmentId: string;
  targetClinicId: string;
  referralReason: string;
  clinicalSummary: string;
  requestedService: string;
  referredAt: string;
  expiresAt: string;
  notes: string;
  allowsRecordAccess: boolean;
};

type AccessSnapshot = {
  id: string;
  status: string;
  scope: string;
  sharedSections: string[];
  accessStartsAt: string;
  accessEndsAt: string;
  notes: string;
} | null;

type Option = {
  id: string;
  name: string;
  code: string;
  branchId: string;
  departmentId: string;
};

type ReferralForm = {
  priority: string;
  receivingPractitionerId: string;
  targetBranchId: string;
  targetDepartmentId: string;
  targetClinicId: string;
  referralReason: string;
  clinicalSummary: string;
  requestedService: string;
  referredAt: string;
  expiresAt: string;
  notes: string;
};

type AccessForm = {
  scope: string;
  sharedSections: string[];
  accessStartsAt: string;
  accessEndsAt: string;
  notes: string;
};

type ReferralActionProps = {
  locale: Locale;
  referral: ReferralSnapshot;
  onChanged: () => void | Promise<void>;
};

type RecordAccessActionProps = {
  locale: Locale;
  referralId: string;
  referralAllowsRecordAccess: boolean;
  receivingPractitionerId: string;
  access: AccessSnapshot;
  onChanged: () => void | Promise<void>;
};

const copy = {
  ar: {
    actions: "الإجراءات",
    editReferral: "تعديل الإحالة",
    editReferralDescription:
      "يمكن تعديل الإحالة ما دامت في حالة المسودة فقط.",
    save: "حفظ التعديلات",
    cancel: "إلغاء",
    priority: "الأولوية",
    receiver: "الممارس المستقبِل",
    branch: "الفرع المستهدف",
    department: "القسم المستهدف",
    clinic: "العيادة المستهدفة",
    reason: "سبب الإحالة",
    summary: "الملخص السريري",
    requestedService: "الخدمة المطلوبة",
    referredAt: "تاريخ الإحالة",
    expiresAt: "تاريخ الانتهاء",
    notes: "الملاحظات",
    choose: "اختر",
    none: "غير محدد",
    loadingOptions: "جارٍ تحميل الخيارات...",
    referralReasonRequired: "سبب الإحالة مطلوب.",
    referralUpdated: "تم تحديث الإحالة الطبية.",
    statusUpdated: "تم تحديث حالة الإحالة.",
    statusTitle: "تأكيد تغيير حالة الإحالة",
    statusDescription:
      "سيتم تنفيذ انتقال الحالة عبر واجهة الإحالات الطبية.",
    send: "إرسال الإحالة",
    accept: "قبول الإحالة",
    start: "بدء التنفيذ",
    complete: "إكمال الإحالة",
    reject: "رفض الإحالة",
    cancelReferral: "إلغاء الإحالة",
    expire: "إنهاء الصلاحية",
    reasonLabel: "السبب",
    rejectionReason: "سبب الرفض",
    cancellationReason: "سبب الإلغاء",
    reasonRequired: "يجب إدخال السبب.",
    confirm: "تأكيد",
    noActions: "لا توجد إجراءات متاحة للحالة الحالية.",

    createAccess: "إنشاء صلاحية سجل",
    editAccess: "تعديل صلاحية السجل",
    accessFormDescription:
      "حدد نطاق المشاركة والأقسام والتوقيتات قبل تفعيل الصلاحية.",
    scope: "نطاق المشاركة",
    sharedSections: "الأقسام المشتركة",
    accessStartsAt: "بداية الصلاحية",
    accessEndsAt: "نهاية الصلاحية",
    accessCreated: "تم إنشاء صلاحية الوصول للسجل الطبي.",
    accessUpdated: "تم تحديث صلاحية الوصول للسجل الطبي.",
    accessStatusUpdated: "تم تحديث حالة صلاحية السجل الطبي.",
    activateAccess: "تفعيل الصلاحية",
    rejectAccess: "رفض الصلاحية",
    revokeAccess: "سحب الصلاحية",
    expireAccess: "إنهاء الصلاحية",
    accessStatusTitle: "تأكيد إجراء صلاحية السجل",
    accessStatusDescription:
      "سيتم تنفيذ الإجراء وفق انتقالات حالة صلاحية السجل الطبي.",
    revocationReason: "سبب سحب الصلاحية",
    customSectionsRequired:
      "يجب اختيار قسم واحد على الأقل عند استخدام النطاق المخصص.",
    activationBlocked:
      "لا تسمح حالة الإحالة الحالية بتفعيل الوصول إلى السجل.",
    receiverRequired:
      "يجب تحديد ممارس مستقبِل قبل تفعيل صلاحية السجل.",
    requestFailed: "تعذر تنفيذ العملية.",

    priorities: {
      LOW: "منخفضة",
      ROUTINE: "اعتيادية",
      NORMAL: "عادية",
      MEDIUM: "متوسطة",
      HIGH: "عالية",
      URGENT: "عاجلة",
      EMERGENCY: "طارئة",
    },
    scopes: {
      SUMMARY: "ملخص المريض",
      SOURCE_ENCOUNTER: "الزيارة المصدر",
      FULL_RECORD: "السجل الطبي الكامل",
      CUSTOM: "أقسام مخصصة",
    },
    sections: {
      PATIENT_SUMMARY: "ملخص المريض",
      SOURCE_ENCOUNTER: "الزيارة المصدر",
      DIAGNOSES: "التشخيصات",
      PROCEDURES: "الإجراءات",
      CLINICAL_NOTES: "الملاحظات السريرية",
      TREATMENT_PLAN: "الخطة العلاجية",
      FOLLOW_UP_PLAN: "خطة المتابعة",
    },
  },
  en: {
    actions: "Actions",
    editReferral: "Edit referral",
    editReferralDescription:
      "A referral can be edited only while it is in draft status.",
    save: "Save changes",
    cancel: "Cancel",
    priority: "Priority",
    receiver: "Receiving practitioner",
    branch: "Target branch",
    department: "Target department",
    clinic: "Target clinic",
    reason: "Referral reason",
    summary: "Clinical summary",
    requestedService: "Requested service",
    referredAt: "Referred at",
    expiresAt: "Expires at",
    notes: "Notes",
    choose: "Choose",
    none: "Not specified",
    loadingOptions: "Loading options...",
    referralReasonRequired: "Referral reason is required.",
    referralUpdated: "Medical referral updated.",
    statusUpdated: "Referral status updated.",
    statusTitle: "Confirm referral status change",
    statusDescription:
      "The transition will be performed through the medical-referral API.",
    send: "Send referral",
    accept: "Accept referral",
    start: "Start referral",
    complete: "Complete referral",
    reject: "Reject referral",
    cancelReferral: "Cancel referral",
    expire: "Expire referral",
    reasonLabel: "Reason",
    rejectionReason: "Rejection reason",
    cancellationReason: "Cancellation reason",
    reasonRequired: "A reason is required.",
    confirm: "Confirm",
    noActions: "No actions are available for the current status.",

    createAccess: "Create record access",
    editAccess: "Edit record access",
    accessFormDescription:
      "Set sharing scope, sections, and timing before activating access.",
    scope: "Sharing scope",
    sharedSections: "Shared sections",
    accessStartsAt: "Access starts at",
    accessEndsAt: "Access ends at",
    accessCreated: "Medical-record access created.",
    accessUpdated: "Medical-record access updated.",
    accessStatusUpdated: "Medical-record access status updated.",
    activateAccess: "Activate access",
    rejectAccess: "Reject access",
    revokeAccess: "Revoke access",
    expireAccess: "Expire access",
    accessStatusTitle: "Confirm record-access action",
    accessStatusDescription:
      "The action will follow the medical-record access status contract.",
    revocationReason: "Revocation reason",
    customSectionsRequired:
      "Choose at least one section when using custom scope.",
    activationBlocked:
      "The current referral status does not allow record access activation.",
    receiverRequired:
      "A receiving practitioner is required before access can be activated.",
    requestFailed: "The operation could not be completed.",

    priorities: {
      LOW: "Low",
      ROUTINE: "Routine",
      NORMAL: "Normal",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
      EMERGENCY: "Emergency",
    },
    scopes: {
      SUMMARY: "Patient summary",
      SOURCE_ENCOUNTER: "Source encounter",
      FULL_RECORD: "Full medical record",
      CUSTOM: "Custom sections",
    },
    sections: {
      PATIENT_SUMMARY: "Patient summary",
      SOURCE_ENCOUNTER: "Source encounter",
      DIAGNOSES: "Diagnoses",
      PROCEDURES: "Procedures",
      CLINICAL_NOTES: "Clinical notes",
      TREATMENT_PLAN: "Treatment plan",
      FOLLOW_UP_PLAN: "Follow-up plan",
    },
  },
} as const;

const PRIORITIES = [
  "LOW",
  "ROUTINE",
  "NORMAL",
  "MEDIUM",
  "HIGH",
  "URGENT",
  "EMERGENCY",
] as const;

const SCOPES = [
  "SUMMARY",
  "SOURCE_ENCOUNTER",
  "FULL_RECORD",
  "CUSTOM",
] as const;

const SECTIONS = [
  "PATIENT_SUMMARY",
  "SOURCE_ENCOUNTER",
  "DIAGNOSES",
  "PROCEDURES",
  "CLINICAL_NOTES",
  "TREATMENT_PLAN",
  "FOLLOW_UP_PLAN",
] as const;

const REFERRAL_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED", "EXPIRED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED", "EXPIRED"],
};

const ACCESS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["REVOKED", "EXPIRED"],
};

function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function record(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim() || fallback;
  }

  return fallback;
}

function extractArray(payload: unknown, depth = 0): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload) || depth > 3) {
    return [];
  }

  const candidates = [
    payload.items,
    payload.results,
    payload.records,
    payload.rows,
    payload.data,
    payload.result,
    payload.payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    const nested = extractArray(candidate, depth + 1);
    if (nested.length) {
      return nested;
    }
  }

  return [];
}

function normalizeOption(value: unknown): Option {
  const source = record(value);
  const branch = record(source.branch);
  const department = record(source.department);

  return {
    id: text(source.id || source.pk),
    name: text(
      source.full_name ||
        source.full_name_ar ||
        source.full_name_en ||
        source.name_ar ||
        source.name_en ||
        source.name ||
        source.title ||
        source.code,
    ),
    code: text(
      source.practitioner_number ||
        source.branch_code ||
        source.code,
    ),
    branchId: text(source.branch_id || branch.id || branch.pk),
    departmentId: text(
      source.department_id ||
        department.id ||
        department.pk,
    ),
  };
}

function getApiBaseUrl() {
  const value = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");

  return value.endsWith("/api")
    ? value.slice(0, -4)
    : value;
}

function errorMessage(payload: unknown, fallback: string) {
  const source = record(payload);
  const errors = record(source.errors);
  const messages: string[] = [];

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const message = text(item);
        if (message) {
          messages.push(message);
        }
      }
    } else {
      const message = text(value);
      if (message) {
        messages.push(message);
      }
    }
  }

  return (
    text(source.message || source.detail || source.error) ||
    messages.join(" • ") ||
    fallback
  );
}

async function apiRequest(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: ApiRecord;
    signal?: AbortSignal;
  } = {},
): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  const raw = await response.text();
  let payload: unknown = {};

  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      errorMessage(payload, `HTTP ${response.status}`),
    );
  }

  return payload;
}

function toInputDateTime(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const local = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

function toApiDateTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString();
}

function referralForm(referral: ReferralSnapshot): ReferralForm {
  return {
    priority: referral.priority || "ROUTINE",
    receivingPractitionerId:
      referral.receivingPractitionerId || "none",
    targetBranchId: referral.targetBranchId || "none",
    targetDepartmentId:
      referral.targetDepartmentId || "none",
    targetClinicId: referral.targetClinicId || "none",
    referralReason: referral.referralReason || "",
    clinicalSummary: referral.clinicalSummary || "",
    requestedService: referral.requestedService || "",
    referredAt: toInputDateTime(referral.referredAt),
    expiresAt: toInputDateTime(referral.expiresAt),
    notes: referral.notes || "",
  };
}

function accessForm(access: AccessSnapshot): AccessForm {
  return {
    scope: access?.scope || "SUMMARY",
    sharedSections: access?.sharedSections || [],
    accessStartsAt: toInputDateTime(access?.accessStartsAt || ""),
    accessEndsAt: toInputDateTime(access?.accessEndsAt || ""),
    notes: access?.notes || "",
  };
}

function actionLabel(
  status: string,
  locale: Locale,
) {
  const t = copy[locale];
  const labels: Record<string, string> = {
    SENT: t.send,
    ACCEPTED: t.accept,
    IN_PROGRESS: t.start,
    COMPLETED: t.complete,
    REJECTED: t.reject,
    CANCELLED: t.cancelReferral,
    EXPIRED: t.expire,
  };

  return labels[status] || status;
}

function actionIcon(status: string) {
  if (status === "SENT") return Send;
  if (status === "ACCEPTED") return CheckCircle2;
  if (status === "IN_PROGRESS") return PlayCircle;
  if (status === "COMPLETED") return CheckCircle2;
  if (status === "REJECTED") return XCircle;
  if (status === "CANCELLED") return Ban;
  return Clock3;
}

export function ClinicalReferralActions({
  locale,
  referral,
  onChanged,
}: ReferralActionProps) {
  const t = copy[locale];
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<ReferralForm>(() =>
    referralForm(referral),
  );
  const [optionsLoading, setOptionsLoading] = React.useState(false);
  const [practitioners, setPractitioners] = React.useState<Option[]>([]);
  const [branches, setBranches] = React.useState<Option[]>([]);
  const [departments, setDepartments] = React.useState<Option[]>([]);
  const [clinics, setClinics] = React.useState<Option[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    setForm(referralForm(referral));
  }, [referral]);

  const loadOptions = React.useCallback(async () => {
    setOptionsLoading(true);

    try {
      const results = await Promise.allSettled([
        apiRequest(
          "/api/company/medical/practitioners/?page_size=500",
        ),
        apiRequest("/api/company/branches/?page_size=500"),
        apiRequest(
          "/api/company/medical/departments/?page_size=500",
        ),
        apiRequest(
          "/api/company/medical/clinics/?page_size=500",
        ),
      ]);

      const setters = [
        setPractitioners,
        setBranches,
        setDepartments,
        setClinics,
      ];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](
            extractArray(result.value)
              .map(normalizeOption)
              .filter((item) => item.id),
          );
        }
      });

      const rejection = results.find(
        (result) => result.status === "rejected",
      );

      if (rejection?.status === "rejected") {
        toast.warning(
          rejection.reason instanceof Error
            ? rejection.reason.message
            : t.requestFailed,
        );
      }
    } finally {
      setOptionsLoading(false);
    }
  }, [t.requestFailed]);

  const openEdit = () => {
    setForm(referralForm(referral));
    setEditOpen(true);
    void loadOptions();
  };

  const filteredDepartments = React.useMemo(() => {
    if (form.targetBranchId === "none") {
      return departments;
    }

    return departments.filter(
      (item) =>
        !item.branchId ||
        item.branchId === form.targetBranchId,
    );
  }, [departments, form.targetBranchId]);

  const filteredClinics = React.useMemo(() => {
    return clinics.filter((item) => {
      if (
        form.targetBranchId !== "none" &&
        item.branchId &&
        item.branchId !== form.targetBranchId
      ) {
        return false;
      }

      if (
        form.targetDepartmentId !== "none" &&
        item.departmentId &&
        item.departmentId !== form.targetDepartmentId
      ) {
        return false;
      }

      return true;
    });
  }, [clinics, form.targetBranchId, form.targetDepartmentId]);

  const saveReferral = async () => {
    if (!form.referralReason.trim()) {
      toast.error(t.referralReasonRequired);
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        `/api/company/medical/referrals/${encodeURIComponent(
          referral.id,
        )}/`,
        {
          method: "PATCH",
          body: {
            priority: form.priority,
            receiving_practitioner_id:
              form.receivingPractitionerId === "none"
                ? null
                : form.receivingPractitionerId,
            target_branch_id:
              form.targetBranchId === "none"
                ? null
                : form.targetBranchId,
            target_department_id:
              form.targetDepartmentId === "none"
                ? null
                : form.targetDepartmentId,
            target_clinic_id:
              form.targetClinicId === "none"
                ? null
                : form.targetClinicId,
            referral_reason: form.referralReason.trim(),
            clinical_summary: form.clinicalSummary.trim(),
            requested_service: form.requestedService.trim(),
            referred_at: toApiDateTime(form.referredAt),
            expires_at: toApiDateTime(form.expiresAt),
            notes: form.notes.trim(),
          },
        },
      );

      toast.success(t.referralUpdated);
      setEditOpen(false);
      await onChanged();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.requestFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    if (!statusTarget) {
      return;
    }

    const requiresReason = ["REJECTED", "CANCELLED"].includes(
      statusTarget,
    );

    if (requiresReason && !reason.trim()) {
      toast.error(t.reasonRequired);
      return;
    }

    setSaving(true);

    try {
      const body: ApiRecord = {
        status: statusTarget,
      };

      if (statusTarget === "REJECTED") {
        body.rejection_reason = reason.trim();
      }

      if (statusTarget === "CANCELLED") {
        body.cancellation_reason = reason.trim();
      }

      await apiRequest(
        `/api/company/medical/referrals/${encodeURIComponent(
          referral.id,
        )}/status/`,
        {
          method: "PATCH",
          body,
        },
      );

      toast.success(t.statusUpdated);
      setStatusTarget("");
      setReason("");
      await onChanged();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.requestFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const transitions = REFERRAL_TRANSITIONS[referral.status] || [];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={registerOutlineButtonClass}
          >
            <MoreVertical className="h-4 w-4" />
            {t.actions}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {referral.status === "DRAFT" ? (
            <DropdownMenuItem onSelect={openEdit}>
              <Edit3 className="h-4 w-4 text-[#a57b3d]" />
              {t.editReferral}
            </DropdownMenuItem>
          ) : null}

          {referral.status === "DRAFT" && transitions.length ? (
            <DropdownMenuSeparator />
          ) : null}

          {transitions.map((target) => {
            const Icon = actionIcon(target);

            return (
              <DropdownMenuItem
                key={target}
                onSelect={() => {
                  setReason("");
                  setStatusTarget(target);
                }}
                className={
                  ["REJECTED", "CANCELLED"].includes(target)
                    ? "text-rose-700 focus:text-rose-700"
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
                {actionLabel(target, locale)}
              </DropdownMenuItem>
            );
          })}

          {!transitions.length && referral.status !== "DRAFT" ? (
            <DropdownMenuItem disabled>
              {t.noActions}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.editReferral}</DialogTitle>
            <DialogDescription>
              {t.editReferralDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.priority}</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    priority: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t.priorities[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.receiver}</Label>
              <Select
                value={form.receivingPractitionerId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    receivingPractitionerId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      optionsLoading ? t.loadingOptions : t.choose
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.none}</SelectItem>
                  {practitioners.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.branch}</Label>
              <Select
                value={form.targetBranchId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    targetBranchId: value,
                    targetDepartmentId: "none",
                    targetClinicId: "none",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.choose} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.none}</SelectItem>
                  {branches.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.department}</Label>
              <Select
                value={form.targetDepartmentId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    targetDepartmentId: value,
                    targetClinicId: "none",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.choose} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.none}</SelectItem>
                  {filteredDepartments.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.clinic}</Label>
              <Select
                value={form.targetClinicId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    targetClinicId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.choose} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.none}</SelectItem>
                  {filteredClinics.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.requestedService}</Label>
              <Input
                value={form.requestedService}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestedService: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t.referredAt}</Label>
              <Input
                type="datetime-local"
                value={form.referredAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    referredAt: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t.expiresAt}</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{t.reason}</Label>
              <Textarea
                value={form.referralReason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    referralReason: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{t.summary}</Label>
              <Textarea
                value={form.clinicalSummary}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    clinicalSummary: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{t.notes}</Label>
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void saveReferral()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setStatusTarget("");
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.statusTitle}</DialogTitle>
            <DialogDescription>
              {t.statusDescription}
            </DialogDescription>
          </DialogHeader>

          {["REJECTED", "CANCELLED"].includes(statusTarget) ? (
            <div className="space-y-2 py-2">
              <Label>
                {statusTarget === "REJECTED"
                  ? t.rejectionReason
                  : t.cancellationReason}
              </Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusTarget("");
                setReason("");
              }}
              disabled={saving}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant={
                ["REJECTED", "CANCELLED"].includes(statusTarget)
                  ? "destructive"
                  : "brand"
              }
              onClick={() => void changeStatus()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {statusTarget
                ? actionLabel(statusTarget, locale)
                : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClinicalRecordAccessActions({
  locale,
  referralId,
  referralAllowsRecordAccess,
  receivingPractitionerId,
  access,
  onChanged,
}: RecordAccessActionProps) {
  const t = copy[locale];
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<AccessForm>(() =>
    accessForm(access),
  );
  const [saving, setSaving] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    setForm(accessForm(access));
  }, [access]);

  const openForm = () => {
    setForm(accessForm(access));
    setFormOpen(true);
  };

  const toggleSection = (value: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      sharedSections: checked
        ? Array.from(new Set([...current.sharedSections, value]))
        : current.sharedSections.filter((item) => item !== value),
    }));
  };

  const saveAccess = async () => {
    if (
      form.scope === "CUSTOM" &&
      form.sharedSections.length === 0
    ) {
      toast.error(t.customSectionsRequired);
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        `/api/company/medical/referrals/${encodeURIComponent(
          referralId,
        )}/record-access/`,
        {
          method: access ? "PATCH" : "POST",
          body: {
            scope: form.scope,
            shared_sections: form.sharedSections,
            access_starts_at: toApiDateTime(form.accessStartsAt),
            access_ends_at: toApiDateTime(form.accessEndsAt),
            notes: form.notes.trim(),
          },
        },
      );

      toast.success(access ? t.accessUpdated : t.accessCreated);
      setFormOpen(false);
      await onChanged();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.requestFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const changeAccessStatus = async () => {
    if (!statusTarget) {
      return;
    }

    if (statusTarget === "ACTIVE") {
      if (!referralAllowsRecordAccess) {
        toast.error(t.activationBlocked);
        return;
      }

      if (!receivingPractitionerId) {
        toast.error(t.receiverRequired);
        return;
      }
    }

    if (
      ["REJECTED", "REVOKED"].includes(statusTarget) &&
      !reason.trim()
    ) {
      toast.error(t.reasonRequired);
      return;
    }

    setSaving(true);

    try {
      const body: ApiRecord = {
        status: statusTarget,
      };

      if (statusTarget === "REJECTED") {
        body.rejection_reason = reason.trim();
      }

      if (statusTarget === "REVOKED") {
        body.revocation_reason = reason.trim();
      }

      await apiRequest(
        `/api/company/medical/referrals/${encodeURIComponent(
          referralId,
        )}/record-access/status/`,
        {
          method: "PATCH",
          body,
        },
      );

      toast.success(t.accessStatusUpdated);
      setStatusTarget("");
      setReason("");
      await onChanged();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : t.requestFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const transitions = access
    ? ACCESS_TRANSITIONS[access.status] || []
    : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!access ? (
          <Button
            type="button"
            variant="brand"
            className={registerBrandButtonClass}
            onClick={openForm}
          >
            <Plus className="h-4 w-4" />
            {t.createAccess}
          </Button>
        ) : access.status === "PENDING" ? (
          <Button
            type="button"
            variant="outline"
            className={registerOutlineButtonClass}
            onClick={openForm}
          >
            <Edit3 className="h-4 w-4" />
            {t.editAccess}
          </Button>
        ) : null}

        {transitions.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={registerOutlineButtonClass}
              >
                <MoreVertical className="h-4 w-4" />
                {t.actions}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {transitions.map((target) => {
                const destructive = ["REJECTED", "REVOKED"].includes(
                  target,
                );
                const Icon =
                  target === "ACTIVE"
                    ? ShieldCheck
                    : target === "REVOKED"
                      ? ShieldOff
                      : target === "REJECTED"
                        ? XCircle
                        : Clock3;
                const label =
                  target === "ACTIVE"
                    ? t.activateAccess
                    : target === "REJECTED"
                      ? t.rejectAccess
                      : target === "REVOKED"
                        ? t.revokeAccess
                        : t.expireAccess;

                return (
                  <DropdownMenuItem
                    key={target}
                    onSelect={() => {
                      setReason("");
                      setStatusTarget(target);
                    }}
                    className={
                      destructive
                        ? "text-rose-700 focus:text-rose-700"
                        : undefined
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {access ? t.editAccess : t.createAccess}
            </DialogTitle>
            <DialogDescription>
              {t.accessFormDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>{t.scope}</Label>
              <Select
                value={form.scope}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    scope: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t.scopes[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>{t.sharedSections}</Label>
              <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                {SECTIONS.map((value) => {
                  const checked = form.sharedSections.includes(value);

                  return (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleSection(value, next === true)
                        }
                      />
                      <span>{t.sections[value]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.accessStartsAt}</Label>
                <Input
                  type="datetime-local"
                  value={form.accessStartsAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accessStartsAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{t.accessEndsAt}</Label>
                <Input
                  type="datetime-local"
                  value={form.accessEndsAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accessEndsAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              onClick={() => void saveAccess()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setStatusTarget("");
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.accessStatusTitle}</DialogTitle>
            <DialogDescription>
              {t.accessStatusDescription}
            </DialogDescription>
          </DialogHeader>

          {["REJECTED", "REVOKED"].includes(statusTarget) ? (
            <div className="space-y-2 py-2">
              <Label>
                {statusTarget === "REJECTED"
                  ? t.rejectionReason
                  : t.revocationReason}
              </Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
              />
            </div>
          ) : null}

          {statusTarget === "ACTIVE" &&
          (!referralAllowsRecordAccess || !receivingPractitionerId) ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {!referralAllowsRecordAccess
                ? t.activationBlocked
                : t.receiverRequired}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusTarget("");
                setReason("");
              }}
              disabled={saving}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant={
                ["REJECTED", "REVOKED"].includes(statusTarget)
                  ? "destructive"
                  : "brand"
              }
              onClick={() => void changeAccessStatus()}
              disabled={
                saving ||
                (statusTarget === "ACTIVE" &&
                  (!referralAllowsRecordAccess ||
                    !receivingPractitionerId))
              }
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {statusTarget === "ACTIVE"
                ? t.activateAccess
                : statusTarget === "REJECTED"
                  ? t.rejectAccess
                  : statusTarget === "REVOKED"
                    ? t.revokeAccess
                    : t.expireAccess}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
