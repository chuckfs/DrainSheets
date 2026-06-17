"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useListSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return { searchParams, updateParams };
}

export const compactSelectClassName =
  "h-7 rounded-md border border-input bg-background px-2 text-xs";
