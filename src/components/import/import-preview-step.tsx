"use client";

import type { ImportPreviewSummary } from "@/lib/import/preview";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  valid: "Valid",
  warning: "Warning",
  invalid: "Invalid",
  skipped: "Skipped",
} as const;

export type ImportPreviewStepProps = {
  preview: ImportPreviewSummary;
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (value: boolean) => void;
};

export function ImportPreviewStep({
  preview,
  skipDuplicates,
  onSkipDuplicatesChange,
}: ImportPreviewStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rows found" value={preview.totalRows} />
        <StatCard label="Valid" value={preview.validRows} />
        <StatCard label="Duplicates" value={preview.duplicateRows} />
        <StatCard label="Invalid" value={preview.invalidRows} />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="skip-duplicates">Skip duplicates</Label>
          <p className="text-xs text-muted-foreground">
            Skip rows that match an existing record or appear twice in this file.
          </p>
        </div>
        <input
            id="skip-duplicates"
            type="checkbox"
            checked={skipDuplicates}
            onChange={(event) => onSkipDuplicatesChange(event.target.checked)}
            className="size-4 rounded border"
          />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Preview (first {preview.rows.length} rows)</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Row</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.rows.map((row) => (
              <TableRow key={row.rowIndex}>
                <TableCell>{row.rowIndex}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                      row.status === "valid" && "bg-emerald-100 text-emerald-800",
                      row.status === "warning" && "bg-amber-100 text-amber-800",
                      row.status === "invalid" && "bg-red-100 text-red-800",
                      row.status === "skipped" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABELS[row.status]}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {row.message ?? Object.values(row.record).filter(Boolean).slice(0, 3).join(" · ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {preview.skippedRows > 0 && skipDuplicates
          ? `${preview.skippedRows} rows will be skipped as duplicates. `
          : ""}
        Confirm to start the import. No data is written until you confirm.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
