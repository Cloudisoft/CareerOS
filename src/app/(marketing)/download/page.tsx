import type { Metadata } from "next";
import Link from "next/link";
import { Apple, Monitor, Mic, ListChecks, FileText, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { SUPPORT_EMAIL } from "@/config/brand";
import { installerUrls } from "@/lib/companion/downloads";

// The buttons depend on whether the downloads bucket is connected on the server.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interview Companion for Mac and Windows",
  description: "A small desktop window that works beside any call app and shows talking points from your CareerOS resume when the interviewer asks a question.",
  alternates: { canonical: "/download" },
};

const FEATURES = [
  { icon: Mic, title: "Works with any call app", body: "Zoom, Teams, Google Meet, Webex and others, in the browser or the desktop app. It listens to your computer's call audio, or your microphone." },
  { icon: ListChecks, title: "Talking points from your resume", body: "When the interviewer asks a question, it shows a few points and a matching story from your own CareerOS resume and saved stories. Never a script." },
  { icon: FileText, title: "Notes when you're done", body: "Save the questions you were asked and the points shown, ready for your thank-you email and your next practice session." },
  { icon: ShieldCheck, title: "Visible and private", body: "An ordinary window you can move or keep on top. Audio is never stored; short clips are turned into text, used once and discarded." },
];

function DownloadButton({ href, icon: Icon, label, sub }: { href: string; icon: typeof Apple; label: string; sub: string }) {
  if (!href) {
    return (
      <div className="flex flex-1 items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-5 py-4 text-muted-foreground">
        <Icon className="h-6 w-6" />
        <span>
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          <span className="block text-xs">Coming soon</span>
        </span>
      </div>
    );
  }
  return (
    <a href={href} className="flex flex-1 items-center gap-3 rounded-xl bg-brand-gradient px-5 py-4 text-white shadow-sm hover:opacity-95">
      <Icon className="h-6 w-6" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-white/85">{sub}</span>
      </span>
    </a>
  );
}

export default function DownloadPage() {
  const urls = installerUrls();
  return (
    <>
      <PageHero eyebrow="Desktop app" title="CareerOS Interview Companion" align="left" />
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
        <div className="space-y-4">
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            A small window that sits beside your interview call. When you&apos;re asked a question, it shows a few talking points from your own CareerOS resume. Sign in with your CareerOS account; it&apos;s included with Interview AI.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <DownloadButton href={urls.mac} icon={Apple} label="Download for Mac" sub="Apple Silicon (M1–M4) · macOS 13+" />
            <DownloadButton href={urls.win} icon={Monitor} label="Download for Windows" sub="Windows 10 or 11" />
          </div>
          {urls.macIntel && (
            <p className="text-xs text-muted-foreground">
              Mac with an Intel processor?{" "}
              <a href={urls.macIntel} className="text-primary hover:underline">Download the Intel version</a>. First time opening it on a Mac, right-click the app and choose Open; on Windows, choose More info, then Run anyway.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Prefer the browser? The Interview Prep Chrome extension does the same on Google Meet, Zoom and Teams calls in Chrome.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon className="h-5 w-5 text-primary" /> {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Before you use it in an interview</h2>
          <p className="mt-2">
            Some places require you to tell everyone on a call that it is being transcribed or AI-assisted, and some employers don&apos;t allow AI assistance in interviews. Those are yours to check. Questions? See{" "}
            <Link href="/support" className="text-primary hover:underline">Support</Link> or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </>
  );
}
