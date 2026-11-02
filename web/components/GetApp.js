'use client';
import { useEffect, useState } from 'react';

export function GetApp() {
  const [device, setDevice] = useState(null); // installed | ios | other
  const [hint, setHint] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
    setDevice(matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'installed' : ios ? 'ios' : 'other');
  }, []);

  async function install() {
    if (device === 'ios') {
      const safari = !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
      return setHint(safari
        ? 'Tap the Share button in Safari, then Add to Home Screen. Apple requires this step.'
        : 'Open this page in Safari, then tap Share and Add to Home Screen.');
    }
    const prompt = window.__installPrompt;
    if (!prompt) return setHint('Already installed, or this browser cannot install apps. Try Chrome or Edge.');
    prompt.prompt();
    await prompt.userChoice;
    window.__installPrompt = null;
  }

  return (
    <section className="card stack">
      <strong>Get the app</strong>
      {device === 'installed'
        ? <p className="ok">The app is installed on this device.</p>
        : <>
            <small className="muted">Opens in its own window, with no app store.</small>
            <button className="primary" onClick={install}>Install app</button>
          </>}
      {hint && <p className="ok">{hint}</p>}
    </section>
  );
}
