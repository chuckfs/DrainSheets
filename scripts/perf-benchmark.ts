/**
 * G1 performance benchmarks (local Supabase + in-process client grid).
 *
 * Run: npm run db:perf
 * Optional: npm run db:seed-dev first for a baseline sheet.
 *
 * Env:
 * - PERF_ITERATIONS (default 11)
 * - PERF_BASE_URL + PERF_SHEET_PATH + PERF_COOKIE for optional HTTP e2e
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { runClientGridBenchmarks } from "./benchmarks/client-grid";
import { runConcurrencyBenchmarks } from "./benchmarks/concurrency";
import { createPool, findBenchmarkSheet, findBenchmarkUser } from "./benchmarks/db";
import { runHttpBenchmarks } from "./benchmarks/http-e2e";
import { buildReport, printReportSummary, reportToJson, reportToMarkdown } from "./benchmarks/report";
import { runServerLoadBenchmarks } from "./benchmarks/server-load";
import { DEFAULT_ITERATIONS } from "./benchmarks/types";

config({ path: ".env.local" });

async function main() {
  const iterations = DEFAULT_ITERATIONS;
  const pool = await createPool();
  const client = await pool.connect();

  try {
    const userId = await findBenchmarkUser(client);
    if (!userId) {
      console.warn("No profiles found. Run npm run db:seed-dev first.");
      process.exit(1);
    }

    const sheet = await findBenchmarkSheet(client);
    if (!sheet) {
      console.warn("No sheet rows found. Run npm run db:seed-dev first.");
      process.exit(1);
    }

    console.log(`Running benchmarks (${iterations} iterations each)...`);
    console.log(`Sheet: ${sheet.sheetId}`);

    const context = { ...sheet, userId };

    const serverSamples = await runServerLoadBenchmarks(pool, client, context, iterations);
    const concurrencySamples = await runConcurrencyBenchmarks(pool, client, context, iterations);
    const [clientSamples, httpSamples] = await Promise.all([
      runClientGridBenchmarks(iterations),
      runHttpBenchmarks(iterations),
    ]);

    const report = buildReport(
      [...serverSamples, ...concurrencySamples, ...clientSamples, ...httpSamples],
      iterations,
    );

    const reportDir = join(process.cwd(), "reports");
    mkdirSync(reportDir, { recursive: true });

    const markdownPath = join(reportDir, "perf-benchmark.md");
    const jsonPath = join(reportDir, "perf-benchmark.json");

    writeFileSync(markdownPath, reportToMarkdown(report), "utf8");
    writeFileSync(jsonPath, reportToJson(report), "utf8");

    printReportSummary(report);
    console.log(`Report written to ${markdownPath}`);
    console.log(`JSON written to ${jsonPath}\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
