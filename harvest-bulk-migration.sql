-- Menandai titik terpilih dipanen secara atomik; data awal tetap utuh.
alter table public.marking_members add column if not exists harvest_access boolean not null default false;

create or replace function public.marking_harvest_bulk(p_block text,p_color text,p_expected uuid[])
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor_name text; current_ids uuid[]; expected_ids uuid[]; item record; new_id uuid; today text;
begin
  select display_name into actor_name from public.marking_members
    where user_id=auth.uid() and active and (role='admin' or harvest_access);
  if actor_name is null then raise exception 'Tidak memiliki hak mencatat panen' using errcode='42501'; end if;
  if p_block is null or p_color is null or
     p_color not in ('','BK','GN','YW','WE','RD','PE','PK','OE','BN','TA') or
     p_expected is null or cardinality(p_expected)=0 then raise exception 'Pilihan panen tidak valid'; end if;
  today:=to_char(now() at time zone 'Asia/Jakarta','YYYY-MM-DD');
  -- Snapshot dan penulisan dikunci bersama agar data tidak tertimpa bersamaan.
  lock table public.marking_events in share row exclusive mode;
  select array_agg(x.id order by x.id) into current_ids from (
    select distinct on (e.payload->>'pointId') e.id,e.payload from public.marking_events e
    where e.payload->>'date'<=today
    order by e.payload->>'pointId',e.payload->>'date' desc,e.payload->>'recordedAt' desc,e.id desc
  ) x where x.payload->>'status'='active'
    and (p_color='' or x.payload->>'color'=p_color)
    and (p_block='' or (p_block='__unknown__' and nullif(btrim(x.payload->>'block'),'') is null) or x.payload->>'block'=p_block);
  select array_agg(x order by x) into expected_ids from unnest(p_expected) x;
  if current_ids is distinct from expected_ids then raise exception 'Data berubah. Sinkronkan dan periksa lagi.'; end if;
  for item in select e.id,e.payload from public.marking_events e where e.id=any(current_ids)
  loop
    new_id:=gen_random_uuid();
    insert into public.marking_events(id,payload) values(new_id,item.payload || jsonb_build_object(
      'id',new_id::text,'date',today,'recordedAt',to_char(greatest(clock_timestamp(),(item.payload->>'recordedAt')::timestamptz + interval '1 millisecond') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'officer',actor_name,'createdBy',auth.uid()::text,'status','harvested','eventKind','harvested','previousEventId',item.id::text));
  end loop;
  return jsonb_build_object('count',cardinality(current_ids));
end $$;
revoke all on function public.marking_harvest_bulk(text,text,uuid[]) from public,anon;
grant execute on function public.marking_harvest_bulk(text,text,uuid[]) to authenticated;
