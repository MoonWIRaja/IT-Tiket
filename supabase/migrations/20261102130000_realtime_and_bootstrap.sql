-- Additive follow-up to the canonical access-control model (20261102120000).
-- Supabase realtime streaming + one-time admin bootstrap.
-- Does not touch tables, policies or triggers from the canonical migration.

-- =========================================================================
-- Realtime publication (broadcast/downstream postgres_changes)
-- Subscribers are filtered by RLS: users only receive rows they may read.
-- =========================================================================

do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.ticket_messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.call_sessions;
exception when duplicate_object then null; end $$;

-- =========================================================================
-- One-time bootstrap: the very first admin.
-- Their admin_set_role() requires an existing admin, so this starts the
-- chain. Runs only while zero admins exist; every later role change goes
-- through admin_set_role() / admin_set_active() and is audited.
-- =========================================================================

create or replace function public.promote_first_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_target uuid;
begin
  if (select count(*) from public.profiles where role = 'admin' and active) > 0 then
    raise exception 'admin already exists; use admin_set_role and the audit trail';
  end if;

  select u.id into v_target
    from auth.users u
   where lower(u.email) = lower(p_email)
   limit 1;

  if v_target is null then
    raise exception 'no auth user with that email; sign up first';
  end if;

  update public.profiles set role = 'admin' where id = v_target;

  perform public.write_audit(
    auth.uid(), 'promote_first_admin', 'profiles', v_target,
    jsonb_build_object('role', 'admin')
  );
end;
$$;

revoke all on function public.promote_first_admin(text) from public, anon;
grant execute on function public.promote_first_admin(text) to authenticated, service_role;
