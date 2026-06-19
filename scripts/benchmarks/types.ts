export type LatencySample = {
  label: string;
  category: "server" | "concurrency" | "client" | "http";
  samplesMs: number[];
  detail?: string;
  skipped?: boolean;
  skipReason?: string;
};

export type LatencySummary = {
  label: string;
  category: LatencySample["category"];
  iterations: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  meanMs: number;
  detail?: string;
  skipped?: boolean;
  skipReason?: string;
};

export type BenchmarkContext = {
  sheetId: string;
  orgId: string;
  userId: string;
};

export const SHEET_SIZES = parseSheetSizes(process.env.PERF_SHEET_SIZES);

function parseSheetSizes(raw: string | undefined): readonly number[] {
  if (!raw) {
    return [1_000, 5_000, 20_000, 50_000];
  }

  return raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export const DEFAULT_ITERATIONS = Number(process.env.PERF_ITERATIONS ?? 11);

export const WINDOW_SIZE = 200;
