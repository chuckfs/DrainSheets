"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteDocument,
  listDocuments,
  renameDocument,
  type DocumentScope,
  type DocumentWithUploader,
} from "@/actions/documents";
import type { AccessContext } from "@/lib/access/effective-role";
import { hasAccessRole } from "@/lib/permissions/roles";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentPreviewDialog } from "./document-preview-dialog";

function formatFileSize(bytes: number | null): string {
  if (!bytes) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  access,
  currentUserId,
  onChange,
}: {
  documents: DocumentWithUploader[];
  access: AccessContext;
  currentUserId: string;
  onChange: () => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function canDelete(document: DocumentWithUploader): boolean {
    if (!access.effectiveRole) {
      return false;
    }
    return (
      hasAccessRole(access.effectiveRole, "admin") || document.uploaded_by === currentUserId
    );
  }

  function canRename(document: DocumentWithUploader): boolean {
    return access.canEdit || canDelete(document);
  }

  async function handleRename(documentId: string) {
    const result = await renameDocument(documentId, renameValue);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("File renamed");
    setRenamingId(null);
    onChange();
  }

  async function handleDelete(documentId: string) {
    const result = await deleteDocument(documentId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Attachment deleted");
    onChange();
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No attachments yet"
        description="Upload files to keep contracts, photos, and reference documents with this sheet."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {documents.map((document) => (
          <li key={document.id} className="rounded-lg border p-3">
            {renamingId === document.id ? (
              <div className="flex gap-2">
                <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                <Button type="button" size="sm" onClick={() => void handleRename(document.id)}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    className="truncate text-left text-sm font-medium hover:underline"
                    onClick={() => setPreviewId(document.id)}
                  >
                    {document.file_name}
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(document.file_size)}
                    {document.uploader?.name ? ` · ${document.uploader.name}` : ""}
                  </p>
                  {document.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{document.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {canRename(document) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRenamingId(document.id);
                        setRenameValue(document.file_name);
                      }}
                    >
                      Rename
                    </Button>
                  )}
                  {canDelete(document) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(document.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <DocumentPreviewDialog
        documentId={previewId}
        open={Boolean(previewId)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewId(null);
          }
        }}
      />
    </>
  );
}

export function useDocumentsLoader(
  sheetId: string,
  scope: DocumentScope,
  rowId?: string | null,
) {
  const [documents, setDocuments] = useState<DocumentWithUploader[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await listDocuments(sheetId, scope, rowId ?? null);
      setDocuments(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load attachments");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [sheetId, scope, rowId]);

  return { documents, loading, reload };
}
