import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { isStaff } from '@/lib/labels';
import { TicketRoom } from '@/components/TicketRoom';

export default async function Ticket({ params }) {
  const { id } = await params;
  const { supabase, profile } = await getProfile();
  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
  if (!ticket) notFound();
  const [messages, files, staff] = await Promise.all([
    supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at'),
    supabase.from('ticket_attachments').select('*').eq('ticket_id', id).order('created_at'),
    isStaff(profile.role)
      ? supabase.from('profiles').select('id,display_name,role,active')
      : Promise.resolve({ data: [] }),
  ]);
  return <TicketRoom key={ticket.id} profile={profile} initialTicket={ticket}
    initialMessages={messages.data ?? []} initialFiles={files.data ?? []} people={staff.data ?? []} />;
}
