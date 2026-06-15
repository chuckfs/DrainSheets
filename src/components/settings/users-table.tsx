"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateUserRole, updateUserStatus } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole, UserStatus } from "@/types/domain";

type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: UserRole;
  expires_at: string;
  created_at: string;
};

function roleBadgeVariant(role: UserRole) {
  if (role === "owner") return "default";
  if (role === "admin") return "secondary";
  return "outline";
}

export function UsersTable({
  users,
  invitations,
  currentUserId,
}: {
  users: OrgUser[];
  invitations: PendingInvitation[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      await updateUserRole(userId, role);
      router.refresh();
    });
  }

  function handleStatusToggle(userId: string, currentStatus: UserStatus) {
    const nextStatus: UserStatus = currentStatus === "active" ? "disabled" : "active";

    startTransition(async () => {
      await updateUserStatus(userId, nextStatus);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isOwner = user.role === "owner";

              return (
                <tr key={user.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {isOwner || isSelf ? (
                      <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    ) : (
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={pending}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{user.status}</td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && !isOwner && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleStatusToggle(user.id, user.status)}
                      >
                        {user.status === "active" ? "Disable" : "Enable"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {invitations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">Pending invitations</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invite) => (
                  <tr key={invite.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{invite.email}</td>
                    <td className="px-4 py-3 capitalize">{invite.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
