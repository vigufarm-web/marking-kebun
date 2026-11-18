-- Semua kebijakan akses data memeriksa keanggotaan yang terlihat oleh pengguna.
alter table public.marking_members add column if not exists active boolean not null default true;
alter policy marking_members_self on public.marking_members using (user_id=auth.uid() and active=true);
