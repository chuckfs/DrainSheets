"use client";

import { useEffect, useState, useTransition } from "react";
import { grantShare, listShares, revokeShare, updateShareRole, type ShareWithGrantee } from "@/actions/shares";
import { grantableShareRoles } from "@/lib/access/effective-role";
import { accessRoleLabel, orgRoleLabel } from "@/lib/permissions/sheet";
import type { AccessRole, ShareResourceType } from "@/types/domain";
import type { OrgUserSearchResult } from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPicker } from "./user-picker";
import { toast } from "sonner";

const RESOURCE_LABELS: Record<ShareResourceType, string> = {
  workspace: "Workspace",
  folder: "Folder",
  sheet: "Sheet",
};

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
}) {
  const [shares, setShares] = useState<ShareWithGrantee[]>([]);
  const [selectedUser, setSelectedUser] = useState<OrgUserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<AccessRole>("editor");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listShares(resourceType, resourceId)
      .then((data) => {
        if (!cancelled) {
          setShares(data);
        }
      })
      .catch((error: Error) => {
        toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, resourceType, resourceId]);

  function refreshShares() {
    void listShares(resourceType, resourceId).then(setShares).catch((error: Error) => {
      toast.error(error.message);
    });
  }

  function handleGrant() {
    if (!selectedUser) {
      return;
    }

    startTransition(async () => {
      const result = await grantShare(resourceType, resourceId, selectedUser.id, selectedRole);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSelectedUser(null);
      refreshShares();
      toast.success(`Shared with ${selectedUser.name}`);
    });
  }

  function handleRoleChange(shareId: string, role: AccessRole) {
    startTransition(async () => {
      const result = await updateShareRole(shareId, role);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      refreshShares();
    });
  }

  function handleRevoke(shareId: string) {
    startTransition(async () => {
      const result = await revokeShare(shareId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      refreshShares();
      toast.success("Share removed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Share {RESOURCE_LABELS[resourceType]} — {resourceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Add user
            </Label>
            {selectedUser ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <UserPicker
                excludeIds={shares.map((share) => share.grantee_id)}
                onSelect={setSelectedUser}
              />
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="share-role" className="text-xs">
                  Access role
                </Label>
                <select
                  id="share-role"
                  value={selectedRole}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(event) => setSelectedRole(event.target.value as AccessRole)}
                >
                  {grantableShareRoles().map((role) => (
                    <option key={role} value={role}>
                      {accessRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!selectedUser || isPending}
                onClick={handleGrant}
              >
                Share
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              People with access
            </Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading shares…</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">No direct shares yet.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {shares.map((share) => (
                  <li key={share.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{share.grantee.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {share.grantee.email} · Org {orgRoleLabel(share.grantee.role)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{share.accessLabel}</div>
                    </div>
                    <select
                      value={share.role}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      disabled={isPending}
                      onChange={(event) =>
                        handleRoleChange(share.id, event.target.value as AccessRole)
                      }
                    >
                      {grantableShareRoles().map((role) => (
                        <option key={role} value={role}>
                          {accessRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      disabled={isPending}
                      onClick={() => handleRevoke(share.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
