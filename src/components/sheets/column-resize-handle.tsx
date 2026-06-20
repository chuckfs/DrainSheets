"use client";

import { useCallback, useRef } from "react";

export function ColumnResizeHandle({
  onResize,
  onResizeEnd,
}: {
  onResize: (deltaX: number) => void;
  onResizeEnd: (totalDelta: number) => void;
}) {
  const startXRef = useRef(0);
  const totalDeltaRef = useRef(0);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const delta = event.clientX - startXRef.current;
      startXRef.current = event.clientX;
      totalDeltaRef.current += delta;
      onResize(delta);
    },
    [onResize],
  );

  const handlePointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    onResizeEnd(totalDeltaRef.current);
    totalDeltaRef.current = 0;
  }, [handlePointerMove, onResizeEnd]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    totalDeltaRef.current = 0;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="absolute top-0 right-0 z-20 h-full w-1.5 cursor-col-resize touch-none after:absolute after:inset-y-0 after:right-0 after:w-[2px] after:bg-primary after:opacity-0 after:transition-opacity hover:after:opacity-100"
      onPointerDown={handlePointerDown}
    />
  );
}
