"use client";

import { useState, useTransition } from "react";
import type { ColumnType } from "@/types/domain";
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

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "contact", label: "Contact" },
];

export function AddColumnDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (label: string, type: ColumnType) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setLabel("");
    setType("text");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    startTransition(async () => {
      const success = await onAdd(trimmed, type);
      if (success) {
        reset();
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="column-label">Label</Label>
            <Input
              id="column-label"
              value={label}
              placeholder="Column name"
              onChange={(event) => setLabel(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="column-type">Type</Label>
            <select
              id="column-type"
              value={type}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) => setType(event.target.value as ColumnType)}
            >
              {COLUMN_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !label.trim()}>
              Add column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
