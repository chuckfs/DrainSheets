import { summarizeSample } from "./stats";
import type { LatencySample, LatencySummary } from "./types";

export type BenchmarkReport = {
  generatedAt: string;
  iterations: number;
  summaries: LatencySummary[];
};

function formatMs(value: number): string {
  return `${value.toFixed(value < 10 ? 2 : 0)}ms`;
}

function categoryHeading(category: LatencySummary["category"]): string {
  switch (category) {
    case "server":
      return "Server data path (RLS, matches sheet page queries)";
    case "concurrency":
      return "Concurrency (parallel reads under RLS)";
    case "client":
      return "Client grid render prep (in-process, no browser)";
    case "http":
      return "HTTP end-to-end (optional)";
    default:
      return category;
  }
}

export function buildReport(samples: LatencySample[], iterations: number): BenchmarkReport {
  return {
    generatedAt: new Date().toISOString(),
    iterations,
    summaries: samples.map((sample) => summarizeSample(sample)),
  };
}

export function reportToMarkdown(report: BenchmarkReport): string {
  const lines = [
    "# DrainSheets Performance Benchmark",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Measures **p50/p95 latency** over repeated samples. Server benchmarks run the same queries the sheet page uses (count + columns + row window) under RLS. Client benchmarks measure grid prep work in-process; they do not include browser paint/layout.",
    "",
    `Iterations per benchmark: ${report.iterations}`,
    "",
  ];

  const categories: LatencySummary["category"][] = ["server", "concurrency", "client", "http"];

  for (const category of categories) {
    const rows = report.summaries.filter((summary) => summary.category === category);
    if (rows.length === 0) {
      continue;
    }

    lines.push(`## ${categoryHeading(category)}`, "");
    lines.push("| Benchmark | p50 | p95 | min | max | mean | Detail |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | --- |");

    for (const summary of rows) {
      if (summary.skipped) {
        lines.push(
          `| ${summary.label} | — | — | — | — | — | ${summary.skipReason ?? "skipped"} |`,
        );
        continue;
      }

      lines.push(
        `| ${summary.label} | ${formatMs(summary.p50Ms)} | ${formatMs(summary.p95Ms)} | ${formatMs(summary.minMs)} | ${formatMs(summary.maxMs)} | ${formatMs(summary.meanMs)} | ${summary.detail ?? "—"} |`,
      );
    }

    lines.push("");
  }

  lines.push("## Notes", "");
  lines.push("- **Windowed sheet open** reflects the current architecture after item 3 (count + first 200 rows).");
  lines.push("- **Legacy load-all** is kept for comparison and is skipped above 5k rows.");
  lines.push("- For HTTP timings, run with `PERF_BASE_URL` and an authenticated session cookie in `PERF_COOKIE`.");
  lines.push("- Re-run after schema or grid changes to track regressions honestly.");

  return lines.join("\n");
}

export function reportToJson(report: BenchmarkReport): string {
  return JSON.stringify(report, null, 2);
}

export function printReportSummary(report: BenchmarkReport): void {
  console.log("\nDrainSheets performance benchmark\n");

  for (const summary of report.summaries) {
    if (summary.skipped) {
      console.log(`  [SKIP] ${summary.label}: ${summary.skipReason}`);
      continue;
    }

    console.log(
      `  ${summary.label}: p50 ${formatMs(summary.p50Ms)} · p95 ${formatMs(summary.p95Ms)} · mean ${formatMs(summary.meanMs)}`,
    );
  }

  console.log("");
}
