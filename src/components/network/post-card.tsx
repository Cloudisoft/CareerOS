"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  Heart,
  PartyPopper,
  Handshake,
  Lightbulb,
  Laugh,
  MessageCircle,
  Briefcase,
  Share2,
  Repeat2,
  Link2,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { initials, cn } from "@/lib/utils";
import { toEmbedUrl } from "@/lib/upload/video-embed";

type ReactionType = "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "FUNNY";

const REACTIONS: { type: ReactionType; label: string; icon: typeof ThumbsUp; className: string }[] = [
  { type: "LIKE", label: "Like", icon: ThumbsUp, className: "text-primary" },
  { type: "CELEBRATE", label: "Celebrate", icon: PartyPopper, className: "text-warning" },
  { type: "SUPPORT", label: "Support", icon: Handshake, className: "text-success" },
  { type: "LOVE", label: "Love", icon: Heart, className: "text-destructive" },
  { type: "INSIGHTFUL", label: "Insightful", icon: Lightbulb, className: "text-sky-500" },
  { type: "FUNNY", label: "Funny", icon: Laugh, className: "text-warning" },
];

function reactionMeta(type: ReactionType | null) {
  return REACTIONS.find((r) => r.type === type) ?? null;
}

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface JobSummary {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  company: { name: string; slug: string; logoUrl: string | null };
}

export interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  imageUrl?: string | null;
  videoUrl?: string | null;
  reactions: { userId: string; type: ReactionType }[];
  comments: { id: string; content: string; author: PostAuthor }[];
  circle: { slug: string; name: string } | null;
  job: JobSummary | null;
  repostOf?:
    | (Pick<FeedPost, "id" | "content" | "createdAt" | "author" | "imageUrl" | "videoUrl"> & { job: JobSummary | null })
    | null;
  _count?: { reposts: number };
}

function JobCard({ job }: { job: JobSummary }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="border-primary/30 bg-primary/5 transition-colors hover:border-primary/50">
        <CardContent className="flex items-center gap-3 p-3">
          <Avatar className="h-9 w-9 rounded-md">
            {job.company.logoUrl && <AvatarImage src={job.company.logoUrl} />}
            <AvatarFallback className="rounded-md text-xs">{job.company.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {job.company.name}
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1">
            <Briefcase className="h-3 w-3" /> Hiring
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function PostMedia({ imageUrl, videoUrl }: { imageUrl?: string | null; videoUrl?: string | null }) {
  return (
    <>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data: URL / stored upload, not an optimizable remote asset
        <img src={imageUrl} alt="" className="max-h-[420px] w-full rounded-lg border border-border object-cover" />
      )}
      {videoUrl &&
        (() => {
          const embedUrl = toEmbedUrl(videoUrl);
          return embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Post video"
              />
            </div>
          ) : (
            <a href={videoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
              Watch video ↗
            </a>
          );
        })()}
    </>
  );
}

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: string | null }) {
  const myReaction = currentUserId ? post.reactions.find((r) => r.userId === currentUserId)?.type ?? null : null;
  const [reaction, setReaction] = useState<ReactionType | null>(myReaction);
  const [reactionCount, setReactionCount] = useState(post.reactions.length);
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [repostPopoverOpen, setRepostPopoverOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post._count?.reposts ?? 0);

  async function applyReaction(type: ReactionType) {
    setReactionPickerOpen(false);
    const wasReacted = reaction !== null;
    const isSame = reaction === type;
    setReaction(isSame ? null : type);
    setReactionCount((prev) => (isSame ? prev - 1 : wasReacted ? prev : prev + 1));
    await fetch(`/api/network/posts/${post.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
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

  const permalink = typeof window !== "undefined" ? `${window.location.origin}/network/posts/${post.id}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(permalink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function shareTo(platform: "linkedin" | "twitter" | "facebook") {
    const url = encodeURIComponent(permalink);
    const text = encodeURIComponent(post.content.slice(0, 200));
    const shareUrls: Record<typeof platform, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
    setSharePopoverOpen(false);
  }

  async function doRepost(quoteContent: string) {
    const res = await fetch("/api/network/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: quoteContent, repostOfId: post.id }),
    });
    if (res.ok) {
      setReposted(true);
      setRepostCount((prev) => prev + 1);
      setQuoteOpen(false);
      setQuoteDraft("");
      setRepostPopoverOpen(false);
    }
  }

  const ReactionIcon = reactionMeta(reaction)?.icon ?? ThumbsUp;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {post.repostOf && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Repeat2 className="h-3.5 w-3.5" />
            <Link href={`/network/profile/${post.author.id}`} className="font-medium hover:underline">
              {post.author.firstName} {post.author.lastName}
            </Link>
            reposted
          </div>
        )}

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

        {post.content && <p className="whitespace-pre-line text-sm text-foreground">{post.content}</p>}

        {!post.repostOf && <PostMedia imageUrl={post.imageUrl} videoUrl={post.videoUrl} />}
        {!post.repostOf && post.job && <JobCard job={post.job} />}

        {post.repostOf && (
          <Card className="border-border bg-surface-raised">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  {post.repostOf.author.avatarUrl && <AvatarImage src={post.repostOf.author.avatarUrl} />}
                  <AvatarFallback className="text-xs">{initials(post.repostOf.author.firstName, post.repostOf.author.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {post.repostOf.author.firstName} {post.repostOf.author.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{new Date(post.repostOf.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {post.repostOf.content && <p className="whitespace-pre-line text-sm text-foreground">{post.repostOf.content}</p>}
              <PostMedia imageUrl={post.repostOf.imageUrl} videoUrl={post.repostOf.videoUrl} />
              {post.repostOf.job && <JobCard job={post.repostOf.job} />}
            </CardContent>
          </Card>
        )}

        {(reactionCount > 0 || comments.length > 0 || repostCount > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{reactionCount > 0 ? `${reactionCount} reaction${reactionCount === 1 ? "" : "s"}` : ""}</span>
            <span className="flex gap-3">
              {comments.length > 0 && <span>{comments.length} comment{comments.length === 1 ? "" : "s"}</span>}
              {repostCount > 0 && <span>{repostCount} repost{repostCount === 1 ? "" : "s"}</span>}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 border-t border-border pt-2">
          <Popover open={reactionPickerOpen} onOpenChange={setReactionPickerOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => applyReaction(reaction ?? "LIKE")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setReactionPickerOpen(true);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs hover:bg-muted",
                  reaction ? cn("font-medium", reactionMeta(reaction)?.className) : "text-muted-foreground"
                )}
              >
                <ReactionIcon className="h-3.5 w-3.5" /> {reactionMeta(reaction)?.label ?? "Like"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto gap-1 p-1.5">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => applyReaction(r.type)}
                  title={r.label}
                  aria-label={r.label}
                  className={cn("rounded-full p-1.5 transition-transform hover:scale-125 hover:bg-muted", r.className)}
                >
                  <r.icon className="h-5 w-5" />
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Comment
          </button>

          <Popover open={repostPopoverOpen} onOpenChange={setRepostPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs hover:bg-muted hover:text-primary",
                  reposted ? "font-medium text-success" : "text-muted-foreground"
                )}
              >
                <Repeat2 className="h-3.5 w-3.5" /> {reposted ? "Reposted" : "Repost"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-2">
              {!quoteOpen ? (
                <>
                  <button
                    onClick={() => doRepost("")}
                    disabled={reposted}
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Repost
                  </button>
                  <button
                    onClick={() => setQuoteOpen(true)}
                    disabled={reposted}
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Quote post
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder="Add your thoughts…"
                    value={quoteDraft}
                    onChange={(e) => setQuoteDraft(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" className="w-full" onClick={() => doRepost(quoteDraft)}>
                    Post
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-primary">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-1">
              <button
                onClick={copyLink}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                {linkCopied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
                {linkCopied ? "Link copied" : "Copy link"}
              </button>
              <button
                onClick={() => shareTo("linkedin")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                Share to LinkedIn
              </button>
              <button
                onClick={() => shareTo("twitter")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                Share to X
              </button>
              <button
                onClick={() => shareTo("facebook")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                Share to Facebook
              </button>
            </PopoverContent>
          </Popover>
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
