import type { ImportMode } from "@/lib/validations/import";

export type DedupeScope = {
  existingKeys: Set<string>;
  inFileKeys: Map<string, number>;
};

export function normalizeDedupeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function dedupeKeyForRecord(
  mode: ImportMode,
  record: Record<string, string>,
): string | null {
  if (mode === "property") {
    const name = record.name?.trim();
    return name ? normalizeDedupeKey(name) : null;
  }
  if (mode === "prospect") {
    const company = record.company_name?.trim();
    return company ? normalizeDedupeKey(company) : null;
  }
  const email = record.email?.trim();
  return email ? normalizeDedupeKey(email) : null;
}

export type RowDedupeStatus = "unique" | "duplicate_in_file" | "duplicate_existing";

export function classifyRowDedupe(
  mode: ImportMode,
  record: Record<string, string>,
  scope: DedupeScope,
): RowDedupeStatus {
  const key = dedupeKeyForRecord(mode, record);
  if (!key) {
    return "unique";
  }

  if (scope.existingKeys.has(key)) {
    return "duplicate_existing";
  }

  const firstIndex = scope.inFileKeys.get(key);
  if (firstIndex !== undefined) {
    return "duplicate_in_file";
  }

  scope.inFileKeys.set(key, scope.inFileKeys.size);
  return "unique";
}

export function buildDedupeScope(
  mode: ImportMode,
  existingKeys: string[],
): DedupeScope {
  return {
    existingKeys: new Set(existingKeys.map(normalizeDedupeKey)),
    inFileKeys: new Map(),
  };
}

export function trackingKeyForMode(mode: ImportMode): "name" | "company_name" | "email" {
  if (mode === "property") {
    return "name";
  }
  if (mode === "prospect") {
    return "company_name";
  }
  return "email";
}
