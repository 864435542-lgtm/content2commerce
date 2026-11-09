import assert from 'node:assert/strict';
import {EXPERIMENTS_KEY,demoExperiments,validExperiments,loadExperiments,saveExperiments} from '../src/experiments.ts';
const values=new Map();let writes=0;
const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes++;values.set(key,value);}};
const access=()=>storage;
const initial=loadExperiments(access);
assert.deepEqual(initial.records,demoExperiments);assert.equal(initial.blocked,false);assert.equal(writes,0);
const created=[...initial.records,{id:3,name:'Shipping clarity',hypothesis:'Clear shipping costs may improve CVR.',metric:'Site purchase conversion',status:'Planned'}];
assert.equal(saveExperiments(created,false,access).blocked,false);
assert.deepEqual(loadExperiments(access).records,created); // Fresh load simulates refresh.
const changed=created.map(row=>row.id===3?{...row,status:'Running'}:row);
saveExperiments(changed,false,access);
assert.deepEqual(loadExperiments(access).records,changed);
assert.equal(writes,2);
for(const invalid of ['{broken',JSON.stringify({}),JSON.stringify([{...created[2],name:null}]),JSON.stringify([{...created[2],status:'Unknown'}]),JSON.stringify([{...created[2],metric:42}]),JSON.stringify([{...created[2],id:NaN}]),JSON.stringify([created[2],created[2]])]){
 values.set(EXPERIMENTS_KEY,invalid);const count=writes;
 const state=loadExperiments(access);
 assert.equal(state.blocked,true);assert.ok(state.message);assert.deepEqual(state.records,demoExperiments);
 saveExperiments(created,state.blocked,access);
 assert.equal(values.get(EXPERIMENTS_KEY),invalid);assert.equal(writes,count);
 assert.equal(saveExperiments(created,false,access).blocked,true); // Protect corruption introduced after initial load.
 assert.equal(values.get(EXPERIMENTS_KEY),invalid);
}
const unavailable=()=>{throw new Error('SecurityError');};
assert.equal(loadExperiments(unavailable).blocked,true);
assert.equal(saveExperiments(created,false,unavailable).blocked,true);
const full=()=>({getItem:()=>null,setItem:()=>{throw new Error('QuotaExceededError');}});
assert.equal(saveExperiments(created,false,full).blocked,true);
assert.equal(loadExperiments(()=>({getItem:()=>{throw new Error('Denied');}})).blocked,true);
values.delete(EXPERIMENTS_KEY);saveExperiments([],false,access);
assert.deepEqual(loadExperiments(access).records,[]); // Saved empty list is not mistaken for first visit.
assert.equal(validExperiments([{...created[2],hypothesis:''}]),false);
assert.equal(validExperiments([{...created[2],id:'3'}]),false);
assert.equal(saveExperiments([{...created[2],name:''}],false,access).message.includes('not been saved'),true);
console.log('PASS: initial demo, creation, status save, refresh restore, invalid JSON/fields, corruption preservation, unavailable/full storage and saved empty list.');
