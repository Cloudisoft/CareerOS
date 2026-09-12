"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, MessageCircle, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  reactions: { userId: string }[];
  comments: { id: string; content: string; author: PostAuthor }[];
  circle: { slug: string; name: string } | null;
  job: {
    id: string;
    title: string;
    location: string | null;
    workplaceType: string;
    company: { name: string; slug: string; logoUrl: string | null };
  } | null;
}

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: string | null }) {
  const [liked, setLiked] = useState(currentUserId ? post.reactions.some((r) => r.userId === currentUserId) : false);
  const [likeCount, setLikeCount] = useState(post.reactions.length);
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function toggleLike() {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    await fetch(`/api/network/posts/${post.id}/reactions`, { method: "POST" });
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/network/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (json.data?.comment) {
      setComments((prev) => [...prev, json.data.comment]);
      setDraft("");
      setShowComments(true);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Link href={`/network/profile/${post.author.id}`}>
            <Avatar className="h-9 w-9">
              {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} />}
              <AvatarFallback>{initials(post.author.firstName, post.author.lastName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/network/profile/${post.author.id}`} className="text-sm font-medium text-foreground hover:underline">
              {post.author.firstName} {post.author.lastName}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              {post.circle && (
                <>
                  <span>·</span>
                  <Link href={`/network/circles/${post.circle.slug}`} className="hover:underline">
                    {post.circle.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="whitespace-pre-line text-sm text-foreground">{post.content}</p>

        {post.job && (
          <Link href={`/jobs/${post.job.id}`}>
            <Card className="border-primary/30 bg-primary/5 transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-9 w-9 rounded-md">
                  {post.job.company.logoUrl && <AvatarImage src={post.job.company.logoUrl} />}
                  <AvatarFallback className="rounded-md text-xs">{post.job.company.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{post.job.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {post.job.company.name}
                    {post.job.location ? ` · ${post.job.location}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 gap-1">
                  <Briefcase className="h-3 w-3" /> Hiring
                </Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="flex items-center gap-4 border-t border-border pt-2">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-xs ${liked ? "font-medium text-primary" : "text-muted-foreground"} hover:text-primary`}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> {likeCount > 0 ? likeCount : "Like"}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" /> {comments.length > 0 ? comments.length : "Comment"}
          </button>
        </div>

        {showComments && (
          <div className="space-y-2 border-t border-border pt-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  {c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} />}
                  <AvatarFallback className="text-[10px]">{initials(c.author.firstName, c.author.lastName)}</AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-muted px-3 py-1.5">
                  <Link href={`/network/profile/${c.author.id}`} className="text-xs font-medium text-foreground hover:underline">
                    {c.author.firstName} {c.author.lastName}
                  </Link>
                  <p className="text-xs text-foreground">{c.content}</p>
                </div>
              </div>
            ))}
            <form onSubmit={submitComment} className="flex items-center gap-2">
              <Input
                placeholder="Write a comment…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 text-xs"
              />
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
