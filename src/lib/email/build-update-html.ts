import type { EmailFieldKey } from "@/lib/validations/email";

type BuildUpdateProperty = {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
};

type BuildUpdateProspect = {
  company_name: string;
  status: string | null;
  category: string | null;
  website: string | null;
  comments: string | null;
};

type BuildUpdateContact = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type BuildUpdateHtmlInput = {
  property: BuildUpdateProperty;
  prospect: BuildUpdateProspect | null;
  contacts: BuildUpdateContact[];
  includedFields: EmailFieldKey[];
  message: string;
  layout: "stacked" | "table";
  senderName: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function propertyLocation(property: BuildUpdateProperty): string | null {
  const parts = [property.address, property.city, property.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function contactName(contact: BuildUpdateContact): string {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Contact";
}

function buildFieldRows(input: BuildUpdateHtmlInput): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const { property, prospect, contacts, includedFields } = input;

  if (includedFields.includes("property_name")) {
    rows.push({ label: "Property", value: property.name });
  }

  if (includedFields.includes("property_location")) {
    const location = propertyLocation(property);
    if (location) {
      rows.push({ label: "Location", value: location });
    }
  }

  if (includedFields.includes("property_description") && property.description) {
    rows.push({ label: "Property notes", value: property.description });
  }

  if (prospect) {
    if (includedFields.includes("prospect_company")) {
      rows.push({ label: "Company", value: prospect.company_name });
    }
    if (includedFields.includes("prospect_status") && prospect.status) {
      rows.push({ label: "Status", value: prospect.status });
    }
    if (includedFields.includes("prospect_category") && prospect.category) {
      rows.push({ label: "Use", value: prospect.category });
    }
    if (includedFields.includes("prospect_website") && prospect.website) {
      rows.push({ label: "Website", value: prospect.website });
    }
    if (includedFields.includes("prospect_comments") && prospect.comments) {
      rows.push({ label: "Comments", value: prospect.comments });
    }
  }

  if (includedFields.includes("contacts") && contacts.length > 0) {
    const contactLines = contacts.map((contact) => {
      const parts = [contactName(contact)];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      return parts.join(" · ");
    });
    rows.push({ label: "Contacts", value: contactLines.join("\n") });
  }

  return rows;
}

export function buildQuickUpdateHtml(input: BuildUpdateHtmlInput): string {
  const rows = buildFieldRows(input);
  const messageBlock = input.message.trim()
    ? `<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(input.message.trim())}</p>`
    : "";

  const fieldsHtml =
    input.layout === "table"
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tbody>
            ${rows
              .map(
                (row) => `<tr>
                  <th style="text-align:left;padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;width:140px;vertical-align:top;">${escapeHtml(row.label)}</th>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : `<div style="margin:16px 0;font-size:14px;">
          ${rows
            .map(
              (row) => `<p style="margin:0 0 12px;"><strong>${escapeHtml(row.label)}</strong><br/>${escapeHtml(row.value).replaceAll("\n", "<br/>")}</p>`,
            )
            .join("")}
        </div>`;

  return `<!DOCTYPE html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.5;padding:24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Quick update from ${escapeHtml(input.senderName)} via DrainSheets</p>
    ${messageBlock}
    ${rows.length > 0 ? fieldsHtml : ""}
  </body>
</html>`;
}

export function buildDefaultQuickUpdateSubject(
  propertyName: string,
  prospectCompany?: string | null,
): string {
  if (prospectCompany) {
    return `Update: ${propertyName} — ${prospectCompany}`;
  }
  return `Update: ${propertyName}`;
}
