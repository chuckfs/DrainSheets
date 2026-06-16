import { Skeleton } from "@/components/ui/skeleton";

export function ListLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ListEmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground" role="status">
      {message}
    </p>
  );
}

export function ListErrorState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function PageLoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <ListLoadingState rows={4} />
    </div>
  );
}
