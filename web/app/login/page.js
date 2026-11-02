'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { go } from '@/lib/base';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/AuthShell';
import { VerifyCode } from '@/components/VerifyCode';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [verify, setVerify] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Until the first admin exists, setup comes before login.
  useEffect(() => {
    createClient().rpc('setup_is_available').then(({ data }) => {
      if (data === true) go('/setup/');
      else setReady(true);
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNote(null);
    const auth = createClient().auth;
    const { data, error } =
      mode === 'signin' ? await auth.signInWithPassword({ email: form.email, password: form.password })
      : mode === 'signup' ? await auth.signUp({ email: form.email, password: form.password,
          options: { data: { display_name: form.name } } })
      : await auth.signInWithOtp({ email: form.email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (error?.code === 'email_not_confirmed') {
      await auth.resend({ type: 'signup', email: form.email });
      return setVerify('signup');
    }
    if (error) return setNote({ bad: true, text: error.message });
    if (data?.session) return go('/');
    setVerify(mode === 'signup' ? 'signup' : 'email');
  }

  if (!ready) return <AuthShell><p className="muted">Loading…</p></AuthShell>;

  if (verify) return <AuthShell><VerifyCode email={form.email} type={verify} onVerified={() => go('/')} onBack={() => setVerify(null)} /></AuthShell>;

  return (
    <AuthShell>
      <motion.form className="auth-form" onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted">{mode === 'signup' ? 'Register as an employee' : 'Sign in to your account'}</p>
        </div>
        {mode === 'signup' && <label>Name<input required autoComplete="name" value={form.name} onChange={set('name')} /></label>}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
        {mode !== 'magic' && <label>Password
          <input type="password" required minLength={8} value={form.password} onChange={set('password')}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>}
        {note && <p className={note.bad ? 'error' : 'ok'}>{note.text}</p>}
        <button className="primary" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send code'}
        </button>
        <div className="row spread">
          <button type="button" className="link" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'I already have an account' : 'Create an account'}</button>
          <button type="button" className="link" onClick={() => setMode(mode === 'magic' ? 'signin' : 'magic')}>
            {mode === 'magic' ? 'Use password' : 'Email me a code'}</button>
        </div>
      </motion.form>
    </AuthShell>
  );
}
