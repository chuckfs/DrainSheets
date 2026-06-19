"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createNote, deleteNote, updateNote, listNotes, type NoteWithAuthor } from "@/actions/notes";
import type { AccessContext } from "@/lib/access/effective-role";
import { canCreateNotes, canManageNote } from "@/lib/access/note-permissions";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "./note-card";
import { NoteEditor } from "./note-editor";

export function NotesList({
  notes,
  access,
  currentUserId,
  onNotesChange,
}: {
  notes: NoteWithAuthor[];
  access: AccessContext;
  currentUserId: string;
  onNotesChange: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canCreate = canCreateNotes(access);

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note deleted");
      onNotesChange();
    });
  }

  function handleUpdate(noteId: string, content: string) {
    startTransition(async () => {
      const result = await updateNote(noteId, content);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note updated");
      setEditingId(null);
      onNotesChange();
    });
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        description={
          canCreate
            ? "Capture context for this sheet or row. Add your first note below."
            : "Notes from your team will appear here."
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id}>
          {editingId === note.id ? (
            <NoteEditor
              initialContent={note.content}
              submitLabel="Save"
              pending={isPending}
              onCancel={() => setEditingId(null)}
              onSubmit={(content) => handleUpdate(note.id, content)}
            />
          ) : (
            <NoteCard
              note={note}
              canEdit={canManageNote(access, note.user_id, currentUserId)}
              onEdit={() => setEditingId(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function NotesComposer({
  sheetId,
  rowId,
  access,
  onCreated,
}: {
  sheetId: string;
  rowId?: string | null;
  access: AccessContext;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!canCreateNotes(access)) {
    return null;
  }

  function handleSubmit(content: string) {
    startTransition(async () => {
      const result = await createNote(sheetId, content, rowId ?? null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Note added");
      onCreated();
    });
  }

  return (
    <div className="border-t pt-3">
      <NoteEditor
        submitLabel="Add note"
        pending={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function useNotesLoader(sheetId: string, rowId?: string | null) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await listNotes(sheetId, rowId ?? null);
      setNotes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [sheetId, rowId]);

  return { notes, loading, reload };
}
