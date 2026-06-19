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
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { value: "", label: "Default" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
];

const ICON_OPTIONS = [
  { value: "", label: "None" },
  { value: "briefcase", label: "Briefcase" },
  { value: "building", label: "Building" },
  { value: "folder", label: "Folder" },
  { value: "layers", label: "Layers" },
];

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setColor("");
    setIcon("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    startTransition(async () => {
      const result = await createWorkspace({
        name: trimmed,
        color: color || null,
        icon: icon || null,
      });

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
      router.refresh();
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
          <div className="space-y-1.5">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={name}
              placeholder="My workspace"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-color">Color</Label>
              <select
                id="workspace-color"
                value={color}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                onChange={(event) => setColor(event.target.value)}
              >
                {COLOR_OPTIONS.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspace-icon">Icon</Label>
              <select
                id="workspace-icon"
                value={icon}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                onChange={(event) => setIcon(event.target.value)}
              >
                {ICON_OPTIONS.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
