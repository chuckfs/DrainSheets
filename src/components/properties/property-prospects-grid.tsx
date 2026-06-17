"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquareIcon, PaperclipIcon, StoreIcon } from "lucide-react";
import type { ProspectWithProperty } from "@/actions/prospects";
import type { PropertyProspectContact } from "@/actions/contacts";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { cn } from "@/lib/utils";

export type { PropertyProspectContact as ProspectContactLabel };

export function PropertyProspectsGrid({
  prospects,
  contactLabels,
  indicators,
  selectedProspectId,
  onSelectProspect,
  canAddProspect,
  propertyId,
}: {
  prospects: ProspectWithProperty[];
  contactLabels: PropertyProspectContact[];
  indicators: Map<string, ProspectIndicatorCounts>;
  selectedProspectId: string | null;
  onSelectProspect: (prospectId: string | null) => void;
  canAddProspect: boolean;
  propertyId: string;
}) {
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const contactByProspect = new Map(contactLabels.map((c) => [c.prospect_id, c]));

  if (prospects.length === 0) {
    return (
      <div className="p-4">
        <SmartsheetGridEmpty message="No prospects on this sheet yet." />
        {canAddProspect && (
          <div className="mt-3 text-center">
            <Link
              href={`/properties/${propertyId}/prospects/new`}
              className="text-sm text-link hover:underline"
            >
              Add the first prospect
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <SmartsheetGrid className="border-x-0">
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center">#</SmartsheetGridHead>
          <SmartsheetGridHead className="w-14 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>Tenant / Company</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-28 sm:table-cell">Use</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-36 md:table-cell">Website</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-36 lg:table-cell">Contact</SmartsheetGridHead>
          <SmartsheetGridHead className="w-24">Status</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden min-w-[140px] xl:table-cell">Comments</SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {prospects.map((prospect, index) => {
          const isSelected = selectedProspectId === prospect.id;
          const rowIndicators = indicators.get(prospect.id);
          const contact = contactByProspect.get(prospect.id);
          const commentsExpanded = expandedCommentsId === prospect.id;
          const hasComments = Boolean(prospect.comments?.trim());

          return (
            <SmartsheetGridRow
              key={prospect.id}
              data-state={isSelected ? "selected" : undefined}
              className={cn("cursor-pointer", isSelected && "bg-row-selected")}
              onClick={() => onSelectProspect(isSelected ? null : prospect.id)}
            >
              <SmartsheetGridCell className="text-center text-muted-foreground">
                {index + 1}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <StoreIcon className="size-3.5 text-sheet-icon" aria-hidden />
                  {(rowIndicators?.documentCount ?? 0) > 0 && (
                    <PaperclipIcon
                      className="size-3 text-sheet-icon"
                      aria-label={`${rowIndicators?.documentCount} documents`}
                    />
                  )}
                  {(rowIndicators?.noteCount ?? 0) > 0 && (
                    <MessageSquareIcon
                      className="size-3 text-muted-foreground"
                      aria-label={`${rowIndicators?.noteCount} notes`}
                    />
                  )}
                </div>
              </SmartsheetGridCell>
              <SmartsheetGridCell>
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="font-medium text-link hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {prospect.company_name}
                </Link>
              </SmartsheetGridCell>
              <SmartsheetGridCell className="hidden text-muted-foreground sm:table-cell">
                {prospect.category ?? "—"}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="hidden max-w-[144px] truncate text-muted-foreground md:table-cell">
                {prospect.website ? (
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {prospect.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="hidden lg:table-cell">
                {contact ? (
                  <div className="max-w-[160px] leading-tight">
                    <div className="truncate">{contact.label}</div>
                    {(contact.email || contact.phone) && (
                      <div className="truncate text-xs text-muted-foreground">
                        {[contact.email, contact.phone].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="capitalize text-muted-foreground">
                {prospect.status ?? "—"}
              </SmartsheetGridCell>
              <SmartsheetGridCell className="hidden xl:table-cell">
                {hasComments ? (
                  <button
                    type="button"
                    className={cn(
                      "max-w-[200px] truncate text-left text-muted-foreground hover:text-foreground",
                      commentsExpanded && "whitespace-pre-wrap",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCommentsId(commentsExpanded ? null : prospect.id);
                    }}
                  >
                    {commentsExpanded ? prospect.comments : prospect.comments}
                  </button>
                ) : (
                  "—"
                )}
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          );
        })}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
