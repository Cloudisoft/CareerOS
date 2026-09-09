"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SkillInput } from "@/lib/validations/profile";

const TYPES: { value: SkillInput["type"]; label: string }[] = [
  { value: "TECHNICAL", label: "Technical" },
  { value: "SOFT", label: "Soft skill" },
  { value: "TOOL", label: "Tool" },
];

interface SkillPickerProps {
  value: SkillInput[];
  onChange: (skills: SkillInput[]) => void;
  max?: number;
}

export function SkillPicker({ value, onChange, max = 30 }: SkillPickerProps) {
  const [draft, setDraft] = useState("");
  const [type, setType] = useState<SkillInput["type"]>("TECHNICAL");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (draft.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/skills?q=${encodeURIComponent(draft.trim())}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((json) => setSuggestions(json.data?.skills?.map((s: { name: string }) => s.name) ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [draft]);

  function addSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed || value.length >= max) return;
    if (value.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, { name: trimmed, type, level: "INTERMEDIATE" }]);
    setDraft("");
    setSuggestions([]);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-md bg-muted p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              type === t.value ? "bg-surface-raised text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(draft);
              }
            }}
            placeholder={`Add a ${type === "SOFT" ? "soft skill" : type === "TOOL" ? "tool" : "technical skill"}…`}
          />
          <Button type="button" variant="secondary" onClick={() => addSkill(draft)}>
            Add
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface-raised shadow-md">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((skill) => (
          <span
            key={skill.name}
            className="flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {skill.name}
            <span className="text-muted-foreground">
              {skill.type === "SOFT" ? "· soft" : skill.type === "TOOL" ? "· tool" : ""}
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((s) => s.name !== skill.name))}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${skill.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
