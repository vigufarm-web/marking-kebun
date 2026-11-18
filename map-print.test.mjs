import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMapPrint} from './map-print.js';
const features=[{properties:{name:'A<script>'},geometry:{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]}}];
const points=[{lat:1,lng:1,block:'A<script>',color:'BK'},{lat:1.5,lng:1.5,block:'A<script>',color:'GN'}];
const common={features,points,date:'2026-11-18',featureName:f=>f.properties.name,synced:true};
test('peta hanya memuat titik dan legenda warna yang dipilih dan mengamankan nama blok',()=>{const html=buildMapPrint({...common,colors:[['BK','BLACK','#000000']]});assert.match(html,/1 titik aktif/);assert.equal((html.match(/<circle /g)||[]).length,1);assert.match(html,/BK · BLACK \(1\)/);assert.doesNotMatch(html,/GN · GREEN/);assert.doesNotMatch(html,/<script>/);assert.match(html,/A&lt;script&gt;/);});
test('filter blok dan status sinkron ditampilkan',()=>{const html=buildMapPrint({...common,block:'A<script>',synced:false,colors:[['GN','GREEN','#56a536']]});assert.match(html,/sinkronisasi belum dipastikan/);assert.match(html,/GN · GREEN \(1\)/);assert.throws(()=>buildMapPrint({...common,features:[],points:[],colors:[]}));});

test('ukuran titik mengikuti skala peta dan lebih kecil dari jarak tanam satu meter',()=>{
 const small={type:'Feature',properties:{name:'A'},geometry:{type:'Polygon',coordinates:[[[109,-7.1],[109.001,-7.1],[109.001,-7.099],[109,-7.099],[109,-7.1]]]}};
 const pts=[{lat:-7.0995,lng:109.0005,block:'A',color:'BK'}];
 const html=buildMapPrint({features:[small],points:pts,colors:[['BK','BLACK','#000']],date:'2026-11-18',featureName:f=>f.properties.name,synced:true});
 const radius=Number(html.match(/<circle[^>]* r="([\d.]+)"/)[1]);
 assert.ok(radius>0 && radius<3); assert.match(html,/<svg[^>]*viewBox=/);
});
