"use client";

import { useState } from "react";
import { Image as ImageIcon, Video, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/network/emoji-picker";
import { ImagePickerButton } from "@/components/network/image-picker-button";

interface PostComposerProps {
  placeholder: string;
  onSubmit: (input: { content: string; imageUrl?: string; videoUrl?: string }) => Promise<void>;
}

/** Shared by the main feed and every circle — a post composer with emoji,
    image attachment (resized client-side, no upload infra needed), and a
    video-link field (YouTube/Vimeo/Loom, validated server-side on submit). */
export function PostComposer({ placeholder, onSubmit }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit({ content, imageUrl: imageUrl ?? undefined, videoUrl: videoUrl.trim() || undefined });
    setSubmitting(false);
    setContent("");
    setImageUrl(null);
    setVideoUrl("");
    setShowVideoInput(false);
  }

  return (
    <div className="space-y-3">
      <Textarea rows={3} placeholder={placeholder} value={content} onChange={(e) => setContent(e.target.value)} />

      {imageUrl && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element -- client-produced data: URL, not an optimizable remote asset */}
          <img src={imageUrl} alt="" className="max-h-48 rounded-lg border border-border object-cover" />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-surface p-1"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showVideoInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste a YouTube, Vimeo, or Loom link…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowVideoInput(false);
              setVideoUrl("");
            }}
            aria-label="Remove video link"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <EmojiPicker onSelect={(emoji) => setContent((prev) => prev + emoji)} />
          <ImagePickerButton
            maxDimension={1600}
            onPicked={setImageUrl}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ImageIcon className="h-4 w-4" />
          </ImagePickerButton>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowVideoInput((v) => !v)}
            aria-label="Add video link"
            title="Add video link"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={submit} disabled={submitting || !content.trim()}>
          Post
        </Button>
      </div>
    </div>
  );
}
