import { listOrgUsers, listPendingInvitations } from "@/actions/users";
import { requireOwner } from "@/lib/auth/guards";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { UsersTable } from "@/components/settings/users-table";

export default async function UsersSettingsPage() {
  const owner = await requireOwner();
  const [users, invitations] = await Promise.all([listOrgUsers(), listPendingInvitations()]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Invite users</h2>
          <p className="text-xs text-muted-foreground">
            Send an invitation link manually until email delivery is enabled.
          </p>
        </div>
        <InviteUserForm />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Team members</h2>
        <UsersTable users={users} invitations={invitations} currentUserId={owner.id} />
      </section>
    </div>
  );
}
