import type pg from "pg";
import {
  ensureLargeSheet,
  simulateLegacySheetOpen,
  simulateMidSheetWindowFetch,
  simulateWindowedSheetOpen,
} from "./db";
import { runTimedSamples, skippedSample } from "./stats";
import type { BenchmarkContext, LatencySample } from "./types";
import { DEFAULT_ITERATIONS, SHEET_SIZES, WINDOW_SIZE } from "./types";

const LEGACY_LOAD_ALL_MAX_ROWS = 5_000;

export async function runServerLoadBenchmarks(
  pool: pg.Pool,
  client: pg.PoolClient,
  context: BenchmarkContext,
  iterations = DEFAULT_ITERATIONS,
): Promise<LatencySample[]> {
  const samples: LatencySample[] = [];

  for (const targetRows of SHEET_SIZES) {
    console.log(`Server benchmarks @ ${targetRows.toLocaleString()} rows...`);
    const actualRows = await ensureLargeSheet(pool, context, targetRows);
    const sizeLabel = `${Math.round(actualRows / 1000)}k`;

    samples.push(
      await runTimedSamples(
        `Server sheet open — windowed (${sizeLabel} rows)`,
        "server",
        iterations,
        async () => {
          await simulateWindowedSheetOpen(client, context.userId, context.sheetId, WINDOW_SIZE);
        },
        `count + columns + first ${WINDOW_SIZE} rows under RLS`,
      ),
    );

    samples.push(
      await runTimedSamples(
        `Server mid-sheet window fetch (${sizeLabel} rows)`,
        "server",
        iterations,
        async () => {
          await simulateMidSheetWindowFetch(
            client,
            context.userId,
            context.sheetId,
            actualRows,
            WINDOW_SIZE,
          );
        },
        `single ${WINDOW_SIZE}-row window near 25% depth`,
      ),
    );

    if (actualRows <= LEGACY_LOAD_ALL_MAX_ROWS) {
      samples.push(
        await runTimedSamples(
          `Server sheet open — legacy load-all (${sizeLabel} rows)`,
          "server",
          iterations,
          async () => {
            await simulateLegacySheetOpen(client, context.userId, context.sheetId);
          },
          "count + columns + all rows under RLS (pre-window path)",
        ),
      );
    } else {
      samples.push(
        skippedSample(
          `Server sheet open — legacy load-all (${sizeLabel} rows)`,
          "server",
          `Skipped above ${LEGACY_LOAD_ALL_MAX_ROWS.toLocaleString()} rows to avoid misleading OOM/timeouts`,
          "legacy path loads entire sheet into memory",
        ),
      );
    }
  }

  return samples;
}
