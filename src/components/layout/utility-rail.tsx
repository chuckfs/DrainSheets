"use client";

import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  InfoIcon,
  PaperclipIcon,
  StickyNoteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type UtilityPanel = "attachments" | "notes" | "activity" | "details";

const PANEL_ITEMS: { id: UtilityPanel; label: string; icon: LucideIcon }[] = [
  { id: "attachments", label: "Attachments", icon: PaperclipIcon },
  { id: "notes", label: "Notes", icon: StickyNoteIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "details", label: "Details", icon: InfoIcon },
];

export function UtilityRail({
  active,
  onSelect,
}: {
  active: UtilityPanel | null;
  onSelect: (panel: UtilityPanel) => void;
}) {
  return (
    <aside className="hidden w-[var(--rail)] shrink-0 flex-col border-l bg-rail md:flex">
      {PANEL_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => onSelect(id)}
            className={cn(
              "flex h-11 w-full items-center justify-center transition-colors",
              isActive
                ? "bg-background text-foreground"
                : "text-rail-foreground/80 hover:bg-rail-accent hover:text-rail-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </aside>
  );
}
