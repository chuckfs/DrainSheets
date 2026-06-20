"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckIcon, ChevronDownIcon, SaveIcon, Trash2Icon } from "lucide-react";
import {
  createSheetView,
  deleteSheetView,
  listSheetViews,
  updateSheetView,
} from "@/actions/sheet-views";
import type { RowFilterCondition, RowSort } from "@/lib/sheets/row-view";
import type { SheetView } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export type SheetViewState = {
  sort: RowSort | null;
  filters: RowFilterCondition[];
  hiddenColumnKeys: string[];
  hiddenRowIds: string[];
};

function viewStateFromSheetView(view: SheetView): SheetViewState {
  const sort =
    view.sort && typeof view.sort === "object" && !Array.isArray(view.sort)
      ? (view.sort as RowSort)
      : null;
  const filters = Array.isArray(view.filters) ? (view.filters as RowFilterCondition[]) : [];

  return {
    sort,
    filters,
    hiddenColumnKeys: view.hidden_column_keys ?? [],
    hiddenRowIds: view.hidden_row_ids ?? [],
  };
}

function statesEqual(left: SheetViewState, right: SheetViewState): boolean {
  return (
    JSON.stringify(left.sort) === JSON.stringify(right.sort) &&
    JSON.stringify(left.filters) === JSON.stringify(right.filters) &&
    JSON.stringify(left.hiddenColumnKeys) === JSON.stringify(right.hiddenColumnKeys) &&
    JSON.stringify(left.hiddenRowIds) === JSON.stringify(right.hiddenRowIds)
  );
}

export function SheetViewPicker({
  sheetId,
  currentState,
  onApplyState,
}: {
  sheetId: string;
  currentState: SheetViewState;
  onApplyState: (state: SheetViewState, view: SheetView | null) => void;
}) {
  const [views, setViews] = useState<SheetView[]>([]);
  const [activeView, setActiveView] = useState<SheetView | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void listSheetViews(sheetId)
      .then((loaded) => {
        if (!cancelled) {
          setViews(loaded);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load views");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sheetId]);

  const activeSnapshot = useMemo(
    () => (activeView ? viewStateFromSheetView(activeView) : null),
    [activeView],
  );
  const isDirty = activeSnapshot ? !statesEqual(activeSnapshot, currentState) : false;
  const label = activeView?.name ?? "Default view";

  function applyView(view: SheetView | null) {
    setActiveView(view);
    onApplyState(view ? viewStateFromSheetView(view) : { sort: null, filters: [], hiddenColumnKeys: [], hiddenRowIds: [] }, view);
  }

  function handleSave(asNew: boolean) {
    startTransition(async () => {
      if (asNew) {
        if (!saveName.trim()) {
          return;
        }

        const result = await createSheetView({
          sheetId,
          name: saveName.trim(),
          sort: currentState.sort,
          filters: currentState.filters as SheetView["filters"],
          hiddenColumnKeys: currentState.hiddenColumnKeys,
          hiddenRowIds: currentState.hiddenRowIds,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        setViews((current) => [...current, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
        setActiveView(result.data!);
        setSaveOpen(false);
        setSaveName("");
        toast.success("View saved");
        return;
      }

      if (!activeView) {
        setSaveOpen(true);
        return;
      }

      const result = await updateSheetView({
        viewId: activeView.id,
        sort: currentState.sort,
        filters: currentState.filters as SheetView["filters"],
        hiddenColumnKeys: currentState.hiddenColumnKeys,
        hiddenRowIds: currentState.hiddenRowIds,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setViews((current) => current.map((view) => (view.id === result.data!.id ? result.data! : view)));
      setActiveView(result.data!);
      toast.success("View updated");
    });
  }

  function handleDelete(view: SheetView) {
    startTransition(async () => {
      const result = await deleteSheetView(view.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setViews((current) => current.filter((entry) => entry.id !== view.id));
      if (activeView?.id === view.id) {
        applyView(null);
      }
      toast.success("View deleted");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs">
              {label}
              {isDirty ? <span className="size-1.5 rounded-full bg-amber-500" aria-label="Unsaved changes" /> : null}
              <ChevronDownIcon className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => applyView(null)}>
              Default view
              {!activeView ? <CheckIcon className="ml-auto size-3.5" /> : null}
            </DropdownMenuItem>
            {views.map((view) => (
              <DropdownMenuItem key={view.id} onClick={() => applyView(view)}>
                {view.name}
                {activeView?.id === view.id ? <CheckIcon className="ml-auto size-3.5" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSave(false)} disabled={isPending}>
            <SaveIcon className="size-3.5" />
            {activeView ? "Update view" : "Save current view"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSaveOpen(true)} disabled={isPending}>
            <SaveIcon className="size-3.5" />
            Save as new view
          </DropdownMenuItem>
          {activeView ? (
            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(activeView)} disabled={isPending}>
              <Trash2Icon className="size-3.5" />
              Delete view
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
          </DialogHeader>
          <Input
            value={saveName}
            placeholder="View name"
            onChange={(event) => setSaveName(event.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending || !saveName.trim()} onClick={() => handleSave(true)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
