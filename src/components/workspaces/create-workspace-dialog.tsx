"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BanIcon,
  BriefcaseIcon,
  Building2Icon,
  FolderIcon,
  LayersIcon,
  type LucideIcon,
} from "lucide-react";
import { createWorkspace } from "@/actions/workspaces";
import { cn } from "@/lib/utils";
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
  { value: "#ea580c", label: "Orange" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
];

const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "", label: "No icon", Icon: BanIcon },
  { value: "briefcase", label: "Briefcase", Icon: BriefcaseIcon },
  { value: "building", label: "Building", Icon: Building2Icon },
  { value: "folder", label: "Folder", Icon: FolderIcon },
  { value: "layers", label: "Layers", Icon: LayersIcon },
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

  // The chosen color drives both the swatch ring and the live icon preview.
  const accent = color || "var(--primary)";

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

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((option) => {
                const selected = color === option.value;
                return (
                  <button
                    key={option.value || "default"}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={selected}
                    title={option.label}
                    onClick={() => setColor(option.value)}
                    className={cn(
                      "size-7 rounded-full border transition",
                      option.value ? "border-transparent" : "border-dashed border-muted-foreground/50",
                    )}
                    style={{
                      backgroundColor: option.value || "transparent",
                      boxShadow: selected
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${option.value || "var(--muted-foreground)"}`
                        : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2.5">
              {ICON_OPTIONS.map((option) => {
                const selected = icon === option.value;
                const Glyph = option.Icon;
                return (
                  <button
                    key={option.value || "none"}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={selected}
                    title={option.label}
                    onClick={() => setIcon(option.value)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg border transition",
                      selected ? "border-transparent" : "border-border hover:bg-accent",
                    )}
                    style={{
                      boxShadow: selected
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${accent}`
                        : undefined,
                    }}
                  >
                    <Glyph
                      className="size-4"
                      style={{ color: selected ? accent : "var(--muted-foreground)" }}
                      aria-hidden
                    />
                  </button>
                );
              })}
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
