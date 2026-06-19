import { z } from "zod";

export const rowDataSchema = z.record(z.string(), z.unknown());

export const createRowSchema = z.object({
  sheetId: z.string().uuid(),
  data: rowDataSchema.optional(),
});

export const updateRowSchema = z.object({
  rowId: z.string().uuid(),
  data: rowDataSchema,
});

export const deleteRowSchema = z.object({
  rowId: z.string().uuid(),
});

export const reorderRowSchema = z.object({
  rowId: z.string().uuid(),
  targetPosition: z.number().int().min(0),
});

export const bulkDeleteRowsSchema = z.object({
  rowIds: z.array(z.string().uuid()).min(1),
});

export const listRowsWindowSchema = z.object({
  sheetId: z.string().uuid(),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(500),
});

export const getRowSchema = z.object({
  rowId: z.string().uuid(),
});

export type CreateRowInput = z.infer<typeof createRowSchema>;
export type UpdateRowInput = z.infer<typeof updateRowSchema>;
export type DeleteRowInput = z.infer<typeof deleteRowSchema>;
export type ReorderRowInput = z.infer<typeof reorderRowSchema>;
export type BulkDeleteRowsInput = z.infer<typeof bulkDeleteRowsSchema>;
