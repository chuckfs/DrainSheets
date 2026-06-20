"use client";

import { useState, useTransition } from "react";
import { StarIcon } from "lucide-react";
import { toggleSheetFavorite } from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SheetFavoriteButton({
  sheetId,
  initialFavorited,
  className,
}: {
  sheetId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);

  function handleToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    startTransition(async () => {
      const result = await toggleSheetFavorite(sheetId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setFavorited(result.data?.favorited ?? !favorited);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("size-6 shrink-0", className)}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      disabled={isPending}
      onClick={handleToggle}
    >
      <StarIcon
        className={cn("size-3.5", favorited ? "fill-primary text-primary" : "text-muted-foreground")}
      />
    </Button>
  );
}
