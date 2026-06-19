import { runTimedSamples, skippedSample } from "./stats";
import type { LatencySample } from "./types";
import { DEFAULT_ITERATIONS } from "./types";

export async function runHttpBenchmarks(
  iterations = DEFAULT_ITERATIONS,
): Promise<LatencySample[]> {
  const baseUrl = process.env.PERF_BASE_URL;
  const sheetPath = process.env.PERF_SHEET_PATH;

  if (!baseUrl || !sheetPath) {
    return [
      skippedSample(
        "HTTP sheet page load",
        "http",
        "Set PERF_BASE_URL and PERF_SHEET_PATH to run (requires authenticated session via PERF_COOKIE)",
      ),
    ];
  }

  const url = new URL(sheetPath, baseUrl).toString();
  const cookie = process.env.PERF_COOKIE;

  return [
    await runTimedSamples(
      "HTTP sheet page load",
      "http",
      iterations,
      async () => {
        const response = await fetch(url, {
          headers: cookie ? { Cookie: cookie } : undefined,
          redirect: "manual",
        });

        if (!response.ok && response.status !== 307 && response.status !== 308) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }

        await response.text();
      },
      cookie ? url : `${url} (no PERF_COOKIE — likely redirected to login)`,
    ),
  ];
}
