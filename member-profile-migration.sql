-- Untuk proyek Marking yang sudah memiliki tabel dan satu admin awal.
-- Ganti UUID_ADMIN_MARKING dan NAMA_ADMIN dengan data yang benar sebelum menjalankan.
begin;
alter table public.marking_members add column if not exists display_name text;
alter table public.marking_members add column if not exists role text not null default 'petugas';
update public.marking_members set display_name='NAMA_ADMIN', role='admin' where user_id='UUID_ADMIN_MARKING'::uuid;
commit;
-- Setelah aplikasi baru aktif, perketat policy agar nama dan ID tidak bisa dipalsukan.
alter policy marking_insert on public.marking_events with check (
  payload->>'createdBy'=auth.uid()::text and exists (
    select 1 from public.marking_members where user_id=auth.uid() and display_name=payload->>'officer'
  )
);
