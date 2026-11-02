'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, PRIORITY } from '@/lib/labels';
import { uploadFile } from '@/lib/upload';

export default function NewTicket() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    const f = new FormData(e.target);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ticket, error: err } = await supabase.from('tickets').insert({
        requester_id: user.id, title: f.get('title'), body: f.get('body'),
        category: f.get('category'), priority: f.get('priority'),
      }).select('id').single();
      if (err) throw err;
      for (const file of f.getAll('files')) {
        if (file.size) await uploadFile(supabase, { file, ticketId: ticket.id, userId: user.id, internal: false });
      }
      router.push(`/tickets/view/?id=${ticket.id}`);
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  return (
    <>
      <h1>New ticket</h1>
      <form className="card stack narrow" onSubmit={submit}>
        <label>Title<input name="title" required maxLength={200} /></label>
        <div className="row">
          <label>Category<select name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Priority<select name="priority" defaultValue="normal">
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label>Problem<textarea name="body" required rows={7} maxLength={20000} /></label>
        <label>Attachments (PNG, JPG, WEBP, PDF, TXT, 10 MB)
          <input name="files" type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
      </form>
    </>
  );
}
