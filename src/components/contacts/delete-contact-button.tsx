"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteContact } from "@/actions/contacts";
import { Button } from "@/components/ui/button";

export function DeleteContactButton({
  contactId,
  prospectId,
  contactName,
  redirectTo,
}: {
  contactId: string;
  prospectId: string;
  contactName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${contactName}"? This cannot be undone.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteContact(contactId, prospectId);
      if (result.success) {
        if (redirectTo) {
          router.push(redirectTo);
        }
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
