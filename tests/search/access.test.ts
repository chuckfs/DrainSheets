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

const SEARCH_CONTACT_ID = "99999999-9999-9999-9999-999999999991";

type SearchRow = {
  entity_type: string;
  entity_id: string;
  title: string;
  sheet_id: string | null;
};

async function searchGlobal(userId: string, query: string): Promise<SearchRow[]> {
  return asUser(pool, userId, async (client) => {
    const { rows } = await client.query<{
      entity_type: string;
      entity_id: string;
      title: string;
      sheet_id: string | null;
    }>(`SELECT * FROM public.search_global($1, 25, 0)`, [query]);
    return rows;
  });
}

async function setupSearchContact() {
  await pool.query(
    `
    INSERT INTO public.contacts (id, org_id, first_name, last_name, email, created_by)
    VALUES ($1, $2, 'Searchable', 'Contact', 'searchable@test.local', $3)
    ON CONFLICT (id) DO NOTHING
    `,
    [SEARCH_CONTACT_ID, FIXTURE.orgId, FIXTURE.ownerId],
  );
}

async function cleanupSearchContact() {
  await pool.query(`DELETE FROM public.contacts WHERE id = $1`, [SEARCH_CONTACT_ID]);
}

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping search RLS tests.");
    return;
  }
  await teardownRlsFixtures(pool);
  await setupRlsFixtures(pool);
  await setupSearchContact();
}, 60_000);

afterAll(async () => {
  if (dbAvailable) {
    await cleanupSearchContact();
    await teardownRlsFixtures(pool);
  }
  await pool.end();
});

describe.skipIf(!dbAvailable)("G5-F search — sheet visibility", () => {
  it("owner finds root sheet by name", async () => {
    const results = await searchGlobal(FIXTURE.ownerId, "Root Sheet");
    const sheetIds = results.filter((row) => row.entity_type === "sheet").map((row) => row.entity_id);
    expect(sheetIds).toContain(FIXTURE.sheetRootId);
  });

  it("org editor without shares cannot find workspace sheets", async () => {
    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);
    await deleteShare(pool, FIXTURE.shareWorkspaceViewerId);
    await deleteShare(pool, FIXTURE.shareFolderEditorId);
    await deleteShare(pool, FIXTURE.shareSheetEditorId);

    const results = await searchGlobal(FIXTURE.editorNoShareId, "Root Sheet");
    expect(results.filter((row) => row.entity_type === "sheet")).toHaveLength(0);
  });
});

describe.skipIf(!dbAvailable)("G5-F search — row visibility", () => {
  it("owner finds row data by primary field value", async () => {
    const results = await searchGlobal(FIXTURE.ownerId, "Root row");
    const rowIds = results.filter((row) => row.entity_type === "row").map((row) => row.entity_id);
    expect(rowIds).toContain(FIXTURE.rowRootId);
  });
});

describe.skipIf(!dbAvailable)("G5-F search — contact visibility", () => {
  it("org member finds contact in same org", async () => {
    const results = await searchGlobal(FIXTURE.ownerId, "Searchable");
    const contactIds = results
      .filter((row) => row.entity_type === "contact")
      .map((row) => row.entity_id);
    expect(contactIds).toContain(SEARCH_CONTACT_ID);
  });
});

describe.skipIf(!dbAvailable)("G5-F search — inheritance-aware visibility", () => {
  it("workspace share exposes folder sheet in search", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const results = await searchGlobal(FIXTURE.memberBId, "Folder Sheet");
    const sheetIds = results.filter((row) => row.entity_type === "sheet").map((row) => row.entity_id);
    expect(sheetIds).toContain(FIXTURE.sheetInFolderId);
  });

  it("folder share exposes nested sheet but not unrelated root sheet", async () => {
    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);
    await insertShare(pool, {
      id: FIXTURE.shareFolderEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "folder",
      resourceId: FIXTURE.folderId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const folderResults = await searchGlobal(FIXTURE.memberBId, "Folder Sheet");
    const folderSheetIds = folderResults
      .filter((row) => row.entity_type === "sheet")
      .map((row) => row.entity_id);
    expect(folderSheetIds).toContain(FIXTURE.sheetInFolderId);

    const rootResults = await searchGlobal(FIXTURE.memberBId, "Root Sheet");
    const rootSheetIds = rootResults
      .filter((row) => row.entity_type === "sheet")
      .map((row) => row.entity_id);
    expect(rootSheetIds).not.toContain(FIXTURE.sheetRootId);
  });
});

describe.skipIf(!dbAvailable)("G5-F search — revoked share removal", () => {
  it("revoking workspace share removes sheet from search immediately", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    expect(
      (await searchGlobal(FIXTURE.memberBId, "Root Sheet")).some(
        (row) => row.entity_type === "sheet" && row.entity_id === FIXTURE.sheetRootId,
      ),
    ).toBe(true);

    await deleteShare(pool, FIXTURE.shareWorkspaceEditorId);

    expect(
      (await searchGlobal(FIXTURE.memberBId, "Root Sheet")).some(
        (row) => row.entity_type === "sheet" && row.entity_id === FIXTURE.sheetRootId,
      ),
    ).toBe(false);
  });
});
