// unified_user_creation_route=true
import {
  UnifiedUserEntryPage,
} from "../_components/unified-user-entry-page";
export default function SystemUsersCreatePage() {
  return (
    <UnifiedUserEntryPage
      initialScope="system"
    />
  );
}
