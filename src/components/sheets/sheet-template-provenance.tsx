import type { SheetTemplateProvenance } from "@/actions/templates";

export function SheetTemplateProvenance({ provenance }: { provenance: SheetTemplateProvenance }) {
  if (provenance.kind === "blank") {
    return (
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Template: Blank Sheet
      </span>
    );
  }

  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      Template: {provenance.name} · Version {provenance.version}
    </span>
  );
}
