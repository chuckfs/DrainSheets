"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  executeImport,
  listImportProperties,
  listImportProspects,
  previewImportKeys,
  type ImportPropertyOption,
  type ImportProspectOption,
} from "@/actions/import";
import { ImportMappingStep } from "@/components/import/import-mapping-step";
import { ImportPreviewStep } from "@/components/import/import-preview-step";
import {
  downloadErrorReport,
  ImportResultsStep,
} from "@/components/import/import-results-step";
import { ImportUploadStep } from "@/components/import/import-upload-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { autoMapColumns, isMappingComplete, type ColumnMapping } from "@/lib/import/mapping";
import { parseImportFile, type ImportRow } from "@/lib/import/parser";
import { buildImportPreview } from "@/lib/import/preview";
import type { ImportMode, ImportResult, ImportTemplate } from "@/lib/validations/import";
import { toast } from "sonner";

type ImportStep = "upload" | "mapping" | "preview" | "results";

export type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canImportProperties: boolean;
  canImportProspects: boolean;
  canImportContacts: boolean;
  initialMode?: ImportMode;
};

function defaultMode(props: Pick<ImportDialogProps, "canImportProperties" | "canImportProspects" | "canImportContacts" | "initialMode">): ImportMode {
  if (props.initialMode) {
    return props.initialMode;
  }
  if (props.canImportProperties) {
    return "property";
  }
  if (props.canImportProspects) {
    return "prospect";
  }
  return "contact";
}

export function ImportDialog({
  open,
  onOpenChange,
  canImportProperties,
  canImportProspects,
  canImportContacts,
  initialMode,
}: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [mode, setMode] = useState<ImportMode>(() =>
    defaultMode({ canImportProperties, canImportProspects, canImportContacts, initialMode }),
  );
  const [template, setTemplate] = useState<ImportTemplate>("none");
  const [propertyId, setPropertyId] = useState("");
  const [prospectId, setProspectId] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [properties, setProperties] = useState<ImportPropertyOption[]>([]);
  const [prospects, setProspects] = useState<ImportProspectOption[]>([]);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const resetState = useCallback(() => {
    setStep("upload");
    setMode(defaultMode({ canImportProperties, canImportProspects, canImportContacts, initialMode }));
    setTemplate("none");
    setPropertyId("");
    setProspectId("");
    setColumns([]);
    setRows([]);
    setMapping({});
    setFileName(null);
    setUploadError(null);
    setSkipDuplicates(true);
    setExistingKeys([]);
    setResult(null);
  }, [canImportContacts, canImportProperties, canImportProspects, initialMode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void listImportProperties().then(setProperties).catch(() => setProperties([]));
    void listImportProspects().then(setProspects).catch(() => setProspects([]));
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "contact") {
      return;
    }
    void listImportProspects(propertyId || undefined)
      .then(setProspects)
      .catch(() => setProspects([]));
  }, [open, mode, propertyId]);

  const preview = useMemo(
    () =>
      buildImportPreview({
        mode,
        rows,
        mapping,
        template,
        existingKeys,
        skipDuplicates,
      }),
    [mode, rows, mapping, template, existingKeys, skipDuplicates],
  );

  const canContinueFromUpload =
    rows.length > 0 &&
    (mode !== "prospect" || propertyId) &&
    (mode !== "contact" || prospectId);

  const canContinueFromMapping = isMappingComplete(mapping, mode);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    const parsed = await parseImportFile(file);
    if (!parsed.success) {
      setUploadError(parsed.error);
      setFileName(file.name);
      setColumns([]);
      setRows([]);
      return;
    }

    setFileName(file.name);
    setColumns(parsed.columns);
    setRows(parsed.rows);
    setMapping(autoMapColumns(parsed.columns, mode, template));
  };

  const refreshExistingKeys = async () => {
    const keys = await previewImportKeys({
      mode,
      propertyId: propertyId || undefined,
      prospectId: prospectId || undefined,
    });
    setExistingKeys(keys);
  };

  const handleModeChange = (nextMode: ImportMode) => {
    setMode(nextMode);
    if (columns.length > 0) {
      setMapping(autoMapColumns(columns, nextMode, template));
    }
  };

  const handleTemplateChange = (nextTemplate: ImportTemplate) => {
    setTemplate(nextTemplate);
    if (columns.length > 0) {
      setMapping(autoMapColumns(columns, mode, nextTemplate));
    }
  };

  const handleMappingChange = (column: string, field: ColumnMapping[string]) => {
    setMapping((current) => ({ ...current, [column]: field }));
  };

  const handleImport = () => {
    startTransition(async () => {
      const response = await executeImport({
        mode,
        template,
        propertyId: propertyId || undefined,
        prospectId: prospectId || undefined,
        skipDuplicates,
        columnMapping: mapping,
        rows,
      });

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setResult(response.data ?? { created: 0, skipped: 0, errors: 0, errorRows: [] });
      setStep("results");
      toast.success("Import finished");
    });
  };

  const stepTitle: Record<ImportStep, string> = {
    upload: "Import from Smartsheet",
    mapping: "Map columns",
    preview: "Preview import",
    results: "Import results",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitle[step]}</DialogTitle>
          <DialogDescription>
            Upload a Smartsheet CSV or Excel export, map columns, preview, and import into
            DrainSheets.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <ImportUploadStep
            mode={mode}
            template={template}
            propertyId={propertyId}
            prospectId={prospectId}
            properties={properties}
            prospects={prospects}
            canImportProperties={canImportProperties}
            canImportProspects={canImportProspects}
            canImportContacts={canImportContacts}
            fileName={fileName}
            rowCount={rows.length}
            error={uploadError}
            onModeChange={handleModeChange}
            onTemplateChange={handleTemplateChange}
            onPropertyChange={setPropertyId}
            onProspectChange={setProspectId}
            onFileSelect={handleFileSelect}
          />
        )}

        {step === "mapping" && (
          <ImportMappingStep
            mode={mode}
            columns={columns}
            mapping={mapping}
            onMappingChange={handleMappingChange}
          />
        )}

        {step === "preview" && (
          <ImportPreviewStep
            preview={preview}
            skipDuplicates={skipDuplicates}
            onSkipDuplicatesChange={setSkipDuplicates}
          />
        )}

        {step === "results" && result && (
          <ImportResultsStep
            result={result}
            onDownloadErrors={() => downloadErrorReport(result)}
          />
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {step !== "upload" && step !== "results" && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setStep(step === "preview" ? "mapping" : "upload")
                }
                disabled={pending}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === "upload" && (
              <Button
                type="button"
                disabled={!canContinueFromUpload}
                onClick={() => {
                  void refreshExistingKeys().then(() => setStep("mapping"));
                }}
              >
                Continue
              </Button>
            )}
            {step === "mapping" && (
              <Button
                type="button"
                disabled={!canContinueFromMapping}
                onClick={() => {
                  void refreshExistingKeys().then(() => setStep("preview"));
                }}
              >
                Preview
              </Button>
            )}
            {step === "preview" && (
              <Button type="button" disabled={pending || preview.validRows === 0} onClick={handleImport}>
                {pending ? "Importing…" : "Confirm import"}
              </Button>
            )}
            {step === "results" && (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
