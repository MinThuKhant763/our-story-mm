import {z} from 'zod';
export const ambientTracks=[
 {id:'piano',name:'Tender keys',my:'နူးညံ့တဲ့ တေးသွား',file:'/audio/tender-keys.wav'},
 {id:'dream',name:'Moonlit dream',my:'လရောင် အိပ်မက်',file:'/audio/moonlit-dream.wav'},
 {id:'garden',name:'Garden chimes',my:'ပန်းဥယျာဉ် တေးသံ',file:'/audio/garden-chimes.wav'}
] as const;
/** Accept complete video URLs, never arbitrary embed HTML or external player hosts. */
export function youtubeVideoId(input:string):string|null{
 try{
  const u=new URL(input.trim());if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  let id:string|null=null;
  if(u.hostname==='youtu.be'&&/^\/[\w-]{11}\/?$/.test(u.pathname))id=u.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname)){
   if(u.pathname==='/watch')id=u.searchParams.get('v');
   else if(/^\/(shorts|embed|live)\/[\w-]{11}\/?$/.test(u.pathname))id=u.pathname.split('/')[2];
  }else if(u.hostname==='www.youtube-nocookie.com'&&/^\/embed\/[\w-]{11}\/?$/.test(u.pathname))id=u.pathname.split('/')[2];
  return id&&/^[\w-]{11}$/.test(id)?id:null;
 }catch{return null;}
}
export const defaultMusic={source:'none' as const,ambient:'piano' as const,youtubeUrl:'',volume:35,loop:true,startSeconds:0};
export const musicSchema=z.object({startSeconds:z.number().int().min(0).max(86400).default(0),source:z.enum(['none','ambient','youtube']).default('none'),ambient:z.enum(['piano','dream','garden']).default('piano'),youtubeUrl:z.string().trim().max(500).refine(s=>!s||!!youtubeVideoId(s),'Use a valid HTTPS YouTube video link.').transform(s=>s?'https://www.youtube.com/watch?v='+youtubeVideoId(s):''),volume:z.number().int().min(0).max(100).default(35),loop:z.boolean().default(true)}).superRefine((m,ctx)=>{if(m.source==='youtube'&&!m.youtubeUrl)ctx.addIssue({code:z.ZodIssueCode.custom,path:['youtubeUrl'],message:'Add a YouTube video link or choose another music source.'});});
export type MusicConfig=z.infer<typeof musicSchema>;
export function readMusic(value:unknown):MusicConfig{const parsed=musicSchema.safeParse(value);return parsed.success?parsed.data:{...defaultMusic};}
export function youtubeEmbedUrl(link:string,loop:boolean,startSeconds=0){const id=youtubeVideoId(link);if(!id)return null;const query=new URLSearchParams({start:String(Number.isInteger(startSeconds)?Math.max(0,Math.min(86400,startSeconds)):0),autoplay:'0',controls:'1',playsinline:'1',rel:'0',loop:loop?'1':'0',...(loop?{playlist:id}:{})});return 'https://www.youtube-nocookie.com/embed/'+id+'?'+query;}
