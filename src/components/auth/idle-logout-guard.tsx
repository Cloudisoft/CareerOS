"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

/**
 * Logs the user out after IDLE_TIMEOUT_MS with no mouse/keyboard/touch
 * activity, regardless of background polling (e.g. the Topbar's
 * notification poll) — those requests keep the server-side session alive
 * but shouldn't count as the user being present, so the idle check lives
 * entirely client-side against real input events.
 */
export function IdleLogoutGuard() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function logout() {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      router.push("/login?error=idle_timeout");
      router.refresh();
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, resetTimer, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, resetTimer);
    };
  }, [router]);

  return null;
}
