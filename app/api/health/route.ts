import {database} from '@/lib/storage';
import {env} from '@/lib/runtime';
export const dynamic='force-dynamic';
export async function GET(){try{await database().prepare('SELECT g.revision,p.opening_notifications,o.opened_at FROM gifts g JOIN profiles p ON p.user_id=g.owner_id LEFT JOIN gift_openings o ON o.gift_id=g.id LIMIT 0').all();await env().MEDIA.head('merchant/qr');return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}}
