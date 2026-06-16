export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-() ]+/g, "_").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 200) : "file";
}

export function buildDocumentStoragePath({
  orgId,
  propertyId,
  prospectId,
  documentId,
  fileName,
}: {
  orgId: string;
  propertyId: string;
  prospectId?: string | null;
  documentId: string;
  fileName: string;
}): string {
  const safeName = sanitizeFileName(fileName);
  const fileSegment = `${documentId}_${safeName}`;

  if (prospectId) {
    return `${orgId}/${propertyId}/${prospectId}/${fileSegment}`;
  }

  return `${orgId}/${propertyId}/${fileSegment}`;
}
