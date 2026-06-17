import { redirect } from "next/navigation";
import { searchGlobal } from "@/actions/search";
import { GlobalSearch } from "@/components/search/global-search";
import { SearchResults } from "@/components/search/search-results";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { requireProfile } from "@/lib/auth/guards";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireProfile();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  if (!query) {
    redirect("/");
  }

  const { results, total } = await searchGlobal(query);

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Search"
          subtitle={
            total > 0
              ? `${total} result${total === 1 ? "" : "s"} for “${query}”`
              : `No results for “${query}”`
          }
        />
      }
      toolbar={
        <div className="border-b bg-muted/30 px-3 py-2">
          <GlobalSearch defaultQuery={query} />
        </div>
      }
    >
      <SearchResults query={query} results={results} total={total} />
    </ListPageShell>
  );
}
