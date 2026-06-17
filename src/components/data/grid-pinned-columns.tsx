import { cn } from "@/lib/utils";
import { TableCell, TableHead } from "@/components/ui/table";

/** Sticky pinned column offsets for property prospects grid (px). */
export const GRID_PIN = {
  rowNum: 0,
  company: 40,
  contact: 200,
  status: 360,
} as const;

export function SmartsheetGridPinHead({
  pinLeft,
  className,
  ...props
}: React.ComponentProps<typeof TableHead> & { pinLeft: number }) {
  return (
    <TableHead
      className={cn(
        "sticky z-30 border-r border-grid-line bg-muted/95 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm",
        className,
      )}
      style={{ left: pinLeft }}
      {...props}
    />
  );
}

export function SmartsheetGridPinCell({
  pinLeft,
  selected,
  className,
  ...props
}: React.ComponentProps<typeof TableCell> & { pinLeft: number; selected?: boolean }) {
  return (
    <TableCell
      className={cn(
        "sticky z-[5] border-r border-grid-line bg-background px-2 py-1 align-middle text-[13px] even:bg-muted/15",
        selected && "bg-row-selected even:bg-row-selected",
        className,
      )}
      style={{ left: pinLeft }}
      {...props}
    />
  );
}

export function GridSkeletonRows({ rows = 12, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="border-x border-b px-2 py-2" aria-hidden>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex h-8 items-center gap-2 border-b border-grid-line/60 py-1">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <div
              key={colIndex}
              className="h-3 flex-1 animate-pulse rounded-sm bg-muted"
              style={{ maxWidth: colIndex === 0 ? "2rem" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ContactCellContent({
  label,
  email,
  phone,
}: {
  label: string;
  email?: string | null;
  phone?: string | null;
}) {
  if (!label && !email && !phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-[140px] max-w-[180px] leading-tight">
      <div className="truncate text-[13px]">{label || "—"}</div>
      {email && <div className="truncate text-[11px] text-muted-foreground">{email}</div>}
      {phone && <div className="truncate text-[11px] text-muted-foreground">{phone}</div>}
    </div>
  );
}
