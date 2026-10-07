import {useState} from 'react';
import {Heart,LockKeyhole} from 'lucide-react';
import type {BoxConfig} from '@/lib/box';
import type {Language} from '@/lib/i18n';
import {Gift3D} from './gift-3d';
export function SecretSurprise({box,lang}:{box:BoxConfig;lang:Language}){
 const [opened,setOpened]=useState(false),my=lang==='my';
 if(!box.secret.message)return null;
 return <section className="secret-surprise"><span className="eyebrow"><LockKeyhole size={14}/>{my?'လက်ဆောင်ထဲက လျှို့ဝှက်စာလေး':'ONE MORE LITTLE SURPRISE'}</span><h2>{my?'မင်းအတွက်ပဲ ရေးထားတဲ့ စာလေး။':'There is a little secret, just for you.'}</h2><Gift3D box={box} lang={lang} onGiftClick={()=>setOpened(true)}/><button type="button" className="btn outline" aria-expanded={opened} onClick={()=>setOpened(value=>!value)}>{my?(opened?'စာလေး ပြန်ပိတ်မယ်':'လက်ဆောင်ကို နှိပ်ပြီး ဖွင့်မယ်'):(opened?'Close the little note':'Tap your gift to find the secret')}</button>{opened&&<article className="secret-note" aria-live="polite"><Heart size={23}/><h3>{box.secret.title||(my?'မင်းအတွက် ♡':'Just for you ♡')}</h3><p>{box.secret.message}</p></article>}</section>;
}
