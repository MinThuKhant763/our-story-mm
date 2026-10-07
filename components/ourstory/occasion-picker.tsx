import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { occasionPresets, occasionWords, occasionArtwork, type OccasionId } from '@/lib/occasions';
import type { Language } from '@/lib/i18n';
import { Modal } from './common';

export function OccasionPicker({ value, lang, disabled, onApply }: { value: OccasionId; lang: Language; disabled?: boolean; onApply: (id: OccasionId, sampleWords: boolean) => void }) {
  const [pending, setPending] = useState<OccasionId | null>(null);
  const my = lang === 'my';
  return <section className="occasion-picker">
    <div className="section-inline"><h3><Sparkles size={18}/> {my ? 'ဘယ်အခါသမယအတွက်လဲ။' : 'What are we celebrating?'}</h3></div>
    <p className="muted">{my ? 'စာသားနမူနာ၊ ဒီဇိုင်းနဲ့ 3D gift အလှကို အတူရွေးပါ။ နောက်မှ စိတ်ကြိုက်ပြင်နိုင်ပါတယ်။' : 'Start with matching words, a design and a 3D gift. Make each detail yours.'}</p>
    <div className="occasion-options" role="group" aria-label={my ? 'အခါသမယရွေးပါ' : 'Choose an occasion'}>{occasionPresets.map(p => <button type="button" key={p.id} aria-pressed={p.id === value} disabled={disabled} onClick={() => setPending(p.id)}>
      <img src={occasionArtwork(p.id)} width={160} height={160} alt="" loading="lazy"/>
      <span>{p[lang].name}{p.id === value && <Check size={15}/>}</span>
    </button>)}</div>
    {pending && <Modal lang={lang} title={occasionWords(pending, lang).name} onClose={() => setPending(null)}>
      <div className="dialog-body preset-dialog"><img src={occasionArtwork(pending)} width={320} height={320} alt=""/><p>{occasionWords(pending, lang).description}</p><blockquote>{occasionWords(pending, lang).title}</blockquote>
        <p className="muted">{my ? 'ဒီဇိုင်းနှင့် gift အလှ ပြောင်းမယ်။ နာမည်၊ နေ့စွဲ၊ ဓာတ်ပုံ၊ အမှတ်တရ၊ PIN၊ reply နဲ့ secret surprise တွေ ဆက်ရှိမယ်။ စာသားနမူနာရွေးလျှင် လက်ရှိခေါင်းစဉ်နှင့် စာကို အစားထိုးမယ်။' : 'This applies the design and gift styling. Names, dates, photos, memories, PIN, replies and secret surprise stay saved. Sample words replace your current headline and letter.'}</p>
        <div className="button-row"><button type="button" className="btn outline" onClick={() => { onApply(pending, false); setPending(null); }}>{my ? 'လက်ရှိစာကို ထိန်းပြီး ဒီဇိုင်းပြောင်းမယ်' : 'Keep my words, apply design'}</button><button type="button" className="btn primary" onClick={() => { onApply(pending, true); setPending(null); }}>{my ? 'ဒီဇိုင်းနှင့် စာသားနမူနာကို သုံးမယ်' : 'Apply design + sample words'}</button></div>
      </div>
    </Modal>}
  </section>;
}

export function OccasionCollection({ my = false }: { my?: boolean }) {
  const lang = my ? 'my' : 'en';
  return <section id="occasions" lang={lang} className="occasion-collection section-wrap"><div className="section-top"><div><div className="eyebrow">{my ? 'အမှတ်တရနေ့တိုင်းအတွက်' : 'EVERY REASON TO CELEBRATE'}</div><h2>{my ? 'နေ့ထူးလေးတိုင်းအတွက် လက်ဆောင်တစ်ခု။' : <>Their day. <em>Your thoughtful touch.</em></>}</h2><p>{my ? 'အခါသမယနဲ့လိုက်တဲ့ စာသား၊ ဒီဇိုင်းနဲ့ gift အလှကနေ စတင်ပါ။' : 'Matching words, colors and gifts for five meaningful occasions.'}</p></div></div><div className="occasion-cards">{occasionPresets.map(p => <article key={p.id} className="occasion-card"><a href={'/create?occasion=' + p.id} className="occasion-card-main"><img src={occasionArtwork(p.id)} width={480} height={480} alt="" loading="lazy"/><div><h3>{p[lang].name}</h3><p>{p[lang].description}</p><span>{my ? 'ဒီ preset နဲ့ စမယ်' : 'Start with this preset'} ↗</span></div></a><a className="occasion-demo-link" href={'/demo/'+p.template+'?occasion='+p.id+'&lang='+lang}>{my?'နမူနာကြည့်မယ်':'Preview this occasion'} →</a></article>)}</div></section>;
}
