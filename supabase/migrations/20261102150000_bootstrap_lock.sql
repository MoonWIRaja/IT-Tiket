-- Close first-admin bootstrap permanently once any admin profile exists.
-- An inactive admin must not reopen the public wizard.
-- Deactivating the last active admin is refused so the project cannot lock itself out.

create or replace function public.setup_is_available()
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where role = 'admin');
$$;

create or replace function public.promote_first_admin()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext('public.promote_first_admin'));
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'admin already exists';
  end if;
  update public.profiles set role = 'admin' where id = v_user and active;
  if not found then raise exception 'active profile required'; end if;
  perform public.write_audit(v_user, 'promote_first_admin', 'profiles', v_user,
    jsonb_build_object('role', 'admin'));
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
  if is_active = false
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and active and id <> target
     )
     and exists (
       select 1 from public.profiles
       where id = target and role = 'admin' and active
     )
  then
    raise exception 'last admin';
  end if;
  update public.profiles set active = is_active where id = target;
  if not found then raise exception 'active update failed'; end if;
  perform public.write_audit(auth.uid(), 'set_active', 'profiles', target,
    jsonb_build_object('active', is_active));
end;
$$;

revoke all on function public.setup_is_available() from public;
grant execute on function public.setup_is_available() to anon, authenticated;
revoke all on function public.promote_first_admin() from public, anon;
grant execute on function public.promote_first_admin() to authenticated;
revoke all on function public.promote_first_admin(text) from public, anon, authenticated;
revoke all on function public.admin_set_active(uuid, boolean) from public;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;
