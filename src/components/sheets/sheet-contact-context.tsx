"use client";

import { createContext, useContext } from "react";
import type { ContactPickerItem } from "@/actions/contacts";

type SheetContactContextValue = {
  contactsById: Map<string, ContactPickerItem>;
  searchContacts: (query: string) => Promise<ContactPickerItem[]>;
};

export const SheetContactContext = createContext<SheetContactContextValue | null>(null);

export function useSheetContacts() {
  return useContext(SheetContactContext);
}
