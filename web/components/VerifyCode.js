'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const LENGTH = 6;
const COOLDOWN = 60;

// type: 'signup' for new accounts, 'email' for sign-in codes.
export function VerifyCode({ email, type, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [wait, setWait] = useState(COOLDOWN);
  const [error, setError] = useState(null);
  const [state, setState] = useState('idle'); // idle | busy | done
  const boxes = useRef([]);

  useEffect(() => { boxes.current[0]?.focus(); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify(token) {
    setState('busy'); setError(null);
    const { data, error: err } = await createClient().auth.verifyOtp({ email, token, type });
    if (err) {
      setState('idle');
      setError('That code is wrong or has expired.');
      setDigits(Array(LENGTH).fill(''));
      boxes.current[0]?.focus();
      return;
    }
    setState('done');
    setTimeout(() => onVerified(data.session), 700);
  }

  function fill(from, text) {
    const next = [...digits];
    const chars = text.replace(/\D/g, '').slice(0, LENGTH - from).split('');
    chars.forEach((c, i) => { next[from + i] = c; });
    setDigits(next);
    boxes.current[Math.min(from + chars.length, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  }

  function key(e, i) {
    if (e.key !== 'Backspace' || digits[i] || i === 0) return;
    const next = [...digits];
    next[i - 1] = '';
    setDigits(next);
    boxes.current[i - 1]?.focus();
  }

  async function resend() {
    setError(null);
    const auth = createClient().auth;
    const { error: err } = type === 'signup'
      ? await auth.resend({ type: 'signup', email })
      : await auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (err) return setError(err.message);
    setWait(COOLDOWN);
  }

  const done = state === 'done';
  return (
    <motion.div className="auth-form otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h2>{done ? <>Verified <em>successfully</em></> : 'Enter your code'}</h2>
        <p className="muted">{done ? 'Taking you in…' : <>We sent a {LENGTH}-digit code to <b>{email}</b>. It expires in 5 minutes.</>}</p>
      </div>
      {done
        ? <motion.div className="otp-done" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>✓</motion.div>
        : <div className="otp-boxes">
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d} inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1}`}
                disabled={state === 'busy'} onKeyDown={(e) => key(e, i)}
                onChange={(e) => fill(i, e.target.value.slice(-1) || '') || (!e.target.value && setDigits(digits.map((x, j) => j === i ? '' : x)))}
                onPaste={(e) => { e.preventDefault(); fill(0, e.clipboardData.getData('text')); }} />
            ))}
          </div>}
      {error && <p className="error">{error}</p>}
      {!done && <div className="row spread">
        <button type="button" className="link" onClick={onBack}>Back</button>
        {wait > 0
          ? <span className="muted">Resend in 00:{String(wait).padStart(2, '0')}</span>
          : <button type="button" className="link" onClick={resend}>Resend code</button>}
      </div>}
    </motion.div>
  );
}
