import {api,user,db,setup,bucket,ApiError} from '@/lib/server';
type C={params:Promise<{id:string}>};
export const dynamic='force-dynamic';
export async function GET(_req:Request,c:C){return api(async()=>{const u=await user(),s=await setup();const r=await db().prepare('SELECT * FROM orders WHERE id=?').bind((await c.params).id).first<{owner_id:string;proof_key:string;proof_mime:string}>();if(!r||(r.owner_id!==u.userId&&s?.owner_id!==u.userId))throw new ApiError(404,'Receipt not found.');const obj=await bucket().get(r.proof_key);if(!obj)throw new ApiError(404,'Receipt not found.');return new Response(obj.body,{headers:{'Content-Type':r.proof_mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});});}

