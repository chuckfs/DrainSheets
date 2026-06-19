import Link from "next/link";
import { FileSpreadsheetIcon } from "lucide-react";
import type { Sheet } from "@/types/domain";
import { cn } from "@/lib/utils";

export function WorkspaceTree({
  sheets,
  activeSheetId,
}: {
  sheets: Sheet[];
  activeSheetId?: string;
}) {
  if (sheets.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-muted-foreground">
        No sheets in this workspace yet. Run{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed-dev</code> to create
        a sample sheet.
      </p>
    );
  }

  return (
    <ul className="divide-y border-x border-b">
      {sheets.map((sheet) => {
        const active = sheet.id === activeSheetId;

        return (
          <li key={sheet.id}>
            <Link
              href={`/sheets/${sheet.id}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                active && "bg-muted font-medium",
              )}
              aria-current={active ? "page" : undefined}
            >
              <FileSpreadsheetIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{sheet.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
