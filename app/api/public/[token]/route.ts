import {api,db,json,dto,canView,ApiError,type GiftRow} from '@/lib/server';
import {publicState} from '@/lib/gifts';
type C={params:Promise<{token:string}>};
export const dynamic='force-dynamic';
export async function GET(req:Request,c:C){return api(async()=>{const row=await db().prepare('SELECT * FROM gifts WHERE token=?').bind((await c.params).token).first<GiftRow>();if(!row||!publicState(row.status,row.expires_at,Date.now()))throw new ApiError(404,'This gift is unavailable or its hosting has ended.');if(row.reveal_at&&row.reveal_at>Date.now())return json({scheduled:true,revealAt:row.reveal_at});if(!await canView(row,req))return json({locked:true});const g=dto(row);return json({locked:false,gift:{...g,token:undefined,paidOrderId:undefined,plan:undefined,revision:undefined,createdAt:undefined,updatedAt:undefined}});});}

