"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DocumentWithRelations } from "@/actions/documents";
import { logDocumentViewed } from "@/actions/documents";
import {
  DocumentPreviewLayout,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from "@/components/documents/document-preview-layout";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function DocumentPreviewDialog({
  document,
  documents,
  open,
  onOpenChange,
  onSelectDocument,
}: {
  document: DocumentWithRelations | null;
  documents: DocumentWithRelations[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDocument?: (document: DocumentWithRelations) => void;
}) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const viewedIdsRef = useRef(new Set<string>());

  const navigationDocuments = useMemo(
    () => (documents.length > 0 ? documents : document ? [document] : []),
    [documents, document],
  );

  const currentIndex = document
    ? navigationDocuments.findIndex((item) => item.id === document.id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navigationDocuments.length - 1;

  const handleSelectDocument = useCallback(
    (nextDocument: DocumentWithRelations) => {
      onSelectDocument?.(nextDocument);
    },
    [onSelectDocument],
  );

  function goPrevious() {
    if (!hasPrevious) return;
    handleSelectDocument(navigationDocuments[currentIndex - 1]!);
  }

  function goNext() {
    if (!hasNext) return;
    handleSelectDocument(navigationDocuments[currentIndex + 1]!);
  }

  useEffect(() => {
    if (!open) {
      viewedIdsRef.current.clear();
      return;
    }

    if (!document) {
      return;
    }

    if (viewedIdsRef.current.has(document.id)) {
      return;
    }

    viewedIdsRef.current.add(document.id);
    void logDocumentViewed(document.id);
  }, [open, document]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        onOpenChange(false);
      }
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        event.preventDefault();
        handleSelectDocument(navigationDocuments[currentIndex - 1]!);
      }
      if (event.key === "ArrowRight" && currentIndex >= 0 && currentIndex < navigationDocuments.length - 1) {
        event.preventDefault();
        handleSelectDocument(navigationDocuments[currentIndex + 1]!);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    currentIndex,
    navigationDocuments,
    handleSelectDocument,
    onOpenChange,
  ]);

  const handleZoomIn = useCallback(() => {
    setFitWidth(false);
    setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitWidth(false);
    setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))));
  }, []);

  const handleResetZoom = useCallback(() => {
    setFitWidth(false);
    setZoom(1);
  }, []);

  const handleFitWidth = useCallback(() => {
    setFitWidth(true);
    setZoom(1);
  }, []);

  const header = document ? (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      {navigationDocuments.length > 1 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={goPrevious}
          aria-label="Previous document"
        >
          <ChevronLeft />
          {isMobile ? null : "Previous"}
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{document.file_name}</p>
        {isMobile && (
          <p className="truncate text-xs text-muted-foreground">
            {document.properties?.name ?? "—"}
            {document.prospects ? ` · ${document.prospects.company_name}` : ""}
          </p>
        )}
      </div>
      {navigationDocuments.length > 1 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={goNext}
          aria-label="Next document"
        >
          {isMobile ? null : "Next"}
          <ChevronRight />
        </Button>
      )}
    </div>
  ) : null;

  const body =
    document && open ? (
      <DocumentPreviewLayout
        document={document}
        documents={navigationDocuments}
        onSelectDocument={handleSelectDocument}
        zoom={zoom}
        fitWidth={fitWidth}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitWidth={handleFitWidth}
        isMobile={isMobile}
      />
    ) : null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none"
          showCloseButton
        >
          <SheetTitle className="sr-only">
            {document?.file_name ?? "Document preview"}
          </SheetTitle>
          {header}
          <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-xl p-0",
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-[90vw]",
        )}
        showCloseButton
      >
        <DialogTitle className="sr-only">{document?.file_name ?? "Document preview"}</DialogTitle>
        {header}
        <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
