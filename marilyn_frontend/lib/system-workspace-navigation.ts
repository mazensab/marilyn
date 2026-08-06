import {
  Activity,
  BarChart3,
  BellRing,
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  KeyRound,
  MessageCircle,
  ReceiptText,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
export type SystemWorkspaceNavigationItem = {
  title: {
    ar: string;
    en: string;
  };
  href: string;
  aliases?: string[];
  icon?: LucideIcon;
  description?: {
    ar: string;
    en: string;
  };
  items?: SystemWorkspaceNavigationItem[];
  permission?: string | null;
  permissions?: string[] | readonly string[] | null;
  anyPermissions?: string[] | readonly string[] | null;
  allPermissions?: string[] | readonly string[] | null;
  workspaces?: string[] | readonly string[] | null;
};
export type SystemWorkspaceNavigationGroup = {
  title: {
    ar: string;
    en: string;
  };
  items: SystemWorkspaceNavigationItem[];
};
export const SYSTEM_WORKSPACE_ROUTES = {
  dashboard: "/system",
  organization: "/system/organization",
  branches: "/system/branches",
  medicalStructure: "/system/medical-structure",
  patients: "/system/patients",
  medicalRecords: "/system/patients/medical-records",
  recordAccess: "/system/patients/record-access",
  appointments: "/system/appointments",
  appointmentCalendar: "/system/appointments/calendar",
  waitingList: "/system/appointments/waiting-list",
  practitioners: "/system/practitioners",
  practitionerAssignments: "/system/practitioners/assignments",
  practitionerLicenses: "/system/practitioners/licenses",
  practitionerSchedules: "/system/practitioners/schedules",
  medicalServices: "/system/medical-services",
  clinicalOperations: "/system/clinical-operations",
  billing: "/system/billing",
  payments: "/system/payments",
  treasury: "/system/treasury",
  accounting: "/system/accounting",
  humanResources: "/system/hr",
  notifications: "/system/notifications",
  whatsapp: "/system/whatsapp",
  reports: "/system/reports",
  users: "/system/users",
  organizationUsers: "/system/users/organization",
  roles: "/system/roles",
  permissions: "/system/permissions",
  auditLog: "/system/audit-log",
  integrations: "/system/integrations",
  health: "/system/health",
  settings: "/system/settings",
} as const;
const systemScope = {
  anyPermissions: [
    PERMISSIONS.SYSTEM_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
  ],
  workspaces: ["system"],
};
export const SYSTEM_WORKSPACE_NAV_GROUPS: SystemWorkspaceNavigationGroup[] = [
  {
    title: {
      ar: "إدارة Marilyn Clinics",
      en: "Marilyn Clinics Administration",
    },
    items: [
      {
        title: {
          ar: "لوحة الإدارة المركزية",
          en: "Central Administration",
        },
        href: SYSTEM_WORKSPACE_ROUTES.dashboard,
        icon: Home,
        description: {
          ar: "المتابعة المركزية لجميع فروع وعمليات Marilyn Clinics",
          en: "Central oversight of all Marilyn Clinics branches and operations",
        },
        permission: PERMISSIONS.SYSTEM_VIEW,
        workspaces: ["system"],
      },
      {
        title: {
          ar: "المنشأة والفروع",
          en: "Organization & Branches",
        },
        href: SYSTEM_WORKSPACE_ROUTES.organization,
        aliases: [
          "/system/companies",
          "/system/activity-profiles",
        ],
        icon: Building2,
        description: {
          ar: "بيانات المنشأة والفروع والبنية الطبية",
          en: "Organization, branches, and medical structure",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "بيانات المنشأة",
              en: "Organization Profile",
            },
            href: SYSTEM_WORKSPACE_ROUTES.organization,
            icon: Building2,
            description: {
              ar: "الهوية والبيانات الأساسية لمنشأة Marilyn Clinics",
              en: "Marilyn Clinics identity and organization profile",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الفروع",
              en: "Branches",
            },
            href: SYSTEM_WORKSPACE_ROUTES.branches,
            icon: Briefcase,
            description: {
              ar: "إدارة فروع المنشأة ونطاقاتها التشغيلية",
              en: "Manage organization branches and operational scopes",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "البنية الطبية",
              en: "Medical Structure",
            },
            href: SYSTEM_WORKSPACE_ROUTES.medicalStructure,
            icon: Stethoscope,
            description: {
              ar: "الأقسام الطبية والعيادات والتخصصات",
              en: "Medical departments, clinics, and specialties",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "المرضى",
          en: "Patients",
        },
        href: SYSTEM_WORKSPACE_ROUTES.patients,
        icon: Users,
        description: {
          ar: "المرضى والملفات الطبية والوصول إلى السجلات",
          en: "Patients, medical records, and record access",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "مركز المرضى",
              en: "Patients Center",
            },
            href: SYSTEM_WORKSPACE_ROUTES.patients,
            icon: Users,
            description: {
              ar: "سجل المرضى والبحث والمتابعة",
              en: "Patient registry, search, and follow-up",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الملفات الطبية",
              en: "Medical Records",
            },
            href: SYSTEM_WORKSPACE_ROUTES.medicalRecords,
            icon: FileText,
            description: {
              ar: "اكتمال الملفات والسجلات الطبية",
              en: "Medical records and completion status",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الوصول إلى السجلات",
              en: "Record Access",
            },
            href: SYSTEM_WORKSPACE_ROUTES.recordAccess,
            icon: ShieldCheck,
            description: {
              ar: "مراجعة صلاحيات وسجل الوصول للبيانات الطبية",
              en: "Review medical-record access and permissions",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "المواعيد والحجوزات",
          en: "Appointments & Booking",
        },
        href: SYSTEM_WORKSPACE_ROUTES.appointments,
        icon: CalendarDays,
        description: {
          ar: "المواعيد والتقويم وقائمة الانتظار",
          en: "Appointments, calendar, and waiting list",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "مركز المواعيد",
              en: "Appointments Center",
            },
            href: SYSTEM_WORKSPACE_ROUTES.appointments,
            icon: CalendarDays,
            description: {
              ar: "إدارة المواعيد عبر جميع الفروع",
              en: "Manage appointments across all branches",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "تقويم المواعيد",
              en: "Appointments Calendar",
            },
            href: SYSTEM_WORKSPACE_ROUTES.appointmentCalendar,
            icon: CalendarDays,
            description: {
              ar: "العرض اليومي والأسبوعي للمواعيد",
              en: "Daily and weekly appointment calendar",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "قائمة الانتظار",
              en: "Waiting List",
            },
            href: SYSTEM_WORKSPACE_ROUTES.waitingList,
            icon: Users,
            description: {
              ar: "المرضى المنتظرون ومتابعة أوقات الانتظار",
              en: "Waiting patients and waiting-time tracking",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "الممارسون والجداول",
          en: "Practitioners & Schedules",
        },
        href: SYSTEM_WORKSPACE_ROUTES.practitioners,
        icon: Stethoscope,
        description: {
          ar: "الممارسون والتعيينات والتراخيص والجداول",
          en: "Practitioners, assignments, licenses, and schedules",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "الممارسون الطبيون",
              en: "Medical Practitioners",
            },
            href: SYSTEM_WORKSPACE_ROUTES.practitioners,
            icon: Stethoscope,
            description: {
              ar: "سجل الأطباء والممارسين الطبيين",
              en: "Doctors and medical practitioners registry",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "التعيينات",
              en: "Assignments",
            },
            href: SYSTEM_WORKSPACE_ROUTES.practitionerAssignments,
            icon: Building2,
            description: {
              ar: "ربط الممارسين بالفروع والأقسام والعيادات",
              en: "Assign practitioners to branches, departments, and clinics",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "التراخيص",
              en: "Licenses",
            },
            href: SYSTEM_WORKSPACE_ROUTES.practitionerLicenses,
            icon: ShieldCheck,
            description: {
              ar: "تراخيص الممارسين وتواريخ صلاحيتها",
              en: "Practitioner licenses and validity dates",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الجداول والتوفر",
              en: "Schedules & Availability",
            },
            href: SYSTEM_WORKSPACE_ROUTES.practitionerSchedules,
            icon: CalendarDays,
            description: {
              ar: "جداول العمل وفترات توفر الممارسين",
              en: "Practitioner schedules and availability",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "الخدمات والتشغيل الطبي",
          en: "Services & Clinical Operations",
        },
        href: SYSTEM_WORKSPACE_ROUTES.clinicalOperations,
        icon: Activity,
        description: {
          ar: "الخدمات واللقاءات والتشخيصات والإجراءات والإحالات",
          en: "Services, encounters, diagnoses, procedures, and referrals",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "الخدمات الطبية",
              en: "Medical Services",
            },
            href: SYSTEM_WORKSPACE_ROUTES.medicalServices,
            icon: Stethoscope,
            description: {
              ar: "الخدمات الطبية والأسعار وإسناد الممارسين",
              en: "Medical services, pricing, and practitioner assignments",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "التشغيل الطبي",
              en: "Clinical Operations",
            },
            href: SYSTEM_WORKSPACE_ROUTES.clinicalOperations,
            icon: Activity,
            description: {
              ar: "اللقاءات والتشخيصات والإجراءات والإحالات الطبية",
              en: "Encounters, diagnoses, procedures, and medical referrals",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "الفوترة والتحصيل",
          en: "Billing & Collection",
        },
        href: SYSTEM_WORKSPACE_ROUTES.billing,
        icon: ReceiptText,
        description: {
          ar: "فواتير المرضى والمدفوعات والخزينة والحسابات",
          en: "Patient billing, payments, treasury, and accounting",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "فواتير المرضى",
              en: "Patient Billing",
            },
            href: SYSTEM_WORKSPACE_ROUTES.billing,
            icon: ReceiptText,
            description: {
              ar: "الفواتير والخدمات والعربون والاستردادات",
              en: "Invoices, services, deposits, and refunds",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "مدفوعات المرضى",
              en: "Patient Payments",
            },
            href: SYSTEM_WORKSPACE_ROUTES.payments,
            icon: CreditCard,
            description: {
              ar: "التحصيل وطرق الدفع وحالة السداد",
              en: "Collections, payment methods, and payment status",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الخزينة",
              en: "Treasury",
            },
            href: SYSTEM_WORKSPACE_ROUTES.treasury,
            icon: Wallet,
            description: {
              ar: "الصناديق والبنوك وحركة النقد",
              en: "Cashboxes, banks, and cash movements",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الحسابات",
              en: "Accounting",
            },
            href: SYSTEM_WORKSPACE_ROUTES.accounting,
            icon: Calculator,
            description: {
              ar: "الحسابات والتقارير المالية الداخلية",
              en: "Internal accounting and financial reports",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "الموارد البشرية",
          en: "Human Resources",
        },
        href: SYSTEM_WORKSPACE_ROUTES.humanResources,
        icon: UserCog,
        description: {
          ar: "الموظفون والحضور والإجازات والرواتب",
          en: "Employees, attendance, leave, and payroll",
        },
        ...systemScope,
      },
      {
        title: {
          ar: "الاتصالات",
          en: "Communications",
        },
        href: SYSTEM_WORKSPACE_ROUTES.notifications,
        icon: MessageCircle,
        description: {
          ar: "الإشعارات وواتساب وسجل الإرسال",
          en: "Notifications, WhatsApp, and delivery logs",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "مركز الإشعارات",
              en: "Notifications Center",
            },
            href: SYSTEM_WORKSPACE_ROUTES.notifications,
            icon: BellRing,
            description: {
              ar: "إشعارات المستخدمين والقوالب وسجل الإرسال",
              en: "User notifications, templates, and delivery log",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "واتساب",
              en: "WhatsApp",
            },
            href: SYSTEM_WORKSPACE_ROUTES.whatsapp,
            icon: MessageCircle,
            description: {
              ar: "صندوق المحادثات والرسائل وإعدادات الاتصال",
              en: "Inbox, messages, and connection settings",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "التقارير",
          en: "Reports",
        },
        href: SYSTEM_WORKSPACE_ROUTES.reports,
        icon: BarChart3,
        description: {
          ar: "تقارير الفروع والمواعيد والمرضى والممارسين والمالية",
          en: "Branch, appointment, patient, practitioner, and financial reports",
        },
        ...systemScope,
      },
      {
        title: {
          ar: "الإدارة والصلاحيات",
          en: "Administration & Access",
        },
        href: SYSTEM_WORKSPACE_ROUTES.users,
        aliases: [SYSTEM_WORKSPACE_ROUTES.organizationUsers],
        icon: ShieldCheck,
        description: {
          ar: "حسابات الدخول والأدوار والصلاحيات وسجل التدقيق",
          en: "Login accounts, roles, permissions, and audit log",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "حسابات الدخول",
              en: "Login Accounts",
            },
            href: SYSTEM_WORKSPACE_ROUTES.users,
            icon: UserCog,
            description: {
              ar: "مستخدمو النظام وحالات الحساب والجلسات",
              en: "System users, account status, and sessions",
            },
            anyPermissions: [
              PERMISSIONS.USERS_VIEW,
              PERMISSIONS.SYSTEM_SETTINGS,
              PERMISSIONS.SYSTEM_VIEW,
            ],
            workspaces: ["system"],
          },
          {
            title: {
              ar: "مستخدمو المنشأة والفروع",
              en: "Organization & Branch Users",
            },
            href: SYSTEM_WORKSPACE_ROUTES.organizationUsers,
            icon: UserCog,
            description: {
              ar: "إدارة المستخدمين التشغيليين وربطهم بالمنشأة والفروع",
              en: "Manage operational users and their organization and branch scope",
            },
            anyPermissions: [
              PERMISSIONS.USERS_VIEW,
              PERMISSIONS.SYSTEM_SETTINGS,
              PERMISSIONS.SYSTEM_VIEW,
            ],
            workspaces: ["system"],
          },
          {
            title: {
              ar: "الأدوار",
              en: "Roles",
            },
            href: SYSTEM_WORKSPACE_ROUTES.roles,
            icon: ShieldCheck,
            description: {
              ar: "تعريف الأدوار الوظيفية داخل المنشأة",
              en: "Define organization roles",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "الصلاحيات",
              en: "Permissions",
            },
            href: SYSTEM_WORKSPACE_ROUTES.permissions,
            icon: KeyRound,
            description: {
              ar: "إدارة الصلاحيات ونطاق الفروع",
              en: "Manage permissions and branch scope",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "سجل التدقيق",
              en: "Audit Log",
            },
            href: SYSTEM_WORKSPACE_ROUTES.auditLog,
            icon: FileText,
            description: {
              ar: "العمليات الحساسة والوصول والتعديلات",
              en: "Sensitive actions, access, and changes",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "التكاملات وصحة النظام",
          en: "Integrations & System Health",
        },
        href: SYSTEM_WORKSPACE_ROUTES.integrations,
        aliases: [
          "/system/release-readiness",
          "/system/api-contracts",
          "/system/activity-backends",
          "/system/business-controls",
        ],
        icon: Briefcase,
        description: {
          ar: "التكاملات والخدمات والجاهزية والأخطاء التقنية",
          en: "Integrations, services, readiness, and technical errors",
        },
        ...systemScope,
        items: [
          {
            title: {
              ar: "التكاملات",
              en: "Integrations",
            },
            href: SYSTEM_WORKSPACE_ROUTES.integrations,
            icon: Briefcase,
            description: {
              ar: "مفاتيح الربط وعقود API والخدمات الخارجية",
              en: "API keys, contracts, and external services",
            },
            ...systemScope,
          },
          {
            title: {
              ar: "صحة النظام",
              en: "System Health",
            },
            href: SYSTEM_WORKSPACE_ROUTES.health,
            icon: Activity,
            description: {
              ar: "حالة الخدمات وواتساب والإشعارات والمهام الخلفية",
              en: "Services, WhatsApp, notifications, and background jobs",
            },
            ...systemScope,
          },
        ],
      },
      {
        title: {
          ar: "إعدادات المنشأة",
          en: "Organization Settings",
        },
        href: SYSTEM_WORKSPACE_ROUTES.settings,
        aliases: ["/system/documents"],
        icon: Settings,
        description: {
          ar: "إعدادات Marilyn Clinics والفروع والحجز والاتصالات والأمان",
          en: "Marilyn Clinics, branch, booking, communication, and security settings",
        },
        permission: PERMISSIONS.SYSTEM_SETTINGS,
        workspaces: ["system"],
      },
    ],
  },
];
const searchItemsByHref = new Map<
  string,
  {
    title: {
      ar: string;
      en: string;
    };
    href: string;
    aliases?: string[];
    icon?: LucideIcon;
    description?: {
      ar: string;
      en: string;
    };
  }
>();
for (const group of SYSTEM_WORKSPACE_NAV_GROUPS) {
  for (const item of group.items) {
    const candidates = [item, ...(item.items || [])];
    for (const candidate of candidates) {
      if (searchItemsByHref.has(candidate.href)) continue;
      searchItemsByHref.set(candidate.href, {
        title: candidate.title,
        href: candidate.href,
        aliases: candidate.aliases,
        icon: candidate.icon,
        description: candidate.description,
      });
    }
  }
}
export const SYSTEM_WORKSPACE_SEARCH_ITEMS = Array.from(
  searchItemsByHref.values(),
);
