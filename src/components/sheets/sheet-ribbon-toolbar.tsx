"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CopyIcon,
  ScissorsIcon,
  ClipboardPasteIcon,
  CornerDownLeftIcon,
  EraserIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FilterIcon,
  ItalicIcon,
  MoreHorizontalIcon,
  PaintBucketIcon,
  PrinterIcon,
  Redo2Icon,
  TypeIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { exportSheetData } from "@/actions/export";
import { GridToolbar } from "@/components/layout/grid-toolbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadBase64File } from "@/lib/download";
import {
  FILL_COLOR_PRESETS,
  TEXT_COLOR_PRESETS,
  fillPresetStorageValue,
} from "@/lib/sheets/cell-style";
import type { RowFilterCondition } from "@/lib/sheets/row-view";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SheetClipboardController } from "./use-sheet-clipboard";
import { SheetDecimalControls } from "./sheet-decimal-controls";
import { SheetFreezeMenu } from "./sheet-freeze-menu";
import { SheetSyncIndicator } from "./sheet-sync-indicator";
import { SheetViewPicker, type SheetViewState } from "./sheet-view-picker";
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

function SheetFormatControls({ grid }: { grid: SheetGridController }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const state = grid.getFormattingState();
  const hasSelection = Boolean(grid.selectionRange || grid.selectedCell);

  return (
    <>
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Text color</DropdownMenuLabel>
            {TEXT_COLOR_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => void grid.applyFormattingPatch({ color: preset.value ?? undefined })}
              >
                <span
                  className={cn("size-3 rounded-sm border border-border", !preset.value && "bg-background")}
                  style={preset.value ? { backgroundColor: preset.value } : undefined}
                />
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Fill color</DropdownMenuLabel>
            {FILL_COLOR_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() =>
                  void grid.applyFormattingPatch({
                    backgroundColor: preset.id ? fillPresetStorageValue(preset.id) : undefined,
                  })
                }
              >
                <span
                  className="size-3 rounded-sm border border-border"
                  style={{ backgroundColor: (isDark ? preset.dark : preset.light) ?? "transparent" }}
                />
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
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
  );
}

export function SheetRibbonToolbar({
  grid,
  clipboard,
  filterActive,
  onToggleFilter,
  sheetId,
  viewState,
  onApplyViewState,
}: {
  grid: SheetGridController;
  clipboard: SheetClipboardController;
  filterActive?: boolean;
  onToggleFilter?: () => void;
  sheetId: string;
  viewState: SheetViewState;
  onApplyViewState: (state: SheetViewState) => void;
}) {
  const readOnly = grid.readOnly;
  const activeColumn = grid.getActiveColumn();
  const [isExporting, startExport] = useTransition();

  function handleExport(format: "csv" | "xlsx") {
    startExport(async () => {
      const result = await exportSheetData(sheetId, format, {
        filters: viewState.filters as RowFilterCondition[],
        includeHidden: grid.showHiddenRows || grid.showHiddenColumns,
      });

      if (!result.success || !result.data) {
        toast.error(result.success ? "Export failed" : result.error);
        return;
      }

      downloadBase64File(result.data.base64, result.data.fileName, result.data.mimeType);
      toast.success(`Exported ${result.data.fileName}`);
    });
  }

  return (
    <GridToolbar
      left={
        readOnly ? (
          <span className="text-xs text-muted-foreground">View only</span>
        ) : (
          <>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7"
              aria-label="Undo"
              disabled={!grid.canUndo}
              onClick={() => void grid.undo()}
            >
              <Undo2Icon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7"
              aria-label="Redo"
              disabled={!grid.canRedo}
              onClick={() => void grid.redo()}
            >
              <Redo2Icon className="size-3.5" />
            </Button>
            <ToolbarDivider />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7"
              aria-label="Copy"
              disabled={!grid.selectionRange}
              onClick={() => void clipboard.copySelection()}
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7"
              aria-label="Cut"
              disabled={!grid.selectionRange}
              onClick={() => void clipboard.cutSelection()}
            >
              <ScissorsIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7"
              aria-label="Paste"
              disabled={!grid.selectedCell}
              onClick={() => void clipboard.pasteFromClipboard()}
            >
              <ClipboardPasteIcon className="size-3.5" />
            </Button>
            <ToolbarDivider />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              aria-label="Fill down"
              disabled={!grid.selectionRange}
              onClick={() => void grid.fillDown()}
            >
              <CornerDownLeftIcon className="size-3.5" />
              Fill
            </Button>
            <SheetFormatControls grid={grid} />
          </>
        )
      }
      center={
        <>
          <SheetDecimalControls grid={grid} column={activeColumn} />
          {onToggleFilter ? (
            <Button
              type="button"
              size="sm"
              variant={filterActive ? "default" : "outline"}
              className="h-7 gap-1 text-xs"
              onClick={onToggleFilter}
            >
              <FilterIcon className="size-3.5" />
              Filter
            </Button>
          ) : null}
          <SheetViewPicker
            sheetId={sheetId}
            currentState={viewState}
            onApplyState={(state) => onApplyViewState(state)}
          />
        </>
      }
      right={
        <>
          <SheetSyncIndicator syncState={grid.syncState} />
          <SheetFreezeMenu grid={grid} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="size-7"
                  aria-label="More sheet actions"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("xlsx")}>
                  <FileSpreadsheetIcon className="size-3.5" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("csv")}>
                  <FileTextIcon className="size-3.5" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`/sheets/${sheetId}/print`, "_blank", "noopener,noreferrer")}
                >
                  <PrinterIcon className="size-3.5" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={grid.showHiddenRows}
                  onCheckedChange={(checked) => grid.setShowHiddenRows(Boolean(checked))}
                >
                  Show hidden rows
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={grid.showHiddenColumns}
                  onCheckedChange={(checked) => grid.setShowHiddenColumns(Boolean(checked))}
                >
                  Show hidden columns
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
