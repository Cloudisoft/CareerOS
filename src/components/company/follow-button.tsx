"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Follow / Following toggle; signed-out visitors are sent to log in first. */
export function FollowButton({ slug, initialFollowing, initialCount, canFollow }: { slug: string; initialFollowing: boolean; initialCount: number; canFollow: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!canFollow) {
      window.location.href = `/login?next=${encodeURIComponent(`/company/${slug}`)}`;
      return;
    }
    const next = !following;
    setBusy(true);
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));
    const res = await fetch(`/api/companies/${slug}/follow`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setFollowing(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold text-foreground">
        {count.toLocaleString()} follower{count === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={following}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold transition-opacity disabled:opacity-60",
          following ? "border border-border bg-surface text-foreground hover:bg-surface-raised" : "bg-foreground text-background hover:opacity-90"
        )}
      >
        {following && <Check className="h-4 w-4" />}
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
