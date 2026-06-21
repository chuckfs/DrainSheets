"use client";

import { useState } from "react";
import { saveSheetAsTemplate } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  sheetId,
  defaultName,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
  defaultName?: string;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  function reset(nextName?: string) {
    setName(nextName ?? defaultName ?? "");
    setDescription("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setIsPending(true);
    try {
      const result = await saveSheetAsTemplate({
        sheetId,
        name: trimmed,
        description: description.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Template saved");
      reset(trimmed);
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        } else if (defaultName) {
          setName(defaultName);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>
            Save this sheet&apos;s column layout as a reusable template. Row data is not included.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              value={name}
              placeholder="My prospect list"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-description">Description (optional)</Label>
            <Textarea
              id="template-description"
              value={description}
              placeholder="What is this template for?"
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Save template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
