import {api,user,db,json} from '@/lib/server';
export async function GET(){return api(async()=>{
 const u=await user();
 const rows=await db().prepare(`SELECT o.gift_id AS giftId,o.opened_at AS openedAt,o.read_at AS readAt,o.email_status AS emailStatus,g.content
 FROM gift_openings o JOIN gifts g ON g.id=o.gift_id WHERE g.owner_id=? ORDER BY o.opened_at DESC LIMIT 100`).bind(u.userId).all<{giftId:string;openedAt:number;readAt:number|null;emailStatus:string;content:string}>();
 const unread=await db().prepare('SELECT COUNT(*) AS count FROM gift_openings o JOIN gifts g ON g.id=o.gift_id WHERE g.owner_id=? AND o.read_at IS NULL').bind(u.userId).first<{count:number}>();
 return json({unread:unread?.count||0,items:rows.results.map(({content,...item})=>({...item,giftTitle:JSON.parse(content).title||'OurStory gift'}))});
});}
