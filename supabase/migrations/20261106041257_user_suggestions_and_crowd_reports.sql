create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.community_suggestions (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null check (length(btrim(name)) > 0),
  building varchar(80) not null check (length(btrim(building)) > 0),
  floor_label varchar(30) not null default '',
  amenities text[] not null default '{}',
  details varchar(180) not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check (amenities <@ array['outlets', 'computers', 'whiteboards', 'books', 'games', 'food']::text[])
);

create table if not exists public.crowd_reports (
  id uuid primary key default gen_random_uuid(),
  spot_key varchar(100) not null check (length(btrim(spot_key)) > 0),
  floor_key varchar(100) not null check (length(btrim(floor_key)) > 0),
  busyness smallint not null check (busyness between 1 and 5),
  note varchar(100) not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists crowd_reports_latest_idx
  on public.crowd_reports (spot_key, floor_key, created_at desc);
create index if not exists community_suggestions_expiry_idx
  on public.community_suggestions (expires_at);
create index if not exists crowd_reports_expiry_idx
  on public.crowd_reports (expires_at);

alter table public.community_suggestions enable row level security;
alter table public.crowd_reports enable row level security;

revoke all on public.community_suggestions, public.crowd_reports from anon, authenticated;
grant usage on schema public to anon;
grant select on public.community_suggestions, public.crowd_reports to anon;
grant insert (name, building, floor_label, amenities, details)
  on public.community_suggestions to anon;
grant insert (spot_key, floor_key, busyness, note)
  on public.crowd_reports to anon;

create policy "Anyone can read unexpired suggestions"
  on public.community_suggestions for select to anon
  using (expires_at > statement_timestamp());
create policy "Anyone can submit suggestions"
  on public.community_suggestions for insert to anon
  with check (expires_at > statement_timestamp());

create policy "Anyone can read unexpired crowd reports"
  on public.crowd_reports for select to anon
  using (expires_at > statement_timestamp());
create policy "Anyone can submit crowd reports"
  on public.crowd_reports for insert to anon
  with check (expires_at > statement_timestamp());

select cron.schedule(
  'hootroute-purge-expired-submissions',
  '0 * * * *',
  $purge$
    delete from public.community_suggestions where expires_at <= now();
    delete from public.crowd_reports where expires_at <= now();
  $purge$
)
where not exists (
  select 1 from cron.job where jobname = 'hootroute-purge-expired-submissions'
);
