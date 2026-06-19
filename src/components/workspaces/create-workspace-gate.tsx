"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function CreateWorkspaceGate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-3 py-8">
      <Button type="button" onClick={() => setOpen(true)}>
        Create workspace
      </Button>
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
