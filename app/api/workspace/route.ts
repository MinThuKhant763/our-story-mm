import {api,user,db,setup,config,json} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>{const u=await user();const s=await setup();const rows=await db().prepare('SELECT * FROM orders WHERE owner_id=? ORDER BY created_at DESC').bind(u.userId).all<Record<string,unknown>>();return json({name:u.displayName,email:u.email,isAdmin:s?.owner_id===u.userId,setupNeeded:!s,config:await config(),orders:rows.results.map(r=>({id:r.id,giftId:r.gift_id,reference:r.reference,referenceKind:r.reference_kind,billingPeriod:r.billing_period,amount:r.amount,plan:r.plan,method:r.method,kind:r.kind,status:r.status,note:r.note,createdAt:r.created_at,approvedAt:r.approved_at,reviewedAt:r.reviewed_at,proofUrl:'/api/orders/'+r.id+'/proof'}))});});}

