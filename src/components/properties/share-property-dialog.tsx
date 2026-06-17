"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignEditor } from "@/actions/assignments";
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

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};

export function SharePropertyDialog({
  propertyId,
  propertyName,
  editors,
  assignments,
  open,
  onOpenChange,
  onManageAccess,
}: {
  propertyId: string;
  propertyName: string;
  editors: Editor[];
  assignments: Assignment[];
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

        {assignments.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-auto rounded-md border p-2 text-sm">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="truncate">
                {assignment.profiles?.name ?? "Unknown"}{" "}
                <span className="text-muted-foreground">({assignment.profiles?.email})</span>
              </li>
            ))}
          </ul>
        )}

        {availableEditors.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="share-editor">Add editor</Label>
            <select
              id="share-editor"
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
