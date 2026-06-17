"use client";

import { ActivityIcon, PaperclipIcon, StickyNoteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileProspectActionBar({
  visible,
  onAttach,
  onNote,
  onActivity,
}: {
  visible: boolean;
  onAttach: () => void;
  onNote: () => void;
  onActivity: () => void;
}) {
  if (!visible) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-14 z-40 flex border-t bg-background md:hidden"
      aria-label="Prospect actions"
    >
      <ActionButton icon={PaperclipIcon} label="Attach" onClick={onAttach} shortcut="U" />
      <ActionButton icon={StickyNoteIcon} label="Note" onClick={onNote} shortcut="N" />
      <ActionButton icon={ActivityIcon} label="Activity" onClick={onActivity} />
    </nav>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  shortcut,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

export function focusProspectSearchInput() {
  const input = document.querySelector<HTMLInputElement>('[data-prospect-search="true"]');
  input?.focus();
}

export function focusGlobalSearchInput() {
  const input = document.querySelector<HTMLInputElement>('[data-global-search="true"]');
  input?.focus();
}
