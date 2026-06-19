"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { createRow, updateRow } from "@/actions/rows";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/database";
import type { Row, RowData, SheetColumn } from "@/types/domain";
import { toast } from "sonner";

type SelectOption = { value: string; label: string };

function getSelectOptions(column: SheetColumn): SelectOption[] {
  const config = column.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const options = (config as { options?: unknown }).options;
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .filter((option): option is { value: string; label: string } => {
      return (
        typeof option === "object" &&
        option !== null &&
        "value" in option &&
        typeof option.value === "string"
      );
    })
    .map((option) => ({
      value: option.value,
      label: typeof option.label === "string" ? option.label : option.value,
    }));
}

function formatCellValue(column: SheetColumn, value: Json | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (column.type === "checkbox") {
    return value === true || value === "true" ? "Yes" : "No";
  }

  if (column.type === "select") {
    const options = getSelectOptions(column);
    const match = options.find((option) => option.value === String(value));
    return match?.label ?? String(value);
  }

  return String(value);
}

function EditableCell({
  column,
  rowId,
  value,
}: {
  column: SheetColumn;
  rowId: string;
  value: Json | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const displayValue = value === null || value === undefined ? "" : String(value);

  function save(nextValue: string) {
    const trimmed = nextValue.trim();
    const current = displayValue.trim();

    if (trimmed === current) {
      return;
    }

    startTransition(async () => {
      const data: RowData = { [column.key]: trimmed || null };
      const result = await updateRow(rowId, data);

      if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  if (column.type === "select") {
    const options = getSelectOptions(column);

    return (
      <select
        className="h-7 w-full min-w-0 rounded border-0 bg-transparent px-1 text-[13px] outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        value={displayValue}
        disabled={isPending}
        onChange={(event) => save(event.target.value)}
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "checkbox") {
    const checked = value === true || value === "true";

    return (
      <input
        type="checkbox"
        className="size-4"
        checked={checked}
        disabled={isPending}
        onChange={(event) => {
          startTransition(async () => {
            const result = await updateRow(rowId, { [column.key]: event.target.checked });
            if (!result.success) {
              toast.error(result.error);
            }
          });
        }}
      />
    );
  }

  if (column.type === "long_text") {
    return (
      <textarea
        className="min-h-7 w-full min-w-0 resize-none rounded border-0 bg-transparent px-1 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        defaultValue={displayValue}
        rows={1}
        disabled={isPending}
        onBlur={(event) => save(event.target.value)}
      />
    );
  }

  const inputType =
    column.type === "number" || column.type === "currency"
      ? "number"
      : column.type === "date"
        ? "date"
        : column.type === "email"
          ? "email"
          : column.type === "url"
            ? "url"
            : "text";

  return (
    <Input
      type={inputType}
      className="h-7 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
      defaultValue={displayValue}
      disabled={isPending}
      onBlur={(event) => save(event.target.value)}
    />
  );
}

export function SheetGrid({
  sheetId,
  columns,
  rows,
}: {
  sheetId: string;
  columns: SheetColumn[];
  rows: Row[];
}) {
  const router = useRouter();
  const [isCreating, startCreate] = useTransition();

  function handleAddRow() {
    startCreate(async () => {
      const result = await createRow(sheetId, {});
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (columns.length === 0) {
    return <SmartsheetGridEmpty message="This sheet has no columns yet." />;
  }

  return (
    <div className="flex flex-col gap-2">
      <SmartsheetGrid>
        <SmartsheetGridHeader>
          <SmartsheetGridRow>
            <SmartsheetGridHead className="w-10 text-center">#</SmartsheetGridHead>
            {columns.map((column) => (
              <SmartsheetGridHead
                key={column.id}
                style={column.width ? { minWidth: column.width } : undefined}
              >
                {column.label}
              </SmartsheetGridHead>
            ))}
          </SmartsheetGridRow>
        </SmartsheetGridHeader>
        <SmartsheetGridBody>
          {rows.length === 0 ? (
            <SmartsheetGridRow>
              <SmartsheetGridCell
                colSpan={columns.length + 1}
                className="py-8 text-center text-muted-foreground"
              >
                No rows yet. Add one below.
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          ) : (
            rows.map((row, index) => {
              const rowData =
                row.data && typeof row.data === "object" && !Array.isArray(row.data)
                  ? (row.data as Record<string, Json | undefined>)
                  : {};

              return (
                <SmartsheetGridRow key={row.id}>
                  <SmartsheetGridCell className="w-10 text-center text-muted-foreground">
                    {index + 1}
                  </SmartsheetGridCell>
                  {columns.map((column) => (
                    <SmartsheetGridCell key={column.id}>
                      {column.type === "contact" ? (
                        <span className="text-muted-foreground">
                          {formatCellValue(column, rowData[column.key]) || "—"}
                        </span>
                      ) : (
                        <EditableCell
                          column={column}
                          rowId={row.id}
                          value={rowData[column.key]}
                        />
                      )}
                    </SmartsheetGridCell>
                  ))}
                </SmartsheetGridRow>
              );
            })
          )}
        </SmartsheetGridBody>
      </SmartsheetGrid>

      <div className="border-x border-b px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={isCreating}
          onClick={handleAddRow}
        >
          <PlusIcon className="size-3.5" />
          Add row
        </Button>
      </div>
    </div>
  );
}
