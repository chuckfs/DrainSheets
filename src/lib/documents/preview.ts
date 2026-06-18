export type PreviewKind = "pdf" | "image" | "unsupported";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function getPreviewKind(
  mimeType: string | null | undefined,
  fileName: string,
): PreviewKind {
  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (normalizedMime === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (IMAGE_MIME_TYPES.has(normalizedMime) || IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  return "unsupported";
}

export function isPreviewable(
  mimeType: string | null | undefined,
  fileName: string,
): boolean {
  return getPreviewKind(mimeType, fileName) !== "unsupported";
}
