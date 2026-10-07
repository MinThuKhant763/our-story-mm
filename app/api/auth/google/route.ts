import {randomUUID} from 'node:crypto';
import {api,db} from '@/lib/server';
import {cookies,env} from '@/lib/runtime';
import {appOrigin,createSession,safeReturn} from '@/lib/auth';
export const dynamic='force-dynamic';
const STATE_COOKIE='ourstory_google_state';
const callback=()=>appOrigin()+'/api/auth/google';
function redirect(path:string){return Response.redirect(appOrigin()+path,302);}
async function challenge(verifier:string){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function failure(reason:string,status?:number){
  console.warn('Google sign-in failed',JSON.stringify({reason,...(status===undefined?{}:{status})}));
  return redirect('/login?error='+(reason==='consent_denied'?'google_cancelled':'google_failed')+'&reason='+encodeURIComponent(reason));
}
export async function GET(req:Request){return api(async()=>{
  const url=new URL(req.url),cfg=env();
  if(url.searchParams.has('code')){
    const state=url.searchParams.get('state')||'',stored=(await cookies()).get(STATE_COOKIE)?.value||'';
    (await cookies()).delete(STATE_COOKIE);
    const [expected,returnEncoded,verifier]=stored.split('~');
    if(!expected||state!==expected)return failure(expected?'state_mismatch':'state_cookie_missing');
    if(!verifier||!/^[-A-Za-z0-9_]{43,128}$/.test(verifier))return failure('state_cookie_invalid');
    let returnTo='/dashboard';
    try{returnTo=safeReturn(decodeURIComponent(returnEncoded||''));}catch{return failure('return_path_invalid');}
    if(!cfg.GOOGLE_CLIENT_ID||!cfg.GOOGLE_CLIENT_SECRET)return redirect('/login?error=google_not_configured');
    let tokenResponse:Response;
    try{tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:url.searchParams.get('code')||'',client_id:cfg.GOOGLE_CLIENT_ID,client_secret:cfg.GOOGLE_CLIENT_SECRET,redirect_uri:callback(),grant_type:'authorization_code',code_verifier:verifier}),signal:AbortSignal.timeout(10000)});}catch{return failure('token_exchange_unavailable');}
    if(!tokenResponse.ok)return failure('token_exchange_rejected',tokenResponse.status);
    let tokenData:{access_token?:unknown};
    try{tokenData=await tokenResponse.json() as typeof tokenData;}catch{return failure('token_response_invalid');}
    if(!tokenData||typeof tokenData.access_token!=='string'||!tokenData.access_token)return failure('access_token_missing');
    let profileResponse:Response;
    try{profileResponse=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+tokenData.access_token},signal:AbortSignal.timeout(10000)});}catch{return failure('profile_request_unavailable');}
    if(!profileResponse.ok)return failure('profile_request_rejected',profileResponse.status);
    let profile:{id?:unknown;email?:unknown;verified_email?:unknown;name?:unknown};
    try{profile=await profileResponse.json() as typeof profile;}catch{return failure('profile_response_invalid');}
    const email=typeof profile?.email==='string'?profile.email.trim().toLowerCase():'';
    if(typeof profile?.id!=='string'||!profile.id||!email||profile.verified_email!==true)return failure('profile_unverified_or_incomplete');
    let account=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first<{id:string}>();
    if(!account){
      const id=randomUUID(),displayName=(typeof profile.name==='string'?profile.name:email.split('@')[0]).trim().slice(0,60)||'OurStory user';
      await db().prepare('INSERT INTO users (id,email,display_name,password_hash,verified,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(email) DO NOTHING').bind(id,email,displayName,'google-oauth',Date.now()).run();
      account=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first<{id:string}>();
    }
    if(!account)return failure('account_lookup_failed');
    await db().prepare('UPDATE users SET verified=1 WHERE id=?').bind(account.id).run();
    await createSession(account.id);
    return redirect(returnTo);
  }
  const oauthError=url.searchParams.get('error');
  if(oauthError){(await cookies()).delete(STATE_COOKIE);return failure(oauthError==='access_denied'?'consent_denied':'provider_error');}
  if(!cfg.GOOGLE_CLIENT_ID||!cfg.GOOGLE_CLIENT_SECRET)return redirect('/login?error=google_not_configured');
  const state=randomUUID(),verifier=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-',''),returnTo=safeReturn(url.searchParams.get('return_to')||'/dashboard');
  (await cookies()).set(STATE_COOKIE,state+'~'+encodeURIComponent(returnTo)+'~'+verifier,{httpOnly:true,secure:appOrigin().startsWith('https:'),sameSite:'lax',path:'/',maxAge:600});
  const authorize=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorize.search=new URLSearchParams({client_id:cfg.GOOGLE_CLIENT_ID,redirect_uri:callback(),response_type:'code',scope:'openid email profile',state,code_challenge:await challenge(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();
  return Response.redirect(authorize.toString(),302);
});}
