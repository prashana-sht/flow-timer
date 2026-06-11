import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'flowtimer-theme';

/**
 * Returns [theme, toggleTheme].
 * theme is 'dark' | 'light'.
 * Persists choice in localStorage and applies data-theme to <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // 1. Saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // 2. System preference
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });

  // Apply to <html> so CSS [data-theme] selectors work everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggleTheme];
}
