"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground",
        className
      )}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          theme === "light" ? "scale-100 rotate-0" : "absolute scale-0 rotate-90"
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 transition-all",
          theme === "dark" ? "scale-100 rotate-0" : "absolute scale-0 -rotate-90"
        )}
      />
    </button>
  );
}
