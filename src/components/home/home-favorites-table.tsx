import Link from "next/link";
import { FileSpreadsheetIcon } from "lucide-react";
import type { FavoriteSheetItem } from "@/actions/favorites";
import { formatRelativeTime } from "@/lib/activity/format";
import { EmptyState } from "@/components/ui/empty-state";

export function HomeFavoritesTable({ items }: { items: FavoriteSheetItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        description="Star a sheet in a workspace to pin it here."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Location</th>
            <th className="px-3 py-2 font-medium text-right">Favorited</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.sheet_id} className="border-b last:border-b-0 hover:bg-accent/50">
              <td className="px-3 py-2.5">
                <Link
                  href={`/sheets/${item.sheet_id}`}
                  className="flex min-w-0 items-center gap-2 font-medium hover:underline"
                >
                  <FileSpreadsheetIcon className="size-4 shrink-0 text-sheet-icon" aria-hidden />
                  <span className="truncate">{item.sheet_name}</span>
                </Link>
              </td>
              <td className="max-w-[200px] truncate px-3 py-2.5 text-muted-foreground">
                {item.workspace_name ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground">
                {formatRelativeTime(item.favorited_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
