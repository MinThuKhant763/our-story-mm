import {Unzip,UnzipInflate,strFromU8} from 'fflate';
import {z} from 'zod';
import {api,origin,user,db,bucket,json,dto,giftRow,ApiError,binarySha,imageFile} from '@/lib/server';
import {contentSchema,templateSchema,plans} from '@/lib/gifts';
import {boxSchema,defaultBox} from '@/lib/box';
import {audioMime} from '@/lib/audio';

const MAX_MEDIA=32*1024*1024,MAX_MANIFEST=512*1024;
const manifestSchema=z.object({
  format:z.literal('ourstory-gift'),version:z.literal(1),content:contentSchema,
  box:boxSchema.optional(),template:templateSchema,plan:z.enum(['basic','premium']),
  voiceId:z.string().uuid().nullable(),
  files:z.array(z.object({id:z.string().uuid(),name:z.string(),mime:z.string(),size:z.number().int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/)})).max(31)
});
function invalid(){return new ApiError(400,'Choose a complete, valid OurStory gift backup.');}
function extract(bytes:Uint8Array){
  const entries=new Map<string,Uint8Array>();let total=0,count=0,problem=false;
  const unzip=new Unzip(file=>{
    const limit=file.name==='manifest.json'?MAX_MANIFEST:6*1024*1024;
    if(++count>32||entries.has(file.name)||!(file.name==='manifest.json'||/^media\/[0-9a-f-]{36}$/.test(file.name))||(file.originalSize===undefined||file.originalSize>limit)){problem=true;return;}
    entries.set(file.name,new Uint8Array());const chunks:Uint8Array[]=[];let size=0;
    file.ondata=(error,data,final)=>{
      if(error||problem){problem=true;file.terminate();return;}
      size+=data.length;total+=data.length;
      if(size>limit||total>MAX_MEDIA+MAX_MANIFEST){problem=true;file.terminate();return;}
      chunks.push(data);
      if(final){const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}entries.set(file.name,joined);}
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  try{unzip.push(bytes,true);}catch{throw invalid();}
  if(problem||!entries.has('manifest.json'))throw invalid();
  return entries;
}
export async function POST(req:Request){return api(async()=>{
  origin(req);const owner=await user(),form=await req.formData(),file=form.get('file');
  if(!(file instanceof File)||!file.size||file.size>MAX_MEDIA+MAX_MANIFEST+128*1024)throw invalid();
  const entries=extract(new Uint8Array(await file.arrayBuffer()));
  let parsed:unknown;try{parsed=JSON.parse(strFromU8(entries.get('manifest.json')!));}catch{throw invalid();}
  const result=manifestSchema.safeParse(parsed);if(!result.success)throw invalid();const manifest=result.data;
  const ids=[...manifest.content.photoIds,...(manifest.voiceId?[manifest.voiceId]:[])];
  if(new Set(ids).size!==ids.length||manifest.content.photoIds.length>plans[manifest.plan].photos||manifest.files.length!==ids.length||entries.size!==ids.length+1)throw invalid();
  const validated=new Map<string,{bytes:Uint8Array;mime:string}>();let total=0;
  for(const media of manifest.files){
    const bytes=entries.get(media.name);
    if(!ids.includes(media.id)||validated.has(media.id)||media.name!=='media/'+media.id||!bytes||bytes.length!==media.size||await binarySha(bytes)!==media.sha256)throw invalid();
    total+=bytes.length;if(total>MAX_MEDIA)throw invalid();
    let mime:string;
    if(media.id===manifest.voiceId){if(bytes.length>6*1024*1024)throw invalid();mime=audioMime(bytes);}
    else{const image=new FormData();image.set('file',new File([new Uint8Array(bytes)],'memory'));mime=(await imageFile(image)).mime;}
    if(mime!==media.mime)throw invalid();validated.set(media.id,{bytes,mime});
  }
  const id=crypto.randomUUID(),token=crypto.randomUUID().replaceAll('-',''),now=Date.now(),newIds=new Map(ids.map(old=>[old,crypto.randomUUID()]));
  const content={...manifest.content,photoIds:manifest.content.photoIds.map(old=>newIds.get(old)!)},voiceId=manifest.voiceId?newIds.get(manifest.voiceId)!:null;
  const statements=[db().prepare('INSERT INTO gifts (id,owner_id,token,content,template,plan,status,revision,box_config,voice_id,created_at,updated_at) VALUES (?,?,?,?,?,?,\'draft\',1,?,?,?,?)').bind(id,owner.userId,token,JSON.stringify(content),manifest.template,manifest.plan,JSON.stringify(manifest.box||defaultBox),voiceId,now,now)];
  const keys:string[]=[];
  try{
    for(const [old,media] of validated){const mediaId=newIds.get(old)!,key=(old===manifest.voiceId?'voice/':'photos/')+id+'/'+mediaId;keys.push(key);await bucket().put(key,media.bytes,{httpMetadata:{contentType:media.mime}});statements.push(db().prepare('INSERT INTO media (id,gift_id,owner_id,object_key,mime,created_at) VALUES (?,?,?,?,?,?)').bind(mediaId,id,owner.userId,key,media.mime,now));}
    await db().batch(statements);
  }catch(error){if(keys.length)await bucket().delete(keys);throw error;}
  return json(dto(await giftRow(id)),201);
});}
