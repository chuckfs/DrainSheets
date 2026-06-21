"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLinkIcon,
  HistoryIcon,
  RotateCcwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import {
  getDocumentSignedUrl,
  getDocumentVersionSignedUrl,
  listDocumentVersions,
  type DocumentVersionWithUploader,
} from "@/actions/documents";
import type { DocumentWithUploader } from "@/actions/documents";
import { getPreviewKind } from "@/lib/documents/preview";
import {
  formatPreviewZoomPercent,
  PREVIEW_ZOOM_DEFAULT,
  stepPreviewZoom,
} from "@/lib/documents/preview-zoom";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentVersionsDialog } from "./document-versions-dialog";
import { DocumentDescriptionEditor } from "./document-description-editor";

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

export function DocumentPreviewDialog({
  document,
  open,
  onOpenChange,
  canEdit = false,
  canManage = false,
  onVersionsChanged,
}: {
  document: DocumentWithUploader | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
  canManage?: boolean;
  onVersionsChanged?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [zoom, setZoom] = useState(PREVIEW_ZOOM_DEFAULT);
  const [versions, setVersions] = useState<DocumentVersionWithUploader[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [description, setDescription] = useState<string | null>(null);

  const previewKind = document ? getPreviewKind(document.mime_type, document.file_name) : "unsupported";
  const canZoom = previewKind === "pdf" || previewKind === "image";
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? null;

  const loadVersions = useCallback(async () => {
    if (!document) {
      return;
    }

    setLoadingVersions(true);
    try {
      const loaded = await listDocumentVersions(document.id);
      setVersions(loaded);
      const current =
        loaded.find((version) => version.version_no === document.current_version) ?? loaded[0] ?? null;
      setSelectedVersionId(current?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load versions");
      setVersions([]);
      setSelectedVersionId(null);
    } finally {
      setLoadingVersions(false);
    }
  }, [document]);

  const loadPreviewUrl = useCallback(async () => {
    if (!document || !selectedVersionId) {
      setUrl(null);
      return;
    }

    const isCurrent = selectedVersion?.version_no === document.current_version;
    setLoadingPreview(true);
    setError(null);

    const result = isCurrent
      ? await getDocumentSignedUrl(document.id)
      : await getDocumentVersionSignedUrl(selectedVersionId);

    if (!result.success || !result.data?.url) {
      setError(result.success ? "Preview unavailable" : result.error);
      setUrl(null);
    } else {
      setUrl(result.data.url);
    }

    setLoadingPreview(false);
  }, [document, selectedVersion, selectedVersionId]);

  useEffect(() => {
    if (!open || !document) {
      setUrl(null);
      setError(null);
      setZoom(PREVIEW_ZOOM_DEFAULT);
      setVersions([]);
      setSelectedVersionId(null);
      setDescription(null);
      return;
    }

    setDescription(document.description);
    void loadVersions();
  }, [document, loadVersions, open]);

  useEffect(() => {
    if (!open || !document || !selectedVersionId) {
      return;
    }

    void loadPreviewUrl();
  }, [document, loadPreviewUrl, open, selectedVersionId]);

  function handleVersionsChanged() {
    void loadVersions();
    onVersionsChanged?.();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-3">
          <DialogHeader className="shrink-0">
            <DialogTitle className="truncate pr-8">
              {document?.file_name ?? "Attachment preview"}
            </DialogTitle>
            {document ? (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(document.file_size)}
                {document.uploader?.name ? ` · ${document.uploader.name}` : ""}
                {selectedVersion ? ` · v${selectedVersion.version_no}` : ""}
              </p>
            ) : null}
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 border-b pb-2">
            {canZoom ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Zoom out"
                  disabled={zoom <= 0.5}
                  onClick={() => setZoom((current) => stepPreviewZoom(current, "out"))}
                >
                  <ZoomOutIcon className="size-3.5" />
                </Button>
                <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
                  {formatPreviewZoomPercent(zoom)}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Zoom in"
                  disabled={zoom >= 3}
                  onClick={() => setZoom((current) => stepPreviewZoom(current, "in"))}
                >
                  <ZoomInIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                  aria-label="Reset zoom"
                  onClick={() => setZoom(PREVIEW_ZOOM_DEFAULT)}
                >
                  <RotateCcwIcon className="size-3.5" />
                  Fit
                </Button>
              </div>
            ) : null}

            {document && versions.length > 0 ? (
              <div className="flex items-center gap-1">
                <AppSelect
                  aria-label="Preview version"
                  size="sm"
                  triggerClassName="w-auto min-w-[7rem]"
                  value={selectedVersionId ?? ""}
                  disabled={loadingVersions || loadingPreview}
                  options={versions.map((version) => ({
                    value: version.id,
                    label:
                      version.version_no === document.current_version
                        ? `v${version.version_no} (current)`
                        : `v${version.version_no}`,
                  }))}
                  onValueChange={setSelectedVersionId}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setVersionsOpen(true)}
                >
                  <HistoryIcon className="size-3.5" />
                  History
                </Button>
              </div>
            ) : null}

            {url ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto h-7 gap-1 text-xs"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLinkIcon className="size-3.5" />
                Open
              </Button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!error && (loadingPreview || loadingVersions) ? (
            <p className="text-sm text-muted-foreground">Loading preview…</p>
          ) : null}

          {!error && !loadingPreview && url && previewKind === "unsupported" ? (
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              Preview isn&apos;t available for this file type. Use Open or download the file instead.
            </div>
          ) : null}

          {!error && !loadingPreview && url && previewKind !== "unsupported" ? (
            <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/20">
              <div
                className="p-4"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  width: `${100 / zoom}%`,
                  marginInline: "auto",
                }}
              >
                {previewKind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={document?.file_name ?? "Attachment preview"}
                    className="mx-auto block max-w-full rounded-md shadow-sm"
                    draggable={false}
                  />
                ) : (
                  <iframe
                    src={url}
                    title={document?.file_name ?? "Attachment preview"}
                    className="h-[60vh] w-full rounded-md border-0 bg-background"
                  />
                )}
              </div>
            </div>
          ) : null}

          {document ? (
            <DocumentDescriptionEditor
              documentId={document.id}
              value={description}
              canEdit={canEdit}
              className="mt-1"
              onSaved={(next) => {
                setDescription(next);
                onVersionsChanged?.();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {document ? (
        <DocumentVersionsDialog
          documentId={document.id}
          documentName={document.file_name}
          currentVersion={document.current_version}
          canEdit={canEdit}
          canManage={canManage}
          open={versionsOpen}
          onOpenChange={setVersionsOpen}
          onChanged={handleVersionsChanged}
        />
      ) : null}
    </>
  );
}
