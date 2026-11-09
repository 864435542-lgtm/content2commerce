import assert from 'node:assert/strict';
import {demoRanges,isValidDate,filterDateRange,buildTrend} from '../src/dates.ts';
import {content,traffic} from '../src/data.ts';
for(const [days,start] of [[28,'2026-10-01'],[14,'2026-10-15'],[7,'2026-10-22']]){
 const range=demoRanges[days];
 assert.deepEqual(range,{start,end:'2026-10-28'});
 for(const source of [content,traffic]){
  const result=filterDateRange(source,range.start,range.end);
  assert.equal(result.error,null);assert.equal(result.invalidCount,0);
  assert.equal(result.rows.length,days);
  assert.equal(result.rows[0].date,start);assert.equal(result.rows.at(-1).date,'2026-10-28');
 }
}
const select=(dates,start,end)=>filterDateRange(dates.map(date=>({date})),start,end).rows.map(r=>r.date);
assert.deepEqual(select(['2026-10-21','2026-10-22','2026-10-28','2026-10-29','2025-10-25','2026-09-25'],'2026-10-22','2026-10-28'),['2026-10-22','2026-10-28']);
assert.deepEqual(select(['2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03'],'2026-10-31','2026-11-02'),['2026-10-31','2026-11-01','2026-11-02']);
assert.deepEqual(select(['2026-12-30','2026-12-31','2027-01-01','2027-01-02'],'2026-12-31','2027-01-01'),['2026-12-31','2027-01-01']);
assert.deepEqual(select(['2026-10-01','2026-10-02'],'2026-10-01','2026-10-01'),['2026-10-01']);
for(const date of ['2024-02-29','2000-02-29','2026-04-30','0001-01-01']) assert.equal(isValidDate(date),true,date);
const invalid=['2026-02-29','1900-02-29','2026-02-30','2026-04-31','2026-13-01','2026-00-01','2026-01-00','0000-01-01','2026-1-01','invalid25','2026-10-01T00:00:00Z','',null,undefined,20261001,{},' 2026-10-01'];
for(const date of invalid) assert.equal(isValidDate(date),false,String(date));
const bad=filterDateRange([...invalid.map(date=>({date})),{},null,{date:'2026-10-01'}],'2026-10-01','2026-10-28');
assert.equal(bad.invalidCount,invalid.length+2);assert.equal(bad.rows.length,1);
assert.match(filterDateRange(content,'2026-10-28','2026-10-01').error,/start date/);
for(const date of invalid){
 assert.ok(filterDateRange(content,date,'2026-10-28').error);
 assert.ok(filterDateRange(content,'2026-10-01',date).error);
}
assert.deepEqual(filterDateRange([],'2026-10-01','2026-10-28'),{rows:[],invalidCount:0,error:null});
assert.equal(filterDateRange(content,'2027-01-01','2027-01-31').rows.length,0);
const trend=buildTrend([{date:'2026-10-31',impressions:10},{date:'2026-10-31',impressions:20},{date:'2027-01-01',impressions:5}],[{date:'2026-11-01',sessions:8},{date:'2027-01-01',sessions:3}]);
assert.deepEqual(trend,[{day:'2026-10-31',impressions:30,sessions:null},{day:'2026-11-01',impressions:null,sessions:8},{day:'2027-01-01',impressions:5,sessions:3}]);
assert.deepEqual(buildTrend([],[]),[]);
console.log('PASS: fixed demo ranges, inclusive boundaries, cross-month/year, leap years, invalid/missing dates, invalid/reversed ranges, empty data, mismatched dates and trend aggregation.');
