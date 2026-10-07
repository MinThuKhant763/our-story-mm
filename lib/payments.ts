import {z} from 'zod';
export function normalizeTransactionDigits(value:string){return value.replace(/[၀-၉]/g,char=>String(char.charCodeAt(0)-0x1040)).trim();}
export const lastSixSchema=z.preprocess(value=>typeof value==='string'?normalizeTransactionDigits(value):value,z.string().regex(/^[0-9]{6}$/,'Enter exactly the last 6 digits of your transaction ID.'));
export const merchantTransactionSchema=z.string().transform(value=>normalizeTransactionDigits(value).toUpperCase()).pipe(z.string().regex(/^[A-Z0-9-]{6,100}$/,'Enter the complete transaction ID from your merchant account.'));
export function merchantReferenceMatches(kind:string,reference:string,fullId:string){return kind==='last6'?/^[0-9]{6}$/.test(reference)&&fullId.length>6&&fullId.endsWith(reference):fullId===reference;}
