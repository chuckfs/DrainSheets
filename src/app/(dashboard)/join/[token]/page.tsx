import Link from "next/link";
import { redirect } from "next/navigation";
import { redeemSheetShareLink } from "@/actions/share-links";
import { requireProfile } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function JoinSheetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireProfile();
  const { token } = await params;
  const result = await redeemSheetShareLink(token);

  if (result.success && result.data) {
    redirect(`/sheets/${result.data.sheetId}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-lg font-semibold">Can&apos;t open this link</h1>
      <p className="text-sm text-muted-foreground">
        {!result.success ? result.error : "This share link is invalid or has been disabled."}
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Go to your sheets
      </Link>
    </div>
  );
}
