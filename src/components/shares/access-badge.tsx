import type { AccessContext } from "@/lib/access/effective-role";
import { accessRoleLabel } from "@/lib/permissions/sheet";
import { Badge } from "@/components/ui/badge";

export function AccessBadge({ access }: { access: AccessContext }) {
  if (!access.canView) {
    return null;
  }

  return (
    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
      {access.effectiveRole ? accessRoleLabel(access.effectiveRole) : "No access"} ·{" "}
      {access.sourceLabel}
    </Badge>
  );
}
