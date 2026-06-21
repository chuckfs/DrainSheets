"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlankSheet, createSheetFromTemplate, listTemplates } from "@/actions/templates";
import { isBlankTemplateKey } from "@/lib/templates/template-utils";
import type { SheetTemplate } from "@/types/domain";
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
import { TemplatePicker } from "./template-picker";
import { toast } from "sonner";

type CreateMode = "blank" | "template";

function pickDefaultTemplateId(userTemplates: SheetTemplate[], systemTemplates: SheetTemplate[]): string | null {
  return userTemplates[0]?.id ?? systemTemplates[0]?.id ?? null;
}

export function CreateSheetDialog({
  open,
  onOpenChange,
  workspaceId,
  folderId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  folderId?: string | null;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("blank");
  const [name, setName] = useState("");
  const [userTemplates, setUserTemplates] = useState<SheetTemplate[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<SheetTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await listTemplates();
      const user = data.filter((template) => template.scope === "user");
      const system = data.filter((template) => template.scope === "system");
      setUserTemplates(user);
      setSystemTemplates(system);
      setSelectedTemplateId((current) => {
        if (current && data.some((template) => template.id === current)) {
          return current;
        }
        return pickDefaultTemplateId(user, system);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadTemplates();
  }, [loadTemplates, open]);

  function reset() {
    setMode("blank");
    setName("");
    setSelectedTemplateId(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    startTransition(async () => {
      let result;
      const allTemplates = [...userTemplates, ...systemTemplates];

      if (mode === "blank") {
        result = await createBlankSheet({
          workspaceId,
          folderId: folderId ?? null,
          name: trimmed,
        });
      } else {
        if (!selectedTemplateId) {
          toast.error("Select a template");
          return;
        }

        const template = allTemplates.find((entry) => entry.id === selectedTemplateId);

        if (template && isBlankTemplateKey(template.key)) {
          result = await createBlankSheet({
            workspaceId,
            folderId: folderId ?? null,
            name: trimmed,
          });
        } else {
          result = await createSheetFromTemplate({
            templateId: selectedTemplateId,
            workspaceId,
            folderId: folderId ?? null,
            name: trimmed,
          });
        }
      }

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (!result.data?.sheetId) {
        toast.error("Failed to create sheet");
        return;
      }

      toast.success("Sheet created");
      reset();
      onOpenChange(false);
      onCreated?.();
      router.push(`/sheets/${result.data.sheetId}`);
      router.refresh();
    });
  }

  const hasTemplateOptions = userTemplates.length > 0 || systemTemplates.length > 0;

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create sheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-name">Sheet name</Label>
            <Input
              id="sheet-name"
              value={name}
              placeholder="New sheet"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "blank" ? "default" : "outline"}
              onClick={() => setMode("blank")}
            >
              Blank sheet
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "template" ? "default" : "outline"}
              onClick={() => setMode("template")}
            >
              From template
            </Button>
          </div>

          {mode === "template" &&
            (loadingTemplates ? (
              <p className="text-sm text-muted-foreground">Loading templates…</p>
            ) : (
              <TemplatePicker
                userTemplates={userTemplates}
                systemTemplates={systemTemplates}
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                onTemplatesChanged={() => void loadTemplates()}
              />
            ))}

          {mode === "blank" && (
            <p className="text-xs text-muted-foreground">
              Starts with one column and one empty row — double-click a header to rename, or expand with + or right-click.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                !name.trim() ||
                (mode === "template" && (!selectedTemplateId || !hasTemplateOptions))
              }
            >
              Create sheet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
