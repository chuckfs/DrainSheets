import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SheetHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SheetHeader({ eyebrow, title, subtitle, meta, actions, className }: SheetHeaderProps) {
  return (
    <div className={cn("border-b bg-background px-3 py-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="truncate text-lg font-semibold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-[11px] leading-tight text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {meta && <div className="mt-1.5 flex flex-wrap gap-1.5">{meta}</div>}
    </div>
  );
}
