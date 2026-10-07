import type {BoxConfig} from './box';
import { z } from 'zod';
import {musicSchema,defaultMusic} from './music.ts';
import {occasionSchema} from './occasions.ts';
export const templateIds=['bloom','film','night','scrapbook','aurora','garden'] as const;
export const templateSchema=z.enum(templateIds);
export type TemplateId=typeof templateIds[number];
export function isTemplateId(value:string):value is TemplateId{return (templateIds as readonly string[]).includes(value);}
export const templates=[
{id:'bloom',name:'Softly, always',description:'Soft rose tones & a love letter.',tag:'ROMANTIC',color:'#f0ddd6',image:'/images/occasions/anniversary.webp'},
{id:'film',name:'The little things',description:'A nostalgic album of your favorite days.',tag:'TIMELESS',color:'#ded1b6',image:'/images/templates/film.webp'},
{id:'night',name:'Written in the stars',description:'A little midnight magic, just for you two.',tag:'DREAMY',color:'#263e3d',image:'/images/templates/night.webp'},
{id:'scrapbook',name:'Little love notes',description:'Layered Polaroids, paper textures & flip-over memories.',tag:'PLAYFUL',color:'#efe2cb',image:'/images/templates/scrapbook.webp'},
{id:'aurora',name:'Under the same sky',description:'A luminous photo orbit & an unfolding memory journey.',tag:'LUMINOUS',color:'#22223f',image:'/images/templates/aurora.webp'},
{id:'garden',name:'Love in full bloom',description:'A botanical arch & memories revealed petal by petal.',tag:'BOTANICAL',color:'#e5ecd9',image:'/images/templates/garden.webp'}
] as const;
export type Plan='basic'|'premium';
export const plans={basic:{price:3000,renewalPrice:3000,photos:10},premium:{price:5000,renewalPrice:5000,photos:30}};
export function validDate(value:string){const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value&&value>='1900-01-01'&&value<='2100-12-31';}
export const contentSchema=z.object({music:musicSchema.default(defaultMusic),occasion:occasionSchema.default('anniversary'),yourName:z.string().trim().min(1,'Please enter your name.').max(60),partnerName:z.string().trim().min(1,'Please enter their name.').max(60),title:z.string().trim().max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validDate,'Choose a valid occasion date.'),letter:z.string().max(8000),photoIds:z.array(z.string().uuid()).max(30),timeline:z.array(z.object({date:z.string().max(32),title:z.string().trim().min(1).max(100),note:z.string().max(500)})).max(5)});
export type GiftContent=z.infer<typeof contentSchema>;
export type Gift={id:string;token:string;template:TemplateId;plan:Plan;status:string;content:GiftContent;revision:number;hasPin:boolean;box?:BoxConfig;revealAt?:number|null;voiceId?:string|null;voiceUrl?:string|null;expiresAt:number|null;paidOrderId?:string|null;createdAt:number;updatedAt:number;photos:{id:string;url:string}[]};
export type PaymentConfig={enabled:boolean;merchantName:string;method:string;accountNumber:string;instructions:string;qrMime?:string};
export type Order={id:string;giftId:string;reference:string;referenceKind?:'legacy'|'last6';merchantTransactionId?:string|null;amount:number;plan:Plan;method:string;kind?:string;billingPeriod?:'monthly'|'annual';status:string;note:string;createdAt:number;approvedAt:number|null;reviewedAt?:number|null;proofUrl?:string};
export const emptyContent:GiftContent={music:{...defaultMusic},occasion:'anniversary',yourName:'',partnerName:'',title:'Every day, I choose you.',date:'',letter:'',photoIds:[],timeline:[]};
export const demoContent:GiftContent={music:{...defaultMusic},occasion:'anniversary',yourName:'Htet',partnerName:'May',title:'Every day, I choose you.',date:'2023-10-14',letter:'To my favorite person,\n\nSome of my favorite moments are the simplest ones. A quiet walk. Your hand in mine. The way you make an ordinary day feel a little more beautiful.\n\nThank you for being my home, my laughter, and my favorite story. Here’s to all the little moments we haven’t lived yet.\n\nAlways yours,\nHtet',photoIds:[],timeline:[{date:'October 2023',title:'The beginning of us',note:'One hello, and everything felt different.'},{date:'December 2023',title:'Our first little adventure',note:'A sunset, a long walk, and nowhere else we wanted to be.'}]};
export function togetherDays(date:string,now=new Date()){if(!validDate(date))return 0;const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yangon',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const part=(t:string)=>parts.find(p=>p.type===t)?.value;const today=part('year')+'-'+part('month')+'-'+part('day');return Math.max(0,Math.floor((new Date(today+'T00:00:00Z').getTime()-new Date(date+'T00:00:00Z').getTime())/86400000));}
export function prettyDate(date:string,lang:'en'|'my'='en'){return validDate(date)?new Intl.DateTimeFormat(lang==='my'?'my-MM':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Yangon'}).format(new Date(date+'T00:00:00Z')):lang==='my'?'သင့်အမှတ်တရနေ့':'Your special day';}
export function mmk(n:number){return n.toLocaleString('en-US')+' MMK';}
export function publicState(status:string,expiresAt:number|null,now:number){return (status==='published'||status==='test')&&expiresAt!==null&&expiresAt>now;}

export function nextAnniversaryDays(date:string,now=new Date()){if(!validDate(date))return 0;const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yangon',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const p=(t:string)=>parts.find(x=>x.type===t)!.value;const today=p('year')+'-'+p('month')+'-'+p('day');let year=Math.max(Number(p('year')),Number(date.slice(0,4)));const candidate=(y:number)=>{let d=String(y)+date.slice(4);if(!validDate(d))d=String(y)+'-03-01';return d;};let target=candidate(year);if(target<today)target=candidate(++year);return Math.round((new Date(target+'T00:00:00Z').getTime()-new Date(today+'T00:00:00Z').getTime())/86400000);}

export function yangonInput(timestamp:number|null|undefined){return timestamp?new Date(timestamp+23400000).toISOString().slice(0,16):'';}
export function revealTimestamp(input:string){return input?new Date(input+':00+06:30').getTime():null;}
