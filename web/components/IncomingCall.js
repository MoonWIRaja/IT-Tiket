'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { enablePush, showAlert, startRing, unlockAudio } from '@/lib/alerts';

// Rings on every page: the call itself is answered inside the ticket.
export function IncomingCall({ profile }) {
  const router = useRouter();
  const [call, setCall] = useState(null);
  const alert = (title, body, ticketId) => {
    navigator.vibrate?.([300, 150, 300]);
    if (document.hidden) showAlert(title, { body, tag: ticketId, data: { url: `tickets/view/?id=${ticketId}` } });
  };

  // Browsers only allow this prompt after a tap.
  useEffect(() => {
    const ask = async () => {
      unlockAudio();
      if (window.Notification?.permission === 'default') await Notification.requestPermission();
      enablePush(createClient(), profile.id).catch(() => {});
    };
    addEventListener('pointerdown', ask, { once: true });
    return () => removeEventListener('pointerdown', ask);
  }, [profile.id]);

  const ringing = !!call?.started_by;
  useEffect(() => (ringing ? startRing() : undefined), [ringing]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('incoming-calls')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_sessions' }, ({ new: c }) => {
        if (c.started_by === profile.id) return;
        // CallPanel rings on the open ticket; a hidden tab still needs the alert.
        if (new URLSearchParams(location.search).get('id') === c.ticket_id) {
          if (document.hidden) alert('Incoming call', 'Open IT-Tiket to answer', c.ticket_id);
          return;
        }
        setCall({ ...c, label: 'Incoming call' });
        alert('Incoming call', 'Open IT-Tiket to answer', c.ticket_id);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, ({ new: m }) => {
        if (m.author_id === profile.id) return;
        if (new URLSearchParams(location.search).get('id') === m.ticket_id) {
          if (document.hidden) alert('New message', m.body.slice(0, 80), m.ticket_id);
          return;
        }
        setCall((now) => (now?.started_by ? now : { ticket_id: m.ticket_id, label: 'New message' }));
        alert('New message', m.body.slice(0, 80), m.ticket_id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions' }, ({ new: c }) => {
        if (c.ended_at) setCall((now) => (now?.id === c.id ? null : now));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile.id]);

  if (!call) return null;
  return (
    <motion.div className="incoming" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <span>{call.label}</span>
      <button className="primary" onClick={() => { router.push(`/tickets/view/?id=${call.ticket_id}`); setCall(null); }}>Open</button>
      <button onClick={() => setCall(null)}>Dismiss</button>
    </motion.div>
  );
}
