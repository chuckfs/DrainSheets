"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteDocumentVersion,
  getDocumentVersionSignedUrl,
  listDocumentVersions,
  restoreDocumentVersion,
  uploadDocumentVersion,
  type DocumentVersionWithUploader,
} from "@/actions/documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function DocumentVersionsDialog({
  documentId,
  documentName,
  currentVersion,
  canEdit,
  canManage,
  open,
  onOpenChange,
  onChanged,
}: {
  documentId: string;
  documentName: string;
  currentVersion: number;
  canEdit: boolean;
  canManage: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [versions, setVersions] = useState<DocumentVersionWithUploader[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    setLoading(true);
    void listDocumentVersions(documentId)
      .then(setVersions)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  function handleDownload(versionId: string) {
    startTransition(async () => {
      const result = await getDocumentVersionSignedUrl(versionId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data?.url) {
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    });
  }

  function handleRestore(versionId: string) {
    startTransition(async () => {
      const result = await restoreDocumentVersion(versionId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Version restored as current");
      refresh();
      onChanged();
    });
  }

  function handleDelete(versionId: string) {
    startTransition(async () => {
      const result = await deleteDocumentVersion(versionId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Version deleted");
      refresh();
      onChanged();
    });
  }

  function handleUploadNewVersion(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);
    void uploadDocumentVersion(documentId, formData)
      .then((result) => {
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(`Uploaded version ${result.data?.versionNo ?? ""}`.trim());
        refresh();
        onChanged();
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">Version history — {documentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {canEdit && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-3">
              <div className="text-sm">
                <div className="font-medium">Upload a new version</div>
                <div className="text-xs text-muted-foreground">
                  The new file becomes current; older versions stay in history.
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Choose file"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUploadNewVersion}
              />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading versions…</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions recorded.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {versions.map((version) => {
                const isCurrent = version.version_no === currentVersion;
                return (
                  <li key={version.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">v{version.version_no}</span>
                        {isCurrent && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Current
                          </span>
                        )}
                        <span className="truncate text-xs text-muted-foreground">
                          {version.file_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatFileSize(version.file_size)}
                        {version.uploader?.name ? ` · ${version.uploader.name}` : ""} ·{" "}
                        {formatDate(version.created_at)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleDownload(version.id)}
                      >
                        Download
                      </Button>
                      {canEdit && !isCurrent && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleRestore(version.id)}
                        >
                          Restore
                        </Button>
                      )}
                      {canManage && !isCurrent && versions.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(version.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
