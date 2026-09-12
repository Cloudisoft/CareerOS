"use client";

import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazily read the stored preference so the very first client render (and
  // the effect below) already agree with what the pre-hydration inline
  // script (themeInitScript) painted — otherwise this state defaulting to
  // "dark" would fire the effect once with the wrong value and stomp the
  // class/localStorage a user had already set to "light".
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("careeros-theme");
    return stored === "light" ? "light" : "dark";
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("careeros-theme", theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
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
    var stored = window.localStorage.getItem('careeros-theme');
    if (stored === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;
