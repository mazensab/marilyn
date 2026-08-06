// unified_organization_user_edit_route_page=true
import {
  UnifiedUserEntryPage,
} from "../../../_components/unified-user-entry-page";
type SystemOrganizationUserEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function SystemOrganizationUserEditPage({
  params,
}: SystemOrganizationUserEditPageProps) {
  const {
    id,
  } = await params;
  return (
    <UnifiedUserEntryPage
      initialScope="organization"
      initialEditId={id}
    />
  );
}
