'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { STATUS, isStaff, ticketNo, when } from '@/lib/labels';

export default function Chats() {
  const profile = useProfile();
  const staff = isStaff(profile.role);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: tickets }, { data: messages }] = await Promise.all([
        supabase.from('tickets').select('id,number,title,status,requester_id,updated_at').order('updated_at', { ascending: false }).limit(200),
        supabase.from('ticket_messages').select('ticket_id,author_id,body,created_at').eq('visibility', 'public').order('created_at', { ascending: false }).limit(1000),
      ]);
      const list = (tickets ?? []).map((t) => {
        const own = (messages ?? []).filter((m) => m.ticket_id === t.id);
        return { ...t, last: own[0], started: own.some((m) => m.author_id !== t.requester_id) };
      });
      // Employees only get a chat once IT or above has opened it.
      setRows(staff ? list.filter((t) => t.status !== 'closed') : list.filter((t) => t.started));
    }
    load();
    const channel = supabase.channel('chat-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [staff]);

  return (
    <>
      <h1>Chats</h1>
      {rows?.length === 0 && <p className="card muted">{staff ? 'No open tickets.' : 'No chats yet. IT will start one here once they pick up your ticket.'}</p>}
      <div className="chat-list">
        {rows?.map((t) => (
          <Link key={t.id} href={`/tickets/view/?id=${t.id}`} className="card chat-row">
            <span className="avatar chat-av">{t.title.trim()[0]?.toUpperCase()}</span>
            <span className="chat-text">
              <b>{t.title}</b>
              <small className="muted">{ticketNo(t.number)} · {t.last ? t.last.body.slice(0, 90) : 'Not started'}</small>
            </span>
            <span className="chat-meta">
              <span className={`pill s-${t.status}`}>{STATUS[t.status]}</span>
              {t.last && <small className="muted">{when(t.last.created_at)}</small>}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
