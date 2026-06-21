import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  color: z.string().max(50).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
});

export const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;
