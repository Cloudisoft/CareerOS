"use client";

import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

/* A new key: the old one ("careeros-theme") was written on every visit,
   so it holds "dark" for people who never chose it. */
const THEME_KEY = "careeros-theme-choice";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazily read the stored preference so the very first client render (and
  // the effect below) already agree with what the pre-hydration inline
  // script (themeInitScript) painted — otherwise this state defaulting to
  // "dark" would fire the effect once with the wrong value and stomp the
  // class/localStorage a user had already set to "light".
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Light is the default; dark only when the person picked it.
    if (typeof window === "undefined") return "light";
    try {
      return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Only an explicit choice is stored, so the default can change later
  // without being pinned by a value nobody picked.
  const toggleTheme = React.useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Inlined in <head> to apply the stored theme before first paint (no flash). */
export const themeInitScript = `
(function() {
  try {
    var stored = window.localStorage.getItem('careeros-theme-choice');
    if (stored !== 'dark') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;
