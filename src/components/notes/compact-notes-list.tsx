"use client";

import { useState } from "react";
import type { NoteWithAuthor } from "@/actions/notes";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { EditNoteDialog } from "@/components/notes/edit-note-dialog";
import { formatCompactTime } from "@/lib/format-relative-time";
import { canDeleteNote, canEditNote } from "@/lib/permissions/note";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/domain";
import { cn } from "@/lib/utils";

export function CompactNotesList({
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
    return <p className="px-1 py-3 text-center text-xs text-muted-foreground">No notes yet.</p>;
  }

  return (
    <>
      <div>
        {notes.map((note, index) => (
          <div key={note.id}>
            {index > 0 && <div className="mx-1 border-t border-border/60" />}
            <article className="group px-1 py-2 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {note.profiles?.name ?? "Unknown user"}
                  </span>
                  {" · "}
                  {formatCompactTime(note.created_at)}
                </p>
                <div
                  className={cn(
                    "flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
                  )}
                >
                  {canEditNote(profile, note) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
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
                      compact
                    />
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs whitespace-pre-wrap">{note.content}</p>
            </article>
          </div>
        ))}
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
