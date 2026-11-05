"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Mail, Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { api, useEnterprise, UpgradeNotice, ErrorBanner, SuccessBanner, Spinner, Modal, fmtDate, newRequestId } from "@/components/enterprise/shared";

interface Lead {
  userId: string;
  name: string;
  avatarUrl: string | null;
  type: "company" | "candidate";
  title: string | null;
  company: string | null;
  location: string | null;
  industry: string | null;
  pendingInmail: boolean;
}
interface Account {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  website: string | null;
  peopleOnCareerOS: number;
  openJobs: number;
}
interface Sent {
  id: string;
  recipientName: string | null;
  company: string | null;
  subject: string;
  status: "DELIVERED" | "REPLIED" | "SENT" | "FAILED";
  creditReturned: boolean;
  sentBy: string | null;
  createdAt: string;
}

type Tab = "leads" | "accounts" | "sent";

export default function InMailPage() {
  const { overview, refresh } = useEnterprise();
  const [tab, setTab] = useState<Tab>("leads");
  const [f, setF] = useState<Record<string, string>>({ type: "all" });
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [leadTotal, setLeadTotal] = useState(0);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountQ, setAccountQ] = useState("");
  const [sent, setSent] = useState<Sent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [to, setTo] = useState<Lead | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [requestId, setRequestId] = useState("");
  const [sending, setSending] = useState(false);
  const allowed = overview?.entitlements.companyOutreach;

  const searchLeads = useCallback(async (filters: Record<string, string>) => {
    setError(null);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v.trim()) params.set(k, v.trim());
    const res = await api<{ leads: Lead[]; total: number }>(`/api/enterprise/inmail/leads?${params}`);
    if (!res.ok) return setError(res.error);
    setLeads(res.data!.leads);
    setLeadTotal(res.data!.total);
  }, []);

  const searchAccounts = useCallback(async (q: string) => {
    const res = await api<{ accounts: Account[] }>(`/api/enterprise/inmail/accounts?q=${encodeURIComponent(q)}`);
    if (!res.ok) return setError(res.error);
    setAccounts(res.data!.accounts);
  }, []);

  const loadSent = useCallback(async () => {
    const res = await api<{ messages: Sent[] }>("/api/enterprise/inmail");
    if (!res.ok) return setError(res.error);
    setSent(res.data!.messages);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    if (tab === "leads" && !leads) searchLeads(f);
    if (tab === "accounts" && !accounts) searchAccounts("");
    if (tab === "sent") loadSent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, tab]);

  if (!overview) return null;
  if (!allowed) {
    return (
      <UpgradeNotice
        feature="InMail"
        description="Find hiring managers, recruiters and open-to-work candidates across CareerOS and message them directly — no connection needed. Credits come back when they reply within 90 days."
      />
    );
  }

  const credits = overview.credits.inmail;

  function compose(lead: Lead) {
    setTo(lead);
    setSubject("");
    setBody("");
    setRequestId(newRequestId());
  }

  async function send() {
    if (!to) return;
    setSending(true);
    setError(null);
    const res = await api("/api/enterprise/inmail", { method: "POST", json: { requestId, recipientUserId: to.userId, subject, body } });
    setSending(false);
    if (!res.ok) {
      setTo(null);
      return setError(res.error);
    }
    setNotice(`InMail delivered to ${to.name}'s CareerOS inbox. If they reply within 90 days, your credit comes back.`);
    setLeads((ls) => ls?.map((l) => (l.userId === to.userId ? { ...l, pendingInmail: true } : l)) ?? ls);
    setTo(null);
    refresh();
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md bg-muted p-1">
          {([["leads", "Lead search", Users], ["accounts", "Account search", Building2], ["sent", "Sent", Mail]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", tab === key ? "bg-surface-raised text-foreground shadow-sm" : "text-muted-foreground")}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{credits.remaining}</span> of {credits.granted} InMail credits left
        </p>
      </div>

      {tab === "leads" && (
        <>
          <Card className="mb-4">
            <CardContent className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchLeads(f);
                }}
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
              >
                <Input placeholder="Keywords or name" value={f.q ?? ""} onChange={(e) => setF({ ...f, q: e.target.value })} />
                <Input placeholder="Title" value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} />
                <Input placeholder="Company" value={f.company ?? ""} onChange={(e) => setF({ ...f, company: e.target.value })} />
                <Input placeholder="Location" value={f.location ?? ""} onChange={(e) => setF({ ...f, location: e.target.value })} />
                <Input placeholder="Industry" value={f.industry ?? ""} onChange={(e) => setF({ ...f, industry: e.target.value })} />
                <Input placeholder="Min. years experience" inputMode="numeric" value={f.minYears ?? ""} onChange={(e) => setF({ ...f, minYears: e.target.value })} />
                <select aria-label="Lead type" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                  <option value="all">Everyone</option>
                  <option value="company">Hiring managers & recruiters</option>
                  <option value="candidate">Open-to-work candidates</option>
                </select>
                <Button type="submit"><Search className="h-4 w-4" /> Search leads</Button>
              </form>
            </CardContent>
          </Card>
          {!leads ? (
            <Spinner />
          ) : leads.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No leads match. Try fewer filters.</CardContent></Card>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">{leadTotal} lead{leadTotal === 1 ? "" : "s"}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {leads.map((l) => (
                  <Card key={l.userId}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <Avatar className="h-10 w-10">
                        {l.avatarUrl && <AvatarImage src={l.avatarUrl} />}
                        <AvatarFallback>{l.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{l.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{[l.title, l.company].filter(Boolean).join(" at ") || "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">{[l.location, l.industry].filter(Boolean).join(" · ")}</p>
                        <Badge variant="outline" className="mt-1.5">{l.type === "company" ? "Hiring team" : "Candidate"}</Badge>
                      </div>
                      <Button size="sm" disabled={l.pendingInmail || credits.remaining < 1} onClick={() => compose(l)} title={l.pendingInmail ? "Waiting for a reply to your last InMail" : credits.remaining < 1 ? "No InMail credits left" : undefined}>
                        <Mail className="h-3.5 w-3.5" /> {l.pendingInmail ? "Awaiting reply" : "InMail"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "accounts" && (
        <>
          <form
            className="mb-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              searchAccounts(accountQ);
            }}
          >
            <Input placeholder="Company name" value={accountQ} onChange={(e) => setAccountQ(e.target.value)} />
            <Button type="submit"><Search className="h-4 w-4" /> Search</Button>
          </form>
          {!accounts ? (
            <Spinner />
          ) : accounts.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No companies match.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {accounts.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{a.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{[a.industry, a.size, a.location].filter(Boolean).join(" · ") || "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.peopleOnCareerOS} on CareerOS · {a.openJobs} open job{a.openJobs === 1 ? "" : "s"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={a.peopleOnCareerOS === 0}
                      onClick={() => {
                        const next = { type: "company", company: a.name };
                        setF(next);
                        setTab("leads");
                        searchLeads(next);
                      }}
                    >
                      View people
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "sent" &&
        (!sent ? (
          <Spinner />
        ) : sent.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">You haven't sent any InMail yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {sent.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{m.subject}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      To {m.recipientName ?? "member"}{m.company ? ` · ${m.company}` : ""} · {fmtDate(m.createdAt)}{m.sentBy ? ` · by ${m.sentBy}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.status === "REPLIED" ? (
                      <Badge variant="success">Replied · credit returned</Badge>
                    ) : m.status === "FAILED" ? (
                      <Badge variant="destructive">Failed · not charged</Badge>
                    ) : (
                      <Badge variant="outline">Delivered · awaiting reply</Badge>
                    )}
                    <Button asChild size="sm" variant="ghost"><Link href="/messages">Open</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      <Modal open={Boolean(to)} onClose={() => setTo(null)} title={`InMail to ${to?.name ?? ""}`}>
        <div className="space-y-3">
          <Input placeholder="Subject" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea rows={7} maxLength={4000} placeholder="Introduce yourself and why you're reaching out." value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-muted-foreground">Uses 1 InMail credit ({credits.remaining} left). Delivered to their CareerOS inbox; the credit is returned if they reply within 90 days.</p>
          <Button disabled={!subject.trim() || !body.trim() || sending} onClick={send}>{sending ? "Sending…" : "Send InMail"}</Button>
        </div>
      </Modal>
    </div>
  );
}
