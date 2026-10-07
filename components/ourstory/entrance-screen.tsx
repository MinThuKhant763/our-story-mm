import {useEffect,useRef,useState,type RefObject} from 'react';
import {GiftIllustration} from './gift-illustration';
import {presetBox} from '@/lib/occasions';
import type {Language} from '@/lib/i18n';
export const entranceSessionKey='ourstory:entrance:v1';
export function EntranceScreen({onClose,returnFocus,lang,onLanguage}:{onClose:()=>void;returnFocus:RefObject<HTMLButtonElement|null>;lang:Language;onLanguage:()=>void}){
 const [leaving,setLeaving]=useState(false),dialog=useRef<HTMLDivElement>(null),enter=useRef<HTMLButtonElement>(null),my=lang==='my';
 useEffect(()=>{const before=document.body.style.overflow;document.body.style.overflow='hidden';enter.current?.focus();return()=>{document.body.style.overflow=before;returnFocus.current?.focus({preventScroll:true});};},[returnFocus]);
 useEffect(()=>{if(!leaving)return;const timer=setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);return()=>clearTimeout(timer);},[leaving,onClose]);
 const close=()=>{try{sessionStorage.setItem(entranceSessionKey,'seen');}catch{/* Storage is optional. */}setLeaving(true);};
 return <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="entrance-title" className={'entrance-screen '+(leaving?'is-leaving':'')} lang={lang} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])')||[]),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
  <span className="entrance-brand">OurStory<span>♡</span></span><button type="button" className="entrance-language" onClick={onLanguage}>{my?'English':'မြန်မာ'}</button>
  <div className="entrance-orbit" aria-hidden="true"><span>✦</span><GiftIllustration box={presetBox('anniversary')}/><span>✧</span></div>
  <div className="eyebrow">{my?'ချစ်ရသူအတွက် အမှတ်တရကမ္ဘာလေး':'A LITTLE WORLD, MADE WITH LOVE'}</div><h1 id="entrance-title">{my?<>အမှတ်တရတွေကို<br/>လက်ဆောင်ပေးပါ။</>:<>Some moments deserve<br/><em>a little magic.</em></>}</h1><p>{my?'ကိုယ့်စကားလေးတွေ၊ ဓာတ်ပုံတွေနဲ့ ကိုယ်ပိုင် 3D လက်ဆောင်ကို ဖန်တီးမယ်။':'Your words. Your memories. A gift that feels like you.'}</p>
  <button ref={enter} type="button" className="btn primary" disabled={leaving} onClick={close}>{my?'အမှတ်တရကမ္ဘာထဲ ဝင်မယ်':'Enter OurStory'} <span aria-hidden="true">↗</span></button><button type="button" className="text-link" onClick={close}>{my?'Animation ကျော်မယ်':'Skip intro'}</button><small>{my?'မြန်မာမှ ချစ်ခြင်းမေတ္တာဖြင့်':'Made with love, from Myanmar'} ♡</small>
 </div>;
}
