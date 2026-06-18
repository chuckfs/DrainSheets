"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { dedupeKeyForRecord, normalizeDedupeKey } from "@/lib/import/dedupe";
import type { ColumnMapping } from "@/lib/import/mapping";
import { mapRowsToRecords } from "@/lib/import/normalizers";
import type { ImportRow } from "@/lib/import/parser";
import { canEditContact } from "@/lib/permissions/contact";
import { canCreateProperty, canEditProspect } from "@/lib/permissions/property";
import { createClient } from "@/lib/supabase/server";
import {
  contactInputToRow,
  propertyInputToRow,
  prospectInputToRow,
} from "@/lib/validations/crm";
import {
  executeImportSchema,
  type ExecuteImportInput,
  type ImportMode,
  type ImportResult,
  validateImportRecord,
} from "@/lib/validations/import";

const BATCH_SIZE = 50;

export type ImportPropertyOption = { id: string; name: string };
export type ImportProspectOption = {
  id: string;
  company_name: string;
  property_id: string;
  property_name: string | null;
};

export async function listImportProperties(): Promise<ImportPropertyOption[]> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ImportPropertyOption[];
}

export async function listImportProspects(
  propertyId?: string,
): Promise<ImportProspectOption[]> {
  await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("prospects")
    .select("id, company_name, property_id, properties(name)")
    .order("company_name", { ascending: true });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    property_id: row.property_id,
    property_name:
      row.properties && typeof row.properties === "object" && "name" in row.properties
        ? (row.properties.name as string)
        : null,
  }));
}

export async function getExistingDedupeKeys(params: {
  mode: ImportMode;
  propertyId?: string;
  prospectId?: string;
}): Promise<string[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (params.mode === "property") {
    const { data, error } = await supabase.from("properties").select("name").eq("org_id", profile.org_id);
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => row.name);
  }

  if (params.mode === "prospect") {
    if (!params.propertyId) {
      return [];
    }
    const { data, error } = await supabase
      .from("prospects")
      .select("company_name")
      .eq("property_id", params.propertyId);
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => row.company_name);
  }

  if (!params.prospectId) {
    return [];
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("email")
    .eq("prospect_id", params.prospectId)
    .not("email", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email));
}

async function assertImportPermission(
  profile: Awaited<ReturnType<typeof requireProfile>>,
  mode: ImportMode,
): Promise<ActionResult<ImportResult> | null> {
  if (mode === "property" && !canCreateProperty(profile)) {
    return actionError("You do not have permission to import properties");
  }
  if (mode === "prospect" && !canEditProspect(profile)) {
    return actionError("You do not have permission to import prospects");
  }
  if (mode === "contact" && !canEditContact(profile)) {
    return actionError("You do not have permission to import contacts");
  }
  return null;
}

async function assertImportContext(
  mode: ImportMode,
  propertyId?: string,
  prospectId?: string,
): Promise<ActionResult<ImportResult> | null> {
  const supabase = await createClient();

  if (mode === "prospect") {
    if (!propertyId) {
      return actionError("Select a property before importing prospects");
    }
    const { data, error } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .maybeSingle();
    if (error || !data) {
      return actionError("Property not found or not accessible");
    }
  }

  if (mode === "contact") {
    if (!prospectId) {
      return actionError("Select a prospect before importing contacts");
    }
    const { data, error } = await supabase
      .from("prospects")
      .select("id, property_id")
      .eq("id", prospectId)
      .maybeSingle();
    if (error || !data) {
      return actionError("Prospect not found or not accessible");
    }
  }

  return null;
}

export async function executeImport(
  input: ExecuteImportInput,
): Promise<ActionResult<ImportResult>> {
  const profile = await requireProfile();
  const parsed = executeImportSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid import request");
  }

  const { mode, rows, columnMapping, skipDuplicates, propertyId, prospectId, template } =
    parsed.data;

  const permissionError = await assertImportPermission(profile, mode);
  if (permissionError) {
    return permissionError;
  }

  const contextError = await assertImportContext(mode, propertyId, prospectId);
  if (contextError) {
    return contextError;
  }

  const existingKeys = await getExistingDedupeKeys({ mode, propertyId, prospectId });
  const existingKeySet = new Set(existingKeys.map(normalizeDedupeKey));
  const seenInFile = new Set<string>();

  const mapping = columnMapping as ColumnMapping;
  const records = mapRowsToRecords(rows as ImportRow[], mapping, mode, template ?? "none");

  const result: ImportResult = {
    created: 0,
    skipped: 0,
    errors: 0,
    errorRows: [],
  };

  const supabase = await createClient();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) {
      continue;
    }

    const validation = validateImportRecord(mode, record);
    if (!validation.success) {
      result.errors += 1;
      result.errorRows.push({
        rowIndex: index + 1,
        message: validation.error,
        data: record,
      });
      continue;
    }

    const dedupeKey = dedupeKeyForRecord(mode, record);
    if (dedupeKey) {
      const normalizedKey = normalizeDedupeKey(dedupeKey);
      const duplicateInFile = seenInFile.has(normalizedKey);
      const duplicateExisting = existingKeySet.has(normalizedKey);

      if (skipDuplicates && (duplicateInFile || duplicateExisting)) {
        result.skipped += 1;
        continue;
      }

      seenInFile.add(normalizedKey);
    }

    try {
      if (mode === "property") {
        const data = validation.data as import("@/lib/validations/import").PropertyImportInput;
        const { data: inserted, error } = await supabase
          .from("properties")
          .insert({
            ...propertyInputToRow(data),
            org_id: profile.org_id,
            created_by: profile.id,
            status: data.status ?? "active",
          })
          .select("id")
          .single();

        if (error || !inserted) {
          result.errors += 1;
          result.errorRows.push({
            rowIndex: index + 1,
            message: error?.message ?? "Failed to create property",
            data: record,
          });
          continue;
        }

        if (dedupeKey) {
          existingKeySet.add(normalizeDedupeKey(dedupeKey));
        }

        await logActivity({
          orgId: profile.org_id,
          userId: profile.id,
          entityType: "property",
          entityId: inserted.id,
          propertyId: inserted.id,
          action: "created",
          metadata: { name: data.name, source: "import" },
        });
        result.created += 1;
        continue;
      }

      if (mode === "prospect") {
        const data = validation.data as import("@/lib/validations/import").ProspectImportInput;
        const { data: inserted, error } = await supabase
          .from("prospects")
          .insert({
            ...prospectInputToRow(data),
            property_id: propertyId!,
          })
          .select("id")
          .single();

        if (error || !inserted) {
          result.errors += 1;
          result.errorRows.push({
            rowIndex: index + 1,
            message: error?.message ?? "Failed to create prospect",
            data: record,
          });
          continue;
        }

        if (dedupeKey) {
          existingKeySet.add(normalizeDedupeKey(dedupeKey));
        }

        await logActivity({
          orgId: profile.org_id,
          userId: profile.id,
          entityType: "prospect",
          entityId: inserted.id,
          propertyId: propertyId!,
          action: "created",
          metadata: { company_name: data.company_name, source: "import" },
        });
        result.created += 1;
        continue;
      }

      const data = validation.data as import("@/lib/validations/import").ContactImportInput;
      const prospect = await supabase
        .from("prospects")
        .select("property_id")
        .eq("id", prospectId!)
        .maybeSingle();

      const { data: inserted, error } = await supabase
        .from("contacts")
        .insert({
          ...contactInputToRow(data),
          prospect_id: prospectId!,
          org_id: profile.org_id,
          created_by: profile.id,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        result.errors += 1;
        result.errorRows.push({
          rowIndex: index + 1,
          message: error?.message ?? "Failed to create contact",
          data: record,
        });
        continue;
      }

      if (dedupeKey) {
        existingKeySet.add(normalizeDedupeKey(dedupeKey));
      }

      await logActivity({
        orgId: profile.org_id,
        userId: profile.id,
        entityType: "contact",
        entityId: inserted.id,
        propertyId: prospect.data?.property_id ?? null,
        action: "created",
        metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          prospect_id: prospectId!,
          source: "import",
        },
      });
      result.created += 1;
    } catch (error) {
      result.errors += 1;
      result.errorRows.push({
        rowIndex: index + 1,
        message: error instanceof Error ? error.message : "Import failed",
        data: record,
      });
    }

    if ((index + 1) % BATCH_SIZE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  revalidatePath("/properties");
  revalidatePath("/prospects");
  revalidatePath("/contacts");
  revalidatePath("/");

  if (propertyId) {
    revalidatePath(`/properties/${propertyId}`);
  }
  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`);
  }

  return actionSuccess(result);
}

export async function previewImportKeys(input: {
  mode: ImportMode;
  propertyId?: string;
  prospectId?: string;
}): Promise<string[]> {
  return getExistingDedupeKeys(input);
}
