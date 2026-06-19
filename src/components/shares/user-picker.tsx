"use client";

import { useEffect, useState } from "react";
import { searchOrgUsers, type OrgUserSearchResult } from "@/actions/users";
import { orgRoleLabel } from "@/lib/permissions/sheet";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function UserPicker({
  excludeIds,
  onSelect,
}: {
  excludeIds: string[];
  onSelect: (user: OrgUserSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgUserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchOrgUsers(query, excludeIds);
        if (!cancelled) {
          setResults(users);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, excludeIds]);

  return (
    <div className="space-y-2">
      <Input
        value={query}
        placeholder="Search by name or email…"
        className="h-8 text-sm"
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="max-h-48 overflow-auto rounded-md border">
        {loading ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
        ) : results.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">No users found</li>
        ) : (
          results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col px-3 py-2 text-left hover:bg-muted",
                )}
                onClick={() => onSelect(user)}
              >
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <span className="text-[11px] text-muted-foreground">
                  Org role: {orgRoleLabel(user.role)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
