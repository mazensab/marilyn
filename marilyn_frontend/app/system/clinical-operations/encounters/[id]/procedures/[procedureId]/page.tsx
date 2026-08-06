import { ClinicalRecordDetailClient } from "@/app/system/clinical-operations/_components/clinical-record-detail-client";
type PageProps = {
  params: Promise<{
    id: string;
    procedureId: string;
  }>;
};
export default async function ProcedureDetailPage({
  params,
}: PageProps) {
  const {
    id,
    procedureId,
  } = await params;
  return (
    <ClinicalRecordDetailClient
      kind="procedure"
      encounterId={id}
      recordId={procedureId}
    />
  );
}
