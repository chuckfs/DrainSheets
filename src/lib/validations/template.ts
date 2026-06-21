import { z } from "zod";
import { columnTypeSchema } from "@/lib/validations/column";

export const templateColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: columnTypeSchema,
  position: z.number().int().nonnegative(),
  is_primary: z.boolean(),
  is_pinned: z.boolean(),
  width: z.number().nullable(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

export const createBlankSheetSchema = z.object({
  workspaceId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});

export const createSheetFromTemplateSchema = z.object({
  templateId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  version: z.number().int().positive().optional(),
});

export const saveSheetAsTemplateSchema = z.object({
  sheetId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});

export const deleteUserTemplateSchema = z.object({
  templateId: z.string().uuid(),
});

export type TemplateColumnDefinition = z.infer<typeof templateColumnSchema>;
export type CreateBlankSheetInput = z.infer<typeof createBlankSheetSchema>;
export type CreateSheetFromTemplateInput = z.infer<typeof createSheetFromTemplateSchema>;
export type SaveSheetAsTemplateInput = z.infer<typeof saveSheetAsTemplateSchema>;
export type DeleteUserTemplateInput = z.infer<typeof deleteUserTemplateSchema>;
