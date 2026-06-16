"use client";

import { useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import type { ProspectWithProperty } from "@/actions/prospects";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentsTable } from "@/components/documents/documents-table";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/domain";

export function PropertyDocumentsSection({
  propertyId,
  documents,
  prospects,
  profile,
  canUpload,
}: {
  propertyId: string;
  documents: DocumentWithRelations[];
  prospects: ProspectWithProperty[];
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
          prospects={prospects}
          onSuccess={() => setShowUpload(false)}
        />
      )}

      <DocumentsTable documents={documents} profile={profile} showProspect />
    </div>
  );
}
