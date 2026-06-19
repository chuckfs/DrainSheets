import type pg from "pg";
import {
  ensureLargeSheet,
  loadRowsWindowRlsPooled,
  simulateWindowedSheetOpenPooled,
} from "./db";
import { runTimedSamples } from "./stats";
import type { BenchmarkContext, LatencySample } from "./types";
import { DEFAULT_ITERATIONS, WINDOW_SIZE } from "./types";

const CONCURRENCY_LEVELS = [5, 10] as const;
const CONCURRENCY_SHEET_ROWS = 50_000;

function windowOffsets(totalRows: number, concurrency: number, windowSize: number): number[] {
  const maxOffset = Math.max(0, totalRows - windowSize);
  const step = Math.max(1, Math.floor(maxOffset / Math.max(concurrency - 1, 1)));

  return Array.from({ length: concurrency }, (_, index) => Math.min(index * step, maxOffset));
}

export async function runConcurrencyBenchmarks(
  pool: pg.Pool,
  _client: pg.PoolClient,
  context: BenchmarkContext,
  iterations = DEFAULT_ITERATIONS,
): Promise<LatencySample[]> {
  const samples: LatencySample[] = [];
  const totalRows = await ensureLargeSheet(pool, context, CONCURRENCY_SHEET_ROWS);
  console.log(`Concurrency benchmarks @ ${totalRows.toLocaleString()} rows...`);

  for (const concurrency of CONCURRENCY_LEVELS) {
    const offsets = windowOffsets(totalRows, concurrency, WINDOW_SIZE);

    samples.push(
      await runTimedSamples(
        `Concurrent window fetches (${concurrency}× @ 50k rows)`,
        "concurrency",
        iterations,
        async () => {
          await Promise.all(
            offsets.map((offset) =>
              loadRowsWindowRlsPooled(
                pool,
                context.userId,
                context.sheetId,
                offset,
                WINDOW_SIZE,
              ),
            ),
          );
        },
        `parallel offsets: ${offsets.join(", ")}`,
      ),
    );

    samples.push(
      await runTimedSamples(
        `Concurrent sheet opens (${concurrency}× windowed @ 50k rows)`,
        "concurrency",
        iterations,
        async () => {
          await Promise.all(
            Array.from({ length: concurrency }, () =>
              simulateWindowedSheetOpenPooled(
                pool,
                context.userId,
                context.sheetId,
                WINDOW_SIZE,
              ),
            ),
          );
        },
        `parallel count + columns + first ${WINDOW_SIZE} rows`,
      ),
    );
  }

  return samples;
}
