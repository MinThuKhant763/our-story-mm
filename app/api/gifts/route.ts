import {boxSchema,defaultBox} from '@/lib/box';
import {z} from 'zod';
import {api,user,origin,db,json,dto,languageFor,type GiftRow} from '@/lib/server';
import {emptyContent,templateSchema} from '@/lib/gifts';
import {occasionSchema,occasionPreset,occasionWords,occasionLetter,presetBox} from '@/lib/occasions';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>{const u=await user();const rows=await db().prepare('SELECT * FROM gifts WHERE owner_id=? ORDER BY updated_at DESC').bind(u.userId).all<GiftRow>();return json(rows.results.map(dto));});}
export async function POST(req:Request){return api(async()=>{origin(req);const u=await user();const b=z.object({occasion:occasionSchema.optional(),template:templateSchema.optional(),plan:z.enum(['basic','premium']).default('basic'),box:boxSchema.optional()}).parse(await req.json());const lang=await languageFor(u.userId);const preset=occasionPreset(b.occasion);const content=b.occasion?{...emptyContent,occasion:b.occasion,title:occasionWords(b.occasion,lang).title,letter:occasionLetter(b.occasion,lang)}:{...emptyContent,title:lang==='my'?'နေ့တိုင်း မင်းကိုပဲ ရွေးချယ်တယ်။':emptyContent.title};const id=crypto.randomUUID(),token=crypto.randomUUID().replaceAll('-',''),now=Date.now();await db().prepare('INSERT INTO gifts (id,owner_id,token,content,template,plan,status,revision,box_config,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,?,?)').bind(id,u.userId,token,JSON.stringify(content),b.template||preset.template,b.plan,'draft',JSON.stringify(b.box||(b.occasion?presetBox(b.occasion):defaultBox)),now,now).run();const row=await db().prepare('SELECT * FROM gifts WHERE id=?').bind(id).first<GiftRow>();return json(dto(row!),201);});}

