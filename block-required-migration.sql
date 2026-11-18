alter policy marking_insert on public.marking_events with check (
 nullif(btrim(payload->>'block'),'') is not null and payload->>'createdBy'=auth.uid()::text and exists (
  select 1 from public.marking_members m where m.user_id=auth.uid() and m.display_name=payload->>'officer'
  and (m.role='admin' or (m.job='sensus' and payload->>'status'='active'))
 )
);
