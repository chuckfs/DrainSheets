"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CellCoord, SheetGridController } from "./use-sheet-grid";

export function FillHandle({
  grid,
  coord,
}: {
  grid: SheetGridController;
  coord: CellCoord;
}) {
  const [dragging, setDragging] = useState(false);
  const targetRowRef = useRef(coord.rowIndex);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const cell = element?.closest<HTMLElement>("[data-row-index]");
      if (!cell) {
        return;
      }

      const rowIndex = Number(cell.dataset.rowIndex);
      if (Number.isNaN(rowIndex)) {
        return;
      }

      targetRowRef.current = Math.max(coord.rowIndex, rowIndex);
      grid.extendSelectionTo({ rowIndex: targetRowRef.current, colIndex: coord.colIndex });
    }

    async function handlePointerUp() {
      setDragging(false);
      const targetEndRow = targetRowRef.current;
      if (targetEndRow > coord.rowIndex) {
        await grid.fillFromCell(coord, targetEndRow);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [coord.colIndex, coord.rowIndex, dragging, grid]);

  if (grid.readOnly) {
    return null;
  }

  return (
    <span
      role="presentation"
      className={cn(
        "absolute -bottom-0.5 -right-0.5 z-20 size-2.5 cursor-crosshair rounded-[1px] border border-primary bg-primary",
        dragging && "scale-110",
      )}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        targetRowRef.current = coord.rowIndex;
        setDragging(true);
      }}
    />
  );
}
