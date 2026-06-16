export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
] as const;

export type DocumentMimeType = (typeof DOCUMENT_ALLOWED_MIME_TYPES)[number];

export const DOCUMENT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
].join(",");

export const SIGNED_URL_EXPIRY_SECONDS = 60;
