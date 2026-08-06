import { ClinicalRecordDetailClient } from "@/app/system/clinical-operations/_components/clinical-record-detail-client";
type PageProps = {
  params: Promise<{
    id: string;
    diagnosisId: string;
  }>;
};
export default async function DiagnosisDetailPage({
  params,
}: PageProps) {
  const {
    id,
    diagnosisId,
  } = await params;
  return (
    <ClinicalRecordDetailClient
      kind="diagnosis"
      encounterId={id}
      recordId={diagnosisId}
    />
  );
}
