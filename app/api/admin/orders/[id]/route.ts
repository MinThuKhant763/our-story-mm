import {hostingExpiry,type BillingPeriod} from '@/lib/hosting';
import {z} from 'zod';
import {api,origin,admin,db,json,audit,ApiError} from '@/lib/server';
import {merchantReferenceMatches,merchantTransactionSchema} from '@/lib/payments';
type C={params:Promise<{id:string}>};
export async function POST(req:Request,c:C){return api(async()=>{
 origin(req);const {u}=await admin();const id=(await c.params).id;
 const b=z.object({action:z.enum(['approve','reject','refund']),confirmed:z.boolean().default(false),amountReceived:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),merchantTransactionId:z.string().optional(),note:z.string().trim().min(1,'Add a verification note.').max(1000)}).parse(await req.json());
 const o=await db().prepare('SELECT * FROM orders WHERE id=?').bind(id).first<{id:string;gift_id:string;status:string;amount:number;reference:string;reference_kind:string;method:string;kind:string;billing_period:BillingPeriod}>();
 if(!o)throw new ApiError(404,'Order not found.');
 if(b.action==='approve'){
  if(o.status!=='pending')throw new ApiError(409,'This order was already reviewed.');
  const gift=await db().prepare('SELECT expires_at FROM gifts WHERE id=?').bind(o.gift_id).first<{expires_at:number|null}>();
  if(!gift)throw new ApiError(409,'This gift was deleted. Reject the payment and arrange any needed refund.');
  if(!b.confirmed||b.amountReceived!==o.amount)throw new ApiError(400,'Confirm the actual merchant transaction and exact amount.');
  const fullId=merchantTransactionSchema.parse(b.merchantTransactionId);
  if(!merchantReferenceMatches(o.reference_kind,o.reference,fullId))throw new ApiError(400,o.reference_kind==='last6'?'The complete merchant transaction ID must end with the customer’s 6 digits.':'The merchant transaction ID must match this legacy full reference exactly.');
  const used=await db().prepare('SELECT id FROM orders WHERE method=? AND merchant_transaction_id=?').bind(o.method,fullId).first();
  if(used)throw new ApiError(409,'This merchant transaction has already funded an order.');
  const now=Date.now(),expiresAt=hostingExpiry(now,gift.expires_at,o.kind,o.billing_period);
  const result=await db().batch([
   db().prepare("UPDATE orders SET status='approved',merchant_transaction_id=?,note=?,approved_at=?,reviewed_at=? WHERE id=? AND status='pending' AND EXISTS (SELECT id FROM gifts WHERE id=?) AND NOT EXISTS (SELECT id FROM orders WHERE method=? AND merchant_transaction_id=?)").bind(fullId,b.note,now,now,id,o.gift_id,o.method,fullId),
   db().prepare("UPDATE gifts SET plan=(SELECT plan FROM orders WHERE id=?),expires_at=CASE WHEN paid_order_id=? THEN expires_at ELSE ? END,paid_order_id=?,updated_at=? WHERE id=? AND EXISTS (SELECT id FROM orders WHERE id=? AND status='approved' AND merchant_transaction_id=? AND approved_at=?)").bind(id,id,expiresAt,id,now,o.gift_id,id,fullId,now)
  ]);
  if(!result[0].meta.changes)throw new ApiError(409,'This order was already reviewed or the merchant transaction was already used.');
 }else if(b.action==='reject'){
  if(o.status!=='pending')throw new ApiError(409,'This order was already reviewed.');
  const result=await db().prepare("UPDATE orders SET status='rejected',note=?,reviewed_at=? WHERE id=? AND status='pending'").bind(b.note,Date.now(),id).run();
  if(!result.meta.changes)throw new ApiError(409,'This order was already reviewed.');
 }else{
  if(o.status!=='approved'||!b.confirmed)throw new ApiError(400,'Confirm that the external refund was completed.');
  await db().batch([db().prepare("UPDATE orders SET status='refunded',note=?,reviewed_at=? WHERE id=? AND status='approved'").bind(b.note,Date.now(),id),db().prepare("UPDATE gifts SET status='draft',expires_at=NULL,paid_order_id=NULL,revision=revision+1,updated_at=? WHERE paid_order_id=?").bind(Date.now(),id)]);
 }
 await audit(u.userId,b.action,id,b.note);return json({ok:true});
});}
