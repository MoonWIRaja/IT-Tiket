-- 1. IT/Admin can call any ticket that is not closed, without a chat first.
--    Employees still need IT to have started the chat before they can call.
-- 2. The requester may join call signalling on any non-closed ticket so a staff
--    call can reach them. Realtime checks this once at join, so it cannot depend
--    on a call existing yet.
-- 3. Web push subscriptions, and an audit trail for remote control.

drop policy if exists calls_insert on public.call_sessions;
create policy calls_insert on public.call_sessions
  for insert to authenticated
  with check (
    started_by = auth.uid()
    and recording_path is null
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.status <> 'closed'
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and public.ticket_chat_started(t.id)
          )
        )
    )
  );

drop policy if exists call_topic_read on realtime.messages;
create policy call_topic_read on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from public.tickets t
      where (select realtime.topic()) = 'call:' || t.id::text
        and t.status <> 'closed'
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = (select auth.uid()))
        )
    )
  );

drop policy if exists call_topic_write on realtime.messages;
create policy call_topic_write on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from public.tickets t
      where (select realtime.topic()) = 'call:' || t.id::text
        and t.status <> 'closed'
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = (select auth.uid()))
        )
    )
  );

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
create policy push_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- The person whose PC is controlled records each grant and stop.
create or replace function public.log_remote_control(p_ticket uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in ('remote_control_granted', 'remote_control_stopped') then
    raise exception 'invalid action';
  end if;
  if not exists (
    select 1 from public.tickets t
    where t.id = p_ticket and t.requester_id = auth.uid() and t.status <> 'closed'
  ) then
    raise exception 'forbidden';
  end if;
  perform public.write_audit(auth.uid(), p_action, 'tickets', p_ticket, '{}'::jsonb);
end;
$$;
revoke all on function public.log_remote_control(uuid, text) from public;
grant execute on function public.log_remote_control(uuid, text) to authenticated;
