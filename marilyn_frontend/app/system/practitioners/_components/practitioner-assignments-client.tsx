"use client";

// practitioner_assignments_hr_spirit=true
import * as React from "react";
import Link from "next/link";
import {
  Activity,
  BadgeCheck, BriefcaseMedical, Building2, CheckCircle2, CircleSlash2, FileSpreadsheet, Loader2, MoreVertical, Pencil, Plus, Printer, RefreshCw, RotateCcw, ShieldCheck, Stethoscope, TriangleAlert, UsersRound, type LucideIcon, } from "lucide-react";
import { toast } from "sonner";
import { openPrintReport } from "@/lib/print-report";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DataRegisterEmptyState,
    DataRegisterSearch,
    DataRegisterToolbar,
    registerBrandButtonClass,
    registerOutlineButtonClass,
} from "@/components/ui/data-register";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemKpiCard } from "@/components/ui/system-kpi-card";
import { PractitionerManagementTabs } from "@/components/system/practitioner-management-tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
type Locale = "ar" | "en";
type Mode = "specialties" | "assignments";
type Rec = Record<string, unknown>;
type Practitioner = {
    id: string;
    number: string;
    ar: string;
    en: string;
    title: string;
    specialties: number;
    assignments: number;
};
type Option = {
    id: string;
    name: string;
    code: string;
    branchId: string;
    departmentId: string;
};
type Specialty = {
    id: string;
    optionId: string;
    name: string;
    code: string;
    years: number;
    from: string;
    to: string;
    primary: boolean;
    active: boolean;
    notes: string;
};
type Assignment = {
    id: string;
    branchId: string;
    branch: string;
    departmentId: string;
    department: string;
    clinicId: string;
    clinic: string;
    from: string;
    to: string;
    primary: boolean;
    active: boolean;
    notes: string;
};
type Form = {
    id: string;
    optionId: string;
    branchId: string;
    departmentId: string;
    clinicId: string;
    years: string;
    from: string;
    to: string;
    primary: boolean;
    active: boolean;
    notes: string;
};
type Pending = {
    mode: Mode;
    id: string;
    name: string;
    next: boolean;
} | null;
const API = {
    practitioners: "/api/company/medical/practitioners/",
    branches: "/api/company/branches/",
    departments: "/api/company/medical/departments/",
    clinics: "/api/company/medical/clinics/",
    specialties: "/api/company/medical/specialties/",
} as const;
const EMPTY: Form = { id: "", optionId: "", branchId: "", departmentId: "", clinicId: "", years: "0", from: "", to: "", primary: false, active: true, notes: "" };
function rec(value: unknown): Rec { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Rec : {}; }
function txt(value: unknown, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    const result = String(value).trim();
    return result || fallback;
}
function num(value: unknown): number { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function bool(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value !== 0;
    const valueText = txt(value).toLowerCase();
    if (["true", "1", "active", "yes"].includes(valueText))
        return true;
    if (["false", "0", "inactive", "no"].includes(valueText))
        return false;
    return fallback;
}
function id(value: unknown): string {
    if (typeof value === "string" || typeof value === "number")
        return txt(value);
    const item = rec(value);
    return txt(item.id ?? item.pk);
}
function name(value: unknown): string {
    if (typeof value === "string")
        return txt(value);
    const item = rec(value);
    return txt(item.name_ar ?? item.name_en ?? item.name ?? item.full_name_ar ?? item.full_name_en ?? item.title ?? item.code);
}
function list(payload: unknown): unknown[] {
    if (Array.isArray(payload))
        return payload;
    const item = rec(payload);
    const data = rec(item.data);
    return [item.items, item.results, item.practitioners, item.specialties, item.assignments, item.branches, item.departments, item.clinics, data.items, data.results].find(Array.isArray) as unknown[] | undefined || [];
}
function localeStart(): Locale { return typeof window !== "undefined" && window.localStorage.getItem("primey-locale") === "en" ? "en" : "ar"; }
function apiBase(): string { const value = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, ""); return value.endsWith("/api") ? value.slice(0, -4) : value; }
function csrf(): string {
    if (typeof document === "undefined")
        return "";
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}
function escapeHtml(value: unknown): string { return txt(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function range(from: string, to: string, open: string): string { return from || to ? `${from || "—"} — ${to || "—"}` : open; }
async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const method = (init.method || "GET").toUpperCase();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");
    if (init.body)
        headers.set("Content-Type", "application/json");
    const token = csrf();
    if (token && !["GET", "HEAD", "OPTIONS"].includes(method))
        headers.set("X-CSRFToken", token);
    const response = await fetch(`${apiBase()}${path}`, { ...init, method, headers, credentials: "include", cache: "no-store", redirect: "follow" });
    const raw = await response.text();
    let payload: unknown = {};
    try {
        payload = raw ? JSON.parse(raw) as unknown : {};
    }
    catch {
        payload = {};
    }
    if (!response.ok) {
        const item = rec(payload);
        const errors = rec(item.errors);
        const first = Object.values(errors).flatMap((value) => Array.isArray(value) ? value : [value]).map((value) => txt(value)).find(Boolean);
        throw new Error(txt(item.message) || txt(item.detail) || txt(item.error) || first || `HTTP ${response.status}`);
    }
    return payload;
}
function practitioner(value: unknown): Practitioner { const item = rec(value); return { id: txt(item.id ?? item.pk), number: txt(item.practitioner_number ?? item.code), ar: txt(item.full_name_ar), en: txt(item.full_name_en), title: txt(item.professional_title), specialties: num(item.specialties_count), assignments: num(item.assignments_count) }; }
function option(value: unknown): Option { const item = rec(value); return { id: txt(item.id ?? item.pk), name: name(item), code: txt(item.code), branchId: id(item.branch ?? item.branch_id), departmentId: id(item.department ?? item.department_id) }; }
function specialty(value: unknown): Specialty { const item = rec(value); const linked = rec(item.specialty); return { id: txt(item.id ?? item.pk), optionId: id(item.specialty ?? item.specialty_id), name: name(linked), code: txt(linked.code), years: num(item.years_experience), from: txt(item.valid_from), to: txt(item.valid_until), primary: bool(item.is_primary), active: bool(item.is_active, true), notes: txt(item.notes) }; }
function assignment(value: unknown): Assignment { const item = rec(value); return { id: txt(item.id ?? item.pk), branchId: id(item.branch ?? item.branch_id), branch: name(item.branch), departmentId: id(item.department ?? item.department_id), department: name(item.department), clinicId: id(item.clinic ?? item.clinic_id), clinic: name(item.clinic), from: txt(item.start_date), to: txt(item.end_date), primary: bool(item.is_primary), active: bool(item.is_active, true), notes: txt(item.notes) }; }
type MedicalKpiItem = {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
};
export default function PractitionerAssignmentsClient() {
    const [locale, setLocale] = React.useState<Locale>("ar");
    const [mode, setMode] = React.useState<Mode>("specialties");
    const [practitioners, setPractitioners] = React.useState<Practitioner[]>([]);
    const [branches, setBranches] = React.useState<Option[]>([]);
    const [departments, setDepartments] = React.useState<Option[]>([]);
    const [clinics, setClinics] = React.useState<Option[]>([]);
    const [specialtyOptions, setSpecialtyOptions] = React.useState<Option[]>([]);
    const [selectedId, setSelectedId] = React.useState("");
    const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
    const [assignments, setAssignments] = React.useState<Assignment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [relationLoading, setRelationLoading] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [partial, setPartial] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [status, setStatus] = React.useState("all");
    const [primary, setPrimary] = React.useState("all");
    const [branch, setBranch] = React.useState("all");
    const [dialog, setDialog] = React.useState(false);
    const [form, setForm] = React.useState<Form>(EMPTY);
    const [pending, setPending] = React.useState<Pending>(null);
    const ar = locale === "ar";
    const dir = ar ? "rtl" : "ltr";
    const l = React.useCallback((arabic: string, english: string) => ar ? arabic : english, [ar]);
    React.useEffect(() => { const sync = () => setLocale(localeStart()); sync(); window.addEventListener("storage", sync); window.addEventListener("primey-locale-changed", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("primey-locale-changed", sync); }; }, []);
    const loadRelations = React.useCallback(async (practitionerId: string, silent = false) => {
        if (!practitionerId) {
            setSpecialties([]);
            setAssignments([]);
            return;
        }
        if (!silent)
            setRelationLoading(true);
        setError("");
        const results = await Promise.allSettled([
            request(`${API.practitioners}${practitionerId}/specialties/`),
            request(`${API.practitioners}${practitionerId}/assignments/`),
        ]);
        if (results.every((item) => item.status === "rejected")) {
            const reason = results[0].status === "rejected" && results[0].reason instanceof Error ? results[0].reason.message : l("تعذر تحميل الارتباطات.", "Could not load relations.");
            setError(reason);
            setRelationLoading(false);
            return;
        }
        setPartial(results.some((item) => item.status === "rejected"));
        setSpecialties(results[0].status === "fulfilled" ? list(results[0].value).map(specialty) : []);
        setAssignments(results[1].status === "fulfilled" ? list(results[1].value).map(assignment) : []);
        setRelationLoading(false);
        if (silent)
            toast.success(l("تم تحديث الارتباطات.", "Relations refreshed."));
    }, [l]);
    const loadBase = React.useCallback(async () => {
        setLoading(true);
        setRefreshing(true);
        setError("");
        const results = await Promise.allSettled([
            request(`${API.practitioners}?page_size=500`), request(`${API.branches}?page_size=500`),
            request(`${API.departments}?page_size=500`), request(`${API.clinics}?page_size=500`),
            request(`${API.specialties}?page_size=500`),
        ]);
        if (results[0].status === "rejected") {
            setError(results[0].reason instanceof Error ? results[0].reason.message : l("تعذر تحميل الممارسين.", "Could not load practitioners."));
            setLoading(false);
            setRefreshing(false);
            return;
        }
        const people = list(results[0].value).map(practitioner).filter((item) => item.id);
        setPractitioners(people);
        if (results[1].status === "fulfilled")
            setBranches(list(results[1].value).map(option));
        if (results[2].status === "fulfilled")
            setDepartments(list(results[2].value).map(option));
        if (results[3].status === "fulfilled")
            setClinics(list(results[3].value).map(option));
        if (results[4].status === "fulfilled")
            setSpecialtyOptions(list(results[4].value).map(option));
        setPartial(results.slice(1).some((item) => item.status === "rejected"));
        const queryId = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("practitioner") || "";
        setSelectedId((current) => people.some((item) => item.id === queryId) ? queryId : people.some((item) => item.id === current) ? current : people[0]?.id || "");
        setLoading(false);
        setRefreshing(false);
    }, [l]);
    React.useEffect(() => { void loadBase(); }, [loadBase]);
    React.useEffect(() => {
        if (!loading)
            void loadRelations(selectedId);
    }, [loadRelations, loading, selectedId]);
    const selected = practitioners.find((item) => item.id === selectedId) || null;
    const personName = (item: Practitioner) => ar ? item.ar || item.en || item.number : item.en || item.ar || item.number;
    const clinicOptions = clinics.filter((item) => (!form.branchId || !item.branchId || item.branchId === form.branchId) && (!form.departmentId || !item.departmentId || item.departmentId === form.departmentId));
    const needle = search.trim().toLowerCase();
    const specialtyRows = specialties.filter((item) => (!needle || [item.name, item.code, item.notes].join(" ").toLowerCase().includes(needle)) && (status === "all" || item.active === (status === "active")) && (primary === "all" || item.primary === (primary === "primary")));
    const assignmentRows = assignments.filter((item) => (!needle || [item.branch, item.department, item.clinic, item.notes].join(" ").toLowerCase().includes(needle)) && (status === "all" || item.active === (status === "active")) && (primary === "all" || item.primary === (primary === "primary")) && (branch === "all" || item.branchId === branch));
    const rows = mode === "specialties" ? specialtyRows : assignmentRows;
    const reset = () => { setSearch(""); setStatus("all"); setPrimary("all"); setBranch("all"); };
    const metrics = { total: practitioners.length, specialties: practitioners.filter((item) => item.specialties > 0).length, assignments: practitioners.filter((item) => item.assignments > 0).length, selected: specialties.length + assignments.length };
    const openCreate = () => {
        if (!selectedId)
            return toast.error(l("اختر الممارس أولًا.", "Choose a practitioner first."));
        setForm(EMPTY);
        setDialog(true);
    };
    const editSpecialty = (item: Specialty) => { setForm({ ...EMPTY, id: item.id, optionId: item.optionId, years: String(item.years), from: item.from, to: item.to, primary: item.primary, active: item.active, notes: item.notes }); setDialog(true); };
    const editAssignment = (item: Assignment) => { setForm({ ...EMPTY, id: item.id, branchId: item.branchId, departmentId: item.departmentId, clinicId: item.clinicId, from: item.from, to: item.to, primary: item.primary, active: item.active, notes: item.notes }); setDialog(true); };
    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedId)
            return toast.error(l("اختر الممارس أولًا.", "Choose a practitioner first."));
        if (mode === "specialties" && !form.optionId)
            return toast.error(l("اختر التخصص.", "Choose a specialty."));
        if (mode === "assignments" && !form.branchId)
            return toast.error(l("اختر الفرع.", "Choose a branch."));
        if (form.from && form.to && form.to < form.from)
            return toast.error(l("تاريخ النهاية يسبق البداية.", "End date is earlier than start date."));
        setSaving(true);
        try {
            const collection = mode === "specialties" ? "specialties" : "assignments";
            const payload: Rec = mode === "specialties" ? {
                specialty_id: Number(form.optionId), years_experience: Math.max(0, Number(form.years) || 0),
                valid_from: form.from || null, valid_until: form.to || null,
                is_primary: form.primary, is_active: form.active, notes: form.notes.trim(),
            } : {
                branch_id: Number(form.branchId), department_id: form.departmentId ? Number(form.departmentId) : null,
                clinic_id: form.clinicId ? Number(form.clinicId) : null, start_date: form.from || null,
                end_date: form.to || null, is_primary: form.primary, is_active: form.active, notes: form.notes.trim(),
            };
            const base = `${API.practitioners}${selectedId}/${collection}/`;
            await request(form.id ? `${base}${form.id}/` : base, { method: form.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
            toast.success(l("تم حفظ الارتباط.", "Relation saved."));
            setDialog(false);
            setForm(EMPTY);
            await loadRelations(selectedId, true);
            await loadBase();
        }
        catch (caught) {
            toast.error(caught instanceof Error ? caught.message : l("تعذر الحفظ.", "Could not save."));
        }
        finally {
            setSaving(false);
        }
    };
    const changeStatus = async () => {
        if (!pending || !selectedId)
            return;
        setSaving(true);
        try {
            await request(`${API.practitioners}${selectedId}/${pending.mode}/${pending.id}/`, { method: "POST", body: JSON.stringify({ is_active: pending.next }) });
            toast.success(l("تم تحديث الحالة.", "Status updated."));
            setPending(null);
            await loadRelations(selectedId, true);
            await loadBase();
        }
        catch (caught) {
            toast.error(caught instanceof Error ? caught.message : l("تعذر تحديث الحالة.", "Could not update status."));
        }
        finally {
            setSaving(false);
        }
    };
    const tableHtml = () => mode === "specialties"
        ? `<table><thead><tr><th>${escapeHtml(l("التخصص", "Specialty"))}</th><th>${escapeHtml(l("سنوات الخبرة", "Experience"))}</th><th>${escapeHtml(l("الصلاحية", "Validity"))}</th><th>${escapeHtml(l("النوع", "Type"))}</th><th>${escapeHtml(l("الحالة", "Status"))}</th></tr></thead><tbody>${specialtyRows.map((item) => `<tr><td>${escapeHtml(item.name || item.code || "—")}</td><td>${item.years}</td><td dir="ltr">${escapeHtml(range(item.from, item.to, l("مفتوح", "Open")))}</td><td>${escapeHtml(item.primary ? l("أساسي", "Primary") : l("إضافي", "Additional"))}</td><td>${escapeHtml(item.active ? l("نشط", "Active") : l("غير نشط", "Inactive"))}</td></tr>`).join("")}</tbody></table>`
        : `<table><thead><tr><th>${escapeHtml(l("الفرع", "Branch"))}</th><th>${escapeHtml(l("القسم", "Department"))}</th><th>${escapeHtml(l("العيادة", "Clinic"))}</th><th>${escapeHtml(l("الفترة", "Period"))}</th><th>${escapeHtml(l("النوع", "Type"))}</th><th>${escapeHtml(l("الحالة", "Status"))}</th></tr></thead><tbody>${assignmentRows.map((item) => `<tr><td>${escapeHtml(item.branch || "—")}</td><td>${escapeHtml(item.department || "—")}</td><td>${escapeHtml(item.clinic || "—")}</td><td dir="ltr">${escapeHtml(range(item.from, item.to, l("مفتوح", "Open")))}</td><td>${escapeHtml(item.primary ? l("أساسي", "Primary") : l("إضافي", "Additional"))}</td><td>${escapeHtml(item.active ? l("نشط", "Active") : l("غير نشط", "Inactive"))}</td></tr>`).join("")}</tbody></table>`;
    const exportExcel = () => {
        if (!rows.length)
            return toast.warning(l("لا توجد بيانات للتصدير.", "No data to export."));
        const html = `<!doctype html><html dir="${dir}"><head><meta charset="UTF-8"><style>body{font-family:Tahoma,Arial;padding:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:7px;text-align:${ar ? "right" : "left"};mso-number-format:"\\@"}th{background:#eee}</style></head><body><h1>${escapeHtml(l("تقرير تخصصات وتعيينات الممارسين", "Practitioner Specialties & Assignments"))}</h1><p>${escapeHtml(selected ? personName(selected) : "")}</p>${tableHtml()}</body></html>`;
        const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `marilyn-practitioner-${mode}-${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(l("تم تجهيز Excel.", "Excel prepared."));
    };
    const print = async () => {
        if (!rows.length)
            return toast.warning(l("لا توجد بيانات للطباعة.", "No data to print."));
        const opened = await openPrintReport({ locale, title: l("تقرير تخصصات وتعيينات الممارسين — Marilyn Clinics", "Marilyn Clinics Practitioner Specialties & Assignments"), subtitle: `${selected ? personName(selected) : ""} — ${mode === "specialties" ? l("التخصصات", "Specialties") : l("التعيينات", "Assignments")}`, branchName: mode === "assignments" && branch !== "all" ? branches.find((item) => item.id === branch)?.name : undefined, tableHtml: tableHtml(), recordsCount: rows.length });
        if (!opened)
            return toast.error(l("تعذر فتح نافذة الطباعة.", "Could not open print window."));
        toast.success(l("تم تجهيز الطباعة.", "Print prepared."));
    };
    const hasFilters = Boolean(search) ||
        status !== "all" ||
        primary !== "all" ||
        branch !== "all";
    const totalRows = mode === "specialties" ? specialties.length : assignments.length;
    const activeResourceCount = mode === "specialties"
        ? specialties.filter((item) => item.active).length
        : assignments.filter((item) => item.active).length;
    const summaryCards: MedicalKpiItem[] = [
        {
            title: l("إجمالي الممارسين", "Total practitioners"),
            value: metrics.total,
            description: l("ملفات الممارسين المتاحة", "Available practitioner records"),
            icon: UsersRound,
        },
        {
            title: l("مرتبطون بتخصصات", "With specialties"),
            value: metrics.specialties,
            description: l("تخصص واحد على الأقل", "At least one specialty"),
            icon: BadgeCheck,
        },
        {
            title: l("مرتبطون بتعيينات", "With assignments"),
            value: metrics.assignments,
            description: l("تعيين تشغيلي واحد على الأقل", "At least one assignment"),
            icon: Building2,
        },
        {
            title: l("ارتباطات الممارس", "Selected relations"),
            value: metrics.selected,
            description: l("الارتباطات المحملة للممارس المحدد", "Relations loaded for the selected practitioner"),
            icon: ShieldCheck,
        },
    ];
    if (loading) {
        return (<main className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
                <div className="w-full space-y-5">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40"/>
                        <Skeleton className="h-9 w-72"/>
                        <Skeleton className="h-4 w-full max-w-3xl"/>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (<Skeleton key={index} className="h-32 rounded-lg"/>))}
                    </div>
                    <Skeleton className="h-[560px] rounded-lg"/>
                </div>
            </main>);
    }
    if (error && !practitioners.length) {
        return (<main dir={dir} className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
                <Card className="mx-auto max-w-3xl rounded-lg border-rose-200 bg-card shadow-none">
                    <CardHeader className="items-center text-center">
                        <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                            <CircleSlash2 className="h-7 w-7"/>
                        </span>
                        <CardTitle>{l("تعذر تحميل التخصصات والتعيينات", "Could not load specialties and assignments")}</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button type="button" variant="brand" onClick={() => void loadBase()}>
                            <RefreshCw className="h-4 w-4"/>
                            {l("إعادة المحاولة", "Try again")}
                        </Button>
                    </CardContent>
                </Card>
            </main>);
    }
    const activeClass = "border-[#b58c4d] text-[#8f6a37]";
    const tableColumnCount = mode === "specialties" ? 6 : 7;
    const selectedBranchName = branch === "all"
        ? l("جميع الفروع", "All branches")
        : branches.find((item) => item.id === branch)?.name || l("جميع الفروع", "All branches");
    return (<main dir={dir} className="min-h-screen bg-transparent px-4 py-6 text-foreground sm:px-6 lg:px-8">
            <div className="w-full space-y-5">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9a7139]">
                          <BriefcaseMedical className="h-3.5 w-3.5 text-[#a57b3d]"/>
                                                      {l("العمليات الطبية", "Medical Operations")}
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">
                            {l("التخصصات والتعيينات", "Specialties & Assignments")}
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                            {l("إدارة تخصصات الممارسين وتعييناتهم التشغيلية وربطهم بالفروع والأقسام والعيادات الفعلية.", "Manage practitioner specialties and operational assignments across live branches, departments, and clinics.")}
                        </p>

                        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          {l(
                            "متصل بواجهات تخصصات وتعيينات الممارسين الحقيقية",
                            "Connected to live practitioner specialty and assignment APIs",
                          )}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" className={registerOutlineButtonClass} disabled={refreshing} onClick={() => {
            void loadBase();
            if (selectedId)
                void loadRelations(selectedId, true);
        }}>
                            {refreshing ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<RefreshCw className="h-4 w-4"/>)}
                            {l("تحديث", "Refresh")}
                        </Button>

                        <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={exportExcel}>
                            <FileSpreadsheet className="h-4 w-4"/>
                            Excel
                        </Button>

                        <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={() => void print()}>
                            <Printer className="h-4 w-4"/>
                            {l("طباعة", "Print")}
                        </Button>

                        {practitioners.length ? (<Button type="button" variant="brand" className={registerBrandButtonClass} onClick={openCreate} disabled={!selectedId}>
                                <Plus className="h-4 w-4"/>
                                {mode === "specialties"
                ? l("إضافة تخصص", "Add specialty")
                : l("إضافة تعيين", "Add assignment")}
                            </Button>) : (<Button asChild type="button" variant="brand" className={registerBrandButtonClass}>
                                <Link href="/system/practitioners">
                                    <Plus className="h-4 w-4"/>
                                    {l("إضافة ممارس", "Add practitioner")}
                                </Link>
                            </Button>)}
                    </div>
                </header>

                {partial ? (<Card className="rounded-lg border-amber-200 bg-amber-50 text-amber-950 shadow-none">
                        <CardContent className="flex gap-3 p-4">
                            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0"/>
                            <div>
                                <p className="text-sm font-semibold">
                                    {l("تم تحميل الصفحة جزئيًا", "Partially loaded")}
                                </p>
                                <p className="mt-1 text-sm opacity-80">
                                    {l("تعذر تحميل بعض المصادر، لذلك تظهر البيانات المتاحة فقط.", "Some sources could not be loaded, so only available data is shown.")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>) : null}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => (<SystemKpiCard key={item.title} {...item}/>))}
                </section>

                <PractitionerManagementTabs
                  active="assignments"
                  locale={locale}
                  counts={{
                    assignments:
                      metrics.selected,
                  }}
                />

                <Card className="overflow-hidden rounded-lg border bg-card shadow-none">
                    <CardHeader className="px-5 pt-5 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
                                  <BriefcaseMedical className="h-4 w-4 text-[#a57b3d]" />
                                    {l("سجل ارتباطات الممارس", "Practitioner Relations Register")} — {mode === "specialties" ? l("التخصصات", "Specialties") : l("التعيينات", "Assignments")}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {selected
            ? `${personName(selected)}${selected.number ? ` — ${selected.number}` : ""}`
            : l("اختر ممارسًا لإدارة ارتباطاته التشغيلية.", "Choose a practitioner to manage operational relations.")}
                                </CardDescription>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button type="button" variant={mode === "specialties" ? "brand" : "outline"} className={mode === "specialties" ? registerBrandButtonClass : registerOutlineButtonClass} onClick={() => {
            setMode("specialties");
            reset();
        }}>
                                    <Stethoscope className="h-4 w-4"/>
                                    {l("التخصصات", "Specialties")}
                                </Button>
                                <Button type="button" variant={mode === "assignments" ? "brand" : "outline"} className={mode === "assignments" ? registerBrandButtonClass : registerOutlineButtonClass} onClick={() => {
            setMode("assignments");
            reset();
        }}>
                                    <Building2 className="h-4 w-4"/>
                                    {l("التعيينات", "Assignments")}
                                </Button>
                                <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={exportExcel}>
                                    <FileSpreadsheet className="h-4 w-4"/>
                                    Excel
                                </Button>
                                <Button type="button" variant="brand" className={registerBrandButtonClass} onClick={() => void print()}>
                                    <Printer className="h-4 w-4"/>
                                    {l("طباعة", "Print")}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
                        <DataRegisterToolbar className={`grid gap-3 ${mode === "assignments"
            ? "xl:grid-cols-[minmax(260px,1.2fr)_minmax(260px,1.4fr)_150px_150px_180px_auto]"
            : "xl:grid-cols-[minmax(260px,1.2fr)_minmax(280px,1.5fr)_150px_150px_auto]"}`}>
                            <Select value={selectedId || undefined} onValueChange={(value) => {
            setSelectedId(value);
            reset();
        }}>
                                <SelectTrigger className="h-9 bg-background shadow-none">
                                    <SelectValue placeholder={l("اختر الممارس", "Choose practitioner")}/>
                                </SelectTrigger>
                                <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                                    {practitioners.map((item) => (<SelectItem key={item.id} value={item.id}>
                                            {personName(item)}
                                            {item.number ? ` — ${item.number}` : ""}
                                        </SelectItem>))}
                                </SelectContent>
                            </Select>

                            <DataRegisterSearch
                                value={search}
                                onChange={setSearch}
                                placeholder={l("ابحث في الارتباطات...", "Search relations...")}
                            />

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9 bg-background shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{l("كل الحالات", "All statuses")}</SelectItem>
                                    <SelectItem value="active">{l("نشط", "Active")}</SelectItem>
                                    <SelectItem value="inactive">{l("غير نشط", "Inactive")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={primary} onValueChange={setPrimary}>
                                <SelectTrigger className="h-9 bg-background shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{l("كل الارتباطات", "All relations")}</SelectItem>
                                    <SelectItem value="primary">{l("أساسي", "Primary")}</SelectItem>
                                    <SelectItem value="additional">{l("إضافي", "Additional")}</SelectItem>
                                </SelectContent>
                            </Select>

                            {mode === "assignments" ? (<Select value={branch} onValueChange={setBranch}>
                                    <SelectTrigger className="h-9 bg-background shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
                                        <SelectItem value="all">{l("كل الفروع", "All branches")}</SelectItem>
                                        {branches.map((item) => (<SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>))}
                                    </SelectContent>
                                </Select>) : null}

                            <Button type="button" variant="outline" className={registerOutlineButtonClass} onClick={reset} disabled={!hasFilters}>
                                <RotateCcw className="h-4 w-4"/>
                                {l("إعادة ضبط", "Reset")}
                            </Button>
                        </DataRegisterToolbar>

                        <div className="space-y-3">
                            <div className="overflow-hidden rounded-lg border bg-background">
                                <div className="overflow-x-auto">
                                    {relationLoading ? (<div className="space-y-3 p-4">
                                            {Array.from({ length: 5 }).map((_, index) => (<Skeleton key={index} className="h-[62px] rounded-lg"/>))}
                                        </div>) : mode === "specialties" ? (<Table variant="register" layout="fixed" minWidth="1120px">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className={`sticky z-20 h-11 w-[280px] bg-muted/40 px-4 text-start text-xs font-semibold text-muted-foreground ${ar ? "right-0" : "left-0"}`}>
                                                        {l("التخصص", "Specialty")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[130px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("الخبرة", "Experience")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[250px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("الصلاحية", "Validity")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[140px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("النوع", "Type")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[140px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("الحالة", "Status")}
                                                    </TableHead>
                                                    <TableHead className={`sticky z-20 h-11 w-[84px] bg-muted/40 px-4 text-center text-xs font-semibold text-muted-foreground ${ar ? "left-0" : "right-0"}`}>
                                                        {l("الإجراءات", "Actions")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {specialtyRows.length ? (specialtyRows.map((item) => (<TableRow key={item.id} className="group h-[62px] hover:bg-muted/35">
                                                            <TableCell className={`sticky z-10 h-[62px] overflow-hidden bg-background px-4 text-start align-middle group-hover:bg-muted/35 ${ar ? "right-0" : "left-0"}`}>
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-medium">{item.name || item.code || "—"}</p>
                                                                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{item.code || "—"}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle tabular-nums">
                                                                {item.years.toLocaleString("en-US")}
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle" dir="ltr">
                                                                {range(item.from, item.to, l("مفتوح", "Open"))}
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle">
                                                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
                                                                    {item.primary ? l("أساسي", "Primary") : l("إضافي", "Additional")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle">
                                                                <Badge variant="outline" className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${item.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                                    {item.active ? l("نشط", "Active") : l("غير نشط", "Inactive")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className={`sticky z-10 h-[62px] bg-background px-4 text-center align-middle group-hover:bg-muted/35 ${ar ? "left-0" : "right-0"}`}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button type="button" variant="ghost" size="icon">
                                                                            <MoreVertical className="h-4 w-4"/>
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={ar ? "start" : "end"}>
                                                                        <DropdownMenuItem onSelect={() => editSpecialty(item)}>
                                                                            <Pencil className="h-4 w-4 text-[#b58c4d]"/>
                                                                            {l("تعديل", "Edit")}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className={item.active ? "text-rose-600" : "text-emerald-700"} onSelect={() => setPending({
                    mode,
                    id: item.id,
                    name: item.name,
                    next: !item.active,
                })}>
                                                                            {item.active ? <CircleSlash2 className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                                                                            {item.active ? l("تعطيل", "Deactivate") : l("تفعيل", "Activate")}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>))) : (<TableRow>
                                                        <TableCell colSpan={tableColumnCount} className="h-72">
                                                            <DataRegisterEmptyState title={specialties.length ? l("لا توجد نتائج مطابقة.", "No matching results.") : l("لا توجد تخصصات مسجلة.", "No specialties registered.")} description={selected ? l("أضف تخصصات الممارس أو غيّر الفلاتر الحالية.", "Add practitioner specialties or adjust the current filters.") : l("اختر ممارسًا لعرض تخصصاته.", "Choose a practitioner to view specialties.")} showReset={hasFilters} onReset={reset} resetLabel={l("إعادة ضبط", "Reset")} action={!practitioners.length ? (<Button asChild type="button" variant="brand" size="sm">
                                                                        <Link href="/system/practitioners">
                                                                            <Plus className="h-4 w-4"/>
                                                                            {l("إضافة ممارس", "Add practitioner")}
                                                                        </Link>
                                                                    </Button>) : undefined}/>
                                                        </TableCell>
                                                    </TableRow>)}
                                            </TableBody>
                                        </Table>) : (<Table variant="register" layout="fixed" minWidth="1260px">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className={`sticky z-20 h-11 w-[240px] bg-muted/40 px-4 text-start text-xs font-semibold text-muted-foreground ${ar ? "right-0" : "left-0"}`}>
                                                        {l("الفرع", "Branch")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[220px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("القسم", "Department")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[220px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("العيادة", "Clinic")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[250px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("الفترة", "Period")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[140px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("النوع", "Type")}
                                                    </TableHead>
                                                    <TableHead className="h-11 w-[140px] px-4 text-start text-xs font-semibold text-muted-foreground">
                                                        {l("الحالة", "Status")}
                                                    </TableHead>
                                                    <TableHead className={`sticky z-20 h-11 w-[84px] bg-muted/40 px-4 text-center text-xs font-semibold text-muted-foreground ${ar ? "left-0" : "right-0"}`}>
                                                        {l("الإجراءات", "Actions")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assignmentRows.length ? (assignmentRows.map((item) => (<TableRow key={item.id} className="group h-[62px] hover:bg-muted/35">
                                                            <TableCell className={`sticky z-10 h-[62px] overflow-hidden bg-background px-4 text-start align-middle font-medium group-hover:bg-muted/35 ${ar ? "right-0" : "left-0"}`}>
                                                                <span className="block truncate">{item.branch || "—"}</span>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                                                                <span className="block truncate">{item.department || "—"}</span>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] overflow-hidden px-4 text-start align-middle">
                                                                <span className="block truncate">{item.clinic || "—"}</span>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle" dir="ltr">
                                                                {range(item.from, item.to, l("مفتوح", "Open"))}
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle">
                                                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
                                                                    {item.primary ? l("أساسي", "Primary") : l("إضافي", "Additional")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="h-[62px] px-4 text-start align-middle">
                                                                <Badge variant="outline" className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${item.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                                    {item.active ? l("نشط", "Active") : l("غير نشط", "Inactive")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className={`sticky z-10 h-[62px] bg-background px-4 text-center align-middle group-hover:bg-muted/35 ${ar ? "left-0" : "right-0"}`}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button type="button" variant="ghost" size="icon">
                                                                            <MoreVertical className="h-4 w-4"/>
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={ar ? "start" : "end"}>
                                                                        <DropdownMenuItem onSelect={() => editAssignment(item)}>
                                                                            <Pencil className="h-4 w-4 text-[#b58c4d]"/>
                                                                            {l("تعديل", "Edit")}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className={item.active ? "text-rose-600" : "text-emerald-700"} onSelect={() => setPending({
                    mode,
                    id: item.id,
                    name: item.branch,
                    next: !item.active,
                })}>
                                                                            {item.active ? <CircleSlash2 className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                                                                            {item.active ? l("تعطيل", "Deactivate") : l("تفعيل", "Activate")}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>))) : (<TableRow>
                                                        <TableCell colSpan={tableColumnCount} className="h-72">
                                                            <DataRegisterEmptyState title={assignments.length ? l("لا توجد نتائج مطابقة.", "No matching results.") : l("لا توجد تعيينات مسجلة.", "No assignments registered.")} description={selected ? l("أضف تعيينات الممارس أو غيّر الفلاتر الحالية.", "Add practitioner assignments or adjust the current filters.") : l("اختر ممارسًا لعرض تعييناته.", "Choose a practitioner to view assignments.")} showReset={hasFilters} onReset={reset} resetLabel={l("إعادة ضبط", "Reset")} action={!practitioners.length ? (<Button asChild type="button" variant="brand" size="sm">
                                                                        <Link href="/system/practitioners">
                                                                            <Plus className="h-4 w-4"/>
                                                                            {l("إضافة ممارس", "Add practitioner")}
                                                                        </Link>
                                                                    </Button>) : undefined}/>
                                                        </TableCell>
                                                    </TableRow>)}
                                            </TableBody>
                                        </Table>)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                    {l("عدد النتائج", "Results")}: {" "}
                                    <span className="font-medium text-foreground tabular-nums">
                                        {rows.length.toLocaleString("en-US")}
                                    </span>{" "}
                                    / {" "}
                                    <span className="font-medium text-foreground tabular-nums">
                                        {totalRows.toLocaleString("en-US")}
                                    </span>
                                </span>
                                <span>
                                    {mode === "specialties" ? l("التخصصات", "Specialties") : l("التعيينات", "Assignments")} — {l("النشطة", "Active")}: {" "}
                                    <span className="font-medium text-foreground tabular-nums">
                                        {activeResourceCount.toLocaleString("en-US")}
                                    </span>
                                    {mode === "assignments" ? ` — ${selectedBranchName}` : ""}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

  <Dialog open={dialog} onOpenChange={(open) => {
            if (!saving)
                setDialog(open);
        }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" dir={dir}><form onSubmit={save}><DialogHeader><DialogTitle>{form.id ? l("تعديل الارتباط", "Edit relation") : mode === "specialties" ? l("إضافة تخصص", "Add specialty") : l("إضافة تعيين", "Add assignment")}</DialogTitle><DialogDescription>{l("أدخل البيانات التشغيلية ثم احفظ.", "Enter the operational data, then save.")}</DialogDescription></DialogHeader><div className="grid gap-5 py-5 md:grid-cols-2">{mode === "specialties" ? <><div className="space-y-2 md:col-span-2"><Label>{l("التخصص", "Specialty")}</Label><Select value={form.optionId} onValueChange={(value) => setForm((current) => ({ ...current, optionId: value }))}><SelectTrigger><SelectValue placeholder={l("اختر التخصص", "Choose specialty")}/></SelectTrigger><SelectContent>{specialtyOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}{item.code ? ` — ${item.code}` : ""}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{l("سنوات الخبرة", "Experience years")}</Label><Input type="number" min="0" dir="ltr" value={form.years} onChange={(event) => setForm((current) => ({ ...current, years: event.target.value }))}/></div></> : <><div className="space-y-2"><Label>{l("الفرع", "Branch")}</Label><Select value={form.branchId} onValueChange={(value) => setForm((current) => ({ ...current, branchId: value, clinicId: "" }))}><SelectTrigger><SelectValue placeholder={l("اختر الفرع", "Choose branch")}/></SelectTrigger><SelectContent>{branches.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{l("القسم", "Department")}</Label><Select value={form.departmentId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, departmentId: value === "none" ? "" : value, clinicId: "" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{l("بدون", "None")}</SelectItem>{departments.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2 md:col-span-2"><Label>{l("العيادة", "Clinic")}</Label><Select value={form.clinicId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, clinicId: value === "none" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{l("بدون", "None")}</SelectItem>{clinicOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div></>}<div className="space-y-2"><Label>{mode === "specialties" ? l("ساري من", "Valid from") : l("تاريخ البداية", "Start date")}</Label><Input type="date" dir="ltr" value={form.from} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))}/></div><div className="space-y-2"><Label>{mode === "specialties" ? l("ساري حتى", "Valid until") : l("تاريخ النهاية", "End date")}</Label><Input type="date" dir="ltr" value={form.to} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))}/></div><div className="space-y-3 rounded-lg border bg-muted/20 p-4"><label className="flex items-center gap-3"><Checkbox checked={form.primary} onCheckedChange={(value) => setForm((current) => ({ ...current, primary: value === true }))}/>{l("ارتباط أساسي", "Primary relation")}</label><label className="flex items-center gap-3"><Checkbox checked={form.active} onCheckedChange={(value) => setForm((current) => ({ ...current, active: value === true, primary: value === true ? current.primary : false }))}/>{l("نشط", "Active")}</label></div><div className="space-y-2"><Label>{l("ملاحظات", "Notes")}</Label><Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}/></div></div><DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setDialog(false)}>{l("إلغاء", "Cancel")}</Button><Button type="submit" variant="brand" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}{l("حفظ", "Save")}</Button></DialogFooter></form></DialogContent></Dialog>
  <AlertDialog open={Boolean(pending)} onOpenChange={(open) => {
            if (!open && !saving)
                setPending(null);
        }}><AlertDialogContent dir={dir}><AlertDialogHeader><AlertDialogTitle>{l("تأكيد تغيير الحالة", "Confirm status change")}</AlertDialogTitle><AlertDialogDescription>{l("سيتم تحديث حالة الارتباط عبر واجهة الممارسين الفعلية.", "The relation status will be updated through the live practitioner API.")}<span className="mt-2 block font-medium text-foreground">{pending?.name || "—"}</span></AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>{l("إلغاء", "Cancel")}</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void changeStatus(); }}>{saving ? <Loader2 className="h-4 w-4 animate-spin"/> : null}{l("تأكيد", "Confirm")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>);
}
