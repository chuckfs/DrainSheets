"use client";

import { UploadIcon } from "lucide-react";
import type { ImportPropertyOption, ImportProspectOption } from "@/actions/import";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMPORT_TEMPLATE_DEFS } from "@/lib/import/mapping";
import type { ImportMode, ImportTemplate } from "@/lib/validations/import";
import { IMPORT_MODES } from "@/lib/validations/import";

const MODE_LABELS: Record<ImportMode, string> = {
  property: "Properties",
  prospect: "Prospects",
  contact: "Contacts",
};

export type ImportUploadStepProps = {
  mode: ImportMode;
  template: ImportTemplate;
  propertyId: string;
  prospectId: string;
  properties: ImportPropertyOption[];
  prospects: ImportProspectOption[];
  canImportProperties: boolean;
  canImportProspects: boolean;
  canImportContacts: boolean;
  fileName: string | null;
  rowCount: number;
  error: string | null;
  onModeChange: (mode: ImportMode) => void;
  onTemplateChange: (template: ImportTemplate) => void;
  onPropertyChange: (propertyId: string) => void;
  onProspectChange: (prospectId: string) => void;
  onFileSelect: (file: File) => void;
};

export function ImportUploadStep({
  mode,
  template,
  propertyId,
  prospectId,
  properties,
  prospects,
  canImportProperties,
  canImportProspects,
  canImportContacts,
  fileName,
  rowCount,
  error,
  onModeChange,
  onTemplateChange,
  onPropertyChange,
  onProspectChange,
  onFileSelect,
}: ImportUploadStepProps) {
  const availableModes = IMPORT_MODES.filter((item) => {
    if (item === "property") {
      return canImportProperties;
    }
    if (item === "prospect") {
      return canImportProspects;
    }
    return canImportContacts;
  });

  const templatesForMode = IMPORT_TEMPLATE_DEFS.filter((item) => item.mode === mode);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Import type</Label>
          <Select
            value={mode}
            onValueChange={(value) => onModeChange(value as ImportMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModes.map((item) => (
                <SelectItem key={item} value={item}>
                  {MODE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Smartsheet template</Label>
          <Select
            value={template}
            onValueChange={(value) => onTemplateChange(value as ImportTemplate)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (auto-map columns)</SelectItem>
              {templatesForMode.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "prospect" && (
        <div className="space-y-2">
          <Label>Assign to property</Label>
          <Select
            value={propertyId}
            onValueChange={(value) => onPropertyChange(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode === "contact" && (
        <div className="space-y-2">
          <Label>Assign to prospect</Label>
          <Select
            value={prospectId}
            onValueChange={(value) => onProspectChange(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a prospect" />
            </SelectTrigger>
            <SelectContent>
              {prospects.map((prospect) => (
                <SelectItem key={prospect.id} value={prospect.id}>
                  {prospect.company_name}
                  {prospect.property_name ? ` · ${prospect.property_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Spreadsheet file</Label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/40">
          <UploadIcon className="size-8 text-muted-foreground" />
          <div className="text-sm font-medium">
            {fileName ? fileName : "Upload CSV or Excel (.csv, .xlsx, .xls)"}
          </div>
          <div className="text-xs text-muted-foreground">
            {rowCount > 0 ? `${rowCount} rows detected` : "Max 5 MB · up to 5,000 rows"}
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFileSelect(file);
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" className="mt-1">
            Choose file
          </Button>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
