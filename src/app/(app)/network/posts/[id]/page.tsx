"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard, type FeedPost } from "@/components/network/post-card";

export default function PostPermalinkPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [postRes, meRes] = await Promise.all([
        fetch(`/api/network/posts/${params.id}`).then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      if (postRes.data?.post) setPost(postRes.data.post);
      else setError(postRes.error?.message ?? "This post could not be found.");
      setCurrentUserId(meRes.data?.user?.id ?? null);
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/network" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to network
      </Link>

      {post ? (
        <PostCard post={post} currentUserId={currentUserId} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      )}
    </div>
  );
}
