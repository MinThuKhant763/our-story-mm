import {api,config,bucket,ApiError} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>{const c=await config();if(!c.qrMime)throw new ApiError(404,'Merchant QR not configured.');const obj=await bucket().get('merchant/qr');if(!obj)throw new ApiError(404,'Merchant QR not configured.');return new Response(obj.body,{headers:{'Content-Type':c.qrMime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});});}

