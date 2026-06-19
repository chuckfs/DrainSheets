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

const DOCUMENT_ID = "77777777-7777-7777-7777-777777777780";
const FILE_PATH = `${FIXTURE.orgId}/${FIXTURE.sheetRootId}/${DOCUMENT_ID}_Lease.pdf`;

async function seedDocument(uploadedBy: string) {
  await pool.query(`DELETE FROM public.documents WHERE id = $1`, [DOCUMENT_ID]);
  await pool.query(
    `
    INSERT INTO public.documents (
      id, org_id, sheet_id, file_name, file_path, uploaded_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [DOCUMENT_ID, FIXTURE.orgId, FIXTURE.sheetRootId, "Lease.pdf", FILE_PATH, uploadedBy],
  );
}

async function canDeleteStorage(userId: string): Promise<boolean> {
  return asUser(pool, userId, async (client) => {
    const { rows } = await client.query<{ allowed: boolean }>(
      `SELECT public.can_delete_document_storage($1, $2) AS allowed`,
      [FILE_PATH, userId],
    );
    return rows[0]?.allowed ?? false;
  });
}

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping documents storage DELETE RLS tests.");
    return;
  }
  await teardownRlsFixtures(pool);
  await setupRlsFixtures(pool);
}, 60_000);

afterAll(async () => {
  if (dbAvailable) {
    await pool.query(`DELETE FROM public.documents WHERE id = $1`, [DOCUMENT_ID]);
    await teardownRlsFixtures(pool);
  }
  await pool.end();
});

describe.skipIf(!dbAvailable)("S1 — documents storage DELETE policy", () => {
  it("viewer cannot delete storage object (even with sheet access)", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareWorkspaceViewerId,
      granteeId: FIXTURE.memberBId,
      resourceType: "workspace",
      resourceId: FIXTURE.workspaceId,
      role: "viewer",
      createdBy: FIXTURE.ownerId,
    });

    await seedDocument(FIXTURE.ownerId);

    await expect(canDeleteStorage(FIXTURE.memberBId)).resolves.toBe(false);
  });

  it("uploader can delete their own storage object", async () => {
    await seedDocument(FIXTURE.memberBId);

    await expect(canDeleteStorage(FIXTURE.memberBId)).resolves.toBe(true);
  });

  it("sheet admin can delete another user's storage object", async () => {
    await insertShare(pool, {
      id: FIXTURE.shareSheetEditorId,
      granteeId: FIXTURE.adminId,
      resourceType: "sheet",
      resourceId: FIXTURE.sheetRootId,
      role: "admin",
      createdBy: FIXTURE.ownerId,
    });

    await seedDocument(FIXTURE.memberBId);

    await expect(canDeleteStorage(FIXTURE.adminId)).resolves.toBe(true);
  });
});
