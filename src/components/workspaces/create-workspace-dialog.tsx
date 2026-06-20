"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/actions/workspaces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { toast } from "sonner";

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  // Color + initials are assigned automatically from the name — live preview.
  const previewName = name.trim() || "New workspace";

  function reset() {
    setName("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    startTransition(async () => {
      const result = await createWorkspace({ name: trimmed });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (!result.data) {
        toast.error("Failed to create workspace");
        return;
      }

      toast.success("Workspace created");
      reset();
      onOpenChange(false);
      router.push(`/workspaces/${result.data.id}`);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <WorkspaceAvatar
              id={previewName}
              name={previewName}
              preview
              className="size-12 rounded-xl text-base"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                value={name}
                placeholder="My workspace"
                autoFocus
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A color and initials are assigned automatically and used everywhere this
            workspace appears.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              Create workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
