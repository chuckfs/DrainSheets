import type { TemplateColumnDefinition } from "@/lib/validations/template";
import type { ColumnMappingEntry } from "./types";

const ALIAS_GROUPS: Record<string, string[]> = {
  company: ["company", "tenant/company", "tenant company", "organization", "business"],
  contact: ["contact", "contact name", "contact email", "primary contact"],
  status: ["status", "pipeline status"],
  use: ["use", "category", "type", "tenant use"],
  website: ["website", "url", "site", "web"],
  comments: ["comments", "notes", "comment"],
  address: ["address", "property address", "street address", "location"],
  purchase_price: ["purchase price", "price", "purchase_price", "acquisition price"],
  ppsf: ["ppsf", "price per sf", "price/sf", "price per square foot"],
  nnn: ["nnn", "nnn expenses", "expenses"],
  stage: ["stage", "deal stage", "pipeline stage"],
  first_name: ["first name", "firstname", "given name", "contact name"],
  last_name: ["last name", "lastname", "surname", "family name"],
  email: ["email", "email address", "e-mail"],
  phone: ["phone", "phone number", "mobile", "cell"],
  title: ["title", "job title", "role"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function autoMapToTemplateColumns(
  sourceHeaders: string[],
  templateColumns: TemplateColumnDefinition[],
): Record<string, ColumnMappingEntry> {
  const mapping: Record<string, ColumnMappingEntry> = {};

  for (const header of sourceHeaders) {
    const normalized = normalizeHeader(header);
    let targetKey: string | null = null;

    for (const column of templateColumns) {
      const aliases = ALIAS_GROUPS[column.key] ?? [column.key.replace(/_/g, " "), column.label.toLowerCase()];
      if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        targetKey = column.key;
        break;
      }
    }

    mapping[header] = {
      sourceHeader: header,
      targetKey,
    };
  }

  return mapping;
}

export function isTemplateMappingComplete(
  mapping: Record<string, ColumnMappingEntry>,
  templateColumns: TemplateColumnDefinition[],
): boolean {
  const requiredKeys = templateColumns.filter((column) => column.is_primary).map((column) => column.key);
  const mappedKeys = new Set(
    Object.values(mapping)
      .map((entry) => entry.targetKey)
      .filter((key): key is string => Boolean(key)),
  );

  return requiredKeys.every((key) => mappedKeys.has(key));
}
