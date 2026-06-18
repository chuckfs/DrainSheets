import type { ImportMode, ImportTemplate } from "@/lib/validations/import";

export type ImportFieldKey =
  | "name"
  | "address"
  | "city"
  | "state"
  | "description"
  | "status"
  | "company_name"
  | "category"
  | "website"
  | "comments"
  | "property_id"
  | "first_name"
  | "last_name"
  | "company"
  | "email"
  | "phone"
  | "title"
  | "prospect_id";

export type ImportFieldDef = {
  key: ImportFieldKey;
  label: string;
  required: boolean;
};

export type ColumnMapping = Record<string, ImportFieldKey | null>;

export const IMPORT_FIELDS: Record<ImportMode, ImportFieldDef[]> = {
  property: [
    { key: "name", label: "Name", required: true },
    { key: "address", label: "Address", required: false },
    { key: "city", label: "City", required: false },
    { key: "state", label: "State", required: false },
    { key: "description", label: "Description", required: false },
    { key: "status", label: "Status", required: false },
  ],
  prospect: [
    { key: "company_name", label: "Company name", required: true },
    { key: "category", label: "Category / use", required: false },
    { key: "website", label: "Website", required: false },
    { key: "status", label: "Status", required: false },
    { key: "comments", label: "Comments", required: false },
  ],
  contact: [
    { key: "first_name", label: "First name", required: true },
    { key: "last_name", label: "Last name", required: false },
    { key: "company", label: "Company", required: false },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Phone", required: false },
    { key: "title", label: "Title", required: false },
  ],
};

const FIELD_ALIASES: Record<ImportFieldKey, string[]> = {
  name: ["name", "property name", "property", "building name", "site name"],
  address: ["address", "property address", "street", "street address", "location"],
  city: ["city", "town"],
  state: ["state", "province", "region"],
  description: ["description", "notes", "comments", "summary", "purchase price", "ppsf", "nnn expenses", "nnn"],
  status: ["status", "property status"],
  company_name: ["company name", "company", "tenant/company", "tenant company", "tenant", "organization", "org"],
  category: ["category", "use", "tenant use", "type", "property type"],
  website: ["website", "url", "web", "site"],
  comments: ["comments", "notes", "comment"],
  property_id: ["property id", "property"],
  first_name: ["first name", "contact name", "contact", "name", "full name"],
  last_name: ["last name", "surname", "family name"],
  company: ["company", "company name", "tenant/company", "tenant", "organization"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "telephone", "mobile", "cell", "phone number"],
  title: ["title", "job title", "position", "role"],
  prospect_id: ["prospect id", "prospect"],
};

export type ImportTemplateDef = {
  id: ImportTemplate;
  label: string;
  mode: ImportMode;
  mappings: Record<string, ImportFieldKey>;
};

export const IMPORT_TEMPLATE_DEFS: ImportTemplateDef[] = [
  {
    id: "tenant_prospect",
    label: "Tenant Prospect Sheet",
    mode: "prospect",
    mappings: {
      "Tenant/Company": "company_name",
      Use: "category",
      Website: "website",
      "Contact Name": "first_name",
      Title: "title",
    },
  },
  {
    id: "tenant_prospect",
    label: "Tenant Prospect Sheet",
    mode: "contact",
    mappings: {
      "Tenant/Company": "company",
      "Contact Name": "first_name",
      Title: "title",
      Website: "website",
    },
  },
  {
    id: "property_search",
    label: "Property Search Sheet",
    mode: "property",
    mappings: {
      "Property Address": "address",
      "Purchase Price": "description",
      PPSF: "description",
      "NNN Expenses": "description",
    },
  },
];

function normalizeColumnName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreAlias(column: string, alias: string): number {
  const normalizedColumn = normalizeColumnName(column);
  const normalizedAlias = normalizeColumnName(alias);
  if (normalizedColumn === normalizedAlias) {
    return 100;
  }
  if (normalizedColumn.includes(normalizedAlias) || normalizedAlias.includes(normalizedColumn)) {
    return 50;
  }
  return 0;
}

export function autoMapColumns(
  columns: string[],
  mode: ImportMode,
  template: ImportTemplate = "none",
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const fields = IMPORT_FIELDS[mode];
  const validFieldKeys = new Set(fields.map((field) => field.key));
  const usedFields = new Set<ImportFieldKey>();

  const templateDef = IMPORT_TEMPLATE_DEFS.find((item) => item.id === template);
  if (templateDef && templateDef.mode === mode) {
    for (const column of columns) {
      const templateField = templateDef.mappings[column];
      if (templateField && validFieldKeys.has(templateField) && !usedFields.has(templateField)) {
        mapping[column] = templateField;
        usedFields.add(templateField);
      }
    }
  }

  for (const column of columns) {
    if (mapping[column]) {
      continue;
    }

    let bestField: ImportFieldKey | null = null;
    let bestScore = 0;

    for (const field of fields) {
      if (usedFields.has(field.key) || !validFieldKeys.has(field.key)) {
        continue;
      }
      for (const alias of FIELD_ALIASES[field.key]) {
        const score = scoreAlias(column, alias);
        if (score > bestScore) {
          bestScore = score;
          bestField = field.key;
        }
      }
    }

    if (bestField && bestScore >= 50) {
      mapping[column] = bestField;
      usedFields.add(bestField);
    } else {
      mapping[column] = null;
    }
  }

  return mapping;
}

export function invertColumnMapping(mapping: ColumnMapping): Partial<Record<ImportFieldKey, string>> {
  const inverted: Partial<Record<ImportFieldKey, string>> = {};
  for (const [column, field] of Object.entries(mapping)) {
    if (field && !inverted[field]) {
      inverted[field] = column;
    }
  }
  return inverted;
}

export function requiredFieldsForMode(mode: ImportMode): ImportFieldDef[] {
  return IMPORT_FIELDS[mode].filter((field) => field.required);
}

export function isMappingComplete(mapping: ColumnMapping, mode: ImportMode): boolean {
  const mappedFields = new Set(
    Object.values(mapping).filter((value): value is ImportFieldKey => value !== null),
  );
  return requiredFieldsForMode(mode).every((field) => mappedFields.has(field.key));
}
