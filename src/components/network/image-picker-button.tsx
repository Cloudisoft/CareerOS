"use client";

import { useRef, useState } from "react";
import { fileToResizedDataUrl } from "@/lib/upload/image";

interface ImagePickerButtonProps {
  maxDimension: number;
  onPicked: (dataUrl: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/** A file-picker button that resizes/compresses the chosen image client-side
    and hands the caller a data: URL — no upload endpoint of its own, since
    what happens with the result (attach to a draft post, save immediately
    as an avatar) differs by caller. */
export function ImagePickerButton({ maxDimension, onPicked, children, className, disabled }: ImagePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file, maxDimension);
      onPicked(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process that image.");
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button type="button" className={className} disabled={disabled} onClick={() => inputRef.current?.click()}>
        {children}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
