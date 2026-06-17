"use client";

import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  InfoIcon,
  PaperclipIcon,
  StickyNoteIcon,
} from "lucide-react";
import type { UtilityPanel } from "@/components/layout/utility-rail";
import { cn } from "@/lib/utils";

const PANEL_ITEMS: { id: UtilityPanel; label: string; icon: LucideIcon }[] = [
  { id: "attachments", label: "Files", icon: PaperclipIcon },
  { id: "notes", label: "Notes", icon: StickyNoteIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "details", label: "Details", icon: InfoIcon },
];

export function MobileUtilityBar({
  active,
  onSelect,
}: {
  active: UtilityPanel | null;
  onSelect: (panel: UtilityPanel) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden"
      aria-label="Sheet tools"
    >
      {PANEL_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
