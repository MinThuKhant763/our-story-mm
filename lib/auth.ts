import {cookies,env} from './runtime';
import {randomBytes,createHash} from 'node:crypto';
import {database} from './storage';
export type AppUser={userId:string;displayName:string;email:string;fullName:string|null};
export const SESSION_COOKIE='ourstory_session';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function appOrigin(){return new URL(env().APP_URL||'http://localhost:3000').origin;}
export function localUnverifiedAllowed(){return env().LOCAL_AUTH_UNVERIFIED==='true'&&['localhost','127.0.0.1','[::1]'].includes(new URL(appOrigin()).hostname);}
export function safeReturn(value:string){
  try{if(!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/dashboard';const url=new URL(value,'https://return.local');if(url.origin!=='https://return.local'||['/login','/register','/logout'].includes(url.pathname))return '/dashboard';return url.pathname+url.search;}
  catch{return '/dashboard';}
}
export async function getCurrentUser():Promise<AppUser|null>{
  const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token||!/^\w{64}$/.test(token))return null;
  const row=await database().prepare('SELECT u.id,u.email,u.display_name FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.verified=1').bind(tokenHash(token),Date.now()).first<{id:string;email:string;display_name:string}>();
  return row?{userId:row.id,email:row.email,displayName:row.display_name,fullName:row.display_name}:null;
}
export async function requireUser(returnTo:string){const user=await getCurrentUser();if(!user)throw Error('Please sign in: '+returnTo);return user;}
export function signOutPath(_returnTo='/'){return '/logout';}
export async function createSession(userId:string){
  const token=Buffer.from(randomBytes(32)).toString('hex');
  await database().prepare('INSERT INTO auth_sessions VALUES (?,?,?)').bind(tokenHash(token),userId,Date.now()+7*86400000).run();
  (await cookies()).set(SESSION_COOKIE,token,{httpOnly:true,secure:appOrigin().startsWith('https:'),sameSite:'lax',path:'/',maxAge:7*86400});
}
export async function logout(){const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;if(token)await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(tokenHash(token)).run();jar.delete(SESSION_COOKIE);}
