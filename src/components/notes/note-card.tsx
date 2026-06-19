"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import type { NoteWithAuthor } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

function formatTimestamp(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NoteCard({
  note,
  canEdit,
  onEdit,
  onDelete,
}: {
  note: NoteWithAuthor;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updated = note.updated_at !== note.created_at;

  return (
    <article className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar name={note.author.name} className="size-7" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{note.author.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatTimestamp(note.created_at)}
              {updated && ` · edited ${formatTimestamp(note.updated_at)}`}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit note">
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label="Delete note"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
    </article>
  );
}
