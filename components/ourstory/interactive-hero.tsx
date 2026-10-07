import {useEffect,useState} from 'react';
import {Gift3D} from './gift-3d';
import {giftStyles,type BoxConfig} from '@/lib/box';
import {occasionIds,occasionPreset,occasionWords,presetBox,type OccasionId} from '@/lib/occasions';
import {designThemes} from '@/lib/design';
import type {Language} from '@/lib/i18n';
export function InteractiveHero({occasion,onOccasion,lang,active}:{occasion:OccasionId;onOccasion:(id:OccasionId)=>void;lang:Language;active:boolean}){
 const [box,setBox]=useState(presetBox(occasion)),[opening,setOpening]=useState(false),my=lang==='my';
 useEffect(()=>{setBox(presetBox(occasion));setOpening(false);},[occasion]);
 useEffect(()=>{if(!opening)return;const timer=setTimeout(()=>setOpening(false),2600);return()=>clearTimeout(timer);},[opening]);
 return <div className="interactive-hero-art"><div className="hero-art-topline"><span>{String(occasionIds.indexOf(occasion)+1).padStart(2,'0')} / 05 · {designThemes[occasion].name}</span><span>PERSONAL • PLAYFUL • YOURS</span></div><div className="hero-stage-glow" aria-hidden="true"/><div className="hero-gift-caption"><span>{my?'လက်ဆောင်ပုံစံ စမ်းကြည့်ပါ':'A surprise you can touch.'}</span><small>{occasionWords(occasion,lang).name} ♡</small></div><Gift3D box={{...box,sticker:box.sticker==='heart'?'none':box.sticker,initials:'H & M'}} lang={lang} active={active} opening={opening}/>
  <div className="hero-style-pills" aria-label={my?'3D လက်ဆောင်ပုံစံ':'3D gift style'}>{giftStyles.map(style=><button type="button" key={style.id} aria-pressed={box.style===style.id} onClick={()=>{setOpening(false);setBox(v=>({...v,style:style.id as BoxConfig['style']}));}}>{my?style.my:style.name}</button>)}</div>
  <button type="button" className="hero-open-preview" disabled={opening} onClick={()=>setOpening(true)}>{my?(opening?'ဖွင့်ကြည့်နေပါတယ်…':'ဖွင့်ကြည့်မယ် ✦'):(opening?'A little magic…':'Try the reveal ✦')}</button>
  <div className="hero-occasion-label">{my?'နေ့ထူးနဲ့ theme ရွေးပါ':'Choose a moment. Change the mood.'}</div><div className="hero-occasion-pills">{occasionIds.map(id=><button type="button" key={id} aria-pressed={occasion===id} onClick={()=>onOccasion(id)}>{occasionWords(id,lang).name}</button>)}</div>
  <div className="hero-preview-links"><a href={'/demo/'+occasionPreset(occasion).template+'?occasion='+occasion+'&gift='+box.style+'&lang='+lang}>{my?'လက်ခံသူ မြင်ရမယ့်နမူနာ':'Preview the full experience'} ↗</a><a href={'/create?occasion='+occasion+'&gift='+box.style}>{my?'ဒီလက်ဆောင်နဲ့ စမယ်':'Create this gift'} →</a></div>
 </div>;
}
