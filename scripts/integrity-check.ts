/**
 * Data integrity validation for Milestone 8.
 * Run: npm run db:integrity
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

type CheckResult = {
  name: string;
  count: number;
  ok: boolean;
};

const CHECKS: { name: string; sql: string }[] = [
  {
    name: "Orphaned prospects (missing property)",
    sql: `
      SELECT count(*)::int FROM public.prospects p
      WHERE NOT EXISTS (SELECT 1 FROM public.properties pr WHERE pr.id = p.property_id)
    `,
  },
  {
    name: "Orphaned contacts (missing prospect)",
    sql: `
      SELECT count(*)::int FROM public.contacts c
      WHERE NOT EXISTS (SELECT 1 FROM public.prospects p WHERE p.id = c.prospect_id)
    `,
  },
  {
    name: "Contacts with org_id mismatch",
    sql: `
      SELECT count(*)::int FROM public.contacts c
      JOIN public.prospects ps ON ps.id = c.prospect_id
      JOIN public.properties pr ON pr.id = ps.property_id
      WHERE c.org_id IS DISTINCT FROM pr.org_id
    `,
  },
  {
    name: "Documents with org_id mismatch",
    sql: `
      SELECT count(*)::int FROM public.documents d
      JOIN public.properties pr ON pr.id = d.property_id
      WHERE d.org_id IS DISTINCT FROM pr.org_id
    `,
  },
  {
    name: "Notes with org_id mismatch",
    sql: `
      SELECT count(*)::int FROM public.notes n
      JOIN public.properties pr ON pr.id = n.property_id
      WHERE n.org_id IS DISTINCT FROM pr.org_id
    `,
  },
  {
    name: "Documents with invalid prospect/property link",
    sql: `
      SELECT count(*)::int FROM public.documents d
      WHERE d.prospect_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.prospects p
          WHERE p.id = d.prospect_id AND p.property_id = d.property_id
        )
    `,
  },
  {
    name: "Notes with invalid prospect/property link",
    sql: `
      SELECT count(*)::int FROM public.notes n
      WHERE n.prospect_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.prospects p
          WHERE p.id = n.prospect_id AND p.property_id = n.property_id
        )
    `,
  },
  {
    name: "Property assignments referencing missing property",
    sql: `
      SELECT count(*)::int FROM public.property_assignments pa
      WHERE NOT EXISTS (SELECT 1 FROM public.properties pr WHERE pr.id = pa.property_id)
    `,
  },
  {
    name: "Property assignments referencing missing user",
    sql: `
      SELECT count(*)::int FROM public.property_assignments pa
      WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pa.user_id)
    `,
  },
  {
    name: "Archived properties with active child prospects (informational)",
    sql: `
      SELECT count(*)::int FROM public.prospects ps
      JOIN public.properties pr ON pr.id = ps.property_id
      WHERE pr.status = 'archived'
        AND ps.status IN ('researching', 'contacted', 'interested')
    `,
  },
];

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const results: CheckResult[] = [];

  for (const check of CHECKS) {
    const { rows } = await pool.query<{ count: number }>(check.sql);
    const count = rows[0]?.count ?? 0;
    const isInformational = check.name.includes("informational");
    results.push({
      name: check.name,
      count,
      ok: isInformational ? true : count === 0,
    });
  }

  await pool.end();

  console.log("\nData integrity report\n");
  let failed = 0;
  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    if (!result.ok) failed++;
    console.log(`  [${status}] ${result.name}: ${result.count}`);
  }

  console.log(`\n${results.length - failed}/${results.length} checks passed.\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
