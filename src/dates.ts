export const demoRanges: Record<string,{start:string;end:string}> = {
 '28':{start:'2026-10-01',end:'2026-10-28'},
 '14':{start:'2026-10-15',end:'2026-10-28'},
 '7':{start:'2026-10-22',end:'2026-10-28'},
};
// Date-only validation, independent of local timezone and Date's rollover behavior.
export function isValidDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const [year,month,day]=value.split('-').map(Number);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return year>=1&&month>=1&&month<=12&&day>=1&&day<=days[month-1];
}
export function filterDateRange<T>(records:readonly T[],start:unknown,end:unknown){
 const error=!isValidDate(start)||!isValidDate(end)?'Invalid date range: use real YYYY-MM-DD dates.':start>end?'Invalid date range: start date must not be after end date.':null;
 if(error) return {rows:[] as T[],invalidCount:0,error};
 const rows:T[]=[];let invalidCount=0;
 for(const record of records){
  const date=typeof record==='object'&&record!==null?(record as Record<string,unknown>).date:undefined;
  if(!isValidDate(date)){invalidCount++;continue;}
  // Fixed-width validated ISO dates sort in calendar order, across months and years.
  if(date>=(start as string)&&date<=(end as string)) rows.push(record);
 }
 return {rows,invalidCount,error:null};
}
export function buildTrend(social:readonly {date:string;impressions:number}[],website:readonly {date:string;sessions:number}[]){
 const dates=[...new Set([...social.map(r=>r.date),...website.map(r=>r.date)])].filter(isValidDate).sort();
 return dates.map(day=>{
  const posts=social.filter(r=>r.date===day),visits=website.filter(r=>r.date===day);
  return {day,impressions:posts.length?posts.reduce((s,r)=>s+r.impressions,0):null,sessions:visits.length?visits.reduce((s,r)=>s+r.sessions,0):null};
 });
}
