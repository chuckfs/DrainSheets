"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  buildTemplateMapping,
  createSheetFromImport,
  importIntoTemplate,
  inferColumns,
  parseImportFile,
  previewImport,
} from "@/actions/import";
import { listTemplates, getTemplateWithVersion } from "@/actions/templates";
import { parseTemplateColumns } from "@/lib/templates/template-utils";
import type { ColumnMappingEntry, ImportPreviewSummary, ImportRow, InferredColumn } from "@/lib/import/types";
import type { ColumnType, SheetTemplate } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { ImportErrorBoundary } from "@/components/errors/error-boundaries";
import { ImportMapper } from "./import-mapper";
import { ImportPreviewPanel } from "./import-preview";
import { toast } from "sonner";

type ImportMode = "freeform" | "template";

type Step = "upload" | "configure" | "preview";

export function ImportDialog({
  open,
  onOpenChange,
  workspaceId,
  folderId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  folderId?: string | null;
  onImported?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [mode, setMode] = useState<ImportMode>("freeform");
  const [sheetName, setSheetName] = useState("");
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [inferredColumns, setInferredColumns] = useState<InferredColumn[]>([]);
  const [mapping, setMapping] = useState<Record<string, ColumnMappingEntry>>({});
  const [templates, setTemplates] = useState<SheetTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateColumns, setTemplateColumns] = useState<
    Array<{ key: string; label: string; type: ColumnType }>
  >([]);
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [dedupeColumn, setDedupeColumn] = useState<string>("");
  const [preview, setPreview] = useState<ImportPreviewSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    void listTemplates()
      .then((data) => {
        setTemplates(data.filter((template) => template.scope === "system" && template.key !== "blank"));
      })
      .catch((error: Error) => toast.error(error.message));
  }, [open]);

  const columnTypes = useMemo(() => {
    if (mode === "template") {
      return Object.fromEntries(templateColumns.map((column) => [column.key, column.type]));
    }

    return Object.fromEntries(inferredColumns.map((column) => [column.key, column.type]));
  }, [mode, templateColumns, inferredColumns]);

  const targetOptions = useMemo(() => {
    if (mode === "template") {
      return templateColumns;
    }

    return inferredColumns.map((column) => ({
      key: column.key,
      label: column.label,
      type: column.type,
    }));
  }, [mode, templateColumns, inferredColumns]);

  const dedupeSourceColumn = useMemo(() => {
    if (!dedupeColumn) {
      return sourceHeaders[0] ?? null;
    }

    const entry = Object.values(mapping).find((item) => item.targetKey === dedupeColumn);
    return entry?.sourceHeader ?? sourceHeaders[0] ?? null;
  }, [dedupeColumn, mapping, sourceHeaders]);

  function reset() {
    setStep("upload");
    setMode("freeform");
    setSheetName("");
    setSourceHeaders([]);
    setRows([]);
    setInferredColumns([]);
    setMapping({});
    setSelectedTemplateId("");
    setTemplateColumns([]);
    setSkipDuplicates(false);
    setDedupeColumn("");
    setPreview(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);

      const parsed = await parseImportFile(formData);
      if (!parsed.success || !parsed.data) {
        toast.error(!parsed.success ? parsed.error : "Failed to parse file");
        return;
      }

      const inferred = await inferColumns(parsed.data.columns, parsed.data.rows);
      const initialMapping = Object.fromEntries(
        inferred.map((column) => [
          column.sourceHeader,
          { sourceHeader: column.sourceHeader, targetKey: column.key, typeOverride: column.type },
        ]),
      );

      setSheetName(parsed.data.fileName.replace(/\.(csv|xlsx|xls)$/i, ""));
      setSourceHeaders(parsed.data.columns);
      setRows(parsed.data.rows);
      setInferredColumns(inferred);
      setMapping(initialMapping);
      setStep("configure");
    });
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    startTransition(async () => {
      const [result, withVersion] = await Promise.all([
        buildTemplateMapping(templateId, sourceHeaders),
        getTemplateWithVersion(templateId),
      ]);

      if (!result.success || !result.data) {
        toast.error(!result.success ? result.error : "Failed to build mapping");
        return;
      }

      setMapping(result.data);

      if (withVersion) {
        const columns = parseTemplateColumns(withVersion.version.columns);
        setTemplateColumns(
          columns.map((column) => ({ key: column.key, label: column.label, type: column.type })),
        );
      }
    });
  }

  function handlePreview() {
    startTransition(async () => {
      const result = await previewImport({
        mapping,
        columnTypes,
        rows,
        dedupe: {
          enabled: skipDuplicates,
          sourceColumn: skipDuplicates ? dedupeSourceColumn : null,
        },
      });

      if (!result.success || !result.data) {
        toast.error(!result.success ? result.error : "Failed to build preview");
        return;
      }

      setPreview(result.data);
      setStep("preview");
    });
  }

  function handleImport() {
    startTransition(async () => {
      const dedupe = {
        enabled: skipDuplicates,
        sourceColumn: skipDuplicates ? dedupeSourceColumn : null,
      };

      const result =
        mode === "template" && selectedTemplateId
          ? await importIntoTemplate({
              workspaceId,
              folderId: folderId ?? null,
              sheetName: sheetName.trim(),
              templateId: selectedTemplateId,
              mapping,
              rows,
              dedupe,
            })
          : await createSheetFromImport({
              workspaceId,
              folderId: folderId ?? null,
              sheetName: sheetName.trim(),
              mapping,
              inferredColumns,
              rows,
              dedupe,
            });

      if (!result.success || !result.data) {
        toast.error(!result.success ? result.error : "Import failed");
        return;
      }

      toast.success(`Imported ${result.data.importedRows} rows`);
      reset();
      onOpenChange(false);
      onImported?.();
      router.push(`/sheets/${result.data.sheetId}`);
      router.refresh();
    });
  }

  return (
    <ImportErrorBoundary>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            reset();
          }
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import data</DialogTitle>
          </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-file">CSV or XLSX file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={isPending}
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Destination: {folderId ? "Selected folder" : "Workspace root"}
            </p>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-sheet-name">Sheet name</Label>
              <Input
                id="import-sheet-name"
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "freeform" ? "default" : "outline"}
                onClick={() => setMode("freeform")}
              >
                Freeform import
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "template" ? "default" : "outline"}
                onClick={() => setMode("template")}
              >
                Template import
              </Button>
            </div>

            {mode === "template" && (
              <div className="space-y-1.5">
                <Label htmlFor="import-template">Template</Label>
                <AppSelect
                  id="import-template"
                  value={selectedTemplateId}
                  placeholder="Select template…"
                  options={[
                    { value: "", label: "Select template…" },
                    ...templates.map((template) => ({
                      value: template.id,
                      label: template.name,
                    })),
                  ]}
                  onValueChange={handleTemplateChange}
                />
              </div>
            )}

            <ImportMapper
              sourceHeaders={sourceHeaders}
              mapping={mapping}
              onMappingChange={setMapping}
              targetOptions={targetOptions}
              inferredColumns={inferredColumns}
              mode={mode}
            />

            <div className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(event) => setSkipDuplicates(event.target.checked)}
                />
                Skip duplicate rows
              </label>
              {skipDuplicates && (
                <div className="space-y-1.5">
                  <Label htmlFor="dedupe-column">Dedupe column</Label>
                  <AppSelect
                    id="dedupe-column"
                    value={dedupeColumn}
                    options={[
                      { value: "", label: "Primary / first column" },
                      ...targetOptions.map((option) => ({
                        value: option.key,
                        label: option.label,
                      })),
                    ]}
                    onValueChange={setDedupeColumn}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <ImportPreviewPanel preview={preview} />
        )}

        <DialogFooter>
          {step === "configure" && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                type="button"
                disabled={isPending || !sheetName.trim() || (mode === "template" && !selectedTemplateId)}
                onClick={handlePreview}
              >
                Preview import
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("configure")}>
                Back
              </Button>
              <Button type="button" disabled={isPending || !preview?.validRows} onClick={handleImport}>
                Confirm import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </ImportErrorBoundary>
  );
}
