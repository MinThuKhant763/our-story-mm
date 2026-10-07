import {AsyncLocalStorage} from 'node:async_hooks';
export interface Env {
  DB:D1Database; MEDIA:R2Bucket; APP_URL:string; OWNER_EMAIL:string;
  LOCAL_AUTH_UNVERIFIED?:string; RESEND_API_KEY?:string; EMAIL_FROM?:string;
  GOOGLE_CLIENT_ID?:string; GOOGLE_CLIENT_SECRET?:string;
  EMAIL_JOBS_ENABLED?:string; SUPPORT_EMAIL?:string; MAINTENANCE_MODE?:string;
}
type Scope={env:Env;request:Request;setCookies:string[]};
const scopes=new AsyncLocalStorage<Scope>();
export function scope(){const value=scopes.getStore();if(!value)throw Error('Missing Worker request context');return value;}
export function env(){return scope().env;}
export async function withRequest(bindings:Env,request:Request,handler:()=>Promise<Response>){
  const configured=new URL(bindings.APP_URL),received=new URL(request.url);
  const local=['localhost','127.0.0.1','[::1]'];
  if(received.origin!==configured.origin&&!(local.includes(configured.hostname)&&local.includes(received.hostname)&&received.protocol==='http:'))return Response.json({error:'This deployment is not configured for this address.'},{status:403,headers:{'Cache-Control':'no-store'}});
  return scopes.run({env:bindings,request,setCookies:[]},async()=>{
    const response=await handler();const result=new Response(response.body,response);
    for(const cookie of scope().setCookies)result.headers.append('Set-Cookie',cookie);
    result.headers.set('X-Content-Type-Options','nosniff');result.headers.set('Cache-Control','no-store');return result;
  });
}
export async function cookies(){return {
  get(name:string){const item=(scope().request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return item?{value:item.slice(name.length+1)}:undefined;},
  set(name:string,value:string,options:{httpOnly?:boolean;secure?:boolean;sameSite?:string;path?:string;maxAge?:number}){scope().setCookies.push(`${name}=${value}; Path=${options.path||'/'}; Max-Age=${options.maxAge||0}; SameSite=Lax${options.httpOnly?'; HttpOnly':''}${options.secure?'; Secure':''}`);},
  delete(name:string){scope().setCookies.push(`${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${env().APP_URL.startsWith('https:')?'; Secure':''}`);}
};}
