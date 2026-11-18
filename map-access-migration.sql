-- Hak GIS terpisah dari hak admin dan hak mengubah titik sensus.
alter table public.marking_members add column if not exists map_access boolean not null default false;
alter policy boundary_insert on public.marking_boundaries with check (
  exists (select 1 from public.marking_members m where m.user_id=auth.uid() and (m.role='admin' or m.map_access))
);
alter policy boundary_update on public.marking_boundaries using (
  exists (select 1 from public.marking_members m where m.user_id=auth.uid() and (m.role='admin' or m.map_access))
) with check (
  exists (select 1 from public.marking_members m where m.user_id=auth.uid() and (m.role='admin' or m.map_access))
);
