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
        "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-muted/70",
      )}
      onClick={onSelect}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
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
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
            {ENTITY_BADGE_LABELS[entityType]}
          </Badge>
        </div>
        {(workspaceName || sheetName) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[workspaceName, sheetName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
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
        "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-muted/70",
      )}
      onClick={onSelect}
    >
      <FileSpreadsheetIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        {workspaceName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{workspaceName}</p>
        )}
      </div>
    </button>
  );
}
