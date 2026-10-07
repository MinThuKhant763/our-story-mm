import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {encryptArchive,decryptArchive} from '../scripts/cloud-archive.mjs';
const root=new URL('../',import.meta.url).pathname;
async function schema(db){for(const name of (await readdir(join(root,'db/migrations'))).filter(x=>x.endsWith('.sql')).sort())db.exec(await readFile(join(root,'db/migrations',name),'utf8'));}
test('SQLite migration preserves business data/media and revokes credentials/queued consent',async()=>{
 const work=await mkdtemp(join(tmpdir(),'ourstory-migration-'));const source=join(work,'source'),output=join(work,'output');await mkdir(source);const db=new DatabaseSync(join(source,'ourstory.sqlite'));
 try{
  await schema(db);db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run('u','owner@example.test',"Owner's name",'scrypt:old:hash',1,123);
  db.prepare('INSERT INTO profiles (user_id,display_name,language,updated_at,renewal_reminders,opening_notifications) VALUES (?,?,?,?,1,1)').run('u',"Owner's name",'my',123);
  db.prepare('INSERT INTO gifts (id,owner_id,token,content,template,plan,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run('g','u','old-url','{}','bloom','basic',123,123);
  db.prepare('INSERT INTO media VALUES (?,?,?,?,?,?)').run('m','g','u','photos/g/m','image/png',123);
  db.prepare('INSERT INTO auth_sessions VALUES (?,?,?)').run('secret','u',Date.now()+100000);
  db.prepare("INSERT INTO settings VALUES ('workspace',?,?)").run('u',JSON.stringify({qrMime:'image/png'}));
  db.prepare("INSERT INTO gift_openings(gift_id,opened_at,email_status) VALUES('g',123,'pending')").run();
  await mkdir(join(source,'media/photos/g'),{recursive:true});await mkdir(join(source,'media/merchant'),{recursive:true});await writeFile(join(source,'media/photos/g/m'),'photo');await writeFile(join(source,'media/merchant/qr'),'qr');
  const run=spawnSync(process.execPath,['scripts/prepare-sqlite-migration.mjs',source,output,'--service-stopped'],{cwd:root,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
  const imported=new DatabaseSync(':memory:');await schema(imported);const sql=await readFile(join(output,'database.sql'),'utf8');imported.exec(sql);
  assert.equal(imported.prepare('SELECT token FROM gifts').get().token,'old-url');assert.equal(imported.prepare('SELECT password_hash FROM users').get().password_hash,'scrypt:old:hash');
  assert.equal(imported.prepare('SELECT display_name FROM users').get().display_name,"Owner's name");assert.equal(imported.prepare('SELECT COUNT(*) n FROM auth_sessions').get().n,0);
  assert.equal(imported.prepare('SELECT renewal_reminders FROM profiles').get().renewal_reminders,0);assert.equal(imported.prepare('SELECT opening_notifications FROM profiles').get().opening_notifications,0);assert.equal(imported.prepare('SELECT email_status FROM gift_openings').get().email_status,'cancelled');
  assert.equal(await readFile(join(output,'media/photos/g/m'),'utf8'),'photo');assert.equal(await readFile(join(output,'media/merchant/qr'),'utf8'),'qr');
  assert.throws(()=>imported.exec(sql),/CHECK constraint failed/);imported.close();
 }finally{db.close();await rm(work,{recursive:true,force:true});}
});
test('Cloudflare SQL/media archive authenticates encryption and rejects incorrect keys',async()=>{
 const work=await mkdtemp(join(tmpdir(),'ourstory-archive-'));try{
  const source=join(work,'source');await mkdir(join(source,'media/photos/g'),{recursive:true});await writeFile(join(source,'manifest.json'),JSON.stringify({format:'ourstory-cloudflare-system-v1',objects:[]}));await writeFile(join(source,'database.sql'),'CREATE TABLE example(x TEXT);');await writeFile(join(source,'media/photos/g/p'),'private memory');
  const key=randomBytes(32),file=join(work,'backup.oscb');await encryptArchive(source,file,key);const destination=join(work,'good');await mkdir(destination);const unpacked=await decryptArchive(file,destination,key);
  assert.equal(await readFile(join(unpacked,'database.sql'),'utf8'),'CREATE TABLE example(x TEXT);');assert.equal(await readFile(join(unpacked,'media/photos/g/p'),'utf8'),'private memory');
  const bad=join(work,'bad');await mkdir(bad);await assert.rejects(()=>decryptArchive(file,bad,randomBytes(32)));
 }finally{await rm(work,{recursive:true,force:true});}
});
