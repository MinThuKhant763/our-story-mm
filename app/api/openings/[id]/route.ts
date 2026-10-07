import {api,origin,user,db,json,ApiError} from '@/lib/server';
type C={params:Promise<{id:string}>};
export async function PATCH(req:Request,c:C){return api(async()=>{origin(req);const u=await user();const r=await db().prepare('UPDATE gift_openings SET read_at=COALESCE(read_at,?) WHERE gift_id=? AND gift_id IN (SELECT id FROM gifts WHERE owner_id=?)').bind(Date.now(),(await c.params).id,u.userId).run();if(!r.meta.changes)throw new ApiError(404,'Notification not found.');return json({ok:true});});}
