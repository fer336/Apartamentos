/* eslint-disable react-refresh/only-export-components -- the `useTheme` hook
   intentionally lives alongside its provider, the standard React context
   pattern; Fast Refresh optimization doesn't apply here. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { APP_THEME_STORAGE_KEY, type AppTheme } from "./kanagawa-tokens";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getPreferredTheme(): AppTheme {
  if (typeof window === "undefined") return "kanagawa-dark";

  const stored = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (stored === "kanagawa-dark" || stored === "kanagawa-light") {
    return stored;
  }

  // Respect prefers-color-scheme only on first load (no stored preference yet).
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  return prefersLight ? "kanagawa-light" : "kanagawa-dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getPreferredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    window.localStorage.setItem(APP_THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: AppTheme = current === "kanagawa-dark" ? "kanagawa-light" : "kanagawa-dark";
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
