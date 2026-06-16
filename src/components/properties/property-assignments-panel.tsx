"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignEditor, unassignEditor } from "@/actions/assignments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};

export function PropertyAssignmentsPanel({
  propertyId,
  editors,
  assignments,
}: {
  propertyId: string;
  editors: Editor[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assignments.map((a) => a.user_id));
  const availableEditors = editors.filter((e) => !assignedIds.has(e.id));

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignEditor(propertyId, userId);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  function handleUnassign(userId: string) {
    startTransition(async () => {
      const result = await unassignEditor(propertyId, userId);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">Editor assignments</h3>
        <p className="text-sm text-muted-foreground">
          Assign editors who can access this property.
        </p>
      </div>

      {assignments.length > 0 && (
        <ul className="space-y-2">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {assignment.profiles?.name ?? "Unknown"}{" "}
                <span className="text-muted-foreground">({assignment.profiles?.email})</span>
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

      {availableEditors.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="editor">Add editor</Label>
            <select
              id="editor"
              className="flex h-8 min-w-[200px] rounded-lg border border-input bg-background px-2.5 text-sm"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAssign(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={pending}
            >
              <option value="" disabled>
                Select editor...
              </option>
              {availableEditors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No editors available to assign.</p>
      )}
    </div>
  );
}
