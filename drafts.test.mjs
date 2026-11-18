import test from 'node:test';
import assert from 'node:assert/strict';
import {addDraft,changeDraft,readDrafts,removeQueuedDrafts} from './drafts.js';
import {firstCensus} from './core.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const entry={id:'1',pointId:'point',date:'2026-11-18',recordedAt:'2026-11-18T01:00:00Z',createdBy:'alice',officer:'Alice',lat:1,lng:1,block:'A',color:'BK',status:'active'};
test('draf dapat direvisi dan dihapus hanya oleh pemilik',()=>{const s=storage();addDraft(s,entry);assert.throws(()=>changeDraft(s,'bob','point',{color:'GN'}));changeDraft(s,'alice','point',{color:'GN',block:'B',lat:2});assert.equal(readDrafts(s)[0].block,'B');assert.equal(readDrafts(s)[0].color,'GN');changeDraft(s,'alice','point',null);assert.equal(readDrafts(s).length,0);});
test('hapus draf antrean hanya bila isi belum berubah',()=>{const s=storage();addDraft(s,entry);changeDraft(s,'alice','point',{color:'GN'});removeQueuedDrafts(s,[entry]);assert.equal(readDrafts(s).length,1);removeQueuedDrafts(s,readDrafts(s));assert.equal(readDrafts(s).length,0);});
test('titik yang dihapus tetap di rekap, koreksi memindahkan blok tanpa menggandakan sensus',()=>{const corrected={...entry,id:'2',recordedAt:'2026-11-18T02:00:00Z',block:'B',color:'GN',lat:2},deleted={...corrected,id:'3',recordedAt:'2026-11-18T03:00:00Z',eventKind:'deleted',status:'harvested',retainedForReport:true};const result=firstCensus([entry,corrected],'2026-11-18');assert.equal(result.length,1);assert.equal(result[0].block,'B');assert.equal(result[0].color,'BK');assert.equal(result[0].lat,2);assert.equal(firstCensus([entry,corrected,deleted],'2026-11-18').length,1);});

test('penghapusan lama tidak mengembalikan titik uji ke rekap',()=>{const deleted={...entry,id:'old-delete',recordedAt:'2026-11-18T03:00:00Z',eventKind:'deleted',status:'harvested'};assert.equal(firstCensus([entry,deleted],'2026-11-18').length,0);});
