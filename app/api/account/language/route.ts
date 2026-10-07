import {z} from 'zod';
import {api,origin,user,db,json} from '@/lib/server';
export async function PUT(req:Request){return api(async()=>{origin(req);const u=await user();const {language}=z.object({language:z.enum(['en','my'])}).parse(await req.json());await db().prepare('INSERT INTO profiles (user_id,display_name,language,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language,updated_at=excluded.updated_at').bind(u.userId,u.displayName,language,Date.now()).run();return json({ok:true});});}
