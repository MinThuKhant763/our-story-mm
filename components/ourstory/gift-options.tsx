import {giftStyles,type BoxConfig} from '@/lib/box';
import type {Language} from '@/lib/i18n';
import {GiftIllustration} from './gift-illustration';
export function GiftStyleOptions({box,onChange,lang}:{box:BoxConfig;onChange:(box:BoxConfig)=>void;lang:Language}){
 return <div className="gift-style-options" role="group" aria-label={lang==='my'?'လက်ဆောင်ပုံစံ ရွေးပါ':'Choose your gift style'}>{giftStyles.map(style=><button type="button" key={style.id} aria-pressed={box.style===style.id} className={box.style===style.id?'selected':''} onClick={()=>onChange({...box,style:style.id})}><GiftIllustration box={{...box,style:style.id}}/><strong>{lang==='my'?style.my:style.name}</strong><span>{lang==='my'?style.myDescription:style.description}</span></button>)}</div>;
}
