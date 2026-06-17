"use client";

import Link from "next/link";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CreateMenuProps = {
  canCreateProperty?: boolean;
  canCreateProspect?: boolean;
  canCreateContact?: boolean;
  canUploadDocument?: boolean;
  propertyId?: string;
  prospectId?: string;
  onUploadClick?: () => void;
  variant?: "default" | "share";
  className?: string;
};

export function CreateMenu({
  canCreateProperty = false,
  canCreateProspect = false,
  canCreateContact = false,
  canUploadDocument = false,
  propertyId,
  prospectId,
  onUploadClick,
  variant = "default",
  className,
}: CreateMenuProps) {
  const hasAnyAction =
    canCreateProperty || canCreateProspect || canCreateContact || canUploadDocument;

  if (!hasAnyAction) {
    return null;
  }

  const prospectHref = propertyId
    ? `/properties/${propertyId}/prospects/new`
    : "/properties";
  const contactHref = prospectId
    ? `/prospects/${prospectId}/contacts/new`
    : "/prospects";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            size: "sm",
            variant: variant === "share" ? "default" : "outline",
          }),
          variant === "share" && "btn-share gap-1",
          "gap-1",
          className,
        )}
      >
        <PlusIcon className="size-3.5" />
        <span className="hidden sm:inline">Create</span>
        <ChevronDownIcon className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canCreateProperty && (
          <DropdownMenuItem render={<Link href="/properties/new" />}>Property</DropdownMenuItem>
        )}
        {canCreateProspect && (
          <DropdownMenuItem render={<Link href={prospectHref} />}>Prospect</DropdownMenuItem>
        )}
        {canCreateContact && (
          <DropdownMenuItem render={<Link href={contactHref} />}>Contact</DropdownMenuItem>
        )}
        {canUploadDocument &&
          (onUploadClick ? (
            <DropdownMenuItem onClick={onUploadClick}>Upload Document</DropdownMenuItem>
          ) : (
            <DropdownMenuItem render={<Link href="/documents" />}>Upload Document</DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
