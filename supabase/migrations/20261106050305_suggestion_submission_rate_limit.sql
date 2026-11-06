create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.suggestion_rate_limit_config (
  singleton boolean primary key default true check (singleton),
  salt uuid not null default gen_random_uuid()
);
insert into private.suggestion_rate_limit_config (singleton) values (true);

create table private.suggestion_submission_events (
  suggestion_id uuid primary key,
  ip_hash text not null,
  submitted_at timestamptz not null default clock_timestamp()
);
create index suggestion_submission_events_lookup_idx
  on private.suggestion_submission_events (ip_hash, submitted_at);
alter table private.suggestion_rate_limit_config enable row level security;
alter table private.suggestion_submission_events enable row level security;
revoke all on private.suggestion_rate_limit_config, private.suggestion_submission_events
  from public, anon, authenticated;

-- A private trigger needs owner privileges to access the non-public limiter tables.
create function private.enforce_suggestion_rate_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  client_ip inet;
  request_headers jsonb;
  client_hash text;
  window_now timestamptz;
  submissions integer;
  oldest_submission timestamptz;
  retry_seconds integer;
begin
  -- Administrative database writes are not visitor submissions.
  if current_setting('role', true) not in ('anon', 'authenticated') then
    return new;
  end if;

  request_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  begin
    client_ip := nullif(btrim(split_part(request_headers->>'x-forwarded-for', ',', 1)), '')::inet;
  exception when invalid_text_representation then
    raise sqlstate 'PT503' using message = 'Could not verify your network. Please try again later.';
  end;
  if client_ip is null then
    raise sqlstate 'PT503' using message = 'Could not verify your network. Please try again later.';
  end if;

  select encode(sha256(convert_to(host(client_ip) || c.salt::text, 'UTF8')), 'hex')
    into client_hash from private.suggestion_rate_limit_config c where c.singleton;
  perform pg_advisory_xact_lock(hashtextextended(client_hash, 0));
  window_now := clock_timestamp();
  select count(*), min(e.submitted_at) into submissions, oldest_submission
    from private.suggestion_submission_events e
    where e.ip_hash = client_hash and e.submitted_at > window_now - interval '15 minutes';

  if submissions >= 3 then
    retry_seconds := greatest(1, ceil(extract(epoch from oldest_submission + interval '15 minutes' - window_now))::integer);
    raise sqlstate 'PT429' using
      message = 'Suggestion limit reached. Please wait before sharing another spot.',
      detail = retry_seconds::text;
  end if;

  insert into private.suggestion_submission_events (suggestion_id, ip_hash, submitted_at)
    values (new.id, client_hash, window_now);
  return new;
end;
$$;
revoke all on function private.enforce_suggestion_rate_limit() from public, anon, authenticated;
create trigger enforce_suggestion_rate_limit
  before insert on public.community_suggestions
  for each row execute function private.enforce_suggestion_rate_limit();

select cron.schedule(
  'hootroute-purge-suggestion-rate-events', '0 * * * *',
  $purge$delete from private.suggestion_submission_events where submitted_at <= now() - interval '24 hours';$purge$
);
