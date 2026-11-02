// Sends web push for a chat message or call the signed-in user just created.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return reply(401, { error: 'unauthorized' });

  const { type, id } = await req.json();
  // RLS on the user's own client proves they can see this row.
  const row: any = type === 'message'
    ? (await asUser.from('ticket_messages').select('ticket_id,author_id,body,visibility').eq('id', id).single()).data
    : (await asUser.from('call_sessions').select('ticket_id,started_by').eq('id', id).single()).data;
  if (!row || (row.author_id ?? row.started_by) !== user.id) return reply(403, { error: 'forbidden' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ticket } = await admin.from('tickets').select('requester_id,assignee_id,status').eq('id', row.ticket_id).single();
  if (!ticket) return reply(404, { error: 'not found' });

  // The assignee, or all active IT when unassigned, plus the requester.
  let to: string[] = ticket.assignee_id ? [ticket.assignee_id] : [];
  if (!to.length) {
    const { data } = await admin.from('profiles').select('id').in('role', ['it', 'admin']).eq('active', true);
    to = (data ?? []).map((p) => p.id);
  }
  if (row.visibility !== 'internal' && ticket.status !== 'closed') to.push(ticket.requester_id);
  to = [...new Set(to)].filter((x) => x !== user.id);
  if (!to.length) return reply(200, { sent: 0 });

  const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', to);
  const payload = JSON.stringify({
    title: type === 'message' ? 'New message' : 'Incoming call',
    body: type === 'message' ? row.body.slice(0, 80) : 'Open IT-Tiket to answer',
    url: `tickets/view/?id=${row.ticket_id}`,
    tag: row.ticket_id,
    call: type !== 'message',
  });
  const results = await Promise.allSettled((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { urgency: 'high', TTL: 60 });
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      throw e;
    }
  }));
  return reply(200, { sent: results.filter((r) => r.status === 'fulfilled').length, of: results.length });
});
