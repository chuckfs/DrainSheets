import { describe, expect, it } from "vitest";
import { percentile, summarizeSample } from "../../scripts/benchmarks/stats";

describe("benchmark stats", () => {
  it("computes interpolated percentiles", () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(sorted, 50)).toBe(55);
    expect(percentile(sorted, 95)).toBe(95.5);
  });

  it("summarizes latency samples", () => {
    const summary = summarizeSample({
      label: "example",
      category: "client",
      samplesMs: [10, 20, 30, 40, 50],
      detail: "test",
    });

    expect(summary.skipped).toBeUndefined();
    expect(summary.iterations).toBe(5);
    expect(summary.minMs).toBe(10);
    expect(summary.maxMs).toBe(50);
    expect(summary.p50Ms).toBe(30);
    expect(summary.meanMs).toBe(30);
  });

  it("marks skipped samples", () => {
    const summary = summarizeSample({
      label: "skipped example",
      category: "server",
      samplesMs: [],
      skipped: true,
      skipReason: "too large",
    });

    expect(summary.skipped).toBe(true);
    expect(summary.skipReason).toBe("too large");
    expect(summary.p95Ms).toBe(0);
  });
});
