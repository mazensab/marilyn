"use client";

import * as React from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Stethoscope,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  registerBrandButtonClass,
  registerOutlineButtonClass,
} from "@/components/ui/data-register";

type Locale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
type RecordKind = "diagnosis" | "procedure";

type EncounterSnapshot = {
  id: string;
  status: string;
  encounterType: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  clinicalNotes: string;
  treatmentPlan: string;
  followUpPlan: string;
  notes: string;
};

type DiagnosisSnapshot = {
  kind: "diagnosis";
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
  diagnosedAt: string;
  notes: string;
};

type ProcedureSnapshot = {
  kind: "procedure";
  id: string;
  code: string;
  name: string;
  status: string;
  quantity: number;
  unitPrice: number | null;
  notes: string;
};

type RecordSnapshot =
  | DiagnosisSnapshot
  | ProcedureSnapshot;

type ChangeHandler = () => void | Promise<void>;

const copy = {
  ar: {
    editEncounter: "تعديل الزيارة",
    changeStatus: "تغيير الحالة",
    encounterEditTitle: "تعديل بيانات الزيارة",
    encounterEditDescription:
      "حدّث السجل السريري والخطة العلاجية دون تغيير هوية الزيارة.",
    encounterType: "نوع الزيارة",
    chiefComplaint: "الشكوى الرئيسية",
    history: "تاريخ الحالة الحالية",
    clinicalNotes: "الملاحظات السريرية",
    treatmentPlan: "الخطة العلاجية",
    followUpPlan: "خطة المتابعة",
    notes: "الملاحظات",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    saved: "تم تحديث الزيارة الطبية.",
    statusSaved: "تم تحديث حالة الزيارة.",
    statusConfirmTitle: "تأكيد تغيير حالة الزيارة",
    statusConfirmDescription:
      "سيتم تطبيق الانتقال التشغيلي على الزيارة الحالية.",
    statusTarget: "الحالة الجديدة",
    addDiagnosis: "إضافة تشخيص",
    addProcedure: "إضافة إجراء",
    diagnosisTitle: "إضافة تشخيص طبي",
    diagnosisDescription:
      "سجّل التشخيص المرتبط بهذه الزيارة وحدد إن كان التشخيص الأساسي.",
    procedureTitle: "إضافة إجراء طبي",
    procedureDescription:
      "سجّل الإجراء الطبي والكمية والسعر المرجعي والملاحظات.",
    code: "الكود",
    name: "الاسم",
    diagnosedAt: "تاريخ التشخيص",
    primary: "تشخيص أساسي",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    requiredDiagnosis: "كود التشخيص واسمه مطلوبان.",
    requiredProcedure: "كود الإجراء واسمه مطلوبان.",
    invalidQuantity: "الكمية يجب أن تكون رقمًا أكبر من صفر.",
    diagnosisSaved: "تم حفظ التشخيص الطبي.",
    procedureSaved: "تم حفظ الإجراء الطبي.",
    editRecord: "تعديل",
    makePrimary: "تعيين كأساسي",
    primarySaved: "تم تعيين التشخيص كأساسي.",
    recordSaved: "تم تحديث السجل الطبي.",
    procedureStatusSaved: "تم تحديث حالة الإجراء.",
    cancellationReason: "سبب الإلغاء",
    cancellationRequired: "سبب الإلغاء مطلوب.",
    draft: "مسودة",
    open: "مفتوح",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    planned: "مخطط",
    terminalLocked:
      "السجل مغلق ولا يقبل تعديلات تشغيلية جديدة.",
    failed: "تعذر حفظ التغييرات.",
  },
  en: {
    editEncounter: "Edit encounter",
    changeStatus: "Change status",
    encounterEditTitle: "Edit encounter",
    encounterEditDescription:
      "Update the clinical record and treatment plan without changing encounter identity.",
    encounterType: "Encounter type",
    chiefComplaint: "Chief complaint",
    history: "History of present illness",
    clinicalNotes: "Clinical notes",
    treatmentPlan: "Treatment plan",
    followUpPlan: "Follow-up plan",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Medical encounter updated.",
    statusSaved: "Encounter status updated.",
    statusConfirmTitle: "Confirm encounter status change",
    statusConfirmDescription:
      "The selected operational transition will be applied to this encounter.",
    statusTarget: "New status",
    addDiagnosis: "Add diagnosis",
    addProcedure: "Add procedure",
    diagnosisTitle: "Add medical diagnosis",
    diagnosisDescription:
      "Register a diagnosis for this encounter and mark it as primary when needed.",
    procedureTitle: "Add medical procedure",
    procedureDescription:
      "Register the medical procedure, quantity, reference price, and notes.",
    code: "Code",
    name: "Name",
    diagnosedAt: "Diagnosed at",
    primary: "Primary diagnosis",
    quantity: "Quantity",
    unitPrice: "Unit price",
    requiredDiagnosis: "Diagnosis code and name are required.",
    requiredProcedure: "Procedure code and name are required.",
    invalidQuantity: "Quantity must be a number greater than zero.",
    diagnosisSaved: "Medical diagnosis saved.",
    procedureSaved: "Medical procedure saved.",
    editRecord: "Edit",
    makePrimary: "Set as primary",
    primarySaved: "Diagnosis set as primary.",
    recordSaved: "Medical record updated.",
    procedureStatusSaved: "Procedure status updated.",
    cancellationReason: "Cancellation reason",
    cancellationRequired: "Cancellation reason is required.",
    draft: "Draft",
    open: "Open",
    inProgress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    planned: "Planned",
    terminalLocked:
      "This record is closed and cannot accept operational changes.",
    failed: "Could not save the changes.",
  },
} as const;

const ENCOUNTER_TRANSITIONS: Record<
  string,
  string[]
> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

const PROCEDURE_TRANSITIONS: Record<
  string,
  string[]
> = {
  PLANNED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
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

function text(
  value: unknown,
  fallback = "",
) {
  if (
    value === null ||
    value === undefined
  ) {
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

function firstErrorMessage(
  value: unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorMessage(item);
      if (message) {
        return message;
      }
    }
    return "";
  }

  if (isRecord(value)) {
    for (const candidate of [
      value.message,
      value.detail,
      value.error,
      value.errors,
    ]) {
      const message = firstErrorMessage(candidate);
      if (message) {
        return message;
      }
    }

    for (const candidate of Object.values(value)) {
      const message = firstErrorMessage(candidate);
      if (message) {
        return message;
      }
    }
  }

  return "";
}

async function mutate(
  path: string,
  body: ApiRecord,
  method: "POST" | "PATCH" = "PATCH",
) {
  const response = await fetch(
    `${getApiBaseUrl()}${path}`,
    {
      method,
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(body),
    },
  );

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
      firstErrorMessage(payload) ||
        `HTTP ${response.status}`,
    );
  }

  return payload;
}

function statusLabel(
  value: string,
  locale: Locale,
) {
  const t = copy[locale];
  const labels: Record<string, string> = {
    DRAFT: t.draft,
    OPEN: t.open,
    IN_PROGRESS: t.inProgress,
    COMPLETED: t.completed,
    CANCELLED: t.cancelled,
    CANCELED: t.cancelled,
    PLANNED: t.planned,
  };

  return labels[value] || value.replaceAll("_", " ");
}

function localDateTimeValue(
  value?: string,
) {
  const date = value
    ? new Date(value)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(
    date.getTime() - offset * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

export function ClinicalEncounterHeaderActions({
  locale,
  encounter,
  onChanged,
}: {
  locale: Locale;
  encounter: EncounterSnapshot;
  onChanged: ChangeHandler;
}) {
  const t = copy[locale];
  const terminal = [
    "COMPLETED",
    "CANCELLED",
    "CANCELED",
  ].includes(encounter.status);

  const transitions =
    ENCOUNTER_TRANSITIONS[encounter.status] || [];

  const [editOpen, setEditOpen] =
    React.useState(false);
  const [statusOpen, setStatusOpen] =
    React.useState(false);
  const [targetStatus, setTargetStatus] =
    React.useState("");
  const [saving, setSaving] =
    React.useState(false);
  const [form, setForm] = React.useState({
    encounterType: encounter.encounterType,
    chiefComplaint: encounter.chiefComplaint,
    historyOfPresentIllness:
      encounter.historyOfPresentIllness,
    clinicalNotes: encounter.clinicalNotes,
    treatmentPlan: encounter.treatmentPlan,
    followUpPlan: encounter.followUpPlan,
    notes: encounter.notes,
  });

  React.useEffect(() => {
    if (!editOpen) {
      setForm({
        encounterType: encounter.encounterType,
        chiefComplaint: encounter.chiefComplaint,
        historyOfPresentIllness:
          encounter.historyOfPresentIllness,
        clinicalNotes: encounter.clinicalNotes,
        treatmentPlan: encounter.treatmentPlan,
        followUpPlan: encounter.followUpPlan,
        notes: encounter.notes,
      });
    }
  }, [editOpen, encounter]);

  const saveEncounter = async () => {
    setSaving(true);

    try {
      await mutate(
        `/api/company/medical/encounters/${encodeURIComponent(
          encounter.id,
        )}/`,
        {
          encounter_type:
            form.encounterType.trim(),
          chief_complaint:
            form.chiefComplaint.trim(),
          history_of_present_illness:
            form.historyOfPresentIllness.trim(),
          clinical_notes:
            form.clinicalNotes.trim(),
          treatment_plan:
            form.treatmentPlan.trim(),
          follow_up_plan:
            form.followUpPlan.trim(),
          notes: form.notes.trim(),
        },
      );

      setEditOpen(false);
      toast.success(t.saved);
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!targetStatus) {
      return;
    }

    setSaving(true);

    try {
      await mutate(
        `/api/company/medical/encounters/${encodeURIComponent(
          encounter.id,
        )}/status/`,
        { status: targetStatus },
        "POST",
      );

      setStatusOpen(false);
      setTargetStatus("");
      toast.success(t.statusSaved);
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={registerOutlineButtonClass}
        disabled={terminal || saving}
        title={terminal ? t.terminalLocked : undefined}
        onClick={() => setEditOpen(true)}
      >
        <Edit3 className="h-4 w-4" />
        {t.editEncounter}
      </Button>

      {transitions.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={saving}
            >
              <MoreVertical className="h-4 w-4" />
              {t.changeStatus}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {transitions.map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => {
                  setTargetStatus(status);
                  setStatusOpen(true);
                }}
              >
                {statusLabel(status, locale)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.encounterEditTitle}
            </DialogTitle>
            <DialogDescription>
              {t.encounterEditDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="encounter-type">
                {t.encounterType}
              </Label>
              <Input
                id="encounter-type"
                dir="ltr"
                value={form.encounterType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    encounterType:
                      event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chief-complaint">
                {t.chiefComplaint}
              </Label>
              <Textarea
                id="chief-complaint"
                value={form.chiefComplaint}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chiefComplaint:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="history">
                {t.history}
              </Label>
              <Textarea
                id="history"
                value={form.historyOfPresentIllness}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    historyOfPresentIllness:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinical-notes">
                {t.clinicalNotes}
              </Label>
              <Textarea
                id="clinical-notes"
                value={form.clinicalNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    clinicalNotes:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-plan">
                {t.treatmentPlan}
              </Label>
              <Textarea
                id="treatment-plan"
                value={form.treatmentPlan}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    treatmentPlan:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow-up-plan">
                {t.followUpPlan}
              </Label>
              <Textarea
                id="follow-up-plan"
                value={form.followUpPlan}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    followUpPlan:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="encounter-notes">
                {t.notes}
              </Label>
              <Textarea
                id="encounter-notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setEditOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              disabled={saving}
              onClick={() => void saveEncounter()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t.statusConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {t.statusConfirmDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {t.statusTarget}: {" "}
            </span>
            <span className="font-semibold">
              {statusLabel(targetStatus, locale)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setStatusOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              disabled={saving || !targetStatus}
              onClick={() => void saveStatus()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClinicalEncounterRegisterAction({
  locale,
  encounterId,
  encounterStatus,
  kind,
  onChanged,
}: {
  locale: Locale;
  encounterId: string;
  encounterStatus: string;
  kind: RecordKind;
  onChanged: ChangeHandler;
}) {
  const t = copy[locale];
  const terminal = [
    "COMPLETED",
    "CANCELLED",
    "CANCELED",
  ].includes(encounterStatus);

  const [open, setOpen] =
    React.useState(false);
  const [saving, setSaving] =
    React.useState(false);
  const [code, setCode] =
    React.useState("");
  const [name, setName] =
    React.useState("");
  const [notes, setNotes] =
    React.useState("");
  const [diagnosedAt, setDiagnosedAt] =
    React.useState(localDateTimeValue());
  const [isPrimary, setIsPrimary] =
    React.useState(false);
  const [quantity, setQuantity] =
    React.useState("1");
  const [unitPrice, setUnitPrice] =
    React.useState("");

  const reset = React.useCallback(() => {
    setCode("");
    setName("");
    setNotes("");
    setDiagnosedAt(localDateTimeValue());
    setIsPrimary(false);
    setQuantity("1");
    setUnitPrice("");
  }, []);

  const save = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error(
        kind === "diagnosis"
          ? t.requiredDiagnosis
          : t.requiredProcedure,
      );
      return;
    }

    if (
      kind === "procedure" &&
      (!Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0)
    ) {
      toast.error(t.invalidQuantity);
      return;
    }

    setSaving(true);

    try {
      const encodedId =
        encodeURIComponent(encounterId);

      if (kind === "diagnosis") {
        await mutate(
          `/api/company/medical/encounters/${encodedId}/diagnoses/`,
          {
            diagnosis_code: code.trim(),
            diagnosis_name: name.trim(),
            diagnosed_at:
              diagnosedAt || null,
            is_primary: isPrimary,
            notes: notes.trim(),
          },
          "POST",
        );
      } else {
        await mutate(
          `/api/company/medical/encounters/${encodedId}/procedures/`,
          {
            procedure_code_snapshot:
              code.trim(),
            procedure_name_snapshot:
              name.trim(),
            quantity: quantity.trim(),
            unit_price_snapshot:
              unitPrice.trim() || null,
            notes: notes.trim(),
          },
          "POST",
        );
      }

      toast.success(
        kind === "diagnosis"
          ? t.diagnosisSaved
          : t.procedureSaved,
      );
      setOpen(false);
      reset();
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="brand"
        className={registerBrandButtonClass}
        disabled={terminal || saving}
        title={terminal ? t.terminalLocked : undefined}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {kind === "diagnosis"
          ? t.addDiagnosis
          : t.addProcedure}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen && !saving) {
            reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {kind === "diagnosis"
                ? t.diagnosisTitle
                : t.procedureTitle}
            </DialogTitle>
            <DialogDescription>
              {kind === "diagnosis"
                ? t.diagnosisDescription
                : t.procedureDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${kind}-code`}>
                {t.code}
              </Label>
              <Input
                id={`${kind}-code`}
                dir="ltr"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${kind}-name`}>
                {t.name}
              </Label>
              <Input
                id={`${kind}-name`}
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            {kind === "diagnosis" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="diagnosed-at">
                    {t.diagnosedAt}
                  </Label>
                  <Input
                    id="diagnosed-at"
                    type="datetime-local"
                    dir="ltr"
                    value={diagnosedAt}
                    onChange={(event) =>
                      setDiagnosedAt(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <Checkbox
                    checked={isPrimary}
                    onCheckedChange={(value) =>
                      setIsPrimary(value === true)
                    }
                  />
                  <span className="text-sm font-medium">
                    {t.primary}
                  </span>
                </label>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="procedure-quantity">
                    {t.quantity}
                  </Label>
                  <Input
                    id="procedure-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    dir="ltr"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procedure-price">
                    {t.unitPrice}
                  </Label>
                  <Input
                    id="procedure-price"
                    type="number"
                    min="0"
                    step="0.01"
                    dir="ltr"
                    value={unitPrice}
                    onChange={(event) =>
                      setUnitPrice(event.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`${kind}-notes`}>
                {t.notes}
              </Label>
              <Textarea
                id={`${kind}-notes`}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : kind === "diagnosis" ? (
                <Stethoscope className="h-4 w-4" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClinicalRecordActions({
  locale,
  encounterId,
  encounterStatus,
  record,
  onChanged,
}: {
  locale: Locale;
  encounterId: string;
  encounterStatus: string;
  record: RecordSnapshot;
  onChanged: ChangeHandler;
}) {
  const t = copy[locale];
  const encounterTerminal = [
    "COMPLETED",
    "CANCELLED",
    "CANCELED",
  ].includes(encounterStatus);

  const recordTerminal =
    record.kind === "procedure" &&
    ["COMPLETED", "CANCELLED", "CANCELED"].includes(
      record.status,
    );

  const disabled =
    encounterTerminal || recordTerminal;

  const [editOpen, setEditOpen] =
    React.useState(false);
  const [statusOpen, setStatusOpen] =
    React.useState(false);
  const [targetStatus, setTargetStatus] =
    React.useState("");
  const [reason, setReason] =
    React.useState("");
  const [saving, setSaving] =
    React.useState(false);
  const [code, setCode] =
    React.useState(record.code);
  const [name, setName] =
    React.useState(record.name);
  const [notes, setNotes] =
    React.useState(record.notes);
  const [diagnosedAt, setDiagnosedAt] =
    React.useState(
      record.kind === "diagnosis"
        ? localDateTimeValue(record.diagnosedAt)
        : "",
    );
  const [quantity, setQuantity] =
    React.useState(
      record.kind === "procedure"
        ? String(record.quantity)
        : "1",
    );
  const [unitPrice, setUnitPrice] =
    React.useState(
      record.kind === "procedure" &&
      record.unitPrice !== null
        ? String(record.unitPrice)
        : "",
    );

  React.useEffect(() => {
    if (!editOpen) {
      setCode(record.code);
      setName(record.name);
      setNotes(record.notes);
      setDiagnosedAt(
        record.kind === "diagnosis"
          ? localDateTimeValue(record.diagnosedAt)
          : "",
      );
      setQuantity(
        record.kind === "procedure"
          ? String(record.quantity)
          : "1",
      );
      setUnitPrice(
        record.kind === "procedure" &&
        record.unitPrice !== null
          ? String(record.unitPrice)
          : "",
      );
    }
  }, [editOpen, record]);

  const basePath =
    record.kind === "diagnosis"
      ? `/api/company/medical/encounters/${encodeURIComponent(
          encounterId,
        )}/diagnoses/${encodeURIComponent(record.id)}/`
      : `/api/company/medical/encounters/${encodeURIComponent(
          encounterId,
        )}/procedures/${encodeURIComponent(record.id)}/`;

  const saveEdit = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error(
        record.kind === "diagnosis"
          ? t.requiredDiagnosis
          : t.requiredProcedure,
      );
      return;
    }

    if (
      record.kind === "procedure" &&
      (!Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0)
    ) {
      toast.error(t.invalidQuantity);
      return;
    }

    setSaving(true);

    try {
      await mutate(
        basePath,
        record.kind === "diagnosis"
          ? {
              diagnosis_code: code.trim(),
              diagnosis_name: name.trim(),
              diagnosed_at:
                diagnosedAt || null,
              notes: notes.trim(),
            }
          : {
              procedure_code_snapshot:
                code.trim(),
              procedure_name_snapshot:
                name.trim(),
              quantity: quantity.trim(),
              unit_price_snapshot:
                unitPrice.trim() || null,
              notes: notes.trim(),
            },
      );

      setEditOpen(false);
      toast.success(t.recordSaved);
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  const setPrimary = async () => {
    if (record.kind !== "diagnosis") {
      return;
    }

    setSaving(true);

    try {
      await mutate(
        `${basePath}primary/`,
        {},
        "POST",
      );
      toast.success(t.primarySaved);
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProcedureStatus = async () => {
    if (
      record.kind !== "procedure" ||
      !targetStatus
    ) {
      return;
    }

    if (
      targetStatus === "CANCELLED" &&
      !reason.trim()
    ) {
      toast.error(t.cancellationRequired);
      return;
    }

    setSaving(true);

    try {
      await mutate(
        `${basePath}status/`,
        {
          status: targetStatus,
          ...(targetStatus === "CANCELLED"
            ? {
                cancellation_reason:
                  reason.trim(),
              }
            : {}),
        },
        "POST",
      );

      setStatusOpen(false);
      setTargetStatus("");
      setReason("");
      toast.success(t.procedureStatusSaved);
      await onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.failed,
      );
    } finally {
      setSaving(false);
    }
  };

  const transitions =
    record.kind === "procedure"
      ? PROCEDURE_TRANSITIONS[record.status] || []
      : [];

  return (
    <>
      {record.kind === "diagnosis" &&
      !record.isPrimary ? (
        <Button
          type="button"
          variant="outline"
          className={registerOutlineButtonClass}
          disabled={disabled || saving}
          title={disabled ? t.terminalLocked : undefined}
          onClick={() => void setPrimary()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {t.makePrimary}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className={registerOutlineButtonClass}
        disabled={disabled || saving}
        title={disabled ? t.terminalLocked : undefined}
        onClick={() => setEditOpen(true)}
      >
        <Edit3 className="h-4 w-4" />
        {t.editRecord}
      </Button>

      {record.kind === "procedure" &&
      transitions.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={registerOutlineButtonClass}
              disabled={saving}
            >
              <MoreVertical className="h-4 w-4" />
              {t.changeStatus}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {transitions.map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => {
                  setTargetStatus(status);
                  setReason("");
                  setStatusOpen(true);
                }}
              >
                {statusLabel(status, locale)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {record.kind === "diagnosis"
                ? t.diagnosisTitle
                : t.procedureTitle}
            </DialogTitle>
            <DialogDescription>
              {record.kind === "diagnosis"
                ? t.diagnosisDescription
                : t.procedureDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="record-code">
                {t.code}
              </Label>
              <Input
                id="record-code"
                dir="ltr"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="record-name">
                {t.name}
              </Label>
              <Input
                id="record-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            {record.kind === "diagnosis" ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="record-diagnosed-at">
                  {t.diagnosedAt}
                </Label>
                <Input
                  id="record-diagnosed-at"
                  type="datetime-local"
                  dir="ltr"
                  value={diagnosedAt}
                  onChange={(event) =>
                    setDiagnosedAt(
                      event.target.value,
                    )
                  }
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="record-quantity">
                    {t.quantity}
                  </Label>
                  <Input
                    id="record-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    dir="ltr"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="record-unit-price">
                    {t.unitPrice}
                  </Label>
                  <Input
                    id="record-unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    dir="ltr"
                    value={unitPrice}
                    onChange={(event) =>
                      setUnitPrice(event.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="record-notes">
                {t.notes}
              </Label>
              <Textarea
                id="record-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setEditOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              disabled={saving}
              onClick={() => void saveEdit()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t.statusConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {t.statusConfirmDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {t.statusTarget}: {" "}
            </span>
            <span className="font-semibold">
              {statusLabel(targetStatus, locale)}
            </span>
          </div>

          {targetStatus === "CANCELLED" ? (
            <div className="space-y-2">
              <Label htmlFor="procedure-cancel-reason">
                {t.cancellationReason}
              </Label>
              <Textarea
                id="procedure-cancel-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setStatusOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="brand"
              className={registerBrandButtonClass}
              disabled={saving || !targetStatus}
              onClick={() =>
                void saveProcedureStatus()
              }
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : targetStatus === "CANCELLED" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
