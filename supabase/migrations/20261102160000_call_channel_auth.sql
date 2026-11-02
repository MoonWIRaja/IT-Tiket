-- Private call signalling. Do not ALTER realtime.messages; RLS is already on.
-- Clients must join with private: true. Topic shape is call:<ticket uuid>.

drop policy if exists call_topic_read on realtime.messages;
drop policy if exists call_topic_write on realtime.messages;

create policy call_topic_read on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from public.tickets t
      where (select realtime.topic()) = 'call:' || t.id::text
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = (select auth.uid()))
        )
    )
  );

create policy call_topic_write on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from public.tickets t
      where (select realtime.topic()) = 'call:' || t.id::text
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = (select auth.uid()))
        )
    )
  );
