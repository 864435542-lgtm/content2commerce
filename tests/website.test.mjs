import assert from 'node:assert/strict';
import {websiteMetrics,formatWebsiteRate,metrics,content,traffic} from '../src/data.ts';
import {demoRanges,filterDateRange,buildTrend} from '../src/dates.ts';
const row=(sessions=100,cart=50,checkout=20,purchases=10)=>({date:'2026-10-01',sessions,cart,checkout,purchases});
const normal=websiteMetrics([row(),row(200,100,80,50)]);
assert.equal(normal.cvr,60/300);assert.equal(normal.rates[2].fromPrevious,100/150);
const bad=[];
for(const field of ['sessions','cart','checkout','purchases']){
 for(const value of [undefined,null,'10',-1,0.5,NaN,Infinity]) bad.push({...row(),[field]:value});
 const missing=row();delete missing[field];bad.push(missing);
}
bad.push(null,undefined,{},row(10,11,5,1),row(100,20,21,1),row(100,20,10,11));
for(const value of bad){const q=websiteMetrics([value]);assert.equal(q.excludedCount,1);assert.equal(q.validCount,0);assert.equal(q.cvr,null);}
const mixed=websiteMetrics([row(),...bad,row(0,0,0,0)]);
assert.equal(mixed.validCount,2);assert.equal(mixed.excludedCount,bad.length);
assert.equal(mixed.reasons.invalidOrder,3);assert.equal(mixed.reasons.invalidValues,bad.length-3);
assert.deepEqual(mixed.validRows,[row(),row(0,0,0,0)]);
assert.equal(mixed.sessions,100);assert.equal(mixed.purchases,10);assert.equal(mixed.cvr,0.1);
assert.equal(buildTrend([],mixed.validRows)[0].sessions,100);
for(const records of [[],bad,[row(0,0,0,0)]]){
 const q=websiteMetrics(records);assert.equal(formatWebsiteRate(q.cvr),'N/A');
 for(const rate of q.rates){assert.equal(rate.ofSessions,null);assert.equal(rate.fromPrevious,null);}
}
const zero=websiteMetrics([row(100,50,20,0)]);
assert.equal(formatWebsiteRate(zero.cvr),'0.00%');assert.equal(formatWebsiteRate(zero.rates[3].fromPrevious),'0.00%');
const middle=websiteMetrics([row(100,0,0,0)]);
assert.equal(formatWebsiteRate(middle.rates[1].fromPrevious),'0.00%');assert.equal(formatWebsiteRate(middle.rates[2].fromPrevious),'N/A');
for(const [days,expected] of [[28,[28364,3094,1666,845,'2.98%']],[14,[14966,1645,882,455,'3.04%']],[7,[7679,847,453,236,'3.07%']]]){
 const range=demoRanges[days],visits=filterDateRange(traffic,range.start,range.end).rows;
 const m=metrics(content,visits);assert.deepEqual([m.sessions,m.cart,m.checkout,m.purchases,formatWebsiteRate(m.cvr)],expected);
 assert.equal(m.websiteQuality.validCount,days);assert.equal(m.websiteQuality.excludedCount,0);
}
const before=metrics(content,traffic),damaged=metrics(content,[...traffic,...bad]);
for(const key of ['count','impressions','engagements','clicks','engagementRate','erQuality','ctr','ctrQuality','sessions','cart','checkout','purchases','cvr']) assert.deepEqual(before[key],damaged[key],key);
console.log('PASS: website field validation, stage nesting, zero/empty/mixed data, weighted rates, valid trend records, 28/14/7-day totals and social KPI independence.');
