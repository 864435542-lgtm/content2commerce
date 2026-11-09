import assert from 'node:assert/strict';
import {demoExperiments,validExperiments,planError,readExperimentPlan,editExperiment,saveExperiments,loadExperiments} from '../src/experiments.ts';
let raw=JSON.stringify(demoExperiments),writes=0;
const access=()=>({getItem:()=>raw,setItem:(_,value)=>{raw=value;writes++;}});
const loaded=loadExperiments(access);assert.equal(loaded.blocked,false);assert.deepEqual(loaded.records,demoExperiments);assert.equal(writes,0);
const plan={controlGroup:'Original page',treatmentGroup:'Clearer shipping',baseline:0,startDate:'2026-12-31',endDate:'2027-01-07',successCriteria:'Agree minimum useful improvement before launch'};
assert.equal(planError(plan),null);assert.equal(planError({}),null);assert.equal(planError({baseline:100}),null);
for(const value of [-1,101,NaN,Infinity,'2.98',null]) assert.ok(planError({baseline:value}));
for(const key of ['controlGroup','treatmentGroup','successCriteria']){assert.ok(planError({[key]:'x'.repeat(501)}));assert.ok(planError({[key]:23}));}
for(const value of ['2026-02-29','2026-02-30','bad',23,null]) assert.ok(planError({startDate:value}));
assert.equal(planError({startDate:'2024-02-29'}),null);assert.equal(planError({endDate:'2026-10-01'}),null);
assert.ok(planError({startDate:'2026-10-02',endDate:'2026-10-01'}));
assert.equal(planError({startDate:'2026-10-01',endDate:'2026-10-01'}),null);
const fields=new Map(Object.entries({...plan,baseline:'2.98'}));
assert.equal(readExperimentPlan({get:key=>fields.get(key)}).baseline,2.98);
fields.set('baseline','');assert.equal(readExperimentPlan({get:key=>fields.get(key)}).baseline,undefined);
fields.set('baseline','not a number');assert.throws(()=>readExperimentPlan({get:key=>fields.get(key)}));
const draft={name:'Plan edit',hypothesis:'A planned test',metric:'Site purchase conversion',...plan};
const changed=editExperiment(loaded.records,1,draft);
assert.deepEqual(loaded.records,demoExperiments);assert.equal(writes,0); // Discarding draft leaves storage unchanged.
assert.equal(changed[0].id,1);assert.equal(changed[0].status,'Running');assert.equal(changed[0].baseline,0);
saveExperiments(changed,false,access);assert.deepEqual(loadExperiments(access).records,changed);
const cleared=editExperiment(changed,1,{...draft,...readExperimentPlan({get:()=>''})});
saveExperiments(cleared,false,access);assert.equal(loadExperiments(access).records[0].baseline,undefined);
assert.equal(validExperiments([{...demoExperiments[0],baseline:200}]),false);
assert.equal(validExperiments(demoExperiments),true);
console.log('PASS: optional A/B plan validation, legacy compatibility, baseline/date boundaries, edit cancellation/identity, field clearing and local refresh restore.');
