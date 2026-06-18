"use client";

import { useCallback, useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";

export function useDocumentPreview(documents: DocumentWithRelations[] = []) {
  const [open, setOpen] = useState(false);
  const [document, setDocument] = useState<DocumentWithRelations | null>(null);

  const openPreview = useCallback((nextDocument: DocumentWithRelations) => {
    setDocument(nextDocument);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setDocument(null);
    }
  }, []);

  const selectDocument = useCallback((nextDocument: DocumentWithRelations) => {
    setDocument(nextDocument);
    setOpen(true);
  }, []);

  return {
    openPreview,
    selectDocument,
    previewProps: {
      document,
      documents,
      open,
      onOpenChange: handleOpenChange,
      onSelectDocument: selectDocument,
    },
  };
}
