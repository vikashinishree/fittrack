import { useEffect, useState } from 'react';

const initial = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

export function useTheme() {
  const [theme, setTheme] = useState(initial);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggle = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
    return next;
  });
  return { theme, toggle };
}