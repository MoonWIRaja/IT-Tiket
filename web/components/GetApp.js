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

  function iphone() {
    setHint('Allow the download, then open Settings, tap Profile Downloaded and tap Install. The app appears on your Home Screen.');
    location.assign(`${BASE}/it-tiket.mobileconfig`);
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
