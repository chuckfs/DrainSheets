"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontalIcon, UploadIcon } from "lucide-react";
import { resolveRailWorkspaceId } from "@/lib/rail-workspace";
import { useWorkspaceRail } from "@/components/layout/workspace-rail-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportDialog } from "@/components/import/import-dialog";
import type { RailWorkspace } from "@/components/layout/icon-rail";

export function RailMoreMenu({ workspaces }: { workspaces: RailWorkspace[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const rail = useWorkspaceRail();
  const workspaceId = resolveRailWorkspaceId(
    rail?.activeWorkspaceId ?? null,
    pathname,
    workspaces,
  );
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-rail-foreground/70 hover:bg-rail-accent hover:text-rail-foreground"
              aria-label="More actions"
            >
              <MoreHorizontalIcon className="size-[18px] shrink-0" aria-hidden />
              <span className="text-[10px] font-medium leading-none">More</span>
            </Button>
          }
        />
        <DropdownMenuContent side="right" align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              disabled={!workspaceId}
              onClick={() => workspaceId && setImportOpen(true)}
            >
              <UploadIcon className="size-4" />
              Import
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {workspaceId ? (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          workspaceId={workspaceId}
          onImported={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
