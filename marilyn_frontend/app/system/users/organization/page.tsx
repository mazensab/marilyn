/*
 * 📂 marilyn_frontend/app/system/users/organization/page.tsx
 * 🧩 Marilyn Clinics — Organization and branch users
 * ✅ Keeps /system/users for central account administration
 * ✅ Uses operational company user and branch APIs
 * ✅ Real API only: /api/company/users/ and /api/company/branches/
 */
import { CompanyUsersPage } from "@/app/company/settings/_components/company-settings-client";
export default function SystemOrganizationUsersPage() {
  return <CompanyUsersPage workspace="system" />;
}
