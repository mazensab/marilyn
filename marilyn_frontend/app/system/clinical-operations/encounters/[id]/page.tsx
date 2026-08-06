import { ClinicalEncounterDetailClient } from "@/app/system/clinical-operations/_components/clinical-encounter-detail-client";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function ClinicalEncounterDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  return (
    <ClinicalEncounterDetailClient
      encounterId={id}
    />
  );
}
