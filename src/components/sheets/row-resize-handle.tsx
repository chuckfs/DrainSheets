"use client";

import { useCallback, useRef } from "react";

export function RowResizeHandle({
  onResize,
  onResizeEnd,
}: {
  onResize: (deltaY: number) => void;
  onResizeEnd: (totalDelta: number) => void;
}) {
  const startYRef = useRef(0);
  const totalDeltaRef = useRef(0);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const delta = event.clientY - startYRef.current;
      startYRef.current = event.clientY;
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
    startYRef.current = event.clientY;
    totalDeltaRef.current = 0;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize row"
      className="absolute right-0 bottom-0 left-0 z-20 h-1.5 cursor-row-resize touch-none after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-primary after:opacity-0 after:transition-opacity hover:after:opacity-100"
      onPointerDown={handlePointerDown}
    />
  );
}
