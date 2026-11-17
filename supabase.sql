-- Jalankan pada project Supabase khusus Marking Kebun setelah menonaktifkan
-- pendaftaran publik dan membuat akun petugas melalui dashboard Auth.
create table if not exists public.marking_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  role text not null default 'petugas' check (role in ('admin','petugas'))
);
alter table public.marking_members enable row level security;
revoke all on public.marking_members from anon, authenticated;
grant select on public.marking_members to authenticated;
drop policy if exists marking_members_self on public.marking_members;
create policy marking_members_self on public.marking_members for select to authenticated using (user_id = auth.uid());

create table if not exists public.marking_events (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint marking_event_identity check (payload->>'id' = id::text),
  constraint marking_event_fields check (
    payload ?& array['id','pointId','date','recordedAt','officer','lat','lng','color','status']
    and payload->>'color' in ('BK','GN','YW','WE','RD','PE','PK','OE','BN','TA')
    and payload->>'status' in ('active','harvested')
    and jsonb_typeof(payload->'lat')='number' and jsonb_typeof(payload->'lng')='number'
  )
);
alter table public.marking_events enable row level security;
revoke all on public.marking_events from anon, authenticated;
grant select, insert on public.marking_events to authenticated;
drop policy if exists marking_read on public.marking_events;
create policy marking_read on public.marking_events for select to authenticated using (exists (select 1 from public.marking_members where user_id = auth.uid()));
drop policy if exists marking_insert on public.marking_events;
create policy marking_insert on public.marking_events for insert to authenticated with check (
  payload->>'createdBy' = auth.uid()::text and exists (
    select 1 from public.marking_members where user_id = auth.uid() and display_name = payload->>'officer'
  )
);
