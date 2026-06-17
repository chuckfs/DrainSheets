"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { deleteContact } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ContactRowActions({
  contactId,
  prospectId,
  contactName,
  canEdit,
  canDelete,
}: {
  contactId: string;
  prospectId: string;
  contactName: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canEdit && !canDelete) return null;

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${contactName}"? This cannot be undone.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteContact(contactId, prospectId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Actions for ${contactName}`}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        {canEdit && (
          <DropdownMenuItem render={<Link href={`/contacts/${contactId}/edit`} />}>
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            {canEdit && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
