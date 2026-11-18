// Semua operasi admin tetap dilakukan di server, melalui pemeriksaan identitas.
export function createHandler(env: {url:string; serviceKey:string}, request: typeof fetch = fetch) {
 const cors={'Access-Control-Allow-Origin':'https://vigufarm-web.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 const ah={apikey:env.serviceKey,Authorization:`Bearer ${env.serviceKey}`,'Content-Type':'application/json'};
 const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
 const validUsername=(v:unknown)=>typeof v==='string'&&/^[a-z0-9][a-z0-9._-]{2,29}$/.test(v);
 const validPin=(v:unknown)=>typeof v==='string'&&/^[0-9]{6,16}$/.test(v);
 return async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply(405,{error:'Metode tidak didukung.'});
  if(!env.url||!env.serviceKey)return reply(503,{error:'Server belum siap.'});
  const auth=req.headers.get('Authorization')||'';if(!/^Bearer\s+\S+$/i.test(auth))return reply(401,{error:'Silakan masuk kembali.'});
  try{
   const ar=await request(env.url+'/auth/v1/user',{headers:{apikey:env.serviceKey,Authorization:auth}});if(!ar.ok)return reply(401,{error:'Sesi tidak berlaku.'});
   const actor=await ar.json();if(!uuid(actor.id))return reply(401,{error:'Sesi tidak valid.'});
   const mr=await request(env.url+'/rest/v1/marking_members?select=user_id,role,active&user_id=eq.'+encodeURIComponent(actor.id),{headers:ah});if(!mr.ok)return reply(503,{error:'Tidak dapat memeriksa akses.'});
   const ms=await mr.json();if(ms.length!==1||!ms[0].active)return reply(403,{error:'Akun tidak aktif.'});
   const input=await req.json(),action=String(input.action||'');
   if(action==='change_self'){
    const next=String(input.username||'').trim().toLowerCase(),old=String(input.currentPin||''),nextPin=String(input.newPin||'');
    if(!validUsername(next)||!old||!validPin(nextPin))return reply(400,{error:'Isi username, PIN lama dan PIN baru (6–16 angka).'});
    if(typeof actor.email!=='string')return reply(400,{error:'Identitas akun tidak tersedia.'});
    const currentPassword=actor.email.endsWith('@marking.vigufarm.invalid')?'Marking-'+old:old;
    const verify=await request(env.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:ah,body:JSON.stringify({email:actor.email,password:currentPassword})});
    if(!verify.ok)return reply(403,{error:'PIN atau password lama salah.'});
    const updated=await request(env.url+'/auth/v1/admin/users/'+actor.id,{method:'PUT',headers:ah,body:JSON.stringify({email:next+'@marking.vigufarm.invalid',email_confirm:true,password:'Marking-'+nextPin})});
    if(!updated.ok)return reply(409,{error:'Username sudah dipakai atau perubahan ditolak.'});return reply(200,{ok:true,username:next});
   }
   if(ms[0].role!=='admin')return reply(403,{error:'Hanya admin dapat mengelola akun.'});
   if(action==='create'){
    const name=String(input.name||'').trim().replace(/\s+/g,' '),user=String(input.username||'').trim().toLowerCase(),password=String(input.pin||''),access=String(input.access||'');
    const choices:Record<string,{role:string;job:string;report_access:boolean;map_access:boolean}>={
     sensus:{role:'petugas',job:'sensus',report_access:false,map_access:false},
     panen:{role:'petugas',job:'panen',report_access:false,map_access:false},
     pemantau:{role:'petugas',job:'panen',report_access:true,map_access:false},
     gis:{role:'petugas',job:'panen',report_access:true,map_access:true},
     admin:{role:'admin',job:'sensus',report_access:true,map_access:true}
    };
    if(!name||name.length>80||!validUsername(user)||!validPin(password)||!Object.hasOwn(choices,access))return reply(400,{error:'Periksa nama, username, PIN dan hak akses.'});
    const created=await request(env.url+'/auth/v1/admin/users',{method:'POST',headers:ah,body:JSON.stringify({email:user+'@marking.vigufarm.invalid',password:'Marking-'+password,email_confirm:true,user_metadata:{display_name:name}})});
    if(!created.ok)return reply(409,{error:'Username sudah dipakai atau akun tidak dapat dibuat.'});const account=await created.json();if(!uuid(account.id))return reply(502,{error:'Identitas akun belum dapat dipastikan.'});
    const add=await request(env.url+'/rest/v1/marking_members',{method:'POST',headers:{...ah,Prefer:'return=minimal'},body:JSON.stringify({user_id:account.id,display_name:name,active:true,...choices[access]})});
    if(!add.ok){const rollback=await request(env.url+'/auth/v1/admin/users/'+account.id,{method:'DELETE',headers:ah});return reply(503,{error:rollback.ok?'Akun belum dibuat; coba lagi.':'Hak gagal disimpan. Periksa akun di Supabase.'});}
    return reply(201,{ok:true,name,username:user,access});
   }
   if(action==='list'){
    const list=await request(env.url+'/rest/v1/marking_members?select=user_id,display_name,role,job,active&order=display_name.asc',{headers:ah});if(!list.ok)return reply(503,{error:'Daftar akun belum tersedia.'});const members=await list.json(),results=[];
    for(const m of members){if(!uuid(m.user_id))continue;const res=await request(env.url+'/auth/v1/admin/users/'+m.user_id,{headers:ah});if(!res.ok)return reply(503,{error:'Identitas akun belum tersedia.'});const u=await res.json(),email=String(u.email||'');results.push({id:m.user_id,name:m.display_name,role:m.role,job:m.job,active:m.active===true,username:email.endsWith('@marking.vigufarm.invalid')?email.split('@')[0]:email});}return reply(200,{users:results});
   }
   const id=input.userId;if(!uuid(id)||id===actor.id)return reply(400,{error:'Pilih akun petugas lain.'});
   const tr=await request(env.url+'/rest/v1/marking_members?select=user_id,role,active&user_id=eq.'+encodeURIComponent(id),{headers:ah});if(!tr.ok)return reply(503,{error:'Akun tidak dapat diperiksa.'});const targets=await tr.json();if(targets.length!==1||targets[0].role==='admin')return reply(403,{error:'Hanya akun petugas dapat dikelola dari menu ini.'});
   if(action==='rename'){
    const name=String(input.username||'').trim().toLowerCase();if(!validUsername(name))return reply(400,{error:'Username 3–30 karakter huruf, angka, titik, garis bawah atau strip.'});
    const result=await request(env.url+'/auth/v1/admin/users/'+id,{method:'PUT',headers:ah,body:JSON.stringify({email:name+'@marking.vigufarm.invalid',email_confirm:true})});if(!result.ok)return reply(409,{error:'Username sudah dipakai atau perubahan ditolak.'});return reply(200,{ok:true,username:name});
   }
   if(action==='disable'){
    const r=await request(env.url+'/rest/v1/marking_members?user_id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{...ah,Prefer:'return=representation'},body:JSON.stringify({active:false})});if(!r.ok||(await r.json()).length!==1)return reply(503,{error:'Akun belum berhasil dinonaktifkan.'});return reply(200,{ok:true,active:false});
   }
   if(action==='activate_reset'){
    if(targets[0].active)return reply(400,{error:'Nonaktifkan akun dahulu sebelum membuat PIN baru.'});const buf=new Uint32Array(1);crypto.getRandomValues(buf);const nextPin=String(buf[0]%100000000).padStart(8,'0');
    const reset=await request(env.url+'/auth/v1/admin/users/'+id,{method:'PUT',headers:ah,body:JSON.stringify({password:'Marking-'+nextPin})});if(!reset.ok)return reply(503,{error:'PIN belum berhasil direset; akun tetap nonaktif.'});
    const r=await request(env.url+'/rest/v1/marking_members?user_id=eq.'+encodeURIComponent(id)+'&active=eq.false',{method:'PATCH',headers:{...ah,Prefer:'return=representation'},body:JSON.stringify({active:true})});if(!r.ok||(await r.json()).length!==1)return reply(503,{error:'PIN berubah tetapi akun tetap nonaktif. Coba aktifkan ulang untuk membuat PIN baru.'});return reply(200,{ok:true,active:true,pin:nextPin});
   }
   return reply(400,{error:'Tindakan tidak dikenali.'});
  }catch{return reply(503,{error:'Permintaan belum dapat diselesaikan; periksa kembali status akun.'});}
 };
}
if(typeof Deno!=='undefined')Deno.serve(createHandler({url:Deno.env.get('SUPABASE_URL')||'',serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}));
