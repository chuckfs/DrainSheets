"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createSheetShareLink,
  getSheetShareLink,
  regenerateSheetShareLink,
  updateSheetShareLink,
  type SheetShareLink,
} from "@/actions/share-links";
import { accessRoleLabel } from "@/lib/permissions/sheet";
import type { AccessRole } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LINK_ROLES: AccessRole[] = ["viewer", "commenter", "editor"];
const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

export function ShareLinkSection({ sheetId }: { sheetId: string }) {
  const [link, setLink] = useState<SheetShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftRole, setDraftRole] = useState<AccessRole>("viewer");
  const [origin, setOrigin] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getSheetShareLink(sheetId)
      .then((data) => {
        if (!cancelled) setLink(data);
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sheetId]);

  const linkUrl = link ? `${origin}/join/${link.token}` : "";

  function handleCreate() {
    startTransition(async () => {
      const result = await createSheetShareLink(sheetId, draftRole);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLink(result.data ?? null);
      toast.success("Share link created");
    });
  }

  function handleRoleChange(role: AccessRole) {
    startTransition(async () => {
      const result = await updateSheetShareLink(sheetId, { role });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLink(result.data ?? null);
    });
  }

  function handleToggleActive() {
    if (!link) return;
    startTransition(async () => {
      const result = await updateSheetShareLink(sheetId, { isActive: !link.is_active });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLink(result.data ?? null);
      toast.success(link.is_active ? "Link disabled" : "Link enabled");
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateSheetShareLink(sheetId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLink(result.data ?? null);
      toast.success("Link regenerated — the old link no longer works");
    });
  }

  function handleCopy() {
    if (!linkUrl) return;
    void navigator.clipboard
      .writeText(linkUrl)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy link"));
  }

  return (
    <section className="space-y-2 rounded-md border p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Share via link
      </Label>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !link ? (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="link-role" className="text-xs">
              Anyone in your org with the link can
            </Label>
            <select
              id="link-role"
              className={`${selectClass} w-full`}
              value={draftRole}
              onChange={(event) => setDraftRole(event.target.value as AccessRole)}
            >
              {LINK_ROLES.map((role) => (
                <option key={role} value={role}>
                  {accessRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" disabled={isPending} onClick={handleCreate}>
            Create link
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={linkUrl} className="h-8 text-xs" />
            <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Access:</span>
            <select
              className={selectClass}
              value={link.role}
              disabled={isPending}
              onChange={(event) => handleRoleChange(event.target.value as AccessRole)}
            >
              {LINK_ROLES.map((role) => (
                <option key={role} value={role}>
                  {accessRoleLabel(role)}
                </option>
              ))}
            </select>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                link.is_active
                  ? "bg-green-500/10 text-green-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {link.is_active ? "Enabled" : "Disabled"}
            </span>
            <div className="flex-1" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={handleToggleActive}
            >
              {link.is_active ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
