export function SharedWithSummary({ editorCount }: { editorCount: number }) {
  const label =
    editorCount === 0
      ? "Only you"
      : `Shared with ${editorCount} editor${editorCount === 1 ? "" : "s"}`;

  return <p className="text-xs text-muted-foreground">{label}</p>;
}
