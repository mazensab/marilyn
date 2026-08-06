import PractitionerDetailClient from "../_components/practitioner-detail-client";

type PractitionerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PractitionerDetailPage({
  params,
}: PractitionerDetailPageProps) {
  const { id } = await params;
  return <PractitionerDetailClient practitionerId={id} />;
}
