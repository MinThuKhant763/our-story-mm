import {api,origin,db,json,canView,ApiError,type GiftRow} from '@/lib/server';
import {getCurrentUser} from '@/lib/auth';
type C={params:Promise<{token:string}>};
export async function POST(req:Request,c:C){return api(async()=>{
 origin(req);
 const row=await db().prepare('SELECT * FROM gifts WHERE token=?').bind((await c.params).token).first<GiftRow>();
 if(!row||!await canView(row,req))throw new ApiError(404,'Open this available gift first.');
 // Signed-in creator previews never consume the one-time recipient notification.
 const viewer=await getCurrentUser();if(viewer?.userId===row.owner_id)return json({ok:true});
 const now=Date.now();
 const result=await db().prepare(`INSERT OR IGNORE INTO gift_openings(gift_id,opened_at,email_status)
 SELECT g.id,?,CASE WHEN u.verified=1 AND p.opening_notifications=1 THEN 'pending' ELSE 'disabled' END
 FROM gifts g JOIN users u ON u.id=g.owner_id LEFT JOIN profiles p ON p.user_id=g.owner_id
 WHERE g.id=? AND g.revision=? AND g.status IN ('published','test') AND g.expires_at>?
 AND (g.reveal_at IS NULL OR g.reveal_at<=?)`).bind(now,row.id,row.revision,now,now).run();
 if(!result.meta.changes){const current=await db().prepare('SELECT revision FROM gifts WHERE id=?').bind(row.id).first<{revision:number}>();if(!current||current.revision!==row.revision)throw new ApiError(404,'This gift changed. Open it again.');}
 return json({ok:true});
});}
