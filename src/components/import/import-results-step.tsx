"use client";

import { DownloadIcon } from "lucide-react";
import type { ImportResult } from "@/lib/validations/import";
import { Button } from "@/components/ui/button";

export type ImportResultsStepProps = {
  result: ImportResult;
  onDownloadErrors: () => void;
};

export function ImportResultsStep({ result, onDownloadErrors }: ImportResultsStepProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-emerald-50 p-4 text-emerald-900">
        <h3 className="text-lg font-semibold">Import complete</h3>
        <p className="mt-1 text-sm">Your Smartsheet data has been imported into DrainSheets.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ResultStat label="Created" value={result.created} />
        <ResultStat label="Skipped" value={result.skipped} />
        <ResultStat label="Errors" value={result.errors} />
      </div>

      {result.errorRows.length > 0 && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Error report</p>
            <p className="text-xs text-muted-foreground">
              Download a CSV with row numbers and error messages.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onDownloadErrors}>
            <DownloadIcon className="size-4" />
            Download error report
          </Button>
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-4 text-center">
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function buildErrorReportCsv(result: ImportResult): string {
  const headers = ["row", "message", "data"];
  const lines = [headers.join(",")];

  for (const row of result.errorRows) {
    const data = row.data ? JSON.stringify(row.data).replaceAll('"', '""') : "";
    const message = row.message.replaceAll('"', '""');
    lines.push(`${row.rowIndex},"${message}","${data}"`);
  }

  return lines.join("\n");
}

export function downloadErrorReport(result: ImportResult): void {
  const csv = buildErrorReportCsv(result);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "import-errors.csv";
  link.click();
  URL.revokeObjectURL(url);
}
