import {cp,mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
if(args.length>1||(args.length===1&&args[0]!=='--check'))throw Error('Usage: npm run deploy:pages [-- --check]');
const check=args[0]==='--check';
const config=JSON.parse(await readFile(join(root,'wrangler.pages.jsonc'),'utf8'));
if(!config.name||!config.pages_build_output_dir)throw Error('Set name and pages_build_output_dir in wrangler.pages.jsonc.');
const assets=resolve(root,config.pages_build_output_dir);
try{await stat(join(assets,'index.html'));}catch{throw Error('Frontend build is missing. Run npm run build before deploying Pages.');}
const staging=await mkdtemp(join(tmpdir(),'ourstory-pages-'));
try{
  // Pages rejects --config. Give it a standard config without replacing the API config.
  await writeFile(join(staging,'wrangler.jsonc'),JSON.stringify({...config,pages_build_output_dir:'dist'},null,2)+'\n');
  await cp(assets,join(staging,'dist'),{recursive:true});
  await cp(join(root,'functions'),join(staging,'functions'),{recursive:true});
  const command=check
    ?['pages','functions','build','functions','--outdir','check-worker','--build-output-directory','dist']
    :['pages','deploy','dist','--project-name',config.name,'--branch','main'];
  const code=await new Promise((done,reject)=>{
    const child=spawn(process.execPath,[join(root,'node_modules','wrangler','bin','wrangler.js'),...command],{cwd:staging,stdio:'inherit',env:process.env});
    child.once('error',reject);child.once('exit',(status,signal)=>done(status??(signal?1:0)));
  });
  process.exitCode=code;
  if(check&&code===0){
    const files=await readdir(join(staging,'check-worker'));
    if(!files.some(name=>name.endsWith('.js')))throw Error('Pages Functions build produced no Worker bundle.');
    console.log('PASS: Pages config and Functions build; API service binding retained. No deployment performed.');
  }
}finally{await rm(staging,{recursive:true,force:true});}
