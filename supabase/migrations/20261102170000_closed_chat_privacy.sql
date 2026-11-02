-- Closed-ticket chat privacy, admin-only reopen, IT-first chat start.
-- All three rules live in the database, so bypassing the web UI does not help.
--
-- 1. Once a ticket is 'closed', its employee requester can no longer read
--    messages, attachments (rows and files), call logs, or call signalling for it,
--    and cannot write any of them. Staff (IT/Admin) are unaffected.
-- 2. Only an Admin may move a ticket out of 'closed'. The change is audited
--    (ticket_reopened / ticket_closed).
-- 3. An employee can only send chat messages, call, or attach to a message after
--    IT/Admin has posted a public message in that ticket.
--    Initial attachments with no message (message_id null) stay allowed so the
--    "new ticket" form can still upload files.
-- The ticket row itself stays visible to its requester so they can see the status.

create or replace function public.ticket_chat_started(p_ticket uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ticket_messages m
    join public.profiles p on p.id = m.author_id
    where m.ticket_id = p_ticket
      and m.visibility = 'public'
      and p.role in ('it', 'admin')
  )
$$;

revoke all on function public.ticket_chat_started(uuid) from public;
grant execute on function public.ticket_chat_started(uuid) to authenticated;

-- Ticket writes: only Admin leaves 'closed'; employees reopen only from 'resolved'.
create or replace function public.guard_ticket_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  actor := public.app_actor_role();

  if tg_op = 'INSERT' then
    if new.sender_verified then
      raise exception 'sender_verified is server-only';
    end if;
    if new.source is distinct from 'app' then
      raise exception 'source is server-only';
    end if;
    if actor is null or actor = 'atasan' then
      raise exception 'forbidden';
    end if;
    if actor = 'karyawan' and new.requester_id is distinct from auth.uid() then
      raise exception 'forbidden';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.number is distinct from old.number
     or new.requester_id is distinct from old.requester_id
     or new.sender_verified is distinct from old.sender_verified
     or new.source is distinct from old.source
     or new.created_at is distinct from old.created_at
  then
    raise exception 'immutable ticket field';
  end if;

  if old.status = 'closed' and new.status is distinct from 'closed'
     and actor is distinct from 'admin' then
    raise exception 'only an admin can reopen a closed ticket';
  end if;

  if actor = 'karyawan' then
    if old.requester_id is distinct from auth.uid() then
      raise exception 'forbidden';
    end if;
    if old.status is distinct from 'resolved' or new.status is distinct from 'in_progress' then
      raise exception 'karyawan can only reopen a resolved ticket';
    end if;
    if coalesce(old.closed_at, old.updated_at) < now() - interval '14 days' then
      raise exception 'reopen window expired';
    end if;
    if new.title is distinct from old.title
       or new.body is distinct from old.body
       or new.priority is distinct from old.priority
       or new.category is distinct from old.category
       or new.assignee_id is distinct from old.assignee_id
    then
      raise exception 'karyawan cannot edit ticket fields';
    end if;
    new.closed_at = null;
    return new;
  end if;

  if actor in ('it', 'admin') then
    if new.status in ('resolved', 'closed') and old.status not in ('resolved', 'closed') then
      new.closed_at = now();
    elsif new.status not in ('resolved', 'closed') then
      new.closed_at = null;
    end if;
    return new;
  end if;

  raise exception 'forbidden';
end;
$$;

-- Audit trail for close and reopen (the generic ticket audit only records the new status).
create or replace function public.audit_ticket_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'closed' and new.status is distinct from 'closed' then
    perform public.write_audit(auth.uid(), 'ticket_reopened', 'tickets', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  elsif new.status = 'closed' and old.status is distinct from 'closed' then
    perform public.write_audit(auth.uid(), 'ticket_closed', 'tickets', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

revoke all on function public.audit_ticket_state() from public;

drop trigger if exists tickets_audit_state on public.tickets;
create trigger tickets_audit_state
  after update on public.tickets
  for each row execute function public.audit_ticket_state();

-- Messages
drop policy if exists messages_select on public.ticket_messages;
create policy messages_select on public.ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and visibility = 'public'
          )
        )
    )
  );

drop policy if exists messages_insert on public.ticket_messages;
create policy messages_insert on public.ticket_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and visibility = 'public'
            and public.ticket_chat_started(t.id)
          )
        )
    )
  );

-- Attachment rows
drop policy if exists attachments_select on public.ticket_attachments;
create policy attachments_select on public.ticket_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and storage_path ~ '/public/'
            and (
              message_id is null
              or exists (
                select 1 from public.ticket_messages m
                where m.id = message_id and m.visibility = 'public'
              )
            )
          )
        )
    )
  );

drop policy if exists attachments_insert on public.ticket_attachments;
create policy attachments_insert on public.ticket_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and storage_path ~ '/public/'
            and (message_id is null or public.ticket_chat_started(t.id))
          )
        )
    )
  );

-- Call logs
drop policy if exists calls_select on public.call_sessions;
create policy calls_select on public.call_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = auth.uid() and t.status <> 'closed')
        )
    )
  );

drop policy if exists calls_insert on public.call_sessions;
create policy calls_insert on public.call_sessions
  for insert to authenticated
  with check (
    started_by = auth.uid()
    and recording_path is null
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          (public.app_actor_role() in ('it', 'admin') and t.status <> 'closed' and public.ticket_chat_started(t.id))
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and public.ticket_chat_started(t.id)
          )
        )
    )
  );

drop policy if exists calls_update on public.call_sessions;
create policy calls_update on public.call_sessions
  for update to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = auth.uid() and t.status <> 'closed')
        )
    )
  )
  with check (recording_path is null);

-- Files in storage
drop policy if exists ticket_files_select on storage.objects;
create policy ticket_files_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ticket-files'
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(name))[1]
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and (storage.foldername(name))[2] = 'public'
          )
        )
    )
  );

drop policy if exists ticket_files_insert on storage.objects;
create policy ticket_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ticket-files'
    and owner = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(name))[1]
        and (
          public.app_actor_role() in ('it', 'admin')
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and t.status <> 'closed'
            and (storage.foldername(name))[2] = 'public'
          )
        )
    )
  );

-- Private call signalling (Realtime broadcast topic call:<ticket uuid>)
drop policy if exists call_topic_read on realtime.messages;
create policy call_topic_read on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from public.tickets t
      where (select realtime.topic()) = 'call:' || t.id::text
        and (
          (public.app_actor_role() in ('it', 'admin') and t.status <> 'closed' and public.ticket_chat_started(t.id))
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = (select auth.uid())
            and t.status <> 'closed'
            and public.ticket_chat_started(t.id)
          )
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
        and (
          (public.app_actor_role() in ('it', 'admin') and t.status <> 'closed' and public.ticket_chat_started(t.id))
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = (select auth.uid())
            and t.status <> 'closed'
            and public.ticket_chat_started(t.id)
          )
        )
    )
  );
