import {runReminders} from '../scripts/reminder-engine.mjs';
import {runOpeningNotifications} from '../scripts/opening-engine.mjs';
import type {Env} from '../lib/runtime';
export async function scheduledJobs(env:Env){
  if(env.MAINTENANCE_MODE==='true')return;
  const db={prepare(sql:string){return {
    get:async(...args:unknown[])=>env.DB.prepare(sql).bind(...args).first(),
    all:async(...args:unknown[])=>(await env.DB.prepare(sql).bind(...args).all()).results,
    run:async(...args:unknown[])=>({changes:(await env.DB.prepare(sql).bind(...args).run()).meta.changes})
  };}};
  if(env.EMAIL_JOBS_ENABLED==='true'&&env.RESEND_API_KEY&&env.EMAIL_FROM){
    const send=async(payload:unknown,key:string)=>{
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error('Email delivery failed');return response.json();
    };
    const options={origin:env.APP_URL,from:env.EMAIL_FROM,send};
    console.log('Renewals',await runReminders(db,options));
    console.log('Openings',await runOpeningNotifications(db,options));
  }
  const now=Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM auth_tokens WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM viewer_sessions WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM auth_limits WHERE window_start<?').bind(now-86400000),
    env.DB.prepare('DELETE FROM pin_attempts WHERE window_start<?').bind(now-86400000)
  ]);
}
