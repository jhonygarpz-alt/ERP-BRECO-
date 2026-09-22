import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type Accent = 'red' | 'blue' | 'green' | 'purple';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'breco-theme';
const ACCENT_KEY = 'breco-accent';

function leerThemeInicial(): Theme {
  const guardado = localStorage.getItem(THEME_KEY);
  return guardado === 'dark' ? 'dark' : 'light';
}

function leerAccentInicial(): Accent {
  const guardado = localStorage.getItem(ACCENT_KEY);
  return guardado === 'blue' || guardado === 'green' || guardado === 'purple' ? guardado : 'red';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(leerThemeInicial);
  const [accent, setAccent] = useState<Accent>(leerAccentInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
