import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Heart, ImagePlus, Trash2, Plus, Star, LockKeyhole, Save, Send, Upload, LoaderCircle, Download, Share2 } from 'lucide-react';
import { Header, Footer, ErrorBox, Loader, Modal, ShareModal, compressImage, request, downloadBlob } from './common';
import { LanguageSwitch, useLanguage } from './language-switch';
import {lastSixSchema,normalizeTransactionDigits} from '@/lib/payments';
import { OccasionPicker } from './occasion-picker';
import { applyOccasion, presetBox, occasionPreset, occasionWords, occasionLetter, type OccasionId } from '@/lib/occasions';
import {VersionHistory} from './version-history';
import {MusicPicker} from './music-picker';
import { BoxPicker } from './box-picker';
import { GiftReveal } from './gift-3d';
import { defaultBox, coupleInitials, type BoxConfig } from '@/lib/box';
import { translator, localizeError, type Language } from '@/lib/i18n';
import { GiftView } from './gift-view';
import { emptyContent, contentSchema, yangonInput, revealTimestamp, templates, plans, mmk, type Gift, type GiftContent, type Plan, type TemplateId, type PaymentConfig, type Order } from '@/lib/gifts';
type Workspace = {
    isAdmin: boolean;
    setupNeeded: boolean;
    config: PaymentConfig;
    orders: Order[];
};
export function Editor({ name, giftId, initialTemplate = 'bloom', initialPlan = 'basic', initialLanguage = 'my', initialStep = 0, initialGiftStyle = 'box', initialOccasion = 'anniversary' }: {
    name: string;
    initialOccasion?: OccasionId;
    giftId?: string;
    initialTemplate?: TemplateId;
    initialGiftStyle?: BoxConfig['style'];
    initialPlan?: Plan;
    initialLanguage?: Language;initialStep?:number;
}) {
    const { lang, changeLanguage, languageSaving, languageError } = useLanguage(initialLanguage);
    const t = translator(lang);
    const [history,setHistory]=useState(false);
    const [box, setBox] = useState<BoxConfig>({ ...defaultBox }), [openingPreview, setOpeningPreview] = useState(false);
    const [gift, setGift] = useState<Gift | null>(null), [content, setContent] = useState<GiftContent>({ ...emptyContent }), [template, setTemplate] = useState<TemplateId>(initialTemplate), [plan, setPlan] = useState<Plan>(initialPlan), [pin, setPin] = useState<string | undefined>(undefined), [revealAt, setRevealAt] = useState<number | null>(null);
    const [step, setStep] = useState(initialStep), [loading, setLoading] = useState(true), [error, setError] = useState(''), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [uploading, setUploading] = useState(false), [busy, setBusy] = useState(false), [preview, setPreview] = useState(false), [share, setShare] = useState(false), [ws, setWs] = useState<Workspace | null>(null), [reference, setReference] = useState(''), [proof, setProof] = useState<File | null>(null), [paymentSent, setPaymentSent] = useState(false), [uploaded, setUploaded] = useState<{
        id: string;
        url: string;
    }[]>([]);
    const started = useRef(false), revision = useRef(1), giftRef = useRef<Gift | null>(null), savedFingerprint = useRef(''), saveQueue = useRef<Promise<Gift | null>>(Promise.resolve(null)), current = useRef({ content, template, plan, pin, revealAt, box });
    current.current = { content, template, plan, pin, revealAt, box };
    giftRef.current = gift;
    function fill(g: Gift) { setPin(undefined);setGift(g); giftRef.current = g; setContent(g.content); setTemplate(g.template); setPlan(g.plan); setBox(g.box || { ...defaultBox }); setRevealAt(g.revealAt || null); revision.current = g.revision; savedFingerprint.current = JSON.stringify({ content: g.content, template: g.template, plan: g.plan, pin: undefined, revealAt: g.revealAt || null, box: g.box || { ...defaultBox } }); setSaved(true); }
    async function workspace() { setWs(await request<Workspace>('/api/workspace')); }
    useEffect(() => { if (started.current)
        return; started.current = true; (async () => { try {
        const g = giftId ? await request<Gift>('/api/gifts/' + giftId) : await request<Gift>('/api/gifts', { method: 'POST', body: JSON.stringify({ occasion: initialOccasion, template: initialTemplate, plan: initialPlan, box: {...presetBox(initialOccasion),style:initialGiftStyle,...(initialGiftStyle==='bouquet'?{effect:'petals'}:{})} }) });
        fill(g);
        if (!giftId)
            window.history.replaceState(null, '', '/edit/' + g.id);
        setUploaded(await request('/api/gifts/' + g.id + '/photos'));
        await workspace();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setLoading(false);
    } })(); }, []);
    function update<K extends keyof GiftContent>(key: K, value: GiftContent[K]) { setSaved(false); setContent(c => ({ ...c, [key]: value })); }
    async function save(): Promise<Gift | null> { const job = saveQueue.current.catch(() => null).then(async () => { const g = giftRef.current; if (!g)
        return null; const state = current.current, fp = JSON.stringify(state); if (fp === savedFingerprint.current)
        return g; const parsed = contentSchema.safeParse(state.content); if (!parsed.success)
        throw new Error(parsed.error.issues[0].message); setSaving(true); setError(''); try {
        const next = await request<Gift>('/api/gifts/' + g.id, { method: 'PUT', body: JSON.stringify({ ...state, revision: revision.current }) });
        revision.current = next.revision;
        savedFingerprint.current = fp;
        giftRef.current = next;
        setGift(next);
        setSaved(fp === JSON.stringify(current.current));
        return next;
    }
    finally {
        setSaving(false);
    } }); saveQueue.current = job; return job; }
    useEffect(() => { if (!gift?.id || loading || busy || uploading || history || !contentSchema.safeParse(content).success || JSON.stringify(current.current) === savedFingerprint.current)
        return; setSaved(false); const t = setTimeout(() => save().catch(e => setError(e.message)), 1500); return () => clearTimeout(t); }, [content, template, plan, pin, revealAt, box, gift?.id, loading, busy, uploading,history]);
    async function upload(files: FileList | null) { if (!files || !gift)
        return; if (!contentSchema.safeParse(content).success) {
        setError('Add both names and a valid occasion date before uploading photos.');
        setStep(0);
        return;
    } if (content.photoIds.length + files.length > plans[plan].photos) {
        setError('Your ' + plan + ' package allows ' + plans[plan].photos + ' photos.');
        return;
    } setUploading(true); setError(''); try {
        for (const file of Array.from(files)) {
            const form = new FormData();
            form.set('file', await compressImage(file));
            const p = await request<{
                id: string;
                url: string;
            }>('/api/gifts/' + gift.id + '/photos', { method: 'POST', body: form });
            setUploaded(items => [...items, p]);
            update('photoIds', [...current.current.content.photoIds, p.id]);
            current.current.content = { ...current.current.content, photoIds: [...current.current.content.photoIds, p.id] };
        }
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setUploading(false);
    } }
    async function removePhoto(id: string) { if (!gift)
        return; setBusy(true); try {
        const next = content.photoIds.filter(p => p !== id);
        setContent(c => ({ ...c, photoIds: next }));
        current.current = { ...current.current, content: { ...current.current.content, photoIds: next } };
        if (content.photoIds.includes(id))
            await save();
        await request('/api/media/' + id, { method: 'DELETE' });
        setUploaded(items => items.filter(p => p.id !== id));
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function publish(mode: 'publish' | 'test' | 'unpublish') { setBusy(true); setError(''); try {
        const g = await save();
        if (!g)
            return;
        const next = await request<Gift>('/api/gifts/' + g.id + '/publish', { method: 'POST', body: JSON.stringify({ mode }) });
        revision.current = next.revision;
        setGift(next);
        giftRef.current = next;
        if (mode !== 'unpublish')
            setShare(true);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function voice(file: File | null) { if (!gift)
        return; setBusy(true); setError(''); try {
        const g = await save();
        if (!g)
            return;
        const form = new FormData();
        if (file)
            form.set('file', file);
        const next = await request<Gift>('/api/gifts/' + g.id + '/voice', { method: file ? 'POST' : 'DELETE', ...(file ? { body: form } : {}) });
        revision.current = next.revision;
        setGift(next);
        giftRef.current = next;
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function submitPayment() { if (!proof) {
        setError('Upload your transfer receipt.');
        return;
    } const result=lastSixSchema.safeParse(reference);if(!result.success){setError(result.error.issues[0].message);return;} setBusy(true); setError(''); try {
        const g = await save();
        if (!g)
            return;
        const form = new FormData();
        form.set('file', await compressImage(proof));
        form.set('reference', result.data);
        await request('/api/orders/' + g.id, { method: 'POST', body: form });
        setPaymentSent(true);
        setReference('');
        setProof(null);
        await workspace();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function refresh() { setBusy(true); try {
        if (gift) {
            await workspace();
            const g = await request<Gift>('/api/gifts/' + gift.id);
            revision.current = g.revision;
            setGift(g);
            giftRef.current = g;
        }
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    if (loading)
        return <><Header lang={lang} name={name}/><Loader label={t("Making a little space for your story\u2026")}/></>;
    if (!gift)
        return <><Header lang={lang} name={name}/><main className="workspace"><ErrorBox error={localizeError(error || languageError, lang)}/><a className="btn outline" href="/dashboard">{t("Back to my gifts")}</a></main></>;
    const occasion=content.occasion||'anniversary', words=occasionWords(occasion,lang), isAnniversary=occasion==='anniversary';
    const orders = ws?.orders.filter(o => o.giftId === gift.id) || [], pending = orders.find(o => o.status === 'pending'), approved = orders.find(o => o.status === 'approved' && o.id === gift.paidOrderId), active = gift.expiresAt && gift.expiresAt > Date.now();
    const checkoutPrice = approved && approved.plan === plan ? plans[plan].renewalPrice : plans[plan].price;
    return <><Header lang={lang} name={name}/><main lang={lang} className="editor-workspace" data-occasion={occasion}><div className="editor-heading"><div><a className="back-link" href="/dashboard"><ArrowLeft size={14}/>{t("My gifts")}</a><h1>{t("A little world,")}{' '}<em>{t("made by you.")}</em></h1><p>{t("Your story is the special part. We\u2019ll take care of the rest.")}</p></div><div className="button-row"><LanguageSwitch lang={lang} onChange={changeLanguage} disabled={languageSaving}/><button type="button" className="btn outline small" disabled={busy||uploading||saving} onClick={async()=>{setBusy(true);setError('');try{if(contentSchema.safeParse(current.current.content).success)await save();setHistory(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{lang==='my'?'Version များ':'History'}</button><a className="btn outline small" href={'/orders?gift=' + gift.id}>{t('Order status')}</a><button className="btn outline small" onClick={() => setPreview(true)}><Eye size={17}/>{t("Full preview")}</button>{['test', 'published'].includes(gift.status) && active && <button className="btn dark small" onClick={() => setShare(true)}><Share2 size={16}/>{t("Share")}</button>}</div></div><div className="editor-design-strip"><span>{words.name} · {lang==='my'?'ကိုယ်ပိုင် လက်ဆောင်ဖန်တီးမယ်':'Your personal keepsake'}</span><span>{lang==='my'?'အဆင့်':'Step'} {step+1} / 4</span></div><div className="editor-grid"><section className="editor-panel"><div className="editor-tabs">{[t("Your story"), t("Little moments"), (isAnniversary?t("Love letter"):(lang==='my'?'ဆုတောင်းစာ':'Your message')), t("Make it a gift")].map((s, i) => <button className={step === i ? 'current' : ''} aria-current={step===i?'step':undefined} key={s} onClick={() => setStep(i)}><span>{i + 1}</span><small>{s}</small></button>)}</div><div className="editor-form"><ErrorBox error={localizeError(error || languageError, lang)}/>{step === 0 && <><OccasionPicker lang={lang} value={occasion} disabled={busy || uploading} onApply={(id,sampleWords)=>{setContent(c=>applyOccasion(c,id,lang,sampleWords));setTemplate(occasionPreset(id).template);setBox(b=>presetBox(id,b));setSaved(false);setError('');}}/><div className="form-divider"/><div className="eyebrow">{t("CHAPTER ONE")}</div><h2>{t("It starts with")}{' '}<em>{(isAnniversary?t("the two of you."):(lang==='my'?'နေ့ထူးလေးပါ။':'a special day.'))}</em></h2><div className="field-row"><label>{t("Your name")}<input maxLength={60} value={content.yourName} onChange={e => update('yourName', e.target.value)} placeholder={t("e.g. Htet")}/></label><label>{(isAnniversary?t("Their name"):(lang==='my'?'လက်ခံသူ၏နာမည်':'Recipient name'))}<input maxLength={60} value={content.partnerName} onChange={e => update('partnerName', e.target.value)} placeholder={t("e.g. May")}/></label></div><label>{words.dateLabel}<input type="date" min="1900-01-01" max="2100-12-31" value={content.date} onChange={e => update('date', e.target.value)}/><small>{(isAnniversary?t("Dates and the together counter use Myanmar time."):(lang==='my'?'ဒီလက်ဆောင်ကျင်းပမည့်ရက်ကို ရွေးပါ။ မြန်မာအချိန်ဖြင့် တွက်ထားသည်။':'Choose this celebration’s date. Dates use Myanmar time.'))}{isAnniversary && content.date.endsWith('-02-29') && t(" February 29 is celebrated on March 1 in non-leap years.")}</small></label><label>{t("A little headline")}<input maxLength={100} value={content.title} onChange={e => update('title', e.target.value)} placeholder={t("Every day, I choose you.")}/></label><label className="field-label">{t("Choose your feeling")}</label><div className="theme-picker">{templates.map(item => <button key={item.id} className={template === item.id ? 'selected' : ''} onClick={() => { setTemplate(item.id); setSaved(false); }}><span style={{ background: item.color }}>{template === item.id && <Check size={16}/>}</span><strong>{t(item.name)}</strong></button>)}</div><div className="form-note"><Heart size={16}/><span>{t("You don\u2019t need perfect words. Just your words.")}</span></div></>}{step === 1 && <><div className="eyebrow">{t("THE LITTLE THINGS")}</div><h2>{t("Moments worth")}{' '}<em>{t("keeping.")}</em></h2><p className="muted">{t("Your first photo becomes the cover. JPG, PNG or WebP; we resize them for a lighter page.")}</p><label className={'upload-zone ' + (uploading ? 'disabled' : '')}><ImagePlus size={28}/><strong>{uploading ? t("Adding your memories\u2026") : t("Choose your favorite photos")}</strong><span>{content.photoIds.length} / {plans[plan].photos}{' '}{t("photos \u00B7 up to 20 MB each before resizing")}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || busy} onChange={e => { upload(e.target.files); e.target.value = ''; }}/></label><div className="photo-manager">{content.photoIds.map((id, i) => <div key={id}><img src={'/api/media/' + id} alt={t("Memory ") + (i + 1)}/>{i === 0 && <span className="cover-badge">{t("COVER")}</span>}<div><button className="icon-btn" title={t("Make cover")} disabled={busy} onClick={() => update('photoIds', [id, ...content.photoIds.filter(x => x !== id)])}><Star size={15}/></button><button className="icon-btn" title={t("Remove photo")} disabled={busy} onClick={() => removePhoto(id)}><Trash2 size={15}/></button></div></div>)}</div>{uploaded.some(p => !content.photoIds.includes(p.id)) && <div className="recovered-uploads"><p className="muted">{t("Saved uploads not yet in your story")}</p><div className="photo-manager">{uploaded.filter(p => !content.photoIds.includes(p.id)).map(p => <div key={p.id}><img src={p.url} alt={t("Recovered upload")}/><div><button className="icon-btn" aria-label={t("Add recovered photo")} disabled={busy || content.photoIds.length >= plans[plan].photos} onClick={() => update('photoIds', [...content.photoIds, p.id])}><Plus size={15}/></button><button className="icon-btn" aria-label={t("Remove unused upload")} disabled={busy} onClick={() => removePhoto(p.id)}><Trash2 size={15}/></button></div></div>)}</div></div>}<div className="form-divider"/><div className="section-inline"><h3>{t("Chapters of your story")}</h3><small>{content.timeline.length} / 5</small></div>{content.timeline.map((m, i) => <div className="memory-fields" key={i}><div className="section-inline"><span>{t("MEMORY")} {i + 1}</span><button className="icon-btn" aria-label={t("Remove memory ") + (i + 1)} onClick={() => update('timeline', content.timeline.filter((_, j) => j !== i))}><XIcon /></button></div><input aria-label={t("Memory date")} placeholder={t("e.g. October 2023")} maxLength={32} value={m.date} onChange={e => update('timeline', content.timeline.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}/><input aria-label={t("Memory title")} placeholder={t("A first hello. A favorite adventure.")} maxLength={100} value={m.title} onChange={e => update('timeline', content.timeline.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}/><textarea aria-label={t("Memory description")} rows={2} maxLength={500} placeholder={t("What made this moment special?")} value={m.note} onChange={e => update('timeline', content.timeline.map((x, j) => j === i ? { ...x, note: e.target.value } : x))}/></div>)}<button className="btn outline small" disabled={content.timeline.length >= 5} onClick={() => update('timeline', [...content.timeline, { date: '', title: '', note: '' }])}><Plus size={15}/>{t("Add a memory")}</button></>}{step === 2 && <><div className="eyebrow">{t("STRAIGHT FROM YOUR HEART")}</div><h2>{t("The words only")}{' '}<em>{t("you can say.")}</em></h2><p className="muted">{t("A letter for their eyes. English, Myanmar, or a little of both.")}</p><label>{(isAnniversary?t("Your love letter"):(lang==='my'?'သင့်ဆုတောင်းစာ':'Your celebration message'))}<textarea className="letter-input" rows={13} maxLength={8000} value={content.letter} onChange={e => update('letter', e.target.value)} placeholder={t("To my favorite person, \u2026")}/></label><div className="section-inline"><small>{content.letter.length}{t("/ 8,000 characters")}</small><button className="text-link" onClick={() => { if (content.letter.trim()) {
        setError('Your letter already has words in it. Clear it first to use the starting point.');
        return;
    } update('letter', occasionLetter(occasion, lang, content.partnerName, content.yourName)); }}>{t("Give me a starting point")}<Heart size={13}/></button></div><div className="form-divider"/><MusicPicker lang={lang} value={content.music} onChange={music=>update('music',music)}/><div className="form-divider"/><h3>{t("A little message in your voice")}</h3><p className="muted">{t("Upload a short voice message. MP3, WAV, M4A, OGG or WebM \u00B7 under 6 MB. Record it with your phone\u2019s voice recorder first.")}</p>{gift.voiceUrl && <div className="voice-editor"><audio controls preload="none" src={gift.voiceUrl}/><button className="btn outline small" disabled={busy} onClick={() => voice(null)}>{t("Remove voice message")}</button></div>}<label className="upload-zone small-upload"><Upload size={20}/><strong>{busy ? t("Saving\u2026") : gift.voiceId ? t("Replace voice message") : t("Add voice message")}</strong><input type="file" accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,.m4a" disabled={busy || saving} onChange={e => { const f = e.target.files?.[0]; if (f)
        voice(f); e.target.value = ''; }}/></label><div className="form-note"><Heart size={17}/><span>{t("A starting point is just a draft. Make it sound like you.")}</span></div></>}{step === 3 && <><div className="eyebrow">{t("THE FINISHING TOUCHES")}</div><h2>{t("Ready for")}{' '}<em>{t("your person?")}</em></h2><label className="field-label">{t("Choose your package")}</label><div className="package-picker">{(['basic', 'premium'] as const).map(p => <button key={p} className={plan === p ? 'selected' : ''} disabled={!!pending || !!(approved && active)} onClick={() => { setPlan(p); setSaved(false); }}><span>{p === 'basic' ? t("Basic") : t("Premium")} {plan === p && <Check size={15}/>}</span><strong>{mmk(plans[p].price)}</strong><small>{plans[p].photos}{t("photos \u00B7 1 month hosting")}</small></button>)}</div><BoxPicker lang={lang} box={box} names={[content.yourName, content.partnerName]} onChange={next => { setBox(next); setSaved(false); }}/><button className="btn outline small" onClick={() => setOpeningPreview(true)}>{t('Try opening your gift')}</button><div className="form-divider"/><div className="pin-section"><LockKeyhole size={21}/><div><h3>{t("A secret between you two")}</h3><p>{t("Gift links are unlisted. Add a PIN for extra privacy.")}</p><input inputMode="numeric" type="password" maxLength={12} value={pin ?? ''} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setSaved(false); }} placeholder={gift.hasPin && pin === undefined ? t("PIN is set \u00B7 enter to replace") : t("Optional PIN \u00B7 4\u201312 digits")} aria-label={t("Gift PIN")}/>{gift.hasPin && <button className="text-link" onClick={() => { setPin(''); setSaved(false); }}>{t("Remove existing PIN")}</button>}</div></div><label>{t("When should the surprise open?")}<input type="datetime-local" value={yangonInput(revealAt)} onChange={e => { setRevealAt(revealTimestamp(e.target.value)); setSaved(false); }}/><small>{t("Myanmar time (UTC+06:30). Leave empty to open immediately. Content stays hidden until this time.")}</small></label>{revealAt && <button className="text-link" onClick={() => setRevealAt(null)}>{t("Remove reveal schedule")}</button>}<div className="checkout"><h3><Heart size={18}/>{t("Make it official")}</h3>{!ws?.config.enabled ? <div className="notice">{t("Payment collection is not set up yet. You can keep creating and previewing for free.")}{ws?.setupNeeded && <a href="/owner">{t("Set up your owner workspace \u2197")}</a>}</div> : <>{approved && active ? <div className="success-box"><Check size={17}/>{t("Payment verified. Hosting ends")} {new Date(gift.expiresAt!).toLocaleDateString()}.</div> : null}{pending ? <div className="notice">{t("Your payment is waiting for merchant verification.")}<p>{t(pending.billingPeriod==='monthly'?'Monthly hosting · 1 calendar month':'Legacy annual hosting · 12 months')} · {mmk(pending.amount)}</p><button className="text-link" onClick={refresh} disabled={busy}>{t("Refresh payment status \u21BB")}</button></div> : (!approved || !active) && <><p>{t("Transfer")} <strong>{mmk(checkoutPrice)}</strong> {approved && approved.plan === plan ? t("to renew hosting for 1 calendar month") : t("for 1 calendar month of hosting")}{t("using the merchant details below.")}</p><div className="merchant-details">{ws.config.qrMime && <a href="/api/payment-qr" target="_blank" rel="noreferrer"><img src="/api/payment-qr" alt={t("Merchant payment QR")}/></a>}<div><span>{ws.config.method}</span><strong>{ws.config.merchantName}</strong><code>{ws.config.accountNumber}</code></div></div><p className="muted">{t(ws.config.instructions)}</p><ol><li>{t("Pay using the merchant account or QR above.")}</li><li>{t("Upload your transfer screenshot.")}</li><li>{t("Enter the last 6 digits of the transaction ID.")}</li><li>{t("Wait for the merchant to verify the amount and approve.")}</li></ol><label className="upload-zone small-upload"><Upload size={21}/><strong>{proof ? proof.name : t("Upload transfer screenshot")}</strong><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setProof(e.target.files?.[0] || null)}/></label><label>{t("Last 6 digits of transaction ID")}<input type="text" inputMode="numeric" pattern="[0-9]{6}" autoComplete="off" value={reference} maxLength={6} onChange={e => setReference(normalizeTransactionDigits(e.target.value).replace(/\D/g, ''))} placeholder="012345"/><small>{t("Exactly 6 digits. Keep any leading zeros.")}</small></label><button className="btn outline" disabled={busy || !/^[0-9]{6}$/.test(reference) || !proof} onClick={submitPayment}>{busy ? t("Submitting\u2026") : t("Submit payment for review")}</button></>}</>}{paymentSent && <div className="success-box">{t("Receipt received. Your gift stays unpublished until the transfer is verified.")}</div>}{orders.filter(o => o.status === 'rejected' || o.status === 'refunded').map(o => <div className="notice" key={o.id}>{o.status === 'rejected' ? t("Payment rejected") : t("Refund recorded")}: {o.note}</div>)}<div className="publish-actions">{ws?.config.enabled && approved && active && <button className="btn primary" disabled={busy || uploading} onClick={() => publish('publish')}><Send size={17}/>{t("Publish gift")}</button>}{ws?.isAdmin && <button className="btn dark" disabled={busy || uploading} onClick={() => publish('test')}><Send size={17}/>{t("Publish a private test gift")}</button>}{['test', 'published'].includes(gift.status) && <button className="btn outline small" disabled={busy} onClick={() => publish('unpublish')}>{t("Unpublish")}</button>}</div><small>{t("Owner test gifts have 30-day hosting and collect no payment. This site is private for testing.")}</small></div></>}</div><div className="editor-bottom"><span className="save-state">{saving ? <><LoaderCircle size={15} className="spin"/>{t("Saving\u2026")}</> : saved ? <><Check size={15}/>{t("Saved")}</> : <>{t("Add your details, then save")}</>}</span><div><button className="icon-btn" title={t("Save changes")} disabled={saving || uploading} onClick={() => save().catch(e => setError(e.message))}><Save size={19}/></button>{step > 0 && <button className="btn outline small" onClick={() => setStep(step - 1)}><ArrowLeft size={15}/>{t("Back")}</button>}{step < 3 && <button className="btn primary small" onClick={() => { const r = contentSchema.safeParse(content); if (!r.success) {
        setError(r.error.issues[0].message);
        return;
    } setError(''); setStep(step + 1); }}>{t("Continue")}<ArrowRight size={15}/></button>}</div></div></section><aside className="live-preview"><div className="preview-heading"><span><span className="live-dot"/>{t("LIVE PREVIEW")}</span><span>{t("Made with your love \u2661")}</span></div><div className="phone-shell"><div className="phone-notch"/><div className="phone-screen"><GiftView content={content} template={template} lang={lang} photoUrls={content.photoIds.map(id => '/api/media/' + id)} voiceUrl={gift.voiceUrl} compact/></div></div><p>{t("Changes appear here as you make them.")}<br />{t("Scroll inside to see your whole story.")}</p></aside></div></main>{history&&<VersionHistory giftId={gift.id} lang={lang} beforeRestore={async()=>contentSchema.safeParse(current.current.content).success?save():giftRef.current} onRestore={fill} onClose={()=>setHistory(false)}/>} {preview && <Modal lang={lang} title={t("Your little world \u00B7 preview")} onClose={() => setPreview(false)} wide><GiftView content={content} template={template} lang={lang} photoUrls={content.photoIds.map(id => '/api/media/' + id)} voiceUrl={gift.voiceUrl}/></Modal>}{openingPreview && <Modal title={t('Gift opening preview')} lang={lang} onClose={() => setOpeningPreview(false)} wide><GiftReveal lang={lang} occasion={content.occasion} recipient={content.partnerName} box={{ ...box, initials: box.initials || coupleInitials(content.yourName, content.partnerName) }}><GiftView lang={lang} content={content} template={template} photoUrls={content.photoIds.map(id => '/api/media/' + id)} voiceUrl={gift.voiceUrl}/></GiftReveal></Modal>}{share && <ShareModal lang={lang} token={gift.token} isTest={gift.status==='test'} onClose={() => setShare(false)}/>}<Footer lang={lang}/></>;
}
function XIcon() { return <span style={{ fontSize: 20 }}>×</span>; }
