"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** A curated, categorized set rather than the full Unicode emoji block —
    plenty for reactions and post text without pulling in an emoji-data
    library or a network call to fetch one. */
const EMOJI_GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Smileys",
    emoji: ["😀", "😄", "😁", "😊", "🙂", "😉", "😍", "🤩", "😎", "🤔", "😅", "😂", "🥳", "😴", "🙃", "😇"],
  },
  {
    label: "Gestures",
    emoji: ["👍", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "👌", "🤞", "👋", "🫡", "🤟"],
  },
  {
    label: "Career",
    emoji: ["🚀", "🎉", "🎯", "💼", "📈", "🏆", "✅", "💡", "🔥", "⭐", "🎓", "📌"],
  },
  {
    label: "Hearts",
    emoji: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍"],
  },
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Add emoji" title="Add emoji">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="max-h-56 space-y-3 overflow-y-auto">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {group.emoji.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onSelect(e);
                      setOpen(false);
                    }}
                    className="rounded-md p-1 text-lg leading-none transition-colors hover:bg-muted"
                    aria-label={`Insert ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
