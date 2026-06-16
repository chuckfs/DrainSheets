"use client";

import { useEffect, useRef } from "react";
import type { NoteWithAuthor } from "@/actions/notes";
import { NoteForm } from "@/components/notes/note-form";
import { Button } from "@/components/ui/button";

export function EditNoteDialog({
  note,
  propertyId,
  prospectId,
  open,
  onOpenChange,
}: {
  note: NoteWithAuthor;
  propertyId: string;
  prospectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
      onClose={() => onOpenChange(false)}
    >
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-medium">Edit note</h3>
      </div>
      <div className="p-4">
        <NoteForm
          propertyId={propertyId}
          prospectId={prospectId}
          note={note}
          submitLabel="Save changes"
          onSuccess={() => onOpenChange(false)}
        />
      </div>
      <div className="flex justify-end border-t px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>
    </dialog>
  );
}
