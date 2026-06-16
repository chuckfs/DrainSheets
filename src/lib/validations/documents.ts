import { z } from "zod";
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_BYTES,
  type DocumentMimeType,
} from "@/lib/documents/constants";
import { inferMimeType } from "@/lib/documents/mime";

function isAllowedMimeType(value: string): value is DocumentMimeType {
  return (DOCUMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export const documentFileSchema = z.object({
  fileName: z.string().min(1, "File name is required").max(255),
  mimeType: z.string().refine(isAllowedMimeType, {
    message: "File type is not allowed",
  }),
  fileSize: z
    .number()
    .int()
    .positive("File is empty")
    .max(DOCUMENT_MAX_BYTES, "File must be 25 MB or smaller"),
});

export const documentUploadMetaSchema = z.object({
  propertyId: z.string().uuid("Invalid property"),
  prospectId: z
    .string()
    .uuid("Invalid prospect")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  fileName: z.string().min(1, "File name is required").max(255),
  mimeType: z.string().refine(isAllowedMimeType, {
    message: "File type is not allowed",
  }),
  fileSize: z
    .number()
    .int()
    .positive("File is empty")
    .max(DOCUMENT_MAX_BYTES, "File must be 25 MB or smaller"),
});

export type DocumentUploadMeta = z.infer<typeof documentUploadMetaSchema>;

export const documentFinalizeSchema = documentUploadMetaSchema.extend({
  documentId: z.string().uuid("Invalid document id"),
  storagePath: z.string().min(1, "Storage path is required"),
});

export type DocumentFinalizeInput = z.infer<typeof documentFinalizeSchema>;

export function validateDocumentFile(file: File): string | null {
  const parsed = documentFileSchema.safeParse({
    fileName: file.name,
    mimeType: inferMimeType(file),
    fileSize: file.size,
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid file";
  }

  return null;
}
