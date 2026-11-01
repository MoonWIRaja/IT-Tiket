'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { PRIORITY, STATUS, isStaff, ticketNo, when } from '@/lib/labels';
import { uploadFile } from '@/lib/upload';
import { CallPanel } from './CallPanel';

export function TicketRoom({ profile, initialTicket, initialMessages, initialFiles, people }) {
  const supabase = useMemo(createClient, []);
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [files, setFiles] = useState(initialFiles);
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState(null);
  const end = useRef(null);
  const staff = isStaff(profile.role);
  const names = Object.fromEntries(people.map((p) => [p.id, p.display_name]));
  const author = (id) => id === profile.id ? 'Anda' : names[id] ?? (staff ? 'Pengguna' : 'IT Support');

  const reloadFiles = async () => {
    const { data } = await supabase.from('ticket_attachments').select('*').eq('ticket_id', ticket.id).order('created_at');
    if (data) setFiles(data);
  };

  useEffect(() => {
    const channel = supabase.channel(`ticket:${ticket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        ({ new: m }) => setMessages((all) => all.some((x) => x.id === m.id) ? all : [...all, m]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticket.id}` },
        ({ new: t }) => setTicket(t))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, ticket.id]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setError(null);
    const { data, error: err } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id, author_id: profile.id, body, visibility: internal ? 'internal' : 'public',
    }).select().single();
    if (err) return setError(err.message);
    setText('');
    setMessages((all) => all.some((x) => x.id === data.id) ? all : [...all, data]);
  }

  async function update(patch) {
    setError(null);
    const { data, error: err } = await supabase.from('tickets').update(patch).eq('id', ticket.id).select().single();
    if (err) return setError(err.message);
    setTicket(data);
  }

  async function attach(e) {
    const list = [...e.target.files];
    e.target.value = '';
    setError(null);
    try {
      for (const file of list) await uploadFile(supabase, { file, ticketId: ticket.id, userId: profile.id, internal });
      await reloadFiles();
    } catch (err) { setError(err.message); }
  }

  async function open(file) {
    const { data, error: err } = await supabase.storage.from('ticket-files').createSignedUrl(file.storage_path, 60);
    if (err) return setError(err.message);
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  const closed = ticket.status === 'resolved' || ticket.status === 'closed';
  const canReopen = closed && !staff && Date.now() - new Date(ticket.closed_at ?? ticket.updated_at) < 14 * 864e5;

  return (
    <div className="room">
      <section className="thread card">
        <header>
          <small className="muted">{ticketNo(ticket.number)} · {ticket.category}</small>
          <h1>{ticket.title}</h1>
          <p className="prewrap">{ticket.body}</p>
        </header>
        <div className="messages">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`bubble ${m.author_id === profile.id ? 'mine' : ''} ${m.visibility === 'internal' ? 'internal' : ''}`}>
                <small>{author(m.author_id)}{m.visibility === 'internal' && ' · nota dalaman'} · {when(m.created_at)}</small>
                <p className="prewrap">{m.body}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={end} />
        </div>
        {error && <p className="error">{error}</p>}
        <form className="composer" onSubmit={send}>
          <textarea rows={2} maxLength={8000} value={text} placeholder="Tulis mesej" onChange={(e) => setText(e.target.value)} />
          <div className="row spread">
            <div className="row">
              <label className="file button">Lampiran
                <input type="file" multiple hidden onChange={attach} /></label>
              {staff && <label className="check"><input type="checkbox" checked={internal}
                onChange={(e) => setInternal(e.target.checked)} /> Nota dalaman</label>}
            </div>
            <button className="primary">Hantar</button>
          </div>
        </form>
      </section>

      <aside className="stack">
        <div className="card stack">
          <div className="row spread"><span className={`pill s-${ticket.status}`}>{STATUS[ticket.status]}</span>
            <span className={`pill p-${ticket.priority}`}>{PRIORITY[ticket.priority]}</span></div>
          {ticket.source === 'email' && !ticket.sender_verified && <p className="error">Pengirim email tidak disahkan</p>}
          {staff && <>
            <label>Status<select value={ticket.status} onChange={(e) => update({ status: e.target.value })}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Keutamaan<select value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Ditugaskan kepada<select value={ticket.assignee_id ?? ''} onChange={(e) => update({
              assignee_id: e.target.value || null,
              ...(e.target.value && ticket.status === 'new' ? { status: 'assigned' } : {}),
            })}>
              <option value="">Belum ditugaskan</option>
              {people.filter((p) => isStaff(p.role) && p.active).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            </select></label>
            <p className="muted">Pemohon: {names[ticket.requester_id] ?? '—'}</p>
          </>}
          {canReopen && <button onClick={() => update({ status: 'in_progress' })}>Buka semula</button>}
          <small className="muted">Dibuat {when(ticket.created_at)}</small>
        </div>
        <CallPanel supabase={supabase} ticketId={ticket.id} profile={profile} disabled={ticket.status === 'closed'} />
        <div className="card stack">
          <strong>Lampiran</strong>
          {files.length === 0 && <span className="muted">Tiada</span>}
          {files.map((f) => <button key={f.id} className="link left" onClick={() => open(f)}>{f.original_name}</button>)}
        </div>
      </aside>
    </div>
  );
}
