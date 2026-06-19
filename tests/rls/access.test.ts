import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  countRows,
  createPool,
  isDatabaseAvailable,
} from "../helpers/rls-client";
import {
  deleteShare,
  FIXTURE,
  insertShare,
  setupRlsFixtures,
  teardownRlsFixtures,
} from "../helpers/rls-fixtures";

const pool = createPool();
const dbAvailable = await isDatabaseAvailable(pool);

async function effectiveSheetRole(userId: string, sheetId: string) {
  return asUser(pool, userId, async (client) => {
    const { rows } = await client.query<{ role: string | null }>(
      `SELECT public.effective_role_for_sheet($1, $2)::text AS role`,
      [sheetId, userId],
    );
    return rows[0]?.role ?? null;
  });
}

async function canSelectWorkspace(userId: string, workspaceId: string) {
  return asUser(pool, userId, (client) =>
    countRows(client, "workspaces", "id = $1", [workspaceId]),
  );
}

async function canUpdateRow(userId: string, rowId: string) {
  return asUser(pool, userId, async (client) => {
    const { rowCount } = await client.query(
      `UPDATE public.rows SET data = data || '{"touched":true}'::jsonb WHERE id = $1`,
      [rowId],
    );
    return rowCount ?? 0;
  });
}

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping access RLS tests.");
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

describe.skipIf(!dbAvailable)("G1 access — workspace inheritance", () => {
  it("workspace editor share yields sheet editor on root sheet", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const role = await effectiveSheetRole(FIXTURE.memberBId, FIXTURE.sheetRootId);
    expect(role).toBe("editor");

    const updated = await canUpdateRow(FIXTURE.memberBId, FIXTURE.rowRootId);
    expect(updated).toBe(1);
  });

  it("workspace viewer share yields sheet viewer on root sheet", async () => {
    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceViewerId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "viewer",
      createdBy: FIXTURE.ownerId,
    });

    const role = await effectiveSheetRole(FIXTURE.memberBId, FIXTURE.sheetRootId);
    expect(role).toBe("viewer");

    const updated = await canUpdateRow(FIXTURE.memberBId, FIXTURE.rowRootId);
    expect(updated).toBe(0);
  });
});

describe.skipIf(!dbAvailable)("G1 access — folder inheritance", () => {
  it("folder editor share yields sheet editor on nested sheet", async () => {
    await deleteShare(pool, FIXTURE.shareWorkspaceViewerId);
    await insertShare(pool, {
      id: FIXTURE.shareFolderEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "folder",
      resourceId: FIXTURE.folderId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const role = await effectiveSheetRole(FIXTURE.memberBId, FIXTURE.sheetInFolderId);
    expect(role).toBe("editor");

    const updated = await canUpdateRow(FIXTURE.memberBId, FIXTURE.rowFolderId);
    expect(updated).toBe(1);
  });
});

describe.skipIf(!dbAvailable)("G1 access — most permissive wins", () => {
  it("workspace viewer plus direct sheet editor resolves to editor", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceViewerId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "viewer",
      createdBy: FIXTURE.ownerId,
    });
    await insertShare(pool, {
      id: FIXTURE.shareSheetEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "sheet",
      resourceId: FIXTURE.sheetRootId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const role = await effectiveSheetRole(FIXTURE.memberBId, FIXTURE.sheetRootId);
    expect(role).toBe("editor");

    const updated = await canUpdateRow(FIXTURE.memberBId, FIXTURE.rowRootId);
    expect(updated).toBe(1);
  });
});

describe.skipIf(!dbAvailable)("G1 access — isolation", () => {
  it("org editor without shares cannot see workspace or sheets", async () => {
    await deleteShare(pool, FIXTURE.shareWorkspaceViewerId);
    await deleteShare(pool, FIXTURE.shareSheetEditorId);
    await deleteShare(pool, FIXTURE.shareFolderEditorId);

    const workspaceCount = await canSelectWorkspace(
      FIXTURE.editorNoShareId,
      FIXTURE.workspaceId,
    );
    expect(workspaceCount).toBe(0);

    const sheetCount = await asUser(pool, FIXTURE.editorNoShareId, (client) =>
      countRows(client, "sheets", "id = $1", [FIXTURE.sheetRootId]),
    );
    expect(sheetCount).toBe(0);
  });

  it("org admin has implicit admin on all workspace resources", async () => {
    const role = await effectiveSheetRole(FIXTURE.adminId, FIXTURE.sheetRootId);
    expect(role).toBe("admin");

    const workspaceCount = await canSelectWorkspace(FIXTURE.adminId, FIXTURE.workspaceId);
    expect(workspaceCount).toBe(1);
  });
});

describe.skipIf(!dbAvailable)("G1 access — share removal", () => {
  it("revoking workspace share removes access immediately", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    expect(await canSelectWorkspace(FIXTURE.memberBId, FIXTURE.workspaceId)).toBe(1);

    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);

    expect(await canSelectWorkspace(FIXTURE.memberBId, FIXTURE.workspaceId)).toBe(0);
    expect(await effectiveSheetRole(FIXTURE.memberBId, FIXTURE.sheetRootId)).toBeNull();
  });
});
