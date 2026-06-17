export function MetadataPill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border bg-muted/30 px-2.5 text-xs">
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="ml-1 text-muted-foreground">{label}</span>
    </span>
  );
}
