"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveProperty } from "@/actions/properties";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ArchivePropertyButton({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    const confirmed = window.confirm(
      `Archive "${propertyName}"? It will be hidden from the default list.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await archiveProperty(propertyId);
      if (result.success) {
        router.push("/properties");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleArchive}>
      {pending ? "Archiving..." : "Archive"}
    </Button>
  );
}

export function ArchivePropertyMenuItem({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    const confirmed = window.confirm(
      `Archive "${propertyName}"? It will be hidden from the default list.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await archiveProperty(propertyId);
      if (result.success) {
        router.push("/properties");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenuItem variant="destructive" disabled={pending} onClick={handleArchive}>
      {pending ? "Archiving..." : "Archive"}
    </DropdownMenuItem>
  );
}
