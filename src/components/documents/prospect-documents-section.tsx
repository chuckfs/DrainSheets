"use client";

import { useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentsTable } from "@/components/documents/documents-table";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/domain";

export function ProspectDocumentsSection({
  propertyId,
  prospectId,
  documents,
  profile,
  canUpload,
}: {
  propertyId: string;
  prospectId: string;
  documents: DocumentWithRelations[];
  profile: Profile;
  canUpload: boolean;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Documents</h2>
        {canUpload && (
          <Button type="button" size="sm" onClick={() => setShowUpload((value) => !value)}>
            {showUpload ? "Hide upload" : "Upload document"}
          </Button>
        )}
      </div>

      {canUpload && showUpload && (
        <DocumentUploadForm
          propertyId={propertyId}
          prospectId={prospectId}
          onSuccess={() => setShowUpload(false)}
        />
      )}

      <DocumentsTable documents={documents} profile={profile} />
    </div>
  );
}
