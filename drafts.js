// Draf disimpan terpisah dari antrean sinkronisasi agar tidak terkirim otomatis.
import {mergeEvents} from './core.js?v=account13';
export const DRAFT_KEY='vigu.marking.drafts.v1';
export function readDrafts(storage){
  const value=JSON.parse(storage.getItem(DRAFT_KEY)||'[]');
  if(!Array.isArray(value))throw Error('Draf tidak dapat dibaca.');
  return mergeEvents([],value);
}
export function changeDraft(storage,userId,pointId,change){
  const drafts=readDrafts(storage), i=drafts.findIndex(e=>e.pointId===pointId);
  if(i<0||drafts[i].createdBy!==userId)throw Error('Draf tidak ditemukan atau bukan milik Anda.');
  if(change===null)drafts.splice(i,1);
  else {const next={...drafts[i],...change};if(next.id!==drafts[i].id||next.pointId!==pointId||next.createdBy!==userId)throw Error('Identitas draf tidak boleh diubah.');mergeEvents([],[next]);drafts[i]=next;}
  storage.setItem(DRAFT_KEY,JSON.stringify(drafts));return drafts;
}
export function addDraft(storage,event){
  const drafts=readDrafts(storage);if(drafts.some(e=>e.id===event.id||e.pointId===event.pointId))throw Error('Draf sudah ada.');
  mergeEvents([],[event]);drafts.push(event);storage.setItem(DRAFT_KEY,JSON.stringify(drafts));return drafts;
}
// Only remove drafts whose exact content was copied to the durable send queue.
export function removeQueuedDrafts(storage,queued){
  const ids=new Map(queued.map(e=>[e.id,JSON.stringify(e)]));
  const rest=readDrafts(storage).filter(e=>ids.get(e.id)!==JSON.stringify(e));
  storage.setItem(DRAFT_KEY,JSON.stringify(rest));return rest;
}
