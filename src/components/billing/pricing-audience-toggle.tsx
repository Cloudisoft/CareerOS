"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "job-seekers", label: "Job seekers" },
  { id: "employers", label: "Employers" },
] as const;

/**
 * Job seekers / Employers switch on the Pricing page. It scrolls to that
 * section and highlights whichever section is on screen, so the pill always
 * says where you are.
 */
export function PricingAudienceToggle() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("job-seekers");

  useEffect(() => {
    if (window.location.hash === "#employers") setActive("employers");
    const employers = document.getElementById("employers");
    if (!employers) return;
    const update = () => setActive(employers.getBoundingClientRect().top < window.innerHeight * 0.5 ? "employers" : "job-seekers");
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav aria-label="Pricing for" className="relative mx-auto grid w-fit grid-cols-2 rounded-full border border-border bg-surface p-1 text-sm font-semibold shadow-sm">
      {/* Sliding highlight behind the active option. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          active === "employers" && "translate-x-full"
        )}
      />
      {TABS.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          aria-current={active === t.id ? "true" : undefined}
          onClick={() => setActive(t.id)}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-center transition-colors duration-300",
            active === t.id ? "text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
