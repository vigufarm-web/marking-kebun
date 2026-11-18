-- A sent point is immutable for census workers. Administrators can append corrections.
-- This helper runs with the table owner's read privileges so the check cannot be
-- bypassed by hiding existing rows with row-level security.
create or replace function public.marking_point_is_new(point_id text)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select not exists (select 1 from public.marking_events e where e.payload->>'pointId' = point_id) $$;
revoke all on function public.marking_point_is_new(text) from public, anon;
grant execute on function public.marking_point_is_new(text) to authenticated;

alter policy marking_insert on public.marking_events with check (
 (nullif(btrim(payload->>'block'),'') is not null or
  (payload->>'eventKind'='deleted' and payload->>'status'='harvested'
   and not public.marking_point_is_new(payload->>'pointId')))
 and payload->>'createdBy' = auth.uid()::text
 and exists (select 1 from public.marking_members m
   where m.user_id=auth.uid() and m.display_name=payload->>'officer'
   and (m.role='admin' or (m.job='sensus' and payload->>'status'='active'
        and public.marking_point_is_new(payload->>'pointId'))))
);
