import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  createPool,
  isDatabaseAvailable,
} from "../helpers/rls-client";
import {
  FIXTURE,
  setupRlsFixtures,
  teardownRlsFixtures,
} from "../helpers/rls-fixtures";
import { SYSTEM_TEMPLATE_KEYS } from "@/lib/templates/template-utils";

const pool = createPool();
const dbAvailable = await isDatabaseAvailable(pool);

const TEMPLATE_COLUMN_COUNTS: Record<string, number> = {
  blank: 1,
  tenant_prospect_list: 6,
  deal_tracker: 5,
  contact_database: 6,
};

const TEMPLATE_IDS: Record<string, string> = {
  blank: "10000000-0000-0000-0000-000000000001",
  tenant_prospect_list: "10000000-0000-0000-0000-000000000002",
  deal_tracker: "10000000-0000-0000-0000-000000000003",
  contact_database: "10000000-0000-0000-0000-000000000004",
};

beforeAll(async () => {
  if (!dbAvailable) {
    console.warn("Local Supabase not running — skipping template seed validation.");
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

describe.skipIf(!dbAvailable)("Template seeds", () => {
  it("includes all four system templates", async () => {
    const keys = await asUser(pool, FIXTURE.ownerId, async (client) => {
      const { rows } = await client.query<{ key: string }>(
        `SELECT key FROM public.sheet_templates WHERE scope = 'system' ORDER BY key`,
      );
      return rows.map((row) => row.key);
    });

    for (const key of SYSTEM_TEMPLATE_KEYS) {
      expect(keys).toContain(key);
    }
  });

  for (const key of SYSTEM_TEMPLATE_KEYS) {
    it(`template ${key} has version 1 with expected columns`, async () => {
      const templateId = TEMPLATE_IDS[key];

      const version = await asUser(pool, FIXTURE.ownerId, async (client) => {
        const { rows } = await client.query<{ columns: unknown }>(
          `
          SELECT v.columns
          FROM public.sheet_template_versions v
          JOIN public.sheet_templates t ON t.id = v.template_id
          WHERE t.key = $1 AND v.version = 1
          `,
          [key],
        );
        return rows[0]?.columns;
      });

      expect(Array.isArray(version)).toBe(true);
      expect((version as unknown[]).length).toBe(TEMPLATE_COLUMN_COUNTS[key]);
    });

    it(`creates sheet from ${key} template with columns`, async () => {
      const templateId = TEMPLATE_IDS[key];
      const sheetName = `Test ${key}`;

      const result = await asUser(pool, FIXTURE.ownerId, async (client) => {
        const { rows: templateRows } = await client.query<{ columns: unknown; version: number }>(
          `
          SELECT v.columns, v.version
          FROM public.sheet_template_versions v
          WHERE v.template_id = $1 AND v.version = 1
          `,
          [templateId],
        );

        const templateVersion = templateRows[0];
        if (!templateVersion) {
          throw new Error("Template version missing");
        }

        const { rows: sheetRows } = await client.query<{ id: string }>(
          `
          INSERT INTO public.sheets (
            org_id, workspace_id, name, template_id, template_version, position, created_by
          ) VALUES ($1, $2, $3, $4, $5, 0, $6)
          RETURNING id
          `,
          [
            FIXTURE.orgId,
            FIXTURE.workspaceId,
            sheetName,
            templateId,
            templateVersion.version,
            FIXTURE.ownerId,
          ],
        );

        const createdSheetId = sheetRows[0]?.id;
        if (!createdSheetId) {
          throw new Error("Sheet insert failed");
        }

        const columns = templateVersion.columns as Array<Record<string, unknown>>;

        for (const column of columns) {
          await client.query(
            `
            INSERT INTO public.sheet_columns (
              sheet_id, org_id, key, label, type, position, is_primary, is_pinned, width, config
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
              createdSheetId,
              FIXTURE.orgId,
              column.key,
              column.label,
              column.type,
              column.position,
              column.is_primary,
              column.is_pinned,
              column.width,
              JSON.stringify(column.config ?? {}),
            ],
          );
        }

        const { rows: countRows } = await client.query<{ count: number }>(
          `SELECT count(*)::int AS count FROM public.sheet_columns WHERE sheet_id = $1`,
          [createdSheetId],
        );

        await client.query(
          `
          INSERT INTO public.rows (sheet_id, org_id, position, data, created_by)
          VALUES ($1, $2, 0, '{}'::jsonb, $3)
          `,
          [createdSheetId, FIXTURE.orgId, FIXTURE.ownerId],
        );

        const { rowCount } = await client.query(
          `
          UPDATE public.rows
          SET data = '{"validated": true}'::jsonb
          WHERE sheet_id = $1
          `,
          [createdSheetId],
        );

        return {
          columnCount: countRows[0]?.count ?? 0,
          updatedRows: rowCount ?? 0,
        };
      });

      expect(result.columnCount).toBe(TEMPLATE_COLUMN_COUNTS[key]);
      expect(result.updatedRows).toBe(1);
    });
  }
});
