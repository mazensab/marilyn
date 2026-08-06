import { MedicalServiceDetailClient } from "@/app/system/medical-services/_components/medical-service-detail-client";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function MedicalServiceDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  return (
    <MedicalServiceDetailClient
      offeringId={id}
    />
  );
}
