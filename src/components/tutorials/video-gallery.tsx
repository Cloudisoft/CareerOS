"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { formatDuration, posterSrc, videoSrc, type TutorialVideo } from "@/config/tutorial-videos";
import { cn } from "@/lib/utils";

/**
 * Poster cards that open the tutorial in a player. Nothing but the small
 * poster images loads until someone presses play, so pages stay fast.
 */
export function VideoGallery({ videos, className, compact }: { videos: TutorialVideo[]; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState<TutorialVideo | null>(null);

  return (
    <>
      <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-5", compact && "lg:grid-cols-5", className)}>
        {videos.map((v) => (
          <li key={v.slug}>
            <button
              type="button"
              onClick={() => setOpen(v)}
              aria-label={`Play video: ${v.title} (${formatDuration(v.duration)})`}
              className="group block w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <span className="relative block aspect-video overflow-hidden bg-surface-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterSrc(v.slug)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                <span className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-110">
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </span>
                <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">{formatDuration(v.duration)}</span>
              </span>
              <span className="block p-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">{v.topic}</span>
                <span className="mt-1 block text-sm font-semibold leading-snug text-foreground">{v.title}</span>
                {!compact && <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{v.description}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && <Player video={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Player({ video, onClose }: { video: TutorialVideo; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.play().catch(() => {});
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={video.title} onClick={onClose}>
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">{video.topic}</p>
            <p className="mt-0.5 text-lg font-semibold">{video.title}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close video" className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <video
          ref={ref}
          key={video.slug}
          className="aspect-video w-full rounded-xl bg-black shadow-2xl"
          src={videoSrc(video.slug)}
          poster={posterSrc(video.slug)}
          controls
          playsInline
          preload="auto"
          aria-describedby={`desc-${video.slug}`}
        />
        <p id={`desc-${video.slug}`} className="mt-3 text-sm text-white/75">
          {video.description}
        </p>
      </div>
    </div>,
    document.body
  );
}
