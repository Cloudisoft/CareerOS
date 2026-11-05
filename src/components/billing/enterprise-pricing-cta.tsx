"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Plan = "STARTER" | "PROFESSIONAL";

/**
 * Employer plan buttons on the public Pricing page. "Pay now" opens the
 * Recruiter Suite billing page with PayPal checkout already started for the
 * plan; "Start free trial" starts the 3-day trial. Visitors who aren't signed
 * in create an employer account first and land in the same place.
 */
export function EnterprisePricingCta({ plan, action, recommended }: { plan: Plan; action: "pay" | "trial"; recommended?: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setRole(j?.data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const target = action === "pay" ? `/employer/enterprise/billing?plan=${plan}` : `/employer/enterprise?trial=1`;

  function go() {
    if (!role) return router.push(`/signup?as=EMPLOYER&next=${encodeURIComponent(target)}`);
    router.push(target);
  }

  const signedInAsCandidate = role === "CANDIDATE";
  return (
    <div>
      <Button variant={action === "pay" ? (recommended ? "primary" : "secondary") : "outline"} className="w-full" onClick={go} disabled={signedInAsCandidate}>
        {action === "pay" ? "Pay now with PayPal" : "Start 3-day free trial"}
      </Button>
      {signedInAsCandidate && action === "pay" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">You&apos;re signed in as a job seeker. Use an employer account to subscribe.</p>
      )}
    </div>
  );
}
