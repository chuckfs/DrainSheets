"use client";

import { useEffect, useState } from "react";
import { getTemplateWithVersion } from "@/actions/templates";
import {
  isBlankTemplateKey,
  parseTemplateColumns,
  templateColumnPreview,
} from "@/lib/templates/template-utils";
import type { SheetTemplate } from "@/types/domain";
import { cn } from "@/lib/utils";

export function TemplatePicker({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: SheetTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
}) {
  const [previewColumns, setPreviewColumns] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!selectedTemplateId) {
        setPreviewColumns("");
        return;
      }

      const template = templates.find((entry) => entry.id === selectedTemplateId);
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
  }, [selectedTemplateId, templates]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        System templates
      </p>
      <ul className="max-h-56 space-y-1 overflow-auto rounded-md border p-1">
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;

          return (
            <li key={template.id}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted",
                  selected && "bg-muted",
                )}
                onClick={() => onSelect(template.id)}
              >
                <div className="text-sm font-medium">{template.name}</div>
                {template.description && (
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                )}
                <div className="text-[11px] text-muted-foreground">Version {template.current_version}</div>
              </button>
            </li>
          );
        })}
      </ul>
      {selectedTemplateId && previewColumns && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Columns: </span>
          {previewColumns}
        </div>
      )}
    </div>
  );
}
