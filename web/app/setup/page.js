'use client';

import { useEffect, useState } from 'react';
import { BASE, go } from '@/lib/base';
import { VerifyCode } from '@/components/VerifyCode';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/AuthShell';

export default function SetupPage() {
  const [state, setState] = useState('loading');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data: avail, error: aerr } = await createClient().rpc('setup_is_available');
        if (aerr) throw aerr;
        const status = { available: avail === true };
        if (dead) return;
        if (!status.available) { setState('closed'); go('/login/'); return; }
        const { data: { session } } = await createClient().auth.getSession();
        if (dead) return;
        setState(session ? 'confirm' : 'available');
      } catch {
        if (!dead) setState('error');
      }
    })();
    return () => { dead = true; };
  }, []);

  async function finish() {
    setBusy(true); setNote('');
    const { error } = await createClient().rpc('promote_first_admin');
    setBusy(false);
    if (error) { setNote('Setup failed, or the first admin already exists.'); setState('closed'); return; }
    go('/');
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNote('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { display_name: form.name.trim() } },
    });
    if (error) { setBusy(false); setNote(error.message); return; }
    if (!data.session) { setBusy(false); setState('verify'); return; }
    const { error: perr } = await supabase.rpc('promote_first_admin');
    setBusy(false);
    if (perr) { setState('closed'); setNote('Setup failed, or the first admin already exists.'); return; }
    go('/');
  }

  if (state === 'verify') return <AuthShell><VerifyCode email={form.email.trim()} type="signup" onVerified={finish} onBack={() => setState('available')} /></AuthShell>;

  return <AuthShell><section className="auth-form">
    <h2>Set up IT-Tiket</h2>
    {state === 'loading' && <p className="muted">Checking setup status…</p>}
    {state === 'closed' && <><p>Setup is complete. Redirecting to sign in…</p><a href={`${BASE}/login/`}>Go to sign in</a></>}
    {state === 'error' && <p className="error">Could not check setup status. Please try again later.</p>}
    {state === 'confirm' && <>
      <p>You are signed in. Confirm to make this account the first admin. Setup then closes.</p>
      {note && <p className="error">{note}</p>}
      <button className="primary" disabled={busy} onClick={finish}>{busy ? 'Setting up…' : 'Make me the first admin'}</button>
    </>}
    {state === 'available' && <>
      <p className="muted">Create the owner account. It becomes the admin, after you verify your email.</p>
      <form className="stack" onSubmit={submit}>
        <label>Name<input required maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {note && <p className="error">{note}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Setting up…' : 'Create first admin'}</button>
      </form>
    </>}
  </section></AuthShell>;
}
