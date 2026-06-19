import { z } from "zod";

export const renameDocumentSchema = z.object({
  documentId: z.string().uuid(),
  fileName: z.string().trim().min(1, "File name is required").max(255),
});

export const deleteDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

export const uploadDocumentSchema = z.object({
  sheetId: z.string().uuid(),
  rowId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});
