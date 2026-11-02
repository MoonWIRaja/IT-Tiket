-- Reports stayed empty: PostgREST's safeupdate rejected the WHERE-less DELETE
-- in refresh_ticket_metrics(), and nothing refreshed the figures on its own.
-- Figures now update with every ticket change.

create or replace function public.recompute_ticket_metrics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Concurrent ticket writes must not collide on the month primary key.
  perform pg_advisory_xact_lock(hashtext('ticket_metrics_monthly'));
  delete from public.ticket_metrics_monthly where true;
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

revoke all on function public.recompute_ticket_metrics() from public, anon, authenticated;

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
  perform public.recompute_ticket_metrics();
end;
$$;

create or replace function public.tickets_refresh_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_ticket_metrics();
  return null;
end;
$$;

revoke all on function public.tickets_refresh_metrics() from public, anon, authenticated;

drop trigger if exists tickets_metrics on public.tickets;
create trigger tickets_metrics
  after insert or update or delete on public.tickets
  for each statement execute function public.tickets_refresh_metrics();

-- Backfill the tickets that already exist.
select public.recompute_ticket_metrics();
