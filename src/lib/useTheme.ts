import { useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('dpl-theme') === 'dark');

  function toggleTheme(nextDark: boolean) {
    setDark(nextDark);
    localStorage.setItem('dpl-theme', nextDark ? 'dark' : 'light');
  }

  return { dark, toggleTheme };
}