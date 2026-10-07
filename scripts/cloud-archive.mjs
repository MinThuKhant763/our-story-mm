import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {appendFile,rename,stat,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
export function backupKey(){const key=Buffer.from(process.env.BACKUP_KEY||'','base64');if(key.length!==32)throw Error('BACKUP_KEY must be the original base64 32-byte encryption key.');return key;}
function tar(args,capture=false){const child=spawn('tar',args,{stdio:['ignore','pipe','pipe']});let output='';child.stderr.resume();if(capture)child.stdout.on('data',b=>output+=b);const finished=new Promise((accept,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?accept(output):reject(Error('Archive operation failed.')));});return {child,finished};}
export async function encryptArchive(directory,path,key){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),temporary=path+'.tmp';
 const {child,finished}=tar(['-C',directory,'-czf','-','.']);
 const output=createWriteStream(temporary,{flags:'wx',mode:0o600});output.write(Buffer.concat([Buffer.from('OSCLOUD1'),iv]));
 await Promise.all([pipeline(child.stdout,cipher,output),finished]);
 await appendFile(temporary,cipher.getAuthTag());await rename(temporary,path);
}
export async function decryptArchive(path,work,key){
 const info=await stat(path);if(info.size<37)throw Error('Invalid cloud backup.');
 const header=[];for await(const b of createReadStream(path,{start:0,end:19}))header.push(b);const h=Buffer.concat(header);
 if(h.subarray(0,8).toString()!=='OSCLOUD1')throw Error('Use a cloud .oscb backup. For SQLite use the migration export tool.');
 const tags=[];for await(const b of createReadStream(path,{start:info.size-16}))tags.push(b);
 const decipher=createDecipheriv('aes-256-gcm',key,h.subarray(8,20));decipher.setAuthTag(Buffer.concat(tags));
 const archive=work+'/archive.tar.gz';await pipeline(createReadStream(path,{start:20,end:info.size-17}),decipher,createWriteStream(archive,{mode:0o600,flags:'wx'}));
 const listing=await tar(['-tzf',archive],true).finished;
 const names=listing.trim().split('\n');
 if(names.some(n=>n.startsWith('/')||n.split('/').includes('..')||!(n==='./'||n==='./manifest.json'||n==='./database.sql'||n.startsWith('./media/'))))throw Error('Invalid cloud backup paths.');
 const details=await tar(['-tvzf',archive],true).finished;if(details.trim().split('\n').some(n=>!['-','d'].includes(n[0])))throw Error('Archive links and special files are not allowed.');
 const directory=work+'/extracted';await mkdir(directory,{mode:0o700});await tar(['--no-same-owner','--no-same-permissions','-xzf',archive,'-C',directory],true).finished;
 return directory;
}
