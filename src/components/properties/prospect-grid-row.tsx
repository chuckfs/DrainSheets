"use client";

import { memo } from "react";
import { MessageSquareIcon, PaperclipIcon } from "lucide-react";
import type { ProspectWithProperty } from "@/actions/prospects";
import type { PropertyProspectContact } from "@/actions/contacts";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import {
  ContactCellContent,
  GRID_PIN,
  SmartsheetGridPinCell,
} from "@/components/data/grid-pinned-columns";
import {
  SmartsheetGridCell,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { cn } from "@/lib/utils";

export type ProspectGridRowProps = {
  prospect: ProspectWithProperty;
  index: number;
  contact?: PropertyProspectContact;
  indicators?: ProspectIndicatorCounts;
  isSelected: boolean;
  commentsExpanded: boolean;
  onSelect: () => void;
  onToggleComments: () => void;
  onOpenProspect: () => void;
};

export const ProspectGridRow = memo(function ProspectGridRow({
  prospect,
  index,
  contact,
  indicators,
  isSelected,
  commentsExpanded,
  onSelect,
  onToggleComments,
  onOpenProspect,
}: ProspectGridRowProps) {
  const hasComments = Boolean(prospect.comments?.trim());
  const hasDocuments = (indicators?.documentCount ?? 0) > 0;
  const hasNotes = (indicators?.noteCount ?? 0) > 0;

  return (
    <SmartsheetGridRow
      data-state={isSelected ? "selected" : undefined}
      className={cn("cursor-pointer", isSelected && "bg-row-selected")}
      onClick={onSelect}
    >
      <SmartsheetGridPinCell pinLeft={GRID_PIN.rowNum} selected={isSelected} className="w-10 text-center text-muted-foreground">
        {index + 1}
      </SmartsheetGridPinCell>
      <SmartsheetGridPinCell pinLeft={GRID_PIN.company} selected={isSelected} className="min-w-[160px]">
        <button
          type="button"
          className="truncate text-left font-medium text-link hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenProspect();
          }}
        >
          {prospect.company_name}
        </button>
      </SmartsheetGridPinCell>
      <SmartsheetGridPinCell pinLeft={GRID_PIN.contact} selected={isSelected} className="min-w-[160px]">
        <ContactCellContent
          label={contact?.label ?? ""}
          email={contact?.email}
          phone={contact?.phone}
        />
      </SmartsheetGridPinCell>
      <SmartsheetGridPinCell pinLeft={GRID_PIN.status} selected={isSelected} className="min-w-[88px] capitalize text-muted-foreground">
        {prospect.status ?? "—"}
      </SmartsheetGridPinCell>
      <SmartsheetGridCell className="w-8 text-center">
        {hasDocuments ? (
          <PaperclipIcon
            className="mx-auto size-3.5 text-sheet-icon"
            aria-label={`${indicators?.documentCount} documents`}
          />
        ) : null}
      </SmartsheetGridCell>
      <SmartsheetGridCell className="w-8 text-center">
        {hasNotes ? (
          <MessageSquareIcon
            className="mx-auto size-3.5 text-muted-foreground"
            aria-label={`${indicators?.noteCount} notes`}
          />
        ) : null}
      </SmartsheetGridCell>
      <SmartsheetGridCell className="hidden w-28 text-muted-foreground sm:table-cell">
        {prospect.category ?? "—"}
      </SmartsheetGridCell>
      <SmartsheetGridCell className="hidden max-w-[144px] truncate text-muted-foreground md:table-cell">
        {prospect.website ? (
          <a
            href={prospect.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {prospect.website.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          "—"
        )}
      </SmartsheetGridCell>
      <SmartsheetGridCell className="hidden min-w-[140px] xl:table-cell">
        {hasComments ? (
          <button
            type="button"
            className={cn(
              "max-w-[200px] truncate text-left text-muted-foreground hover:text-foreground",
              commentsExpanded && "whitespace-pre-wrap",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleComments();
            }}
          >
            {prospect.comments}
          </button>
        ) : (
          "—"
        )}
      </SmartsheetGridCell>
    </SmartsheetGridRow>
  );
});
