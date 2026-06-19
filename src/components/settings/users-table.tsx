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
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import type { OrgRole, UserStatus } from "@/types/domain";

type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  status: UserStatus;
  created_at: string;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  expires_at: string;
  created_at: string;
};

function roleBadgeVariant(role: OrgRole) {
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

  function handleRoleChange(userId: string, role: OrgRole) {
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
    <div className="space-y-4">
      {users.length === 0 ? (
        <SmartsheetGridEmpty message="No team members found." />
      ) : (
        <SmartsheetGrid>
          <SmartsheetGridHeader>
            <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
              <SmartsheetGridHead>Name</SmartsheetGridHead>
              <SmartsheetGridHead>Email</SmartsheetGridHead>
              <SmartsheetGridHead className="w-28">Role</SmartsheetGridHead>
              <SmartsheetGridHead className="w-24">Status</SmartsheetGridHead>
              <SmartsheetGridHead className="w-24 text-right">Actions</SmartsheetGridHead>
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isOwner = user.role === "owner";

              return (
                <SmartsheetGridRow key={user.id}>
                  <SmartsheetGridCell className="font-medium">{user.name}</SmartsheetGridCell>
                  <SmartsheetGridCell className="text-muted-foreground">{user.email}</SmartsheetGridCell>
                  <SmartsheetGridCell>
                    {isOwner || isSelf ? (
                      <Badge variant={roleBadgeVariant(user.role)} className="h-5 px-1.5 text-[10px] capitalize">
                        {user.role}
                      </Badge>
                    ) : (
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as OrgRole)}
                        disabled={pending}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </SmartsheetGridCell>
                  <SmartsheetGridCell className="capitalize text-muted-foreground">
                    {user.status}
                  </SmartsheetGridCell>
                  <SmartsheetGridCell className="text-right">
                    {!isSelf && !isOwner && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={pending}
                        onClick={() => handleStatusToggle(user.id, user.status)}
                      >
                        {user.status === "active" ? "Disable" : "Enable"}
                      </Button>
                    )}
                  </SmartsheetGridCell>
                </SmartsheetGridRow>
              );
            })}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      )}

      {invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending invitations
          </h3>
          <SmartsheetGrid>
            <SmartsheetGridHeader>
              <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
                <SmartsheetGridHead>Email</SmartsheetGridHead>
                <SmartsheetGridHead className="w-24">Role</SmartsheetGridHead>
                <SmartsheetGridHead className="w-28">Expires</SmartsheetGridHead>
              </SmartsheetGridRow>
            </SmartsheetGridHeader>
            <SmartsheetGridBody>
              {invitations.map((invite) => (
                <SmartsheetGridRow key={invite.id}>
                  <SmartsheetGridCell>{invite.email}</SmartsheetGridCell>
                  <SmartsheetGridCell className="capitalize text-muted-foreground">
                    {invite.role}
                  </SmartsheetGridCell>
                  <SmartsheetGridCell className="text-muted-foreground">
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </SmartsheetGridCell>
                </SmartsheetGridRow>
              ))}
            </SmartsheetGridBody>
          </SmartsheetGrid>
        </div>
      )}
    </div>
  );
}
