import { describe, expect, it } from "vitest";
import {
  buildRowInsertPayloads,
  chunkRows,
  ROW_BATCH_SIZE,
} from "@/lib/import/batch-rows";
import { mapRowToSheetData } from "@/lib/import/transform";
import type { ColumnMappingEntry } from "@/lib/import/types";
import type { ColumnType } from "@/types/domain";

function generateImportRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    Company: `Acme ${index + 1}`,
    Email: `user${index + 1}@example.com`,
    Status: index % 2 === 0 ? "Active" : "Pending",
  }));
}

const mapping: Record<string, ColumnMappingEntry> = {
  company: { sourceHeader: "Company", targetKey: "company", typeOverride: null },
  email: { sourceHeader: "Email", targetKey: "email", typeOverride: "email" },
  status: { sourceHeader: "Status", targetKey: "status", typeOverride: "text" },
};

const columnTypes: Record<string, ColumnType> = {
  company: "text",
  email: "email",
  status: "text",
};

describe("large import batching", () => {
  it.each([
    { label: "1k", count: 1_000 },
    { label: "5k", count: 5_000 },
    { label: "10k", count: 10_000 },
  ])("chunks $label rows into batches of $ROW_BATCH_SIZE", ({ count }) => {
    const rows = generateImportRows(count);
    const batches = chunkRows(rows);

    expect(batches.length).toBe(Math.ceil(count / ROW_BATCH_SIZE));
    expect(batches.reduce((total, batch) => total + batch.length, 0)).toBe(count);
    expect(batches.every((batch) => batch.length <= ROW_BATCH_SIZE)).toBe(true);
  });

  it.each([
    { label: "1k", count: 1_000 },
    { label: "5k", count: 5_000 },
    { label: "10k", count: 10_000 },
  ])("builds insert payloads for $label rows with stable positions", ({ count }) => {
    const sourceRows = generateImportRows(count);
    const outputRows = sourceRows.map((row) => mapRowToSheetData(row, mapping, columnTypes));
    const payloads = buildRowInsertPayloads(outputRows, "sheet-id", "org-id", "user-id");

    expect(payloads.length).toBe(Math.ceil(count / ROW_BATCH_SIZE));

    const flat = payloads.flat();
    expect(flat).toHaveLength(count);
    expect(flat[0]?.position).toBe(0);
    expect(flat.at(-1)?.position).toBe(count - 1);
    expect(flat.every((row) => row.sheet_id === "sheet-id")).toBe(true);
  });

  it.each([
    { label: "1k", count: 1_000 },
    { label: "5k", count: 5_000 },
    { label: "10k", count: 10_000 },
  ])("maps $label rows without excessive memory growth", ({ count }) => {
    const before = process.memoryUsage().heapUsed;
    const sourceRows = generateImportRows(count);
    const outputRows = sourceRows.map((row) => mapRowToSheetData(row, mapping, columnTypes));
    const after = process.memoryUsage().heapUsed;

    expect(outputRows).toHaveLength(count);
    expect(outputRows[0]?.company).toBe("Acme 1");
    expect(after - before).toBeLessThan(count * 500);
  });
});

describe("large import contact resolution inputs", () => {
  it("extracts unique emails from 10k rows", () => {
    const rows = generateImportRows(10_000);
    const emails = new Set(rows.map((row) => row.Email.toLowerCase()));

    expect(emails.size).toBe(10_000);
  });
});
