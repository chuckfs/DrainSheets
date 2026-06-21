"use client";

import { useEffect, useState, useTransition } from "react";
import { createFolder } from "@/actions/folders";
import type { Folder } from "@/types/domain";
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
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";

export function CreateFolderDialog({
  open,
  onOpenChange,
  workspaceId,
  folders,
  parentFolderId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  folders: Folder[];
  parentFolderId?: string | null;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string>(
    parentFolderId ?? "",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedParentId(parentFolderId ?? "");
  }, [parentFolderId, open]);

  function reset() {
    setName("");
    setSelectedParentId(parentFolderId ?? "");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    startTransition(async () => {
      const result = await createFolder({
        workspaceId,
        name: trimmed,
        parentFolderId: selectedParentId || null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Folder created");
      reset();
      onOpenChange(false);
      onCreated?.();
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
          <DialogTitle>Create folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={name}
              placeholder="Folder name"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="folder-parent">Parent folder</Label>
            <AppSelect
              id="folder-parent"
              value={selectedParentId}
              options={[
                { value: "", label: "Workspace root" },
                ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
              ]}
              onValueChange={setSelectedParentId}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              Create folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
