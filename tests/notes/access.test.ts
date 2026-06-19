import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createPool, isDatabaseAvailable } from "../helpers/rls-client";
import {
  FIXTURE,
  insertShare,
  setupRlsFixtures,
  teardownRlsFixtures,
} from "../helpers/rls-fixtures";

const pool = createPool();
const dbAvailable = await isDatabaseAvailable(pool);

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping notes RLS tests.");
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

describe.skipIf(!dbAvailable)("G5-G notes — access", () => {
  it("owner can create and read sheet notes", async () => {
    const count = await asUser(pool, FIXTURE.ownerId, async (client) => {
      const NOTE_ID = "88888888-8888-8888-8888-888888888881";
      await client.query(
        `INSERT INTO public.notes (id, org_id, sheet_id, user_id, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [NOTE_ID, FIXTURE.orgId, FIXTURE.sheetRootId, FIXTURE.ownerId, "Root sheet note"],
      );
      const { rows } = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM public.notes WHERE sheet_id = $1`,
        [FIXTURE.sheetRootId],
      );
      return rows[0]?.count ?? 0;
    });

    expect(count).toBe(1);
  });

  it("viewer share cannot insert notes", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceViewerId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "viewer",
      createdBy: FIXTURE.ownerId,
    });

    await expect(
      asUser(pool, FIXTURE.memberBId, async (client) => {
        await client.query(
          `INSERT INTO public.notes (id, org_id, sheet_id, user_id, content)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            "88888888-8888-8888-8888-888888888882",
            FIXTURE.orgId,
            FIXTURE.sheetRootId,
            FIXTURE.memberBId,
            "Should fail",
          ],
        );
      }),
    ).rejects.toThrow(/row-level security/i);
  });

  it("editor share can insert notes", async () => {
    await pool.query(`DELETE FROM public.shares WHERE id = $1`, [FIXTURE.shareWorkspaceViewerId]);
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const inserted = await asUser(pool, FIXTURE.memberBId, async (client) => {
      const { rowCount } = await client.query(
        `INSERT INTO public.notes (id, org_id, sheet_id, user_id, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          "88888888-8888-8888-8888-888888888883",
          FIXTURE.orgId,
          FIXTURE.sheetRootId,
          FIXTURE.memberBId,
          "Member note",
        ],
      );
      return rowCount ?? 0;
    });

    expect(inserted).toBe(1);
  });
});

describe.skipIf(!dbAvailable)("G5-G notes — ownership", () => {
  it("author can update own note", async () => {
    const updated = await asUser(pool, FIXTURE.memberBId, async (client) => {
      const NOTE_OWN = "88888888-8888-8888-8888-888888888884";
      await client.query(
        `INSERT INTO public.notes (id, org_id, sheet_id, user_id, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [NOTE_OWN, FIXTURE.orgId, FIXTURE.sheetRootId, FIXTURE.memberBId, "Original"],
      );

      const { rowCount } = await client.query(
        `UPDATE public.notes SET content = $1 WHERE id = $2`,
        ["Updated", NOTE_OWN],
      );
      return rowCount ?? 0;
    });

    expect(updated).toBe(1);
  });
});
