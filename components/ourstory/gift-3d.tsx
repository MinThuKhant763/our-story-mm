import {Component,lazy,Suspense,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {boxColors,ribbonColors,giftStyles,defaultBox,type BoxConfig} from '@/lib/box';
import {rotateGift} from '@/lib/design';
import type {OccasionId} from '@/lib/occasions';
import {translator,type Language} from '@/lib/i18n';
import {PackedGiftContents} from './gift-shop';
import {SecretSurprise} from './secret-surprise';
import {ShopItemArt} from './gift-shop-art';
import {GiftIllustration} from './gift-illustration';
const Scene=lazy(()=>import('./gift-scene'));
function Fallback({box}:{box:BoxConfig}){return <div className="gift-box-fallback sculpted-fallback" aria-hidden="true"><GiftIllustration box={box}/>{box.style==='box'&&box.shop.enabled&&<div className="fallback-packed-items">{[...box.shop.items].sort((a,b)=>a.slot-b.slot).map(item=><ShopItemArt key={item.kind} kind={item.kind}/>)}</div>}</div>;}
class SafeScene extends Component<{children:ReactNode;box:BoxConfig;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?<Fallback box={this.props.box}/>:this.props.children;}}
export function Gift3D({opening=false,box=defaultBox,lang='en',onGiftClick,active=true}:{opening?:boolean;box?:BoxConfig;lang?:Language;onGiftClick?:()=>void;active?:boolean}){
 const t=translator(lang),host=useRef<HTMLDivElement>(null),[enabled,setEnabled]=useState(false),[simple,setSimple]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[yaw,setYaw]=useState(0);
 const gesture=useRef<{id:number;x:number;y:number;yaw:number;moved:boolean}|null>(null);
 const handleFailure=useCallback(()=>setFailed(true),[]);
 const style=giftStyles.find(item=>item.id===box.style)||giftStyles[0],interactive=enabled&&!simple&&!failed&&active;
 useEffect(()=>{let visible=false;const update=()=>setEnabled(visible&&document.visibilityState==='visible');const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;update();});if(host.current)observer.observe(host.current);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};},[]);
 return <div ref={host} className={'gift-canvas gift-stage '+(opening?'is-revealing':'')} data-gift-style={box.style} data-finish={box.finish} data-frame={box.frame}>
  <div className="gift-stage-model" role="img" aria-label={(lang==='my'?style.my:style.name)+', '+t(boxColors[box.color].name)+', '+t(ribbonColors[box.ribbon].name)+(box.initials?', '+box.initials:'')}
   onPointerDown={e=>{if(!interactive||e.isPrimary===false||e.button!==0)return;gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e=>{const g=gesture.current;if(!interactive||!g||g.id!==e.pointerId||!e.buttons)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.moved&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)+4)g.moved=true;if(g.moved){e.preventDefault();setYaw(rotateGift(g.yaw,dx));}}}
   onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
   onPointerCancel={()=>{gesture.current=null;}}
   onClick={()=>{if(!gesture.current?.moved)onGiftClick?.();}}>
   {enabled&&!simple&&!failed&&active?<SafeScene key={box.style+attempt} box={box} onFailure={handleFailure}><Suspense fallback={<Fallback box={box}/>}><Scene opening={opening} box={box} yaw={yaw} onFailure={handleFailure}/></Suspense></SafeScene>:<Fallback box={box}/>}
  </div>
  {box.style!=='box'&&box.initials&&<span className="gift-initials-tag">{box.initials}</span>}
  {opening&&box.effect!=='none'&&<div className={'reveal-particles '+box.effect} aria-hidden="true">{Array.from({length:14},(_,i)=><span key={i} style={{'--dx':((i%7)-3)*36+'px','--delay':i*.04+'s','--turn':(i%2?1:-1)*(25+i*8)+'deg'} as React.CSSProperties}>{box.effect==='hearts'?'♥':box.effect==='sparkles'?'✦':''}</span>)}</div>}
  <div className="gift-interaction-tools"><div className="gift-rotate-buttons" aria-label={lang==='my'?'လက်ဆောင်လှည့်ကြည့်ရန်':'Rotate gift'}><button type="button" disabled={!interactive} aria-label={lang==='my'?'ဘယ်ဘက်လှည့်မယ်':'Rotate left'} onClick={()=>setYaw(v=>rotateGift(v,-40))}>↶</button><button type="button" disabled={!interactive} onClick={()=>setYaw(0)}>{lang==='my'?'မူလပုံစံ':'Reset'}</button><button type="button" disabled={!interactive} aria-label={lang==='my'?'ညာဘက်လှည့်မယ်':'Rotate right'} onClick={()=>setYaw(v=>rotateGift(v,40))}>↷</button></div><button type="button" className="simple-view-toggle" aria-pressed={simple} onClick={()=>{setSimple(v=>failed?false:!v);setFailed(false);setAttempt(v=>v+1);}}>{failed?(lang==='my'?'3D ပြန်စမ်းမယ်':'Retry 3D'):lang==='my'?(simple?'3D ပုံစံသုံးမယ်':'ပုံမှန်ပုံစံသုံးမယ်'):(simple?'Use 3D view':'Use simple view')}</button></div>
  <small className="gift-drag-hint">{interactive?(lang==='my'?'ဆွဲလှည့်ကြည့်ပါ · ခလုတ်နဲ့လည်း လှည့်နိုင်ပါတယ်':'Drag to turn · buttons work too'):(lang==='my'?'ပုံမှန် preview · animation မပါလည်း ဖတ်နိုင်ပါတယ်':'Simple preview · your story works without animation')}</small>
 </div>;
}
export function GiftReveal({children,box=defaultBox,lang='en',recipient='',occasion='anniversary',onOpened,openingNotice=false}:{children:ReactNode;box?:BoxConfig;lang?:Language;recipient?:string;occasion?:OccasionId;onOpened?:()=>void;openingNotice?:boolean}){
 const t=translator(lang),[phase,setPhase]=useState<'envelope'|'gift'|'story'>('envelope'),[unsealing,setUnsealing]=useState(false),[opening,setOpening]=useState(false),focus=useRef<HTMLDivElement>(null),firstRender=useRef(true),style=giftStyles.find(item=>item.id===box.style)||giftStyles[0];
 useEffect(()=>{if(!opening)return;const timer=setTimeout(()=>setPhase('story'),2400);return()=>clearTimeout(timer);},[opening]);
 useEffect(()=>{if(!unsealing)return;const timer=setTimeout(()=>setPhase('gift'),850);return()=>clearTimeout(timer);},[unsealing]);
 useEffect(()=>{if(firstRender.current){firstRender.current=false;return;}focus.current?.focus({preventScroll:true});focus.current?.scrollIntoView({block:'start',behavior:'instant'});},[phase]);
 useEffect(()=>{if(phase==='story')onOpened?.();},[phase,onOpened]);
 const skip=()=>{setOpening(false);setUnsealing(false);setPhase('story');};
 if(phase==='story')return <div ref={focus} tabIndex={-1} className="story-entrance occasion-theme" data-occasion={occasion} lang={lang} aria-label={lang==='my'?'မင်းအတွက် လက်ဆောင်စာလေး':'Your gift story'}><div className="gift-replay-bar"><span>{lang==='my'?style.my:style.name} ♡</span><button type="button" onClick={()=>{setOpening(false);setUnsealing(false);setPhase('envelope');}}>{lang==='my'?'လက်ဆောင်လေး ပြန်ဖွင့်မယ်':'Open my gift again'}</button></div><SecretSurprise box={box} lang={lang}/><PackedGiftContents box={box} lang={lang}/>{children}</div>;
 return <main lang={lang} data-occasion={occasion} className={'gift-reveal occasion-theme reveal-'+box.style}>
  <div ref={focus} tabIndex={-1} className="reveal-content" aria-label={phase==='envelope'?'A letter for you':'Your gift'}><div className="reveal-halo" aria-hidden="true"/>
  <span className="eyebrow">{t('SOMEONE MADE THIS JUST FOR YOU')}</span>
  {phase==='envelope'?<><h1>{lang==='my'?'မင်းအတွက် စာလေးတစ်စောင်။':'A letter, just for you.'}</h1><p className="reveal-style-note">{lang==='my'?'စာအိတ်လေး ဖွင့်ပြီး surprise လေးကို ကြည့်ရအောင်။':'Break the seal. There is a little surprise inside.'}</p><div className={'keepsake-envelope '+(unsealing?'is-unsealing':'')} aria-hidden="true"><div className="envelope-letter">{lang==='my'?'မင်းအတွက် အမှတ်တရလေး ♡':'A little world, made for you ♡'}</div><div className="envelope-back"/><div className="envelope-flap"/><div className="envelope-front"><span>{lang==='my'?'သို့':'To'}</span><strong>{recipient||(lang==='my'?'ချစ်ခင်ရသူ':'my favorite person')}</strong></div><span className="wax-seal">♡</span></div><button type="button" className="btn primary" disabled={unsealing} onClick={()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)setPhase('gift');else setUnsealing(true);}}>{lang==='my'?(unsealing?'စာအိတ်ဖွင့်နေပါတယ်…':'စာအိတ်လေး ဖွင့်မယ်'):(unsealing?'Opening your letter…':'Open the envelope')}</button></>:<><h1>{t('A little surprise.')}<br/><em>{t('A whole lot of love.')}</em></h1><p className="reveal-style-note">{lang==='my'?style.myDescription:style.description}</p><Gift3D opening={opening} box={box} lang={lang}/><button type="button" className="btn primary" disabled={opening} onClick={()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)setPhase('story');else setOpening(true);}}>{t(opening?'Unwrapping your story…':'Open your gift ♡')}</button></>}
  {openingNotice&&<small className="opening-disclosure">{lang==='my'?'လက်ဆောင်ဖွင့်ချိန်ကို ပေးပို့သူအား အသိပေးမည်။ သင့်နာမည်နှင့် တည်နေရာကို မသိမ်းပါ။':'Opening this gift notifies its creator. We do not record your name or location.'}</small>}
  <button type="button" className="text-link" onClick={skip}>{t('Skip animation & read my story')}</button><small className="reveal-footer">{lang==='my'?'ချစ်ရသူအတွက် ရွေးထားတဲ့ လက်ဆောင်လေး ♡':'Chosen with love. Made just for you.'}</small></div>
 </main>;
}
