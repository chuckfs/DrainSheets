"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteNoteButton({
  noteId,
  propertyId,
  prospectId,
}: {
  noteId: string;
  propertyId: string;
  prospectId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm("Delete this note? This cannot be undone.");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteNote(noteId, propertyId, prospectId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleDelete}>
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
