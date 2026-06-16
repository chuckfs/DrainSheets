"use client";

import { useState } from "react";
import type { NoteWithAuthor } from "@/actions/notes";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { EditNoteDialog } from "@/components/notes/edit-note-dialog";
import { canDeleteNote, canEditNote } from "@/lib/permissions/note";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/domain";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function NotesList({
  notes,
  profile,
  propertyId,
  prospectId,
}: {
  notes: NoteWithAuthor[];
  profile: Profile;
  propertyId: string;
  prospectId: string | null;
}) {
  const [editingNote, setEditingNote] = useState<NoteWithAuthor | null>(null);

  if (notes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No notes yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {notes.map((note) => {
          const updated = note.updated_at !== note.created_at;

          return (
            <article key={note.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      {note.profiles?.name ?? "Unknown user"}
                    </span>
                  </p>
                  <p>Created {formatTimestamp(note.created_at)}</p>
                  {updated && <p>Updated {formatTimestamp(note.updated_at)}</p>}
                </div>
                <div className="flex gap-2">
                  {canEditNote(profile, note) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(note)}
                    >
                      Edit
                    </Button>
                  )}
                  {canDeleteNote(profile, note) && (
                    <DeleteNoteButton
                      noteId={note.id}
                      propertyId={propertyId}
                      prospectId={prospectId}
                    />
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p>
            </article>
          );
        })}
      </div>

      {editingNote && (
        <EditNoteDialog
          note={editingNote}
          propertyId={propertyId}
          prospectId={prospectId}
          open={editingNote !== null}
          onOpenChange={(open) => {
            if (!open) setEditingNote(null);
          }}
        />
      )}
    </>
  );
}
