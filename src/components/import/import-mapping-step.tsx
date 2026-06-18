"use client";

import { ArrowRightIcon } from "lucide-react";
import type { ColumnMapping, ImportFieldKey } from "@/lib/import/mapping";
import { IMPORT_FIELDS } from "@/lib/import/mapping";
import type { ImportMode } from "@/lib/validations/import";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ImportMappingStepProps = {
  mode: ImportMode;
  columns: string[];
  mapping: ColumnMapping;
  onMappingChange: (column: string, field: ImportFieldKey | null) => void;
};

export function ImportMappingStep({
  mode,
  columns,
  mapping,
  onMappingChange,
}: ImportMappingStepProps) {
  const fields = IMPORT_FIELDS[mode];
  const mappedFields = new Set(
    Object.values(mapping).filter((value): value is ImportFieldKey => value !== null),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Match each Smartsheet column to a DrainSheets field. Unmapped columns are ignored.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Smartsheet column</TableHead>
            <TableHead className="w-10" />
            <TableHead>DrainSheets field</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {columns.map((column) => {
            const selected = mapping[column] ?? null;
            const fieldDef = fields.find((field) => field.key === selected);
            const isRequiredUnmapped =
              fieldDef?.required === false &&
              fields.some((field) => field.required && !mappedFields.has(field.key));

            return (
              <TableRow key={column}>
                <TableCell className="font-medium">{column}</TableCell>
                <TableCell>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Select
                      value={selected ?? "none"}
                      onValueChange={(value) =>
                        onMappingChange(column, value === "none" ? null : (value as ImportFieldKey))
                      }
                    >
                      <SelectTrigger className="w-full min-w-[220px]">
                        <SelectValue placeholder="Ignore column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ignore column</SelectItem>
                        {fields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isRequiredUnmapped && selected && fieldDef?.required && (
                      <Label className="text-xs text-amber-600">Required field</Label>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <p className="font-medium">Required fields</p>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">
          {fields
            .filter((field) => field.required)
            .map((field) => (
              <li key={field.key}>
                {field.label}
                {mappedFields.has(field.key) ? " — mapped" : " — not mapped yet"}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
