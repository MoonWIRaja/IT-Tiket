-- Safe first-admin bootstrap for the web setup wizard.
create or replace function public.setup_is_available()
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where role = 'admin' and active);
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
  -- Serialize concurrent setup attempts and recheck inside the lock.
  perform pg_advisory_xact_lock(hashtext('public.promote_first_admin'));
  if exists (select 1 from public.profiles where role = 'admin' and active) then
    raise exception 'admin already exists';
  end if;
  update public.profiles set role = 'admin' where id = v_user and active;
  if not found then raise exception 'active profile required'; end if;
  perform public.write_audit(v_user, 'promote_first_admin', 'profiles', v_user,
    jsonb_build_object('role', 'admin'));
end;
$$;

revoke all on function public.setup_is_available() from public, anon;
grant execute on function public.setup_is_available() to anon, authenticated;
revoke all on function public.promote_first_admin() from public, anon;
grant execute on function public.promote_first_admin() to authenticated;
revoke all on function public.promote_first_admin(text) from public, anon, authenticated;
