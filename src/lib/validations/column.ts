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

export const updateColumnLabelSchema = z.object({
  columnId: z.string().uuid(),
  label: z.string().min(1).max(200),
});

export const moveColumnSchema = z.object({
  columnId: z.string().uuid(),
  direction: z.enum(["left", "right"]),
});

export const selectOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(64).optional(),
  color: z.string().max(32).optional(),
});

export const updateColumnConfigSchema = z.object({
  columnId: z.string().uuid(),
  config: z.object({
    options: z.array(selectOptionSchema),
  }),
});

export const updateColumnNumericConfigSchema = z.object({
  columnId: z.string().uuid(),
  decimals: z.number().int().min(0).max(6),
});

export const updateColumnHiddenSchema = z.object({
  columnId: z.string().uuid(),
  isHidden: z.boolean(),
});

export const updateColumnTypeSchema = z.object({
  columnId: z.string().uuid(),
  type: columnTypeSchema,
});

export const unhideAllColumnsSchema = z.object({
  sheetId: z.string().uuid(),
});

export const updateColumnWidthSchema = z.object({
  columnId: z.string().uuid(),
  width: z.number().int().min(60).max(800),
});

export const deleteColumnSchema = z.object({
  columnId: z.string().uuid(),
});

export type UpdateColumnLabelInput = z.infer<typeof updateColumnLabelSchema>;
export type MoveColumnInput = z.infer<typeof moveColumnSchema>;
export type UpdateColumnConfigInput = z.infer<typeof updateColumnConfigSchema>;
export type UpdateColumnWidthInput = z.infer<typeof updateColumnWidthSchema>;
