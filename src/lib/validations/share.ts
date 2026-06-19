import { z } from "zod";

export const shareResourceTypeSchema = z.enum(["workspace", "folder", "sheet"]);

export const accessRoleSchema = z.enum(["viewer", "commenter", "editor", "admin", "owner"]);

export const createShareSchema = z.object({
  resourceType: shareResourceTypeSchema,
  resourceId: z.string().uuid(),
  granteeId: z.string().uuid(),
  role: accessRoleSchema,
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
