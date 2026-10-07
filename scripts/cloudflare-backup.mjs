import {readFile,writeFile,mkdtemp,mkdir,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {encryptArchive,backupKey} from './cloud-archive.mjs';
if(!process.argv.includes('--maintenance-enabled'))throw Error('Enable and deploy MAINTENANCE_MODE=true, wait for in-flight requests/jobs to finish, then pass --maintenance-enabled.');
const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
if(config.vars.MAINTENANCE_MODE!=='true')throw Error('Set MAINTENANCE_MODE=true and deploy first.');
const destination=resolve(process.argv.find(x=>x.endsWith('.oscb'))||'backups/ourstory-'+new Date().toISOString().replace(/[:.]/g,'-')+'.oscb');
const key=backupKey(),work=await mkdtemp(join(tmpdir(),'ourstory-cf-backup-'));
function command(args){const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:256*1024*1024});if(result.status!==0)throw Error('Cloudflare backup command failed; no complete backup was saved.');return result.stdout;}
try{
 command(['d1','export','DB','--remote','--output',join(work,'database.sql')]);
 const result=JSON.parse(command(['d1','execute','DB','--remote','--json','--command',"SELECT object_key AS key FROM media UNION SELECT proof_key AS key FROM orders WHERE proof_key<>'' UNION SELECT 'merchant/qr' AS key FROM settings WHERE json_extract(config,'$.qrMime') IS NOT NULL"]));
 const objects=[];
 for(const row of result.flatMap(x=>x.results||[])){
  const name=row.key;if(!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(name)||name.split('/').some(x=>!x||x==='..'))throw Error('Unsafe object key');
  const file=join(work,'media',name);await mkdir(dirname(file),{recursive:true,mode:0o700});
  command(['r2','object','get',config.r2_buckets[0].bucket_name+'/'+name,'--remote','--file',file]);objects.push({key:name,size:(await stat(file)).size});
 }
 await writeFile(join(work,'manifest.json'),JSON.stringify({format:'ourstory-cloudflare-system-v1',createdAt:Date.now(),objects}),{mode:0o600});
 await mkdir(dirname(destination),{recursive:true,mode:0o700});await encryptArchive(work,destination,key);console.log('Encrypted backup: '+destination);
}finally{await rm(work,{recursive:true,force:true});}
