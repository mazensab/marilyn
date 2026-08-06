import PatientDetailClient from "../_components/patient-detail-client";

type PatientDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { id } = await params;

  return (
    <PatientDetailClient patientId={id} />
  );
}
