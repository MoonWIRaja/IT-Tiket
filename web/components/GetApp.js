'use client';
import { useState } from 'react';

const HINTS = {
  desktop: 'Your browser did not offer an install. Open this page in Chrome or Edge, then press Desktop again.',
  android: 'Your browser did not offer an install. Open this page in Chrome on Android, then press Android again.',
  iphone: 'Apple does not let websites install apps automatically. In Safari, tap Share, then Add to Home Screen.',
};

export function GetApp() {
  const [hint, setHint] = useState(null);
  async function install(kind) {
    const prompt = window.__installPrompt;
    if (kind === 'iphone' || !prompt) return setHint(HINTS[kind]);
    prompt.prompt();
    await prompt.userChoice;
    window.__installPrompt = null;
  }
  return (
    <section className="card stack">
      <strong>Get the app</strong>
      <small className="muted">Installs the web app, so it opens in its own window and stays up to date.</small>
      <div className="row app-row">
        <button onClick={() => install('desktop')}>Desktop</button>
        <button onClick={() => install('android')}>Android</button>
        <button onClick={() => install('iphone')}>iPhone</button>
      </div>
      {hint && <p className="ok">{hint}</p>}
    </section>
  );
}
