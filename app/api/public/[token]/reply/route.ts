import {api,origin,db,json,canView,ApiError,type GiftRow} from '@/lib/server';
import {readBox} from '@/lib/box';
import {replySchema} from '@/lib/replies';
type C={params:Promise<{token:string}>};
export async function POST(req:Request,c:C){return api(async()=>{
 origin(req);const row=await db().prepare('SELECT * FROM gifts WHERE token=?').bind((await c.params).token).first<GiftRow>();
 if(!row||!await canView(row,req))throw new ApiError(404,'Open this available gift before sending a reply.');
 if(!readBox(row.box_config).allowReply)throw new ApiError(403,'Replies are disabled for this gift.');
 const text=await req.text();if(new TextEncoder().encode(text).length>16384)throw new ApiError(413,'Your reply is too large.');
 let value:unknown;try{value=JSON.parse(text);}catch{throw new ApiError(400,'Enter a valid reply.');}
 const b=replySchema.parse(value),now=Date.now(),id=crypto.randomUUID();
 const result=await db().prepare(`INSERT OR IGNORE INTO recipient_replies (id,gift_id,request_id,sender_name,message,created_at)
 SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM gifts WHERE id=? AND revision=? AND status IN ('published','test') AND expires_at>? AND (reveal_at IS NULL OR reveal_at<=?) AND json_extract(box_config,'$.allowReply')=1) AND (SELECT COUNT(*) FROM recipient_replies WHERE gift_id=? AND created_at>?)<5 AND (SELECT COUNT(*) FROM recipient_replies WHERE gift_id=?)<200`).bind(id,row.id,b.requestId,b.name,b.message,now,row.id,row.revision,now,now,row.id,now-86400000,row.id).run();
 if(!result.meta.changes){const current=await db().prepare('SELECT revision FROM gifts WHERE id=?').bind(row.id).first<{revision:number}>();if(!current||current.revision!==row.revision)throw new ApiError(404,'This gift changed. Open it again before replying.');const existing=await db().prepare('SELECT sender_name,message FROM recipient_replies WHERE gift_id=? AND request_id=?').bind(row.id,b.requestId).first<{sender_name:string;message:string}>();if(existing){if(existing.sender_name!==b.name||existing.message!==b.message)throw new ApiError(409,'This reply request was already saved with different text. Start a new note.');return json({ok:true});}throw new ApiError(429,'This gift has reached its reply limit. Please try another day.');}
 return json({ok:true},201);
});}
