-- Hanya layanan server yang dapat memanggil; riwayat titik tetap disimpan.
create or replace function public.marking_delete_account(actor_id uuid,target_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare target_role text;
begin
  perform pg_advisory_xact_lock(72174821);
  if actor_id=target_id or not exists(select 1 from public.marking_members where user_id=actor_id and role='admin' and active) then
    raise exception 'Akses ditolak';
  end if;
  select role into target_role from public.marking_members where user_id=target_id;
  if target_role is null then raise exception 'Akun tidak ditemukan'; end if;
  if target_role='admin' and (select count(*) from public.marking_members where role='admin' and active)<=1 then
    raise exception 'Admin terakhir tidak dapat dihapus';
  end if;
  delete from auth.users where id=target_id;
  return found;
end $$;
revoke all on function public.marking_delete_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.marking_delete_account(uuid,uuid) to service_role;
