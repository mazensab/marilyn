import { ClinicalReferralDetailClient } from "@/app/system/clinical-operations/_components/clinical-referral-detail-client";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function ClinicalReferralDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  return (
    <ClinicalReferralDetailClient
      referralId={id}
    />
  );
}
