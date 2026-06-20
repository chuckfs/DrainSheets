import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SmartsheetGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-auto border-x border-b", className)}>
      <Table className="grid-table min-w-[880px] border-collapse text-[13px]">{children}</Table>
    </div>
  );
}

export function SmartsheetGridHeader({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
      {children}
    </TableHeader>
  );
}

export function SmartsheetGridHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "h-8 border-r border-grid-line px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground last:border-r-0",
        className,
      )}
      {...props}
    />
  );
}

export function SmartsheetGridRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn(
        "h-8 min-h-8 border-grid-line transition-colors hover:bg-row-hover data-[state=selected]:bg-row-selected",
        className,
      )}
      {...props}
    />
  );
}

export function SmartsheetGridCell({
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      className={cn(
        "border-r border-grid-line px-2 py-1 align-middle text-[13px] last:border-r-0",
        className,
      )}
      {...props}
    />
  );
}

export function SmartsheetGridEmpty({ message }: { message: string }) {
  return (
    <div className="border-x border-b px-3 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export { TableBody as SmartsheetGridBody };
