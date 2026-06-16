"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { SIGNED_URL_EXPIRY_SECONDS } from "@/lib/documents/constants";
import { buildDocumentStoragePath } from "@/lib/documents/paths";
import { canDeleteDocument, canUploadDocument } from "@/lib/permissions/document";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  documentFinalizeSchema,
  documentUploadMetaSchema,
} from "@/lib/validations/documents";
import type { Document } from "@/types/domain";
import { randomUUID } from "crypto";

const PAGE_SIZE = 20;

type ProfileRef = {
  id: string;
  name: string;
  email: string;
};

type PropertyRef = {
  id: string;
  name: string;
};

type ProspectRef = {
  id: string;
  company_name: string;
};

export type DocumentWithRelations = Document & {
  profiles: ProfileRef | null;
  properties: PropertyRef | null;
  prospects: ProspectRef | null;
};

export type DocumentListParams = {
  q?: string;
  propertyId?: string;
  prospectId?: string;
  sort?: "file_name" | "created_at" | "file_size";
  order?: "asc" | "desc";
  page?: number;
};

const documentSelect =
  "*, profiles:uploaded_by(id, name, email), properties(id, name), prospects(id, company_name)";

async function validateProspectForProperty<T = void>(
  propertyId: string,
  prospectId: string | null | undefined,
): Promise<ActionResult<T> | null> {
  if (!prospectId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id")
    .eq("id", prospectId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    return actionError<T>(error.message);
  }

  if (!data) {
    return actionError<T>("Prospect does not belong to this property");
  }

  return null;
}

async function verifyStorageObject(storagePath: string): Promise<boolean> {
  const admin = createAdminClient();
  const folder = storagePath.split("/").slice(0, -1).join("/");
  const fileName = storagePath.split("/").pop() ?? "";

  const { data, error } = await admin.storage.from("documents").list(folder, {
    search: fileName,
  });

  if (error) {
    return false;
  }

  return (data ?? []).some((item) => item.name === fileName);
}

export async function prepareDocumentUpload(input: {
  propertyId: string;
  prospectId?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
}): Promise<ActionResult<{ documentId: string; storagePath: string }>> {
  const profile = await requireProfile();

  if (!canUploadDocument(profile)) {
    return actionError("You do not have permission to upload documents");
  }

  const parsed = documentUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid upload");
  }

  const prospectError = await validateProspectForProperty<{
    documentId: string;
    storagePath: string;
  }>(parsed.data.propertyId, parsed.data.prospectId);
  if (prospectError) {
    return prospectError;
  }

  const supabase = await createClient();
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();

  if (propertyError || !property) {
    return actionError("Property not found");
  }

  const documentId = randomUUID();
  const storagePath = buildDocumentStoragePath({
    orgId: profile.org_id,
    propertyId: parsed.data.propertyId,
    prospectId: parsed.data.prospectId,
    documentId,
    fileName: parsed.data.fileName,
  });

  return actionSuccess({ documentId, storagePath });
}

export async function uploadDocument(input: {
  documentId: string;
  propertyId: string;
  prospectId?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
}): Promise<ActionResult<{ documentId: string }>> {
  const profile = await requireProfile();

  if (!canUploadDocument(profile)) {
    return actionError("You do not have permission to upload documents");
  }

  const parsed = documentFinalizeSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid upload");
  }

  const prospectError = await validateProspectForProperty<{ documentId: string }>(
    parsed.data.propertyId,
    parsed.data.prospectId,
  );
  if (prospectError) {
    return prospectError;
  }

  const exists = await verifyStorageObject(parsed.data.storagePath);
  if (!exists) {
    return actionError("Uploaded file not found in storage");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: parsed.data.documentId,
      org_id: profile.org_id,
      property_id: parsed.data.propertyId,
      prospect_id: parsed.data.prospectId,
      file_name: parsed.data.fileName,
      file_path: parsed.data.storagePath,
      mime_type: parsed.data.mimeType,
      file_size: parsed.data.fileSize,
      uploaded_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    const admin = createAdminClient();
    await admin.storage.from("documents").remove([parsed.data.storagePath]);
    return actionError(error?.message ?? "Failed to save document metadata");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "document",
    entityId: data.id,
    propertyId: parsed.data.propertyId,
    action: "uploaded",
    metadata: {
      file_name: parsed.data.fileName,
      prospect_id: parsed.data.prospectId,
    },
  });

  revalidatePath(`/properties/${parsed.data.propertyId}`);
  if (parsed.data.prospectId) {
    revalidatePath(`/prospects/${parsed.data.prospectId}`);
  }
  revalidatePath("/documents");
  revalidatePath("/");

  return actionSuccess({ documentId: data.id });
}

export async function getDocument(id: string): Promise<DocumentWithRelations | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeDocumentRow(data);
}

export async function getDocumentsForProperty(
  propertyId: string,
): Promise<DocumentWithRelations[]> {
  const { documents } = await listDocuments({ propertyId, page: 1, pageSize: 100 });
  return documents;
}

export async function getDocumentsForProspect(
  prospectId: string,
): Promise<DocumentWithRelations[]> {
  const { documents } = await listDocuments({ prospectId, page: 1, pageSize: 100 });
  return documents;
}

export async function listDocuments(params: DocumentListParams & { pageSize?: number } = {}) {
  await requireProfile();
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const sort = params.sort ?? "created_at";
  const order = params.order ?? "desc";
  const ascending = order === "asc";

  let query = supabase
    .from("documents")
    .select(documentSelect, { count: "exact" })
    .order(sort, { ascending });

  if (params.propertyId) {
    query = query.eq("property_id", params.propertyId);
  }

  if (params.prospectId) {
    query = query.eq("prospect_id", params.prospectId);
  }

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.ilike("file_name", term);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    documents: (data ?? []).map(normalizeDocumentRow),
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

function normalizeDocumentRow(row: Record<string, unknown>): DocumentWithRelations {
  const profiles = row.profiles;
  const properties = row.properties;
  const prospects = row.prospects;

  return {
    ...(row as unknown as Document),
    profiles: Array.isArray(profiles) ? profiles[0] ?? null : (profiles as ProfileRef | null),
    properties: Array.isArray(properties)
      ? properties[0] ?? null
      : (properties as PropertyRef | null),
    prospects: Array.isArray(prospects) ? prospects[0] ?? null : (prospects as ProspectRef | null),
  };
}

export async function generateDownloadUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, file_path, file_name, property_id, prospect_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return actionError(error.message);
  }

  if (!document) {
    return actionError("Document not found");
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signed?.signedUrl) {
    return actionError(signError?.message ?? "Failed to generate download URL");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "document",
    entityId: document.id,
    propertyId: document.property_id,
    action: "downloaded",
    metadata: {
      file_name: document.file_name,
      prospect_id: document.prospect_id,
    },
  });

  return actionSuccess({ url: signed.signedUrl });
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, file_path, file_name, property_id, prospect_id, uploaded_by")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return actionError(error.message);
  }

  if (!document) {
    return actionError("Document not found");
  }

  if (!canDeleteDocument(profile, document)) {
    return actionError("You do not have permission to delete this document");
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([document.file_path]);

  if (storageError) {
    return actionError(storageError.message);
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);

  if (deleteError) {
    return actionError(deleteError.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "document",
    entityId: document.id,
    propertyId: document.property_id,
    action: "deleted",
    metadata: {
      file_name: document.file_name,
      prospect_id: document.prospect_id,
    },
  });

  revalidatePath(`/properties/${document.property_id}`);
  if (document.prospect_id) {
    revalidatePath(`/prospects/${document.prospect_id}`);
  }
  revalidatePath("/documents");
  revalidatePath("/");

  return { success: true };
}

export async function getDocumentCount() {
  await requireProfile();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}
