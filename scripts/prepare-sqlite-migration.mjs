import {DatabaseSync} from 'node:sqlite';
import {mkdir,copyFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const source=resolve(process.argv[2]||'../OurStory_MM_Standalone/data'),output=resolve(process.argv[3]||'migration-export');
if(!process.argv.includes('--service-stopped'))throw Error('Stop the old server and email jobs first; pass --service-stopped.');
const tables=['users','profiles','gifts','media','orders','settings','audits','recipient_replies','gift_versions','gift_openings','reminder_deliveries'];
const quote=name=>'"'+name.replaceAll('"','""')+'"';
const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
await mkdir(output,{recursive:true,mode:0o700});
const db=new DatabaseSync(join(source,'ourstory.sqlite'),{readOnly:true});
const keys=new Set(),counts={},statements=[
  'CREATE TABLE _ourstory_import_guard (n INTEGER NOT NULL CHECK(n=0));',
  'INSERT INTO _ourstory_import_guard SELECT '+tables.map(t=>'(SELECT COUNT(*) FROM '+quote(t)+')').join('+')+';'
];
try{
 for(const table of tables){
  const rows=db.prepare('SELECT * FROM '+quote(table)).all();counts[table]=rows.length;
  for(const row of rows){
   if(table==='profiles'){row.renewal_reminders=0;row.opening_notifications=0;}
   if(table==='gift_openings'&&row.email_status==='pending')row.email_status='cancelled';
   if(table==='reminder_deliveries'&&row.status==='pending')row.status='cancelled';
   const fields=Object.keys(row);statements.push('INSERT INTO '+quote(table)+' ('+fields.map(quote).join(',')+') VALUES ('+fields.map(f=>literal(row[f])).join(',')+');');
   if(table==='media')keys.add(row.object_key);
   if(table==='orders'&&row.proof_key)keys.add(row.proof_key);
   if(table==='settings'&&JSON.parse(row.config).qrMime)keys.add('merchant/qr');
  }
 }
 statements.push('DROP TABLE _ourstory_import_guard;');
 const objects=[];
 for(const key of keys){
  if(!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(key)||key.split('/').some(x=>!x||x==='..'))throw Error('Unsafe object key');
  const file=join(output,'media',key);await mkdir(dirname(file),{recursive:true,mode:0o700});await copyFile(join(source,'media',key),file);objects.push({key,size:(await stat(file)).size});
 }
 await writeFile(join(output,'database.sql'),statements.join('\n')+'\n',{mode:0o600});
 await writeFile(join(output,'manifest.json'),JSON.stringify({format:'ourstory-cloudflare-migration-v1',counts,objects},null,2),{mode:0o600});
 console.log('Migration exported to '+output+'. Keep it private. Import into an EMPTY migrated D1 database and upload every manifest object before serving customers.');
}finally{db.close();}
