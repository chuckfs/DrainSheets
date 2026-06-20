"use client";

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  EraserIcon,
  ItalicIcon,
  PaintBucketIcon,
  TypeIcon,
  UnderlineIcon,
} from "lucide-react";
import { GridToolbar } from "@/components/layout/grid-toolbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FILL_COLOR_PRESETS,
  TEXT_COLOR_PRESETS,
  type CellAlign,
} from "@/lib/sheets/cell-style";
import { cn } from "@/lib/utils";
import type { SheetGridController } from "./use-sheet-grid";

function ToolbarDivider() {
  return <span className="h-5 w-px bg-border" aria-hidden />;
}

function toggleVariant(state: boolean | "mixed", active = true): "default" | "outline" | "ghost" {
  if (state === "mixed") {
    return "outline";
  }

  return state && active ? "default" : "ghost";
}

export function SheetFormatToolbar({ grid }: { grid: SheetGridController }) {
  if (grid.readOnly) {
    return null;
  }

  const state = grid.getFormattingState();
  const hasSelection = Boolean(grid.selectionRange || grid.selectedCell);

  return (
    <GridToolbar
      left={
        <>
          <span className="text-xs font-medium text-muted-foreground">Format</span>
          <ToolbarDivider />
          <Button
            type="button"
            size="icon-sm"
            variant={toggleVariant(state.bold)}
            className="size-7"
            aria-label="Bold"
            aria-pressed={state.bold === true}
            disabled={!hasSelection}
            onClick={() => void grid.toggleFormatting("bold")}
          >
            <BoldIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={toggleVariant(state.italic)}
            className="size-7"
            aria-label="Italic"
            aria-pressed={state.italic === true}
            disabled={!hasSelection}
            onClick={() => void grid.toggleFormatting("italic")}
          >
            <ItalicIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={toggleVariant(state.underline)}
            className="size-7"
            aria-label="Underline"
            aria-pressed={state.underline === true}
            disabled={!hasSelection}
            onClick={() => void grid.toggleFormatting("underline")}
          >
            <UnderlineIcon className="size-3.5" />
          </Button>
          <ToolbarDivider />
          <Button
            type="button"
            size="icon-sm"
            variant={state.align === "left" ? "default" : "ghost"}
            className="size-7"
            aria-label="Align left"
            disabled={!hasSelection}
            onClick={() => void grid.applyFormattingPatch({ align: "left" })}
          >
            <AlignLeftIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={state.align === "center" ? "default" : "ghost"}
            className="size-7"
            aria-label="Align center"
            disabled={!hasSelection}
            onClick={() => void grid.applyFormattingPatch({ align: "center" })}
          >
            <AlignCenterIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={state.align === "right" ? "default" : "ghost"}
            className="size-7"
            aria-label="Align right"
            disabled={!hasSelection}
            onClick={() => void grid.applyFormattingPatch({ align: "right" })}
          >
            <AlignRightIcon className="size-3.5" />
          </Button>
          <ToolbarDivider />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={!hasSelection}
                >
                  <TypeIcon className="size-3.5" />
                  Text
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel>Text color</DropdownMenuLabel>
              {TEXT_COLOR_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() =>
                    void grid.applyFormattingPatch({ color: preset.value ?? undefined })
                  }
                >
                  <span
                    className={cn("size-3 rounded-sm border border-border", !preset.value && "bg-background")}
                    style={preset.value ? { backgroundColor: preset.value } : undefined}
                  />
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={!hasSelection}
                >
                  <PaintBucketIcon className="size-3.5" />
                  Fill
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel>Fill color</DropdownMenuLabel>
              {FILL_COLOR_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() =>
                    void grid.applyFormattingPatch({ backgroundColor: preset.value ?? undefined })
                  }
                >
                  <span
                    className="size-3 rounded-sm border border-border"
                    style={{ backgroundColor: preset.value ?? "transparent" }}
                  />
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarDivider />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            disabled={!hasSelection}
            onClick={() => void grid.clearFormatting()}
          >
            <EraserIcon className="size-3.5" />
            Clear
          </Button>
        </>
      }
    />
  );
}

export type { CellAlign };
