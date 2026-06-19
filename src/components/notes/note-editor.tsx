"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteEditor({
  initialContent = "",
  submitLabel,
  pending,
  onCancel,
  onSubmit,
}: {
  initialContent?: string;
  submitLabel: string;
  pending?: boolean;
  onCancel?: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    if (!initialContent) {
      setContent("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a note…"
        rows={3}
        disabled={pending}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending || !content.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
