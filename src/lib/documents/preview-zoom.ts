export const PREVIEW_ZOOM_MIN = 0.5;
export const PREVIEW_ZOOM_MAX = 3;
export const PREVIEW_ZOOM_STEP = 0.25;
export const PREVIEW_ZOOM_DEFAULT = 1;

export function clampPreviewZoom(value: number): number {
  return Math.min(
    PREVIEW_ZOOM_MAX,
    Math.max(PREVIEW_ZOOM_MIN, Math.round(value * 100) / 100),
  );
}

export function stepPreviewZoom(current: number, direction: "in" | "out"): number {
  const delta = direction === "in" ? PREVIEW_ZOOM_STEP : -PREVIEW_ZOOM_STEP;
  return clampPreviewZoom(current + delta);
}

export function formatPreviewZoomPercent(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}
