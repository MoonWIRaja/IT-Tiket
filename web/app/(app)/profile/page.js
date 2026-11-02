'use client';
import { useRef, useState } from 'react';
import { go } from '@/lib/base';
import { ROLE } from '@/lib/labels';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { Avatar } from '@/components/Avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GetApp } from '@/components/GetApp';

// Shrinks to a small JPEG: the picture lives in the Auth user metadata.
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 96, 96);
  return canvas.toDataURL('image/jpeg', 0.75);
}

export default function Profile() {
  const profile = useProfile();
  const [name, setName] = useState(profile.display_name);
  const [note, setNote] = useState(null);
  const input = useRef(null);
  const supabase = createClient();

  async function picture(avatar_url) {
    const { error } = await supabase.auth.updateUser({ data: { avatar_url } });
    if (error) return setNote({ bad: true, text: error.message });
    go('/profile/');
  }

  async function pick(e) {
    const file = e.target.files[0];
    if (!file) return;
    try { await picture(await shrink(file)); } catch { setNote({ bad: true, text: 'That image could not be read.' }); }
  }

  async function save(e) {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', profile.id);
    setNote(error ? { bad: true, text: error.message } : { text: 'Saved.' });
  }

  async function signOut() {
    await supabase.auth.signOut();
    go('/login/');
  }

  return (
    <>
      <h1>Profile</h1>
      <div className="profile-grid">
        <section className="card profile-head">
          <Avatar profile={profile} size={84} />
          <div className="stack">
            <span><b>{profile.display_name}</b><br /><small className="muted">{ROLE[profile.role]} · {profile.email}</small></span>
            <div className="row">
              <button onClick={() => input.current.click()}>Change photo</button>
              {profile.avatar && <button className="link" onClick={() => picture(null)}>Remove</button>}
            </div>
          </div>
          <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
        </section>
        <form className="card stack" onSubmit={save}>
          <label>Display name<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
          {note && <p className={note.bad ? 'error' : 'ok'}>{note.text}</p>}
          <button className="primary">Save</button>
        </form>
        <GetApp />
        <section className="card row spread"><span>Appearance</span><ThemeToggle /></section>
        <button className="danger" onClick={signOut}>Sign out</button>
      </div>
    </>
  );
}
