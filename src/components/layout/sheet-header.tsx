import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SheetHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function SheetHeader({ title, subtitle, actions, className }: SheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
