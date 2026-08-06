/*
 * 📂 marilyn_frontend/app/system/organization/page.tsx
 * 🧩 Marilyn Clinics — Organization profile
 * ✅ Shared operational organization profile
 * ✅ Real API only: GET/PATCH /api/company/profile/
 * ✅ Central system workspace context
 */
import { CompanyProfilePage } from "@/app/company/settings/_components/company-settings-client";
export default function SystemOrganizationPage() {
  return <CompanyProfilePage workspace="system" />;
}
