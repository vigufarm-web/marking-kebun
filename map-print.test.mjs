import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMapPrint} from './map-print.js';
const features=[{properties:{name:'A<script>'},geometry:{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]}}];
const points=[{lat:1,lng:1,block:'A<script>',color:'BK'},{lat:1.5,lng:1.5,block:'A<script>',color:'GN'}];
const common={features,points,date:'2026-11-18',featureName:f=>f.properties.name,synced:true};
test('peta hanya memuat titik dan legenda warna yang dipilih dan mengamankan nama blok',()=>{const html=buildMapPrint({...common,colors:[['BK','BLACK','#000000']]});assert.match(html,/1 titik aktif/);assert.equal((html.match(/<circle /g)||[]).length,1);assert.match(html,/BK · BLACK \(1\)/);assert.doesNotMatch(html,/GN · GREEN/);assert.doesNotMatch(html,/<script>/);assert.match(html,/A&lt;script&gt;/);});
test('filter blok dan status sinkron ditampilkan',()=>{const html=buildMapPrint({...common,block:'A<script>',synced:false,colors:[['GN','GREEN','#56a536']]});assert.match(html,/sinkronisasi belum dipastikan/);assert.match(html,/GN · GREEN \(1\)/);assert.throws(()=>buildMapPrint({...common,features:[],points:[],colors:[]}));});
