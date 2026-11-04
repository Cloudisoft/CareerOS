"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, Rocket, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api, useEnterprise, UpgradeNotice, ErrorBanner, SuccessBanner, Spinner, Modal, fmtDate, usd, newRequestId } from "@/components/enterprise/shared";
import { PayPalOrderButton } from "@/components/enterprise/paypal";

interface Announcement {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  reactions: number;
  comments: number;
  activeBoost: { id: string; endsAt: string; source: string } | null;
}
interface BoostRow {
  id: string;
  kind: "POST" | "CAMPAIGN";
  source: "FREE" | "PAID";
  name: string | null;
  post: { id: string; excerpt: string } | null;
  jobs: { id: string; title: string }[];
  startsAt: string;
  endsAt: string;
  active: boolean;
  amountCents: number | null;
}
type Target = { kind: "POST"; postId: string } | { kind: "CAMPAIGN"; name: string; jobIds: string[] };

export default function BoostsPage() {
  const { overview, refresh } = useEnterprise();
  const [posts, setPosts] = useState<Announcement[] | null>(null);
  const [boosts, setBoosts] = useState<BoostRow[] | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [content, setContent] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignJobs, setCampaignJobs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<Target | null>(null);

  const allowed = overview?.entitlements.jobAnnouncements;

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([
      api<{ announcements: Announcement[] }>("/api/enterprise/announcements"),
      api<{ boosts: BoostRow[]; checkout: { clientId: string | null } }>("/api/enterprise/boosts"),
    ]);
    if (!p.ok || !b.ok) return setError(p.error ?? b.error);
    setPosts(p.data!.announcements);
    setBoosts(b.data!.boosts);
    setClientId(b.data!.checkout.clientId);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    load();
    api<{ jobs: { id: string; title: string; status: string }[] }>("/api/employer/jobs").then((r) => r.ok && setJobs(r.data!.jobs.filter((j) => j.status === "OPEN")));
  }, [allowed, load]);

  if (!overview) return null;
  if (!allowed) {
    return <UpgradeNotice feature="Job announcements & boosts" description="Post unlimited job announcements to the CareerOS feed, pin them to the top of everyone's feed, and promote jobs to the top of job search." />;
  }

  const freePost = overview.credits.postBoost.remaining;
  const freeCampaign = overview.credits.campaignBoost.remaining;

  async function postAnnouncement() {
    setBusy(true);
    setError(null);
    const res = await api("/api/enterprise/announcements", { method: "POST", json: { content } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setContent("");
    setNotice("Posted to the CareerOS feed. People who follow your company will see it.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await api(`/api/enterprise/announcements/${id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    load();
  }

  async function applyFreeBoost(target: Target) {
    setBusy(true);
    setError(null);
    const res = await api("/api/enterprise/boosts", { method: "POST", json: { ...target, requestId: newRequestId() } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(target.kind === "POST" ? `Boost live for ${overview!.boostDays.POST} days.` : `Campaign live for ${overview!.boostDays.CAMPAIGN} days.`);
    setCampaignName("");
    setCampaignJobs([]);
    await Promise.all([load(), refresh()]);
  }

  async function createOrder(target: Target) {
    const res = await api<{ orderId: string }>("/api/enterprise/boosts/orders", { method: "POST", json: target });
    if (!res.ok) {
      setError(res.error);
      throw new Error(res.error ?? "Could not start checkout");
    }
    return res.data!.orderId;
  }

  async function captured(orderId: string) {
    const res = await api(`/api/enterprise/boosts/orders/${orderId}/capture`, { method: "POST" });
    setCheckout(null);
    if (!res.ok) return setError(res.error);
    setNotice("Payment confirmed — your boost is live.");
    setCampaignName("");
    setCampaignJobs([]);
    load();
  }

  function boostButtons(target: Target, freeLeft: number, price: number) {
    return (
      <div className="flex flex-wrap gap-2">
        {freeLeft > 0 && (
          <Button size="sm" disabled={busy} onClick={() => applyFreeBoost(target)}>
            <Rocket className="h-3.5 w-3.5" /> Use free boost ({freeLeft} left)
          </Button>
        )}
        <Button size="sm" variant={freeLeft > 0 ? "outline" : "primary"} disabled={busy || !overview!.entitlements.paidBoosts || !clientId} onClick={() => setCheckout(target)} title={!clientId ? "PayPal isn't configured" : undefined}>
          <Rocket className="h-3.5 w-3.5" /> Boost for {usd(price)}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" /> New job announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={5} maxLength={3000} placeholder="We're hiring! Share the role, team and how to apply." value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unlimited on your plan</span>
              <Button size="sm" disabled={!content.trim() || busy} onClick={postAnnouncement}>Post</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Rocket className="h-4 w-4" /> Promote jobs (campaign)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Campaign name" maxLength={80} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">You have no open jobs to promote.</p>
              ) : (
                jobs.map((j) => (
                  <label key={j.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={campaignJobs.includes(j.id)}
                      disabled={!campaignJobs.includes(j.id) && campaignJobs.length >= 10}
                      onChange={(e) => setCampaignJobs((c) => (e.target.checked ? [...c, j.id] : c.filter((x) => x !== j.id)))}
                    />
                    {j.title}
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Selected jobs appear first in job search, labelled Promoted, for {overview.boostDays.CAMPAIGN} days. Up to 10 jobs.</p>
            {campaignName.trim() && campaignJobs.length > 0 && boostButtons({ kind: "CAMPAIGN", name: campaignName, jobIds: campaignJobs }, freeCampaign, overview.boostPrices.CAMPAIGN)}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-foreground">Your announcements</h2>
        {!posts ? (
          <Spinner />
        ) : posts.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No announcements yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{p.content}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {p.author} · {fmtDate(p.createdAt)} · {p.reactions} likes · {p.comments} comments
                    </span>
                    <div className="flex items-center gap-2">
                      {p.activeBoost ? (
                        <Badge variant="brand">Boosted until {fmtDate(p.activeBoost.endsAt)}</Badge>
                      ) : (
                        boostButtons({ kind: "POST", postId: p.id }, freePost, overview.boostPrices.POST)
                      )}
                      <Button size="sm" variant="ghost" aria-label="Delete announcement" onClick={() => remove(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-foreground">Boost history</h2>
        {!boosts ? (
          <Spinner />
        ) : boosts.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No boosts yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {boosts.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-foreground">{b.kind === "POST" ? b.post?.excerpt ?? "Removed announcement" : b.name}</p>
                    <p className="truncate text-muted-foreground">
                      {b.kind === "CAMPAIGN" ? b.jobs.map((j) => j.title).join(", ") : "Post boost"} · {fmtDate(b.startsAt)} – {fmtDate(b.endsAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{b.source === "FREE" ? "Plan allowance" : b.amountCents != null ? `Paid ${usd(b.amountCents)}` : "Paid"}</Badge>
                    <Badge variant={b.active ? "success" : "outline"}>{b.active ? "Live" : "Ended"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(checkout && clientId)} onClose={() => setCheckout(null)} title={checkout?.kind === "POST" ? `Boost post · ${usd(overview.boostPrices.POST)}` : `Job campaign · ${usd(overview.boostPrices.CAMPAIGN)}`}>
        {checkout && clientId && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {checkout.kind === "POST"
                ? `Pins this announcement to the top of every CareerOS member's feed for ${overview.boostDays.POST} days.`
                : `Puts ${checkout.jobIds.length} job${checkout.jobIds.length === 1 ? "" : "s"} first in job search for ${overview.boostDays.CAMPAIGN} days.`}{" "}
              One-time payment of {usd(checkout.kind === "POST" ? overview.boostPrices.POST : overview.boostPrices.CAMPAIGN)} — the boost starts only after PayPal confirms it.
            </p>
            <PayPalOrderButton clientId={clientId} createOrder={() => createOrder(checkout)} onApproved={captured} onError={(m) => setError(m)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
