import pg from "pg";
import type { BenchmarkContext } from "./types";

export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export async function createPool(): Promise<pg.Pool> {
  return new pg.Pool({ connectionString: DATABASE_URL });
}

export async function asUser<T>(
  client: pg.PoolClient,
  userId: string,
  fn: (scopedClient: pg.PoolClient) => Promise<T>,
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

export async function findBenchmarkUser(client: pg.PoolClient): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1`,
  );
  return rows[0]?.id ?? null;
}

export async function findBenchmarkSheet(
  client: pg.PoolClient,
): Promise<{ sheetId: string; orgId: string } | null> {
  const { rows } = await client.query<{ sheet_id: string; org_id: string }>(
    `
    SELECT r.sheet_id, r.org_id
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

export async function countSheetRows(pool: pg.Pool, sheetId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM public.rows WHERE sheet_id = $1`,
    [sheetId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function ensureLargeSheet(
  pool: pg.Pool,
  context: BenchmarkContext,
  targetRows: number,
): Promise<number> {
  const existing = await countSheetRows(pool, context.sheetId);
  if (existing >= targetRows) {
    return existing;
  }

  const toInsert = targetRows - existing;
  if (toInsert > 0) {
    console.log(`  Seeding ${toInsert.toLocaleString()} rows (target ${targetRows.toLocaleString()})...`);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let offset = 0; offset < toInsert; offset += 500) {
      const batchSize = Math.min(500, toInsert - offset);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let index = 0; index < batchSize; index += 1) {
        const position = existing + offset + index;
        const base = values.length;
        values.push(
          context.sheetId,
          context.orgId,
          position,
          JSON.stringify({ company: `Bench Row ${position + 1}` }),
          context.userId,
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

  return targetRows;
}

export async function loadColumns(client: pg.PoolClient, sheetId: string): Promise<number> {
  const { rows } = await client.query(
    `
    SELECT id
    FROM public.sheet_columns
    WHERE sheet_id = $1
    ORDER BY position ASC
    `,
    [sheetId],
  );
  return rows.length;
}

export async function countRowsRls(client: pg.PoolClient, sheetId: string): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `
    SELECT count(*)::text AS count
    FROM public.rows
    WHERE sheet_id = $1
    `,
    [sheetId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function loadRowsWindowRls(
  client: pg.PoolClient,
  sheetId: string,
  offset: number,
  limit: number,
): Promise<number> {
  const { rows } = await client.query(
    `
    SELECT id, sheet_id, org_id, position, data, created_at, updated_at, created_by, search_vector
    FROM public.rows
    WHERE sheet_id = $1
    ORDER BY position ASC
    OFFSET $2
    LIMIT $3
    `,
    [sheetId, offset, limit],
  );
  return rows.length;
}

export async function loadAllRowsRls(client: pg.PoolClient, sheetId: string): Promise<number> {
  const { rows } = await client.query(
    `
    SELECT id, sheet_id, org_id, position, data, created_at, updated_at, created_by, search_vector
    FROM public.rows
    WHERE sheet_id = $1
    ORDER BY position ASC
    `,
    [sheetId],
  );
  return rows.length;
}

export async function withUserConnection<T>(
  pool: pg.Pool,
  userId: string,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const scopedClient = await pool.connect();
  try {
    return await asUser(scopedClient, userId, fn);
  } finally {
    scopedClient.release();
  }
}

export async function simulateWindowedSheetOpenPooled(
  pool: pg.Pool,
  userId: string,
  sheetId: string,
  windowSize: number,
): Promise<{ rowCount: number; columnCount: number; windowRows: number }> {
  const [rowCount, columnCount, windowRows] = await Promise.all([
    withUserConnection(pool, userId, (scopedClient) => countRowsRls(scopedClient, sheetId)),
    withUserConnection(pool, userId, (scopedClient) => loadColumns(scopedClient, sheetId)),
    withUserConnection(pool, userId, (scopedClient) =>
      loadRowsWindowRls(scopedClient, sheetId, 0, windowSize),
    ),
  ]);

  return { rowCount, columnCount, windowRows };
}

export async function loadRowsWindowRlsPooled(
  pool: pg.Pool,
  userId: string,
  sheetId: string,
  offset: number,
  limit: number,
): Promise<number> {
  return withUserConnection(pool, userId, (scopedClient) =>
    loadRowsWindowRls(scopedClient, sheetId, offset, limit),
  );
}

export async function simulateWindowedSheetOpen(
  client: pg.PoolClient,
  userId: string,
  sheetId: string,
  windowSize: number,
): Promise<{ rowCount: number; columnCount: number; windowRows: number }> {
  return asUser(client, userId, async (scopedClient) => {
    const rowCount = await countRowsRls(scopedClient, sheetId);
    const columnCount = await loadColumns(scopedClient, sheetId);
    const windowRows = await loadRowsWindowRls(scopedClient, sheetId, 0, windowSize);

    return { rowCount, columnCount, windowRows };
  });
}

export async function simulateLegacySheetOpen(
  client: pg.PoolClient,
  userId: string,
  sheetId: string,
): Promise<{ rowCount: number; columnCount: number; loadedRows: number }> {
  return asUser(client, userId, async (scopedClient) => {
    const rowCount = await countRowsRls(scopedClient, sheetId);
    const columnCount = await loadColumns(scopedClient, sheetId);
    const loadedRows = await loadAllRowsRls(scopedClient, sheetId);

    return { rowCount, columnCount, loadedRows };
  });
}

export async function simulateMidSheetWindowFetch(
  client: pg.PoolClient,
  userId: string,
  sheetId: string,
  totalRows: number,
  windowSize: number,
): Promise<number> {
  const offset = Math.max(0, Math.floor(totalRows * 0.25) - Math.floor(windowSize / 2));

  return asUser(client, userId, async (scopedClient) => {
    return loadRowsWindowRls(scopedClient, sheetId, offset, windowSize);
  });
}
