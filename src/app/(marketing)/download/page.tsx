import type { Metadata } from "next";
import Link from "next/link";
import { Apple, Monitor, Mic, ListChecks, FileText, ShieldCheck, LockKeyhole, UserRound } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { SUPPORT_EMAIL } from "@/config/brand";
import { installerUrls } from "@/lib/companion/downloads";
import { getCompanionDownloadAccess } from "@/lib/companion/access-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CareerOS Interview Companion — Interview AI subscribers",
  description: "Desktop interview assistant for job seekers with an active CareerOS Interview AI subscription.",
  alternates: { canonical: "/download" },
};

const FEATURES = [
  { icon: Mic, title: "Live interview companion", body: "Use microphone or supported system audio during a call, with participant consent and under applicable interview policies." },
  { icon: ListChecks, title: "AI guidance from your CareerOS profile", body: "Get relevant talking points and specialist assistance with your CareerOS subscription." },
  { icon: FileText, title: "Your notes and saved sessions", body: "Generate, edit and export meeting notes. Save session history on your device only when you choose." },
  { icon: ShieldCheck, title: "Privacy controls", body: "Screen privacy can request OS capture exclusion where supported, with separate controls for audio and network activity." },
];

function DownloadButton({ href, icon: Icon, label, sub }: { href: string; icon: typeof Apple; label: string; sub: string }) {
  if (!href) {
    return (
      <div className="flex flex-1 items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-5 py-4 text-muted-foreground">
        <Icon className="h-6 w-6" />
        <span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="block text-xs">Installer currently unavailable</span></span>
      </div>
    );
  }
  return (
    <a href={href} className="flex flex-1 items-center gap-3 rounded-xl bg-brand-gradient px-5 py-4 text-white shadow-sm hover:opacity-95">
      <Icon className="h-6 w-6" />
      <span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-white/85">{sub}</span></span>
    </a>
  );
}

export default async function DownloadPage({ searchParams }: { searchParams?: { platform?: string; upgrade?: string; error?: string } }) {
  const access = await getCompanionDownloadAccess();
  const urls = installerUrls();
  const selectedPlatform = searchParams?.platform === "windows" || searchParams?.platform === "mac-intel"
    ? searchParams.platform : "mac";
  const back = `/download?platform=${selectedPlatform}`;
  const next = encodeURIComponent(back);
  const login = `/login?as=CANDIDATE&next=${next}`;
  const signup = `/signup?as=CANDIDATE&next=${next}`;

  return (
    <>
      <PageHero eyebrow="For candidates and job seekers" title="CareerOS Interview Companion" align="left" />
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
        <div className="space-y-5">
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Your Interview AI desktop assistant for Windows and Mac. Download access requires a CareerOS candidate account with an active Interview AI entitlement (from a qualifying paid plan or Interview AI add-on).
          </p>

          {access === "login" ? (
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-5 w-5 text-primary" /> Sign in to unlock your download</div>
              <p className="text-sm text-muted-foreground">Create a job seeker account or sign in. We will check your Interview AI subscription before allowing an installer download.</p>
              <div className="flex flex-wrap gap-3">
                <Link className="rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white" href={login}>Log in</Link>
                <Link className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground" href={signup}>Create job seeker account</Link>
              </div>
            </div>
          ) : access === "candidate-only" ? (
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3" role="status">
              <div className="flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5 text-primary" /> Candidates only</div>
              <p className="text-sm text-muted-foreground">Interview Companion is available only to candidate/job seeker accounts. Employer and admin accounts cannot download or subscribe to this candidate product from this account view.</p>
              <Link className="text-sm font-semibold text-primary hover:underline" href="/dashboard">Return to dashboard</Link>
            </div>
          ) : access === "subscribe" ? (
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4" role="status">
              <h2 className="font-semibold">Interview AI subscription required</h2>
              <p className="text-sm text-muted-foreground">Your job seeker account does not currently include Interview AI. Subscribe to the Interview AI add-on, or choose a qualifying plan, to unlock the desktop installers.</p>
              <div className="flex flex-wrap gap-3">
                <Link className="rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white" href="/checkout?kind=addon&key=INTERVIEW_AI">Subscribe to Interview AI</Link>
                <Link className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground" href="/pricing">Compare plans</Link>
              </div>
              <p className="text-xs text-muted-foreground">Already subscribed? Confirm your payment on the billing page, then return here.</p>
            </div>
          ) : (
            <div className="space-y-3" role="region" aria-label="Subscriber downloads">
              <p className="text-sm font-semibold text-foreground">Your Interview AI access is active. Choose an installer:</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <DownloadButton href={urls.mac} icon={Apple} label="Download for Mac" sub="Apple Silicon (M-series) · macOS 13+" />
                <DownloadButton href={urls.win} icon={Monitor} label="Download for Windows" sub="Windows 10 or 11" />
              </div>
              {urls.macIntel && <p className="text-sm">Intel Mac? <a href={urls.macIntel} className="font-semibold text-primary hover:underline">Download the Intel installer</a></p>}
              {!urls.mac && !urls.win && <p className="text-sm text-muted-foreground">The downloads service is temporarily unavailable. Contact support below.</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="h-5 w-5 text-primary" />{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-semibold">Before you use it in an interview</h2>
          <p className="mt-2">Screen privacy is dependent on the operating system and capture software. It does not remove recording consent or disclosure obligations. Some employers prohibit AI assistance during interviews. For questions visit <Link className="text-primary hover:underline" href="/support">Support</Link> or email <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        </div>
      </div>
    </>
  );
}
