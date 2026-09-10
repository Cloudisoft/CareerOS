"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/billing/plans";

export function PricingCta({ plan, recommended }: { plan: PlanKey; recommended?: boolean }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => setAuthed(r.ok));
  }, []);

  async function handleClick() {
    if (!authed) {
      router.push("/signup");
      return;
    }
    if (plan === "FREE") {
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    setLoading(false);
    if (res.ok && json.data.url) {
      window.location.href = json.data.url;
    } else {
      router.push("/settings/billing");
    }
  }

  return (
    <Button variant={recommended ? "primary" : "secondary"} className="w-full" onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {plan === "FREE" && authed ? "Go to dashboard" : "Get started"}
    </Button>
  );
}
