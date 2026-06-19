import type { ComponentType } from "react";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import type { NavigateDirection } from "@/lib/sheets/grid-navigation";

export type { NavigateDirection };

export type CellRendererProps = {
  column: SheetColumn;
  value: Json | undefined;
  mode: "display" | "edit";
  isSaving?: boolean;
  autoFocus?: boolean;
  onCommit: (value: Json | undefined) => void;
  onCancel: () => void;
  onNavigate?: (direction: NavigateDirection) => void;
};

export type CellRendererComponent = ComponentType<CellRendererProps>;
