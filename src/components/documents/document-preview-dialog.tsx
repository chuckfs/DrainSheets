"use client";

import { useEffect, useState } from "react";
import { getDocumentSignedUrl } from "@/actions/documents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DocumentPreviewDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId) {
      setUrl(null);
      setError(null);
      return;
    }

    void getDocumentSignedUrl(documentId).then((result) => {
      if (!result.success || !result.data?.url) {
        setError(result.success ? "Preview unavailable" : result.error);
        setUrl(null);
        return;
      }
      setUrl(result.data.url);
      setError(null);
    });
  }, [documentId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Attachment preview</DialogTitle>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !url && <p className="text-sm text-muted-foreground">Loading preview…</p>}
        {url && (
          <iframe src={url} title="Attachment preview" className="h-[60vh] w-full rounded-md border" />
        )}
      </DialogContent>
    </Dialog>
  );
}
