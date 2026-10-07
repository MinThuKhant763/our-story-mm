import {placeShopItem,removeShopItem,shopSchema,shopKinds,shopSlots} from '../lib/gift-shop.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {validDate,togetherDays,nextAnniversaryDays,publicState,contentSchema,demoContent,yangonInput,revealTimestamp} from '../lib/gifts.ts';
import {boxSchema,defaultBox,readBox,coupleInitials} from '../lib/box.ts';
import {translator,localizeError,letterDraft} from '../lib/i18n.ts';
import QRCode from 'qrcode';
test('calendar values reject impossible and out-of-range dates',()=>{assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-04-31'),false);assert.equal(validDate('2101-01-01'),false);});
test('counter uses Yangon calendar days across UTC midnight',()=>{assert.equal(togetherDays('2026-10-06',new Date('2026-10-06T18:00:00Z')),1);assert.equal(togetherDays('2026-10-07',new Date('2026-10-06T17:00:00Z')),0);});
test('next anniversary handles today, future starts, and leap-day policy',()=>{assert.equal(nextAnniversaryDays('2023-10-06',new Date('2026-10-06T10:00:00Z')),0);assert.equal(nextAnniversaryDays('2024-02-29',new Date('2026-02-28T10:00:00Z')),1);assert.equal(nextAnniversaryDays('2027-10-06',new Date('2026-10-06T10:00:00Z')),365);});
test('unpublished and expired gifts never receive public entitlement',()=>{assert.equal(publicState('draft',9999,100),false);assert.equal(publicState('published',100,100),false);assert.equal(publicState('test',null,100),false);assert.equal(publicState('published',101,100),true);});
test('content accepts Myanmar and rejects excessive timelines',()=>{assert.equal(contentSchema.safeParse({...demoContent,partnerName:'မေ'}).success,true);assert.equal(contentSchema.safeParse({...demoContent,timeline:Array(6).fill(demoContent.timeline[0])}).success,false);});
test('sharing QR encodes the full hosted gift URL',async()=>{const url='https://gifts.example.com/gift/'+crypto.randomUUID().replaceAll('-','');const qr=QRCode.create(url,{errorCorrectionLevel:'M'});assert.ok(qr.modules.size>=21);const svg=await QRCode.toString(url,{type:'svg'});assert.ok(svg.startsWith('<svg'));});


test('scheduled reveal converts Myanmar wall time without browser timezone dependence',()=>{const instant=Date.parse('2026-10-06T17:30:00Z');assert.equal(revealTimestamp('2026-10-07T00:00'),instant);assert.equal(yangonInput(instant),'2026-10-07T00:00');assert.equal(revealTimestamp(''),null);assert.equal(yangonInput(null),'');});

test('gift box presets reject invalid colors and unsafe or oversized initials',()=>{assert.deepEqual(boxSchema.parse(defaultBox),defaultBox);assert.equal(boxSchema.safeParse({...defaultBox,color:'red'}).success,false);assert.equal(boxSchema.safeParse({...defaultBox,initials:'<script>'}).success,false);assert.equal(boxSchema.safeParse({...defaultBox,initials:'A'.repeat(13)}).success,false);assert.deepEqual(readBox('broken'),defaultBox);assert.equal(boxSchema.safeParse({...defaultBox,initials:'ကို & မေ'}).success,true);});
test('automatic initials handle Myanmar combining characters and missing names',()=>{assert.equal(coupleInitials(' Htet ',' May '),'H & M');assert.ok(coupleInitials('ကိုကို','မေ').includes(' & '));assert.equal(coupleInitials('',''), '');});
test('bilingual UI, validation and letter draft retain the selected language',()=>{assert.equal(translator('en')('Your name'),'Your name');assert.equal(translator('my')('Your name'),'သင့်နာမည်');assert.equal(translator('my')('A custom merchant note'),'A custom merchant note');assert.equal(localizeError('Your basic package allows 10 photos.','my'),'ဒီပက်ကေ့ချ်တွင် ပုံ 10 ပုံအထိ ထည့်နိုင်သည်။');assert.ok(localizeError('This gift changed in another tab. Reload before saving.','my').includes('အခြား'));assert.ok(letterDraft('my','မေ','ထက်').includes('မေရေ'));assert.ok(letterDraft('en','May','Htet').startsWith('To May,'));});

import {requestOriginAllowed} from '../lib/origin.ts';
test('production origin protection accepts only the configured public origin',()=>{
 assert.equal(requestOriginAllowed('https://gifts.example.com','http://app:3000/api/auth/login','https://gifts.example.com',false),true);
 assert.equal(requestOriginAllowed('http://localhost:3001','http://localhost:3001/api/auth/login','http://localhost:3000',false),false);
 assert.equal(requestOriginAllowed('https://evil.example','https://evil.example/api/auth/login','https://gifts.example.com',false),false);
});
test('local development accepts the actual loopback app port and hostname',()=>{
 assert.equal(requestOriginAllowed('http://localhost:3001','http://localhost:3001/api/auth/login','http://localhost:3000',true),true);
 assert.equal(requestOriginAllowed('http://127.0.0.1:3001','http://127.0.0.1:3001/api/auth/login','http://localhost:3000',true),true);
 assert.equal(requestOriginAllowed('http://127.0.0.1:3001','http://localhost:3001/api/auth/login','http://localhost:3000',true,'127.0.0.1:3001'),true);
 assert.equal(requestOriginAllowed('http://localhost:3001','http://localhost:3001/api/auth/login','http://localhost:3000',true,'localhost:4000'),false);
 assert.equal(requestOriginAllowed('http://127.0.0.1:3001','http://localhost:3001/api/auth/login','http://localhost:3000',false,'127.0.0.1:3001'),false);
 assert.equal(requestOriginAllowed('http://localhost:4000','http://localhost:3001/api/auth/login','http://localhost:3000',true),false);
 assert.equal(requestOriginAllowed('http://192.168.1.2:3001','http://192.168.1.2:3001/api/auth/login','http://localhost:3000',true),false);
 assert.equal(requestOriginAllowed('http://localhost:3001','http://localhost:3001/api/auth/login','https://gifts.example.com',true),false);
});
test('missing and malformed origins remain blocked',()=>{
 for(const value of [null,'null','invalid','http://localhost:3001/'])assert.equal(requestOriginAllowed(value,'http://localhost:3001/api/auth/login','http://localhost:3000',true),false);
});

import {lastSixSchema,merchantTransactionSchema,merchantReferenceMatches} from '../lib/payments.ts';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
test('customer payment IDs keep leading zeros, normalize Myanmar digits and require six digits',()=>{
 assert.equal(lastSixSchema.parse('000123'),'000123');assert.equal(lastSixSchema.parse('၀၀၀၁၂၃'),'000123');
 for(const value of ['12345','1234567','ABC123','12-345',123456,null])assert.equal(lastSixSchema.safeParse(value).success,false);
});
test('new merchant reviews compare the suffix of a complete transaction ID',()=>{
 const full=merchantTransactionSchema.parse(' kbz-2026-000123 ');assert.equal(full,'KBZ-2026-000123');
 assert.equal(merchantReferenceMatches('last6','000123',full),true);
 assert.equal(merchantReferenceMatches('last6','000124',full),false);
 assert.equal(merchantReferenceMatches('last6','000123','000123'),false);
 for(const value of ['','https://bank/000123','ID 000123'])assert.equal(merchantTransactionSchema.safeParse(value).success,false);
});
test('legacy references continue requiring an exact full-reference match',()=>{
 assert.equal(merchantReferenceMatches('legacy','TEST-OLD','TEST-OLD'),true);
 assert.equal(merchantReferenceMatches('legacy','000123','KBZ-000123'),false);
});
test('payment upgrade preserves old quotes and allows suffix collisions while preventing merchant ID reuse',()=>{
 const db=new DatabaseSync(':memory:');try{
  const folder=new URL('../db/migrations/',import.meta.url);
  for(const name of readdirSync(folder).filter(name=>name.endsWith('.sql')&&name<'0005_last_six_payments.sql').sort())db.exec(readFileSync(new URL(name,folder),'utf8'));
  const insert=db.prepare("INSERT INTO orders (id,gift_id,owner_id,reference,amount,plan,method,proof_key,proof_mime,status,created_at) VALUES (?, ?,'u',?,?,'basic','KBZPay','proof','image/png',?,1)");
  const insertOrder=(id,ref,amount,status)=>insert.run(id,id,ref,amount,status);
  insertOrder('old-approved','OLD-000123',9900,'approved');insertOrder('old-pending','OLD-PENDING',19900,'pending');insertOrder('old-refund','OLD-REFUND',9900,'refunded');
  db.exec(readFileSync(new URL('0005_last_six_payments.sql',folder),'utf8'));
  assert.deepEqual({...db.prepare('SELECT reference,reference_kind,amount,merchant_transaction_id FROM orders WHERE id=?').get('old-pending')},{reference:'OLD-PENDING',reference_kind:'legacy',amount:19900,merchant_transaction_id:null});
  assert.equal(db.prepare('SELECT merchant_transaction_id FROM orders WHERE id=?').get('old-approved').merchant_transaction_id,'OLD-000123');
  insertOrder('new-a','000123',3000,'pending');insertOrder('new-b','000123',3000,'pending');
  db.prepare("UPDATE orders SET reference_kind='last6' WHERE id LIKE 'new-%'").run();
  assert.throws(()=>db.prepare('UPDATE orders SET merchant_transaction_id=? WHERE id=?').run('OLD-REFUND','new-a'),/UNIQUE/);
  db.prepare('UPDATE orders SET merchant_transaction_id=? WHERE id=?').run('NEW-000123','new-a');
  assert.throws(()=>db.prepare('UPDATE orders SET merchant_transaction_id=? WHERE id=?').run('NEW-000123','new-b'),/UNIQUE/);
 }finally{db.close();}
});

import {addYangonMonth,hostingExpiry} from '../lib/hosting.ts';
import {templateIds,templateSchema,templates} from '../lib/gifts.ts';
test('monthly hosting clamps month ends and leap years in Myanmar time',()=>{
 assert.equal(addYangonMonth(Date.parse('2026-01-31T10:15:20.125+06:30')),Date.parse('2026-02-28T10:15:20.125+06:30'));
 assert.equal(addYangonMonth(Date.parse('2028-01-31T10:15:00+06:30')),Date.parse('2028-02-29T10:15:00+06:30'));
 assert.equal(addYangonMonth(Date.parse('2026-01-30T20:00:00Z')),Date.parse('2026-02-27T20:00:00Z'));
});
test('monthly hosting crosses December without losing the local time',()=>{
 assert.equal(addYangonMonth(Date.parse('2026-12-15T23:59:58.123+06:30')),Date.parse('2027-01-15T23:59:58.123+06:30'));
});
test('monthly renewal extends active hosting and starts expired hosting at approval',()=>{
 const now=Date.parse('2026-10-07T08:00:00+06:30'),active=Date.parse('2026-12-07T08:00:00+06:30');
 assert.equal(hostingExpiry(now,active,'renewal','monthly'),Date.parse('2027-01-07T08:00:00+06:30'));
 assert.equal(hostingExpiry(now,now-1,'renewal','monthly'),Date.parse('2026-11-07T08:00:00+06:30'));
 assert.equal(hostingExpiry(now,active,'purchase','monthly'),Date.parse('2026-11-07T08:00:00+06:30'));
});
test('previous annual quotations retain their exact original hosting duration',()=>{
 const now=Date.parse('2027-03-01T08:00:00+06:30');
 assert.equal(hostingExpiry(now,null,'purchase','annual'),now+31536000000);
 assert.equal(hostingExpiry(now,now+1000,'renewal','annual'),now+1000+31536000000);
});
test('every advertised template is accepted and unknown template IDs are rejected',()=>{
 assert.equal(new Set(templates.map(template=>template.id)).size,6);
 for(const id of templateIds)assert.equal(templateSchema.parse(id),id);
 for(const invalid of ['unknown','<script>','BLOOM'])assert.equal(templateSchema.safeParse(invalid).success,false);
});
test('monthly migration retains old payment periods, quoted amounts and gift expiry',()=>{
 const db=new DatabaseSync(':memory:');try{
  const folder=new URL('../db/migrations/',import.meta.url);
  for(const name of readdirSync(folder).filter(name=>name.endsWith('.sql')&&name<'0006_monthly_hosting.sql').sort())db.exec(readFileSync(new URL(name,folder),'utf8'));
  db.exec("INSERT INTO gifts (id,owner_id,token,content,template,plan,status,expires_at,created_at,updated_at) VALUES ('g','u','token','{}','night','basic','published',1900000000000,1,1)");
  db.exec("INSERT INTO orders (id,gift_id,owner_id,reference,reference_kind,amount,plan,method,proof_key,proof_mime,status,created_at) VALUES ('old','g','u','000123','last6',3000,'basic','KBZPay','proof','image/png','pending',1)");
  db.exec(readFileSync(new URL('0006_monthly_hosting.sql',folder),'utf8'));
  assert.deepEqual({...db.prepare('SELECT billing_period,amount,status FROM orders').get()},{billing_period:'annual',amount:3000,status:'pending'});
  assert.equal(db.prepare('SELECT expires_at FROM gifts').get().expires_at,1900000000000);
  assert.throws(()=>db.exec("UPDATE orders SET billing_period='weekly'"),/CHECK/);
 }finally{db.close();}
});

// Legacy JSON is extended without losing the customer's existing customization.
test('legacy box JSON retains color, ribbon and initials while receiving safe gift defaults',()=>{
 const old={color:'forest',ribbon:'rose',initials:'ကို & မေ'};
 assert.deepEqual(readBox(JSON.stringify(old)),{...defaultBox,...old});
});
test('gift styles and reveal effects validate independently and reject forged options',()=>{
 for(const style of ['box','bouquet','bear','heart'])for(const effect of ['hearts','petals','sparkles','none']){
  assert.equal(boxSchema.parse({...defaultBox,style,effect}).style,style);
 }
 assert.equal(boxSchema.safeParse({...defaultBox,style:'dragon'}).success,false);
 assert.equal(boxSchema.safeParse({...defaultBox,effect:'script'}).success,false);
});

import {replySchema} from '../lib/replies.ts';
test('recipient replies and gift surprises accept Myanmar and reject unsafe size/type options',()=>{
 assert.equal(replySchema.parse({requestId:crypto.randomUUID(),name:'မေ',message:'ကျေးဇူးတင်ပါတယ် ♡'}).name,'မေ');
 assert.equal(replySchema.safeParse({requestId:crypto.randomUUID(),name:'မေ',message:'x'.repeat(2001)}).success,false);
 assert.equal(replySchema.safeParse({requestId:crypto.randomUUID(),name:'မေ',message:'hi',website:'bot'}).success,false);
 assert.equal(boxSchema.safeParse({...defaultBox,flowerCount:100}).success,false);
 assert.equal(boxSchema.safeParse({...defaultBox,accessory:'script'}).success,false);
 assert.equal(boxSchema.safeParse({...defaultBox,secret:{title:'A',message:'x'.repeat(1501)}}).success,false);
 assert.equal(boxSchema.parse({...defaultBox,secret:{title:'မင်းအတွက်',message:'အချစ်စာလေး'}}).secret.title,'မင်းအတွက်');
});

// Occasion defaults preserve legacy gifts, personal writing, and private gift settings.
const {occasionIds,occasionPreset,occasionLetter,presetBox,applyOccasion,celebrationDays}=await import('../lib/occasions.ts');
test('old gift content defaults to anniversary and forged occasions are rejected',()=>{
 const {occasion,...old}=demoContent;assert.equal(contentSchema.parse(old).occasion,'anniversary');
 assert.equal(contentSchema.safeParse({...demoContent,occasion:'christmas'}).success,false);
 for(const id of occasionIds)assert.equal(contentSchema.parse({...demoContent,occasion:id}).occasion,id);
});
test('occasion design presets pass gift schema and retain private settings',()=>{
 const previous={...defaultBox,initials:'ကို & မေ',allowReply:true,secret:{title:'Secret',message:'Keep this note'}};
 for(const id of occasionIds){const next=presetBox(id,previous);assert.equal(boxSchema.safeParse(next).success,true);assert.equal(next.initials,previous.initials);assert.equal(next.allowReply,true);assert.deepEqual(next.secret,previous.secret);}
 assert.equal(occasionPreset('birthday').box.accessory,'party-hat');assert.equal(occasionPreset('wedding').box.flowerCount,7);
});
test('applying design keeps all custom writing and memory references',()=>{
 const original={...demoContent,photoIds:['a31d958f-2de6-4792-a6d4-5ae4f549bcb5']};
 const next=applyOccasion(original,'graduation','my',false);
 assert.deepEqual(next,{...original,occasion:'graduation'});assert.equal(original.occasion,'anniversary');
});
test('sample words only replace the headline and letter in the selected language',()=>{
 const next=applyOccasion(demoContent,'birthday','my',true);
 assert.equal(next.title,occasionPreset('birthday').my.title);assert.ok(next.letter.startsWith('Mayရေ၊'));assert.ok(next.letter.includes('Htet'));
 assert.equal(next.date,demoContent.date);assert.deepEqual(next.timeline,demoContent.timeline);assert.deepEqual(next.photoIds,demoContent.photoIds);
 for(const id of occasionIds){assert.ok(occasionLetter(id,'en','May','Htet').startsWith('Dear May,'));assert.ok(occasionLetter(id,'my','မေ','ထက်').startsWith('မေရေ၊'));}
});
test('celebration date uses the selected Yangon day without annual rollover',()=>{
 assert.equal(celebrationDays('2026-10-07',new Date('2026-10-06T18:00:00Z')),0);
 assert.equal(celebrationDays('2026-10-08',new Date('2026-10-06T18:00:00Z')),1);
 assert.equal(celebrationDays('2026-10-06',new Date('2026-10-06T18:00:00Z')),-1);
 assert.ok(Number.isNaN(celebrationDays('2026-02-30')));assert.ok(Number.isNaN(celebrationDays('')));
});

import {rotateGift,designThemes} from '../lib/design.ts';
test('new visual options safely upgrade old gift data and reject forged values',()=>{
 const old={color:'forest',ribbon:'rose',initials:'ကို & မေ'};
 const parsed=boxSchema.parse(old);assert.equal(parsed.finish,'matte');assert.equal(parsed.frame,'none');assert.equal(parsed.sticker,'none');assert.equal(parsed.color,old.color);
 for(const finish of ['matte','satin','pearl'])for(const frame of ['none','arch','orbit'])for(const sticker of ['none','heart','star','flower'])assert.equal(boxSchema.safeParse({...defaultBox,finish,frame,sticker}).success,true);
 for(const [key,value] of [['finish','glass'],['frame','iframe'],['sticker','<script>']])assert.equal(boxSchema.safeParse({...defaultBox,[key]:value}).success,false);
});
test('viewer rotation is finite and bounded for gestures and keyboard buttons',()=>{
 assert.equal(rotateGift(0,40),.48);assert.equal(rotateGift(0,-40),-.48);
 assert.equal(rotateGift(6,1000),Math.PI*2);assert.equal(rotateGift(-6,-1000),-Math.PI*2);
 assert.equal(rotateGift(NaN,10),0);assert.equal(rotateGift(0,Infinity),0);
});
test('every occasion has a complete design theme and compatible 3D preset',()=>{
 assert.deepEqual(Object.keys(designThemes),[...occasionIds]);
 for(const id of occasionIds){for(const key of ['paper','ink','accent','wash'])assert.match(designThemes[id][key],/^#[a-f0-9]{6}$/i);assert.ok(presetBox(id).frame!=='none');assert.ok(presetBox(id).sticker!=='none');}
});

import {musicSchema,defaultMusic,youtubeVideoId,youtubeEmbedUrl,readMusic} from '../lib/music.ts';
test('music defaults keep legacy gifts silent and validate volume/source',()=>{
 assert.deepEqual(contentSchema.parse({...demoContent,music:undefined}).music,defaultMusic);
 assert.deepEqual(readMusic(undefined),defaultMusic);
 for(const volume of [-1,101,NaN,'35'])assert.equal(musicSchema.safeParse({...defaultMusic,volume}).success,false);
 for(const source of ['script','upload'])assert.equal(musicSchema.safeParse({...defaultMusic,source}).success,false);
 assert.equal(musicSchema.safeParse({...defaultMusic,source:'youtube'}).success,false);
 assert.equal(musicSchema.parse({...defaultMusic,source:'ambient',volume:0}).volume,0);
});
test('YouTube URLs normalize only exact allowed HTTPS hosts and video IDs',()=>{
 const id='M7lc1UVf-VE';
 for(const url of ['https://youtu.be/'+id+'?t=5','https://www.youtube.com/watch?v='+id+'&list=foo','https://m.youtube.com/watch?v='+id,'https://music.youtube.com/watch?v='+id,'https://youtube.com/shorts/'+id,'https://www.youtube.com/live/'+id,'https://www.youtube-nocookie.com/embed/'+id]){
  assert.equal(youtubeVideoId(url),id);assert.equal(musicSchema.parse({...defaultMusic,source:'youtube',youtubeUrl:url}).youtubeUrl,'https://www.youtube.com/watch?v='+id);
 }
 for(const url of ['http://youtube.com/watch?v='+id,'https://youtube.com.evil.test/watch?v='+id,'https://youtube.com@evil.test/watch?v='+id,'https://evil.test/?v='+id,'javascript:alert(1)','<iframe src="https://youtube.com">','https://youtu.be/short','https://youtube.com/playlist?list=anything','https://youtube.com:444/watch?v='+id,'https://user@youtube.com/watch?v='+id])assert.equal(youtubeVideoId(url),null);
 const url=new URL(youtubeEmbedUrl('https://youtu.be/'+id,true));assert.equal(url.origin,'https://www.youtube-nocookie.com');assert.equal(url.searchParams.get('autoplay'),'0');assert.equal(url.searchParams.get('controls'),'1');assert.equal(url.searchParams.get('playlist'),id);assert.equal(url.searchParams.get('loop'),'1');assert.equal(youtubeEmbedUrl('javascript:alert(1)',false),null);
});

test('YouTube start time defaults safely, rejects invalid values and produces bounded embed parameters',()=>{
 assert.equal(musicSchema.parse({...defaultMusic,startSeconds:undefined}).startSeconds,0);
 for(const startSeconds of [-1,86401,1.5,'90',NaN])assert.equal(musicSchema.safeParse({...defaultMusic,startSeconds}).success,false);
 assert.equal(new URL(youtubeEmbedUrl('https://youtu.be/M7lc1UVf-VE',true,90)).searchParams.get('start'),'90');
 assert.equal(new URL(youtubeEmbedUrl('https://youtu.be/M7lc1UVf-VE',false,Infinity)).searchParams.get('start'),'0');
});

test('gift shop upgrades old boxes without changing their wrapping',()=>{const old={color:'forest',ribbon:'rose',initials:'ကို & မေ'};const next=boxSchema.parse(old);assert.deepEqual(next.shop,{enabled:false,items:[]});assert.equal(next.color,old.color);});
test('gift shop rejects duplicate kinds/positions and forged catalog values',()=>{for(const shop of [{enabled:true,items:[{kind:'bear',slot:0},{kind:'bear',slot:1}]},{enabled:true,items:[{kind:'bear',slot:0},{kind:'bouquet',slot:0}]},{enabled:true,items:[{kind:'script',slot:0}]},{enabled:true,items:[{kind:'bear',slot:3}]},{enabled:'yes',items:[]},{enabled:true,items:Array.from({length:4},()=>({kind:'bear',slot:0}))}])assert.equal(boxSchema.safeParse({...defaultBox,shop}).success,false);});
test('packing swaps existing items and replaces occupied positions for new items',()=>{let shop={enabled:true,items:[]};shop=placeShopItem(shop,'bear',0);shop=placeShopItem(shop,'bouquet',1);shop=placeShopItem(shop,'bear',1);assert.deepEqual(shop.items,[{kind:'bouquet',slot:0},{kind:'bear',slot:1}]);shop=placeShopItem(shop,'chocolate',1);assert.deepEqual(shop.items,[{kind:'bouquet',slot:0},{kind:'chocolate',slot:1}]);shop=removeShopItem(shop,0);assert.deepEqual(shop.items,[{kind:'chocolate',slot:1}]);});
test('packing any catalog sequence stays unique, bounded and immutable',()=>{let shop={enabled:false,items:[]};for(let n=0;n<45;n++){const old=structuredClone(shop);const next=placeShopItem(shop,shopKinds[n%3],shopSlots[Math.floor(n/3)%3]);assert.equal(shopSchema.safeParse(next).success,true);assert.deepEqual(shop,old);assert.equal(next.enabled,true);shop=next;}assert.throws(()=>placeShopItem(shop,'unknown',0));assert.throws(()=>placeShopItem(shop,'bear',100));});
test('occasion design changes preserve personally packed items',()=>{const previous={...defaultBox,shop:{enabled:true,items:[{kind:'bear',slot:2}]}};for(const id of occasionIds){assert.deepEqual(presetBox(id,previous).shop,previous.shop);assert.notEqual(presetBox(id,previous).shop.items,previous.shop.items);}});
