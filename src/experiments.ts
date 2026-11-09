import {isValidDate} from './dates.ts';
import {resultError,type ExperimentResult} from './experiment-results.ts';
export type ExperimentPlan={controlGroup?:string;treatmentGroup?:string;baseline?:number;startDate?:string;endDate?:string;successCriteria?:string};
export type Experiment=ExperimentPlan&{id:number;name:string;hypothesis:string;metric:string;status:string;result?:ExperimentResult};
export function planError(plan:ExperimentPlan):string|null{
 for(const [key,label] of [['controlGroup','Control Group'],['treatmentGroup','Treatment Group'],['successCriteria','Success Criteria']] as const){
  if(plan[key]!==undefined&&(typeof plan[key]!=='string'||plan[key]!.length>500)) return `${label} must be text of at most 500 characters.`;
 }
 if(plan.baseline!==undefined&&(typeof plan.baseline!=='number'||!Number.isFinite(plan.baseline)||plan.baseline<0||plan.baseline>100)) return 'Baseline must be a percentage number from 0 to 100, or left blank.';
 for(const key of ['startDate','endDate'] as const) if(plan[key]!==undefined&&plan[key]!==''&&!isValidDate(plan[key])) return 'Dates must be real calendar dates in YYYY-MM-DD format.';
 if(plan.startDate&&plan.endDate&&plan.endDate<plan.startDate) return 'End Date must be on or after Start Date.';
 return null;
}
export function readExperimentPlan(data:Pick<FormData,'get'>):ExperimentPlan{
 const text=(key:string)=>String(data.get(key)??'').trim();
 const baseline=text('baseline');
 const plan={controlGroup:text('controlGroup'),treatmentGroup:text('treatmentGroup'),successCriteria:text('successCriteria'),startDate:text('startDate'),endDate:text('endDate'),baseline:baseline===''?undefined:Number(baseline)};
 const error=planError(plan);if(error) throw new Error(error);
 return plan;
}
export const EXPERIMENTS_KEY='content2commerce.experiments.v1';
export const demoExperiments:Experiment[]=[
 {id:1,name:'Lead with the product in the first 2 seconds',hypothesis:'An early product reveal may improve social link CTR.',metric:'Social link CTR',status:'Running'},
 {id:2,name:'Test a benefit-led product headline',hypothesis:'A clearer benefit may improve site purchase conversion.',metric:'Site purchase conversion',status:'Planned'},
];
type StorageAccess=()=>Pick<Storage,'getItem'|'setItem'>;
const browserStorage:StorageAccess=()=>window.localStorage;
export function validExperiments(value:unknown):value is Experiment[]{
 if(!Array.isArray(value)) return false;
 const ids=new Set<number>();
 return value.every(row=>{
  if(typeof row!=='object'||row===null) return false;
  const {id,name,hypothesis,metric,status}=row;
  if(!Number.isSafeInteger(id)||id<0||ids.has(id)) return false;
  ids.add(id);
  if(planError(row)!==null) return false;
  if(resultError(row.result)!==null) return false;
  return typeof name==='string'&&name.trim().length>0&&name.length<=120&&typeof hypothesis==='string'&&hypothesis.trim().length>0&&hypothesis.length<=500&&['Social link CTR','Social engagement rate','Site purchase conversion','Cart-to-purchase completion'].includes(metric)&&['Planned','Running','Completed'].includes(status);
 });
}
export type ExperimentState={records:Experiment[];blocked:boolean;message:string};
export function editExperiment(records:Experiment[],id:number,draft:Pick<Experiment,'name'|'hypothesis'|'metric'>&ExperimentPlan&{result?:ExperimentResult}){
 const original=records.find(row=>row.id===id);
 if(!original) throw new Error('Experiment no longer exists.');
 const updated={...original,...draft,id:original.id,status:original.status,name:draft.name.trim(),hypothesis:draft.hypothesis.trim(),metric:draft.metric};
 const error=planError(updated);if(error) throw new Error(error);
 const resultIssue=resultError(updated.result);if(resultIssue) throw new Error(resultIssue);
 if(!validExperiments([updated])) throw new Error('Enter a name (1–120 characters), hypothesis (1–500 characters), and a valid metric.');
 return records.map(row=>row.id===id?updated:row);
}
export function deleteExperiment(records:Experiment[],id:number,confirmed:boolean){
 return confirmed?records.filter(row=>row.id!==id):records;
}
export function loadExperiments(access:StorageAccess=browserStorage):ExperimentState{
 const fallback=()=>demoExperiments.map(row=>({...row}));
 try{
  const raw=access().getItem(EXPERIMENTS_KEY);
  if(raw===null) return {records:fallback(),blocked:false,message:''};
  const records:unknown=JSON.parse(raw);
  if(!validExperiments(records)) throw new Error('Invalid saved fields');
  return {records,blocked:false,message:''};
 }catch{
  return {records:fallback(),blocked:true,message:'Saved experiments could not be read or validated. Demo records are shown. Existing storage has not been overwritten. Changes will remain temporary until you resolve browser storage and reload; back up any existing stored value before clearing this experiment key.'};
 }
}
export function saveExperiments(records:Experiment[],blocked:boolean,access:StorageAccess=browserStorage){
 if(blocked) return {blocked:true,message:'Local saving is paused after a read failure. Changes are temporary and will be lost on reload. Existing stored data has not been overwritten.'};
 if(!validExperiments(records)) return {blocked:false,message:'These experiment fields could not be validated. Changes have not been saved.'};
 try{
  const storage=access();
  const raw=storage.getItem(EXPERIMENTS_KEY);
  if(raw!==null&&!validExperiments(JSON.parse(raw))) throw new Error('Invalid existing data');
  storage.setItem(EXPERIMENTS_KEY,JSON.stringify(records));
  return {blocked:false,message:'Saved in this browser on this device.'};
 }catch{
  return {blocked:true,message:'Local saving failed (storage unavailable, full, or existing data invalid). Changes are temporary. Existing stored data has not been overwritten; resolve storage and reload before saving again.'};
 }
}
