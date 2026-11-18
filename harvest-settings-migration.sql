begin;
create table if not exists public.marking_harvest_settings (
 id boolean primary key default true check (id),
 colors text[] not null default '{}' check (colors <@ array['BK','GN','YW','WE','RD','PE','PK','OE','BN','TA']::text[]),
 version uuid not null default gen_random_uuid()
);
alter table public.marking_harvest_settings enable row level security;
revoke all on public.marking_harvest_settings from anon, authenticated;
grant select,update on public.marking_harvest_settings to authenticated;
create policy harvest_read on public.marking_harvest_settings for select to authenticated using (exists(select 1 from public.marking_members where user_id=auth.uid()));
create policy harvest_update on public.marking_harvest_settings for update to authenticated using (exists(select 1 from public.marking_members where user_id=auth.uid() and role='admin')) with check (exists(select 1 from public.marking_members where user_id=auth.uid() and role='admin'));
insert into public.marking_harvest_settings (id) values (true) on conflict do nothing;
commit;
