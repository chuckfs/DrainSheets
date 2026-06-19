import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createPool, isDatabaseAvailable } from "../helpers/rls-client";
import {
  deleteShare,
  FIXTURE,
  insertShare,
  setupRlsFixtures,
  teardownRlsFixtures,
} from "../helpers/rls-fixtures";

const pool = createPool();
const dbAvailable = await isDatabaseAvailable(pool);

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping activity RLS tests.");
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

describe.skipIf(!dbAvailable)("G5-G activity — generation and visibility", () => {
  it("log_activity creates a row readable by sheet owner", async () => {
    const count = await asUser(pool, FIXTURE.ownerId, async (client) => {
      await client.query(
        `SELECT public.log_activity($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
        [
          FIXTURE.orgId,
          FIXTURE.ownerId,
          "row",
          FIXTURE.rowRootId,
          "updated",
          JSON.stringify({ column_label: "Status", row_title: "Root row" }),
          FIXTURE.workspaceId,
          FIXTURE.sheetRootId,
          FIXTURE.rowRootId,
        ],
      );

      const { rows } = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM public.activity WHERE sheet_id = $1`,
        [FIXTURE.sheetRootId],
      );
      return rows[0]?.count ?? 0;
    });

    expect(count).toBeGreaterThan(0);
  });

  it("revoked workspace share removes activity visibility", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    await pool.query(
      `SELECT public.log_activity($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
      [
        FIXTURE.orgId,
        FIXTURE.ownerId,
        "note",
        FIXTURE.rowRootId,
        "created",
        "{}",
        FIXTURE.workspaceId,
        FIXTURE.sheetRootId,
        null,
      ],
    );

    const visibleWithShare = await asUser(pool, FIXTURE.memberBId, async (client) => {
      const { rows } = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM public.activity WHERE sheet_id = $1`,
        [FIXTURE.sheetRootId],
      );
      return rows[0]?.count ?? 0;
    });
    expect(visibleWithShare).toBeGreaterThan(0);

    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);

    const visibleAfterRevoke = await asUser(pool, FIXTURE.memberBId, async (client) => {
      const { rows } = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM public.activity WHERE sheet_id = $1`,
        [FIXTURE.sheetRootId],
      );
      return rows[0]?.count ?? 0;
    });
    expect(visibleAfterRevoke).toBe(0);
  });
});

describe.skipIf(!dbAvailable)("G5-G activity — format helper", () => {
  it("formats row update messages from metadata", async () => {
    const { formatActivityMessage } = await import("@/lib/activity/format");
    const message = formatActivityMessage(
      {
        id: "66666666-6666-6666-6666-666666666661",
        org_id: FIXTURE.orgId,
        actor_id: FIXTURE.ownerId,
        workspace_id: FIXTURE.workspaceId,
        sheet_id: FIXTURE.sheetRootId,
        row_id: FIXTURE.rowRootId,
        entity_type: "row",
        entity_id: FIXTURE.rowRootId,
        action: "updated",
        metadata: { column_label: "Status", row_title: "Acme Corp" },
        created_at: new Date().toISOString(),
      },
      { name: "Charlie" },
    );

    expect(message).toContain("Charlie");
    expect(message).toContain("Status");
    expect(message).toContain("Acme Corp");
  });
});
