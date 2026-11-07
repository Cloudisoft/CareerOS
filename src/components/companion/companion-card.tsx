import Link from "next/link";
import Image from "next/image";
import { Apple, Monitor, ArrowRight } from "lucide-react";
import { installerUrls } from "@/lib/companion/downloads";

/* All homepage and dashboard download CTAs lead to the login/subscription gate first. */
export function CompanionCard({ variant = "compact" }: { variant?: "compact" | "wide" }) {
  const urls = installerUrls();
  const available = Boolean(urls.mac || urls.win);
  const wide = variant === "wide";

  const buttons = available ? (
    <div className={wide ? "flex flex-col gap-3 sm:flex-row" : "flex flex-wrap gap-2"}>
      {urls.mac && (
        <a
          href="/download?platform=mac"
          className={
            "inline-flex items-center justify-center gap-2 rounded-lg bg-foreground font-semibold text-background transition-opacity hover:opacity-90 " +
            (wide ? "px-5 py-3 text-sm" : "px-3 py-2 text-xs")
          }
        >
          <Apple className={wide ? "h-4 w-4" : "h-3.5 w-3.5"} /> Download for Mac
        </a>
      )}
      {urls.win && (
        <a
          href="/download?platform=windows"
          className={
            "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface font-semibold text-foreground transition-colors hover:border-primary/40 " +
            (wide ? "px-5 py-3 text-sm" : "px-3 py-2 text-xs")
          }
        >
          <Monitor className={wide ? "h-4 w-4" : "h-3.5 w-3.5"} /> Download for Windows
        </a>
      )}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground">Installers for Mac and Windows are coming soon.</p>
  );

  const more = (
    <p className="text-xs text-muted-foreground">
      {urls.macIntel && (
        <>
          Intel Mac?{" "}
          <a href="/download?platform=mac-intel" className="font-medium text-primary hover:underline">
            Get the Intel version
          </a>{" "}
          ·{" "}
        </>
      )}
      <Link href="/download" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        How it works <ArrowRight className="h-3 w-3" />
      </Link>
    </p>
  );

  if (wide) {
    return (
      <div className="brand-glow grid items-center gap-8 overflow-hidden rounded-2xl border border-border bg-surface p-8 sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Image src="/brand/icon-512.png" alt="" width={96} height={96} className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24" />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">New · Desktop app</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">CareerOS Interview Companion</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              A small window that sits beside your Zoom, Teams or Meet call. When you&apos;re asked a question, it shows a few
              talking points from your own CareerOS resume and saved stories. Sign in with your CareerOS account; it&apos;s
              available to candidate accounts with a paid Interview AI subscription.
            </p>
          </div>
          {buttons}
          {more}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Interview Companion</p>
          <p className="text-xs text-muted-foreground">Desktop app for Mac and Windows</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Talking points from your resume, live during any call: Zoom, Teams, Meet and more.
      </p>
      <div className="mt-3 space-y-2.5">
        {buttons}
        {more}
      </div>
    </div>
  );
}
