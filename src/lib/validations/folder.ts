import { z } from "zod";

export const createFolderSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  parentFolderId: z.string().uuid().nullable().optional(),
});

export const deleteFolderSchema = z.object({
  folderId: z.string().uuid(),
});

export const moveFolderSchema = z.object({
  folderId: z.string().uuid(),
  targetParentFolderId: z.string().uuid().nullable(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
