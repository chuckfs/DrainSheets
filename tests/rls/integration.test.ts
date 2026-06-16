import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  countRows,
  createPool,
  isDatabaseAvailable,
} from "../helpers/rls-client";
import { FIXTURE, setupRlsFixtures, teardownRlsFixtures } from "../helpers/rls-fixtures";

const pool = createPool();
const dbAvailable = await isDatabaseAvailable(pool);

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping RLS integration tests.");
    return;
  }
  await teardownRlsFixtures(pool);
  await setupRlsFixtures(pool);
}, 60_000);

afterAll(async () => {
  if (dbAvailable) {
    await teardownRlsFixtures(pool);
  }
  await pool.end();
});

describe.skipIf(!dbAvailable)("RLS integration — Owner", () => {
  it("can view all properties", async () => {
    const count = await asUser(pool, FIXTURE.ownerId, (client) =>
      countRows(client, "properties", "org_id = $1", [FIXTURE.orgId]),
    );
    expect(count).toBe(2);
  });

  it("can view all prospects, contacts, documents, and notes", async () => {
    const [prospects, contacts, documents, notes] = await asUser(pool, FIXTURE.ownerId, async (client) => {
      return Promise.all([
        countRows(client, "prospects"),
        countRows(client, "contacts"),
        countRows(client, "documents"),
        countRows(client, "notes"),
      ]);
    });
    expect(prospects).toBe(2);
    expect(contacts).toBe(2);
    expect(documents).toBe(2);
    expect(notes).toBe(2);
  });

  it("can manage users (update profiles in org)", async () => {
    const result = await asUser(pool, FIXTURE.ownerId, async (client) => {
      const { rowCount } = await client.query(
        `UPDATE public.profiles SET name = 'Editor A Updated' WHERE id = $1 AND org_id = $2`,
        [FIXTURE.editorAId, FIXTURE.orgId],
      );
      return rowCount;
    });
    expect(result).toBe(1);
  });

  it("can assign properties", async () => {
    const result = await asUser(pool, FIXTURE.ownerId, async (client) => {
      const { rowCount } = await client.query(
        `INSERT INTO public.property_assignments (property_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [FIXTURE.propertyYId, FIXTURE.editorAId],
      );
      return rowCount;
    });
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe.skipIf(!dbAvailable)("RLS integration — Admin", () => {
  it("can view all CRM records", async () => {
    const counts = await asUser(pool, FIXTURE.adminId, async (client) =>
      Promise.all([
        countRows(client, "properties", "org_id = $1", [FIXTURE.orgId]),
        countRows(client, "prospects"),
        countRows(client, "contacts"),
        countRows(client, "documents"),
        countRows(client, "notes"),
      ]),
    );
    expect(counts.every((c) => c >= 2)).toBe(true);
  });

  it("can create and update CRM records", async () => {
    const updated = await asUser(pool, FIXTURE.adminId, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `
        INSERT INTO public.prospects (property_id, company_name)
        VALUES ($1, 'Admin Created Prospect')
        RETURNING id
        `,
        [FIXTURE.propertyXId],
      );
      const created = rows[0]?.id;
      const { rowCount } = await client.query(
        `UPDATE public.prospects SET company_name = 'Admin Updated' WHERE id = $1`,
        [created],
      );
      return rowCount;
    });
    expect(updated).toBe(1);
  });

  it("cannot manage property assignments", async () => {
    await expect(
      asUser(pool, FIXTURE.adminId, async (client) => {
        await client.query(
          `INSERT INTO public.property_assignments (property_id, user_id) VALUES ($1, $2)`,
          [FIXTURE.propertyYId, FIXTURE.adminId],
        );
      }),
    ).rejects.toThrow();
  });

  it("cannot disable owners", async () => {
    const rowCount = await asUser(pool, FIXTURE.adminId, async (client) => {
      const { rowCount: updated } = await client.query(
        `UPDATE public.profiles SET status = 'disabled' WHERE id = $1`,
        [FIXTURE.ownerId],
      );
      return updated;
    });
    expect(rowCount).toBe(0);
  });
});

describe.skipIf(!dbAvailable)("RLS integration — Editor", () => {
  it("can view assigned property and related records", async () => {
    const propertyCount = await asUser(pool, FIXTURE.editorAId, (client) =>
      countRows(client, "properties", "id = $1", [FIXTURE.propertyXId]),
    );
    expect(propertyCount).toBe(1);

    const related = await asUser(pool, FIXTURE.editorAId, async (client) =>
      Promise.all([
        countRows(client, "prospects", "property_id = $1", [FIXTURE.propertyXId]),
        countRows(client, "contacts", "id = $1", [FIXTURE.contactXId]),
        countRows(client, "documents", "property_id = $1", [FIXTURE.propertyXId]),
        countRows(client, "notes", "property_id = $1", [FIXTURE.propertyXId]),
      ]),
    );
    expect(related.every((c) => c === 1)).toBe(true);
  });

  it("cannot view unassigned Property Y or related records", async () => {
    const blocked = await asUser(pool, FIXTURE.editorAId, async (client) =>
      Promise.all([
        countRows(client, "properties", "id = $1", [FIXTURE.propertyYId]),
        countRows(client, "prospects", "property_id = $1", [FIXTURE.propertyYId]),
        countRows(client, "contacts", "id = $1", [FIXTURE.contactYId]),
        countRows(client, "documents", "property_id = $1", [FIXTURE.propertyYId]),
        countRows(client, "notes", "property_id = $1", [FIXTURE.propertyYId]),
      ]),
    );
    expect(blocked).toEqual([0, 0, 0, 0, 0]);
  });

  it("cannot create properties", async () => {
    await expect(
      asUser(pool, FIXTURE.editorAId, async (client) => {
        await client.query(
          `
          INSERT INTO public.properties (org_id, name, status, created_by)
          VALUES ($1, 'Editor Property', 'active', $2)
          `,
          [FIXTURE.orgId, FIXTURE.editorAId],
        );
      }),
    ).rejects.toThrow();
  });

  it("cannot archive properties", async () => {
    await expect(
      asUser(pool, FIXTURE.editorAId, async (client) => {
        await client.query(
          `UPDATE public.properties SET status = 'archived' WHERE id = $1`,
          [FIXTURE.propertyXId],
        );
      }),
    ).rejects.toThrow(/row-level security/i);
  });

  it("cannot manage users", async () => {
    await expect(
      asUser(pool, FIXTURE.editorAId, async (client) => {
        await client.query(
          `
          INSERT INTO public.invitations (org_id, email, role, token_hash, expires_at)
          VALUES ($1, 'blocked@test.local', 'editor', 'hash', now() + interval '7 days')
          `,
          [FIXTURE.orgId],
        );
      }),
    ).rejects.toThrow();
  });
});
