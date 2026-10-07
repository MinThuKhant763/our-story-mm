import {mkdtemp,readFile,cp,rm,mkdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {decryptArchive,backupKey} from './cloud-archive.mjs';
const file=process.argv[2],destination=resolve(process.argv[3]||'restore-export');
if(!file)throw Error('Usage: node scripts/unpack-cloudflare-backup.mjs backup.oscb new-restore-directory');
await mkdir(destination,{mode:0o700});
const work=await mkdtemp(join(tmpdir(),'ourstory-cf-restore-'));
try{
 const extracted=await decryptArchive(resolve(file),work,backupKey());
 const manifest=JSON.parse(await readFile(join(extracted,'manifest.json'),'utf8'));
 if(manifest.format!=='ourstory-cloudflare-system-v1')throw Error('Use a Cloudflare system backup.');
 for(const object of manifest.objects){if(!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(object.key)||object.key.split('/').some(x=>!x||x==='..'))throw Error('Unsafe object key');if((await stat(join(extracted,'media',object.key))).size!==object.size)throw Error('Incomplete media backup');}
 await cp(extracted,destination,{recursive:true,errorOnExist:true,force:false});
 console.log('Decrypted backup: '+destination+'. Restore SQL to a NEW empty D1 database and upload media to a NEW private R2 bucket before switching bindings. See DEPLOY_CLOUDFLARE.md.');
}finally{await rm(work,{recursive:true,force:true});}
