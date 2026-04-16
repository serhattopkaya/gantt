import { useEffect, useState } from 'react';
import type { ThemeKey } from '../types';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(t: ThemeKey): 'light' | 'dark' {
  if (t === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return t;
}

export function useApplyTheme(theme: ThemeKey) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle('dark', resolveTheme(theme) === 'dark');
    };
    apply();
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [theme]);
}

export function useResolvedTheme(theme: ThemeKey): 'light' | 'dark' {
  const [systemIsDark, setSystemIsDark] = useState<boolean>(systemPrefersDark);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemIsDark(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  if (theme !== 'system') return theme;
  return systemIsDark ? 'dark' : 'light';
}
