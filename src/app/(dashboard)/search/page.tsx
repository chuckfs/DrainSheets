import { redirect } from "next/navigation";
import { searchGlobal } from "@/actions/search";
import { GlobalSearch } from "@/components/search/global-search";
import { SearchResults } from "@/components/search/search-results";
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
    <div className="space-y-6">
      <GlobalSearch defaultQuery={query} />
      <SearchResults query={query} results={results} total={total} />
    </div>
  );
}
