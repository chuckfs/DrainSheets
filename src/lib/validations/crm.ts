import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const PROSPECT_STATUSES = [
  "researching",
  "contacted",
  "interested",
  "passed",
  "closed",
] as const;

export const prospectSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200),
  category: z.string().max(100).optional().or(z.literal("")),
  website: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().url("Enter a valid URL (include https://)").optional(),
  ),
  status: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.enum(PROSPECT_STATUSES).optional(),
  ),
  comments: z.string().max(2000).optional().or(z.literal("")),
});

export type ProspectInput = z.infer<typeof prospectSchema>;

function emptyToNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function parsePropertyForm(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    description: formData.get("description") ?? "",
  });
}

export function propertyInputToRow(input: PropertyInput) {
  return {
    name: input.name.trim(),
    address: emptyToNull(input.address),
    city: emptyToNull(input.city),
    state: emptyToNull(input.state),
    description: emptyToNull(input.description),
  };
}

export function parseProspectForm(formData: FormData) {
  const status = formData.get("status");
  return prospectSchema.safeParse({
    company_name: formData.get("company_name"),
    category: formData.get("category") ?? "",
    website: formData.get("website") ?? "",
    status: status && status !== "" ? status : "",
    comments: formData.get("comments") ?? "",
  });
}

export function prospectInputToRow(input: ProspectInput) {
  return {
    company_name: input.company_name.trim(),
    category: emptyToNull(input.category),
    website: emptyToNull(input.website),
    status: input.status ?? null,
    comments: emptyToNull(input.comments),
  };
}

export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional().or(z.literal("")),
  title: z.string().max(100).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().email("Enter a valid email").optional(),
  ),
  phone: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") ?? "",
    title: formData.get("title") ?? "",
    company: formData.get("company") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export function contactInputToRow(input: ContactInput) {
  return {
    first_name: input.first_name.trim(),
    last_name: emptyToNull(input.last_name),
    title: emptyToNull(input.title),
    company: emptyToNull(input.company),
    email: emptyToNull(input.email),
    phone: emptyToNull(input.phone),
    notes: emptyToNull(input.notes),
  };
}
