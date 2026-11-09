export type ExperimentResult={type?:'Simulation'|'Actual';controlImpressions?:number;controlClicks?:number;treatmentImpressions?:number;treatmentClicks?:number;conclusion?:string;nextAction?:string};
export const resultCounts=['controlImpressions','controlClicks','treatmentImpressions','treatmentClicks'] as const;
export function resultError(value:unknown):string|null{
 if(value===undefined) return null;
 if(typeof value!=='object'||value===null||Array.isArray(value)) return 'Result must be a result record.';
 const r=value as Record<string,unknown>;
 if(r.type!==undefined&&!['Simulation','Actual'].includes(r.type as string)) return 'Choose Simulation, Actual, or leave Result Type blank.';
 for(const key of resultCounts){const n=r[key];if(n!==undefined&&(typeof n!=='number'||!Number.isSafeInteger(n)||n<0||(key.endsWith('Impressions')&&n===0))) return 'Impressions must be positive whole numbers; clicks must be non-negative whole numbers.';}
 for(const group of ['control','treatment']){const impressions=r[group+'Impressions'],clicks=r[group+'Clicks'];if(typeof impressions==='number'&&typeof clicks==='number'&&clicks>impressions) return 'Clicks cannot exceed impressions in either group.';}
 for(const key of ['conclusion','nextAction']) if(r[key]!==undefined&&(typeof r[key]!=='string'||(r[key] as string).length>1000)) return 'Conclusion and Next Action must be text of at most 1,000 characters each.';
 return null;
}
export function readExperimentResult(data:Pick<FormData,'get'>):ExperimentResult{
 const r:Record<string,unknown>={};
 for(const key of ['type',...resultCounts,'conclusion','nextAction']){
  const text=String(data.get('result.'+key)??'').trim();
  if(text!=='') r[key]=(resultCounts as readonly string[]).includes(key)?Number(text):text;
 }
 const error=resultError(r);if(error) throw new Error(error);
 return r as ExperimentResult;
}
export function summarizeResult(metric:string,result?:ExperimentResult){
 const label=result?.type==='Simulation'?'Simulation — simulated practice only, not real operating results.':result?.type==='Actual'?'Actual — user-marked source; not verified by the system.':'Result Type not specified — source unclassified.';
 if(metric!=='Social link CTR') return {label,message:'Not supported for automatic calculation for this metric.',stats:null};
 if(resultError(result)!==null||!result||!result.type||resultCounts.some(key=>result[key]===undefined)) return {label,message:'Insufficient result data — no effect calculated. Completed is a workflow status, not proof of success.',stats:null};
 const control=result.controlClicks!/result.controlImpressions!,treatment=result.treatmentClicks!/result.treatmentImpressions!;
 return {label,message:'Descriptive arithmetic only; no significance test, verified success or causal claim.',stats:{control,treatment,percentagePoints:(treatment-control)*100,relativeLift:control===0?null:(treatment-control)/control*100}};
}
