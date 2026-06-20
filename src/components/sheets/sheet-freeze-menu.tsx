"use client";

import { PinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetFreezeMenu({ grid }: { grid: SheetGridController }) {
  const pinnedCount = grid.columns.filter((column) => column.is_pinned).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant={pinnedCount > 0 ? "default" : "outline"}
            className="h-7 gap-1 text-xs"
            aria-label="Freeze panes"
          >
            <PinIcon className="size-3.5" />
            Freeze{pinnedCount > 0 ? ` (${pinnedCount})` : ""}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Freeze panes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={grid.readOnly || grid.columns.length === 0}
            onClick={() => void grid.freezeColumnsThrough(0)}
          >
            Freeze first column
          </DropdownMenuItem>
          {grid.columns.slice(0, 4).map((column, index) => (
            <DropdownMenuItem
              key={column.id}
              disabled={grid.readOnly}
              onClick={() => void grid.freezeColumnsThrough(index)}
            >
              Freeze through {column.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={grid.readOnly || pinnedCount === 0}
            onClick={() => void grid.unfreezeAllColumns()}
          >
            Unfreeze all
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
