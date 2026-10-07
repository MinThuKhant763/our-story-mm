export type BillingPeriod='monthly'|'annual';
const yangonOffset=23400000;
/** Add a calendar month in Myanmar time, clamping Jan 31 to Feb 28/29.
 * Preserve the local hour/minute/second and do not depend on server timezone. */
export function addYangonMonth(timestamp:number){
 if(!Number.isSafeInteger(timestamp))throw new Error('Invalid hosting timestamp');
 const shifted=new Date(timestamp+yangonOffset),day=shifted.getUTCDate();
 shifted.setUTCDate(1);shifted.setUTCMonth(shifted.getUTCMonth()+1);
 const lastDay=new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth()+1,0)).getUTCDate();
 shifted.setUTCDate(Math.min(day,lastDay));
 return shifted.getTime()-yangonOffset;
}
export function hostingExpiry(now:number,existingExpiry:number|null,kind:string,period:BillingPeriod){
 const start=kind==='renewal'?Math.max(existingExpiry||0,now):now;
 if(period==='monthly')return addYangonMonth(start);
 // Honor the exact 365-day contract of orders quoted before monthly plans.
 if(period==='annual')return start+31536000000;
 throw new Error('Unknown hosting period');
}
