"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import { cn } from "@/lib/utils";

interface SpeakButtonProps {
  text: string;
  className?: string;
}

/** Drop-in "read this aloud" button for AI-generated text — uses the
    browser's native speech synthesis (see useVoiceOutput). Toggles between
    speaking and stopped on click. Renders nothing if unsupported or the
    text is empty. */
export function SpeakButton({ text, className }: SpeakButtonProps) {
  const voiceOut = useVoiceOutput();
  if (!voiceOut.supported || !text.trim()) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={() => (voiceOut.speaking ? voiceOut.stop() : voiceOut.speak(text))}
      aria-label={voiceOut.speaking ? "Stop reading aloud" : "Read aloud"}
      title={voiceOut.speaking ? "Stop reading aloud" : "Read aloud"}
    >
      {voiceOut.speaking ? (
        <VolumeX className="h-4 w-4 text-primary" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
