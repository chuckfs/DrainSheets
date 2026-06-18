"use client";

import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { DocumentWithRelations } from "@/actions/documents";
import { generateDownloadUrl } from "@/actions/documents";
import { DocumentPreviewCanvas } from "@/components/documents/document-preview-canvas";
import { DocumentPreviewSidebar } from "@/components/documents/document-preview-sidebar";
import { getPreviewKind } from "@/lib/documents/preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function DocumentPreviewContextHeader({
  document,
  className,
}: {
  document: DocumentWithRelations;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-muted/20 px-4 py-3", className)}>
      <p className="truncate text-sm font-medium">{document.file_name}</p>
      <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Property</dt>
          <dd className="truncate">{document.properties?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Prospect</dt>
          <dd className="truncate">{document.prospects?.company_name ?? "Property level"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DocumentPreviewLayout({
  document,
  documents,
  onSelectDocument,
  zoom,
  fitWidth,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  isMobile = false,
  showNavigation = true,
  className,
}: {
  document: DocumentWithRelations;
  documents: DocumentWithRelations[];
  onSelectDocument: (document: DocumentWithRelations) => void;
  zoom: number;
  fitWidth: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  isMobile?: boolean;
  showNavigation?: boolean;
  className?: string;
}) {
  const [downloadPending, startDownload] = useTransition();
  const currentIndex = documents.findIndex((item) => item.id === document.id);
  const hasPrevious = showNavigation && currentIndex > 0;
  const hasNext = showNavigation && currentIndex >= 0 && currentIndex < documents.length - 1;
  const previewKind = getPreviewKind(document.mime_type, document.file_name);
  const isPreviewable = previewKind !== "unsupported";

  function goPrevious() {
    if (!hasPrevious) return;
    onSelectDocument(documents[currentIndex - 1]!);
  }

  function goNext() {
    if (!hasNext) return;
    onSelectDocument(documents[currentIndex + 1]!);
  }

  function handleDownload() {
    startDownload(async () => {
      const result = await generateDownloadUrl(document.id);
      if (!result.success) {
        toast.error("error" in result ? result.error : "Download failed");
        return;
      }
      if (!result.data?.url) {
        toast.error("Download failed");
        return;
      }
      const link = window.document.createElement("a");
      link.href = result.data.url;
      link.download = document.file_name;
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      {!isMobile && <DocumentPreviewContextHeader document={document} />}

      <div className={cn("flex min-h-0 flex-1", isMobile ? "flex-col" : "flex-row")}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {isPreviewable && (
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onZoomOut}
                disabled={zoom <= MIN_ZOOM || fitWidth}
                aria-label="Zoom out"
              >
                <ZoomOut />
                Zoom out
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onZoomIn}
                disabled={zoom >= MAX_ZOOM || fitWidth}
                aria-label="Zoom in"
              >
                <ZoomIn />
                Zoom in
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onResetZoom}>
                <RotateCcw />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onFitWidth}
                aria-label="Fit width"
              >
                <Maximize2 />
                Fit width
              </Button>
            </div>
          )}

          <DocumentPreviewCanvas
            documentId={document.id}
            fileName={document.file_name}
            mimeType={document.mime_type}
            zoom={zoom}
            fitWidth={fitWidth}
            onDownload={handleDownload}
            downloadPending={downloadPending}
            className="min-h-0 flex-1"
          />
        </div>

        <DocumentPreviewSidebar
          document={document}
          documents={documents}
          onSelectDocument={onSelectDocument}
          collapsible={isMobile}
        />
      </div>

      {showNavigation && documents.length > 1 && isMobile && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPrevious}
            onClick={goPrevious}
          >
            <ChevronLeft />
            Previous
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!hasNext} onClick={goNext}>
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP };
