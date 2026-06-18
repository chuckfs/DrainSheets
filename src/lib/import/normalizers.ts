import type { ColumnMapping, ImportFieldKey } from "@/lib/import/mapping";
import type { ImportRow } from "@/lib/import/parser";
import type { ImportMode, ImportTemplate } from "@/lib/validations/import";
import { PROSPECT_STATUSES } from "@/lib/validations/import";

function asString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeWebsite(value: string): string {
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
}

function normalizeProspectStatus(value: string): string {
  if (!value) {
    return "";
  }
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if ((PROSPECT_STATUSES as readonly string[]).includes(normalized)) {
    return normalized;
  }
  const aliases: Record<string, (typeof PROSPECT_STATUSES)[number]> = {
    research: "researching",
    researching: "researching",
    contacted: "contacted",
    contact: "contacted",
    interested: "interested",
    pass: "passed",
    passed: "passed",
    closed: "closed",
    close: "closed",
  };
  return aliases[normalized] ?? "";
}

function normalizePropertyStatus(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "archived" || normalized === "archive") {
    return "archived";
  }
  if (normalized === "active") {
    return "active";
  }
  return "";
}

function splitContactName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { first_name: "", last_name: "" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0] ?? "", last_name: "" };
  }
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };
}

function assignField(
  target: Record<string, string>,
  field: ImportFieldKey,
  value: string,
): void {
  if (!value) {
    return;
  }

  if (field === "website") {
    target.website = normalizeWebsite(value);
    return;
  }

  if (field === "status" && target.status === undefined) {
    target.status = value;
    return;
  }

  if (field === "description" && target.description) {
    target.description = `${target.description}\n${value}`;
    return;
  }

  if (!target[field]) {
    target[field] = value;
  }
}

export function mapRowToRecord(
  row: ImportRow,
  mapping: ColumnMapping,
  mode: ImportMode,
  template: ImportTemplate = "none",
): Record<string, string> {
  const record: Record<string, string> = {};

  for (const [column, field] of Object.entries(mapping)) {
    if (!field) {
      continue;
    }
    const raw = asString(row[column]);
    if (!raw) {
      continue;
    }
    assignField(record, field, raw);
  }

  if (mode === "contact" && record.first_name && !record.last_name) {
    const split = splitContactName(record.first_name);
    record.first_name = split.first_name;
    if (!record.last_name) {
      record.last_name = split.last_name;
    }
  }

  if (mode === "property") {
    if (!record.name && record.address) {
      record.name = record.address.slice(0, 200);
    }
    if (record.status) {
      record.status = normalizePropertyStatus(record.status) || "active";
    } else {
      record.status = "active";
    }
    if (template === "property_search") {
      const financialParts: string[] = [];
      for (const column of ["Purchase Price", "PPSF", "NNN Expenses"]) {
        const value = asString(row[column]);
        if (value) {
          financialParts.push(`${column}: ${value}`);
        }
      }
      if (financialParts.length > 0) {
        record.description = [record.description, financialParts.join(" | ")].filter(Boolean).join("\n");
      }
    }
  }

  if (mode === "prospect" && record.status) {
    record.status = normalizeProspectStatus(record.status);
  }

  return record;
}

export function mapRowsToRecords(
  rows: ImportRow[],
  mapping: ColumnMapping,
  mode: ImportMode,
  template: ImportTemplate = "none",
): Record<string, string>[] {
  return rows.map((row) => mapRowToRecord(row, mapping, mode, template));
}
