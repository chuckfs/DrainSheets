"use server";

import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createResendClient, getEmailConfig } from "@/lib/email/resend";
import {
  buildDefaultQuickUpdateSubject,
  buildQuickUpdateHtml,
  buildQuickUpdateText,
  type EmailFieldRow,
} from "@/lib/email/build-update-html";
import { sendQuickUpdateSchema, type SendQuickUpdateInput } from "@/lib/validations/email";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";

const DOCUMENTS_BUCKET = "documents";

export type EmailableAttachment = {
  id: string;
  file_name: string;
  file_size: number | null;
  scope: "row" | "sheet";
};

type SelectOption = { value: string; label?: string };

function selectLabel(column: SheetColumn, raw: string): string {
  const config = column.config as { options?: SelectOption[] } | null;
  const option = config?.options?.find((candidate) => candidate.value === raw);
  return option?.label ?? raw;
}

function formatCellForEmail(column: SheetColumn, value: Json | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (column.type === "checkbox") {
    return value ? "Yes" : "No";
  }
  if (column.type === "select" && typeof value === "string") {
    return selectLabel(column, value);
  }
  if (typeof value === "object") {
    return Array.isArray(value) ? value.map((item) => String(item)).join(", ") : JSON.stringify(value);
  }
  return String(value);
}

function rowDataOf(data: Json | null): Record<string, Json | undefined> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data as Record<string, Json | undefined>;
}

/**
 * Attachments that can be included in a Quick Update — files on the row itself
 * plus sheet-level files. RLS guarantees the caller can already see them.
 */
export async function getEmailableAttachments(
  sheetId: string,
  rowId: string,
): Promise<EmailableAttachment[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_size, row_id")
    .eq("sheet_id", sheetId)
    .or(`row_id.eq.${rowId},row_id.is.null`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((document) => ({
    id: document.id,
    file_name: document.file_name,
    file_size: document.file_size,
    scope: document.row_id ? "row" : "sheet",
  }));
}

export async function sendQuickUpdate(
  input: SendQuickUpdateInput,
): Promise<ActionResult<{ emailLogId: string }>> {
  const profile = await requireProfile();
  const parsed = sendQuickUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid email request");
  }
  const data = parsed.data;

  const emailConfig = getEmailConfig();
  if (!emailConfig) {
    return actionError(
      "Email isn't configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL to enable sending.",
    );
  }

  const supabase = await createClient();

  // Load the row (RLS-scoped) and confirm it belongs to the sheet.
  const { data: row, error: rowError } = await supabase
    .from("rows")
    .select("id, sheet_id, data")
    .eq("id", data.rowId)
    .single();

  if (rowError || !row || row.sheet_id !== data.sheetId) {
    return actionError("Row not found or you don't have access to it");
  }

  const { data: sheet } = await supabase
    .from("sheets")
    .select("name")
    .eq("id", data.sheetId)
    .single();

  const { data: columns } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("sheet_id", data.sheetId)
    .order("position", { ascending: true });

  const sheetColumns = (columns ?? []) as SheetColumn[];
  const rowData = rowDataOf(row.data);
  const primaryColumn = sheetColumns.find((column) => column.is_primary);
  const rowLabel = primaryColumn
    ? formatCellForEmail(primaryColumn, rowData[primaryColumn.key])
    : "Row";
  const sheetName = sheet?.name ?? "Sheet";

  // Resolve the chosen columns into email field rows, preserving column order.
  const includedKeys = new Set(data.includedColumnKeys);
  const fields: EmailFieldRow[] = sheetColumns
    .filter((column) => includedKeys.has(column.key))
    .map((column) => ({
      label: column.label,
      value: formatCellForEmail(column, rowData[column.key]),
    }));

  // Load + download selected attachments (scoped to this sheet for safety).
  const attachments: { filename: string; content: Buffer }[] = [];
  if (data.attachmentIds.length > 0) {
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, file_name, file_path")
      .eq("sheet_id", data.sheetId)
      .in("id", data.attachmentIds);

    if (docsError) {
      return actionError("Could not load the selected attachments");
    }

    for (const doc of docs ?? []) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .download(doc.file_path);
      if (downloadError || !blob) {
        return actionError(`Could not attach "${doc.file_name}"`);
      }
      attachments.push({
        filename: doc.file_name,
        content: Buffer.from(await blob.arrayBuffer()),
      });
    }
  }

  const subject = data.subject.trim() || buildDefaultQuickUpdateSubject(rowLabel);
  const message = data.message ?? "";
  const htmlInput = {
    sheetName,
    rowLabel,
    fields,
    message,
    layout: data.layout,
    senderName: profile.name,
  };

  const cc = data.ccMe ? [profile.email] : [];
  const resend = createResendClient(emailConfig);

  let resendId: string | null = null;
  let sendError: string | null = null;
  try {
    const response = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: data.to,
      cc: cc.length > 0 ? cc : undefined,
      subject,
      html: buildQuickUpdateHtml(htmlInput),
      text: buildQuickUpdateText(htmlInput),
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    if (response.error) {
      sendError = response.error.message;
    } else {
      resendId = response.data?.id ?? null;
    }
  } catch (error) {
    sendError = error instanceof Error ? error.message : "Failed to send email";
  }

  // Always log the attempt.
  const { data: log, error: logError } = await supabase
    .from("email_logs")
    .insert({
      org_id: profile.org_id,
      sheet_id: data.sheetId,
      row_id: data.rowId,
      sent_by: profile.id,
      to_addresses: data.to,
      cc_addresses: cc,
      subject,
      message,
      included_fields: data.includedColumnKeys,
      attachment_ids: data.attachmentIds,
      layout: data.layout,
      resend_id: resendId,
      status: sendError ? "failed" : "sent",
      error_message: sendError,
    })
    .select("id")
    .single();

  if (sendError) {
    return actionError(`Email failed to send: ${sendError}`);
  }
  if (logError || !log) {
    // Email sent but logging failed — surface success, the email did go out.
    return actionSuccess({ emailLogId: "" });
  }

  return actionSuccess({ emailLogId: log.id });
}
