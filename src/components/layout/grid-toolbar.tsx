import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GridToolbarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function GridToolbar({ left, center, right, className }: GridToolbarProps) {
  return (
    <div
      className={cn(
        "flex h-9 flex-wrap items-center gap-2 border-b bg-muted/30 px-3",
        className,
      )}
    >
      {left && <div className="flex items-center gap-2">{left}</div>}
      {center && <div className="flex min-w-[160px] flex-1 items-center gap-2">{center}</div>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
