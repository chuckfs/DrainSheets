"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${fileName}"? This cannot be undone.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleDelete}>
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
