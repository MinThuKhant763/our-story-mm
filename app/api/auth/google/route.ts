import {randomUUID} from 'node:crypto';
import {api,db,json} from '@/lib/server';
import {cookies,env} from '@/lib/runtime';
import {appOrigin,createSession,safeReturn} from '@/lib/auth';
export const dynamic='force-dynamic';
const STATE_COOKIE='ourstory_google_state';
const callback=()=>appOrigin()+'/api/auth/google';
function redirect(path:string){return Response.redirect(appOrigin()+path,302);}
export async function GET(req:Request){return api(async()=>{
  const url=new URL(req.url),cfg=env();
  if(url.searchParams.has('code')){
    const state=url.searchParams.get('state')||'',stored=(await cookies()).get(STATE_COOKIE)?.value||'';
    (await cookies()).delete(STATE_COOKIE);
    const [expected,returnEncoded]=stored.split('~');
    if(!expected||state!==expected)return redirect('/login?error=google_failed');
    let returnTo='/dashboard';
    try{returnTo=safeReturn(decodeURIComponent(returnEncoded||''));}catch{return redirect('/login?error=google_failed');}
    if(!cfg.GOOGLE_CLIENT_ID||!cfg.GOOGLE_CLIENT_SECRET)return redirect('/login?error=google_not_configured');
    const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:url.searchParams.get('code')||'',client_id:cfg.GOOGLE_CLIENT_ID,client_secret:cfg.GOOGLE_CLIENT_SECRET,redirect_uri:callback(),grant_type:'authorization_code'}),signal:AbortSignal.timeout(10000)});
    if(!tokenResponse.ok)return redirect('/login?error=google_failed');
    const tokenData=await tokenResponse.json() as {access_token?:string};
    if(!tokenData.access_token)return redirect('/login?error=google_failed');
    const profileResponse=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+tokenData.access_token},signal:AbortSignal.timeout(10000)});
    if(!profileResponse.ok)return redirect('/login?error=google_failed');
    const profile=await profileResponse.json() as {id?:string;email?:string;verified_email?:boolean;name?:string};
    const email=profile.email?.trim().toLowerCase();
    if(!profile.id||!email||!profile.verified_email)return redirect('/login?error=google_failed');
    let account=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first<{id:string}>();
    if(!account){
      const id=randomUUID(),displayName=(profile.name||email.split('@')[0]).trim().slice(0,60)||'OurStory user';
      await db().prepare('INSERT INTO users (id,email,display_name,password_hash,verified,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(email) DO NOTHING').bind(id,email,displayName,'google-oauth',Date.now()).run();
      account=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first<{id:string}>();
    }
    if(!account)return redirect('/login?error=google_failed');
    await db().prepare('UPDATE users SET verified=1 WHERE id=?').bind(account.id).run();
    await createSession(account.id);
    return redirect(returnTo);
  }
  const oauthError=url.searchParams.get('error');
  if(oauthError)return redirect('/login?error=google_failed');
  if(!cfg.GOOGLE_CLIENT_ID||!cfg.GOOGLE_CLIENT_SECRET)return redirect('/login?error=google_not_configured');
  const state=randomUUID(),returnTo=safeReturn(url.searchParams.get('return_to')||'/dashboard');
  (await cookies()).set(STATE_COOKIE,state+'~'+encodeURIComponent(returnTo),{httpOnly:true,secure:appOrigin().startsWith('https:'),sameSite:'lax',path:'/',maxAge:600});
  const authorize=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorize.search=new URLSearchParams({client_id:cfg.GOOGLE_CLIENT_ID,redirect_uri:callback(),response_type:'code',scope:'openid email profile',state,prompt:'select_account'}).toString();
  return Response.redirect(authorize.toString(),302);
});}
