"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Users, Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostCard, type FeedPost } from "@/components/network/post-card";

interface CircleDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isMember: boolean;
  posts: FeedPost[];
}

export default function CircleDetailPage() {
  const params = useParams<{ slug: string }>();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);

  async function load() {
    const [circleRes, meRes] = await Promise.all([
      fetch(`/api/network/circles/${params.slug}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    if (circleRes.data?.circle) setCircle(circleRes.data.circle);
    else setError(circleRes.error?.message ?? "This circle could not be found.");
    setCurrentUserId(meRes.data?.user?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  async function toggleMembership() {
    if (!circle) return;
    setMembershipBusy(true);
    await fetch(`/api/network/circles/${circle.slug}/${circle.isMember ? "leave" : "join"}`, { method: "POST" });
    await load();
    setMembershipBusy(false);
  }

  async function submitPost() {
    if (!circle || !draft.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/network/circles/${circle.slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setPosting(false);
    if (res.ok) {
      setDraft("");
      load();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!circle) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/network/circles" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All circles
      </Link>

      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{circle.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{circle.description}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
              </p>
            </div>
            <Button size="sm" variant={circle.isMember ? "outline" : "primary"} onClick={toggleMembership} disabled={membershipBusy}>
              {circle.isMember ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {circle.isMember ? "Joined" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {circle.isMember && (
        <Card className="mb-4">
          <CardContent className="space-y-3 p-4">
            <Textarea
              rows={3}
              placeholder={`Share something with ${circle.name}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button size="sm" onClick={submitPost} disabled={posting || !draft.trim()}>
              Post
            </Button>
          </CardContent>
        </Card>
      )}

      {circle.posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {circle.isMember ? "No posts yet — be the first to share something." : "Join this circle to see and share posts."}
        </p>
      ) : (
        <div className="space-y-3">
          {circle.posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
