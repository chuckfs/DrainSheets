"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { getSheetActivityContext, logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  deleteDocumentSchema,
  renameDocumentSchema,
  uploadDocumentSchema,
} from "@/lib/validations/document";
import type { Document, Profile } from "@/types/domain";

const DOCUMENTS_BUCKET = "documents";
const MAX_FILE_SIZE = 26_214_400;

export type DocumentWithUploader = Document & {
  uploader: Pick<Profile, "id" | "name" | "email"> | null;
};

export type DocumentScope = "all" | "sheet" | "row";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.\-() ]+/g, "_").trim() || "upload";
}

function buildStoragePath(orgId: string, sheetId: string, documentId: string, fileName: string): string {
  return `${orgId}/${sheetId}/${documentId}_${sanitizeFileName(fileName)}`;
}

export async function listDocuments(
  sheetId: string,
  scope: DocumentScope = "all",
  rowId?: string | null,
): Promise<DocumentWithUploader[]> {
  await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey (
        id,
        name,
        email
      )
    `,
    )
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (scope === "sheet") {
    query = query.is("row_id", null);
  } else if (scope === "row" && rowId) {
    query = query.eq("row_id", rowId);
  } else if (scope === "row") {
    query = query.not("row_id", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((document) => ({
    ...document,
    uploader: (document.uploader as DocumentWithUploader["uploader"]) ?? null,
  }));
}

export async function uploadDocument(formData: FormData): Promise<ActionResult<DocumentWithUploader>> {
  const profile = await requireProfile();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return actionError("File is required");
  }

  const parsed = uploadDocumentSchema.safeParse({
    sheetId: formData.get("sheetId"),
    rowId: formData.get("rowId") || null,
    description: formData.get("description") || null,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid upload");
  }

  if (file.size <= 0) {
    return actionError("File is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    return actionError("File exceeds 25 MB limit");
  }

  const documentId = randomUUID();
  const fileName = sanitizeFileName(file.name);
  const filePath = buildStoragePath(profile.org_id, parsed.data.sheetId, documentId, fileName);
  const supabase = await createClient();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return actionError(uploadError.message);
  }

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      org_id: profile.org_id,
      sheet_id: parsed.data.sheetId,
      row_id: parsed.data.rowId ?? null,
      file_name: fileName,
      file_path: filePath,
      mime_type: file.type || null,
      file_size: file.size,
      description: parsed.data.description ?? null,
      uploaded_by: profile.id,
    })
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey (
        id,
        name,
        email
      )
    `,
    )
    .single();

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(parsed.data.sheetId);
  if (context) {
    await logActivityEvent({
      entityType: "document",
      entityId: document.id,
      action: "uploaded",
      workspaceId: context.workspaceId,
      sheetId: parsed.data.sheetId,
      rowId: parsed.data.rowId ?? null,
      metadata: { file_name: fileName },
    });
  }

  revalidatePath(`/sheets/${parsed.data.sheetId}`);
  return actionSuccess({
    ...document,
    uploader: (document.uploader as DocumentWithUploader["uploader"]) ?? null,
  });
}

export async function renameDocument(
  documentId: string,
  fileName: string,
): Promise<ActionResult<DocumentWithUploader>> {
  await requireProfile();
  const parsed = renameDocumentSchema.safeParse({ documentId, fileName });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid file name");
  }

  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("documents")
    .update({ file_name: parsed.data.fileName })
    .eq("id", documentId)
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey (
        id,
        name,
        email
      )
    `,
    )
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${document.sheet_id}`);
  return actionSuccess({
    ...document,
    uploader: (document.uploader as DocumentWithUploader["uploader"]) ?? null,
  });
}

export async function deleteDocument(documentId: string): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = deleteDocumentSchema.safeParse({ documentId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid document");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("documents")
    .select("sheet_id, row_id, file_path, file_name")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([existing.file_path]);

  if (storageError) {
    return actionError(storageError.message);
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(existing.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "document",
      entityId: documentId,
      action: "deleted",
      workspaceId: context.workspaceId,
      sheetId: existing.sheet_id,
      rowId: existing.row_id,
      metadata: { file_name: existing.file_name },
    });
  }

  revalidatePath(`/sheets/${existing.sheet_id}`);
  return actionSuccess({ sheetId: existing.sheet_id });
}

export async function getDocumentSignedUrl(documentId: string): Promise<ActionResult<{ url: string }>> {
  await requireProfile();
  const supabase = await createClient();

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.file_path, 60 * 10);

  if (error || !data?.signedUrl) {
    return actionError(error?.message ?? "Failed to create preview URL");
  }

  return actionSuccess({ url: data.signedUrl });
}
