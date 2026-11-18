begin;
revoke all on public.marking_members,public.marking_events from public,anon,authenticated;
grant select on public.marking_members to authenticated;
grant select,insert on public.marking_events to authenticated;
commit;
