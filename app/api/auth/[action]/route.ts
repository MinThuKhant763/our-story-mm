import {api,origin,json} from '@/lib/server';
import {logout} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function POST(req:Request,context:{params:Promise<{action:string}>}){return api(async()=>{origin(req);const {action}=await context.params;if(action!=='logout')return json({error:'Email and password authentication is no longer available.'},410);await logout();return json({ok:true});});}
