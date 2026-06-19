"use client";

import { useEffect, useState } from "react";
import { searchContacts as searchContactsAction } from "@/actions/contacts";
import { Input } from "@/components/ui/input";
import { contactDisplayName } from "@/lib/contacts/display";
import { cn } from "@/lib/utils";
import { useSheetContacts } from "./sheet-contact-context";

export function ContactPicker({
  value,
  onCommit,
  onCancel,
}: {
  value: string | null | undefined;
  onCommit: (contactId: string | null) => void;
  onCancel: () => void;
}) {
  const contactsContext = useSheetContacts();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; first_name: string; last_name: string | null; email: string | null; phone: string | null }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await (contactsContext?.searchContacts(query) ??
          searchContactsAction(query));
        if (!cancelled) {
          setResults(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contactsContext, query]);

  const selected = value ? contactsContext?.contactsById.get(value) : undefined;

  return (
    <div className="min-w-[200px] space-y-1 rounded-md border bg-background p-1 shadow-sm">
      <Input
        value={query}
        autoFocus
        placeholder="Search contacts…"
        className="h-7 border-0 text-xs shadow-none focus-visible:ring-0"
        onChange={(event) => setQuery(event.target.value)}
      />
      {selected && (
        <div className="px-1 text-[11px] text-muted-foreground">
          Selected: {contactDisplayName(selected)}
        </div>
      )}
      <ul className="max-h-40 overflow-auto">
        {loading ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">Searching…</li>
        ) : results.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">No contacts found</li>
        ) : (
          results.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-muted",
                  value === contact.id && "bg-muted",
                )}
                onClick={() => onCommit(contact.id)}
              >
                <span className="truncate text-xs">{contactDisplayName(contact)}</span>
                {contact.email && (
                  <span className="truncate text-[11px] text-muted-foreground">{contact.email}</span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="flex gap-2 px-1">
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => onCommit(null)}
        >
          Clear
        </button>
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
