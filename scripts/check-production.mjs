import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const {APP_URL,OWNER_EMAIL,GOOGLE_CLIENT_ID,EMAIL_FROM,EMAIL_JOBS_ENABLED,LOCAL_AUTH_UNVERIFIED}=config.vars;
let appURL;try{appURL=new URL(APP_URL);}catch{throw Error('Set APP_URL to your actual HTTPS Pages/custom domain.');}
if(appURL.protocol!=='https:'||appURL.hostname==='pages.dev'||appURL.hostname.startsWith('your-')||appURL.hostname.includes('example.com'))throw Error('Set APP_URL to your actual HTTPS Pages/custom domain.');
if(!OWNER_EMAIL||OWNER_EMAIL==='owner@example.com')throw Error('Set your real OWNER_EMAIL.');
if(!GOOGLE_CLIENT_ID||GOOGLE_CLIENT_ID.includes('example.com'))throw Error('Set GOOGLE_CLIENT_ID to the Google OAuth web client ID.');
if(EMAIL_JOBS_ENABLED==='true'&&(!EMAIL_FROM||EMAIL_FROM.includes('@example.com')))throw Error('Set EMAIL_FROM using your verified sending domain before enabling email jobs.');
if(LOCAL_AUTH_UNVERIFIED!=='false')throw Error('Production must set LOCAL_AUTH_UNVERIFIED=false.');
if(config.d1_databases[0].database_id==='00000000-0000-0000-0000-000000000000')throw Error('Paste the database_id returned by wrangler d1 create.');
console.log('Production configuration checked. Google sign-in requires GOOGLE_CLIENT_SECRET as a Worker secret.');
