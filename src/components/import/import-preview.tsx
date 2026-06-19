import type { ImportPreviewSummary } from "@/lib/import/types";

export function ImportPreviewPanel({ preview }: { preview: ImportPreviewSummary }) {
  const previewColumns =
    preview.previewRows.length > 0 ? Object.keys(preview.previewRows[0] ?? {}) : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="Total rows" value={preview.totalRows} />
        <Stat label="Valid rows" value={preview.validRows} />
        <Stat label="Duplicates" value={preview.duplicateRows} />
        <Stat label="Columns" value={preview.columnCount} />
      </div>

      {preview.previewRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rows to preview.</p>
      ) : (
        <div className="overflow-auto rounded-md border">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {previewColumns.map((column) => (
                  <th key={column} className="px-2 py-1 text-left font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.previewRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {previewColumns.map((column) => (
                    <td key={column} className="max-w-40 truncate px-2 py-1">
                      {formatPreviewValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Showing first {preview.previewRows.length} of {preview.validRows} valid rows.
        {preview.skippedRows > 0 && ` ${preview.skippedRows} row(s) will be skipped.`}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}
