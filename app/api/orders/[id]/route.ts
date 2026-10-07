import {api,origin,ownGift,db,bucket,imageFile,json,config,ApiError} from '@/lib/server';
import {plans} from '@/lib/gifts';
import {lastSixSchema} from '@/lib/payments';
type C={params:Promise<{id:string}>};
export async function POST(req:Request,c:C){return api(async()=>{
 origin(req);const {u,row}=await ownGift((await c.params).id);const cfg=await config();
 if(!cfg.enabled)throw new ApiError(400,'Payment collection is not available yet.');
 if(await db().prepare("SELECT id FROM orders WHERE gift_id=? AND status='pending'").bind(row.id).first())throw new ApiError(409,'A payment is already waiting for review.');
 const previous=row.paid_order_id?await db().prepare('SELECT plan,status FROM orders WHERE id=? AND gift_id=?').bind(row.paid_order_id,row.id).first<{plan:string;status:string}>():null;
 const renewal=previous?.status==='approved'&&previous.plan===row.plan;
 const price=renewal?plans[row.plan].renewalPrice:plans[row.plan].price;
 const form=await req.formData(),reference=lastSixSchema.parse(form.get('reference'));
 const {buf,mime}=await imageFile(form),id=crypto.randomUUID(),key='proofs/'+id;
 await bucket().put(key,buf,{httpMetadata:{contentType:mime}});
 try{
  const r=await db().prepare("INSERT INTO orders (id,gift_id,owner_id,reference,reference_kind,billing_period,kind,amount,plan,method,proof_key,proof_mime,status,note,created_at) SELECT ?,?,?,?,'last6','monthly',?,?,?,?,?,?,'pending','',? WHERE NOT EXISTS (SELECT id FROM orders WHERE gift_id=? AND status='pending')").bind(id,row.id,u.userId,reference,renewal?'renewal':'purchase',price,row.plan,cfg.method,key,mime,Date.now(),row.id).run();
  if(!r.meta.changes)throw new ApiError(409,'A payment is already waiting for review.');
 }catch(error){await bucket().delete(key);throw error;}
 return json({ok:true,id,amount:price,reference,referenceKind:'last6',billingPeriod:'monthly'},201);
});}
