-- IT-Tiket core schema (backend foundation by Gos)
-- Audience: build the backend. Tables, triggers, RLS, realtime.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums (guarded so refetch is idempotent)
do $$ begin
  create type user_role        as enum ('employee','it_agent','executive','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ticket_status    as enum ('new','assigned','in_progress','waiting_user','resolved','closed','reopened');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ticket_priority  as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type message_kind     as enum ('reply','internal_note');
exception when duplicate_object then null; end $$;
do $$ begin
  create type call_status      as enum ('waiting','active','ended','missed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type event_action     as enum (
    'create','assign','priority_change','status_change','reopen','close',
    'reply','internal_note','attachment_add','call_start','call_end',
    'role_grant','role_revoke');
exception when duplicate_object then null; end $$;

-- =========================================================================
-- Tables
-- =========================================================================

-- One profile per auth user. Role drives all access.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  employee_no  text unique,
  department   text,
  role         user_role not null default 'employee',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Permissions are per-action, not hardcoded to UI roles (Kid's proposal).
create table if not exists public.role_permissions (
  role        user_role not null,
  permission  text not null,
  primary key (role, permission)
);

create table if not exists public.ticket_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_no     text not null unique,
  title         text not null,
  description   text not null default '',
  status        ticket_status not null default 'new',
  priority      ticket_priority not null default 'medium',
  category_id   uuid references public.ticket_categories(id) on delete set null,
  created_by    uuid not null references public.profiles(id) on delete restrict,
  assigned_to   uuid references public.profiles(id) on delete set null,
  sla_due_at    timestamptz,
  resolved_at   timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tickets_status_idx    on public.tickets (status);
create index if not exists tickets_created_by_idx on public.tickets (created_by);
create index if not exists tickets_assigned_to_idx on public.tickets (assigned_to);
create index if not exists tickets_updated_at_idx on public.tickets (updated_at desc);

create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete restrict,
  body        text not null,
  kind        message_kind not null default 'reply',
  created_at  timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets(id) on delete cascade,
  message_id   uuid references public.ticket_messages(id) on delete set null,
  storage_path text not null unique,          -- inside bucket 'ticket-attachments'
  filename     text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid not null references public.profiles(id) on delete restrict,
  created_at   timestamptz not null default now()
);
create index if not exists attachments_ticket_idx on public.attachments (ticket_id);

-- Append-only audit log. Deletes are not granted to normal roles.
create table if not exists public.ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      event_action not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ticket_events_ticket_idx on public.ticket_events (ticket_id, created_at);

create table if not exists public.calls (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  room_name   text not null unique,
  started_by  uuid not null references public.profiles(id) on delete restrict,
  status      call_status not null default 'waiting',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create index if not exists calls_ticket_idx on public.calls (ticket_id, started_at desc);

-- =========================================================================
-- Helpers (security definer so RLS never recurses on policy reads)
-- =========================================================================

create or replace function public.is_staff()
returns boolean language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role in ('it_agent','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role = 'admin'
  );
$$;

create or replace function public.can_view_ticket(p_ticket uuid)
returns boolean language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.tickets t
    where t.id = p_ticket
      and ( t.created_by = auth.uid()
         or t.assigned_to = auth.uid()
         or public.is_staff() )
  );
$$;

create or replace function public.can_view_ticket_path(p_name text)
returns boolean language plpgsql stable security definer
set search_path = public, auth
as $$
declare v_ticket uuid;
begin
  begin
    v_ticket := (split_part(p_name, '/', 1))::uuid;
  exception when others then
    return false;
  end;
  return public.can_view_ticket(v_ticket);
end $$;

-- Restrict helper execution: utilities for authenticated + service roles only.
revoke all on function public.is_staff()             from public, anon;
revoke all on function public.is_admin()             from public, anon;
revoke all on function public.can_view_ticket(uuid)  from public, anon;
revoke all on function public.can_view_ticket_path(text) from public, anon;
grant execute on function public.is_staff()             to authenticated, service_role;
grant execute on function public.is_admin()             to authenticated, service_role;
grant execute on function public.can_view_ticket(uuid)  to authenticated, service_role;
grant execute on function public.can_view_ticket_path(text) to authenticated, service_role;

-- =========================================================================
-- Auth + profile lifecycle
-- =========================================================================

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'pengguna'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bootstrap: the very first admin promotion, guarded (only when zero admins).
-- After that, role changes go through admin-managed flows only.
create or replace function public.promote_first_admin(p_email text)
returns boolean language plpgsql security definer
set search_path = public, auth
as $$
begin
  if (select count(*) from public.profiles where role = 'admin') > 0 then
    raise exception 'Admin already exists; use admin-managed role changes and audit.';
  end if;
  update public.profiles p
     set role = 'admin', updated_at = now()
   where exists (
     select 1 from auth.users u
     where u.id = p.id and lower(u.email) = lower(p_email)
   );
  if not found then
    raise exception 'No user with that email. Sign up first.';
  end if;
  return true;
end $$;

revoke all on function public.promote_first_admin(text) from public, anon;
grant execute on function public.promote_first_admin(text) to authenticated, service_role;

-- =========================================================================
-- Common triggers
-- =========================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists tickets_touch on public.tickets;
create trigger tickets_touch before update on public.tickets
  for each row execute function public.touch_updated_at();

-- Human readable ticket number: TT-000001
create sequence if not exists public.ticket_no_seq;

create or replace function public.gen_ticket_no()
returns trigger language plpgsql as $$
begin
  new.ticket_no := 'TT-' || lpad(nextval('public.ticket_no_seq')::text, 6, '0');
  return new;
end $$;

drop trigger if exists tickets_gen_no on public.tickets;
create trigger tickets_gen_no before insert on public.tickets
  for each row when (new.ticket_no is null)
  execute function public.gen_ticket_no();

-- created_by is immutable (post-insert), for anyone including staff.
create or replace function public.protect_ticket_creator()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable. Role/assigned assignments use assigned_to.';
  end if;
  return new;
end $$;

drop trigger if exists tickets_protect_creator on public.tickets;
create trigger tickets_protect_creator before update on public.tickets
  for each row execute function public.protect_ticket_creator();

-- =========================================================================
-- Audit trail triggers (append-only ticket_events)
-- =========================================================================

create or replace function public.audit_ticket_change()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_events (ticket_id, actor_id, action, detail)
    values (new.id, new.created_by, 'create', jsonb_build_object('title', new.title));
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.ticket_events (ticket_id, actor_id, action, detail)
      values (new.id, v_actor,
              case when new.status = 'closed' then 'close'
                   when new.status = 'reopened' then 'reopen'
                   else 'status_change' end,
              jsonb_build_object('from', old.status, 'to', new.status));
    end if;
    if new.assigned_to is distinct from old.assigned_to then
      insert into public.ticket_events (ticket_id, actor_id, action, detail)
      values (new.id, v_actor, 'assign',
              jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to));
    end if;
    if new.priority is distinct from old.priority then
      insert into public.ticket_events (ticket_id, actor_id, action, detail)
      values (new.id, v_actor, 'priority_change',
              jsonb_build_object('from', old.priority, 'to', new.priority));
    end if;
  end if;
  return null;
end $$;

drop trigger if exists tickets_audit on public.tickets;
create trigger tickets_audit after insert or update on public.tickets
  for each row execute function public.audit_ticket_change();

create or replace function public.audit_message_insert()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.ticket_events (ticket_id, actor_id, action, detail)
  values (new.ticket_id, new.author_id,
          case new.kind when 'internal_note' then 'internal_note' else 'reply' end,
          jsonb_build_object('length', length(new.body)));
  return null;
end $$;

drop trigger if exists messages_audit on public.ticket_messages;
create trigger messages_audit after insert on public.ticket_messages
  for each row execute function public.audit_message_insert();

create or replace function public.audit_call_change()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_events (ticket_id, actor_id, action, detail)
    values (new.ticket_id, new.started_by, 'call_start',
            jsonb_build_object('room', new.room_name));
  elsif tg_op = 'UPDATE' and new.status = 'ended' and old.status is distinct from 'ended' then
    insert into public.ticket_events (ticket_id, actor_id, action, detail)
    values (new.ticket_id, new.started_by, 'call_end',
            jsonb_build_object('room', new.room_name));
  end if;
  return null;
end $$;

drop trigger if exists calls_audit on public.calls;
create trigger calls_audit after insert or update on public.calls
  for each row execute function public.audit_call_change();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles          enable row level security;
alter table public.role_permissions  enable row level security;
alter table public.ticket_categories enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_messages   enable row level security;
alter table public.attachments       enable row level security;
alter table public.ticket_events     enable row level security;
alter table public.calls             enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- role_permissions: everyone authenticated reads the matrix; admin writes.
drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);

drop policy if exists role_permissions_admin on public.role_permissions for all;
create policy role_permissions_admin on public.role_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories: authenticated reads; staff manages.
drop policy if exists categories_read on public.ticket_categories;
create policy categories_read on public.ticket_categories for select to authenticated using (true);

drop policy if exists categories_staff on public.ticket_categories for all;
create policy categories_staff on public.ticket_categories for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- tickets: participants + staff read; anyone signed-in may file; staff updates.
drop policy if exists tickets_read on public.tickets;
create policy tickets_read on public.tickets for select to authenticated
  using (created_by = auth.uid() or assigned_to = auth.uid() or public.is_staff());

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists tickets_staff_update on public.tickets;
create policy tickets_staff_update on public.tickets for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ticket_messages
drop policy if exists messages_read on public.ticket_messages;
create policy messages_read on public.ticket_messages for select to authenticated
  using ( public.can_view_ticket(ticket_id)
          and ( kind = 'reply'
             or ( kind = 'internal_note' and public.is_staff() ) ));

drop policy if exists messages_insert on public.ticket_messages;
create policy messages_insert on public.ticket_messages for insert to authenticated
  with check ( author_id = auth.uid()
               and public.can_view_ticket(ticket_id)
               and ( kind = 'reply' or public.is_staff() ));

-- attachments
drop policy if exists attachments_read on public.attachments;
create policy attachments_read on public.attachments for select to authenticated
  using (public.can_view_ticket(ticket_id));

drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert on public.attachments for insert to authenticated
  with check (uploaded_by = auth.uid() and public.can_view_ticket(ticket_id));

-- ticket_events: staff/admin read (approval contents stay with staff/admin).
drop policy if exists events_read on public.ticket_events;
create policy events_read on public.ticket_events for select to authenticated
  using (public.is_staff());

-- calls: participants + staff.
drop policy if exists calls_read on public.calls;
create policy calls_read on public.calls for select to authenticated
  using (public.can_view_ticket(ticket_id));

drop policy if exists calls_participant_write on public.calls;
create policy calls_participant_write on public.calls for all to authenticated
  using (public.can_view_ticket(ticket_id))
  with check (public.can_view_ticket(ticket_id) and started_by = auth.uid());

-- =========================================================================
-- Realtime
-- =========================================================================

do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ticket_messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.calls;
exception when duplicate_object then null; end $$;
