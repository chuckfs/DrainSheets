import { buildColumnLayout } from "../../src/lib/sheets/column-widths";
import { serializeRangeToTsv } from "../../src/lib/sheets/clipboard";
import { buildPasteCellUpdates } from "../../src/lib/sheets/grid-operations";
import {
  ROW_WINDOW_SIZE,
  computeLoadRange,
  createSparseRowStore,
  mergeRowsIntoStore,
} from "../../src/lib/sheets/row-window";
import type { Json } from "../../src/types/database";
import type { ColumnType, Row, SheetColumn } from "../../src/types/domain";
import { runTimedSamples } from "./stats";
import type { LatencySample } from "./types";
import { DEFAULT_ITERATIONS, SHEET_SIZES } from "./types";

const COLUMN_TYPES: ColumnType[] = [
  "text",
  "contact",
  "select",
  "text",
  "url",
  "currency",
  "number",
  "date",
  "checkbox",
  "email",
];

function makeBenchmarkColumns(count = 10): SheetColumn[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `col-${index}`,
    sheet_id: "sheet-bench",
    org_id: "org-bench",
    key: `field_${index}`,
    label: `Field ${index + 1}`,
    type: COLUMN_TYPES[index % COLUMN_TYPES.length] ?? "text",
    position: index,
    width: null,
    is_primary: index === 0,
    is_pinned: index < 3,
    config: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }));
}

function makeBenchmarkRow(index: number): Row {
  return {
    id: `row-${index}`,
    sheet_id: "sheet-bench",
    org_id: "org-bench",
    position: index,
    data: {
      field_0: `Company ${index + 1}`,
      field_1: null,
      field_2: "researching",
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  };
}

function makeInitialWindow(totalRows: number, windowSize = ROW_WINDOW_SIZE): Row[] {
  const limit = Math.min(windowSize, totalRows);
  return Array.from({ length: limit }, (_, index) => makeBenchmarkRow(index));
}

function makeSparseValueGetter(store: (Row | null)[]) {
  return (rowIndex: number, colIndex: number) => {
    const row = store[rowIndex];
    if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      return undefined;
    }

    return (row.data as Record<string, Json | undefined>)[`field_${colIndex}`];
  };
}

export async function runClientGridBenchmarks(
  iterations = DEFAULT_ITERATIONS,
): Promise<LatencySample[]> {
  const samples: LatencySample[] = [];
  const columns = makeBenchmarkColumns();

  samples.push(
    await runTimedSamples(
      "Client column layout build",
      "client",
      iterations,
      () => {
        buildColumnLayout(columns);
      },
      "10 columns, 3 pinned",
    ),
  );

  for (const totalRows of SHEET_SIZES) {
    const sizeLabel = `${Math.round(totalRows / 1000)}k`;
    const initialRows = makeInitialWindow(totalRows);

    samples.push(
      await runTimedSamples(
        `Client sparse store create (${sizeLabel} total, 200 loaded)`,
        "client",
        iterations,
        () => {
          createSparseRowStore(totalRows, initialRows);
        },
        "simulates sheet mount with windowed rows",
      ),
    );

    samples.push(
      await runTimedSamples(
        `Client scroll window merge (${sizeLabel} total)`,
        "client",
        iterations,
        () => {
          const store = createSparseRowStore(totalRows, initialRows);
          const range = computeLoadRange(2_500, 2_520, totalRows);
          if (!range) {
            return;
          }

          const fetched = Array.from({ length: range.limit }, (_, index) =>
            makeBenchmarkRow(range.offset + index),
          );
          mergeRowsIntoStore(store, fetched, range.offset);
        },
        "simulates on-scroll row window merge",
      ),
    );
  }

  const largeStore = createSparseRowStore(50_000, makeInitialWindow(50_000));
  const getCellValue = makeSparseValueGetter(largeStore);

  samples.push(
    await runTimedSamples(
      "Client copy selection serialize (100×8 @ 50k store)",
      "client",
      iterations,
      () => {
        serializeRangeToTsv(getCellValue, 1_000, 1_099, 0, 7);
      },
      "clipboard copy of a large rectangular selection",
    ),
  );

  samples.push(
    await runTimedSamples(
      "Client paste update build (50×10 matrix @ 50k store)",
      "client",
      iterations,
      () => {
        const matrix = Array.from({ length: 50 }, (_, row) =>
          Array.from({ length: 10 }, (_, col) => `R${row}C${col}`),
        );

        buildPasteCellUpdates({
          matrix,
          startRow: 5_000,
          startCol: 0,
          columnCount: columns.length,
        });
      },
      "builds cell update list before batch commit",
    ),
  );

  samples.push(
    await runTimedSamples(
      "Client virtual range compute (50k rows)",
      "client",
      iterations,
      () => {
        computeLoadRange(24_800, 24_820, 50_000);
        computeLoadRange(49_700, 49_720, 50_000);
      },
      "two scroll positions near middle and end",
    ),
  );

  return samples;
}
