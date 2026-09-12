"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  onFinalText: (text: string) => void;
  className?: string;
  /** Positions the error message; defaults to a small absolute-positioned
      note below the button, which assumes a relatively-positioned parent. */
  errorClassName?: string;
}

/** Drop-in mic toggle for any text field — dictate instead of type, via the
    browser's native speech recognition (see useVoiceInput). Renders nothing
    if the browser doesn't support it. Surfaces permission/hardware/network
    failures inline instead of silently reverting with no explanation. */
export function MicButton({ onFinalText, className, errorClassName }: MicButtonProps) {
  const voice = useVoiceInput(onFinalText);
  if (!voice.supported) return null;

  return (
    <>
      <Button
        type="button"
        variant={voice.listening ? "secondary" : "ghost"}
        size="icon"
        className={cn(className)}
        onClick={voice.listening ? voice.stop : voice.start}
        aria-label={voice.listening ? "Stop recording" : "Dictate with your voice"}
        title={voice.listening ? "Stop recording" : "Dictate with your voice"}
      >
        {voice.listening ? <Square className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
      </Button>
      {voice.error && (
        <p
          role="alert"
          className={cn(
            "z-10 max-w-xs text-xs text-destructive",
            errorClassName ?? "absolute right-0 top-full mt-1"
          )}
        >
          {voice.error}
        </p>
      )}
    </>
  );
}
