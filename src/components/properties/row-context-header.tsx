export function RowContextHeader({
  companyName,
  category,
  documentCount,
  noteCount,
}: {
  companyName: string;
  category?: string | null;
  documentCount: number;
  noteCount: number;
}) {
  return (
    <div className="border-b px-3 py-2">
      <p className="text-xs text-muted-foreground">
        Row: <span className="font-medium text-foreground">{companyName}</span>
      </p>
      {category && <p className="text-xs text-muted-foreground">{category}</p>}
      <p className="mt-1 text-[11px] text-muted-foreground">
        {documentCount} Document{documentCount === 1 ? "" : "s"} · {noteCount} Note
        {noteCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
