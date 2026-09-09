"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus, Check, X, Send, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface PostItem {
  id: string;
  content: string;
  createdAt: string;
  author: ConnectionUser;
  reactions: { userId: string }[];
  comments: { id: string; content: string; author: ConnectionUser }[];
}

interface ConnectionRequest {
  id: string;
  requester: ConnectionUser;
  recipient: ConnectionUser;
}

function PersonRow({ person, action }: { person: Person; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          {person.avatarUrl && <AvatarImage src={person.avatarUrl} />}
          <AvatarFallback>{initials(person.firstName, person.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">
            {person.firstName} {person.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{person.currentTitle || person.headline || "Career OS member"}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function NetworkPage() {
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
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  async function loadAll() {
    const [peopleRes, connRes, postsRes] = await Promise.all([
      fetch("/api/network/people").then((r) => r.json()),
      fetch("/api/network/connections").then((r) => r.json()),
      fetch("/api/network/posts").then((r) => r.json()),
    ]);
    setPeople(peopleRes.data?.people ?? []);
    setRequests(connRes.data ?? { incoming: [], outgoing: [], accepted: [] });
    setPosts(postsRes.data?.posts ?? []);
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
    await fetch("/api/network/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    });
    setNewPost("");
    loadAll();
  }

  async function react(postId: string) {
    await fetch(`/api/network/posts/${postId}/reactions`, { method: "POST" });
    loadAll();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Career Circles</h1>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {requests.incoming.length > 0 ? `(${requests.incoming.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="connections">My network ({requests.accepted.length})</TabsTrigger>
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
              <Button size="sm" onClick={submitPost} disabled={!newPost.trim()}>
                Post
              </Button>
            </CardContent>
          </Card>

          {posts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No posts yet. Connect with people to see their updates here.
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} />}
                        <AvatarFallback>{initials(post.author.firstName, post.author.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {post.author.firstName} {post.author.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{post.content}</p>
                    <button
                      onClick={() => react(post.id)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      👍 {post.reactions.length > 0 ? post.reactions.length : "Like"}
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

        <TabsContent value="connections">
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
      </Tabs>
    </div>
  );
}
