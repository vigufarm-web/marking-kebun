-- Hak membaca rekap dan mengunduhnya tidak memberi hak menulis titik.
alter table public.marking_members
  add column if not exists report_access boolean not null default false;
