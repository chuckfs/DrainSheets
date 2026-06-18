"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { MailIcon, XIcon } from "lucide-react";
import type { DocumentWithRelations } from "@/actions/documents";
import {
  getDefaultQuickUpdateSubject,
  listOrgMemberEmails,
  sendQuickUpdate,
  type OrgMemberEmail,
} from "@/actions/email";
import type { ProspectWithProperty } from "@/actions/prospects";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildDefaultQuickUpdateSubject } from "@/lib/email/build-update-html";
import {
  EMAIL_FIELD_KEYS,
  type EmailFieldKey,
} from "@/lib/validations/email";
import type { Profile, Property } from "@/types/domain";
import { toast } from "sonner";

const FIELD_LABELS: Record<EmailFieldKey, string> = {
  property_name: "Property name",
  property_location: "Property location",
  property_description: "Property description",
  prospect_company: "Company",
  prospect_status: "Status",
  prospect_category: "Use / category",
  prospect_website: "Website",
  prospect_comments: "Comments",
  contacts: "Contacts",
};

function defaultIncludedFields(hasProspect: boolean): EmailFieldKey[] {
  if (hasProspect) {
    return [
      "property_name",
      "prospect_company",
      "prospect_status",
      "prospect_category",
      "contacts",
    ];
  }
  return ["property_name", "property_location"];
}

export function SendUpdateDialog({
  open,
  onOpenChange,
  property,
  prospect,
  documents,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state" | "description">;
  prospect?: ProspectWithProperty | null;
  documents: DocumentWithRelations[];
  profile: Profile;
}) {
  const [pending, startTransition] = useTransition();
  const [orgMembers, setOrgMembers] = useState<OrgMemberEmail[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [externalEmail, setExternalEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ccMe, setCcMe] = useState(true);
  const [layout, setLayout] = useState<"stacked" | "table">("stacked");
  const [includedFields, setIncludedFields] = useState<EmailFieldKey[]>(
    defaultIncludedFields(Boolean(prospect)),
  );
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const availableDocuments = useMemo(() => {
    if (!prospect) {
      return documents.filter((document) => !document.prospect_id);
    }
    return documents.filter(
      (document) => !document.prospect_id || document.prospect_id === prospect.id,
    );
  }, [documents, prospect]);

  const availableFieldKeys = useMemo(() => {
    return EMAIL_FIELD_KEYS.filter((key) => {
      if (key.startsWith("prospect_") || key === "contacts") {
        return Boolean(prospect);
      }
      return true;
    });
  }, [prospect]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIncludedFields(defaultIncludedFields(Boolean(prospect)));
    setSubject(buildDefaultQuickUpdateSubject(property.name, prospect?.company_name));
    setAttachmentIds(
      availableDocuments
        .filter((document) =>
          prospect ? document.prospect_id === prospect.id : !document.prospect_id,
        )
        .slice(0, 3)
        .map((document) => document.id),
    );

    void getDefaultQuickUpdateSubject(property.id, prospect?.id ?? null).then((result) => {
      if (result.success && result.data?.subject) {
        setSubject(result.data.subject);
      }
    });

    void listOrgMemberEmails()
      .then(setOrgMembers)
      .catch(() => {
        toast.error("Could not load organization recipients");
      });
  }, [open, property.id, property.name, prospect, availableDocuments]);

  const comboboxOptions = useMemo(
    () =>
      orgMembers
        .filter((member) => member.id !== profile.id)
        .filter((member) => !recipients.includes(member.email))
        .map((member) => ({
          value: member.email,
          label: member.name,
          description: member.email,
        })),
    [orgMembers, profile.id, recipients],
  );

  function addExternalRecipient() {
    const email = externalEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!recipients.includes(email)) {
      setRecipients((current) => [...current, email]);
    }
    setExternalEmail("");
  }

  function removeRecipient(email: string) {
    setRecipients((current) => current.filter((value) => value !== email));
  }

  function toggleField(field: EmailFieldKey) {
    setIncludedFields((current) =>
      current.includes(field) ? current.filter((value) => value !== field) : [...current, field],
    );
  }

  function toggleAttachment(documentId: string) {
    setAttachmentIds((current) =>
      current.includes(documentId)
        ? current.filter((value) => value !== documentId)
        : [...current, documentId],
    );
  }

  function handleSend() {
    startTransition(async () => {
      const result = await sendQuickUpdate({
        propertyId: property.id,
        prospectId: prospect?.id ?? null,
        to: recipients,
        subject,
        message,
        ccMe,
        includedFields,
        attachmentIds,
        layout,
      });

      if (!result.success) {
        toast.error("error" in result ? result.error : "Failed to send update");
        return;
      }

      toast.success("Quick update sent");
      onOpenChange(false);
      setRecipients([]);
      setMessage("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Send update</DialogTitle>
          <DialogDescription>
            Email a quick update for {property.name}
            {prospect ? ` · ${prospect.company_name}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <Label>To</Label>
            <Combobox
              options={comboboxOptions}
              placeholder="Add organization member…"
              searchPlaceholder="Search team members…"
              emptyMessage="No team members found."
              onSelect={(email) => {
                if (!recipients.includes(email)) {
                  setRecipients((current) => [...current, email]);
                }
              }}
            />
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="External email address"
                value={externalEmail}
                onChange={(event) => setExternalEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addExternalRecipient();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addExternalRecipient}>
                Add
              </Button>
            </div>
            {recipients.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <li
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-1 text-xs"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      onClick={() => removeRecipient(email)}
                      aria-label={`Remove ${email}`}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <Label htmlFor="send-update-subject">Subject</Label>
            <Input
              id="send-update-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </section>

          <section className="space-y-2">
            <Label htmlFor="send-update-message">Message</Label>
            <Textarea
              id="send-update-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add a note to include above the row details…"
              rows={4}
            />
          </section>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={ccMe}
              onChange={(event) => setCcMe(event.target.checked)}
            />
            CC me ({profile.email})
          </label>

          <section className="space-y-2">
            <Label>Include fields</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableFieldKeys.map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border"
                    checked={includedFields.includes(field)}
                    onChange={() => toggleField(field)}
                  />
                  {FIELD_LABELS[field]}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Label>Attachments</Label>
            {availableDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents available.</p>
            ) : (
              <div className="space-y-2">
                {availableDocuments.map((document) => (
                  <label key={document.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={attachmentIds.includes(document.id)}
                      onChange={() => toggleAttachment(document.id)}
                    />
                    <span className="truncate">{document.file_name}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <Label htmlFor="send-update-layout">Layout</Label>
            <Select
              value={layout}
              onValueChange={(value) => setLayout(value as "stacked" | "table")}
            >
              <SelectTrigger id="send-update-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stacked">Stacked</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-share gap-1.5"
            disabled={pending || recipients.length === 0}
            onClick={handleSend}
          >
            <MailIcon className="size-3.5" />
            {pending ? "Sending…" : "Send update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SendUpdateButton({
  onClick,
  disabled = false,
  size = "sm",
}: {
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "default";
}) {
  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className="gap-1.5"
      disabled={disabled}
      onClick={onClick}
    >
      <MailIcon className="size-3.5" />
      Send update
    </Button>
  );
}
