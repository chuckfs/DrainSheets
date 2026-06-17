import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SheetHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SheetHeader({ title, subtitle, meta, actions, className }: SheetHeaderProps) {
  return (
    <div className={cn("border-b bg-background px-3 py-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {meta && <div className="mt-2 flex flex-wrap gap-1.5">{meta}</div>}
    </div>
  );
}
