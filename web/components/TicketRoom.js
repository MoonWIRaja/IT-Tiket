'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FILE_TYPES, MAX_FILE, PRIORITY, STATUS, isStaff, ticketNo, when } from '@/lib/labels';
import { recordFile, storeFile } from '@/lib/upload';
import { notify } from '@/lib/alerts';
import { CallPanel } from './CallPanel';

function FileChip({ supabase, file, onOpen }) {
  const image = file.content_type.startsWith('image/');
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!image) return;
    supabase.storage.from('ticket-files').createSignedUrl(file.storage_path, 3600).then(({ data }) => setSrc(data?.signedUrl));
  }, [supabase, file.storage_path, image]);
  return (
    <button type="button" className={image ? 'file-photo' : 'file-chip'} onClick={() => onOpen(file)}>
      {image ? src && <img src={src} alt={file.original_name} /> : <><i>{file.content_type === 'application/pdf' ? 'PDF' : 'TXT'}</i><span>{file.original_name}</span></>}
    </button>
  );
}

export function TicketRoom({ profile, initialTicket, initialMessages, initialFiles, people }) {
  const supabase = useMemo(createClient, []);
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [files, setFiles] = useState(initialFiles);
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [pending, setPending] = useState([]);
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const box = useRef(null);
  // Grows with the text, up to the CSS max-height.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
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
        ({ new: m }) => {
          setMessages((all) => all.some((x) => x.id === m.id) ? all : [...all, m]);
          // Files upload just after their message is saved.
          [400, 1500, 5000].forEach((ms) => setTimeout(reloadFiles, ms));
        })
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
    if (sending) return;
    const body = text.trim() || pending.map((p) => p.name).join(', ');
    if (!body) return;
    setError(null);
    setSending(true);
    // Upload first, so the message and its files appear together.
    let stored = [];
    try {
      stored = await Promise.all(pending.map((file) => storeFile(supabase, { file, ticketId: ticket.id, internal })));
    } catch (x) { setSending(false); return setError(x.message); }
    const { data, error: err } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id, author_id: profile.id, body, visibility: internal ? 'internal' : 'public',
    }).select().single();
    if (err) { setSending(false); return setError(err.message); }
    setText('');
    setPending([]);
    try {
      await Promise.all(stored.map((s) => recordFile(supabase, { stored: s, ticketId: ticket.id, userId: profile.id, messageId: data.id })));
    } catch (x) { setError(x.message); }
    await reloadFiles();
    setMessages((all) => all.some((x) => x.id === data.id) ? all : [...all, data]);
    setSending(false);
    notify(supabase, 'message', data.id);
  }

  async function update(patch) {
    setError(null);
    const { data, error: err } = await supabase.from('tickets').update(patch).eq('id', ticket.id).select().single();
    if (err) return setError(err.message);
    setTicket(data);
  }

  function attach(e) {
    const list = [...e.target.files];
    e.target.value = '';
    const bad = list.find((x) => !FILE_TYPES.includes(x.type) || x.size < 1 || x.size > MAX_FILE);
    setError(bad ? `${bad.name}: use PNG, JPG, WEBP, PDF or TXT under 10 MB` : null);
    setPending([...pending, ...list.filter((x) => x !== bad && FILE_TYPES.includes(x.type) && x.size >= 1 && x.size <= MAX_FILE)]);
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

  const hidden = ticket.status === 'closed' && !staff;
  // Files sent without a message still belong in the conversation.
  const timeline = [
    ...messages,
    ...files.filter((x) => !x.message_id).map((x) => ({
      id: x.id, author_id: x.uploaded_by, created_at: x.created_at, loose: x,
      visibility: x.storage_path.includes('/internal/') ? 'internal' : 'public',
    })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="room">
      <section className="thread card">
        <header>
          <div className="row spread ticket-head">
            <div className="ticket-name">
              <small className="muted">{ticketNo(ticket.number)} · {ticket.category}</small>
              <h1>{ticket.title}</h1>
            </div>
            <div className="row">
              <span className={`pill s-${ticket.status}`}>{STATUS[ticket.status]}</span>
              <span className={`pill p-${ticket.priority}`}>{PRIORITY[ticket.priority]}</span>
              {ticket.status !== 'closed' && <CallPanel peerName={staff ? names[ticket.requester_id] ?? 'Employee' : 'IT Support'} supabase={supabase} ticketId={ticket.id} profile={profile} canStart={staff || chatStarted} staff={staff} />}
              <button type="button" className="info-toggle" aria-label="Ticket details" aria-expanded={showInfo} onClick={() => setShowInfo(!showInfo)}>i</button>
            </div>
          </div>
          <div className={`ticket-info ${showInfo ? 'open' : ''}`}>
            <p className="prewrap">{ticket.body}</p>
            {ticket.source === 'email' && !ticket.sender_verified && <p className="error">Unverified email sender</p>}
            {staff && <div className="ticket-fields">
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
            </div>}
            <div className="row wrap ticket-meta">
              {staff && <small className="muted">Requester: {names[ticket.requester_id] ?? '—'}</small>}
              <small className="muted">Created {when(ticket.created_at)}</small>
              {admin && ticket.status === 'closed' && <button className="primary" onClick={() => update({ status: 'in_progress' })}>Reopen ticket and conversation</button>}
              {canReopen && <button onClick={() => update({ status: 'in_progress' })}>Reopen</button>}
            </div>
          </div>
        </header>
        {ticket.status === 'closed' && !staff ? <div className="chat-wait">This ticket is closed. Its conversation and attachments are hidden. An Admin can reopen it if further discussion is needed.</div> : <>
          <div className="messages">
            <AnimatePresence initial={false}>
              {timeline.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`bubble ${m.author_id === profile.id ? 'mine' : ''} ${m.visibility === 'internal' ? 'internal' : ''}`}>
                  <small>{author(m.author_id)}{m.visibility === 'internal' && ' · internal note'} · {when(m.created_at)}</small>
                  {(m.loose ? [m.loose] : files.filter((x) => x.message_id === m.id)).map((x) => <FileChip key={x.id} supabase={supabase} file={x} onOpen={open} />)}
                  {m.body && m.body !== files.filter((x) => x.message_id === m.id).map((x) => x.original_name).join(', ') && <p className="prewrap">{m.body}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={end} />
          </div>
          {error && <p className="error">{error}</p>}
          {!started && <p className="chat-wait">IT will start the chat here. You can reply and call once they do. IT can still call you here.</p>}
          {started && ticket.status !== 'closed' && <form className={`composer ${internal ? 'noting' : ''}`} onSubmit={send}>
            {pending.length > 0 && <div className="pending">
              {pending.map((p, i) => <span key={i} className="pending-file">{p.name}
                <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setPending(pending.filter((_, n) => n !== i))}>×</button></span>)}
            </div>}
            <textarea ref={box} rows={1} maxLength={8000} value={text} aria-label="Message"
              placeholder={internal ? 'Write an internal note' : staff && !messages.length ? 'Start the chat' : 'Write a message'}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) send(e); }} />
            <div className="composer-bar">
              <label className="composer-add" aria-label="Add attachment" title="Add attachment">+
                <input type="file" multiple hidden accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={attach} /></label>
              {staff && <label className="check"><input type="checkbox" checked={internal}
                onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>}
              <button className="composer-send" aria-label="Send" disabled={sending || (!text.trim() && !pending.length)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
              </button>
            </div>
          </form>}
        </>}
      </section>

    </div>
  );
}
