-- Run against a migrated database. Every fixture is rolled back.
begin;

with votes(floor_key, voter, rating, age_minutes) as (
  values
    ('single', 1, 5, 0),
    ('two', 1, 2, 0), ('two', 2, 5, 0),
    ('outlier', 1, 2, 0), ('outlier', 2, 2, 0), ('outlier', 3, 5, 0),
    ('repeat', 1, 5, 15), ('repeat', 1, 1, 1), ('repeat', 2, 2, 0), ('repeat', 3, 2, 0),
    ('window', 1, 5, 61), ('window', 2, 5, 60), ('window', 3, 2, 0),
    ('even', 1, 2, 0), ('even', 2, 2, 0), ('even', 3, 3, 0), ('even', 4, 5, 0),
    ('legacy', null, 5, 0), ('legacy', null, 5, 0), ('legacy', null, 5, 0), ('legacy', 1, 2, 0)
)
insert into public.crowd_reports (spot_key, floor_key, voter_id, busyness, created_at)
select '__voting_regression__', floor_key, md5(voter::text)::uuid, rating,
  now() - make_interval(mins => age_minutes)
from votes;

set local role anon;
do $$
declare
  summary record;
begin
  for summary in select * from public.get_crowd_consensus() where spot_key = '__voting_regression__'
  loop
    case summary.floor_key
      when 'single' then assert summary.vote_count = 1 and summary.busyness is null, 'Single vote must not set status';
      when 'two' then assert summary.vote_count = 2 and summary.busyness is null, 'Two votes must not set status';
      when 'outlier' then assert summary.vote_count = 3 and summary.busyness = 2, 'Outlier must not override median';
      when 'repeat' then assert summary.vote_count = 3 and summary.busyness = 2, 'Only the latest vote per browser counts';
      when 'window' then assert summary.vote_count = 1 and summary.busyness is null, 'Votes at or beyond one hour must not count';
      when 'even' then assert summary.vote_count = 4 and summary.busyness = 3, 'Half-point median must round toward busier';
      when 'legacy' then assert summary.vote_count = 1 and summary.busyness is null, 'Legacy reports cannot establish voter identity';
      else raise exception 'Unexpected floor';
    end case;
    assert summary.valid_until <= now() + interval '1 hour', 'Consensus expiry must follow eligible votes';
  end loop;
  assert (select count(*) from public.get_crowd_consensus() where spot_key = '__voting_regression__') = 7, 'Expected all fixture floors';
  assert not has_table_privilege('anon', 'public.crowd_reports', 'UPDATE'), 'Visitors cannot edit history';
  assert not has_table_privilege('anon', 'public.crowd_reports', 'DELETE'), 'Visitors cannot delete history';
  begin
    insert into public.crowd_reports (spot_key, floor_key, busyness) values ('__voting_regression__', 'missing-id', 3);
    raise exception 'Missing browser identity should be rejected';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select 'Crowd voting checks passed' as result;
rollback;
