import {COLORS,firstCensus,censusByBlock,latest} from './core.js?v=account13';
import {S} from './vendor/xlsx-tulis.js';

export function buildCensusSheets(events,until,block='',synced=false){
 const grouped=censusByBlock(events,until,block), first=firstCensus(events,until,block);
 const current=latest(events,until), codes=COLORS.map(c=>c[0]);
 const head=['Tanggal sensus','Blok',...codes,'Total tandan'];
 const totals=Object.fromEntries(codes.map(c=>[c,0]));let grand=0;
 const rows=grouped.map(g=>{for(const c of codes)totals[c]+=g.counts[c];grand+=g.total;return [S.teks(g.date),S.teks(g.block),...codes.map(c=>S.angkaT(g.counts[c])),S.angkaT(g.total)];});
 const summary=[[S.judul('Rekap sensus tandan')],[S.kecil('Sampai '+until+' · '+(block||'Semua blok')+' · warna setelah koreksi · '+(synced?'data tersinkron':'data perangkat, sinkronisasi belum dipastikan'))],head.map(S.kepala),...rows,[S.teksT('TOTAL'),S.teksT(''),...codes.map(c=>S.angkaT(totals[c])),S.angkaT(grand)]];
 const detailHead=['Tanggal sensus','Blok','Warna sensus','Petugas awal','Latitude','Longitude','Akurasi GPS (m)','Warna terakhir','Status terakhir','ID tandan'];
 const detail=first.sort((a,b)=>b.date.localeCompare(a.date)||(a.block||'').localeCompare(b.block||'','id')||a.pointId.localeCompare(b.pointId)).map(p=>{const last=current.get(p.pointId)||p;return [S.teks(p.date),S.teks(p.block||'Blok belum diketahui'),S.teks(p.color),S.teks(p.officer),{v:p.lat},{v:p.lng},{v:p.accuracy??'',g:7},S.teks(last.color),S.teks(last.status==='harvested'?'Dipanen':'Aktif'),S.teks(p.pointId)];});
 return [{nama:'Rekap per blok',lebar:[18,25,...codes.map(()=>10),16],bekukan:3,baris:summary},{nama:'Detail tandan',lebar:[18,25,14,25,18,18,18,16,16,40],bekukan:3,baris:[[S.judul('Detail tandan sensus')],[S.kecil('Sampai '+until+' · '+(block||'Semua blok')+' · '+(synced?'data tersinkron':'data perangkat, sinkronisasi belum dipastikan'))],detailHead.map(S.kepala),...detail]}];
}
