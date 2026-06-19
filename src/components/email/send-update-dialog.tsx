"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getEmailableAttachments,
  sendQuickUpdate,
  type EmailableAttachment,
} from "@/actions/email";
import type { EmailLayout } from "@/lib/validations/email";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type RowData = Record<string, Json | undefined>;

function previewValue(value: Json | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function parseRecipients(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function SendUpdateDialog({
  open,
  onOpenChange,
  sheetId,
  rowId,
  rowLabel,
  columns,
  rowData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
  rowId: string;
  rowLabel: string;
  columns: SheetColumn[];
  rowData: RowData;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ccMe, setCcMe] = useState(true);
  const [layout, setLayout] = useState<EmailLayout>("stacked");
  const [includedKeys, setIncludedKeys] = useState<Set<string>>(new Set());
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<EmailableAttachment[]>([]);
  const [isPending, startTransition] = useTransition();

  // Initialize fields whenever the dialog opens for a row.
  useEffect(() => {
    if (!open) return;
    setSubject(`Quick Update: ${rowLabel}`);
    setMessage(`Here's a quick update on "${rowLabel}".`);
    setCcMe(true);
    setLayout("stacked");
    setSelectedAttachments(new Set());
    // Default to including every column that has a value.
    const withValues = columns
      .filter((column) => {
        const value = rowData[column.key];
        return value !== null && value !== undefined && value !== "";
      })
      .map((column) => column.key);
    setIncludedKeys(new Set(withValues));

    let cancelled = false;
    void getEmailableAttachments(sheetId, rowId)
      .then((list) => {
        if (!cancelled) setAttachments(list);
      })
      .catch(() => {
        if (!cancelled) setAttachments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sheetId, rowId, rowLabel, columns, rowData]);

  const recipients = useMemo(() => parseRecipients(to), [to]);

  function toggle(set: Set<string>, key: string): Set<string> {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  function handleSend() {
    if (recipients.length === 0) {
      toast.error("Add at least one recipient email");
      return;
    }
    startTransition(async () => {
      const result = await sendQuickUpdate({
        sheetId,
        rowId,
        to: recipients,
        subject,
        message,
        ccMe,
        includedColumnKeys: Array.from(includedKeys),
        attachmentIds: Array.from(selectedAttachments),
        layout,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Update sent");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send update — {rowLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              placeholder="name@example.com, another@example.com"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple recipients with commas.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Include fields
            </Label>
            <ScrollArea className="max-h-40 rounded-md border">
              <div className="space-y-1 p-2">
                {columns.length === 0 ? (
                  <p className="px-1 text-sm text-muted-foreground">No columns on this sheet.</p>
                ) : (
                  columns.map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={includedKeys.has(column.key)}
                        onChange={() => setIncludedKeys((set) => toggle(set, column.key))}
                      />
                      <span className="font-medium">{column.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {previewValue(rowData[column.key])}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Attachments
              </Label>
              <div className="space-y-1 rounded-md border p-2">
                {attachments.map((attachment) => (
                  <label
                    key={attachment.id}
                    className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttachments.has(attachment.id)}
                      onChange={() =>
                        setSelectedAttachments((set) => toggle(set, attachment.id))
                      }
                    />
                    <span className="truncate">{attachment.file_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {attachment.scope === "row" ? "Row" : "Sheet"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ccMe}
                onChange={(event) => setCcMe(event.target.checked)}
              />
              Cc me
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Layout</span>
              <select
                value={layout}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                onChange={(event) => setLayout(event.target.value as EmailLayout)}
              >
                <option value="stacked">Stacked</option>
                <option value="table">Table</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSend} disabled={isPending}>
              {isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
