"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePickerButton } from "@/components/network/image-picker-button";
import { initials } from "@/lib/utils";

async function saveImage(endpoint: string, dataUrl: string) {
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
}

async function removeImage(endpoint: string) {
  await fetch(endpoint, { method: "DELETE" });
}

/** LinkedIn-style profile header: a cover banner with an overlapping avatar,
    both editable in place via a camera button. Uploads are resized
    client-side and stored directly (see src/lib/upload/image.ts) — no
    object-storage service needed. */
export function ProfileHeaderCard({
  firstName,
  lastName,
  initialAvatarUrl,
  initialCoverUrl,
}: {
  firstName: string;
  lastName: string;
  initialAvatarUrl: string | null;
  initialCoverUrl: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  async function handleAvatar(dataUrl: string) {
    setSavingAvatar(true);
    setAvatarUrl(dataUrl);
    await saveImage("/api/profile/avatar", dataUrl);
    setSavingAvatar(false);
  }

  async function handleCover(dataUrl: string) {
    setSavingCover(true);
    setCoverUrl(dataUrl);
    await saveImage("/api/profile/cover", dataUrl);
    setSavingCover(false);
  }

  async function handleRemoveAvatar() {
    setSavingAvatar(true);
    setAvatarUrl(null);
    await removeImage("/api/profile/avatar");
    setSavingAvatar(false);
  }

  async function handleRemoveCover() {
    setSavingCover(true);
    setCoverUrl(null);
    await removeImage("/api/profile/cover");
    setSavingCover(false);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border">
      <div className="relative h-36 bg-brand-gradient sm:h-44">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <ImagePickerButton
            maxDimension={1600}
            onPicked={handleCover}
            disabled={savingCover}
            className="flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:bg-background disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" /> {coverUrl ? "Change cover" : "Add cover photo"}
          </ImagePickerButton>
          {coverUrl && (
            <button
              type="button"
              onClick={handleRemoveCover}
              disabled={savingCover}
              className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:bg-background disabled:opacity-60"
              aria-label="Remove cover photo"
              title="Remove cover photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="relative bg-surface px-4 pb-4 pt-11 sm:px-6">
        <div className="absolute -top-10 left-4 sm:left-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-surface">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-xl">{initials(firstName, lastName)}</AvatarFallback>
            </Avatar>
            <ImagePickerButton
              maxDimension={400}
              onPicked={handleAvatar}
              disabled={savingAvatar}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
            </ImagePickerButton>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={savingAvatar}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-destructive text-destructive-foreground disabled:opacity-60"
                aria-label="Remove profile photo"
                title="Remove profile photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-foreground">
          {firstName} {lastName}
        </p>
      </div>
    </div>
  );
}
