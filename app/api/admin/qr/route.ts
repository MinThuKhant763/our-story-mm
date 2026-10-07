import {api,origin,admin,db,bucket,imageFile,json,audit} from '@/lib/server';
export async function POST(req:Request){return api(async()=>{origin(req);const {u,s}=await admin();const {buf,mime}=await imageFile(await req.formData());await bucket().put('merchant/qr',buf,{httpMetadata:{contentType:mime}});await db().prepare("UPDATE settings SET config=? WHERE id='workspace'").bind(JSON.stringify({...JSON.parse(s.config),qrMime:mime})).run();await audit(u.userId,'merchant-qr','workspace');return json({ok:true});});}

