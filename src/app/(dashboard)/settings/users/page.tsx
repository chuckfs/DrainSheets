import { listOrgUsers, listPendingInvitations } from "@/actions/users";
import { requireOwner } from "@/lib/auth/guards";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { UsersTable } from "@/components/settings/users-table";

export default async function UsersSettingsPage() {
  const owner = await requireOwner();
  const [users, invitations] = await Promise.all([listOrgUsers(), listPendingInvitations()]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Invite users</h2>
          <p className="text-sm text-muted-foreground">
            Send an invitation link manually until email delivery is enabled.
          </p>
        </div>
        <InviteUserForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Team members</h2>
        <UsersTable users={users} invitations={invitations} currentUserId={owner.id} />
      </div>
    </div>
  );
}
