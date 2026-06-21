import { z } from "zod";

const hexColorSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
const fillPresetSchema = z.string().regex(/^preset:(yellow|blue|green|gray)$/);

export const cellStyleSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  color: hexColorSchema.optional(),
  backgroundColor: z.union([hexColorSchema, fillPresetSchema]).optional(),
});

export const batchUpdateRowStylesSchema = z.object({
  updates: z
    .array(
      z.object({
        rowId: z.string().uuid(),
        styles: z.record(z.string(), cellStyleSchema),
      }),
    )
    .min(1),
});
