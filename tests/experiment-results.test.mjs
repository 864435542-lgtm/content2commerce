import assert from 'node:assert/strict';
import {resultError,readExperimentResult,summarizeResult} from '../src/experiment-results.ts';
import {demoExperiments,editExperiment,loadExperiments,saveExperiments,validExperiments} from '../src/experiments.ts';
const result={type:'Simulation',controlImpressions:1000,controlClicks:10,treatmentImpressions:1000,treatmentClicks:15,conclusion:'Simulated practice; inconclusive',nextAction:'Plan a controlled test'};
assert.equal(resultError(result),null);
const summary=summarizeResult('Social link CTR',result);
assert.match(summary.label,/simulated practice only/);assert.equal(summary.stats.control,0.01);assert.equal(summary.stats.treatment,0.015);
assert.ok(Math.abs(summary.stats.percentagePoints-0.5)<1e-10);assert.ok(Math.abs(summary.stats.relativeLift-50)<1e-10);
assert.equal(summarizeResult('Social link CTR',{...result,controlClicks:0}).stats.relativeLift,null);
assert.equal(summarizeResult('Social link CTR',{...result,treatmentClicks:0}).stats.relativeLift,-100);
assert.match(summarizeResult('Social link CTR',{...result,type:'Actual'}).label,/not verified/);
for(const key of ['controlImpressions','controlClicks','treatmentImpressions','treatmentClicks']){
 for(const value of [-1,0.5,NaN,Infinity,'10',null]) assert.ok(resultError({...result,[key]:value}));
 assert.equal(summarizeResult('Social link CTR',{...result,[key]:undefined}).stats,null);
}
assert.ok(resultError({...result,controlImpressions:0}));assert.ok(resultError({...result,treatmentImpressions:0}));
assert.ok(resultError({...result,controlClicks:1001}));assert.ok(resultError({...result,treatmentClicks:1001}));
assert.ok(resultError({...result,type:'Unknown'}));assert.ok(resultError({...result,conclusion:'x'.repeat(1001)}));
assert.equal(summarizeResult('Social link CTR',{}).stats,null);assert.equal(summarizeResult('Social link CTR',{...result,type:undefined}).stats,null);
for(const metric of ['Social engagement rate','Site purchase conversion','Cart-to-purchase completion']){
 const s=summarizeResult(metric,result);assert.equal(s.stats,null);assert.match(s.message,/Not supported/);
}
assert.deepEqual(readExperimentResult({get:()=>''}),{});
const map=new Map(Object.entries(result).map(([key,value])=>['result.'+key,String(value)]));
assert.deepEqual(readExperimentResult({get:key=>map.get(key)}),result);
assert.equal(validExperiments(demoExperiments),true);
let raw=JSON.stringify(demoExperiments),writes=0;const access=()=>({getItem:()=>raw,setItem:(_,value)=>{raw=value;writes++;}});
const old=loadExperiments(access);assert.equal(old.blocked,false);
const changed=editExperiment(old.records,1,{name:old.records[0].name,hypothesis:old.records[0].hypothesis,metric:'Social link CTR',result});
assert.equal(writes,0);assert.equal(old.records[0].result,undefined); // Cancel/discard draft does not persist.
assert.equal(changed[0].id,1);assert.equal(changed[0].status,'Running');
saveExperiments(changed,false,access);assert.deepEqual(loadExperiments(access).records,changed);
const completed={...old.records[0],status:'Completed'};
assert.equal(summarizeResult(completed.metric,completed.result).stats,null);
assert.equal(validExperiments([{...completed,result:{conclusion:'Not executed'}}]),true);
console.log('PASS: result validation, percentage points vs relative lift, zero control, source labels, unsupported metrics, legacy/cancel/persistence and incomplete Completed records.');
