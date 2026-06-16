const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
};

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mimeTypeLabel(mimeType: string | null | undefined): string {
  if (!mimeType) {
    return "—";
  }

  return MIME_LABELS[mimeType] ?? mimeType.split("/").pop()?.toUpperCase() ?? mimeType;
}
