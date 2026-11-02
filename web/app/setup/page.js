'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SetupPage() {
  const [state, setState] = useState('loading');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/setup').then((r) => r.json()).then((d) => setState(d.available ? 'available' : 'closed'))
      .catch(() => setState('error'));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNote('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { display_name: form.name.trim() }, emailRedirectTo: `${location.origin}/auth/callback?next=/setup` },
    });
    if (error) { setBusy(false); setNote(error.message); return; }
    if (!data.session) { setBusy(false); setNote('Semak email dan sahkan akaun. Kemudian log masuk dan buka /setup untuk melengkapkan setup.'); return; }
    const result = await fetch('/api/setup', { method: 'POST' });
    const payload = await result.json();
    setBusy(false);
    if (!result.ok) { setState(payload.available ? 'available' : 'closed'); setNote(payload.error || 'Setup tidak berjaya.'); return; }
    location.assign('/');
  }

  return <main className="auth"><section className="card auth-card">
    <h1>Setup IT-Tiket</h1>
    {state === 'loading' && <p className="muted">Memeriksa status setup…</p>}
    {state === 'closed' && <><p>Setup pertama sudah selesai. Sila log masuk.</p><a href="/login">Ke halaman log masuk</a></>}
    {state === 'error' && <p className="error">Tidak dapat menyemak status setup. Cuba lagi kemudian.</p>}
    {state === 'available' && <>
      <p className="muted">Cipta akaun pemilik pertama. Akaun ini akan menjadi admin selepas pengesahan email jika diperlukan.</p>
      <form className="stack" onSubmit={submit}>
        <label>Nama<input required maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Kata laluan<input type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {note && <p className="error">{note}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Sedang menyediakan…' : 'Cipta admin pertama'}</button>
      </form>
    </>}
  </section></main>;
}
