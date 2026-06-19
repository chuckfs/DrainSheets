import { z } from "zod";

export const createFolderSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  parentFolderId: z.string().uuid().nullable().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
