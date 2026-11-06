-- All fixtures and limiter events are rolled back.
begin;
set local role anon;
select set_config('request.headers', '{"cf-connecting-ip":"192.0.2.10"}', true);
do $$
declare wait_seconds text;
begin
  for i in 1..3 loop
    insert into public.community_suggestions (name, building)
      values ('__rate_limit_test__' || i, 'Test Hall');
  end loop;
  perform set_config('request.headers', '{"cf-connecting-ip":"192.0.2.10","x-forwarded-for":"198.51.100.55"}', true);
  begin
    insert into public.community_suggestions (name, building) values ('__rate_limit_test__blocked', 'Test Hall');
    raise exception 'Fourth submission should be rejected';
  exception when sqlstate 'PT429' then
    get stacked diagnostics wait_seconds = pg_exception_detail;
    assert wait_seconds::integer between 1 and 900, 'Retry time must be within the window';
  end;
  begin
    perform * from private.suggestion_submission_events;
    raise exception 'Visitors must not read limiter data';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.headers', '{"cf-connecting-ip":"192.0.2.11"}', true);
  begin
    insert into public.community_suggestions (name, building) values ('', 'Test Hall');
    raise exception 'Invalid suggestion should be rejected';
  exception when check_violation then null;
  end;
  for i in 1..3 loop
    insert into public.community_suggestions (name, building)
      values ('__rate_limit_test__other' || i, 'Test Hall');
  end loop;

  perform set_config('request.headers', '{}', true);
  begin
    insert into public.community_suggestions (name, building) values ('__rate_limit_test__missing', 'Test Hall');
    raise exception 'Missing IP must fail closed';
  exception when sqlstate 'PT503' then null;
  end;
  perform set_config('request.headers', '{"cf-connecting-ip":"invalid"}', true);
  begin
    insert into public.community_suggestions (name, building) values ('__rate_limit_test__invalid', 'Test Hall');
    raise exception 'Invalid IP must fail closed';
  exception when sqlstate 'PT503' then null;
  end;
end;
$$;
reset role;
update private.suggestion_submission_events set submitted_at = now() - interval '16 minutes'
  where suggestion_id in (select id from public.community_suggestions where name = '__rate_limit_test__1');
set local role anon;
select set_config('request.headers', '{"cf-connecting-ip":"192.0.2.10"}', true);
insert into public.community_suggestions (name, building) values ('__rate_limit_test__after-window', 'Test Hall');
select 'Suggestion rate-limit checks passed' as result;
rollback;
