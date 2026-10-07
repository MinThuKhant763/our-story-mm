import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Expand,Flower2,Heart,Sparkles} from 'lucide-react';
import {prettyDate,type GiftContent} from '@/lib/gifts';
import type {Language} from '@/lib/i18n';
type MemoriesProps={content:GiftContent;urls:string[];lang:Language;onPhoto:(index:number)=>void};
export function ScrapbookMemories({content,urls,lang,onPhoto}:MemoriesProps){
 const [flipped,setFlipped]=useState<number|null>(null),my=lang==='my';
 if(!urls.length)return null;
 return <section className="scrapbook-memories"><span className="gift-label">{my?'ပုံလေးတစ်ပုံ၊ အမှတ်တရတစ်ခု':'THE MOMENTS WE KEEP'}</span><h2>{my?'အမှတ်တရ မှတ်တမ်းစာအုပ်လေး။':'A scrapbook of memories.'}</h2><p className="experience-help">{my?'ဓာတ်ပုံကိုနှိပ်ပြီး နောက်ကျောက စာလေးကို ဖတ်ပါ။':'Tap a Polaroid to turn it over.'}</p><div className="scrapbook-grid">{urls.map((url,i)=>{const memory=content.timeline[i],title=memory?.title||(my?'အမှတ်တရ '+(i+1):'Memory '+(i+1)),turned=flipped===i;return <article className="scrapbook-page" key={url+i}><span className="paper-tape" aria-hidden="true"/><button className={'scrapbook-flip'+(turned?' turned':'')} aria-expanded={turned} aria-label={(my?'ပုံကိုလှည့်မယ်၊ ':'Turn photo: ')+title} onClick={()=>setFlipped(turned?null:i)}><span className="scrapbook-front" aria-hidden={turned}><img src={url} alt={title} loading="lazy"/><span>{title}</span></span><span className="scrapbook-back" aria-hidden={!turned}><Heart size={25}/><strong>{title}</strong><small>{memory?.date||prettyDate(content.date,lang)}</small><span>{content.yourName} + {content.partnerName}</span><small>{my?'မင်းနဲ့အတူ ဖြတ်သန်းခဲ့တဲ့ အခိုက်အတန့်လေး။':'A little moment, kept forever.'}</small></span></button><button className="scrapbook-expand" onClick={()=>onPhoto(i)} aria-label={(my?'ပုံအကြီးကြည့်မယ်၊ ':'Enlarge photo: ')+title}><Expand size={17}/>{my?'ပုံကြည့်မယ်':'View photo'}</button></article>;})}</div></section>;
}
export function AuroraOrbit({urls,lang,onPhoto}:Omit<MemoriesProps,'content'>){
 const [index,setIndex]=useState(0),my=lang==='my';
 useEffect(()=>setIndex(value=>Math.min(value,Math.max(0,urls.length-1))),[urls.length]);
 if(!urls.length)return null;
 const previous=(index-1+urls.length)%urls.length,next=(index+1)%urls.length;
 return <section className="aurora-orbit"><span className="gift-label"><Sparkles size={14}/>{my?'တစ်ကမ္ဘာတည်းမှာ၊ မင်းနဲ့ကိုယ်':'UNDER THE SAME SKY'}</span><h2>{my?'အမှတ်တရတွေကြားက မင်းနဲ့ကိုယ်။':'You are my favorite view.'}</h2><div className="orbit-stage"><div className="orbit-ring" aria-hidden="true"/>{urls.length>1&&<><button className="orbit-photo orbit-left" onClick={()=>setIndex(previous)} aria-label={my?'အရင်ပုံ':'Previous photo'}><img src={urls[previous]} alt="" loading="lazy"/></button><button className="orbit-photo orbit-right" onClick={()=>setIndex(next)} aria-label={my?'နောက်ပုံ':'Next photo'}><img src={urls[next]} alt="" loading="lazy"/></button></>}<button className="orbit-photo orbit-focus" onClick={()=>onPhoto(index)} aria-label={(my?'ပုံအကြီးကြည့်မယ်၊ အမှတ်တရ ':'Enlarge memory ')+(index+1)}><img src={urls[index]} alt={(my?'အမှတ်တရ ':'Memory ')+(index+1)} loading="lazy"/><span>{my?'အမှတ်တရ':'memory'} {String(index+1).padStart(2,'0')} ♡</span></button></div><div className="orbit-navigation">{urls.length>1&&<button className="btn outline small" onClick={()=>setIndex(previous)} aria-label={my?'အရင်ပုံ':'Previous photo'}><ChevronLeft size={20}/></button>}<span aria-live="polite">{index+1} / {urls.length}</span>{urls.length>1&&<button className="btn outline small" onClick={()=>setIndex(next)} aria-label={my?'နောက်ပုံ':'Next photo'}><ChevronRight size={20}/></button>}</div></section>;
}
export function AuroraJourney({content,lang}:{content:GiftContent;lang:Language}){
 const [selected,setSelected]=useState(0),my=lang==='my';
 useEffect(()=>setSelected(value=>Math.min(value,Math.max(0,content.timeline.length-1))),[content.timeline.length]);
 if(!content.timeline.length)return null;
 const active=content.timeline[selected];
 return <section className="aurora-journey"><span className="gift-label">{my?'အမှတ်တရ ခရီးစဉ်':'EVERY CHAPTER, A LITTLE LIGHT'}</span><h2>{my?'ဒီအခိုက်အတန့်ဆီ ရောက်လာတဲ့ ခရီးစဉ်။':'The journey to this moment.'}</h2><div className="journey-stops" role="group" aria-label={my?'အမှတ်တရရွေးပါ':'Choose a memory'}>{content.timeline.map((memory,i)=><button key={i} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{String(i+1).padStart(2,'0')}</span><small>{memory.title}</small></button>)}</div><article className="journey-memory" aria-live="polite"><small>{active.date}</small><h3>{active.title}</h3><p>{active.note}</p></article></section>;
}
export function GardenMemories({content,lang}:{content:GiftContent;lang:Language}){
 const [selected,setSelected]=useState(0),my=lang==='my';
 useEffect(()=>setSelected(value=>Math.min(value,Math.max(0,content.timeline.length-1))),[content.timeline.length]);
 if(!content.timeline.length)return null;
 const active=content.timeline[selected];
 return <section className="garden-memories"><span className="gift-label">{my?'အမှတ်တရတိုင်းက ပန်းလေးတစ်ပွင့်':'MEMORIES BLOOM IN LITTLE MOMENTS'}</span><h2>{my?'ပန်းပွင့်လေးတွေလို လှတဲ့ အမှတ်တရများ။':'Memories, in full bloom.'}</h2><p className="experience-help">{my?'ပန်းလေးကိုနှိပ်ပြီး အမှတ်တရ ဖတ်ပါ။':'Pick a flower to reveal a memory.'}</p><div className="memory-bouquet" role="group" aria-label={my?'အမှတ်တရပန်းလေးများ':'Memory flowers'}>{content.timeline.map((memory,i)=><button key={i} aria-label={memory.title} aria-pressed={selected===i} onClick={()=>setSelected(i)}><Flower2 size={54} strokeWidth={1}/><span>{i+1}</span><small>{memory.title}</small></button>)}</div><article className="garden-memory" aria-live="polite"><span className="garden-memory-date">{active.date}</span><h3>{active.title}</h3><p>{active.note}</p><Heart size={20}/></article></section>;
}
