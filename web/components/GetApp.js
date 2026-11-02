'use client';
import { useEffect, useState } from 'react';
import { BASE } from '@/lib/base';

export function GetApp() {
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(null);

  useEffect(() => {
    setInstalled(matchMedia('(display-mode: standalone)').matches || !!navigator.standalone);
  }, []);

  async function install() {
    const prompt = window.__installPrompt;
    if (!prompt) return setHint('Already installed, or this browser cannot install apps. Try Chrome or Edge.');
    prompt.prompt();
    await prompt.userChoice;
    window.__installPrompt = null;
  }

  async function iphone() {
    // Profiles only install from Safari; other iPhone browsers show the file as text.
    if (navigator.brave || /CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent)) {
      await navigator.clipboard?.writeText(location.origin + BASE + '/profile/').catch(() => {});
      return setHint('This only works in Safari. The link is copied: open Safari, paste it, sign in and press iPhone again.');
    }
    // GitHub Pages sends the wrong file type, so set the right one here.
    const data = await (await fetch(`${BASE}/it-tiket.mobileconfig`)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/x-apple-aspen-config' }));
    a.download = 'it-tiket.mobileconfig';
    a.click();
    setHint('Tap Allow, then open Settings, tap Profile Downloaded and tap Install. The app appears on your Home Screen.');
  }

  return (
    <section className="card stack">
      <strong>Get the app</strong>
      {installed && <p className="ok">You are using the installed app.</p>}
      <small className="muted">No app store needed.</small>
      <div className="row app-row">
        <button onClick={install}>Desktop</button>
        <button onClick={install}>Android</button>
        <button onClick={iphone}>iPhone</button>
      </div>
      {hint && <p className="ok">{hint}</p>}
    </section>
  );
}
