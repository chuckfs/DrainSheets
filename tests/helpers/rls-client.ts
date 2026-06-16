import pg from "pg";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function createPool(): pg.Pool {
  return new pg.Pool({ connectionString: getDatabaseUrl() });
}

export async function isDatabaseAvailable(pool: pg.Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/** Run queries as an authenticated Supabase user (RLS enforced). */
export async function asUser<T>(
  pool: pg.Pool,
  userId: string,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
    await client.query("SET LOCAL ROLE authenticated");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function countRows(
  client: pg.PoolClient,
  table: string,
  where = "",
  params: unknown[] = [],
): Promise<number> {
  const sql = where
    ? `SELECT count(*)::int AS count FROM public.${table} WHERE ${where}`
    : `SELECT count(*)::int AS count FROM public.${table}`;
  const { rows } = await client.query<{ count: number }>(sql, params);
  return rows[0]?.count ?? 0;
}
