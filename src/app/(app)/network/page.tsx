"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus, Check, X, Send, Search, Users, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostCard, type FeedPost } from "@/components/network/post-card";
import { initials } from "@/lib/utils";

interface Person {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  headline: string | null;
  currentTitle: string | null;
  location: string | null;
}

interface ConnectionUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface ConnectionRequest {
  id: string;
  requester: ConnectionUser;
  recipient: ConnectionUser;
}

interface CircleSummary {
  slug: string;
  name: string;
  memberCount: number;
  isMember: boolean;
}

interface FollowedCompany {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
}

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

function PersonRow({ person, action }: { person: Person; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <Link href={`/network/profile/${person.userId}`} className="flex min-w-0 items-center gap-3">
        <Avatar>
          {person.avatarUrl && <AvatarImage src={person.avatarUrl} />}
          <AvatarFallback>{initials(person.firstName, person.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground hover:underline">
            {person.firstName} {person.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{person.currentTitle || person.headline || "Career OS member"}</p>
        </div>
      </Link>
      {action}
    </div>
  );
}

export default function NetworkPage() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<{
    incoming: ConnectionRequest[];
    outgoing: ConnectionRequest[];
    accepted: ConnectionUser[];
  }>({
    incoming: [],
    outgoing: [],
    accepted: [],
  });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [following, setFollowing] = useState<FollowedCompany[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("feed");

  async function loadAll() {
    const [meRes, peopleRes, connRes, postsRes, circlesRes, followingRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/network/people").then((r) => r.json()),
      fetch("/api/network/connections").then((r) => r.json()),
      fetch("/api/network/posts").then((r) => r.json()),
      fetch("/api/network/circles").then((r) => r.json()),
      fetch("/api/network/following").then((r) => r.json()),
    ]);
    setMe(meRes.data?.user ?? null);
    setPeople(peopleRes.data?.people ?? []);
    setRequests(connRes.data ?? { incoming: [], outgoing: [], accepted: [] });
    setPosts(postsRes.data?.posts ?? []);
    setCircles((circlesRes.data?.circles ?? []).slice(0, 5));
    setFollowing(followingRes.data?.companies ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/network/people?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setPeople(json.data?.people ?? []);
  }

  async function connect(userId: string) {
    setSentTo((prev) => new Set(prev).add(userId));
    await fetch("/api/network/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: userId }),
    });
  }

  async function respond(connectionId: string, accept: boolean) {
    await fetch(`/api/network/connections/${connectionId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    loadAll();
  }

  async function submitPost() {
    if (!newPost.trim()) return;
    setPosting(true);
    await fetch("/api/network/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    });
    setNewPost("");
    setPosting(false);
    loadAll();
  }

  async function joinCircle(slug: string) {
    setCircles((prev) => prev.map((c) => (c.slug === slug ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c)));
    await fetch(`/api/network/circles/${slug}/join`, { method: "POST" });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[220px_1fr_280px]">
      {/* Left sidebar */}
      <aside className="hidden lg:block">
        <Card className="mb-4">
          <CardContent className="p-4">
            {me && (
              <Link href={`/network/profile/${me.id}`} className="flex items-center gap-3">
                <Avatar>
                  {me.avatarUrl && <AvatarImage src={me.avatarUrl} />}
                  <AvatarFallback>{initials(me.firstName, me.lastName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground hover:underline">
                    {me.firstName} {me.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">View profile</p>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-2">
            <Link href="/network" className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              Feed
            </Link>
            <Link href="/network/circles" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
              Circles
              <Users className="h-4 w-4 text-muted-foreground" />
            </Link>
            <button
              onClick={() => setTab("my-network")}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              My network
              {requests.incoming.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{requests.incoming.length}</span>
              )}
            </button>
            <a href="#following" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
              Following
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </aside>

      {/* Center feed */}
      <main>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="my-network">My network ({requests.accepted.length})</TabsTrigger>
            <TabsTrigger value="people">Find people</TabsTrigger>
            <TabsTrigger value="requests">
              Requests {requests.incoming.length > 0 ? `(${requests.incoming.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <Card className="mb-4">
              <CardContent className="space-y-3 p-4">
                <Textarea
                  rows={3}
                  placeholder="Share something with your network…"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                <Button size="sm" onClick={submitPost} disabled={posting || !newPost.trim()}>
                  Post
                </Button>
              </CardContent>
            </Card>

            {posts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No posts yet. Connect with people or follow companies to see updates here.
              </p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={me?.id ?? null} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-network">
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {requests.accepted.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No connections yet.</p>
                ) : (
                  requests.accepted.map((c) => (
                    <PersonRow
                      key={c.id}
                      person={{ ...c, userId: c.id, headline: null, currentTitle: null, location: null }}
                      action={
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/messages?with=${c.id}`}>
                            <Send className="h-4 w-4" /> Message
                          </Link>
                        </Button>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="people">
            <form onSubmit={search} className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by name or title" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {people.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No one found.</p>
                ) : (
                  people.map((p) => (
                    <PersonRow
                      key={p.userId}
                      person={p}
                      action={
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={sentTo.has(p.userId)}
                          onClick={() => connect(p.userId)}
                        >
                          {sentTo.has(p.userId) ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          {sentTo.has(p.userId) ? "Sent" : "Connect"}
                        </Button>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {requests.incoming.length === 0 && requests.outgoing.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No pending requests.</p>
                ) : (
                  <>
                    {requests.incoming.map((r) => (
                      <PersonRow
                        key={r.id}
                        person={{ ...r.requester, userId: r.requester.id, headline: null, currentTitle: null, location: null }}
                        action={
                          <div className="flex gap-2">
                            <Button size="icon" variant="secondary" onClick={() => respond(r.id, true)} aria-label="Accept">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => respond(r.id, false)} aria-label="Decline">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                    {requests.outgoing.map((r) => (
                      <PersonRow
                        key={r.id}
                        person={{ ...r.recipient, userId: r.recipient.id, headline: null, currentTitle: null, location: null }}
                        action={<span className="text-xs text-muted-foreground">Pending</span>}
                      />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Right sidebar */}
      <aside className="hidden space-y-4 lg:block">
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Circles for you</p>
            {circles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No circles yet.</p>
            ) : (
              <div className="space-y-3">
                {circles.map((c) => (
                  <div key={c.slug} className="flex items-center justify-between gap-2">
                    <Link href={`/network/circles/${c.slug}`} className="min-w-0 flex-1 text-xs font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                    {!c.isMember && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => joinCircle(c.slug)}>
                        Join
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link href="/network/circles" className="mt-3 block text-xs text-primary hover:underline">
              See all circles
            </Link>
          </CardContent>
        </Card>

        <Card id="following">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Following</p>
            {following.length === 0 ? (
              <p className="text-xs text-muted-foreground">Follow companies to see their hiring updates in your feed.</p>
            ) : (
              <div className="space-y-3">
                {following.map((c) => (
                  <Link key={c.id} href={`/company/${c.slug}`} className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 rounded-md">
                      {c.logoUrl && <AvatarImage src={c.logoUrl} />}
                      <AvatarFallback className="rounded-md text-[10px]">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs font-medium text-foreground hover:underline">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
