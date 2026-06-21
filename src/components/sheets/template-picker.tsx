"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { deleteUserTemplate, getTemplateWithVersion } from "@/actions/templates";
import {
  isBlankTemplateKey,
  parseTemplateColumns,
  templateColumnPreview,
} from "@/lib/templates/template-utils";
import type { SheetTemplate } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function TemplateList({
  templates,
  selectedTemplateId,
  onSelect,
  onDelete,
  deletingTemplateId,
}: {
  templates: SheetTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  deletingTemplateId?: string | null;
}) {
  if (templates.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
        No saved templates yet. Customize a sheet, then use <span className="font-medium text-foreground">Save as template</span>.
      </p>
    );
  }

  return (
    <ul className="max-h-48 space-y-1 overflow-auto rounded-md border p-1">
      {templates.map((template) => {
        const selected = selectedTemplateId === template.id;

        return (
          <li key={template.id}>
            <div
              className={cn(
                "flex items-start gap-1 rounded-md transition-colors hover:bg-muted",
                selected && "bg-muted",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 px-3 py-2 text-left"
                onClick={() => onSelect(template.id)}
              >
                <div className="text-sm font-medium">{template.name}</div>
                {template.description && (
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                )}
                <div className="text-[11px] text-muted-foreground">Version {template.current_version}</div>
              </button>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-1 mr-1 size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${template.name}`}
                  disabled={deletingTemplateId === template.id}
                  onClick={() => onDelete(template.id)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TemplatePicker({
  userTemplates,
  systemTemplates,
  selectedTemplateId,
  onSelect,
  onTemplatesChanged,
}: {
  userTemplates: SheetTemplate[];
  systemTemplates: SheetTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
  onTemplatesChanged?: () => void;
}) {
  const [previewColumns, setPreviewColumns] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allTemplates = [...userTemplates, ...systemTemplates];

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!selectedTemplateId) {
        setPreviewColumns("");
        return;
      }

      const template = allTemplates.find((entry) => entry.id === selectedTemplateId);
      if (template && isBlankTemplateKey(template.key)) {
        setPreviewColumns("No preset columns — add your own after creation.");
        return;
      }

      try {
        const withVersion = await getTemplateWithVersion(selectedTemplateId);
        if (cancelled || !withVersion) {
          return;
        }

        const columns = parseTemplateColumns(withVersion.version.columns);
        setPreviewColumns(templateColumnPreview(columns));
      } catch {
        if (!cancelled) {
          setPreviewColumns("");
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [allTemplates, selectedTemplateId]);

  function handleDelete(templateId: string) {
    startTransition(async () => {
      setDeletingTemplateId(templateId);
      const result = await deleteUserTemplate(templateId);
      setDeletingTemplateId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Template deleted");
      if (selectedTemplateId === templateId) {
        const remaining = userTemplates.filter((template) => template.id !== templateId);
        onSelect(remaining[0]?.id ?? systemTemplates[0]?.id ?? null);
      }
      onTemplatesChanged?.();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">My templates</p>
        <TemplateList
          templates={userTemplates}
          selectedTemplateId={selectedTemplateId}
          onSelect={onSelect}
          onDelete={handleDelete}
          deletingTemplateId={deletingTemplateId}
        />
      </div>

      {systemTemplates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">System templates</p>
          <TemplateList
            templates={systemTemplates}
            selectedTemplateId={selectedTemplateId}
            onSelect={onSelect}
          />
        </div>
      )}

      {selectedTemplateId && previewColumns && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Columns: </span>
          {previewColumns}
        </div>
      )}
    </div>
  );
}
