"use client";

import { useCallback, useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import {
  DocumentPreviewLayout,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from "@/components/documents/document-preview-layout";
import { cn } from "@/lib/utils";

export function DocumentPreview({
  document,
  className,
}: {
  document: DocumentWithRelations;
  className?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);

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

  return (
    <div className={cn("flex min-h-[70vh] flex-col overflow-hidden rounded-lg border", className)}>
      <DocumentPreviewLayout
        document={document}
        documents={[document]}
        onSelectDocument={() => {}}
        zoom={zoom}
        fitWidth={fitWidth}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitWidth={handleFitWidth}
        showNavigation={false}
      />
    </div>
  );
}
