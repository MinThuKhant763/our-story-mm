import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Heart, ArrowUpRight, X, Menu, Check, Copy, Download, LoaderCircle } from 'lucide-react';
import { translator, localizeError, type Language } from '@/lib/i18n';
import QRCode from 'qrcode';
import {GiftCard} from './gift-card';
export async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> { const r = await fetch(url, { ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers } }); if (!r.headers.get('Content-Type')?.includes('application/json'))
    throw new Error('The server returned an unexpected response (HTTP '+r.status+'). Check the Terminal error, restart the server, and try again.'); const data = await r.json() as T & {
    error?: string;
}; if (!r.ok)
    throw new Error(data.error || 'Something went wrong. Please try again.'); return data; }
export function Header({ name, active, lang = 'en' }: {
    name?: string;
    active?: string;
    lang?: Language;
}) { const t = translator(lang); const [open, setOpen] = useState(false); return <header lang={lang} className="site-header"><a className="brand" href="/"><span className="brand-icon"><Heart size={19} strokeWidth={1.7}/></span>{t("ourstory")}<span className="brand-dot">.</span></a><nav className={open ? 'nav open' : 'nav'}><a className={active === 'templates' ? 'active' : ''} href="/#templates">{t("Templates")}</a><a href="/replies">{lang==='my'?'ပြန်စာများ':'Replies'}</a><a href="/#how-it-works">{t("How it works")}</a><a href="/#pricing">{t("Pricing")}</a><a className={active === 'orders' ? 'active' : ''} href="/orders">{t('Order status')}</a><a className={active === 'gifts' ? 'active' : ''} href="/dashboard">{t("My gifts")}</a></nav><div className="nav-actions"><a className="account-link" href="/account" aria-label={t("Your account")}>{name ? name.slice(0, 1).toUpperCase() : t("Account")}</a><a className="btn dark small" href="/create" aria-label={t("Create a gift")}>{t("Create")}<ArrowUpRight size={16}/></a><button className="menu-toggle icon-btn" onClick={() => setOpen(!open)} aria-label={t("Toggle menu")}><Menu size={22}/></button></div></header>; }
export function Footer({ lang = 'en' }: {
    lang?: Language;
} = {}) { const t = translator(lang); return <footer lang={lang} className="footer"><a className="brand" href="/"><Heart size={19}/>{t("ourstory.")}</a><span>{t("A little corner of the internet, just for your love.")}</span><div><a href="/#faq">{t("FAQs")}</a><a href="/owner">{t("Workspace")}</a><a href="/#privacy">{t("Privacy & hosting")}</a></div><small>{t("Made with love, for Myanmar.")}<span>© {new Date().getFullYear()} {t("OurStory")}</span></small></footer>; }
export function IconHeart({ className = '' }: {
    className?: string;
}) { return <Heart className={className} size={18} strokeWidth={1.5}/>; }
export function ErrorBox({ error }: {
    error: string;
}) { return error ? <div className="error-box" role="alert">{error}</div> : null; }
export function Loader({ label = 'A little moment…' }: {
    label?: string;
}) { return <div className="loading"><LoaderCircle className="spin" size={24}/><p>{label}</p></div>; }
export function Modal({ title, children, onClose, wide = false, lang = 'en' }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
    lang?: Language;
}) { const t = translator(lang); const ref = useRef<HTMLDialogElement>(null); useEffect(() => { ref.current?.showModal(); }, []); return <dialog ref={ref} className={'modal ' + (wide ? 'wide' : '')} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget)
    onClose(); }}><div className="modal-top"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label={t("Close dialog")}><X size={21}/></button></div>{children}</dialog>; }
export function ShareModal({ token, onClose, isTest = false, lang = 'en' }: {
    token: string;
    onClose: () => void;
    isTest?: boolean;
    lang?: Language;
}) { const t = translator(lang); const [svg, setSvg] = useState(''), [copied, setCopied] = useState(false), [error, setError] = useState(''); const url = typeof window !== 'undefined' ? window.location.origin + '/gift/' + token : ''; useEffect(() => { QRCode.toString(url, { type: 'svg', margin: 3, width: 240, errorCorrectionLevel: 'M' }).then(setSvg).catch(() => setError('QR generation failed. You can still copy the link.')); }, [url]); return <Modal lang={lang} title={t("A gift ready to be shared")} onClose={onClose}><div className="share-body"><span className="round-icon"><Heart size={24}/></span><p>{t("One link. All your favorite moments.")}</p>{isTest && <div className="notice">{lang==='my'?'အစမ်းလက်ဆောင် သက်တမ်း 30 ရက်။ Link ရှိသူသည် PIN နှင့် reveal time သတ်မှတ်ချက်အတိုင်း ဖွင့်နိုင်မယ်။':'Test gift: 30-day hosting. Anyone holding an active link can open it, subject to its PIN and reveal time.'}</div>}<div className="qr-box" dangerouslySetInnerHTML={{ __html: svg }}/><input readOnly value={url} aria-label={t("Gift link")} onFocus={e => e.target.select()}/><div className="button-row"><button className="btn primary" onClick={async () => { try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
}
catch {
    setError('Select the link above and copy it manually.');
} }}>{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? t("Copied!") : t("Copy link")}</button><button className="btn outline" disabled={!svg} onClick={() => downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'ourstory-gift-qr.svg')}><Download size={17}/>{t("Download QR")}</button></div><a href={url} target="_blank" rel="noreferrer" className="text-link">{t("Open gift page")}<ArrowUpRight size={15}/></a><GiftCard url={url} lang={lang}/><ErrorBox error={localizeError(error, lang)}/></div></Modal>; }
export function downloadBlob(blob: Blob, name: string) { const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function compressImage(file: File) { if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPG, PNG or WebP image.'); if (file.size > 20 * 1024 * 1024)
    throw new Error('Please choose an image under 20 MB.'); const image = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fcfaf5'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); image.close(); const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not resize this image.')), 'image/jpeg', .84)); return new File([blob], 'photo.jpg', { type: 'image/jpeg' }); }
