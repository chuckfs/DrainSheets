"use client";

import { useState } from "react";
import { FileUpIcon } from "lucide-react";
import { ImportDialog } from "@/components/import/import-dialog";
import { Button } from "@/components/ui/button";
import type { ImportMode } from "@/lib/validations/import";

export function ImportLauncher({
  canImportProperties,
  canImportProspects,
  canImportContacts,
  initialMode,
}: {
  canImportProperties: boolean;
  canImportProspects: boolean;
  canImportContacts: boolean;
  initialMode?: ImportMode;
}) {
  const [open, setOpen] = useState(false);
  const canImport = canImportProperties || canImportProspects || canImportContacts;

  if (!canImport) {
    return null;
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <FileUpIcon className="size-3.5" />
        <span className="hidden sm:inline">Import</span>
      </Button>
      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        canImportProperties={canImportProperties}
        canImportProspects={canImportProspects}
        canImportContacts={canImportContacts}
        initialMode={initialMode}
      />
    </>
  );
}
