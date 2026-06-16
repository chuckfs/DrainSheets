"use client";

import { useTransition } from "react";
import { generateDownloadUrl } from "@/actions/documents";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DownloadDocumentButton({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await generateDownloadUrl(documentId);
      if (!result.success) {
        toast.error(result.error ?? "Download failed");
        return;
      }

      if (!result.data?.url) {
        toast.error("Download failed");
        return;
      }

      const link = document.createElement("a");
      link.href = result.data.url;
      link.download = fileName;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleDownload}>
      {pending ? "Preparing..." : "Download"}
    </Button>
  );
}
