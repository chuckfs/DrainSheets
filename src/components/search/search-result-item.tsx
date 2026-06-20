import {
  FileSpreadsheetIcon,
  FileTextIcon,
  MessageSquareIcon,
  Table2Icon,
  UserIcon,
} from "lucide-react";
import type { SearchEntityType } from "@/lib/search/format";
import { highlightMatch } from "@/lib/search/highlight";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ENTITY_ICONS: Record<SearchEntityType, typeof FileSpreadsheetIcon> = {
  sheet: FileSpreadsheetIcon,
  row: Table2Icon,
  contact: UserIcon,
  document: FileTextIcon,
  note: MessageSquareIcon,
};

const ENTITY_BADGE_LABELS: Record<SearchEntityType, string> = {
  sheet: "Sheet",
  row: "Row",
  contact: "Contact",
  document: "Document",
  note: "Note",
};

export function SearchResultItem({
  title,
  entityType,
  workspaceName,
  sheetName,
  query,
  active,
  onSelect,
}: {
  title: string;
  entityType: SearchEntityType;
  workspaceName?: string | null;
  sheetName?: string | null;
  query: string;
  active?: boolean;
  onSelect: () => void;
}) {
  const Icon = ENTITY_ICONS[entityType];
  const parts = highlightMatch(title, query);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-accent" : "hover:bg-accent/60",
      )}
      onClick={onSelect}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {parts.map((part, index) =>
              part.match ? (
                <mark key={index} className="rounded bg-primary/15 px-0.5 text-foreground">
                  {part.text}
                </mark>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </span>
          <Badge
            variant="secondary"
            className="h-4 shrink-0 px-1 text-[9px] font-normal uppercase tracking-wide"
          >
            {ENTITY_BADGE_LABELS[entityType]}
          </Badge>
        </div>
        {(workspaceName || sheetName) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[workspaceName, sheetName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      {active && (
        <kbd className="ml-1 hidden shrink-0 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
          ↵
        </kbd>
      )}
    </button>
  );
}

export function RecentSheetItemRow({
  title,
  workspaceName,
  active,
  onSelect,
}: {
  title: string;
  workspaceName?: string | null;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-accent" : "hover:bg-accent/60",
      )}
      onClick={onSelect}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <FileSpreadsheetIcon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        {workspaceName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{workspaceName}</p>
        )}
      </div>
      {active && (
        <kbd className="ml-1 hidden shrink-0 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
          ↵
        </kbd>
      )}
    </button>
  );
}
