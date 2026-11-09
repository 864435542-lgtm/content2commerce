import assert from 'node:assert/strict';
import {engagementRate,formatER,metrics,content,traffic} from '../src/data.ts';
import {demoRanges,filterDateRange} from '../src/dates.ts';
const record=(engagements,impressions)=>({engagements,impressions});
const normal=engagementRate([record(10,100),record(90,300)]);
assert.equal(normal.rate,0.25); // Aggregation, not mean of individual rates (20%).
assert.equal(normal.validCount,2);
const invalid=[{}, {engagements:1}, {impressions:100}, record(-1,100),record(1,-1),record(NaN,100),record(1,NaN),record(Infinity,100),record(1,Infinity),record('10',100),record(1,'100'),record(null,100),null,undefined];
const mixed=engagementRate([...invalid,record(0,100),record(10,100),record(0,0)]);
assert.equal(mixed.validCount,3);
assert.equal(mixed.excludedCount,invalid.length);
assert.equal(mixed.rate,0.05);
assert.equal(engagementRate([record(0,100)]).rate,0);
assert.equal(formatER(0),'0.00%');
for(const rows of [[],invalid,[record(0,0),record(5,0)]]){
 assert.equal(engagementRate(rows).rate,null);
 assert.equal(formatER(engagementRate(rows).rate),'N/A');
}
assert.equal(engagementRate([record(Number.MAX_VALUE,100),record(Number.MAX_VALUE,100)]).rate,null);
for(const days of [28,14,7]){
 const rows=filterDateRange(content,demoRanges[days].start,demoRanges[days].end).rows;
 const visits=filterDateRange(traffic,demoRanges[days].start,demoRanges[days].end).rows;
 const m=metrics(rows,visits);
 assert.equal(m.erQuality.validCount,days);
 assert.equal(m.erQuality.excludedCount,0);
 assert.equal(m.engagementRate,rows.reduce((s,r)=>s+r.engagements,0)/rows.reduce((s,r)=>s+r.impressions,0));
 assert.equal(m.impressions,rows.reduce((s,r)=>s+r.impressions,0));
 assert.equal(m.ctr,m.clicks/m.impressions);
 assert.equal(m.cvr,m.purchases/m.sessions);
}
console.log('PASS: normal/weighted ER, missing fields, negatives, NaN, Infinity, strings, zero engagement, empty data, zero exposure, overflow, date ranges and other KPI formulas.');
