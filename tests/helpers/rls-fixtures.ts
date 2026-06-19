import type pg from "pg";

/** Isolated test org and users — safe to delete in teardown. */
export const FIXTURE = {
  orgId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  ownerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
  adminId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
  editorNoShareId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
  memberBId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4",
  workspaceId: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
  folderId: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
  sheetRootId: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
  sheetInFolderId: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
  rowRootId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
  rowFolderId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
  shareWorkspaceEditorId: "ffffffff-ffff-ffff-ffff-fffffffffff1",
  shareWorkspaceViewerId: "ffffffff-ffff-ffff-ffff-fffffffffff2",
  shareFolderEditorId: "ffffffff-ffff-ffff-ffff-fffffffffff3",
  shareSheetEditorId: "ffffffff-ffff-ffff-ffff-fffffffffff4",
} as const;

const TEST_USERS = [
  { id: FIXTURE.ownerId, email: "rls-owner@test.local", role: "owner" },
  { id: FIXTURE.adminId, email: "rls-admin@test.local", role: "admin" },
  { id: FIXTURE.editorNoShareId, email: "rls-editor-noshare@test.local", role: "editor" },
  { id: FIXTURE.memberBId, email: "rls-member-b@test.local", role: "editor" },
] as const;

async function insertAuthUser(client: pg.PoolClient, id: string, email: string) {
  await client.query(
    `
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
      crypt('test-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now()
    )
    ON CONFLICT (id) DO NOTHING
    `,
    [id, email],
  );
}

export async function setupRlsFixtures(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO public.organizations (id, name) VALUES ($1, 'RLS Access Test Org') ON CONFLICT (id) DO NOTHING`,
      [FIXTURE.orgId],
    );

    for (const user of TEST_USERS) {
      await client.query(
        `
        INSERT INTO public.invitations (org_id, email, role, token_hash, expires_at)
        VALUES ($1, $2, $3, $4, now() + interval '7 days')
        ON CONFLICT DO NOTHING
        `,
        [FIXTURE.orgId, user.email, user.role, `rls-test-${user.id}`],
      );
      await insertAuthUser(client, user.id, user.email);
    }

    await client.query(
      `
      INSERT INTO public.workspaces (id, org_id, name, created_by)
      VALUES ($1, $2, 'Access Test Workspace', $3)
      ON CONFLICT (id) DO NOTHING
      `,
      [FIXTURE.workspaceId, FIXTURE.orgId, FIXTURE.ownerId],
    );

    await client.query(
      `
      INSERT INTO public.folders (id, org_id, workspace_id, name, position, created_by)
      VALUES ($1, $2, $3, 'Access Test Folder', 0, $4)
      ON CONFLICT (id) DO NOTHING
      `,
      [FIXTURE.folderId, FIXTURE.orgId, FIXTURE.workspaceId, FIXTURE.ownerId],
    );

    await client.query(
      `
      INSERT INTO public.sheets (id, org_id, workspace_id, folder_id, name, position, created_by)
      VALUES
        ($1, $3, $4, NULL, 'Root Sheet', 0, $5),
        ($2, $3, $4, $6, 'Folder Sheet', 0, $5)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        FIXTURE.sheetRootId,
        FIXTURE.sheetInFolderId,
        FIXTURE.orgId,
        FIXTURE.workspaceId,
        FIXTURE.ownerId,
        FIXTURE.folderId,
      ],
    );

    await client.query(
      `
      INSERT INTO public.rows (id, sheet_id, org_id, position, data, created_by)
      VALUES
        ($1, $3, $4, 0, '{"name":"Root row"}'::jsonb, $5),
        ($2, $6, $4, 0, '{"name":"Folder row"}'::jsonb, $5)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        FIXTURE.rowRootId,
        FIXTURE.rowFolderId,
        FIXTURE.sheetRootId,
        FIXTURE.orgId,
        FIXTURE.ownerId,
        FIXTURE.sheetInFolderId,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function teardownRlsFixtures(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM public.shares WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.documents WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.rows WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.sheet_columns WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.sheets WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.folders WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.workspaces WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.invitations WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.profiles WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [
      [
        FIXTURE.ownerId,
        FIXTURE.adminId,
        FIXTURE.editorNoShareId,
        FIXTURE.memberBId,
      ],
    ]);
    await client.query(`DELETE FROM public.organizations WHERE id = $1`, [FIXTURE.orgId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function insertShare(
  pool: pg.Pool,
  share: {
    id: string;
    granteeId: string;
    resourceType: "workspace" | "folder" | "sheet";
    resourceId: string;
    role: "viewer" | "commenter" | "editor" | "admin";
    createdBy: string;
  },
): Promise<void> {
  await pool.query(
    `
    INSERT INTO public.shares (id, org_id, grantee_id, resource_type, resource_id, role, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (grantee_id, resource_type, resource_id) DO UPDATE SET role = EXCLUDED.role
    `,
    [
      share.id,
      FIXTURE.orgId,
      share.granteeId,
      share.resourceType,
      share.resourceId,
      share.role,
      share.createdBy,
    ],
  );
}

export async function deleteShare(pool: pg.Pool, shareId: string): Promise<void> {
  await pool.query(`DELETE FROM public.shares WHERE id = $1`, [shareId]);
}
