export type NavigateDirection = "up" | "down" | "left" | "right" | "next" | "prev";

import { clamp } from "@/lib/sheets/row-position";
import type { CellCoord } from "@/lib/sheets/selection";

export function computeNavigateCoord(input: {
  direction: NavigateDirection;
  from: CellCoord;
  rowCount: number;
  columnCount: number;
}): CellCoord {
  let { rowIndex, colIndex } = input.from;

  switch (input.direction) {
    case "up":
      rowIndex -= 1;
      break;
    case "down":
      rowIndex += 1;
      break;
    case "left":
      colIndex -= 1;
      break;
    case "right":
      colIndex += 1;
      break;
    case "next":
      colIndex += 1;
      if (colIndex >= input.columnCount) {
        colIndex = 0;
        rowIndex += 1;
      }
      break;
    case "prev":
      colIndex -= 1;
      if (colIndex < 0) {
        colIndex = input.columnCount - 1;
        rowIndex -= 1;
      }
      break;
  }

  return {
    rowIndex: clamp(rowIndex, 0, Math.max(0, input.rowCount - 1)),
    colIndex: clamp(colIndex, 0, Math.max(0, input.columnCount - 1)),
  };
}
