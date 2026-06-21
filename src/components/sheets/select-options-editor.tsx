"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { SelectOptionConfig } from "@/lib/sheets/select-options";
import { parseSelectOptionsFromConfig } from "@/lib/sheets/select-options";
import type { SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";

const COLOR_PRESETS = ["gray", "blue", "green", "red", "yellow", "purple", "orange", "pink", "teal"];

export function SelectOptionsEditor({
  column,
  open,
  onOpenChange,
  onSave,
}: {
  column: SheetColumn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (options: SelectOptionConfig[]) => Promise<boolean>;
}) {
  const [options, setOptions] = useState<SelectOptionConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOptions(parseSelectOptionsFromConfig(column.config));
    }
  }, [column.config, open]);

  function updateOption(index: number, patch: Partial<SelectOptionConfig>) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function addOption() {
    setOptions((current) => [...current, { label: "New option", color: "gray" }]);
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  }

  function moveOption(index: number, direction: "up" | "down") {
    setOptions((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const temp = next[index];
      const swap = next[targetIndex];
      if (!temp || !swap) {
        return current;
      }

      next[index] = swap;
      next[targetIndex] = temp;
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    const success = await onSave(options.filter((option) => option.label.trim().length > 0));
    setIsSaving(false);
    if (success) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit options — {column.label}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[360px] space-y-2 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No options yet.</p>
          ) : (
            options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                <Input
                  value={option.label}
                  className="h-8 flex-1"
                  onChange={(event) => updateOption(index, { label: event.target.value })}
                />
                <AppSelect
                  size="sm"
                  triggerClassName="w-24 capitalize"
                  value={option.color ?? "gray"}
                  options={COLOR_PRESETS.map((color) => ({
                    value: color,
                    label: color,
                  }))}
                  onValueChange={(color) => updateOption(index, { color })}
                />
                <div className="flex shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    onClick={() => moveOption(index, "up")}
                  >
                    <ChevronUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index >= options.length - 1}
                    onClick={() => moveOption(index, "down")}
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addOption}>
          <PlusIcon className="size-3.5" />
          Add option
        </Button>

        <p className="text-xs text-muted-foreground">
          Existing row values are preserved. Option values are generated from labels when not set.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSaving} onClick={() => void handleSave()}>
            Save options
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
