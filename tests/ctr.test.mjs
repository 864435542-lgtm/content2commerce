import assert from 'node:assert/strict';
import {clickThroughRate,formatCTR,engagementRate,metrics,content,traffic,divide} from '../src/data.ts';
const record=(clicks,impressions)=>({clicks,impressions});
assert.equal(clickThroughRate([record(10,100),record(90,300)]).rate,0.25); // Not the simple mean, 20%.
const invalid=[{}, {clicks:1}, {impressions:100},record('1',100),record(1,'100'),record(-1,100),record(1,-1),record(NaN,100),record(1,NaN),record(Infinity,100),record(1,Infinity),record(null,100),null,undefined];
for(const row of invalid){
 const result=clickThroughRate([row]);
 assert.equal(result.excludedCount,1);assert.equal(result.validCount,0);assert.equal(formatCTR(result.rate),'N/A');
}
const mixed=clickThroughRate([...invalid,record(0,100),record(10,100),record(5,0)]);
assert.deepEqual(mixed,{rate:0.075,validCount:3,excludedCount:invalid.length,clicks:15,impressions:200});
assert.equal(formatCTR(clickThroughRate([record(0,100)]).rate),'0.00%');
for(const rows of [[],[record(0,0)],[record(5,0)]]) assert.equal(formatCTR(clickThroughRate(rows).rate),'N/A');
assert.equal(clickThroughRate([record(Number.MAX_VALUE,100),record(Number.MAX_VALUE,100)]).rate,null);
assert.equal(clickThroughRate([record(1,Number.MAX_VALUE),record(1,Number.MAX_VALUE)]).rate,null);
for(const value of [NaN,Infinity,null,Number.MAX_VALUE]) assert.equal(formatCTR(value),'N/A');
assert.equal(engagementRate([{engagements:10,impressions:100}]).rate,0.1); // Missing clicks does not invalidate ER.
assert.equal(clickThroughRate([{clicks:10,impressions:100}]).rate,0.1); // Missing engagements does not invalidate CTR.
const damaged=content.map((r,i)=>i===0?{...r,clicks:undefined}:r);
const before=metrics(content,traffic),after=metrics(damaged,traffic);
for(const key of ['count','impressions','engagements','engagementRate','sessions','purchases','cvr','cart','checkout','erQuality']) assert.deepEqual(after[key],before[key],key);
assert.equal(after.ctrQuality.excludedCount,1);
assert.equal(after.ctr,(before.clicks-content[0].clicks)/(before.impressions-content[0].impressions));
assert.equal(before.impressions,620200);assert.equal(before.clicks,6625);assert.equal(before.sessions,28364);assert.equal(before.purchases,845);
assert.equal(before.cvr,845/28364);assert.equal(divide(1,0),0);
for(const [id,expected] of [['C20','0.80%'],['C28','1.20%']]) assert.equal(formatCTR(clickThroughRate([content.find(r=>r.id===id)]).rate),expected);
assert.equal(formatCTR(before.ctr),'1.07%');
console.log('PASS: CTR validation, weighted aggregation, zero/empty/mixed data, overflow, ER independence, other KPI regression, C20/C28 and 28-day CTR.');
