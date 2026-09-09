"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

interface Person {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  headline: string | null;
  currentTitle: string | null;
  location: string | null;
  careerLevel: string | null;
  totalExperienceYears: number | null;
  skills: string[];
  visibility: string;
  matchScore: number | null;
}

export default function TalentSearchPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());

    const res = await fetch(`/api/employer/talent?${params.toString()}`);
    if (res.status === 409) {
      setNeedsCompany(true);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setPeople(json.data?.people ?? []);
    setLoading(false);
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendContact(profileId: string) {
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch(`/api/employer/talent/${profileId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setSending(false);
    if (res.ok) {
      setSentTo((prev) => new Set(prev).add(profileId));
      setContactingId(null);
      setMessage("");
    }
  }

  if (needsCompany) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Set up your company profile before searching talent.</p>
          <Button asChild className="mt-4">
            <a href="/employer/company">Set up your company</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Talent Search</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="mb-6 flex flex-wrap gap-2"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Title, headline, or name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input className="max-w-[200px]" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : people.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No candidates found. Try broadening your search — only candidates who've made themselves visible to
          recruiters appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {people.map((p) => (
            <Card key={p.profileId}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      {p.avatarUrl && <AvatarImage src={p.avatarUrl} />}
                      <AvatarFallback>{initials(p.firstName, p.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{p.currentTitle || p.headline || "Career OS member"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.location ?? "Location not set"}
                        {p.totalExperienceYears != null ? ` · ${p.totalExperienceYears} yrs experience` : ""}
                      </p>
                      {p.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.skills.slice(0, 8).map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={sentTo.has(p.profileId) ? "secondary" : "outline"}
                    disabled={sentTo.has(p.profileId)}
                    onClick={() => setContactingId(contactingId === p.profileId ? null : p.profileId)}
                  >
                    {sentTo.has(p.profileId) ? "Sent" : "Contact"}
                  </Button>
                </div>

                {contactingId === p.profileId && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <Textarea
                      rows={3}
                      placeholder={`Write a message to ${p.firstName}…`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button size="sm" onClick={() => sendContact(p.profileId)} disabled={sending || !message.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
