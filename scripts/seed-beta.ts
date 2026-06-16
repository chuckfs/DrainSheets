/**
 * Beta performance dataset for Milestone 8.
 * Run: npm run db:seed-beta
 * Requires local Supabase and .env.local with service role key.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const BETA_ORG_ID = "22222222-2222-2222-2222-222222222201";
const BETA_ORG_NAME = "Beta CRE Demo";

const PROPERTY_NAMES = [
  "Riverside Retail Center",
  "Highland Park Medical Plaza",
  "Union Square Mixed-Use",
  "Westlake Shopping Village",
  "Downtown Medical Arts Building",
  "Harbor Point Retail Strip",
  "Oakwood Town Center",
  "Summit Healthcare Campus",
  "Market Street Mixed-Use",
  "Lakeside Retail Commons",
  "Central Plaza Medical Suites",
  "Brookfield Shopping Center",
  "Eastside Mixed-Use Development",
  "Northgate Retail Hub",
  "Pinecrest Medical Office Park",
  "Valley View Town Center",
  "Metro Retail Pavilion",
  "Greenway Mixed-Use Block",
  "Crossroads Shopping Center",
  "Heritage Medical Plaza",
];

const PROSPECT_TEMPLATES = [
  { company: "FreshBite Kitchen", category: "Restaurant" },
  { company: "Urban Grind Coffee", category: "Restaurant" },
  { company: "Smash Burger Co.", category: "Restaurant" },
  { company: "Taco Libre", category: "Restaurant" },
  { company: "Noodle House Express", category: "Restaurant" },
  { company: "Subway Franchise Group", category: "Franchise" },
  { company: "Anytime Fitness", category: "Franchise" },
  { company: "Great Clips Regional", category: "Franchise" },
  { company: "Dunkin Development LLC", category: "Franchise" },
  { company: "Pediatric Partners", category: "Medical" },
  { company: "Summit Orthopedics", category: "Medical" },
  { company: "Bright Smile Dental", category: "Medical" },
  { company: "CareFirst Urgent Care", category: "Medical" },
  { company: "Metro Physical Therapy", category: "Medical" },
  { company: "StyleHub Boutique", category: "Retail" },
  { company: "TechZone Mobile", category: "Retail" },
  { company: "Pet Paradise", category: "Retail" },
  { company: "CycleWorks", category: "Retail" },
  { company: "HomeGoods Express", category: "Retail" },
  { company: "Pure Yoga Studio", category: "Fitness" },
];

const CITIES = [
  { city: "Austin", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Houston", state: "TX" },
  { city: "San Antonio", state: "TX" },
  { city: "Denver", state: "CO" },
  { city: "Phoenix", state: "AZ" },
  { city: "Nashville", state: "TN" },
  { city: "Charlotte", state: "NC" },
];

const USERS = [
  { suffix: "01", email: "beta-owner@drainsheets.local", role: "owner", name: "Beta Owner" },
  { suffix: "02", email: "beta-admin1@drainsheets.local", role: "admin", name: "Beta Admin One" },
  { suffix: "03", email: "beta-admin2@drainsheets.local", role: "admin", name: "Beta Admin Two" },
  { suffix: "04", email: "beta-editor1@drainsheets.local", role: "editor", name: "Beta Editor One" },
  { suffix: "05", email: "beta-editor2@drainsheets.local", role: "editor", name: "Beta Editor Two" },
  { suffix: "06", email: "beta-editor3@drainsheets.local", role: "editor", name: "Beta Editor Three" },
  { suffix: "07", email: "beta-editor4@drainsheets.local", role: "editor", name: "Beta Editor Four" },
  { suffix: "08", email: "beta-editor5@drainsheets.local", role: "editor", name: "Beta Editor Five" },
  { suffix: "09", email: "beta-editor6@drainsheets.local", role: "editor", name: "Beta Editor Six" },
  { suffix: "10", email: "beta-editor7@drainsheets.local", role: "editor", name: "Beta Editor Seven" },
];

function userId(suffix: string) {
  return `33333333-3333-3333-3333-3333333333${suffix}`;
}

async function insertAuthUser(client: pg.PoolClient, id: string, email: string) {
  await client.query(
    `
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
      crypt('BetaSeed2026!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now()
    )
    ON CONFLICT (id) DO NOTHING
    `,
    [id, email],
  );
}

async function main() {
  const force = process.argv.includes("--force");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  const existing = await pool.query(
    `SELECT id FROM public.organizations WHERE id = $1`,
    [BETA_ORG_ID],
  );

  if (existing.rowCount && existing.rowCount > 0 && !force) {
    console.log("Beta dataset already exists. Use --force to recreate.");
    await pool.end();
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const client = await pool.connect();
  const ownerId = userId("01");
  const editorIds = USERS.filter((u) => u.role === "editor").map((u) => userId(u.suffix));

  try {
    await client.query("BEGIN");

    if (force) {
      await client.query(`DELETE FROM public.activity WHERE org_id = $1`, [BETA_ORG_ID]);
      await client.query(
        `DELETE FROM public.notes WHERE org_id = $1`,
        [BETA_ORG_ID],
      );
      await client.query(
        `DELETE FROM public.documents WHERE org_id = $1`,
        [BETA_ORG_ID],
      );
      await client.query(
        `DELETE FROM public.contacts WHERE org_id = $1`,
        [BETA_ORG_ID],
      );
      await client.query(
        `DELETE FROM public.prospects WHERE property_id IN (SELECT id FROM public.properties WHERE org_id = $1)`,
        [BETA_ORG_ID],
      );
      await client.query(`DELETE FROM public.property_assignments WHERE property_id IN (
        SELECT id FROM public.properties WHERE org_id = $1
      )`, [BETA_ORG_ID]);
      await client.query(`DELETE FROM public.properties WHERE org_id = $1`, [BETA_ORG_ID]);
      await client.query(`DELETE FROM public.profiles WHERE org_id = $1`, [BETA_ORG_ID]);
      await client.query(`DELETE FROM public.invitations WHERE org_id = $1`, [BETA_ORG_ID]);
      await client.query(
        `DELETE FROM auth.users WHERE email LIKE 'beta-%@drainsheets.local'`,
      );
      await client.query(`DELETE FROM public.organizations WHERE id = $1`, [BETA_ORG_ID]);
    }

    await client.query(
      `INSERT INTO public.organizations (id, name) VALUES ($1, $2)`,
      [BETA_ORG_ID, BETA_ORG_NAME],
    );

    for (const user of USERS) {
      const id = userId(user.suffix);
      await client.query(
        `
        INSERT INTO public.invitations (org_id, email, role, token_hash, expires_at)
        VALUES ($1, $2, $3, $4, now() + interval '30 days')
        `,
        [BETA_ORG_ID, user.email, user.role, `beta-seed-${id}`],
      );
      await insertAuthUser(client, id, user.email);
    }

    const propertyIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const id = randomUUID();
      propertyIds.push(id);
      const loc = CITIES[i % CITIES.length]!;
      await client.query(
        `
        INSERT INTO public.properties (id, org_id, name, city, state, address, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
        `,
        [
          id,
          BETA_ORG_ID,
          PROPERTY_NAMES[i],
          loc.city,
          loc.state,
          `${100 + i * 10} Main Street`,
          ownerId,
        ],
      );
    }

    // Assign editors to ~60% of properties
    for (let i = 0; i < propertyIds.length; i++) {
      const editorId = editorIds[i % editorIds.length]!;
      if (i % 5 !== 0) {
        await client.query(
          `INSERT INTO public.property_assignments (property_id, user_id) VALUES ($1, $2)`,
          [propertyIds[i], editorId],
        );
      }
    }

    const prospectIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const id = randomUUID();
      prospectIds.push(id);
      const propertyId = propertyIds[i % propertyIds.length]!;
      const template = PROSPECT_TEMPLATES[i % PROSPECT_TEMPLATES.length]!;
      await client.query(
        `
        INSERT INTO public.prospects (id, property_id, company_name, category, status)
        VALUES ($1, $2, $3, $4, 'researching')
        `,
        [id, propertyId, `${template.company} #${i + 1}`, template.category],
      );
    }

    const contactIds: string[] = [];
    const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Quinn"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore"];
    for (let i = 0; i < 250; i++) {
      const id = randomUUID();
      contactIds.push(id);
      const prospectId = prospectIds[i % prospectIds.length]!;
      await client.query(
        `
        INSERT INTO public.contacts (id, prospect_id, first_name, last_name, company, email, org_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          prospectId,
          firstNames[i % firstNames.length],
          lastNames[i % lastNames.length],
          "CRE Partners LLC",
          `contact${i + 1}@example.com`,
          BETA_ORG_ID,
          ownerId,
        ],
      );
    }

    for (let i = 0; i < 100; i++) {
      const propertyId = propertyIds[i % propertyIds.length]!;
      const prospectId = i % 3 === 0 ? prospectIds[i % prospectIds.length] : null;
      const docId = randomUUID();
      await client.query(
        `
        INSERT INTO public.documents (id, property_id, prospect_id, org_id, file_name, file_path, mime_type, file_size, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'application/pdf', $7, $8)
        `,
        [
          docId,
          propertyId,
          prospectId,
          BETA_ORG_ID,
          `lease-summary-${i + 1}.pdf`,
          `${BETA_ORG_ID}/${propertyId}/${docId}_lease-summary-${i + 1}.pdf`,
          120_000 + i * 1000,
          ownerId,
        ],
      );
    }

    for (let i = 0; i < 200; i++) {
      const propertyId = propertyIds[i % propertyIds.length]!;
      const prospectId = i % 4 === 0 ? prospectIds[i % prospectIds.length] : null;
      const authorId = i % 2 === 0 ? ownerId : editorIds[i % editorIds.length]!;
      await client.query(
        `
        INSERT INTO public.notes (property_id, prospect_id, org_id, user_id, content)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          propertyId,
          prospectId,
          BETA_ORG_ID,
          authorId,
          `Site visit note ${i + 1}: discussed LOI terms and tenant improvement allowance.`,
        ],
      );
    }

    await client.query("COMMIT");

    console.log("Beta seed complete:");
    console.log("  Organization:", BETA_ORG_NAME);
    console.log("  Properties: 20 | Prospects: 100 | Contacts: 250");
    console.log("  Documents: 100 (metadata) | Notes: 200 | Users: 10");
    console.log("  Password for all beta users: BetaSeed2026!");
    console.log("  Owner login:", USERS[0]!.email);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  // Verify counts via service role
  const { count: propertyCount } = await admin
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("org_id", BETA_ORG_ID);
  console.log("Verified property count:", propertyCount);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
