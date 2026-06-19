export function DeferredPage({ title }: { title: string }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <h1 className="text-lg font-medium text-foreground">{title}</h1>
      <p className="mt-2 text-sm">Coming soon.</p>
    </div>
  );
}
