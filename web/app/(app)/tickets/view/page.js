'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { isStaff } from '@/lib/labels';
import { TicketRoom } from '@/components/TicketRoom';

function Ticket() {
  const id = useSearchParams().get('id');
  const profile = useProfile();
  const [data, setData] = useState(undefined);
  useEffect(() => {
    if (!id) return setData(null);
    const supabase = createClient();
    (async () => {
      const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
      if (!ticket) return setData(null);
      const [messages, files, staff] = await Promise.all([
        supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at'),
        supabase.from('ticket_attachments').select('*').eq('ticket_id', id).order('created_at'),
        isStaff(profile.role) ? supabase.from('profiles').select('id,display_name,role,active') : Promise.resolve({ data: [] }),
      ]);
      setData({ ticket, messages: messages.data ?? [], files: files.data ?? [], people: staff.data ?? [] });
    })();
  }, [id, profile]);
  if (data === undefined) return <p className="muted">Loading…</p>;
  if (data === null) return <p className="error">Ticket not found.</p>;
  return <TicketRoom key={data.ticket.id} profile={profile} initialTicket={data.ticket}
    initialMessages={data.messages} initialFiles={data.files} people={data.people} />;
}
export default function Page() { return <Suspense fallback={null}><Ticket /></Suspense>; }
