"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveProperty } from "@/actions/properties";
import { Button } from "@/components/ui/button";

export function ArchivePropertyButton({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    const confirmed = window.confirm(`Archive "${propertyName}"? It will be hidden from the default list.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await archiveProperty(propertyId);
      if (result.success) {
        router.push("/properties");
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleArchive}>
      {pending ? "Archiving..." : "Archive"}
    </Button>
  );
}
