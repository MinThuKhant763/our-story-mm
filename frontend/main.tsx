import {Suspense,lazy,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../app/globals.css';
import {isOccasionId,occasionPreset} from '@/lib/occasions';
import {giftStyles} from '@/lib/box';
import {isTemplateId} from '@/lib/gifts';
import {Loader,ErrorBox} from '@/components/ourstory/common';
const Home=lazy(()=>import('@/components/ourstory/home').then(m=>({default:m.Home})));
const Dashboard=lazy(()=>import('@/components/ourstory/dashboard').then(m=>({default:m.Dashboard})));
const Editor=lazy(()=>import('@/components/ourstory/editor').then(m=>({default:m.Editor})));
const Account=lazy(()=>import('@/components/ourstory/account').then(m=>({default:m.Account})));
const Owner=lazy(()=>import('@/components/ourstory/owner').then(m=>({default:m.Owner})));
const Orders=lazy(()=>import('@/components/ourstory/orders').then(m=>({default:m.Orders})));
const Replies=lazy(()=>import('@/components/ourstory/replies').then(m=>({default:m.Replies})));
const Viewer=lazy(()=>import('@/components/ourstory/viewer').then(m=>({default:m.Viewer})));
const Demo=lazy(()=>import('@/components/ourstory/viewer').then(m=>({default:m.Demo})));
const AuthForm=lazy(()=>import('@/components/ourstory/auth-form').then(m=>({default:m.AuthForm})));
const Privacy=lazy(()=>import('./privacy'));
const Terms=lazy(()=>import('./terms'));
type AccountData={name:string;email:string;profile:{language:'my'|'en'}};
function safeReturn(value:string){try{const u=new URL(value,location.origin);return value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')&&u.origin===location.origin&&!['/login','/register','/logout'].includes(u.pathname)?u.pathname+u.search:'/dashboard';}catch{return '/dashboard';}}
function App(){
  const path=location.pathname.replace(/\/$/,'')||'/',q=new URLSearchParams(location.search);
  const protectedRoute=['/dashboard','/account','/owner','/orders','/replies','/create'].includes(path)||path.startsWith('/edit/');
  const [account,setAccount]=useState<AccountData|null>(null),[loaded,setLoaded]=useState(!protectedRoute&&path!=='/'),[error,setError]=useState('');
  useEffect(()=>{if(!protectedRoute&&path!=='/')return;let active=true;fetch('/api/account',{cache:'no-store'}).then(async r=>{
    if(r.status===401){if(protectedRoute)location.replace('/login?return_to='+encodeURIComponent(path+location.search));return null;}
    if(!r.ok)throw Error('Account service is unavailable. Please retry.');return r.json() as Promise<AccountData>;
  }).then(data=>{if(active){setAccount(data);setLoaded(true);}}).catch(e=>{if(active){setError(e.message);setLoaded(true);}});return()=>{active=false;};},[path,protectedRoute]);
  if(!loaded)return <Loader/>;
  if(error&&protectedRoute)return <main className="legal-page"><ErrorBox error={error}/><button className="btn primary" onClick={()=>location.reload()}>Retry</button></main>;
  const name=account?.name||'',lang=account?.profile.language||'my';
  if(protectedRoute&&!account)return <Loader/>;
  const occasionValue=q.get('occasion')||'anniversary',occasion=isOccasionId(occasionValue)?occasionValue:'anniversary',preset=occasionPreset(occasion);
  const t=q.get('template'),template=t&&isTemplateId(t)?t:preset.template;
  const giftStyle=giftStyles.find(s=>s.id===q.get('gift'))?.id||preset.box.style||'box';
  const segments=path.split('/');
  if(path==='/')return <Home name={account?.name}/>;
  if(path==='/dashboard')return <Dashboard name={name} lang={lang}/>;
  if(path==='/account')return <Account name={name} signOut="/logout"/>;
  if(path==='/owner')return <Owner name={name}/>;
  if(path==='/orders')return <Orders name={name} initialLanguage={lang} giftId={q.get('gift')||undefined}/>;
  if(path==='/replies')return <Replies name={name} lang={lang}/>;
  if(path==='/create')return <Editor name={name} initialLanguage={lang} initialOccasion={occasion} initialTemplate={template} initialPlan={q.get('plan')==='premium'?'premium':'basic'} initialGiftStyle={giftStyle}/>;
  if(segments[1]==='edit'&&segments.length===3)return <Editor name={name} initialLanguage={lang} giftId={segments[2]} initialStep={q.get('step')==='3'?3:0}/>;
  if(segments[1]==='gift'&&segments.length===3)return <Viewer token={segments[2]}/>;
  if(segments[1]==='demo'&&isTemplateId(segments[2])&&segments.length===3)return <Demo template={segments[2]} giftStyle={giftStyle} occasion={occasion} initialLanguage={q.get('lang')==='my'?'my':'en'}/>;
  if(['/login','/register','/forgot','/verify','/reset','/logout'].includes(path))return <AuthForm mode={path==='/logout'?'logout':'login'} errorCode={q.get('error')||''} returnTo={safeReturn(q.get('return_to')||'/dashboard')}/>;
  if(path==='/privacy')return <Privacy/>;
  if(path==='/terms')return <Terms/>;
  return <main className="legal-page"><h1>Page not found</h1><a className="btn primary" href="/">Back to OurStory</a></main>;
}
createRoot(document.getElementById('root')!).render(<Suspense fallback={<Loader/>}><App/></Suspense>);
