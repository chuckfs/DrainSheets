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

export type CreateRowInput = z.infer<typeof createRowSchema>;
export type UpdateRowInput = z.infer<typeof updateRowSchema>;
