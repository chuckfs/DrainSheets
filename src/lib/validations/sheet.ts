import { z } from "zod";

export const sheetStatusSchema = z.enum(["active", "archived"]);

export const createSheetSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});

export const updateSheetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: sheetStatusSchema.optional(),
});

export const deleteSheetSchema = z.object({
  sheetId: z.string().uuid(),
});

export type CreateSheetInput = z.infer<typeof createSheetSchema>;
export type UpdateSheetInput = z.infer<typeof updateSheetSchema>;
export type DeleteSheetInput = z.infer<typeof deleteSheetSchema>;
