import { describe, expect, it } from "vitest";
import {
  clampPreviewZoom,
  formatPreviewZoomPercent,
  PREVIEW_ZOOM_DEFAULT,
  stepPreviewZoom,
} from "@/lib/documents/preview-zoom";

describe("preview zoom", () => {
  it("clamps zoom to allowed range", () => {
    expect(clampPreviewZoom(0.1)).toBe(0.5);
    expect(clampPreviewZoom(5)).toBe(3);
    expect(clampPreviewZoom(1.25)).toBe(1.25);
  });

  it("steps zoom in and out", () => {
    expect(stepPreviewZoom(PREVIEW_ZOOM_DEFAULT, "in")).toBe(1.25);
    expect(stepPreviewZoom(1.25, "out")).toBe(1);
  });

  it("formats zoom percentage", () => {
    expect(formatPreviewZoomPercent(1)).toBe("100%");
    expect(formatPreviewZoomPercent(1.25)).toBe("125%");
  });
});
