'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNote(null);
    const auth = createClient().auth;
    const redirect = `${location.origin}/auth/callback`;
    const { data, error } =
      mode === 'signin' ? await auth.signInWithPassword({ email: form.email, password: form.password })
      : mode === 'signup' ? await auth.signUp({ email: form.email, password: form.password,
          options: { data: { display_name: form.name }, emailRedirectTo: redirect } })
      : await auth.signInWithOtp({ email: form.email, options: { emailRedirectTo: redirect, shouldCreateUser: false } });
    setBusy(false);
    if (error) return setNote({ bad: true, text: error.message });
    if (data?.session) return location.assign('/');
    setNote({ text: 'Semak email anda untuk pautan masuk.' });
  }

  return (
    <main className="auth">
      <motion.form className="card auth-card" onSubmit={submit}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1>IT-Tiket</h1>
        <p className="muted">{mode === 'signup' ? 'Daftar akaun karyawan' : 'Masuk ke akaun anda'}</p>
        {mode === 'signup' && <label>Nama<input required value={form.name} onChange={set('name')} /></label>}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
        {mode !== 'magic' && <label>Kata laluan
          <input type="password" required minLength={8} value={form.password} onChange={set('password')} /></label>}
        {note && <p className={note.bad ? 'error' : 'ok'}>{note.text}</p>}
        <button className="primary" disabled={busy}>
          {mode === 'signin' ? 'Masuk' : mode === 'signup' ? 'Daftar' : 'Hantar pautan'}
        </button>
        <div className="row spread">
          <button type="button" className="link" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'Sudah ada akaun' : 'Daftar akaun'}</button>
          <button type="button" className="link" onClick={() => setMode(mode === 'magic' ? 'signin' : 'magic')}>
            {mode === 'magic' ? 'Guna kata laluan' : 'Masuk dengan pautan email'}</button>
        </div>
      </motion.form>
    </main>
  );
}
