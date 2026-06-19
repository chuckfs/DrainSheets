// Quick Update email body builder (native sheet/row model).
// The caller resolves a row's cells into label/value field rows, so this
// module stays pure and independent of column types.

export type EmailLayout = "stacked" | "table";

export type EmailFieldRow = { label: string; value: string };

type BuildUpdateHtmlInput = {
  sheetName: string;
  rowLabel: string;
  fields: EmailFieldRow[];
  message: string;
  layout: EmailLayout;
  senderName: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildQuickUpdateHtml(input: BuildUpdateHtmlInput): string {
  const { fields, layout } = input;

  const messageBlock = input.message.trim()
    ? `<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(input.message.trim())}</p>`
    : "";

  const fieldsHtml =
    layout === "table"
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tbody>
            ${fields
              .map(
                (row) => `<tr>
                  <th style="text-align:left;padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;width:160px;vertical-align:top;">${escapeHtml(row.label)}</th>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;white-space:pre-wrap;">${escapeHtml(row.value).replaceAll("\n", "<br/>")}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : `<div style="margin:16px 0;font-size:14px;">
          ${fields
            .map(
              (row) => `<p style="margin:0 0 12px;"><strong>${escapeHtml(row.label)}</strong><br/>${escapeHtml(row.value).replaceAll("\n", "<br/>")}</p>`,
            )
            .join("")}
        </div>`;

  return `<!DOCTYPE html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.5;padding:24px;">
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Quick update from ${escapeHtml(input.senderName)} via DrainSheets</p>
    <h2 style="margin:0 0 16px;font-size:18px;">${escapeHtml(input.rowLabel)} <span style="color:#9ca3af;font-weight:400;font-size:14px;">· ${escapeHtml(input.sheetName)}</span></h2>
    ${messageBlock}
    ${fields.length > 0 ? fieldsHtml : ""}
  </body>
</html>`;
}

export function buildQuickUpdateText(input: BuildUpdateHtmlInput): string {
  const lines = [
    `Quick update from ${input.senderName} via DrainSheets`,
    `${input.rowLabel} — ${input.sheetName}`,
    "",
  ];
  if (input.message.trim()) {
    lines.push(input.message.trim(), "");
  }
  for (const field of input.fields) {
    lines.push(`${field.label}: ${field.value}`);
  }
  return lines.join("\n");
}

export function buildDefaultQuickUpdateSubject(rowLabel: string): string {
  return `Quick Update: ${rowLabel}`;
}
