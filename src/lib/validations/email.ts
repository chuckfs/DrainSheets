import { z } from "zod";

export const EMAIL_LAYOUTS = ["stacked", "table"] as const;

export const EMAIL_FIELD_KEYS = [
  "property_name",
  "property_location",
  "property_description",
  "prospect_company",
  "prospect_status",
  "prospect_category",
  "prospect_website",
  "prospect_comments",
  "contacts",
] as const;

export type EmailFieldKey = (typeof EMAIL_FIELD_KEYS)[number];

const emailAddressSchema = z.string().email("Enter a valid email address");

export const sendQuickUpdateSchema = z.object({
  propertyId: z.string().uuid(),
  prospectId: z.string().uuid().nullable().optional(),
  to: z.array(emailAddressSchema).min(1, "Add at least one recipient"),
  subject: z.string().min(1, "Subject is required").max(300),
  message: z.string().max(5000).optional().or(z.literal("")),
  ccMe: z.boolean(),
  includedFields: z.array(z.enum(EMAIL_FIELD_KEYS)),
  attachmentIds: z.array(z.string().uuid()).max(10, "Maximum 10 attachments per email"),
  layout: z.enum(EMAIL_LAYOUTS),
});

export type SendQuickUpdateInput = z.infer<typeof sendQuickUpdateSchema>;
