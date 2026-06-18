import { z } from "zod";
import {
  contactSchema,
  propertySchema,
  prospectSchema,
  PROSPECT_STATUSES,
} from "@/lib/validations/crm";

export const IMPORT_MODES = ["property", "prospect", "contact"] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];

export const IMPORT_TEMPLATES = ["tenant_prospect", "property_search", "none"] as const;
export type ImportTemplate = (typeof IMPORT_TEMPLATES)[number];

export const PROPERTY_STATUSES = ["active", "archived"] as const;

export const propertyImportSchema = propertySchema.extend({
  status: z.enum(PROPERTY_STATUSES).optional(),
});

export type PropertyImportInput = z.infer<typeof propertyImportSchema>;
export type ProspectImportInput = z.infer<typeof prospectSchema>;
export type ContactImportInput = z.infer<typeof contactSchema>;

export const importRowSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]),
);

export const columnMappingSchema = z.record(z.string(), z.string().nullable());

export const executeImportSchema = z.object({
  mode: z.enum(IMPORT_MODES),
  template: z.enum(IMPORT_TEMPLATES).optional(),
  propertyId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  skipDuplicates: z.boolean().default(true),
  columnMapping: columnMappingSchema,
  rows: z.array(importRowSchema).min(1).max(5000),
});

export type ExecuteImportInput = z.infer<typeof executeImportSchema>;

export type ImportErrorRow = {
  rowIndex: number;
  message: string;
  data?: Record<string, string>;
};

export type ImportResult = {
  created: number;
  skipped: number;
  errors: number;
  errorRows: ImportErrorRow[];
};

export function validateImportRecord(
  mode: ImportMode,
  record: Record<string, unknown>,
):
  | { success: true; data: PropertyImportInput | ProspectImportInput | ContactImportInput }
  | { success: false; error: string } {
  if (mode === "property") {
    const parsed = propertyImportSchema.safeParse(record);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid property" };
    }
    return { success: true, data: parsed.data };
  }

  if (mode === "prospect") {
    const parsed = prospectSchema.safeParse(record);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid prospect" };
    }
    return { success: true, data: parsed.data };
  }

  const parsed = contactSchema.safeParse(record);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid contact" };
  }
  return { success: true, data: parsed.data };
}

export { PROSPECT_STATUSES };
