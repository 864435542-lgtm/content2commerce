export type Content = {id:string; title:string; platform:'TikTok'|'Instagram'; type:'Video'|'Carousel'; date:string; impressions:number; engagements:number; clicks:number};
export const content:Content[] = Array.from({length:28},(_,i)=>({id:`C${i+1}`,title:['A simple skincare routine, step by step','Cleanser, serum, moisturizer: a shelf tour','Reading a skincare ingredient list together','Pack my skincare essentials for a weekend away','A closer look at skincare textures and packaging','Skincare claims: what would count as evidence?','Unbox a skincare routine with me'][i%7],platform:i%3===0?'Instagram':'TikTok',type:i%3===0?'Carousel':'Video',date:`2026-10-${String(i+1).padStart(2,'0')}`,impressions:Math.round(8200+(i%7)*3700+(i%4)*1900),engagements:Math.round((8200+(i%7)*3700+(i%4)*1900)*(0.026+(i%5)*0.009)),clicks:Math.round((8200+(i%7)*3700+(i%4)*1900)*(0.006+(i%6)*0.002))}));
export const traffic=Array.from({length:28},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,sessions:680+(i%7)*75+i*8,cart:70+(i%7)*9+i,checkout:38+(i%7)*5+Math.floor(i/2),purchases:17+(i%7)*3+Math.floor(i/3)}));
export const divide=(a:number,b:number)=>b>0?a/b:0;
export const sum=<T,>(rows:T[],value:(row:T)=>number)=>rows.reduce((total,row)=>total+value(row),0);
// Validate raw values at runtime; never coerce strings or missing fields to zero.
export function engagementRate(rows: readonly unknown[]) {
 let validCount=0, engagements=0, impressions=0;
 const validNumber=(value:unknown):value is number=>typeof value==='number' && Number.isFinite(value) && value>=0;
 for(const row of rows){
  if(typeof row!=='object'||row===null) continue;
  const record=row as Record<string,unknown>;
  if(!validNumber(record.engagements)||!validNumber(record.impressions)) continue;
  validCount++; engagements+=record.engagements; impressions+=record.impressions;
 }
 const rate=impressions>0 && Number.isFinite(impressions) && Number.isFinite(engagements) ? engagements/impressions : null;
 return {rate:rate!==null && Number.isFinite(rate)?rate:null,validCount,excludedCount:rows.length-validCount,engagements,impressions};
}
export const formatER=(rate:number|null)=>rate===null?'N/A':pct(rate);
// CTR validates its own fields independently of ER and other KPI totals.
export function clickThroughRate(rows:readonly unknown[]){
 let validCount=0,clicks=0,impressions=0;
 const validNumber=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
 for(const row of rows){
  if(typeof row!=='object'||row===null) continue;
  const record=row as Record<string,unknown>;
  if(!validNumber(record.clicks)||!validNumber(record.impressions)) continue;
  validCount++;clicks+=record.clicks;impressions+=record.impressions;
 }
 const rate=impressions>0&&Number.isFinite(clicks)&&Number.isFinite(impressions)?clicks/impressions:null;
 return {rate:rate!==null&&Number.isFinite(rate)?rate:null,validCount,excludedCount:rows.length-validCount,clicks,impressions};
}
export const formatCTR=(rate:number|null)=>rate===null||!Number.isFinite(rate)||!Number.isFinite(rate*100)?'N/A':pct(rate);
export const websiteRate=(numerator:number,denominator:number):number|null=>Number.isFinite(numerator)&&Number.isFinite(denominator)&&numerator>=0&&denominator>0?numerator/denominator:null;
export const formatWebsiteRate=(rate:number|null)=>rate===null||!Number.isFinite(rate)?'N/A':pct(rate);
export function websiteMetrics<T>(records:readonly T[]){
 const validRows:T[]=[];
 const totals={sessions:0,cart:0,checkout:0,purchases:0};
 const reasons={invalidValues:0,invalidOrder:0};
 const fields=['sessions','cart','checkout','purchases'] as const;
 for(const record of records){
  const row=typeof record==='object'&&record!==null?record as Record<string,unknown>:{};
  if(!fields.every(key=>typeof row[key]==='number'&&Number.isFinite(row[key])&&Number.isInteger(row[key])&&(row[key] as number)>=0)){
   reasons.invalidValues++;continue;
  }
  const values=row as Record<typeof fields[number],number>;
  if(!(values.sessions>=values.cart&&values.cart>=values.checkout&&values.checkout>=values.purchases)){
   reasons.invalidOrder++;continue;
  }
  validRows.push(record);
  for(const key of fields) totals[key]+=values[key];
 }
 const totalsValid=fields.every(key=>Number.isFinite(totals[key]));
 const rates=fields.map((key,i)=>({ofSessions:totalsValid?websiteRate(totals[key],totals.sessions):null,fromPrevious:i>0&&totalsValid?websiteRate(totals[key],totals[fields[i-1]]):null}));
 return {...totals,validRows,validCount:validRows.length,excludedCount:records.length-validRows.length,reasons,totalsValid,rates,cvr:rates[3].ofSessions,cartToPurchase:totalsValid?websiteRate(totals.purchases,totals.cart):null};
}
export const metrics=(rows:Content[],visits:typeof traffic)=>{const websiteQuality=websiteMetrics(visits),ctrQuality=clickThroughRate(rows),impressions=sum(rows,r=>r.impressions),engagements=sum(rows,r=>r.engagements),clicks=sum(rows,r=>r.clicks),sessions=websiteQuality.sessions,purchases=websiteQuality.purchases;return {count:rows.length,impressions,engagements,clicks,engagementRate:engagementRate(rows).rate,erQuality:engagementRate(rows),ctr:ctrQuality.rate,ctrQuality,sessions,purchases,cvr:websiteQuality.cvr,websiteQuality,cart:websiteQuality.cart,checkout:websiteQuality.checkout}};
export const num=(n:number)=>new Intl.NumberFormat('en-US').format(n);
export const pct=(n:number)=>(n*100).toFixed(2)+'%';
