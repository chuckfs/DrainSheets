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
import type { Document, DocumentVersion, Profile } from "@/types/domain";

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

  // Record version 1 in history (non-fatal if it fails).
  await supabase.from("document_versions").insert({
    document_id: document.id,
    org_id: profile.org_id,
    version_no: 1,
    file_name: fileName,
    file_path: filePath,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: profile.id,
  });

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

  // Remove every version's file from storage, not just the current one.
  const { data: versionFiles } = await supabase
    .from("document_versions")
    .select("file_path")
    .eq("document_id", documentId);
  const storagePaths = Array.from(
    new Set([existing.file_path, ...(versionFiles ?? []).map((version) => version.file_path)]),
  );

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove(storagePaths);

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

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

export type DocumentVersionWithUploader = DocumentVersion & {
  uploader: Pick<Profile, "id" | "name" | "email"> | null;
};

export async function listDocumentVersions(
  documentId: string,
): Promise<DocumentVersionWithUploader[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_versions")
    .select(
      `
      *,
      uploader:profiles!document_versions_uploaded_by_fkey (
        id,
        name,
        email
      )
    `,
    )
    .eq("document_id", documentId)
    .order("version_no", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((version) => ({
    ...version,
    uploader: (version.uploader as DocumentVersionWithUploader["uploader"]) ?? null,
  }));
}

export async function uploadDocumentVersion(
  documentId: string,
  formData: FormData,
): Promise<ActionResult<{ versionNo: number }>> {
  const profile = await requireProfile();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return actionError("File is required");
  }
  if (file.size <= 0) {
    return actionError("File is empty");
  }
  if (file.size > MAX_FILE_SIZE) {
    return actionError("File exceeds 25 MB limit");
  }

  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, sheet_id, row_id, org_id, version_count")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    return actionError("Document not found");
  }

  const { data: latest } = await supabase
    .from("document_versions")
    .select("version_no")
    .eq("document_id", documentId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version_no ?? 0) + 1;

  const fileName = sanitizeFileName(file.name);
  const filePath = `${document.org_id}/${document.sheet_id}/${documentId}_v${nextVersion}_${fileName}`;
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

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: documentId,
    org_id: document.org_id,
    version_no: nextVersion,
    file_name: fileName,
    file_path: filePath,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: profile.id,
  });
  if (versionError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    return actionError(versionError.message);
  }

  // Promote the new upload to the current version.
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      file_name: fileName,
      file_path: filePath,
      mime_type: file.type || null,
      file_size: file.size,
      current_version: nextVersion,
      version_count: (document.version_count ?? 1) + 1,
    })
    .eq("id", documentId);
  if (updateError) {
    return actionError(updateError.message);
  }

  const context = await getSheetActivityContext(document.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "document",
      entityId: documentId,
      action: "uploaded",
      workspaceId: context.workspaceId,
      sheetId: document.sheet_id,
      rowId: document.row_id,
      metadata: { file_name: fileName, version_no: nextVersion },
    });
  }

  revalidatePath(`/sheets/${document.sheet_id}`);
  return actionSuccess({ versionNo: nextVersion });
}

export async function getDocumentVersionSignedUrl(
  versionId: string,
): Promise<ActionResult<{ url: string }>> {
  await requireProfile();
  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("document_versions")
    .select("file_path")
    .eq("id", versionId)
    .single();
  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(version.file_path, 60 * 10);
  if (error || !data?.signedUrl) {
    return actionError(error?.message ?? "Failed to create download URL");
  }

  return actionSuccess({ url: data.signedUrl });
}

export async function restoreDocumentVersion(
  versionId: string,
): Promise<ActionResult<{ versionNo: number }>> {
  await requireProfile();
  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("document_versions")
    .select("document_id, version_no, file_name, file_path, mime_type, file_size")
    .eq("id", versionId)
    .single();
  if (fetchError || !version) {
    return actionError("Version not found");
  }

  const { data: document } = await supabase
    .from("documents")
    .select("sheet_id, row_id")
    .eq("id", version.document_id)
    .single();

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      file_name: version.file_name,
      file_path: version.file_path,
      mime_type: version.mime_type,
      file_size: version.file_size,
      current_version: version.version_no,
    })
    .eq("id", version.document_id);
  if (updateError) {
    return actionError(updateError.message);
  }

  if (document) {
    const context = await getSheetActivityContext(document.sheet_id);
    if (context) {
      await logActivityEvent({
        entityType: "document",
        entityId: version.document_id,
        action: "updated",
        workspaceId: context.workspaceId,
        sheetId: document.sheet_id,
        rowId: document.row_id,
        metadata: { file_name: version.file_name, version_no: version.version_no, restored: true },
      });
    }
    revalidatePath(`/sheets/${document.sheet_id}`);
  }

  return actionSuccess({ versionNo: version.version_no });
}

export async function deleteDocumentVersion(versionId: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("document_versions")
    .select("document_id, version_no, file_path")
    .eq("id", versionId)
    .single();
  if (fetchError || !version) {
    return actionError("Version not found");
  }

  const { data: document } = await supabase
    .from("documents")
    .select("sheet_id, current_version, version_count")
    .eq("id", version.document_id)
    .single();
  if (!document) {
    return actionError("Document not found");
  }
  if (version.version_no === document.current_version) {
    return actionError("Can't delete the current version — restore another version first.");
  }
  if ((document.version_count ?? 1) <= 1) {
    return actionError("Can't delete the only version");
  }

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([version.file_path]);
  if (storageError) {
    return actionError(storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("document_versions")
    .delete()
    .eq("id", versionId);
  if (deleteError) {
    return actionError(deleteError.message);
  }

  await supabase
    .from("documents")
    .update({ version_count: Math.max((document.version_count ?? 1) - 1, 1) })
    .eq("id", version.document_id);

  revalidatePath(`/sheets/${document.sheet_id}`);
  return actionSuccess();
}
