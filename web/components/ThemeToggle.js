'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [theme, setTheme] = useState(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme), []);
  const dark = theme === 'dark';
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  }
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" className={`theme-switch ${dark ? 'on' : ''}`} onClick={toggle}>
      <motion.span layout className="knob" transition={{ type: 'spring', stiffness: 500, damping: 30 }}>{dark ? '☾' : '☀'}</motion.span>
    </button>
  );
}
