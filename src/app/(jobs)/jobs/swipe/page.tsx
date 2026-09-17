import Link from "next/link";
import { LayoutList } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { SwipeDeck } from "@/components/jobs/swipe-deck";

export default async function SwipeJobsPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Swipe jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your best matches, one at a time. Swipe right to apply, left to skip.
          </p>
        </div>
        <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <LayoutList className="h-4 w-4" /> List view
        </Link>
      </div>

      <SwipeDeck authed={Boolean(user)} />
    </div>
  );
}
