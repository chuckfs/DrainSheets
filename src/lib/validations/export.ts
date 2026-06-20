import { z } from "zod";
import { rowFilterConditionSchema } from "@/lib/validations/sheet-view";

export const exportSheetSchema = z.object({
  sheetId: z.string().uuid(),
  format: z.enum(["csv", "xlsx"]),
  filters: z.array(rowFilterConditionSchema).optional(),
  includeHidden: z.boolean().optional(),
});

export type ExportSheetInput = z.infer<typeof exportSheetSchema>;
