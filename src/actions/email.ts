"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import {
  buildDefaultQuickUpdateSubject,
  buildQuickUpdateHtml,
} from "@/lib/email/build-update-html";
import { createResendClient, getEmailConfig } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendQuickUpdateSchema } from "@/lib/validations/email";

export type OrgMemberEmail = {
  id: string;
  name: string;
  email: string;
};

export async function listOrgMemberEmails(): Promise<OrgMemberEmail[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("org_id", profile.org_id)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((row) => row.email).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
  }));
}

type EmailAttachment = {
  filename: string;
  content: Buffer;
};

async function loadEmailAttachments(
  attachmentIds: string[],
  propertyId: string,
): Promise<ActionResult<EmailAttachment[]>> {
  if (attachmentIds.length === 0) {
    return actionSuccess([]);
  }

  const supabase = await createClient();
  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, file_name, file_path, property_id")
    .in("id", attachmentIds)
    .eq("property_id", propertyId);

  if (error) {
    return actionError(error.message);
  }

  if (!documents || documents.length !== attachmentIds.length) {
    return actionError("One or more attachments are not available for this property");
  }

  const admin = createAdminClient();
  const attachments: EmailAttachment[] = [];

  for (const document of documents) {
    const { data: file, error: downloadError } = await admin.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError || !file) {
      return actionError(`Failed to load attachment “${document.file_name}”`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: document.file_name,
      content: buffer,
    });
  }

  return actionSuccess(attachments);
}

export async function sendQuickUpdate(
  input: unknown,
): Promise<ActionResult<{ emailLogId: string; resendId: string | null }>> {
  const profile = await requireProfile();
  const parsed = sendQuickUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid email");
  }

  const data = parsed.data;
  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    return actionError(
      "Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the server environment.",
    );
  }

  const supabase = await createClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, address, city, state, description, org_id")
    .eq("id", data.propertyId)
    .maybeSingle();

  if (propertyError) {
    return actionError(propertyError.message);
  }

  if (!property) {
    return actionError("Property not found");
  }

  let prospect: {
    id: string;
    company_name: string;
    status: string | null;
    category: string | null;
    website: string | null;
    comments: string | null;
  } | null = null;

  if (data.prospectId) {
    const { data: prospectRow, error: prospectError } = await supabase
      .from("prospects")
      .select("id, company_name, status, category, website, comments, property_id")
      .eq("id", data.prospectId)
      .eq("property_id", data.propertyId)
      .maybeSingle();

    if (prospectError) {
      return actionError(prospectError.message);
    }

    if (!prospectRow) {
      return actionError("Prospect not found on this property");
    }

    prospect = prospectRow;
  }

  let contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  }[] = [];

  if (prospect && data.includedFields.includes("contacts")) {
    const { data: contactRows, error: contactsError } = await supabase
      .from("contacts")
      .select("first_name, last_name, email, phone")
      .eq("prospect_id", prospect.id)
      .order("created_at", { ascending: true });

    if (contactsError) {
      return actionError(contactsError.message);
    }

    contacts = contactRows ?? [];
  }

  const attachmentsResult = await loadEmailAttachments(data.attachmentIds, data.propertyId);
  if (!attachmentsResult.success || !attachmentsResult.data) {
    return actionError(
      "error" in attachmentsResult ? attachmentsResult.error : "Failed to load attachments",
    );
  }

  const ccAddresses =
    data.ccMe && profile.email && !data.to.map((e) => e.toLowerCase()).includes(profile.email.toLowerCase())
      ? [profile.email]
      : [];

  const html = buildQuickUpdateHtml({
    property,
    prospect,
    contacts,
    includedFields: data.includedFields,
    message: data.message ?? "",
    layout: data.layout,
    senderName: profile.name,
  });

  const resend = createResendClient(emailConfig);
  let resendId: string | null = null;
  let status = "sent";
  let errorMessage: string | null = null;

  try {
    const response = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: data.to,
      cc: ccAddresses.length > 0 ? ccAddresses : undefined,
      subject: data.subject,
      html,
      attachments: attachmentsResult.data.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    });

    if (response.error) {
      status = "failed";
      errorMessage = response.error.message;
    } else {
      resendId = response.data?.id ?? null;
    }
  } catch (error) {
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "Failed to send email";
  }

  const { data: emailLog, error: logError } = await supabase
    .from("email_logs")
    .insert({
      org_id: profile.org_id,
      property_id: property.id,
      prospect_id: prospect?.id ?? null,
      sent_by: profile.id,
      to_addresses: data.to,
      cc_addresses: ccAddresses,
      subject: data.subject,
      message: data.message ?? "",
      included_fields: data.includedFields,
      attachment_ids: data.attachmentIds,
      layout: data.layout,
      resend_id: resendId,
      status,
      error_message: errorMessage,
    })
    .select("id")
    .single();

  if (logError || !emailLog) {
    return actionError(logError?.message ?? "Email sent but failed to save audit log");
  }

  if (status === "failed") {
    return actionError(errorMessage ?? "Failed to send email");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: prospect ? "prospect" : "property",
    entityId: prospect?.id ?? property.id,
    propertyId: property.id,
    action: "email_sent",
    metadata: {
      subject: data.subject,
      to: data.to,
      name: property.name,
      company_name: prospect?.company_name ?? null,
      prospect_id: prospect?.id ?? null,
      attachment_count: data.attachmentIds.length,
      email_log_id: emailLog.id,
    },
  });

  revalidatePath(`/properties/${property.id}`);
  if (prospect) {
    revalidatePath(`/prospects/${prospect.id}`);
  }

  return actionSuccess({ emailLogId: emailLog.id, resendId });
}

export async function getDefaultQuickUpdateSubject(
  propertyId: string,
  prospectId?: string | null,
): Promise<ActionResult<{ subject: string }>> {
  await requireProfile();
  const supabase = await createClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    return actionError(propertyError.message);
  }

  if (!property) {
    return actionError("Property not found");
  }

  if (!prospectId) {
    return actionSuccess({ subject: buildDefaultQuickUpdateSubject(property.name) });
  }

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .select("company_name")
    .eq("id", prospectId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (prospectError) {
    return actionError(prospectError.message);
  }

  return actionSuccess({
    subject: buildDefaultQuickUpdateSubject(property.name, prospect?.company_name),
  });
}
