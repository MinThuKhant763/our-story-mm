import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const directory=resolve(process.argv[2]||'migration-export');
const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
for(const object of manifest.objects){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(object.key)||object.key.split('/').some(x=>!x||x==='..'))throw Error('Unsafe object key');
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','put',config.r2_buckets[0].bucket_name+'/'+object.key,'--file',join(directory,'media',object.key),'--remote','--config','wrangler.jsonc'],{stdio:'inherit'});
 if(result.status!==0)throw Error('Upload failed. Keep the old app stopped; fix the error and retry.');
}
console.log('Referenced migration media uploaded. Verify counts and private media access before switching domains.');
