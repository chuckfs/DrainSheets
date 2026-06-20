"use client";

import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function GridContextMenu({
  children,
  items,
}: {
  children: ReactNode;
  items: Array<{
    id: string;
    label: string;
    onSelect: () => void;
    disabled?: boolean;
    destructive?: boolean;
    separatorBefore?: boolean;
  }>;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="contents">{children}</div>} />
      <ContextMenuContent className="w-48">
        <ContextMenuGroup>
          {items.map((item) => (
            <span key={item.id}>
              {item.separatorBefore ? <ContextMenuSeparator /> : null}
              <ContextMenuItem
                variant={item.destructive ? "destructive" : "default"}
                disabled={item.disabled}
                onClick={item.onSelect}
              >
                {item.label}
              </ContextMenuItem>
            </span>
          ))}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
