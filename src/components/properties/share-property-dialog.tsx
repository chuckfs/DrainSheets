"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignEditor } from "@/actions/assignments";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "sonner";
import type { UserRole } from "@/types/domain";

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};
type OrgUser = { id: string; name: string; email: string; role: UserRole };

function roleLabel(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function SharedWithList({
  orgUsers,
  assignments,
}: {
  orgUsers: OrgUser[];
  assignments: Assignment[];
}) {
  const adminsAndOwners = orgUsers.filter((user) => user.role === "owner" || user.role === "admin");
  const hasEntries = adminsAndOwners.length > 0 || assignments.length > 0;

  if (!hasEntries) {
    return <p className="text-sm text-muted-foreground">Only you have access.</p>;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Shared with
      </h3>
      <ul className="space-y-1.5">
        {adminsAndOwners.map((user) => (
          <li key={user.id} className="flex items-center gap-2 text-sm">
            <UserAvatar name={user.name} />
            <span className="min-w-0 truncate">
              {user.name}{" "}
              <span className="text-muted-foreground">({roleLabel(user.role)})</span>
            </span>
          </li>
        ))}
        {assignments.map((assignment) => (
          <li key={assignment.id} className="flex items-center gap-2 text-sm">
            <UserAvatar name={assignment.profiles?.name ?? "?"} />
            <span className="min-w-0 truncate">
              {assignment.profiles?.name ?? "Unknown"}{" "}
              <span className="text-muted-foreground">(Editor)</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SharePropertyDialog({
  propertyId,
  propertyName,
  editors,
  assignments,
  orgUsers,
  open,
  onOpenChange,
  onManageAccess,
}: {
  propertyId: string;
  propertyName: string;
  editors: Editor[];
  assignments: Assignment[];
  orgUsers: OrgUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManageAccess: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assignments.map((a) => a.user_id));
  const availableEditors = editors.filter((e) => !assignedIds.has(e.id));

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignEditor(propertyId, userId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Editor assigned");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share “{propertyName}”</DialogTitle>
          <DialogDescription>
            Assign editors who can view and edit this property sheet.
          </DialogDescription>
        </DialogHeader>

        <SharedWithList orgUsers={orgUsers} assignments={assignments} />

        {availableEditors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Add editor
            </p>
            <Combobox
              options={availableEditors.map((editor) => ({
                value: editor.id,
                label: editor.name,
                description: editor.email,
              }))}
              placeholder="Select editor…"
              searchPlaceholder="Search users…"
              emptyMessage="No editors found."
              disabled={pending}
              onSelect={handleAssign}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All editors already have access.</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onManageAccess}>
            Manage access
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
