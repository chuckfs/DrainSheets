/**
 * G1 performance benchmarks (local Supabase).
 * Run: npm run db:perf
 * Optional: npm run db:seed-dev first for a baseline sheet.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const THRESHOLDS_MS = {
  sheetLoad100: 200,
  sheetLoad1000: 500,
  sheetLoad5000: 1500,
  search: 300,
  importBatch: 400,
};

type BenchmarkResult = {
  label: string;
  ms: number;
  threshold: number;
  ok: boolean;
  detail?: string;
};

async function timed<T>(label: string, fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - start);
  return { ms, result };
}

async function asUser<T>(
  client: pg.PoolClient,
  userId: string,
  fn: (c: pg.PoolClient) => Promise<T>,
): Promise<T> {
  await client.query("BEGIN");
  await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
  await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
  await client.query("SET LOCAL ROLE authenticated");
  try {
    return await fn(client);
  } finally {
    await client.query("ROLLBACK");
  }
}

async function findBenchmarkUser(client: pg.PoolClient): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1`,
  );
  return rows[0]?.id ?? null;
}

async function findBenchmarkSheet(client: pg.PoolClient): Promise<{ sheetId: string; orgId: string } | null> {
  const { rows } = await client.query<{ sheet_id: string; org_id: string; row_count: string }>(
    `
    SELECT r.sheet_id, r.org_id, count(*)::text AS row_count
    FROM public.rows r
    GROUP BY r.sheet_id, r.org_id
    ORDER BY count(*) DESC
    LIMIT 1
    `,
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return { sheetId: row.sheet_id, orgId: row.org_id };
}

async function ensureLargeSheet(
  pool: pg.Pool,
  sheetId: string,
  orgId: string,
  targetRows: number,
  userId: string,
): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM public.rows WHERE sheet_id = $1`,
    [sheetId],
  );
  const existing = Number(countResult.rows[0]?.count ?? 0);
  if (existing >= targetRows) {
    return;
  }

  const toInsert = targetRows - existing;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let offset = 0; offset < toInsert; offset += 200) {
      const batchSize = Math.min(200, toInsert - offset);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let index = 0; index < batchSize; index += 1) {
        const position = existing + offset + index;
        const base = values.length;
        values.push(
          sheetId,
          orgId,
          position,
          JSON.stringify({ company: `Bench Row ${position + 1}` }),
          userId,
        );
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::jsonb, $${base + 5})`,
        );
      }

      await client.query(
        `
        INSERT INTO public.rows (sheet_id, org_id, position, data, created_by)
        VALUES ${placeholders.join(", ")}
        `,
        values,
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function toMarkdown(results: BenchmarkResult[]): string {
  const lines = [
    "# DrainSheets Performance Benchmark",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Benchmark | Duration | Threshold | Status | Detail |",
    "| --- | ---: | ---: | --- | --- |",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.label} | ${result.ms}ms | ${result.threshold}ms | ${result.ok ? "PASS" : "SLOW"} | ${result.detail ?? "—"} |`,
    );
  }

  const passed = results.filter((result) => result.ok).length;
  lines.push("", `**Summary:** ${passed}/${results.length} within thresholds.`);

  return lines.join("\n");
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  const results: BenchmarkResult[] = [];

  const userId = await findBenchmarkUser(client);
  if (!userId) {
    console.warn("No profiles found. Run npm run db:seed-dev first.");
    await pool.end();
    process.exit(1);
  }

  const sheet = await findBenchmarkSheet(client);
  if (!sheet) {
    console.warn("No sheet rows found. Run npm run db:seed-dev first.");
    await pool.end();
    process.exit(1);
  }

  await ensureLargeSheet(pool, sheet.sheetId, sheet.orgId, 5000, userId);

  async function loadRows(limit: number) {
    return asUser(client, userId, async (c) => {
      const { rows } = await c.query(
        `
        SELECT id, sheet_id, org_id, position, data
        FROM public.rows
        WHERE sheet_id = $1
        ORDER BY position ASC
        LIMIT $2
        `,
        [sheet!.sheetId, limit],
      );
      return rows.length;
    });
  }

  const load100 = await timed("sheet load 100 rows", () => loadRows(100));
  results.push({
    label: "Sheet load (100 rows)",
    ms: load100.ms,
    threshold: THRESHOLDS_MS.sheetLoad100,
    ok: load100.ms <= THRESHOLDS_MS.sheetLoad100,
    detail: `${load100.result} rows`,
  });

  const load1000 = await timed("sheet load 1000 rows", () => loadRows(1000));
  results.push({
    label: "Sheet load (1000 rows)",
    ms: load1000.ms,
    threshold: THRESHOLDS_MS.sheetLoad1000,
    ok: load1000.ms <= THRESHOLDS_MS.sheetLoad1000,
    detail: `${load1000.result} rows`,
  });

  const load5000 = await timed("sheet load 5000 rows", () => loadRows(5000));
  results.push({
    label: "Sheet load (5000 rows)",
    ms: load5000.ms,
    threshold: THRESHOLDS_MS.sheetLoad5000,
    ok: load5000.ms <= THRESHOLDS_MS.sheetLoad5000,
    detail: `${load5000.result} rows`,
  });

  const search = await timed("search latency", async () =>
    asUser(client, userId, async (c) => {
      const { rows } = await c.query(`SELECT * FROM public.search_global($1, 25)`, ["acme"]);
      return rows.length;
    }),
  );
  results.push({
    label: "Search latency",
    ms: search.ms,
    threshold: THRESHOLDS_MS.search,
    ok: search.ms <= THRESHOLDS_MS.search,
    detail: `${search.result} hits`,
  });

  const importBatch = await timed("import batch insert (200 rows)", async () => {
    await client.query("BEGIN");
    try {
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let index = 0; index < 200; index += 1) {
        const base = values.length;
        values.push(
          sheet.sheetId,
          sheet.orgId,
          900_000 + index,
          JSON.stringify({ company: `Import Bench ${index + 1}` }),
          userId,
        );
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::jsonb, $${base + 5})`,
        );
      }

      await client.query(
        `
        INSERT INTO public.rows (sheet_id, org_id, position, data, created_by)
        VALUES ${placeholders.join(", ")}
        `,
        values,
      );
    } finally {
      await client.query("ROLLBACK");
    }
  });

  results.push({
    label: "Import batch (200 rows)",
    ms: importBatch.ms,
    threshold: THRESHOLDS_MS.importBatch,
    ok: importBatch.ms <= THRESHOLDS_MS.importBatch,
    detail: "rolled back",
  });

  client.release();
  await pool.end();

  const markdown = toMarkdown(results);
  const reportDir = join(process.cwd(), "reports");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, "perf-benchmark.md");
  writeFileSync(reportPath, markdown, "utf8");

  console.log("\nPerformance benchmark (G1 schema)\n");
  for (const result of results) {
    console.log(
      `  [${result.ok ? "PASS" : "SLOW"}] ${result.label}: ${result.ms}ms (threshold ${result.threshold}ms)`,
    );
  }
  console.log(`\nReport written to ${reportPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
