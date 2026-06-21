"use client";

import type { ColumnType } from "@/types/domain";
import type { ColumnMappingEntry, InferredColumn } from "@/lib/import/types";
import { AppSelect } from "@/components/ui/app-select";
import { Label } from "@/components/ui/label";

const COLUMN_TYPES: ColumnType[] = [
  "text",
  "long_text",
  "number",
  "currency",
  "date",
  "url",
  "email",
  "phone",
  "checkbox",
  "contact",
];

type TargetOption = {
  key: string;
  label: string;
  type: ColumnType;
};

export function ImportMapper({
  sourceHeaders,
  mapping,
  onMappingChange,
  targetOptions,
  inferredColumns,
  mode,
}: {
  sourceHeaders: string[];
  mapping: Record<string, ColumnMappingEntry>;
  onMappingChange: (mapping: Record<string, ColumnMappingEntry>) => void;
  targetOptions: TargetOption[];
  inferredColumns?: InferredColumn[];
  mode: "freeform" | "template";
}) {
  function updateEntry(sourceHeader: string, patch: Partial<ColumnMappingEntry>) {
    const current = mapping[sourceHeader] ?? { sourceHeader, targetKey: null };
    onMappingChange({
      ...mapping,
      [sourceHeader]: { ...current, ...patch, sourceHeader },
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Map each file column to a sheet column. Choose Ignore to skip a column.
      </p>
      <ul className="max-h-72 space-y-2 overflow-auto rounded-md border p-2">
        {sourceHeaders.map((header) => {
          const entry = mapping[header] ?? { sourceHeader: header, targetKey: null };
          const inferred = inferredColumns?.find((column) => column.sourceHeader === header);
          const selectedTarget = targetOptions.find((option) => option.key === entry.targetKey);

          return (
            <li key={header} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-sm">
              <div className="truncate font-medium" title={header}>
                {header}
              </div>
              <span className="text-muted-foreground">→</span>
              <AppSelect
                size="sm"
                value={entry.targetKey ?? ""}
                options={[
                  { value: "", label: "Ignore" },
                  ...targetOptions.map((option) => ({
                    value: option.key,
                    label: option.label,
                  })),
                ]}
                onValueChange={(targetKey) =>
                  updateEntry(header, {
                    targetKey: targetKey || null,
                    typeOverride:
                      mode === "freeform" ? inferred?.type : selectedTarget?.type,
                  })
                }
              />
              {mode === "freeform" ? (
                <AppSelect
                  size="sm"
                  value={entry.typeOverride ?? inferred?.type ?? "text"}
                  disabled={!entry.targetKey}
                  options={COLUMN_TYPES.map((type) => ({ value: type, label: type }))}
                  onValueChange={(typeOverride) =>
                    updateEntry(header, { typeOverride: typeOverride as ColumnType })
                  }
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {selectedTarget?.type ?? "—"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {mode === "freeform" && (
        <p className="text-[11px] text-muted-foreground">
          Type overrides apply when the target column is mapped.
        </p>
      )}
      {mode === "template" && (
        <Label className="text-[11px] font-normal text-muted-foreground">
          Template column types are fixed. Map source columns to matching targets.
        </Label>
      )}
    </div>
  );
}
