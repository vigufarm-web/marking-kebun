// Deployed as a Supabase Edge Function. Never expose the service role key to clients.
export function createHandler(env: {url:string; serviceKey:string}, request: typeof fetch = fetch) {
  const origin='https://vigufarm-web.github.io';
  const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
  const adminHeaders={apikey:env.serviceKey,Authorization:`Bearer ${env.serviceKey}`,'Content-Type':'application/json'};
  return async (req:Request)=>{
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(req.method!=='POST')return reply(405,{error:'Metode tidak didukung.'});
    if(!env.url||!env.serviceKey)return reply(503,{error:'Pengaturan server belum lengkap.'});
    const bearer=req.headers.get('Authorization')||'';
    if(!/^Bearer\s+\S+$/i.test(bearer))return reply(401,{error:'Silakan masuk kembali.'});
    try{
      const user=await request(`${env.url}/auth/v1/user`,{headers:{apikey:env.serviceKey,Authorization:bearer}});
      if(!user.ok)return reply(401,{error:'Sesi tidak berlaku. Masuk kembali.'});
      const actor=await user.json();
      if(!actor.id||!/^[0-9a-f-]{36}$/i.test(actor.id))return reply(401,{error:'Akun tidak valid.'});
      const membership=await request(`${env.url}/rest/v1/marking_members?select=role&user_id=eq.${encodeURIComponent(actor.id)}`,{headers:adminHeaders});
      if(!membership.ok)return reply(503,{error:'Tidak dapat memeriksa hak admin.'});
      const roles=await membership.json();
      if(roles.length!==1||roles[0].role!=='admin')return reply(403,{error:'Hanya admin yang dapat membuat akun.'});
      const input=await req.json();
      if(input.action==='check')return reply(200,{ok:true});
      const job=String(input.job||'sensus');if(!['sensus','panen'].includes(job))return reply(400,{error:'Pilih tugas sensus atau panen.'});
      const username=String(input.username||'').trim().toLowerCase(),name=String(input.name||'').trim().replace(/\s+/g,' '),password=String(input.password||'');
      const email=username+'@marking.vigufarm.invalid';
      if(!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)||!name||name.length>80||!/^[0-9]{6,16}$/.test(password))return reply(400,{error:'Isi nama, username 3–30 karakter dan PIN 6–16 angka.'});
      const created=await request(`${env.url}/auth/v1/admin/users`,{method:'POST',headers:adminHeaders,body:JSON.stringify({email,password: 'Marking-'+password,email_confirm:true,user_metadata:{display_name:name}})});
      if(!created.ok)return reply(created.status===422?409:400,{error:'Akun tidak dapat dibuat. Periksa username dan PIN, atau kemungkinan username sudah terdaftar.'});
      const account=await created.json();if(!account.id)return reply(502,{error:'Server tidak mengembalikan identitas akun. Periksa daftar pengguna.'});
      const add=await request(`${env.url}/rest/v1/marking_members`,{method:'POST',headers:{...adminHeaders,Prefer:'return=minimal'},body:JSON.stringify({user_id:account.id,display_name:name,role:'petugas',job})});
      if(!add.ok){
        const rollback=await request(`${env.url}/auth/v1/admin/users/${encodeURIComponent(account.id)}`,{method:'DELETE',headers:adminHeaders});
        return reply(503,{error:rollback.ok?'Akses belum dapat dibuat; akun baru dibatalkan. Coba lagi.':'Akses gagal disimpan dan akun baru perlu diperiksa admin di Supabase.'});
      }
      return reply(201,{ok:true,name,username,job});
    }catch{return reply(503,{error:'Server belum dapat menyelesaikan permintaan. Periksa daftar pengguna sebelum mencoba ulang.'});}
  };
}
if (typeof Deno !== 'undefined') Deno.serve(createHandler({url:Deno.env.get('SUPABASE_URL')||'',serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}));
