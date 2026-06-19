import type { LatencySample, LatencySummary } from "./types";

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  if (sorted.length === 1) {
    return sorted[0]!;
  }

  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;

  if (lower === upper) {
    return sorted[lower]!;
  }

  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function roundMs(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizeSample(sample: LatencySample): LatencySummary {
  if (sample.skipped) {
    return {
      label: sample.label,
      category: sample.category,
      iterations: 0,
      minMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      maxMs: 0,
      meanMs: 0,
      detail: sample.detail,
      skipped: true,
      skipReason: sample.skipReason,
    };
  }

  const sorted = [...sample.samplesMs].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);

  return {
    label: sample.label,
    category: sample.category,
    iterations: sorted.length,
    minMs: roundMs(sorted[0] ?? 0),
    p50Ms: roundMs(percentile(sorted, 50)),
    p95Ms: roundMs(percentile(sorted, 95)),
    maxMs: roundMs(sorted.at(-1) ?? 0),
    meanMs: roundMs(sum / sorted.length),
    detail: sample.detail,
  };
}

export async function runTimedSamples(
  label: string,
  category: LatencySample["category"],
  iterations: number,
  fn: () => Promise<void> | void,
  detail?: string,
): Promise<LatencySample> {
  const samplesMs: number[] = [];

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    await fn();
    samplesMs.push(Math.round((performance.now() - start) * 100) / 100);
  }

  return { label, category, samplesMs, detail };
}

export function skippedSample(
  label: string,
  category: LatencySample["category"],
  reason: string,
  detail?: string,
): LatencySample {
  return {
    label,
    category,
    samplesMs: [],
    detail,
    skipped: true,
    skipReason: reason,
  };
}
