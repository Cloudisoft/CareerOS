"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/billing/plans";

export function PricingCta({ plan, recommended }: { plan: PlanKey; recommended?: boolean }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => setAuthed(r.ok));
  }, []);

  function handleClick() {
    if (!authed) {
      router.push("/signup");
      return;
    }
    if (plan === "FREE") {
      router.push("/dashboard");
      return;
    }
    router.push(`/checkout?kind=plan&key=${plan}`);
  }

  return (
    <Button variant={recommended ? "primary" : "secondary"} className="w-full" onClick={handleClick}>
      {plan === "FREE" && authed ? "Go to dashboard" : "Get started"}
    </Button>
  );
}
