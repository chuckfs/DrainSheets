import { z } from "zod";

export const columnTypeSchema = z.enum([
  "text",
  "long_text",
  "number",
  "currency",
  "date",
  "url",
  "email",
  "phone",
  "select",
  "checkbox",
  "contact",
]);

export const createColumnSchema = z.object({
  sheetId: z.string().uuid(),
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Key must be snake_case"),
  label: z.string().min(1).max(200),
  type: columnTypeSchema,
  position: z.number().int().min(0),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
