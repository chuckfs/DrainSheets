"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignEditor, unassignEditor } from "@/actions/assignments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { UserRole } from "@/types/domain";

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};
type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function roleLabel(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function ManageAccessDialog({
  propertyId,
  propertyName,
  editors,
  assignments,
  orgUsers,
  open,
  onOpenChange,
}: {
  propertyId: string;
  propertyName: string;
  editors: Editor[];
  assignments: Assignment[];
  orgUsers: OrgUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assignments.map((a) => a.user_id));
  const availableEditors = editors.filter((e) => !assignedIds.has(e.id));
  const adminsAndOwners = orgUsers.filter((u) => u.role === "owner" || u.role === "admin");

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignEditor(propertyId, userId);
      if (!result.success) toast.error(result.error);
      else router.refresh();
    });
  }

  function handleUnassign(userId: string) {
    startTransition(async () => {
      const result = await unassignEditor(propertyId, userId);
      if (!result.success) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage access — {propertyName}</DialogTitle>
          <DialogDescription>
            Owners and admins always have access. Assign editors per property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {adminsAndOwners.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Organization access
              </h3>
              <ul className="space-y-1 rounded-md border p-2 text-sm">
                {adminsAndOwners.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="min-w-0 truncate">
                      {user.name}{" "}
                      <span className="text-muted-foreground">({user.email})</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {roleLabel(user.role)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned editors
            </h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No editors assigned yet.</p>
            ) : (
              <ul className="space-y-1">
                {assignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {assignment.profiles?.name ?? "Unknown"}{" "}
                      <span className="text-muted-foreground">
                        ({assignment.profiles?.email})
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleUnassign(assignment.user_id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {availableEditors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="manage-editor">Add editor</Label>
              <select
                id="manage-editor"
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue=""
                disabled={pending}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssign(e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>
                  Select editor…
                </option>
                {availableEditors.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
