-- Ganti UUID_ADMIN_MARKING dengan UUID akun admin yang sudah terdaftar sebagai anggota.
-- Jalankan sekali pada proyek baru. Jangan menambahkan policy untuk anon.
create table public.marking_boundaries (
 id text primary key check (id='active'), version uuid not null,
 geojson jsonb not null, source text not null,
 updated_at timestamptz not null default now(),
 check (geojson->>'type'='FeatureCollection')
);
alter table public.marking_boundaries enable row level security;
revoke all on public.marking_boundaries from anon, authenticated;
grant select, insert, update on public.marking_boundaries to authenticated;
create policy boundary_read on public.marking_boundaries for select to authenticated
 using (exists (select 1 from public.marking_members where user_id=auth.uid()));
create policy boundary_insert on public.marking_boundaries for insert to authenticated
 with check (auth.uid()='UUID_ADMIN_MARKING'::uuid and exists (select 1 from public.marking_members where user_id=auth.uid()));
create policy boundary_update on public.marking_boundaries for update to authenticated
 using (auth.uid()='UUID_ADMIN_MARKING'::uuid and exists (select 1 from public.marking_members where user_id=auth.uid()))
 with check (auth.uid()='UUID_ADMIN_MARKING'::uuid and exists (select 1 from public.marking_members where user_id=auth.uid()));
