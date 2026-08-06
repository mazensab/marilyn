/*
 * 📂 marilyn_frontend/app/system/branches/page.tsx
 * 🧩 Marilyn Clinics — Branch management
 * ✅ Shared operational branches interface
 * ✅ Real API only: /api/company/branches/**
 * ✅ Central system workspace context
 */
import { BranchesPage } from "@/app/company/settings/_components/company-settings-client";
export default function SystemBranchesPage() {
  return <BranchesPage workspace="system" />;
}
