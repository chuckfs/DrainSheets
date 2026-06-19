import { z } from "zod";

export const EMAIL_LAYOUTS = ["stacked", "table"] as const;
export type EmailLayout = (typeof EMAIL_LAYOUTS)[number];

const emailAddressSchema = z.string().trim().email("Enter a valid email address");

export const sendQuickUpdateSchema = z.object({
  sheetId: z.string().uuid(),
  rowId: z.string().uuid(),
  to: z
    .array(emailAddressSchema)
    .min(1, "Add at least one recipient")
    .max(25, "Maximum 25 recipients"),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  message: z.string().max(5000).optional().default(""),
  ccMe: z.boolean().default(false),
  // Column keys from the sheet to include as fields in the email body.
  includedColumnKeys: z.array(z.string()).max(100),
  attachmentIds: z.array(z.string().uuid()).max(10, "Maximum 10 attachments per email"),
  layout: z.enum(EMAIL_LAYOUTS).default("stacked"),
});

export type SendQuickUpdateInput = z.infer<typeof sendQuickUpdateSchema>;
