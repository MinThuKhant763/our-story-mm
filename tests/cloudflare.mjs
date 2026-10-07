import {defaultBox} from '../lib/box.ts';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm,readdir,readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {transform} from 'esbuild';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {unzipSync,zipSync,strToU8,strFromU8} from 'fflate';
const root=new URL('../',import.meta.url).pathname;
const dataDirectory=await mkdtemp(join(tmpdir(),'ourstory-test-'));
const base='http://localhost:5173';
const pagesProxy=(await transform(await readFile(join(root,'functions/api/[[path]].ts'),'utf8'),{loader:'ts',format:'esm'})).code+'\nexport default {fetch(request,env){return onRequest({request,env})}};';
const oauthCodes=new Map();
async function googleFixture(request){
 const url=new URL(request.url);
 if(url.hostname==='oauth2.googleapis.com'&&url.pathname==='/token'){
  const form=new URLSearchParams(await request.text()),fixture=oauthCodes.get(form.get('code'));
  if(!fixture)return Response.json({error:'invalid_grant'},{status:400});
  assert.equal(form.get('client_id'),'integration-client');assert.equal(form.get('client_secret'),'integration-secret');
  assert.equal(form.get('redirect_uri'),base+'/api/auth/google');assert.equal(form.get('grant_type'),'authorization_code');
  assert.equal(createHash('sha256').update(form.get('code_verifier')||'').digest('base64url'),fixture.challenge);
  oauthCodes.delete(form.get('code'));
  return Response.json({access_token:fixture.role});
 }
 if(url.hostname==='www.googleapis.com'&&url.pathname==='/oauth2/v2/userinfo'){
  const role=request.headers.get('authorization')?.replace('Bearer ','');
  return Response.json({id:'google-'+role,email:role+'@example.test',name:role,verified_email:role!=='unverified'});
 }
 throw Error('Unexpected outbound service request');
}
const runtime=new Miniflare(convertV4MiniflareOptions({resourcePersistencePath:dataDirectory,workers:[
 {name:'pages',modules:true,script:pagesProxy,compatibilityDate:'2026-10-07',serviceBindings:{API:'api'}},
 {name:'api',modules:true,scriptPath:join(root,'build-worker/index.js'),compatibilityDate:'2026-10-07',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-database'},r2Buckets:{MEDIA:'test-media'},outboundService:googleFixture,bindings:{APP_URL:base,GOOGLE_CLIENT_ID:'integration-client',GOOGLE_CLIENT_SECRET:'integration-secret',OWNER_EMAIL:'owner@example.test',LOCAL_AUTH_UNVERIFIED:'true',RESEND_API_KEY:'',EMAIL_FROM:'',EMAIL_JOBS_ENABLED:'false'}}
]}));
const mf={dispatchFetch:(url,options)=>runtime.dispatchFetch(url,{redirect:'manual',...options})};
const sessions={};
let connection;
const database={prepare(sql){return {bind(...args){return {run:async()=>connection.prepare(sql).run(...args)}}}}};
async function findSQLite(dir){for(const name of await readdir(dir,{withFileTypes:true})){const path=join(dir,name.name);if(name.isDirectory()){const found=await findSQLite(path);if(found)return found;}else if(name.name.endsWith('.sqlite')){const probe=new DatabaseSync(path);try{if(probe.prepare("SELECT 1 FROM sqlite_master WHERE name='__test_marker'").get())return path;}finally{probe.close();}}}}
async function ready(){
 const d1=await runtime.getD1Database('DB','api');await d1.prepare('CREATE TABLE __test_marker (id INTEGER)').run();
 const file=await findSQLite(dataDirectory);assert.ok(file);
 connection=new DatabaseSync(file);connection.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
 for(const name of (await readdir(join(root,'db/migrations'))).filter(n=>n.endsWith('.sql')).sort())connection.exec(await readFile(join(root,'db/migrations',name),'utf8'));
}
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const nextMonthlyExpiry=timestamp=>{const date=new Date(timestamp+23400000);date.setUTCMonth(date.getUTCMonth()+1);return date.getTime()-23400000;};
let checks=0;
async function call(path,{method='GET',as='owner',body,cookie,expect=200,binary=false}={}){const headers={};if(as&&sessions[as])headers.Cookie=sessions[as];if(method!=='GET')headers.origin=base;if(body&&!(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}if(body instanceof FormData){const formRequest=new Request(base+path,{method,body});headers['Content-Type']=formRequest.headers.get('Content-Type');body=await formRequest.arrayBuffer();}if(cookie)headers.Cookie=cookie;const response=await mf.dispatchFetch(base+path,{method,headers,body});const text=binary?Buffer.from(await response.arrayBuffer()):await response.text();assert.equal(response.status,expect,path+': '+String(text).slice(0,200));checks++;let data;try{data=binary?text:JSON.parse(text);}catch{data=text;}return {response,data};}
async function beginGoogle(returnTo='/dashboard'){
 const response=await mf.dispatchFetch(base+'/api/auth/google?return_to='+encodeURIComponent(returnTo));
 assert.equal(response.status,302);checks++;
 const url=new URL(response.headers.get('location'));
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('redirect_uri'),base+'/api/auth/google');
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('scope').includes('openid'));
 const cookie=response.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('SameSite=Lax'));
 return {state:url.searchParams.get('state'),challenge:url.searchParams.get('code_challenge'),cookie:cookie.split(';')[0]};
}
async function googleLogin(role,returnTo='/dashboard'){
 const attempt=await beginGoogle(returnTo),code=role+'-'+attempt.state;
 oauthCodes.set(code,{role,challenge:attempt.challenge});
 const response=await mf.dispatchFetch(base+'/api/auth/google?'+new URLSearchParams({code,state:attempt.state}),{headers:{Cookie:attempt.cookie}});
 assert.equal(response.status,302);checks++;
 return response;
}
async function signIn(role,returnTo='/dashboard'){
 const response=await googleLogin(role,returnTo);
 assert.equal(new URL(response.headers.get('location')).pathname,returnTo.startsWith('//')?'/dashboard':returnTo.split('?')[0]);
 const cookie=response.headers.getSetCookie().find(value=>value.startsWith('ourstory_session='));assert.ok(cookie);
 sessions[role]=cookie.split(';')[0];
 return response;
}
function imageForm(reference){const f=new FormData();f.set('file',new File([image],'receipt.png',{type:'image/png'}));if(reference)f.set('reference',reference);return f;}
try{
 await ready();

 for(const role of ['owner','other'])await signIn(role);
 const spoof=await mf.dispatchFetch(base+'/api/gifts',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}});assert.equal(spoof.status,401);checks++;
 for(const action of ['login','register','verify','reset'])await call('/api/auth/'+action,{method:'POST',as:null,body:{},expect:410});
 const cross=await mf.dispatchFetch(base+'/api/auth/logout',{method:'POST',headers:{Origin:'https://evil.example'}});assert.equal(cross.status,403);checks++;
 const missingState=await mf.dispatchFetch(base+'/api/auth/google?code=unused&state=unused');assert.equal(new URL(missingState.headers.get('location')).searchParams.get('reason'),'state_cookie_missing');checks++;
 const mismatch=await beginGoogle();const mismatched=await mf.dispatchFetch(base+'/api/auth/google?code=unused&state=wrong',{headers:{Cookie:mismatch.cookie}});assert.equal(new URL(mismatched.headers.get('location')).searchParams.get('reason'),'state_mismatch');checks++;
 const rejected=await beginGoogle();const rejectedToken=await mf.dispatchFetch(base+'/api/auth/google?code=unknown&state='+rejected.state,{headers:{Cookie:rejected.cookie}});assert.equal(new URL(rejectedToken.headers.get('location')).searchParams.get('reason'),'token_exchange_rejected');checks++;
 const denied=await mf.dispatchFetch(base+'/api/auth/google?error=access_denied');assert.equal(new URL(denied.headers.get('location')).searchParams.get('error'),'google_cancelled');assert.ok(denied.headers.get('set-cookie').includes('Max-Age=0'));checks++;
 const unverified=await googleLogin('unverified');assert.equal(new URL(unverified.headers.get('location')).searchParams.get('reason'),'profile_unverified_or_incomplete');assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM users WHERE email=?').get('unverified@example.test').n,0);checks++;
 await signIn('owner','//evil.example');
 assert.ok((await readFile(join(root,'dist/index.html'),'utf8')).includes('OurStory MM'));
 await call('/api/gifts',{as:null,expect:401});await call('/api/account',{as:null,expect:401});await call('/api/account',{method:'PUT',body:{displayName:'ကိုကို',language:'my'}});assert.equal((await call('/api/account')).data.profile.display_name,'ကိုကို');assert.notEqual((await call('/api/account',{as:'other'})).data.profile.display_name,'ကိုကို');
 await call('/api/account/language',{method:'PUT',as:null,body:{language:'my'},expect:401});await call('/api/account/language',{method:'PUT',body:{language:'th'},expect:400});await call('/api/account/language',{method:'PUT',body:{language:'en'}});assert.equal((await call('/api/account')).data.profile.display_name,'ကိုကို');assert.equal((await call('/api/account')).data.profile.language,'en');await call('/api/account/language',{method:'PUT',body:{language:'my'}});
 await call('/api/order-status',{as:null,expect:401});assert.equal((await call('/api/order-status',{as:'other'})).data.tracks.length,0);
 await call('/api/admin',{as:'other',expect:403});
 await call('/api/setup',{method:'POST',body:{}});
 await call('/api/setup',{method:'POST',as:'other',body:{},expect:403});

 // Little gift shop: placement persistence, public contents, portable imports and history restore.
 const packedBox={...defaultBox,style:'box',shop:{enabled:true,items:[{kind:'bouquet',slot:0},{kind:'bear',slot:1},{kind:'chocolate',slot:2}]}};
 const shopGift=(await call('/api/gifts',{method:'POST',body:{box:packedBox},expect:201})).data;
 assert.deepEqual(shopGift.box.shop,packedBox.shop);
 const shopContent={...shopGift.content,yourName:'ကိုကို',partnerName:'မေ',date:'2026-10-07',title:'My little gift shop'};
 let shopCurrent=(await call('/api/gifts/'+shopGift.id,{method:'PUT',body:{revision:shopGift.revision,content:shopContent,template:'bloom',plan:'basic',box:packedBox}})).data;
 assert.deepEqual((await call('/api/gifts/'+shopGift.id)).data.box.shop,packedBox.shop);
 await call('/api/gifts/'+shopGift.id+'/publish',{method:'POST',body:{mode:'test'}});
 shopCurrent=(await call('/api/gifts/'+shopGift.id)).data;const packedRevision=shopCurrent.revision;
 assert.deepEqual((await call('/api/public/'+shopGift.token,{as:null})).data.gift.box.shop,packedBox.shop);
 const movedShopBox={...packedBox,shop:{enabled:true,items:[{kind:'chocolate',slot:0},{kind:'bear',slot:1},{kind:'bouquet',slot:2}]}};
 shopCurrent=(await call('/api/gifts/'+shopGift.id,{method:'PUT',body:{revision:shopCurrent.revision,content:shopContent,template:'film',plan:'basic',box:movedShopBox}})).data;
 assert.deepEqual((await call('/api/gifts/'+shopGift.id+'/history')).data.versions.find(v=>v.revision===packedRevision).box.shop,packedBox.shop);
 shopCurrent=(await call('/api/gifts/'+shopGift.id+'/history',{method:'POST',body:{revision:shopCurrent.revision,versionRevision:packedRevision}})).data.gift;
 assert.deepEqual(shopCurrent.box.shop,packedBox.shop);assert.equal(shopCurrent.status,'test');
 const shopArchive=await call('/api/gifts/'+shopGift.id+'/backup',{binary:true});
 assert.deepEqual(JSON.parse(strFromU8(unzipSync(shopArchive.data)['manifest.json'])).box.shop,packedBox.shop);
 const shopImport=new FormData();shopImport.set('file',new File([shopArchive.data],'shop.zip',{type:'application/zip'}));const shopRestored=(await call('/api/backups/restore',{method:'POST',body:shopImport,expect:201})).data;assert.deepEqual(shopRestored.box.shop,packedBox.shop);assert.equal(shopRestored.status,'draft');
 for(const bad of [[{kind:'bear',slot:0},{kind:'bear',slot:1}],[{kind:'bear',slot:0},{kind:'chocolate',slot:0}],[{kind:'<script>',slot:0}],[{kind:'bear',slot:10}]]){
  await call('/api/gifts',{method:'POST',body:{box:{...packedBox,shop:{enabled:true,items:bad}}},expect:400});
  await call('/api/gifts/'+shopGift.id,{method:'PUT',body:{revision:shopCurrent.revision,content:shopContent,template:'bloom',plan:'basic',box:{...packedBox,shop:{enabled:true,items:bad}}},expect:400});
 }
 const noShopBox={...packedBox,shop:{...packedBox.shop,enabled:false}};
 shopCurrent=(await call('/api/gifts/'+shopGift.id,{method:'PUT',body:{revision:shopCurrent.revision,content:shopContent,template:'bloom',plan:'basic',box:noShopBox}})).data;assert.deepEqual(shopCurrent.box.shop,noShopBox.shop);
 await call('/api/gifts/'+shopGift.id,{method:'DELETE'});await call('/api/gifts/'+shopRestored.id,{method:'DELETE'});

 // First opening notifications: explicit POST, owner exclusion, gated access and one event per gift.
 await call('/api/openings',{as:null,expect:401});
 assert.equal((await call('/api/account')).data.profile.opening_notifications,0);
 await call('/api/account',{method:'PUT',body:{displayName:'Owner',language:'en',openingNotifications:'yes'},expect:400});
 await call('/api/account',{method:'PUT',body:{displayName:'Owner',language:'en',openingNotifications:true}});
 assert.equal((await call('/api/account')).data.profile.opening_notifications,1);
 const ng=(await call('/api/gifts',{method:'POST',body:{},expect:201})).data;
 const nc={...ng.content,yourName:'Owner',partnerName:'Recipient',date:'2026-10-07',title:'Opening notification gift'};
 let nv=(await call('/api/gifts/'+ng.id,{method:'PUT',body:{revision:ng.revision,content:nc,template:'bloom',plan:'basic'}})).data;
 await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,expect:404});
 await call('/api/public/missing/opened',{method:'POST',as:null,expect:404});
 await call('/api/gifts/'+ng.id+'/publish',{method:'POST',body:{mode:'test'}});
 await call('/api/public/'+ng.token,{as:null});
 assert.equal(connection.prepare('SELECT COUNT(*) n FROM gift_openings WHERE gift_id=?').get(ng.id).n,0);
 await call('/api/public/'+ng.token+'/opened',{method:'POST'});
 assert.equal(connection.prepare('SELECT COUNT(*) n FROM gift_openings WHERE gift_id=?').get(ng.id).n,0,'owner preview excluded');
 const badOpening=await mf.dispatchFetch(base+'/api/public/'+ng.token+'/opened',{method:'POST',headers:{Origin:'https://evil.example'}});assert.equal(badOpening.status,403);checks++;
 nv=(await call('/api/gifts/'+ng.id)).data;
 nv=(await call('/api/gifts/'+ng.id,{method:'PUT',body:{revision:nv.revision,content:nc,template:'bloom',plan:'basic',revealAt:Date.now()+600000}})).data;
 await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,expect:404});
 nv=(await call('/api/gifts/'+ng.id,{method:'PUT',body:{revision:nv.revision,content:nc,template:'bloom',plan:'basic',pin:'9876',revealAt:null}})).data;
 await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,expect:404});
 const openingUnlock=await call('/api/public/'+ng.token+'/unlock',{method:'POST',as:null,body:{pin:'9876'}});
 const openingCookie=openingUnlock.response.headers.get('set-cookie').split(';')[0];
 await Promise.all(Array.from({length:5},()=>call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,cookie:openingCookie})));
 const openingRecord=connection.prepare('SELECT * FROM gift_openings WHERE gift_id=?').get(ng.id);
 assert.equal(openingRecord.email_status,'pending');assert.ok(openingRecord.opened_at);assert.equal(openingRecord.read_at,null);
 assert.equal(connection.prepare('SELECT COUNT(*) n FROM gift_openings WHERE gift_id=?').get(ng.id).n,1);
 const ni=(await call('/api/openings')).data;assert.equal(ni.unread,1);assert.equal(ni.items.find(i=>i.giftId===ng.id).giftTitle,nc.title);assert.equal('payload' in ni.items[0],false);
 assert.equal((await call('/api/openings',{as:'other'})).data.items.some(i=>i.giftId===ng.id),false);
 await call('/api/openings/'+ng.id,{method:'PATCH',as:'other',expect:404});await call('/api/openings/'+ng.id,{method:'PATCH',as:null,expect:401});
 await call('/api/openings/'+ng.id,{method:'PATCH'});const marked=(await call('/api/openings')).data;assert.equal(marked.unread,0);assert.ok(marked.items[0].readAt);
 await call('/api/openings/'+ng.id,{method:'PATCH'});await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,cookie:openingCookie});
 assert.equal((await call('/api/openings')).data.items[0].readAt,marked.items[0].readAt);
 assert.equal(connection.prepare('SELECT opened_at FROM gift_openings WHERE gift_id=?').get(ng.id).opened_at,openingRecord.opened_at);
 nv=(await call('/api/gifts/'+ng.id,{method:'PUT',body:{revision:nv.revision,content:{...nc,title:'Updated after opening'},template:'film',plan:'basic'}})).data;
 await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,cookie:openingCookie,expect:404});
 const renewedUnlock=await call('/api/public/'+ng.token+'/unlock',{method:'POST',as:null,body:{pin:'9876'}});
 await call('/api/public/'+ng.token+'/opened',{method:'POST',as:null,cookie:renewedUnlock.response.headers.get('set-cookie').split(';')[0]});
 assert.equal((await call('/api/openings')).data.unread,0);
 const openingArchive=await call('/api/gifts/'+ng.id+'/backup',{binary:true});const openingManifest=JSON.parse(strFromU8(unzipSync(openingArchive.data)['manifest.json']));assert.equal('openings' in openingManifest,false);
 const openingImport=new FormData();openingImport.set('file',new File([openingArchive.data],'opening.zip',{type:'application/zip'}));const importedOpening=(await call('/api/backups/restore',{method:'POST',body:openingImport,expect:201})).data;
 assert.equal(connection.prepare('SELECT COUNT(*) n FROM gift_openings WHERE gift_id=?').get(importedOpening.id).n,0);
 await call('/api/gifts/'+ng.id,{method:'POST',expect:405});
 await call('/api/gifts/'+ng.id,{method:'DELETE'});assert.equal(connection.prepare('SELECT COUNT(*) n FROM gift_openings WHERE gift_id=?').get(ng.id).n,0);
 await call('/api/gifts/'+importedOpening.id,{method:'DELETE'});
 await call('/api/account',{method:'PUT',body:{displayName:'Owner',language:'my',openingNotifications:false}});
 const dg=(await call('/api/gifts',{method:'POST',body:{},expect:201})).data;
 await call('/api/gifts/'+dg.id,{method:'PUT',body:{revision:dg.revision,content:{...nc,title:'Email disabled gift'},template:'bloom',plan:'basic'}});
 await call('/api/gifts/'+dg.id+'/publish',{method:'POST',body:{mode:'test'}});
 await call('/api/public/'+dg.token+'/opened',{method:'POST',as:null});
 assert.equal(connection.prepare('SELECT email_status FROM gift_openings WHERE gift_id=?').get(dg.id).email_status,'disabled');
 connection.prepare('UPDATE gifts SET expires_at=? WHERE id=?').run(Date.now()-1,dg.id);
 await call('/api/public/'+dg.token+'/opened',{method:'POST',as:null,expect:404});
 await call('/api/gifts/'+dg.id,{method:'DELETE'});
 assert.equal((await call('/api/openings')).data.items.length,0);

 // Occasion preset persistence, public payloads, portable import and local artwork serving.
 await call('/api/gifts',{method:'POST',body:{occasion:'unknown'},expect:400});
 for(const id of ['anniversary','birthday','valentine','wedding','graduation']){
  const {data:created}=await call('/api/gifts',{method:'POST',body:{occasion:id},expect:201});
  assert.equal(created.content.occasion,id);assert.ok(created.content.letter.length>100);
  const content={...created.content,yourName:'ကိုကို',partnerName:'မေ',date:'2026-10-14'};
  const {data:saved}=await call('/api/gifts/'+created.id,{method:'PUT',body:{content,template:created.template,plan:created.plan,box:created.box,revision:created.revision}});
  assert.equal((await call('/api/gifts/'+created.id)).data.content.occasion,id);
  await call('/api/gifts/'+created.id+'/publish',{method:'POST',body:{mode:'test'}});
  assert.equal((await call('/api/public/'+created.token,{as:null})).data.gift.content.occasion,id);
  const archive=await call('/api/gifts/'+created.id+'/backup',{binary:true});
  const manifest=JSON.parse(strFromU8(unzipSync(archive.data)['manifest.json']));assert.equal(manifest.content.occasion,id);
  const importForm=new FormData();importForm.set('file',new File([archive.data],'occasion.zip',{type:'application/zip'}));
  const {data:restored}=await call('/api/backups/restore',{method:'POST',body:importForm,expect:201});
  assert.equal(restored.content.occasion,id);assert.deepEqual(restored.box,saved.box);
  const art=await readFile(join(root,'dist/images/occasions/'+id+'.webp'));assert.ok(art.length>10000);

  await call('/api/gifts/'+created.id,{method:'DELETE'});await call('/api/gifts/'+restored.id,{method:'DELETE'});
 }
 const {data:legacyOccasion}=await call('/api/gifts',{method:'POST',body:{},expect:201});
 const oldContent={yourName:'Old',partnerName:'Gift',title:'Original',date:'2023-01-01',letter:'Original custom words',photoIds:[],timeline:[]};
 connection.prepare('UPDATE gifts SET content=? WHERE id=?').run(JSON.stringify(oldContent),legacyOccasion.id);
 assert.equal((await call('/api/gifts/'+legacyOccasion.id)).data.content.occasion,'anniversary');
 await call('/api/gifts/'+legacyOccasion.id,{method:'PUT',body:{content:{...oldContent,occasion:'forged'},template:'bloom',plan:'basic',revision:legacyOccasion.revision},expect:400});
 await call('/api/gifts/'+legacyOccasion.id,{method:'DELETE'});
 for(const id of ['film','night','scrapbook','aurora','garden'])assert.ok((await readFile(join(root,'dist/images/templates/'+id+'.webp'))).length>10000);
 // Music options round-trip through private save, public entitlement and portable restore.
 for(const music of [{source:'ambient',ambient:'garden',volume:27,loop:true,youtubeUrl:''},{source:'youtube',ambient:'piano',volume:35,loop:false,youtubeUrl:'https://youtu.be/M7lc1UVf-VE?t=2'}]){
  const created=(await call('/api/gifts',{method:'POST',body:{},expect:201})).data;
  const musicContent={...created.content,yourName:'Music owner',partnerName:'Recipient',date:'2026-10-07',music};
  const saved=(await call('/api/gifts/'+created.id,{method:'PUT',body:{content:musicContent,template:'bloom',plan:'basic',revision:created.revision}})).data;
  assert.equal(saved.content.music.source,music.source);assert.equal(saved.content.music.volume,music.volume);
  const expected=saved.content.music;assert.deepEqual((await call('/api/gifts/'+created.id)).data.content.music,expected);
  await call('/api/public/'+created.token,{as:null,expect:404});
  await call('/api/gifts/'+created.id+'/publish',{method:'POST',body:{mode:'test'}});
  assert.deepEqual((await call('/api/public/'+created.token,{as:null})).data.gift.content.music,expected);
  const archive=(await call('/api/gifts/'+created.id+'/backup',{binary:true})).data;
  const form=new FormData();form.set('file',new File([archive],'music.zip',{type:'application/zip'}));
  const restored=(await call('/api/backups/restore',{method:'POST',body:form,expect:201})).data;
  assert.deepEqual(restored.content.music,expected);
  for(const bad of [{...music,source:'youtube',youtubeUrl:'https://evil.test/music'}, {...music,volume:101}])await call('/api/gifts/'+created.id,{method:'PUT',body:{content:{...musicContent,music:bad},template:'bloom',plan:'basic',revision:saved.revision},expect:400});
  await call('/api/gifts/'+restored.id,{method:'DELETE'});await call('/api/gifts/'+created.id,{method:'DELETE'});
 }
 for(const file of ['tender-keys','moonlit-dream','garden-chimes']){const audio=await readFile(join(root,'dist/audio/'+file+'.wav'));assert.equal(audio.subarray(0,4).toString(),'RIFF');}
 const headers=await readFile(join(root,'dist/_headers'),'utf8');assert.ok(headers.includes('frame-src https://www.youtube-nocookie.com'));assert.ok(headers.includes('Referrer-Policy: strict-origin-when-cross-origin'));
 // Version restore is owner-only, bounded, reversible and preserves live entitlement/security.
 const historyGift=(await call('/api/gifts',{method:'POST',body:{},expect:201})).data;
 const hc={...historyGift.content,yourName:'History owner',partnerName:'Recipient',date:'2026-10-07',title:'First saved title',music:{source:'youtube',ambient:'piano',youtubeUrl:'https://youtu.be/M7lc1UVf-VE',volume:35,loop:true,startSeconds:90}};
 let hv=(await call('/api/gifts/'+historyGift.id,{method:'PUT',body:{content:hc,template:'bloom',plan:'basic',revision:historyGift.revision,pin:'1234',revealAt:Date.now()+60000}})).data;
 let firstRevision=hv.revision;
 await call('/api/gifts/'+historyGift.id+'/publish',{method:'POST',body:{mode:'test'}});
 hv=(await call('/api/gifts/'+historyGift.id)).data;firstRevision=hv.revision;
 hv=(await call('/api/gifts/'+historyGift.id,{method:'PUT',body:{content:{...hc,title:'Second saved title'},template:'film',plan:'basic',box:{...defaultBox,color:'forest'},revision:hv.revision}})).data;
 let history=(await call('/api/gifts/'+historyGift.id+'/history')).data.versions;
 assert.ok(history.some(v=>v.revision===firstRevision&&v.content.music.startSeconds===90));
 await call('/api/gifts/'+historyGift.id+'/history',{as:'other',expect:404});await call('/api/gifts/'+historyGift.id+'/history',{as:null,expect:401});
 await call('/api/gifts/'+historyGift.id+'/history',{method:'POST',body:{revision:hv.revision,versionRevision:999999},expect:404});
 await call('/api/gifts/'+historyGift.id+'/history',{method:'POST',body:{revision:hv.revision-1,versionRevision:firstRevision},expect:409});
 const beforeRestore=hv;
 const restoredVersion=(await call('/api/gifts/'+historyGift.id+'/history',{method:'POST',body:{revision:hv.revision,versionRevision:firstRevision}})).data.gift;
 assert.equal(restoredVersion.content.title,hc.title);assert.equal(restoredVersion.template,'bloom');assert.equal(restoredVersion.content.music.startSeconds,90);
 for(const field of ['status','plan','hasPin','revealAt','expiresAt','paidOrderId'])assert.equal(restoredVersion[field],beforeRestore[field]);
 assert.equal(restoredVersion.revision,beforeRestore.revision+1);
 history=(await call('/api/gifts/'+historyGift.id+'/history')).data.versions;assert.ok(history.some(v=>v.content.title==='Second saved title'));
 hv=restoredVersion;
 for(let i=0;i<24;i++)hv=(await call('/api/gifts/'+historyGift.id,{method:'PUT',body:{content:{...hc,title:'Retained '+i},template:'bloom',plan:'basic',revision:hv.revision}})).data;
 assert.equal((await call('/api/gifts/'+historyGift.id+'/history')).data.versions.length,20);
 await call('/api/gifts/'+historyGift.id,{method:'DELETE'});
 assert.equal(connection.prepare('SELECT count(*) AS n FROM gift_versions WHERE gift_id=?').get(historyGift.id).n,0);
 const {data:g}=await call('/api/gifts',{method:'POST',body:{template:'bloom',plan:'basic'},expect:201});
 assert.deepEqual(g.box,{...defaultBox});assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'draft');
 await call('/api/gifts/'+g.id,{as:'other',expect:404});
 await call('/api/gifts/'+g.id,{method:'DELETE',as:'other',expect:404});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'test'},expect:400});
 const {data:photo}=await call('/api/gifts/'+g.id+'/photos',{method:'POST',body:imageForm(),expect:201});
 const c={yourName:'ကိုကို',partnerName:'မေ',title:'Our story',date:'2023-10-14',letter:'Forever',photoIds:[photo.id],timeline:[]};
 let {data:gift}=await call('/api/gifts/'+g.id,{method:'PUT',body:{content:c,template:'bloom',plan:'basic',revision:g.revision,pin:'1234',box:{color:'forest',ribbon:'rose',initials:'ကို & မေ'}}});
 await call('/api/gifts/'+g.id,{method:'PUT',body:{content:c,template:'bloom',plan:'basic',revision:g.revision},expect:409});
 assert.deepEqual(gift.box,{...defaultBox,color:'forest',ribbon:'rose',initials:'ကို & မေ'});await call('/api/gifts/'+g.id,{method:'PUT',body:{content:c,template:'bloom',plan:'basic',revision:gift.revision,box:{color:'forest',ribbon:'invalid',initials:''}},expect:400});assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'payment-needed');
 await call('/api/public/'+g.token,{as:null,expect:404});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'publish'},expect:400});
 ({data:gift}=await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'test'}}));
 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'test');
 const locked=await call('/api/public/'+g.token,{as:null});assert.deepEqual(locked.data,{locked:true});
 await call('/api/media/'+photo.id,{as:null,expect:404});
 await call('/api/public/'+g.token+'/unlock',{method:'POST',as:null,body:{pin:'9999'},expect:403});
 const unlock=await call('/api/public/'+g.token+'/unlock',{method:'POST',as:null,body:{pin:'1234'}});
 const cookie=unlock.response.headers.get('set-cookie').split(';')[0];
 const opened=await call('/api/public/'+g.token,{as:null,cookie});assert.equal(opened.data.gift.content.partnerName,'မေ');assert.equal('pinHash' in opened.data.gift,false);assert.deepEqual(opened.data.gift.box,gift.box);
 await call('/api/media/'+photo.id,{as:null,cookie});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'unpublish'}});
 await call('/api/media/'+photo.id,{as:null,cookie,expect:404});
 await call('/api/public/'+g.token,{as:null,cookie,expect:404});
 await call('/api/orders/'+g.id,{method:'POST',body:imageForm('000001'),expect:400});
 await call('/api/admin',{method:'PUT',as:'other',body:{},expect:403});
 await call('/api/admin',{method:'PUT',body:{enabled:true,merchantName:'',method:'KBZPay',accountNumber:'',instructions:''},expect:400});
 await call('/api/admin',{method:'PUT',body:{enabled:true,merchantName:'Test merchant',method:'KBZPay',accountNumber:'00000000',instructions:'Test only'}});
 for(const invalid of ['12345','1234567','ABC123','12-345'])await call('/api/orders/'+g.id,{method:'POST',body:imageForm(invalid),expect:400});
 const missingProof=new FormData();missingProof.set('reference','000001');await call('/api/orders/'+g.id,{method:'POST',body:missingProof,expect:400});
 await call('/api/orders/'+g.id,{method:'POST',as:'other',body:imageForm('000001'),expect:404});
 const {data:o}=await call('/api/orders/'+g.id,{method:'POST',body:imageForm('000001'),expect:201});
 assert.equal(o.amount,3000);assert.equal(o.reference,'000001');assert.equal(o.referenceKind,'last6');assert.equal(o.billingPeriod,'monthly');
 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'review');assert.equal((await call('/api/order-status',{as:'other'})).data.tracks.length,0);
 await call('/api/orders/'+g.id,{method:'POST',body:imageForm('000002'),expect:409});
 await call('/api/orders/'+o.id+'/proof',{as:'other',expect:404});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'publish'},expect:402});
 await call('/api/admin/orders/'+o.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:1,note:'Mismatch'},expect:400});
 for(const merchantTransactionId of [undefined,'000001','KBZ-A-000999'])await call('/api/admin/orders/'+o.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId,note:'Invalid merchant ID'},expect:400});
 await call('/api/admin/orders/'+o.id,{method:'POST',as:'other',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-A-000001',note:'Unauthorized'},expect:403});
 await call('/api/admin/orders/'+o.id,{method:'POST',body:{action:'approve',confirmed:false,amountReceived:3000,merchantTransactionId:'KBZ-A-000001',note:'Not verified'},expect:400});
 await call('/api/admin/orders/'+o.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-A-000001',note:'Actual record matched'}});
 const approvedTrack=(await call('/api/order-status')).data.tracks.find(t=>t.id===g.id);assert.equal(approvedTrack.stage,'approved');assert.ok(approvedTrack.orders[0].reviewedAt);assert.equal(approvedTrack.orders[0].note,'');
 const privateReview=(await call('/api/admin')).data.orders.find(x=>x.id===o.id);assert.equal(privateReview.merchantTransactionId,'KBZ-A-000001');assert.equal('merchantTransactionId' in (await call('/api/workspace')).data.orders.find(x=>x.id===o.id),false);assert.equal('merchantTransactionId' in approvedTrack.orders[0],false);
 const paid=(await call('/api/gifts/'+g.id)).data;assert.equal(paid.plan,'basic');const expires=paid.expiresAt;assert.equal(expires,nextMonthlyExpiry(privateReview.approvedAt));assert.equal(privateReview.billingPeriod,'monthly');
 await call('/api/admin/orders/'+o.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-A-000001',note:'Retry'},expect:409});
 assert.equal((await call('/api/gifts/'+g.id)).data.expiresAt,expires);
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'test'},expect:409});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'publish'}});
 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'ready');
 // Renewal charges the stated price and extends existing hosting once.
 const renewal=(await call('/api/orders/'+g.id,{method:'POST',body:imageForm('000002'),expect:201})).data;
 const renewalTrack=(await call('/api/order-status')).data.tracks.find(t=>t.id===g.id);assert.equal(renewalTrack.stage,'review');assert.equal(renewalTrack.live,true);
 const adminRows=(await call('/api/admin')).data.orders;assert.equal(adminRows.find(x=>x.id===renewal.id).amount,3000);
 await call('/api/admin/orders/'+renewal.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-A-000002',note:'Renewal record matched'}});
 assert.equal((await call('/api/gifts/'+g.id)).data.expiresAt,nextMonthlyExpiry(expires));
 await call('/api/admin/orders/'+renewal.id,{method:'POST',body:{action:'refund',confirmed:true,note:'External test refund completed'}});
 await call('/api/public/'+g.token,{as:null,expect:404});

 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'refunded');
 // Suffix collisions are legitimate; full merchant IDs remain unique.
 const premiumGift=(await call('/api/gifts',{method:'POST',body:{template:'film',plan:'premium'},expect:201})).data;
 const premiumOrder=(await call('/api/orders/'+premiumGift.id,{method:'POST',body:imageForm('000001'),expect:201})).data;assert.equal(premiumOrder.amount,5000);
 await call('/api/admin/orders/'+premiumOrder.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:5000,merchantTransactionId:'KBZ-A-000001',note:'Reused full ID'},expect:409});
 await call('/api/admin/orders/'+premiumOrder.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:5000,merchantTransactionId:'KBZ-P-000001',note:'Premium received'}});
 const premiumExpiry=(await call('/api/gifts/'+premiumGift.id)).data.expiresAt;
 const premiumRenewal=(await call('/api/orders/'+premiumGift.id,{method:'POST',body:imageForm('၀၀၀၀၀၃'),expect:201})).data;assert.equal(premiumRenewal.amount,5000);assert.equal(premiumRenewal.reference,'000003');
 await call('/api/admin/orders/'+premiumRenewal.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:5000,merchantTransactionId:'KBZ-P-000003',note:'Premium renewal'}});
 assert.equal((await call('/api/gifts/'+premiumGift.id)).data.expiresAt,nextMonthlyExpiry(premiumExpiry));
 const competitors=[];
 for(let i=0;i<2;i++){const candidate=(await call('/api/gifts',{method:'POST',body:{template:'bloom',plan:'basic'},expect:201})).data;const payment=(await call('/api/orders/'+candidate.id,{method:'POST',body:imageForm('000001'),expect:201})).data;competitors.push({gift:candidate,order:payment});}
 const race=await Promise.all(competitors.map(({order})=>mf.dispatchFetch(base+'/api/admin/orders/'+order.id,{method:'POST',headers:{Origin:base,Cookie:sessions.owner,'Content-Type':'application/json'},body:JSON.stringify({action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-RACE-000001',note:'One merchant transaction'})})));
 assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);checks+=2;
 const winner=competitors[race.findIndex(r=>r.status===200)],loser=competitors[race.findIndex(r=>r.status===409)];
 assert.ok((await call('/api/gifts/'+winner.gift.id)).data.paidOrderId);assert.equal((await call('/api/gifts/'+loser.gift.id)).data.paidOrderId,null);
 await call('/api/admin/orders/'+winner.order.id,{method:'POST',body:{action:'refund',confirmed:true,note:'External refund complete'}});
 await call('/api/admin/orders/'+loser.order.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-RACE-000001',note:'Reuse after refund'},expect:409});
 await call('/api/admin/orders/'+loser.order.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-SECOND-000001',note:'Distinct payment, same six digits'}});
 // Existing pending orders retain their original quotes and full references.
 const legacyPaymentGift=(await call('/api/gifts',{method:'POST',body:{template:'film',plan:'basic'},expect:201})).data,legacyId=crypto.randomUUID();
 connection.prepare("INSERT INTO orders (id,gift_id,owner_id,reference,amount,plan,method,proof_key,proof_mime,status,note,created_at) VALUES (?,?,?,?,9900,'basic','KBZPay','legacy/proof','image/png','pending','',?)").run(legacyId,legacyPaymentGift.id,connection.prepare('SELECT id FROM users WHERE email=?').get('owner@example.test').id,'LEGACY-REF',Date.now());
 await call('/api/admin/orders/'+legacyId,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'LEGACY-REF',note:'Old quote must be honored'},expect:400});
 await call('/api/admin/orders/'+legacyId,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:9900,merchantTransactionId:'OTHER-REF',note:'Wrong legacy reference'},expect:400});
 await call('/api/admin/orders/'+legacyId,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:9900,merchantTransactionId:'LEGACY-REF',note:'Legacy quote and full reference matched'}});
 const legacyAnnual=(await call('/api/admin')).data.orders.find(order=>order.id===legacyId);assert.equal(legacyAnnual.billingPeriod,'annual');assert.equal((await call('/api/gifts/'+legacyPaymentGift.id)).data.expiresAt,legacyAnnual.approvedAt+31536000000);

 // Every new template works through create, autosave, public view and portable backup.
 
 await call('/api/gifts',{method:'POST',body:{template:'not-a-template'},expect:400});
 for(const template of ['scrapbook','aurora','garden']){
  const created=(await call('/api/gifts',{method:'POST',body:{template,plan:'basic'},expect:201})).data;assert.equal(created.template,template);
  const saved=(await call('/api/gifts/'+created.id,{method:'PUT',body:{template,plan:'basic',content:{...c,photoIds:[]},revision:created.revision}})).data;assert.equal(saved.template,template);
  await call('/api/gifts/'+created.id+'/publish',{method:'POST',body:{mode:'test'}});
  assert.equal((await call('/api/public/'+created.token,{as:null})).data.gift.template,template);
  const exported=(await call('/api/gifts/'+created.id+'/backup',{binary:true})).data;
  const upload=new FormData();upload.set('file',new File([exported],'gift.zip',{type:'application/zip'}));
  const restoredTemplate=(await call('/api/backups/restore',{method:'POST',body:upload,expect:201})).data;assert.equal(restoredTemplate.template,template);assert.equal(restoredTemplate.paidOrderId,null);
  await call('/api/gifts/'+restoredTemplate.id,{method:'DELETE'});await call('/api/gifts/'+created.id,{method:'DELETE'});
 }
 // Gift selection travels through create, reload, autosave, publication and ZIP restore.
 for(const style of ['box','bouquet','bear','heart']){
  const box={...defaultBox,finish:style==='bear'?'matte':'pearl',frame:style==='bouquet'?'arch':'orbit',sticker:style==='bouquet'?'flower':style==='box'?'star':'heart',accessory:'crown',flowerKind:'rose',flowerCount:7,allowReply:true,secret:{title:'Our secret',message:'For you, ကိုကို ♡'},style,effect:style==='bouquet'?'petals':'sparkles',color:'lavender',ribbon:'ivory',initials:'H & M'};
  const created=(await call('/api/gifts',{method:'POST',body:{template:'aurora',box},expect:201})).data;assert.deepEqual(created.box,box);
  assert.deepEqual((await call('/api/gifts/'+created.id)).data.box,box);
  const next={...box,effect:'none'};
  await call('/api/gifts/'+created.id,{method:'PUT',body:{content:{...c,photoIds:[]},template:'aurora',plan:'basic',revision:created.revision,box:next}});
  await call('/api/gifts/'+created.id+'/publish',{method:'POST',body:{mode:'test'}});
  assert.deepEqual((await call('/api/public/'+created.token,{as:null})).data.gift.box,next);
  const backup=(await call('/api/gifts/'+created.id+'/backup',{binary:true})).data;
  const f=new FormData();f.set('file',new File([backup],'gift.zip',{type:'application/zip'}));
  const restored=(await call('/api/backups/restore',{method:'POST',body:f,expect:201})).data;assert.deepEqual(restored.box,next);assert.equal(restored.paidOrderId,null);
  await call('/api/gifts/'+restored.id,{method:'DELETE'});await call('/api/gifts/'+created.id,{method:'DELETE'});
  
 }
 await call('/api/gifts',{method:'POST',body:{box:{style:'dragon',color:'rose',ribbon:'champagne',initials:''}},expect:400});
 await call('/api/gifts',{method:'POST',body:{box:{style:'bear',effect:'invalid',color:'rose',ribbon:'champagne',initials:''}},expect:400});
 for(const [key,value] of [['finish','plastic'],['frame','iframe'],['sticker','<script>']])await call('/api/gifts',{method:'POST',body:{box:{...defaultBox,[key]:value}},expect:400});
 // Private replies honor visibility/PIN/schedule/expiry and never expose another owner's inbox.
 const rGift=(await call('/api/gifts',{method:'POST',body:{template:'garden'},expect:201})).data;
 const reply={requestId:crypto.randomUUID(),name:'မေ',message:'ကျေးဇူးတင်ပါတယ် ♡'};
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,body:reply,expect:404});
 const savedReplyGift=(await call('/api/gifts/'+rGift.id,{method:'PUT',body:{revision:rGift.revision,content:{...c,photoIds:[]},template:'garden',plan:'basic',pin:'6789'}})).data;
 await call('/api/gifts/'+rGift.id+'/publish',{method:'POST',body:{mode:'test'}});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,body:reply,expect:404});
 let access=(await call('/api/public/'+rGift.token+'/unlock',{method:'POST',as:null,body:{pin:'6789'}})).response.headers.get('set-cookie').split(';')[0];
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply,expect:403});
 let rCurrent=(await call('/api/gifts/'+rGift.id)).data;
 const enabledBox={...defaultBox,style:'bear',accessory:'party-hat',allowReply:true,secret:{title:'မင်းအတွက်',message:'ချစ်ရသူအတွက် စာလေး'}};
 rCurrent=(await call('/api/gifts/'+rGift.id,{method:'PUT',body:{revision:rCurrent.revision,content:rCurrent.content,template:'garden',plan:'basic',box:enabledBox}})).data;
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply,expect:404});
 access=(await call('/api/public/'+rGift.token+'/unlock',{method:'POST',as:null,body:{pin:'6789'}})).response.headers.get('set-cookie').split(';')[0];
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:{...reply,message:'x'.repeat(2001)},expect:400});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:{...reply,website:'bot'},expect:400});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply,expect:201});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:{...reply,message:'Different text'},expect:409});
 const inbox=(await call('/api/replies')).data;const received=inbox.find(item=>item.giftId===rGift.id);assert.equal(received.message,reply.message);assert.equal(inbox.filter(item=>item.giftId===rGift.id).length,1);
 assert.equal((await call('/api/replies',{as:'other'})).data.some(item=>item.id===received.id),false);
 await call('/api/replies',{as:null,expect:401});
 await call('/api/replies/'+received.id,{method:'PATCH',as:'other',expect:404});
 await call('/api/replies/'+received.id,{method:'DELETE',as:'other',expect:404});
 await call('/api/replies/'+received.id,{method:'PATCH'});
 assert.ok((await call('/api/replies')).data.find(item=>item.id===received.id).readAt);
 assert.equal((await call('/api/gifts/'+rGift.id)).data.revision,rCurrent.revision);
 const publicReplyGift=(await call('/api/public/'+rGift.token,{as:null,cookie:access})).data.gift;assert.equal('replies' in publicReplyGift,false);assert.equal(publicReplyGift.box.secret.message,enabledBox.secret.message);
 for(let n=0;n<4;n++)await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:{...reply,requestId:crypto.randomUUID()},expect:201});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:{...reply,requestId:crypto.randomUUID()},expect:429});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply});
 const badOrigin=await mf.dispatchFetch(base+'/api/public/'+rGift.token+'/reply',{method:'POST',headers:{Origin:'https://evil.example',Cookie:access,'Content-Type':'application/json'},body:JSON.stringify(reply)});assert.equal(badOrigin.status,403);checks++;
 await call('/api/gifts/'+rGift.id,{method:'PUT',body:{revision:rCurrent.revision,content:rCurrent.content,template:'garden',plan:'basic',revealAt:Date.now()+60000}});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,cookie:access,body:reply,expect:404});
 await call('/api/gifts/'+rGift.id+'/publish',{method:'POST',body:{mode:'unpublish'}});
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,body:reply,expect:404});
 connection.prepare("UPDATE gifts SET status='published',reveal_at=NULL,pin_hash=NULL,expires_at=? WHERE id=?").run(Date.now()-1,rGift.id);
 await call('/api/public/'+rGift.token+'/reply',{method:'POST',as:null,body:reply,expect:404});
 await call('/api/replies/'+received.id,{method:'DELETE'});assert.equal((await call('/api/replies')).data.some(item=>item.id===received.id),false);
 await call('/api/gifts/'+rGift.id,{method:'DELETE'});assert.equal((await call('/api/replies')).data.some(item=>item.giftId===rGift.id),false);
 await call('/api/account',{method:'PUT',body:{displayName:'ကိုကို',language:'my',renewalReminders:true}});assert.equal((await call('/api/account')).data.profile.renewal_reminders,1);
 await call('/api/account/language',{method:'PUT',body:{language:'en'}});assert.equal((await call('/api/account')).data.profile.renewal_reminders,1);
 await call('/api/account',{method:'PUT',body:{displayName:'ကိုကို',language:'my',renewalReminders:false}});assert.equal((await call('/api/account')).data.profile.renewal_reminders,0);
 
 const raceGift=(await call('/api/gifts',{method:'POST',body:{box:{...defaultBox,allowReply:true}},expect:201})).data;
 await call('/api/gifts/'+raceGift.id,{method:'PUT',body:{revision:raceGift.revision,content:{...c,photoIds:[]},template:'bloom',plan:'basic'}});
 await call('/api/gifts/'+raceGift.id+'/publish',{method:'POST',body:{mode:'test'}});
 const raceResults=await Promise.all(Array.from({length:7},()=>mf.dispatchFetch(base+'/api/public/'+raceGift.token+'/reply',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({...reply,requestId:crypto.randomUUID()})})));
 assert.equal(raceResults.filter(r=>r.status===201).length,5);assert.equal(raceResults.filter(r=>r.status===429).length,2);checks+=raceResults.length;
 assert.equal((await call('/api/replies')).data.filter(item=>item.giftId===raceGift.id).length,5);
 await call('/api/gifts/'+raceGift.id,{method:'DELETE'});

 // Monthly renewal also works after expiry and existing annual entitlements stay intact until renewed.
 const expiredGift=(await call('/api/gifts',{method:'POST',body:{template:'garden',plan:'basic'},expect:201})).data;
 const expiredOrder=(await call('/api/orders/'+expiredGift.id,{method:'POST',body:imageForm('000777'),expect:201})).data;
 await call('/api/admin/orders/'+expiredOrder.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-E-000777',note:'Received'}});
 connection.prepare('UPDATE gifts SET expires_at=? WHERE id=?').run(Date.now()-1000,expiredGift.id);
 const expiredRenewal=(await call('/api/orders/'+expiredGift.id,{method:'POST',body:imageForm('000778'),expect:201})).data;
 await call('/api/admin/orders/'+expiredRenewal.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-E-000778',note:'Expired renewal'}});
 const expiredReview=(await call('/api/admin')).data.orders.find(order=>order.id===expiredRenewal.id);assert.equal((await call('/api/gifts/'+expiredGift.id)).data.expiresAt,nextMonthlyExpiry(expiredReview.approvedAt));
 const retainedLegacyExpiry=(await call('/api/gifts/'+legacyPaymentGift.id)).data.expiresAt;
 const legacyRenewal=(await call('/api/orders/'+legacyPaymentGift.id,{method:'POST',body:imageForm('000779'),expect:201})).data;assert.equal(legacyRenewal.billingPeriod,'monthly');
 assert.equal((await call('/api/gifts/'+legacyPaymentGift.id)).data.expiresAt,retainedLegacyExpiry);
 await call('/api/admin/orders/'+legacyRenewal.id,{method:'POST',body:{action:'approve',confirmed:true,amountReceived:3000,merchantTransactionId:'KBZ-L-000779',note:'Monthly addition after annual term'}});
 assert.equal((await call('/api/gifts/'+legacyPaymentGift.id)).data.expiresAt,nextMonthlyExpiry(retainedLegacyExpiry));

 // Voice ownership and schedule enforce the same privacy boundary as photos.
 const wav=Buffer.alloc(46);wav.write('RIFF');wav.writeUInt32LE(38,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(2,40);
 const voiceForm=()=>{const f=new FormData();f.set('file',new File([wav],'message.wav',{type:'audio/wav'}));return f;};
 await call('/api/gifts/'+g.id+'/voice',{method:'POST',as:'other',body:voiceForm(),expect:404});
 const voiced=(await call('/api/gifts/'+g.id+'/voice',{method:'POST',body:voiceForm()})).data;
 assert.equal((await call('/api/gifts/'+g.id+'/photos')).data.length,1);
 await call('/api/media/'+voiced.voiceId,{as:null,expect:404});
 await call('/api/media/'+voiced.voiceId);
 await call('/api/media/'+voiced.voiceId,{method:'DELETE',expect:409});
 await call('/api/gifts/'+g.id+'/publish',{method:'POST',body:{mode:'test'}});
 let scheduled=(await call('/api/gifts/'+g.id)).data;
 const revealAt=Date.now()+3600000;
 scheduled=(await call('/api/gifts/'+g.id,{method:'PUT',body:{revision:scheduled.revision,content:c,template:'bloom',plan:'basic',revealAt}})).data;
 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===g.id).stage,'scheduled');
 const hidden=(await call('/api/public/'+g.token,{as:null})).data;assert.deepEqual(hidden,{scheduled:true,revealAt});
 await call('/api/public/'+g.token+'/unlock',{method:'POST',as:null,body:{pin:'1234'},expect:404});
 await call('/api/media/'+photo.id,{as:null,expect:404});await call('/api/media/'+voiced.voiceId,{as:null,expect:404});
 scheduled=(await call('/api/gifts/'+g.id,{method:'PUT',body:{revision:scheduled.revision,content:c,template:'bloom',plan:'basic',revealAt:null}})).data;
 const voiceUnlock=(await call('/api/public/'+g.token+'/unlock',{method:'POST',as:null,body:{pin:'1234'}})).response.headers.get('set-cookie').split(';')[0];
 await call('/api/media/'+voiced.voiceId,{as:null,cookie:voiceUnlock});
 // A portable backup restores all memories to a new draft, never finance or publication.
 await call('/api/gifts/'+g.id+'/backup',{as:'other',expect:404});
 const ordersBeforeRestore=(await call('/api/admin')).data.orders.length;
 const zip=(await call('/api/gifts/'+g.id+'/backup',{binary:true})).data;
 const archive=unzipSync(zip),manifest=JSON.parse(strFromU8(archive['manifest.json']));assert.equal(manifest.files.length,2);assert.equal('pin' in manifest,false);
 const restoreForm=(bytes)=>{const f=new FormData();f.set('file',new File([bytes],'ourstory.zip',{type:'application/zip'}));return f;};
 const restored=(await call('/api/backups/restore',{method:'POST',body:restoreForm(zip),expect:201})).data;
 assert.notEqual(restored.token,g.token);assert.equal(restored.status,'draft');assert.equal(restored.paidOrderId,null);assert.equal(restored.expiresAt,null);assert.equal(restored.hasPin,false);assert.equal(restored.revealAt,null);assert.notEqual(restored.photos[0].id,photo.id);assert.equal(restored.content.letter,c.letter);assert.deepEqual(restored.box,{...defaultBox,color:'forest',ribbon:'rose',initials:'ကို & မေ'});
 const legacyArchive={...archive};const legacyManifest={...manifest};delete legacyManifest.box;legacyArchive['manifest.json']=strToU8(JSON.stringify(legacyManifest));const legacyGift=(await call('/api/backups/restore',{method:'POST',body:restoreForm(zipSync(legacyArchive)),expect:201})).data;assert.deepEqual(legacyGift.box,{...defaultBox});await call('/api/gifts/'+legacyGift.id,{method:'DELETE'});
 await call('/api/media/'+restored.photos[0].id);await call('/api/media/'+restored.voiceId);await call('/api/media/'+restored.voiceId,{as:'other',expect:404});
 await call('/api/public/'+restored.token,{as:null,expect:404});assert.equal((await call('/api/admin')).data.orders.length,ordersBeforeRestore);
 const corrupt=Object.fromEntries(Object.entries(archive).map(([k,v])=>[k,new Uint8Array(v)]));corrupt['media/'+photo.id][corrupt['media/'+photo.id].length-1]^=1;await call('/api/backups/restore',{method:'POST',body:restoreForm(zipSync(corrupt)),expect:400});
 await call('/api/backups/restore',{method:'POST',body:restoreForm(Buffer.from('invalid')),expect:400});
 await call('/api/backups/restore',{method:'POST',body:restoreForm(zipSync({'../unsafe':strToU8('x')})),expect:400});
 await call('/api/backups/restore',{method:'POST',body:restoreForm(zipSync({'manifest.json':strToU8(JSON.stringify(manifest))})),expect:400});
 await call('/api/backups/restore',{method:'POST',body:restoreForm(zipSync({'manifest.json':new Uint8Array(600000)},{level:9})),expect:400});
 await call('/api/gifts/'+restored.id+'/voice',{method:'DELETE'});await call('/api/media/'+restored.voiceId,{expect:404});
 await call('/api/gifts/'+restored.id,{method:'DELETE'});
 await call('/api/gifts/'+g.id,{method:'DELETE'});
 await call('/api/media/'+photo.id,{expect:404});

 const extraGift=(await call('/api/gifts',{method:'POST',body:{template:'film',plan:'basic'},expect:201})).data;
 const extraContent={...c,photoIds:[]};
 await call('/api/gifts/'+extraGift.id,{method:'PUT',body:{content:extraContent,template:'film',plan:'basic',revision:extraGift.revision}});
 const extraOrder=(await call('/api/orders/'+extraGift.id,{method:'POST',body:imageForm('000004'),expect:201})).data;
 await call('/api/admin/orders/'+extraOrder.id,{method:'POST',body:{action:'reject',note:'Wrong test receipt'}});
 const rejectedTrack=(await call('/api/order-status')).data.tracks.find(t=>t.id===extraGift.id);assert.equal(rejectedTrack.stage,'rejected');assert.equal(rejectedTrack.orders[0].note,'Wrong test receipt');assert.ok(rejectedTrack.orders[0].reviewedAt);
 await call('/api/gifts/'+extraGift.id+'/publish',{method:'POST',body:{mode:'test'}});
 await database.prepare('UPDATE gifts SET expires_at=? WHERE id=?').bind(Date.now()-1000,extraGift.id).run();
 // Expiry takes precedence over a rejected historical receipt for a test gift.
 assert.equal((await call('/api/order-status')).data.tracks.find(t=>t.id===extraGift.id).stage,'expired');
 await call('/api/gifts/'+extraGift.id,{method:'DELETE'});
 const deletedTrack=(await call('/api/order-status')).data.tracks.find(t=>t.id===g.id);assert.equal(deletedTrack.stage,'deleted');assert.equal(deletedTrack.gift,null);assert.equal(deletedTrack.orders.length,2);
 const objects=await (await runtime.getR2Bucket('MEDIA','api')).list({prefix:'photos/'+g.id+'/'});assert.equal(objects.objects.length,0);
 // Google reuses existing accounts and creates a fresh revocable session.
 const owner=connection.prepare('SELECT id FROM users WHERE email=?').get('owner@example.test');
 connection.prepare('UPDATE users SET verified=0 WHERE id=?').run(owner.id);
 await call('/api/account',{expect:401});
 await signIn('owner');
 assert.equal(connection.prepare('SELECT id FROM users WHERE email=?').get('owner@example.test').id,owner.id);
 assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM users WHERE email=?').get('owner@example.test').n,1);
 await call('/api/account');await call('/api/auth/logout',{method:'POST',body:{}});await call('/api/account',{expect:401});
 console.log('PASS: '+checks+' API checks; five occasion presets with legacy default/import/artwork checks; private replies with PIN/schedule/expiry/rate/ownership gates, reminder preferences, four gift styles/accessories/secrets with portable settings, six templates, monthly periods and annual retention; pricing, last-six validation, suffix collisions, merchant transaction uniqueness, legacy quotes;  ownership, revision conflicts, PIN/media access, payment gate, approval idempotency, renewal and refund revocation, photo deletion, account isolation, voice access, scheduled reveal, portable backup/restore, box personalization and order tracking.');
}finally{if(connection)connection.close();await runtime.dispose();await rm(dataDirectory,{recursive:true,force:true});}

