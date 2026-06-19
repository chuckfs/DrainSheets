import { z } from "zod";
import { columnTypeSchema } from "@/lib/validations/column";

export const columnMappingEntrySchema = z.object({
  sourceHeader: z.string(),
  targetKey: z.string().nullable(),
  typeOverride: columnTypeSchema.optional(),
});

export const dedupeConfigSchema = z.object({
  enabled: z.boolean(),
  sourceColumn: z.string().nullable(),
});

export const createSheetFromImportSchema = z.object({
  workspaceId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  sheetName: z.string().min(1).max(200),
  mapping: z.record(z.string(), columnMappingEntrySchema),
  inferredColumns: z.array(
    z.object({
      sourceHeader: z.string(),
      key: z.string(),
      label: z.string(),
      type: columnTypeSchema,
      position: z.number().int().nonnegative(),
      isPrimary: z.boolean(),
    }),
  ),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  dedupe: dedupeConfigSchema,
});

export const importIntoTemplateSchema = z.object({
  workspaceId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  sheetName: z.string().min(1).max(200),
  templateId: z.string().uuid(),
  mapping: z.record(z.string(), columnMappingEntrySchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  dedupe: dedupeConfigSchema,
});

export const importPreviewSchema = z.object({
  mapping: z.record(z.string(), columnMappingEntrySchema),
  columnTypes: z.record(z.string(), columnTypeSchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  dedupe: dedupeConfigSchema,
});
