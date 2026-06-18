"use client";

import { useEffect, useState, useTransition } from "react";
import { generatePreviewUrl } from "@/actions/documents";
import { getPreviewKind } from "@/lib/documents/preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentPreviewCanvas({
  documentId,
  fileName,
  mimeType,
  zoom,
  fitWidth,
  onDownload,
  downloadPending,
  className,
}: {
  documentId: string;
  fileName: string;
  mimeType: string | null;
  zoom: number;
  fitWidth: boolean;
  onDownload: () => void;
  downloadPending?: boolean;
  className?: string;
}) {
  const previewKind = getPreviewKind(mimeType, fileName);
  const isPreviewable = previewKind !== "unsupported";

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [urlPending, startUrlTransition] = useTransition();

  useEffect(() => {
    if (!isPreviewable) {
      setPreviewUrl(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setPreviewUrl(null);
    setLoadError(null);

    startUrlTransition(async () => {
      const result = await generatePreviewUrl(documentId);
      if (cancelled) {
        return;
      }

      if (!result.success) {
        setLoadError("error" in result ? result.error : "Failed to load preview");
        return;
      }

      setPreviewUrl(result.data?.url ?? null);
      if (!result.data?.url) {
        setLoadError("Failed to load preview");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documentId, isPreviewable]);

  if (!isPreviewable) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">Preview unavailable for this file type.</p>
        <Button type="button" size="sm" disabled={downloadPending} onClick={onDownload}>
          {downloadPending ? "Preparing..." : "Download"}
        </Button>
      </div>
    );
  }

  if (urlPending || (!previewUrl && !loadError)) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[240px] items-center justify-center p-6",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button type="button" size="sm" disabled={downloadPending} onClick={onDownload}>
          {downloadPending ? "Preparing..." : "Download"}
        </Button>
      </div>
    );
  }

  if (previewKind === "pdf") {
    return (
      <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-auto bg-muted/20 p-3", className)}>
        <div
          className="mx-auto flex h-full min-h-0 w-full flex-1 origin-top flex-col"
          style={{
            transform: fitWidth ? undefined : `scale(${zoom})`,
            width: fitWidth ? "100%" : `${100 / zoom}%`,
          }}
        >
          <iframe
            title={fileName}
            src={previewUrl!}
            className="h-full min-h-[50vh] w-full flex-1 rounded-md border bg-white shadow-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-1 overflow-auto bg-muted/20 p-3", className)}>
      <div className="flex min-h-full w-full justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl!}
          alt={fileName}
          className="max-h-full max-w-full rounded-md border bg-white object-contain shadow-sm"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            width: fitWidth ? "100%" : undefined,
          }}
        />
      </div>
    </div>
  );
}
