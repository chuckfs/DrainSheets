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
    console.warn("Local Supabase not running — skipping documents RLS tests.");
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

describe.skipIf(!dbAvailable)("G5-G documents — upload permissions", () => {
  it("owner can insert document metadata", async () => {
    const inserted = await asUser(pool, FIXTURE.ownerId, async (client) => {
      const { rowCount } = await client.query(
        `
        INSERT INTO public.documents (
          id, org_id, sheet_id, file_name, file_path, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "77777777-7777-7777-7777-777777777771",
          FIXTURE.orgId,
          FIXTURE.sheetRootId,
          "Lease.pdf",
          `${FIXTURE.orgId}/${FIXTURE.sheetRootId}/77777777-7777-7777-7777-777777777771_Lease.pdf`,
          FIXTURE.ownerId,
        ],
      );
      return rowCount ?? 0;
    });

    expect(inserted).toBe(1);
  });

  it("viewer share cannot insert documents", async () => {
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
          `
          INSERT INTO public.documents (
            id, org_id, sheet_id, file_name, file_path, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            "77777777-7777-7777-7777-777777777772",
            FIXTURE.orgId,
            FIXTURE.sheetRootId,
            "Denied.pdf",
            `${FIXTURE.orgId}/${FIXTURE.sheetRootId}/77777777-7777-7777-7777-777777777772_Denied.pdf`,
            FIXTURE.memberBId,
          ],
        );
      }),
    ).rejects.toThrow(/row-level security/i);
  });

  it("folder editor share inherits document insert on nested sheet", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareFolderEditorId,
      granteeId: FIXTURE.memberBId,
      resourceType: "folder",
      resourceId: FIXTURE.folderId,
      role: "editor",
      createdBy: FIXTURE.ownerId,
    });

    const inserted = await asUser(pool, FIXTURE.memberBId, async (client) => {
      const { rowCount } = await client.query(
        `
        INSERT INTO public.documents (
          id, org_id, sheet_id, file_name, file_path, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "77777777-7777-7777-7777-777777777773",
          FIXTURE.orgId,
          FIXTURE.sheetInFolderId,
          "Folder.pdf",
          `${FIXTURE.orgId}/${FIXTURE.sheetInFolderId}/77777777-7777-7777-7777-777777777773_Folder.pdf`,
          FIXTURE.memberBId,
        ],
      );
      return rowCount ?? 0;
    });

    expect(inserted).toBe(1);
  });
});
