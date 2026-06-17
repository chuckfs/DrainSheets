"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";

export function ResponsivePanel({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  if (!open) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
      >
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0 p-0">
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return children;
}
