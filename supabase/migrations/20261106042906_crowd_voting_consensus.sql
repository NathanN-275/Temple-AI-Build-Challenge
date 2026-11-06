alter table public.crowd_reports add column voter_id uuid;
grant insert (voter_id) on public.crowd_reports to anon;

drop policy "Anyone can submit crowd reports" on public.crowd_reports;
create policy "Anyone can submit crowd votes"
  on public.crowd_reports for insert to anon
  with check (voter_id is not null and expires_at > statement_timestamp());

create index crowd_reports_voting_window_idx
  on public.crowd_reports (created_at desc) where voter_id is not null;

create function public.get_crowd_consensus()
returns table (
  spot_key text, floor_key text, busyness smallint, vote_count bigint,
  updated_at timestamptz, valid_until timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  with latest_votes as (
    select distinct on (r.spot_key, r.floor_key, r.voter_id)
      r.spot_key, r.floor_key, r.voter_id, r.busyness, r.created_at
    from public.crowd_reports r
    where r.voter_id is not null
      and r.created_at > now() - interval '1 hour'
      and r.created_at <= now()
      and r.expires_at > now()
    order by r.spot_key, r.floor_key, r.voter_id, r.created_at desc, r.id desc
  )
  select v.spot_key::text, v.floor_key::text,
    case when count(*) >= 3 then
      round((percentile_cont(0.5) within group (order by v.busyness))::numeric)::smallint
    else null end,
    count(*), max(v.created_at), min(v.created_at) + interval '1 hour'
  from latest_votes v
  group by v.spot_key, v.floor_key;
$$;

revoke all on function public.get_crowd_consensus() from public, anon, authenticated;
grant execute on function public.get_crowd_consensus() to anon;
