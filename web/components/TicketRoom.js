'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { PRIORITY, STATUS, isStaff, ticketNo, when } from '@/lib/labels';
import { uploadFile } from '@/lib/upload';
import { notify } from '@/lib/alerts';
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
  const admin = profile.role === 'admin';
  const names = Object.fromEntries(people.map((p) => [p.id, p.display_name]));
  const author = (id) => id === profile.id ? 'You' : names[id] ?? (staff ? 'User' : 'IT Support');

  const reloadFiles = async () => {
    const { data } = await supabase.from('ticket_attachments').select('*').eq('ticket_id', ticket.id).order('created_at');
    if (data) setFiles(data);
  };

  useEffect(() => {
    const channel = supabase.channel(`ticket:${ticket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        ({ new: m }) => setMessages((all) => all.some((x) => x.id === m.id) ? all : [...all, m]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticket.id}` },
        async ({ new: t }) => {
          setTicket(t);
          // Clear already-rendered private conversation as soon as a requester
          // observes closure; RLS also blocks subsequent reads at the database.
          if (t.status === 'closed' && !staff) {
            setMessages([]);
            setFiles([]);
            setText('');
          } else if (t.status !== 'closed' && !staff) {
            const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at');
            if (data) setMessages(data);
            await reloadFiles();
          }
        })
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
    notify(supabase, 'message', data.id);
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

  // Only IT or above can open the chat; until then the employee just waits.
  const chatStarted = messages.some((m) => m.author_id !== ticket.requester_id && m.visibility === 'public');
  const started = staff || chatStarted;
  const closed = ticket.status === 'resolved' || ticket.status === 'closed';
  const canReopen = ticket.status === 'resolved' && !staff && Date.now() - new Date(ticket.closed_at ?? ticket.updated_at) < 14 * 864e5;

  return (
    <div className="room">
      <section className="thread card">
        <header>
          <small className="muted">{ticketNo(ticket.number)} · {ticket.category}</small>
          <div className="row spread">
            <h1>{ticket.title}</h1>
            {ticket.status !== 'closed' && <CallPanel supabase={supabase} ticketId={ticket.id} profile={profile} canStart={staff || chatStarted} staff={staff} />}
          </div>
          <p className="prewrap">{ticket.body}</p>
        </header>
        {ticket.status === 'closed' && !staff ? <div className="chat-wait">This ticket is closed. Its conversation and attachments are hidden. An Admin can reopen it if further discussion is needed.</div> : <>
          <div className="messages">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`bubble ${m.author_id === profile.id ? 'mine' : ''} ${m.visibility === 'internal' ? 'internal' : ''}`}>
                  <small>{author(m.author_id)}{m.visibility === 'internal' && ' · internal note'} · {when(m.created_at)}</small>
                  <p className="prewrap">{m.body}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={end} />
          </div>
          {error && <p className="error">{error}</p>}
          {!started && <p className="chat-wait">IT will start the chat here. You can reply and call once they do. IT can still call you here.</p>}
          {started && ticket.status !== 'closed' && <form className="composer" onSubmit={send}>
            <textarea rows={2} maxLength={8000} value={text} placeholder={staff && !messages.length ? 'Start the chat' : 'Write a message'} onChange={(e) => setText(e.target.value)} />
            <div className="row spread">
              <div className="row">
                <label className="file button">Attachments
                  <input type="file" multiple hidden onChange={attach} /></label>
                {staff && <label className="check"><input type="checkbox" checked={internal}
                  onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>}
              </div>
              <button className="primary">Send</button>
            </div>
          </form>}
        </>}
      </section>

      <aside className="stack">
        <div className="card stack">
          <div className="row spread"><span className={`pill s-${ticket.status}`}>{STATUS[ticket.status]}</span>
            <span className={`pill p-${ticket.priority}`}>{PRIORITY[ticket.priority]}</span></div>
          {ticket.source === 'email' && !ticket.sender_verified && <p className="error">Unverified email sender</p>}
          {staff && <>
            <label>Status<select disabled={ticket.status === 'closed' && !admin} value={ticket.status} onChange={(e) => update({ status: e.target.value })}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Priority<select value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Assigned to<select value={ticket.assignee_id ?? ''} onChange={(e) => update({
              assignee_id: e.target.value || null,
              ...(e.target.value && ticket.status === 'new' ? { status: 'assigned' } : {}),
            })}>
              <option value="">Unassigned</option>
              {people.filter((p) => isStaff(p.role) && p.active).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            </select></label>
            <p className="muted">Requester: {names[ticket.requester_id] ?? '—'}</p>
          </>}
          {admin && ticket.status === 'closed' && <button className="primary" onClick={() => update({ status: 'in_progress' })}>Reopen ticket and conversation</button>}
          {canReopen && <button onClick={() => update({ status: 'in_progress' })}>Reopen</button>}
          <small className="muted">Created {when(ticket.created_at)}</small>
        </div>
        <div className="card stack">
          <strong>Attachments</strong>
          {ticket.status === 'closed' && !staff ? <span className="muted">Hidden while the ticket is closed.</span> : files.length === 0 && <span className="muted">None</span>}
          {!(ticket.status === 'closed' && !staff) && files.map((f) => <button key={f.id} className="link left" onClick={() => open(f)}>{f.original_name}</button>)}
        </div>
      </aside>
    </div>
  );
}
