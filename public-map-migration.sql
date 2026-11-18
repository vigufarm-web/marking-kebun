-- Public map only: no names, account IDs, timestamps, or private raw records.
begin;
create or replace view public.marking_public_map with (security_barrier=true,security_invoker=false) as
select b.version, jsonb_build_object('type','FeatureCollection','features',coalesce((select jsonb_agg(jsonb_build_object('type','Feature','geometry',f->'geometry','properties',jsonb_build_object('nama_blok',coalesce(f->'properties'->>'Nama_Blok',f->'properties'->>'NAMA_BLOK',f->'properties'->>'nama_blok',f->'properties'->>'BLOK',f->'properties'->>'Blok',f->'properties'->>'blok',f->'properties'->>'name',f->'properties'->>'Nama','')))) from jsonb_array_elements(b.geojson->'features') f),'[]'::jsonb)) as geojson
from public.marking_boundaries b where b.id='active';
create or replace view public.marking_public_points with (security_barrier=true,security_invoker=false) as
select (x.payload->>'lat')::double precision as lat,(x.payload->>'lng')::double precision as lng,x.payload->>'color' as color
from (select distinct on (payload->>'pointId') payload,id from public.marking_events where payload->>'date' <= to_char((now() at time zone 'Asia/Jakarta')::date,'YYYY-MM-DD') order by payload->>'pointId',payload->>'date' desc,payload->>'recordedAt' desc,id desc) x
where x.payload->>'status'='active';
revoke all on public.marking_public_map,public.marking_public_points from public,anon,authenticated;
grant select on public.marking_public_map,public.marking_public_points to anon,authenticated;
commit;
