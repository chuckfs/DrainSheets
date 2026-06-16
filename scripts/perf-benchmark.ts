/**
 * Performance benchmarks against beta seed dataset.
 * Run: npm run db:perf (after npm run db:seed-beta)
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const BETA_ORG_ID = "22222222-2222-2222-2222-222222222201";
const OWNER_ID = "33333333-3333-3333-3333-333333333301";
const EDITOR_ID = "33333333-3333-3333-3333-333333333304";

const THRESHOLDS_MS = {
  dashboard: 500,
  search: 300,
  list: 300,
  detail: 200,
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

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  const orgCheck = await pool.query(
    `SELECT count(*)::int AS count FROM public.properties WHERE org_id = $1`,
    [BETA_ORG_ID],
  );
  const propertyCount = orgCheck.rows[0]?.count ?? 0;
  if (propertyCount < 20) {
    console.warn("Beta dataset not found. Run: npm run db:seed-beta");
    await pool.end();
    process.exit(1);
  }

  const results: { label: string; ms: number; threshold: number; ok: boolean }[] = [];

  const dashboard = await timed("Dashboard stats (owner)", async () => {
    return asUser(client, OWNER_ID, async (c) => {
      const [properties, prospects, contacts, documents, notes] = await Promise.all([
        c.query(`SELECT count(*) FROM public.properties WHERE org_id = $1 AND status = 'active'`, [
          BETA_ORG_ID,
        ]),
        c.query(`SELECT count(*) FROM public.prospects`),
        c.query(`SELECT count(*) FROM public.contacts`),
        c.query(`SELECT count(*) FROM public.documents`),
        c.query(`SELECT count(*) FROM public.notes`),
      ]);
      return {
        properties: properties.rows[0]?.count,
        prospects: prospects.rows[0]?.count,
        contacts: contacts.rows[0]?.count,
        documents: documents.rows[0]?.count,
        notes: notes.rows[0]?.count,
      };
    });
  });
  results.push({
    label: "Dashboard stats",
    ms: dashboard.ms,
    threshold: THRESHOLDS_MS.dashboard,
    ok: dashboard.ms <= THRESHOLDS_MS.dashboard,
  });

  const search = await timed("Global search RPC", async () => {
    return asUser(client, OWNER_ID, async (c) => {
      const { rows } = await c.query(`SELECT * FROM public.search_global($1, 25)`, ["medical"]);
      return rows.length;
    });
  });
  results.push({
    label: "Search (medical)",
    ms: search.ms,
    threshold: THRESHOLDS_MS.search,
    ok: search.ms <= THRESHOLDS_MS.search,
  });

  const propertiesList = await timed("Properties list", async () => {
    return asUser(client, OWNER_ID, async (c) => {
      const { rows } = await c.query(
        `SELECT id, name FROM public.properties WHERE org_id = $1 AND status = 'active' ORDER BY name LIMIT 20`,
        [BETA_ORG_ID],
      );
      return rows.length;
    });
  });
  results.push({
    label: "Properties list",
    ms: propertiesList.ms,
    threshold: THRESHOLDS_MS.list,
    ok: propertiesList.ms <= THRESHOLDS_MS.list,
  });

  const propertyDetail = await timed("Property detail + prospects", async () => {
    const { rows: propRows } = await pool.query(
      `SELECT id FROM public.properties WHERE org_id = $1 LIMIT 1`,
      [BETA_ORG_ID],
    );
    const propertyId = propRows[0]?.id;
    return asUser(client, OWNER_ID, async (c) => {
      await c.query(`SELECT * FROM public.properties WHERE id = $1`, [propertyId]);
      const { rows } = await c.query(
        `SELECT id, company_name FROM public.prospects WHERE property_id = $1 LIMIT 20`,
        [propertyId],
      );
      return rows.length;
    });
  });
  results.push({
    label: "Property detail",
    ms: propertyDetail.ms,
    threshold: THRESHOLDS_MS.detail,
    ok: propertyDetail.ms <= THRESHOLDS_MS.detail,
  });

  const prospectDetail = await timed("Prospect detail + contacts", async () => {
    const { rows: prospectRows } = await pool.query(
      `SELECT id FROM public.prospects WHERE property_id IN (
        SELECT id FROM public.properties WHERE org_id = $1
      ) LIMIT 1`,
      [BETA_ORG_ID],
    );
    const prospectId = prospectRows[0]?.id;
    return asUser(client, OWNER_ID, async (c) => {
      await c.query(`SELECT * FROM public.prospects WHERE id = $1`, [prospectId]);
      const { rows } = await c.query(
        `SELECT id, first_name, last_name FROM public.contacts WHERE prospect_id = $1 LIMIT 20`,
        [prospectId],
      );
      return rows.length;
    });
  });
  results.push({
    label: "Prospect detail",
    ms: prospectDetail.ms,
    threshold: THRESHOLDS_MS.detail,
    ok: prospectDetail.ms <= THRESHOLDS_MS.detail,
  });

  const contactsGlobal = await timed("Global contacts list", async () => {
    return asUser(client, OWNER_ID, async (c) => {
      const { rows } = await c.query(
        `SELECT id, first_name, last_name FROM public.contacts ORDER BY created_at DESC LIMIT 20`,
      );
      return rows.length;
    });
  });
  results.push({
    label: "Global contacts",
    ms: contactsGlobal.ms,
    threshold: THRESHOLDS_MS.list,
    ok: contactsGlobal.ms <= THRESHOLDS_MS.list,
  });

  const documentsGlobal = await timed("Global documents list", async () => {
    return asUser(client, OWNER_ID, async (c) => {
      const { rows } = await c.query(
        `SELECT id, file_name FROM public.documents ORDER BY created_at DESC LIMIT 20`,
      );
      return rows.length;
    });
  });
  results.push({
    label: "Global documents",
    ms: documentsGlobal.ms,
    threshold: THRESHOLDS_MS.list,
    ok: documentsGlobal.ms <= THRESHOLDS_MS.list,
  });

  const editorSearch = await timed("Editor assigned property access", async () => {
    return asUser(client, EDITOR_ID, async (c) => {
      const { rows } = await c.query(`SELECT count(*)::int AS count FROM public.properties`);
      return rows[0]?.count ?? 0;
    });
  });
  results.push({
    label: "Editor property scope",
    ms: editorSearch.ms,
    threshold: THRESHOLDS_MS.list,
    ok: editorSearch.ms <= THRESHOLDS_MS.list,
  });

  client.release();
  await pool.end();

  console.log("\nPerformance benchmark (beta dataset)\n");
  let passed = 0;
  for (const r of results) {
    const status = r.ok ? "PASS" : "SLOW";
    if (r.ok) passed++;
    console.log(`  [${status}] ${r.label}: ${r.ms}ms (threshold ${r.threshold}ms)`);
  }
  console.log(`\n${passed}/${results.length} within thresholds.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
