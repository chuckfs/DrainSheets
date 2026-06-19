import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runClientGridBenchmarks } from "./client-grid";
import { buildReport, printReportSummary, reportToJson, reportToMarkdown } from "./report";
import { DEFAULT_ITERATIONS } from "./types";

async function main() {
  const iterations = DEFAULT_ITERATIONS;
  console.log(`Running client grid benchmarks (${iterations} iterations each)...`);

  const samples = await runClientGridBenchmarks(iterations);
  const report = buildReport(samples, iterations);

  const reportDir = join(process.cwd(), "reports");
  mkdirSync(reportDir, { recursive: true });

  const markdownPath = join(reportDir, "perf-client-benchmark.md");
  const jsonPath = join(reportDir, "perf-client-benchmark.json");

  writeFileSync(markdownPath, reportToMarkdown(report), "utf8");
  writeFileSync(jsonPath, reportToJson(report), "utf8");

  printReportSummary(report);
  console.log(`Report written to ${markdownPath}`);
  console.log(`JSON written to ${jsonPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
