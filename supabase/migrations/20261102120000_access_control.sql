-- Access control for the IT ticket system.
-- Apply on Supabase (Postgres 15). Auth, storage, and the service_role
-- role already exist there. The service role bypasses RLS; keep its key
-- on the server only. Never put it in a NEXT_PUBLIC_ variable or the client.
--
-- Defaults until MoonWiRaja overrides them:
--   atasan reads monthly aggregates only
--   email trust (sender_verified, source=email) is server-only
--   call recording_path is server-only
--   karyawan may reopen within 14 days and cannot edit ticket fields
--
-- Deactivating a profile blocks RLS. It does not revoke an existing Auth
-- JWT. The server must also ban that Auth user when it deactivates someone.

create sequence public.ticket_number_seq;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'karyawan' check (role in ('karyawan', 'it', 'atasan', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.ticket_number_seq'),
  requester_id uuid not null references public.profiles (id),
  assignee_id uuid references public.profiles (id),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  status text not null default 'new' check (status in ('new', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  category text not null default 'general' check (char_length(category) between 1 and 80),
  source text not null default 'app' check (source in ('app', 'email')),
  sender_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 8000),
  visibility text not null check (visibility in ('public', 'internal')),
  created_at timestamptz not null default now()
);

create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid references public.ticket_messages (id) on delete cascade,
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}/(public|internal)/[0-9a-f-]{36}$'),
  original_name text not null check (char_length(original_name) between 1 and 200),
  content_type text not null check (content_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (storage_path)
);

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  started_by uuid not null references public.profiles (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  recording_path text
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create table public.ticket_metrics_monthly (
  month date primary key,
  opened integer not null,
  closed integer not null,
  avg_close_hours numeric,
  by_category jsonb not null default '{}'::jsonb
);

create index tickets_requester_idx on public.tickets (requester_id);
create index tickets_status_idx on public.tickets (status);
create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id);
create index ticket_attachments_ticket_idx on public.ticket_attachments (ticket_id);
create index call_sessions_ticket_idx on public.call_sessions (ticket_id);

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.call_sessions enable row level security;
alter table public.ticket_metrics_monthly enable row level security;
alter table public.audit_events enable row level security;

alter table public.profiles force row level security;
alter table public.tickets force row level security;
alter table public.ticket_messages force row level security;
alter table public.ticket_attachments force row level security;
alter table public.call_sessions force row level security;
alter table public.ticket_metrics_monthly force row level security;

-- audit_events is not forced. The owner-owned trigger inserts rows.
-- authenticated has no insert grant and no insert policy.

revoke all on public.profiles from anon, authenticated;
revoke all on public.tickets from anon, authenticated;
revoke all on public.ticket_messages from anon, authenticated;
revoke all on public.ticket_attachments from anon, authenticated;
revoke all on public.call_sessions from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.ticket_metrics_monthly from anon, authenticated;
revoke all on sequence public.ticket_number_seq from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert on public.ticket_attachments to authenticated;
grant select, insert, update on public.call_sessions to authenticated;
grant select on public.audit_events to authenticated;
grant select on public.ticket_metrics_monthly to authenticated;
grant usage, select on sequence public.ticket_number_seq to authenticated;

create or replace function public.app_actor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when p.active then p.role else null end
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'karyawan'
  );
  return new;
end;
$$;

create or replace function public.write_audit(actor uuid, action text, entity text, entity_id uuid, meta jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_events (actor_id, action, entity, entity_id, meta)
  values (actor, action, entity, entity_id, coalesce(meta, '{}'::jsonb));
end;
$$;

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

  if actor = 'karyawan' then
    if old.requester_id is distinct from auth.uid() then
      raise exception 'forbidden';
    end if;
    if old.status not in ('resolved', 'closed') or new.status is distinct from 'in_progress' then
      raise exception 'karyawan can only reopen';
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

create or replace function public.audit_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.write_audit(
    auth.uid(),
    tg_op,
    'tickets',
    coalesce(new.id, old.id),
    jsonb_build_object('status', coalesce(new.status, old.status))
  );
  return coalesce(new, old);
end;
$$;

create or replace function public.guard_message_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.visibility = 'internal' and public.app_actor_role() not in ('it', 'admin') then
    raise exception 'forbidden';
  end if;
  if new.author_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.guard_attachment_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  message_visibility text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.uploaded_by is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;
  if public.app_actor_role() = 'karyawan' and new.storage_path !~ '/public/' then
    raise exception 'forbidden';
  end if;
  if new.message_id is not null then
    select m.visibility into message_visibility
    from public.ticket_messages m
    where m.id = new.message_id and m.ticket_id = new.ticket_id;
    if message_visibility is null then
      raise exception 'forbidden';
    end if;
    if public.app_actor_role() = 'karyawan' and message_visibility is distinct from 'public' then
      raise exception 'forbidden';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_call_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.recording_path is not null then
    raise exception 'recording is server-only';
  end if;
  if tg_op = 'UPDATE' then
    if new.ticket_id is distinct from old.ticket_id
       or new.started_by is distinct from old.started_by
       or new.started_at is distinct from old.started_at
       or new.recording_path is distinct from old.recording_path
    then
      raise exception 'immutable call field';
    end if;
  end if;
  if new.started_by is distinct from auth.uid() and public.app_actor_role() not in ('it', 'admin') then
    raise exception 'forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if public.app_actor_role() is distinct from 'admin' then
    raise exception 'forbidden';
  end if;
  if new_role not in ('karyawan', 'it', 'atasan', 'admin') then
    raise exception 'invalid role';
  end if;
  if new_role is distinct from 'admin' then
    select count(*) into admin_count from public.profiles where role = 'admin' and active and id <> target;
    if admin_count < 1 and exists (select 1 from public.profiles where id = target and role = 'admin') then
      raise exception 'last admin';
    end if;
  end if;
  update public.profiles set role = new_role where id = target;
  if not found then
    raise exception 'role update failed';
  end if;
  perform public.write_audit(auth.uid(), 'set_role', 'profiles', target, jsonb_build_object('role', new_role));
end;
$$;

create or replace function public.admin_set_active(target uuid, is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.app_actor_role() is distinct from 'admin' then
    raise exception 'forbidden';
  end if;
  update public.profiles set active = is_active where id = target;
  if not found then
    raise exception 'active update failed';
  end if;
  perform public.write_audit(auth.uid(), 'set_active', 'profiles', target, jsonb_build_object('active', is_active));
end;
$$;

create or replace function public.refresh_ticket_metrics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and public.app_actor_role() is distinct from 'admin' then
    raise exception 'forbidden';
  end if;
  delete from public.ticket_metrics_monthly;
  insert into public.ticket_metrics_monthly (month, opened, closed, avg_close_hours, by_category)
  with months as (
    select
      date_trunc('month', created_at)::date as month,
      count(*)::integer as opened,
      count(*) filter (where status in ('resolved', 'closed'))::integer as closed,
      avg(extract(epoch from (closed_at - created_at)) / 3600.0) filter (where closed_at is not null) as avg_close_hours
    from public.tickets
    group by 1
  ),
  cats as (
    select month, jsonb_object_agg(category, cnt) as by_category
    from (
      select date_trunc('month', created_at)::date as month, category, count(*) as cnt
      from public.tickets
      group by 1, 2
    ) per_category
    group by month
  )
  select months.month, months.opened, months.closed, months.avg_close_hours, coalesce(cats.by_category, '{}'::jsonb)
  from months
  left join cats on cats.month = months.month;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger tickets_touch
  before update on public.tickets
  for each row execute function public.touch_updated_at();

create trigger tickets_guard
  before insert or update on public.tickets
  for each row execute function public.guard_ticket_write();

create trigger tickets_audit
  after insert or update or delete on public.tickets
  for each row execute function public.audit_ticket();

create trigger messages_guard
  before insert on public.ticket_messages
  for each row execute function public.guard_message_write();

create trigger attachments_guard
  before insert on public.ticket_attachments
  for each row execute function public.guard_attachment_write();

create trigger calls_guard
  before insert or update on public.call_sessions
  for each row execute function public.guard_call_write();

revoke all on function public.app_actor_role() from public;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.write_audit(uuid, text, text, uuid, jsonb) from public;
revoke all on function public.guard_ticket_write() from public;
revoke all on function public.audit_ticket() from public;
revoke all on function public.guard_message_write() from public;
revoke all on function public.guard_attachment_write() from public;
revoke all on function public.guard_call_write() from public;
revoke all on function public.admin_set_role(uuid, text) from public;
revoke all on function public.admin_set_active(uuid, boolean) from public;
revoke all on function public.refresh_ticket_metrics() from public;

grant execute on function public.app_actor_role() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;
grant execute on function public.refresh_ticket_metrics() to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.app_actor_role() in ('it', 'admin'));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy tickets_select on public.tickets
  for select to authenticated
  using (
    (public.app_actor_role() = 'karyawan' and requester_id = auth.uid())
    or public.app_actor_role() in ('it', 'admin')
  );

create policy tickets_insert on public.tickets
  for insert to authenticated
  with check (
    sender_verified = false
    and source = 'app'
    and (
      (public.app_actor_role() = 'karyawan' and requester_id = auth.uid())
      or public.app_actor_role() in ('it', 'admin')
    )
  );

create policy tickets_update on public.tickets
  for update to authenticated
  using (
    public.app_actor_role() in ('it', 'admin')
    or (public.app_actor_role() = 'karyawan' and requester_id = auth.uid())
  )
  with check (
    public.app_actor_role() in ('it', 'admin')
    or (public.app_actor_role() = 'karyawan' and requester_id = auth.uid())
  );

create policy messages_select on public.ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          (public.app_actor_role() in ('it', 'admin'))
          or (
            public.app_actor_role() = 'karyawan'
            and t.requester_id = auth.uid()
            and visibility = 'public'
          )
        )
    )
  );

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
            and visibility = 'public'
          )
        )
    )
  );

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
            and storage_path ~ '/public/'
          )
        )
    )
  );

create policy calls_select on public.call_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = auth.uid())
        )
    )
  );

create policy calls_insert on public.call_sessions
  for insert to authenticated
  with check (
    started_by = auth.uid()
    and recording_path is null
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = auth.uid())
        )
    )
  );

create policy calls_update on public.call_sessions
  for update to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          public.app_actor_role() in ('it', 'admin')
          or (public.app_actor_role() = 'karyawan' and t.requester_id = auth.uid())
        )
    )
  )
  with check (recording_path is null);

create policy metrics_select on public.ticket_metrics_monthly
  for select to authenticated
  using (public.app_actor_role() in ('it', 'atasan', 'admin'));

create policy audit_select on public.audit_events
  for select to authenticated
  using (public.app_actor_role() in ('it', 'admin'));

insert into storage.buckets (id, name, public)
values ('ticket-files', 'ticket-files', false)
on conflict (id) do update set public = false;

-- storage.objects dimiliki supabase_storage_admin: ALTER kepadanya gagal di
-- projek awan (postgres bukan pemilik). RLS table ini diaktifkan oleh Supabase
-- di setiap projek, jadi lakukan ALTER hanya bila belum aktif.
do $$
begin
  if not exists (
    select 1
    from pg_class c
    where c.relnamespace = 'storage'::regnamespace
      and c.relname = 'objects'
      and c.relrowsecurity
  ) then
    alter table storage.objects enable row level security;
  end if;
end $$;

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
            and (storage.foldername(name))[2] = 'public'
          )
        )
    )
  );

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
            and (storage.foldername(name))[2] = 'public'
          )
        )
    )
  );
