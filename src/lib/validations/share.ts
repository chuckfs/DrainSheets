import { z } from "zod";

export const shareResourceTypeSchema = z.enum(["workspace", "folder", "sheet"]);

export const accessRoleSchema = z.enum(["viewer", "commenter", "editor", "admin", "owner"]);

export const createShareSchema = z.object({
  resourceType: shareResourceTypeSchema,
  resourceId: z.string().uuid(),
  granteeId: z.string().uuid(),
  role: z.enum(["viewer", "commenter", "editor", "admin"]),
});

export const updateShareRoleSchema = z.object({
  shareId: z.string().uuid(),
  role: z.enum(["viewer", "commenter", "editor", "admin"]),
});

export const revokeShareSchema = z.object({
  shareId: z.string().uuid(),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
export type UpdateShareRoleInput = z.infer<typeof updateShareRoleSchema>;
