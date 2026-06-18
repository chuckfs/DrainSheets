import type pg from "pg";

/** Isolated test org and users — safe to delete in teardown. */
export const FIXTURE = {
  orgId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  ownerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
  adminId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
  editorAId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
  propertyXId: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
  propertyYId: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
  prospectXId: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
  prospectYId: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
  contactXId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
  contactYId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
  documentXId: "ffffffff-ffff-ffff-ffff-fffffffffff1",
  documentYId: "ffffffff-ffff-ffff-ffff-fffffffffff2",
  noteXId: "11111111-1111-1111-1111-111111111101",
  noteYId: "11111111-1111-1111-1111-111111111102",
} as const;

const TEST_USERS = [
  { id: FIXTURE.ownerId, email: "rls-owner@test.local", role: "owner" },
  { id: FIXTURE.adminId, email: "rls-admin@test.local", role: "admin" },
  { id: FIXTURE.editorAId, email: "rls-editor-a@test.local", role: "editor" },
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
      `INSERT INTO public.organizations (id, name) VALUES ($1, 'RLS Test Org') ON CONFLICT (id) DO NOTHING`,
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
      INSERT INTO public.properties (id, org_id, name, city, state, status, created_by)
      VALUES
        ($1, $3, 'Property X (Assigned)', 'Austin', 'TX', 'active', $4),
        ($2, $3, 'Property Y (Unassigned)', 'Dallas', 'TX', 'active', $4)
      ON CONFLICT (id) DO NOTHING
      `,
      [FIXTURE.propertyXId, FIXTURE.propertyYId, FIXTURE.orgId, FIXTURE.ownerId],
    );

    await client.query(
      `
      INSERT INTO public.property_assignments (property_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (property_id, user_id) DO NOTHING
      `,
      [FIXTURE.propertyXId, FIXTURE.editorAId],
    );

    await client.query(
      `
      INSERT INTO public.prospects (id, property_id, company_name, category)
      VALUES
        ($1, $3, 'Prospect on X', 'Restaurant'),
        ($2, $4, 'Prospect on Y', 'Medical')
      ON CONFLICT (id) DO NOTHING
      `,
      [FIXTURE.prospectXId, FIXTURE.prospectYId, FIXTURE.propertyXId, FIXTURE.propertyYId],
    );

    await client.query(
      `
      INSERT INTO public.contacts (id, prospect_id, first_name, last_name, org_id, created_by)
      VALUES
        ($1, $3, 'Contact', 'X', $5, $6),
        ($2, $4, 'Contact', 'Y', $5, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        FIXTURE.contactXId,
        FIXTURE.contactYId,
        FIXTURE.prospectXId,
        FIXTURE.prospectYId,
        FIXTURE.orgId,
        FIXTURE.ownerId,
      ],
    );

    const docPathX = `${FIXTURE.orgId}/${FIXTURE.propertyXId}/doc-x.pdf`;
    const docPathY = `${FIXTURE.orgId}/${FIXTURE.propertyYId}/doc-y.pdf`;

    await client.query(
      `
      INSERT INTO public.documents (id, property_id, org_id, file_name, file_path, uploaded_by)
      VALUES
        ($1, $3, $5, 'doc-x.pdf', $7, $6),
        ($2, $4, $5, 'doc-y.pdf', $8, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        FIXTURE.documentXId,
        FIXTURE.documentYId,
        FIXTURE.propertyXId,
        FIXTURE.propertyYId,
        FIXTURE.orgId,
        FIXTURE.ownerId,
        docPathX,
        docPathY,
      ],
    );

    await client.query(
      `
      INSERT INTO public.notes (id, property_id, org_id, user_id, content)
      VALUES
        ($1, $3, $5, $6, 'Note on property X'),
        ($2, $4, $5, $6, 'Note on property Y')
      ON CONFLICT (id) DO NOTHING
      `,
      [
        FIXTURE.noteXId,
        FIXTURE.noteYId,
        FIXTURE.propertyXId,
        FIXTURE.propertyYId,
        FIXTURE.orgId,
        FIXTURE.ownerId,
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
    await client.query(`DELETE FROM public.recent_views WHERE property_id IN ($1, $2)`, [
      FIXTURE.propertyXId,
      FIXTURE.propertyYId,
    ]);
    await client.query(`DELETE FROM public.favorites WHERE property_id IN ($1, $2)`, [
      FIXTURE.propertyXId,
      FIXTURE.propertyYId,
    ]);
    await client.query(`DELETE FROM public.property_assignments WHERE property_id IN ($1, $2)`, [
      FIXTURE.propertyXId,
      FIXTURE.propertyYId,
    ]);
    await client.query(`DELETE FROM public.notes WHERE id IN ($1, $2)`, [
      FIXTURE.noteXId,
      FIXTURE.noteYId,
    ]);
    await client.query(`DELETE FROM public.documents WHERE id IN ($1, $2)`, [
      FIXTURE.documentXId,
      FIXTURE.documentYId,
    ]);
    await client.query(`DELETE FROM public.contacts WHERE id IN ($1, $2)`, [
      FIXTURE.contactXId,
      FIXTURE.contactYId,
    ]);
    await client.query(`DELETE FROM public.prospects WHERE id IN ($1, $2)`, [
      FIXTURE.prospectXId,
      FIXTURE.prospectYId,
    ]);
    await client.query(`DELETE FROM public.properties WHERE id IN ($1, $2)`, [
      FIXTURE.propertyXId,
      FIXTURE.propertyYId,
    ]);
    await client.query(`DELETE FROM public.invitations WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM public.profiles WHERE org_id = $1`, [FIXTURE.orgId]);
    await client.query(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [
      [FIXTURE.ownerId, FIXTURE.adminId, FIXTURE.editorAId],
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
